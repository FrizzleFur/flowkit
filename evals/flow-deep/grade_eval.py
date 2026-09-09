#!/usr/bin/env python3
"""flow-deep 行为 evals 机检断言脚本（T-301 验收④：≥1 断言可机检）

用法：python3 grade_eval.py <eval运行目录> [eval_id]
  <eval运行目录> 结构：cwd/（subagent 工作目录，.plan/ 落此）+ outputs/
  eval_id（1/2/3）触发类型特定断言（见 evals.json 各 case assertions 尾条）
输出：stdout 逐条断言结果；并写 grading.json 到该目录（schema 对齐
skill-creator viewer：expectations[].text/passed/evidence）。

断言设计原则（evals/README.md 防漂移规则 1）：只锚 Stage 3 落盘产物等
不变量，不锚任务输出内容；文风类不判（无 LLM-as-judge）。
"""
import json
import sys
from pathlib import Path

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "mini-tool"


def check(run_dir: Path, eval_id: int = 0) -> list[dict]:
    cwd = run_dir / "cwd"
    plan = cwd / ".plan"
    results = []

    def add(text, passed, evidence):
        results.append({"text": text, "passed": bool(passed), "evidence": evidence})

    # A1 .plan/ 目录存在
    add(".plan/ 目录存在（planning-with-files 已触发）",
        plan.is_dir(), str(plan) + (" 存在" if plan.is_dir() else " 不存在"))

    # A2 task_plan.md ≥10 行
    tp = plan / "task_plan.md"
    n = len(tp.read_text(encoding="utf-8").splitlines()) if tp.exists() else 0
    add(".plan/task_plan.md 存在且 ≥10 行", tp.exists() and n >= 10,
        f"{n} 行" if tp.exists() else "文件不存在")

    # A3 findings.md + progress.md
    for name in ("findings.md", "progress.md"):
        add(f".plan/{name} 存在", (plan / name).exists(),
            "存在" if (plan / name).exists() else "缺失")

    # A4 STATE.md 含进度字段
    st = plan / "STATE.md"
    if st.exists():
        txt = st.read_text(encoding="utf-8").lower()
        hit = [k for k in ("stage", "next_action", "next action") if k in txt]
        add(".plan/STATE.md 存在且含 stage/next_action 字段", bool(hit), f"命中: {hit}")
    else:
        add(".plan/STATE.md 存在且含 stage/next_action 字段", False, "STATE.md 缺失")

    # A5 spec.md 含 Success Criteria（Goal Contract 落盘）
    spec = plan / "spec.md"
    if spec.exists():
        txt = spec.read_text(encoding="utf-8").lower()
        ok = "success criteria" in txt or "成功标准" in txt or "验收" in txt
        add(".plan/spec.md 存在且含 Success Criteria", ok,
            f"spec.md {len(txt.splitlines())} 行，SC 关键词{'命中' if ok else '未命中'}")
    else:
        add(".plan/spec.md 存在且含 Success Criteria", False, "spec.md 缺失（Goal Contract 未按落点写入）")

    # A6 截断纪律：cwd 内除 .plan/ 与预置 fixtures/ 外无产物扩散
    # （fixtures 为评测派发前人工拷入的沙箱初始态，非 subagent 产物）
    extras = [p.name for p in cwd.iterdir() if p.name not in (".plan", "fixtures")] if cwd.exists() else []
    add("工作目录无 .plan/ 外的执行期产物（截断纪律）", len(extras) == 0,
        f"额外条目: {extras}" if extras else "无额外产物")

    # 类型特定断言（按 eval_id）
    if eval_id == 2 and tp.exists():
        txt = tp.read_text(encoding="utf-8").lower()
        hit = [k for k in ("readme", "大纲", "结构") if k in txt]
        add("task_plan.md 含 README 结构/大纲类规划内容", bool(hit), f"命中: {hit}")
    if eval_id == 3 and tp.exists():
        txt = tp.read_text(encoding="utf-8").lower()
        hit = [k for k in ("tdd", "失败测试", "red", "先写测试", "测试先行") if k in txt]
        add("task_plan.md 提及测试先行/TDD 安排（铁律注入进入规划）", bool(hit), f"命中: {hit}")
        src = FIXTURE / "wordcount.py"
        dst = cwd / "fixtures" / "mini-tool" / "wordcount.py" if (cwd / "fixtures").exists() else None
        if dst and dst.exists():
            same = src.read_text(encoding="utf-8") == dst.read_text(encoding="utf-8")
            add("wordcount.py 未被修改（Stage 3 只规划不改码）", same,
                "与 fixture 原版一致" if same else "内容有改动——截断纪律被违反")

    return results


def main() -> int:
    run_dir = Path(sys.argv[1]).resolve()
    eval_id = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    results = check(run_dir, eval_id)
    passed = sum(r["passed"] for r in results)
    print(f"flow-deep eval 机检 | {run_dir.name}: {passed}/{len(results)} PASS")
    for r in results:
        print(f"  {'✓' if r['passed'] else '✗'} {r['text']}  ({r['evidence']})")
    grading = {"expectations": results,
               "summary": {"passed": passed, "total": len(results)}}
    out = run_dir / "grading.json"
    out.write_text(json.dumps(grading, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"grading.json → {out}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
