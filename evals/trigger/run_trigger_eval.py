#!/usr/bin/env python3
"""T-302 trigger eval runner v2 —— 技能触发竞争可测化

机制（借鉴 skill-creator run_eval.py，2026-09-09 实测教训后重写）：
1. 竞技场注入：把被测技能集的 name+description 写成临时项目 .claude/commands/*.md，
   模拟 available_skills 竞争环境（可控、无本机 150+ 技能噪音）
2. stream-json + --include-partial-messages：从流事件 content_block_start 提前检测
   tool_use，检测到任一目标技能调用即 kill 进程（v1 全量会话 5min/条的教训）
3. env 去 CLAUDECODE（嵌套守卫只防终端交互冲突，子进程安全）
4. auto-skill 型常驻依赖不在注入集，无需剔除

用法：python3 run_trigger_eval.py [eval-set.json] [--runs 2] [--concurrency 4] [--timeout 45]
"""
import json
import os
import re
import select
import subprocess
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ARENA = Path("/tmp/trigger-eval-arena")
SKILL_MD_FIELDS = re.compile(r"^description:\s*(.+?)(?=^\w+:|\Z)", re.M | re.S)


def load_descriptions(skill_names: list[str]) -> dict[str, str]:
    """从 flowkit skills/*/SKILL.md 抽 name+description（触发判定的真实输入）。"""
    root = Path(__file__).resolve().parent.parent.parent / "skills"
    out = {}
    for name in skill_names:
        text = (root / name / "SKILL.md").read_text(encoding="utf-8")
        block = text.split("---", 2)[1]
        d = SKILL_MD_FIELDS.search(block)
        desc = d.group(1).strip() if d else ""
        out[name] = desc
    return out


def inject_commands(descs: dict[str, str]) -> None:
    """竞技场注入 v2：项目级 .claude/skills/<name>/SKILL.md（真实 skill 机制）。

    v1 用 .claude/commands/*.md 注入——command 是「用户显式敲的斜杠命令」心智，
    模型不倾向主动调用；skill 才是「模型可主动 consult」的机制。2026-09-09 复测
    6/8 真漏触发的疑似主因即此机制错位，本修正对齐真实触发环境。
    """
    skills_dir = ARENA / ".claude" / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)
    for old in skills_dir.iterdir():
        import shutil
        shutil.rmtree(old) if old.is_dir() else old.unlink()
    # 清理 v1 残留的 commands 目录（防双机制并存）
    cmd_dir = ARENA / ".claude" / "commands"
    if cmd_dir.is_dir():
        import shutil
        shutil.rmtree(cmd_dir)
    for name, desc in descs.items():
        d = skills_dir / name
        d.mkdir()
        (d / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: |\n  " + "\n  ".join(desc.split("\n"))
            + "\n---\n\n（触发评测骨架——触发判定只读 metadata）\n",
            encoding="utf-8")


def run_once(qid: int, run_no: int, query: str, watch: set[str], timeout: int) -> dict:
    uid = uuid.uuid4().hex[:6]
    cmd = ["claude", "-p", query, "--output-format", "stream-json",
           "--verbose", "--include-partial-messages"]
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    # effort 降级：触发判定不需要 max 思考（实测 max 下 75s 仍全在 thinking，
    # low 下 ~77s 出首个 Skill 决策；口径注记于结果 JSON）
    env["CLAUDE_CODE_EFFORT_LEVEL"] = "low"
    t0 = time.time()
    # 计时器锚点：检测到任何 Skill 调用（含 auto-skill 先行）即重置——决策链在推进
    # 的证据，继续等下一个决策（2026-09-09 全量 8 miss 全部顶格 150s 的截断教训：
    # auto-skill 77s + 目标技能第二个决策常落在 150-250s 区间）
    anchor = t0
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            cwd=str(ARENA), env=env)
    triggered, any_skill_seen, buf = [], False, ""
    try:
        while time.time() - anchor < timeout:
            if proc.poll() is not None:
                rest = proc.stdout.read()
                if rest:
                    buf += rest.decode("utf-8", errors="replace")
                break
            ready, _, _ = select.select([proc.stdout], [], [], 1.0)
            if not ready:
                continue
            chunk = os.read(proc.stdout.fileno(), 8192)
            if not chunk:
                break
            buf += chunk.decode("utf-8", errors="replace")
            for m in re.finditer(r'"skill":\s*"([a-z0-9-]+)"', buf):
                s = m.group(1)
                if s in watch and s not in triggered:
                    triggered.append(s)
            if re.search(r'"skill":\s*"', buf) and not any_skill_seen:
                any_skill_seen = True
                anchor = time.time()  # 首个 Skill 决策出现，计时器重置
            if triggered:  # 早停：首个目标技能决策已捕捉
                break
    finally:
        proc.kill()
        proc.wait()
    return {"qid": qid, "run": run_no, "skills": triggered, "any_skill_seen": any_skill_seen,
            "secs": round(time.time() - t0, 1), "error": None}


