#!/usr/bin/env python3
"""FlowKit 宪法 lint —— golden rules 机械化（REC-10 落地）

思想来源：AIBC setup-codebase-harness 的 Legible-b「Custom lints with remediation」
——人类品味捕获一次（设计宪法/实测教训），机械检查处处强制，**报错信息内嵌修复指引**，
让 remediation 直接落进 agent 上下文。

四项检查（对应 2026-08-30 两次人工 review 抓出的真实问题类型）：
  L1 废弃 API 残留    —— TeamCreate/TeamDelete/shutdown_request/team_name=（说明文字会误报，warning 级人工判断）
  L2 registry 一致性  —— 图节点/层级表引用的 CID 必须存在于条目（幽灵引用=error）；
                         条目未入图=info（图可选画）；CID 跳号=warning
  L3 SKILL.md 体量    —— > 500 行违宪（膨胀预警，设计宪法的机械守卫）
  L4 验证命令标记     —— md 中的 grep/验证命令行提取，提示需先对已知样本实测
                         （教训：grep 正则漏计 README 由迟到评审抓出，非自查）

用法：python3 scripts/lint_flowkit.py [--root <flowkit根目录>]
退出码：0 = 无 error（warning/info 不阻塞）；1 = 存在 error。
"""
import argparse
import re
import sys
from pathlib import Path

DEPRECATED = re.compile(r"TeamCreate|TeamDelete|shutdown_request|team_name\s*=")
CID_ENTRY = re.compile(r"^### (C\d+):", re.M)
MERMAID_NODE = re.compile(r"\b(C\d+)\[")
TIER_ROW = re.compile(r"\| (C\d+)(?:-(C\d+))? \|")
VERIFY_CMD = re.compile(r"grep\s+-[a-zA-Z]*E?\s+[\"'`][^\"'`]+[\"'`]")


def lint_deprecated(root: Path) -> list[tuple[str, str, str]]:
    """L1: 废弃 API。修复指引内联。"""
    finds = []
    for f in [*root.glob("skills/*/SKILL.md"), *root.glob("skills/*/references/*.md")]:
        for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if DEPRECATED.search(line):
                finds.append((str(f.relative_to(root)), f"L{i}", line.strip()[:100]))
    return finds


def lint_registry(root: Path) -> dict[str, list]:
    """L2: capability-registry 三方一致性（条目/图/层级表）。"""
    reg = next(root.glob("skills/flow-deep/references/capability-registry.md"), None)
    if not reg:
        return {"error": [("capability-registry.md", "L?", "文件不存在")], "warning": [], "info": []}
    text = reg.read_text(encoding="utf-8")
    entries = set(CID_ENTRY.findall(text))
    nodes = set(MERMAID_NODE.findall(text))
    tier = set()
    for lo, hi in TIER_ROW.findall(text):
        nums = sorted(int(c[1:]) for c in {lo, hi} if c)
        tier.update(f"C{n:02d}" for n in range(nums[0], nums[-1] + 1)) if nums else None
    errors = [(n, "mermaid", f"图节点 {n} 无条目定义——先登记条目再入图") for n in sorted(nodes - entries)]
    errors += [(n, "tier-table", f"层级表引用 {n} 无条目定义") for n in sorted(tier - entries)]
    cids = sorted(int(c[1:]) for c in entries)
    fmt = lambda n: f"C{n:02d}" if n < 10 else f"C{n}"
    gaps = [fmt(b) for a, b in zip(cids, cids[1:]) if b - a > 1]
    warnings = [(g, "cid-gap", f"{g} 前存在跳号——确认非遗漏登记") for g in gaps]
    infos = [(c, "not-in-graph", f"条目 {c} 未入 mermaid 图（图可选画，补画可提升导航）")
             for c in sorted(entries - nodes)]
    return {"error": errors, "warning": warnings, "info": infos}


def lint_skill_size(root: Path) -> list[tuple[str, str, str]]:
    """L3: SKILL.md 体量（宪法 <500 行——multi-agent 先例口径）。"""
    finds = []
    for f in root.glob("skills/*/SKILL.md"):
        n = len(f.read_text(encoding="utf-8").splitlines())
        if n > 500:
            finds.append((str(f.relative_to(root)), f"{n} 行",
                          "超过 500 行宪法线——按 map-not-manual 原则下沉 references"))
    return finds


def lint_verify_cmds(root: Path) -> list[tuple[str, str, str]]:
    """L4: 验证命令提取（提示实测——半自动，info 级）。"""
    finds = []
    for f in [*root.glob("skills/*/references/*.md"), *root.glob("skills/*/SKILL.md")]:
        for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if VERIFY_CMD.search(line):
                finds.append((str(f.relative_to(root)), f"L{i}", line.strip()[:90]))
    return finds


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    root = Path(ap.parse_args().root)
    print("=" * 66)
    print(f"FlowKit 宪法 lint | root: {root}")
    print("=" * 66)
    has_error = False

    l1 = lint_deprecated(root)
    print(f"\n[L1] 废弃 API 残留（{len(l1)}）——修复：改为 TaskStop(task_id=<name>) / Agent(name=...)；若为说明性文字可忽略")
    for f, loc, txt in l1:
        print(f"  ⚠ {f}:{loc}  {txt}")

    l2 = lint_registry(root)
    print(f"\n[L2] registry 一致性（error {len(l2['error'])} / warn {len(l2['warning'])} / info {len(l2['info'])}）")
    for c, where, msg in l2["error"]:
        print(f"  ✗ [{where}] {msg}"); has_error = True
    for c, where, msg in l2["warning"]:
        print(f"  ⚠ [{where}] {msg}")
    for c, where, msg in l2["info"][:8]:
        print(f"  · [{where}] {msg}")
    if len(l2["info"]) > 8:
        print(f"  · ...另有 {len(l2['info'])-8} 条 info 省略")

    l3 = lint_skill_size(root)
    print(f"\n[L3] SKILL.md 体量（{len(l3)}）")
    for f, n, msg in l3:
        print(f"  ⚠ {f}（{n}）  {msg}")

    l4 = lint_verify_cmds(root)
    print(f"\n[L4] 验证命令需实测提醒（{len(l4)}）——每条正则/命令应先对已知样本跑通再入库（grep 正则漏计 README 的教训）")
    for f, loc, txt in l4:
        print(f"  · {f}:{loc}  {txt}")

    print("\n" + "=" * 66)
    print("结论: " + ("存在 error，需修复后重跑" if has_error else "无 error（warning/info 为提示级）"))
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
