#!/usr/bin/env python3
"""check_context.py — flow-deep 上下文容量检测（只读，无副作用）

原理：Claude Code 的 transcript（~/.claude/projects/<cwd-key>/<session>.jsonl）
中每条 assistant 消息自带 usage 字段（input + cache_read + cache_creation + output）。
取 mtime 最新的 transcript 的最后一条 usage，四项之和即当前 context 占用 token 数，
除以窗口大小得百分比。这是 Claude Code 自身汇报的准确值，非估算。

用法：
    python3 check_context.py                     # 默认 200K 窗口，阈值 70
    python3 check_context.py --window 1000000    # 1M 窗口模型
    python3 check_context.py --json              # JSON 输出

输出（单行 key=value，供 skill 解析）：
    context_pct=33.2 tokens_used=65442 window=200000 threshold=70 exceeded=false session=<文件名> mtime=<时间> first_msg=<本会话首条用户消息摘要>

已知限制：并行多会话（同 cwd 开多个 Claude Code 窗口）时，mtime 最新的文件
未必是当前会话。输出 first_msg 摘要供人工核对；发现不符时可用
--session <文件名> 显式指定。
"""

import argparse
import glob
import json
import os
import sys
import time

PROJECTS_DIR = os.path.expanduser("~/.claude/projects")
TAIL_BYTES = 512 * 1024  # 末尾 512KB 内必有最后一条 assistant usage


def cwd_to_project_key(cwd: str) -> str:
    """Claude Code 的项目目录命名规则：路径中 / 和 . 都替换为 -。"""
    return cwd.replace("/", "-").replace(".", "-")


def find_latest_transcript(project_key: str, explicit: str):
    """定位当前会话 transcript：显式指定 > 精确项目目录 > 前缀回退。

    返回 (path, err, fallback)：err 非 None 为致命错误；fallback=True 表示走了
    前缀回退（非精确命中），结果需核对 first_msg。
    精确 key 命中时禁用前缀回退（避免祖先/子孙目录的会话混入 mtime 竞争）；
    仅当精确目录无 transcript 时才回退：transcript 按会话启动时的 cwd 归档，
    但 skill 执行时 Bash 可能 cd 到了子目录（或会话开在父目录）。
    """
    if explicit:
        if os.path.isabs(explicit):
            if os.path.exists(explicit):
                return explicit, None, False
        else:
            # 兼容两种形式：项目目录/文件名，或纯文件名（脚本自身输出的 session= 值）
            direct = os.path.join(PROJECTS_DIR, explicit)
            if os.path.exists(direct):
                return direct, None, False
            found = glob.glob(os.path.join(PROJECTS_DIR, "*", os.path.basename(explicit)))
            if len(found) == 1:
                return found[0], None, False
            if len(found) > 1:
                return None, f"多个项目目录存在同名 transcript，请用绝对路径: {sorted(found)}", False
        return None, f"指定的 transcript 不存在: {explicit}", False

    if not os.path.isdir(PROJECTS_DIR):
        return None, f"projects 目录不存在: {PROJECTS_DIR}", False

    exact = os.path.join(PROJECTS_DIR, project_key)
    exact_files = glob.glob(os.path.join(exact, "*.jsonl")) if os.path.isdir(exact) else []
    if exact_files:
        return max(exact_files, key=os.path.getmtime), None, False

    candidates = []
    # 回退匹配的贴近度：目录名与 key 的公共前缀越长 = 会话目录离 cwd 越近，越可能是同一工作区。
    # 教训（2026-09-09 evals eval-3 复现）：沙箱/深层 cwd 场景下，仅按 mtime 取最新会
    # 捞到祖先链上不相干会话（误报 95%）。先按贴近度分组取最贴组，组内再比 mtime，
    # 并置 fallback=true 提示调用方核对 first_msg（不符时用 --session 显式指定）。
    best_prefix_len = -1
    for name in os.listdir(PROJECTS_DIR):
        # 目录名是 key 的前缀（会话开在父目录）或 key 是目录名的前缀（cd 进了子目录）
        if project_key.startswith(name) or name.startswith(project_key):
            prefix_len = len(os.path.commonprefix([name, project_key]))
            if prefix_len > best_prefix_len:
                best_prefix_len = prefix_len
                candidates = []
            if prefix_len == best_prefix_len:
                candidates.extend(glob.glob(os.path.join(PROJECTS_DIR, name, "*.jsonl")))
    if not candidates:
        return None, f"未找到匹配的项目目录（key={project_key}），可用目录见 ls {PROJECTS_DIR}", False
    return max(candidates, key=os.path.getmtime), None, True