def main() -> int:
    argv = sys.argv[1:]
    runs = int(argv[argv.index("--runs") + 1]) if "--runs" in argv else 2
    conc = int(argv[argv.index("--concurrency") + 1]) if "--concurrency" in argv else 4
    tmo = int(argv[argv.index("--timeout") + 1]) if "--timeout" in argv else 150
    pos = [a for a in argv if not a.startswith("--") and not a.lstrip("-").isdigit()]
    set_path = Path(pos[0] if pos else "eval-set-v1.json")
    data = json.loads(set_path.read_text())
    queries = data["queries"]

    watch_names = sorted({s for q in queries for s in (q["expect"] + q["reject"])})
    inject_commands(load_descriptions(watch_names))
    print(f"竞技场: {ARENA}（注入 {len(watch_names)} 技能: {watch_names}）")

    jobs = [(q["id"], r, q["query"]) for q in queries for r in range(1, runs + 1)]
    print(f"跑测 {len(queries)} 条 × {runs} 次 = {len(jobs)} 会话（并发 {conc}，超时 {tmo}s，早停）...")
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=conc) as ex:
        results = list(ex.map(lambda j: run_once(*j, watch=set(watch_names), timeout=tmo), jobs))
    print(f"完成，耗时 {round(time.time()-t0)}s\n")

    by_q: dict[int, list] = {}
    for r in results:
        by_q.setdefault(r["qid"], []).append(r)
    summary = []
    for q in queries:
        rs = by_q[q["id"]]
        task_skills = sorted({s for r in rs for s in r["skills"]})
        expect, reject = q["expect"], q["reject"]
        if expect:
            verdict = "hit" if any(t in expect for t in task_skills) else "miss"
        else:
            verdict = "correct_none" if not [t for t in task_skills if t in reject] else "false_positive"
        summary.append({"qid": q["id"], "expect": expect, "reject": reject,
                        "triggered_per_run": [r["skills"] for r in rs],
                        "task_skills": task_skills, "verdict": verdict,
                        "false_positives": [t for t in task_skills if t in reject],
                        "secs": [r["secs"] for r in rs]})
    ok = sum(1 for s in summary if s["verdict"] in ("hit", "correct_none"))
    print(f"结果: {ok}/{len(summary)} 正确")
    for s in summary:
        mark = {"hit": "✓", "correct_none": "✓", "miss": "✗", "false_positive": "✗"}[s["verdict"]]
        print(f"  {mark} #{s['qid']:>2} expect={','.join(s['expect']) or 'NONE'} got={','.join(s['task_skills']) or '无'}"
              + (f" FP={s['false_positives']}" if s["false_positives"] else ""))
    out = set_path.parent / f"results-{set_path.stem}.json"
    out.write_text(json.dumps({"set": set_path.name, "runs": runs, "arena": str(ARENA),
                               "watch": watch_names, "summary": summary, "raw": results},
                              ensure_ascii=False, indent=2))
    print(f"\n明细 → {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
