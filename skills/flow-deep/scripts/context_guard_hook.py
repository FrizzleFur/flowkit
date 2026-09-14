#!/usr/bin/env python3
"""context_guard_hook.py — flow-deep Context Guard 机械化（UserPromptSubmit hook）

背景（2026-09-14 诊断）：原设计靠模型在 Stage 边界自觉运行 check_context.py，
属「自觉级约束」——本会话实测全程未触发（无 hook 接线 + 执行者遗忘）。
本 hook 把检测挂到每次用户输入上，超阈值时注入警告文本把模型拉回纪律，
从自觉级升机械级（REC-10 哲学：人类品味捕获一次，机械处处强制）。

输入（stdin JSON）：Claude Code UserPromptSubmit 提供 session_id/transcript_path/cwd/prompt。
输出：超阈值时 stdout 输出 hookSpecificOutput.additionalContext（注入模型上下文）；
未超阈值或任何异常一律静默 exit 0——hook 绝不阻塞用户输入。

窗口校准：check_context.py 的 needs_calibration=true 时（窗口来自模型名推断），
警告文本附带校准指令（以状态栏 Context 为准 → export FLOWKIT_CONTEXT_WINDOW）。
去抖：状态文件记录上次警告百分比，涨幅 <5pp 不重复打扰。
环境变量：FLOWKIT_CONTEXT_GUARD_THRESHOLD（默认 70）。
"""
import json
import os
import subprocess
import sys
import tempfile

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "check_context.py")
TIER_WARN = 85  # 第二档：任意时刻告警措辞


def main():
    raw = sys.stdin.read()
    if not raw.strip():
        return
    stdin_data = json.loads(raw)
    transcript = stdin_data.get("transcript_path") or ""
    if not transcript or not os.path.exists(transcript):
        return

    threshold = int(os.environ.get("FLOWKIT_CONTEXT_GUARD_THRESHOLD", "70") or 70)

    proc = subprocess.run(
        [sys.executable, SCRIPT, "--json", "--session", transcript,
         "--cwd", stdin_data.get("cwd") or os.getcwd(), "--threshold", str(threshold)],
        capture_output=True, text=True, timeout=10,
    )
    if proc.returncode not in (0, 1):
        return  # exit 2 = 检测失败，静默降级
    data = json.loads(proc.stdout)
    pct = float(data["context_pct"])
    if not data.get("exceeded"):
        return

    # 去抖：同会话内涨幅 <5pp 不重复警告
    state_file = os.path.join(
        tempfile.gettempdir(), f"flowkit-guard-{data['session']}.json")
    try:
        with open(state_file) as f:
            last = json.load(f).get("last_pct", -100)
    except Exception:
        last = -100
    if pct - last < 5:
        return
    try:
        with open(state_file, "w") as f:
            json.dump({"last_pct": pct}, f)
    except Exception:
        pass

    calib = ""
    if data.get("needs_calibration"):
        calib = (
            f"注意：脚本窗口来自推断（{data['window_source']}），百分比可能失真（实测案例：脚本报 41.7% 而状态栏 85%）。"
            "以状态栏 Context 行为准；若差异 >15pp，立即执行 "
            f"export FLOWKIT_CONTEXT_WINDOW={int(data['tokens_used'] * 100 / max(pct, 1))} 校准后再判。"
        )
    tier = "硬警告" if pct >= TIER_WARN else "预警"
    action = ("建议立即 /compact 或走 HANDOFF 交接" if pct >= TIER_WARN
              else "在下一个确认点提供「保存并继续 / 保存并交接 / 跳过」三选")
    msg = (f"[Context Guard {tier}] 会话 context 约 {pct}%（阈值 {threshold}%）。{action}。"
           f"流程见 flow-deep SKILL.md 上下文管理节与 context-management.md Context Guard。{calib}")

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": msg,
        }
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass  # 任何异常静默退出，绝不阻塞用户输入
    sys.exit(0)