def read_last_usage(transcript_path: str):
    """从文件尾部倒序块读，返回 (最后一条 usage 合计 tokens, 首条用户消息摘要, model 名)。

    尾部出现超长非 assistant 行（大 tool_result）时首轮窗口可能不含 usage，
    加倍窗口重读一次再放弃。isSidechain 记录（子代理）跳过，只取主链。
    model 一并返回（如 "glm-5.3[1m]"），供窗口自适应推断。
    """
    file_size = os.path.getsize(transcript_path)
    with open(transcript_path, "rb") as f:
        tokens_used = None
        model = None
        for read_size in (min(TAIL_BYTES, file_size), min(TAIL_BYTES * 4, file_size)):
            f.seek(file_size - read_size)
            lines = f.read().decode("utf-8", errors="replace").splitlines()
            for line in reversed(lines):
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue  # 块读取可能截断首行
                if rec.get("type") != "assistant" or rec.get("isSidechain"):
                    continue
                usage = rec.get("message", {}).get("usage") or {}
                input_t = usage.get("input_tokens") or 0
                cache_r = usage.get("cache_read_input_tokens") or 0
                cache_c = usage.get("cache_creation_input_tokens") or 0
                output_t = usage.get("output_tokens") or 0
                if input_t + cache_r + cache_c > 0:
                    tokens_used = input_t + cache_r + cache_c + output_t
                    model = rec.get("message", {}).get("model") or model
                    break
            if tokens_used is not None:
                break
        if tokens_used is None:
            return None, None, None

        # 顺序找首条真实用户消息摘要（供多会话人工核对）
        f.seek(0)
        first_msg = None
        for line in f:
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get("type") != "user":
                continue
            content = rec.get("message", {}).get("content")
            if isinstance(content, list):
                text = "".join(
                    c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"
                )
            else:
                text = content if isinstance(content, str) else ""
            text = text.strip()
            if not text:
                continue
            if text.startswith("<"):
                # 系统包装（command-message / teammate-message 等）：剥离外层标签取内部
                # 真实任务文本——subagent 会话首条 user 即 teammate 包装的任务书，
                # 整条跳过会导致「未找到」进而被误判为 session 选错（2026-09-09 eval-3 教训）。
                inner = text.split(">", 1)[1].strip() if ">" in text else ""
                if not inner or inner.startswith("<"):
                    continue
                text = inner
            first_msg = text[:80].replace("\n", " ")
            break
    return tokens_used, first_msg, model


def main():
    parser = argparse.ArgumentParser(description="检测当前会话 context 占用百分比")
    parser.add_argument("--window", type=int, default=200000, help="context 窗口大小，默认 200000")
    parser.add_argument("--threshold", type=int, default=70, help="告警阈值百分比，默认 70")
    parser.add_argument("--session", type=str, default=None, help="显式指定 transcript 文件（并行多会话时）")
    parser.add_argument("--cwd", type=str, default=os.getcwd(), help="项目 cwd，默认当前目录")
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    args = parser.parse_args()

    if args.window <= 0:
        parser.error("--window 必须为正整数")
    if args.threshold < 0:
        parser.error("--threshold 不能为负")

    transcript, err, fallback = find_latest_transcript(cwd_to_project_key(args.cwd), args.session)
    if err:
        print(json.dumps({"error": err}) if args.json else f"error: {err}", file=sys.stderr)
        sys.exit(2)

    tokens_used, first_msg, model = read_last_usage(transcript)
    if tokens_used is None:
        msg = f"transcript 中未找到 usage 记录: {transcript}"
        print(json.dumps({"error": msg}) if args.json else f"error: {msg}", file=sys.stderr)
        sys.exit(2)

    # 窗口口径（2026-09-09 修复，evals eval-1/eval-3 复现误报）：transcript 的
    # message.model 是裸名（无窗口标记，实测证实），但 Claude Code 会把 settings.json
    # env 段注入每个 Bash 子进程——ANTHROPIC_MODEL（如 "glm-5.3[1m]"）天然携带窗口
    # 标记，随用户切模型自动适应。优先级：显式传参 > FLOWKIT_CONTEXT_WINDOW >
    # ANTHROPIC_MODEL 推断 > 200K 默认（来源始终输出，诚实降级不静默猜）。
    window_source = "explicit"
    if args.window == 200000:
        env_win = os.environ.get("FLOWKIT_CONTEXT_WINDOW")
        model_env = (os.environ.get("ANTHROPIC_MODEL")
                     or os.environ.get("ANTHROPIC_DEFAULT_OPUS_MODEL") or "")
        if env_win and env_win.isdigit() and int(env_win) > 0:
            args.window = int(env_win)
            window_source = "env"
        elif "[1m]" in model_env.lower() or "[1M]" in model_env:
            args.window = 1000000
            window_source = "inferred:ANTHROPIC_MODEL"
        else:
            window_source = "default"

    pct = tokens_used / args.window * 100
    exceeded = pct > args.threshold
    result = {
        "context_pct": round(pct, 1),
        "tokens_used": tokens_used,
        "window": args.window,
        "window_source": window_source,
        "threshold": args.threshold,
        "exceeded": exceeded,
        "session": os.path.basename(transcript),
        "fallback": fallback,
        "mtime": time.strftime("%Y-%m-%d %H:%M", time.localtime(os.path.getmtime(transcript))),
        "first_msg": first_msg or "(未找到)",
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(
            f"context_pct={result['context_pct']} tokens_used={tokens_used} "
            f"window={args.window}({window_source}) threshold={args.threshold} exceeded={str(exceeded).lower()} "
            f"session={result['session']} fallback={str(fallback).lower()} mtime={result['mtime']} first_msg={result['first_msg']}"
        )
    sys.exit(0 if not exceeded else 1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        # 契约：任何未预期异常 = 检测失败（exit 2，静默降级），绝不以 exit 1 冒充超阈值
        print(f"error: 检测异常: {e}", file=sys.stderr)
        sys.exit(2)
