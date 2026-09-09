#!/usr/bin/env python3
"""FlowKit 宪法 lint —— golden rules 机械化（REC-10 落地）

思想来源：AIBC setup-codebase-harness 的 Legible-b「Custom lints with remediation」
——人类品味捕获一次（设计宪法/实测教训），机械检查处处强制，**报错信息内嵌修复指引**，
让 remediation 直接落进 agent 上下文。

七项检查：
  L1 废弃 API 残留    —— TeamCreate/TeamDelete/shutdown_request/team_name=（说明文字会误报，warning 级人工判断）
  L2 registry 一致性  —— 图节点/层级表引用的 CID 必须存在于条目（幽灵引用=error）；
                         条目未入图=info（图可选画）；CID 跳号=warning
  L3 SKILL.md 体量    —— > 500 行宪法线=warning（膨胀预警）；budget 线（SIZE_BUDGET，
                         flow-deep 800 = REC-11 下沉触发线）=error
  L4 验证命令标记     —— md 中的 grep/验证命令行提取，提示需先对已知样本实测
                         （教训：grep 正则漏计 README 由迟到评审抓出，非自查）
  L5 引用完整性       —— SKILL.md 与 references 互引的 references/scripts 相对路径必须存在
                         （error；多平台适配后回归面翻倍，断链是最高频回归）
  L6 codex-compat     —— SKILL.md 提及 ↔ codex-compat.md 文件存在，双向一致（error；
                         路径不统一：prompt 在技能根、其余在 references/，故按提及判定不按路径硬编码）
  L7 frontmatter      —— name 与目录名一致、description 非空（error；description 是
                         available_skills 唯一常驻上下文 = 触发机制，即 trigger eval 的静态前提）

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
REF_FILE = re.compile(
    # 跨技能引用三种写法：~/.claude/skills/<n>/... 、skills/<n>/... 、<n>/references|scripts/...
    # （仓内或安装副本可解析即通过）
    r"(?P<cross>(?:~/\.claude/)?(?:skills/)?(?P<xskill>[a-z0-9-]+)/(?P<xrest>(?:references|scripts)/[A-Za-z0-9_./-]+\.(?:md|py|sh)))"
    # 技能内相对引用：按 skill 根解析，断链 = error
    r"|(?P<rel>(?:references|scripts)/[A-Za-z0-9_./-]+\.(?:md|py|sh))"
)

# REC-11 下沉触发线：703 行基线（2026-09-01）+100 ≈ 800，达到即必须执行下沉地图
SIZE_BUDGET = {"flow-deep": 800}


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


def lint_skill_size(root: Path) -> tuple[dict[str, int], list, list]:
    """L3: 体量台账 + 双线判定（500 宪法线=warning；budget 线=error）。"""
    sizes, warns, errors = {}, [], []
    for f in root.glob("skills/*/SKILL.md"):
        n = len(f.read_text(encoding="utf-8").splitlines())
        rel = str(f.relative_to(root))
        sizes[rel] = n
        if n > 500:
            warns.append((rel, f"{n} 行",
                          "超过 500 行宪法线——按 map-not-manual 原则下沉 references"))
        name = f.parent.name
        if name in SIZE_BUDGET and n > SIZE_BUDGET[name]:
            errors.append((rel, f"{n} 行",
                           f"超过 {name} budget {SIZE_BUDGET[name]} 行（REC-11 下沉触发线）"
                           "——执行下沉地图（研究仓 skill-improvement-analysis §2.2）"))
    return sizes, warns, errors


def lint_verify_cmds(root: Path) -> list[tuple[str, str, str]]:
    """L4: 验证命令提取（提示实测——半自动，info 级）。"""
    finds = []
    for f in [*root.glob("skills/*/references/*.md"), *root.glob("skills/*/SKILL.md")]:
        for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if VERIFY_CMD.search(line):
                finds.append((str(f.relative_to(root)), f"L{i}", line.strip()[:90]))
    return finds


def lint_ref_integrity(root: Path) -> list[tuple[str, str, str]]:
    """L5: 引用完整性——分两种形态：技能内相对引用按 skill 根解析（断链=error）；
    跨技能引用分两级：目标技能在本仓 skills/ 下（家族内）→ 文件必须仓内可解析（error，
    CI 无安装副本环境也要挡）；目标技能不在本仓（外部家族成员，如 auto-iterate 由私有仓管）
    → 合法外部依赖，不报 error（本地有装副本时确认存在与否仅作提示）。
    教训（2026-09-09 CI 首跑）：外部依赖用「安装副本 OR」判定会把 CI 必挂的合法引用判成断链。"""
    errors, seen = [], set()
    home_skills = Path.home() / ".claude" / "skills"
    for f in [*root.glob("skills/*/SKILL.md"), *root.glob("skills/*/references/*.md")]:
        # SKILL.md 在技能根下（skill 根 = f.parent）；references/*.md 深一层（= f.parent.parent）
        skill_root = f.parent if f.name == "SKILL.md" else f.parent.parent
        for m in REF_FILE.finditer(f.read_text(encoding="utf-8")):
            if m.group("cross"):
                rest = m.group("xrest")
                target_skill = m.group("xskill")
                key = (str(f.relative_to(root)), f"skills/{target_skill}/{rest}")
                if key in seen:
                    continue
                seen.add(key)
                in_repo = (root / "skills" / target_skill).is_dir()
                repo_hit = (root / "skills" / target_skill / rest).exists()
                home_hit = (home_skills / target_skill / rest).exists()
                if in_repo and not repo_hit:
                    errors.append((key[0], key[1], "家族内技能跨引用断链——目标文件不在本仓（L5 断链）"))
                # else: 外部家族依赖（目标技能不在本仓，如 auto-iterate 由私有仓管）——合法，静默；
                # 本地安装副本是否存在不影响判定（CI 无安装副本属常态，教训 2026-09-09 CI 首跑）
            else:
                rel = m.group("rel")
                key = (str(f.relative_to(root)), rel)
                if key in seen:
                    continue
                seen.add(key)
                if not (skill_root / rel).exists():
                    errors.append((key[0], rel, "引用目标不存在——补文件或改路径（L5 断链）"))
    return errors


def lint_codex_compat(root: Path) -> list[tuple[str, str, str]]:
    """L6: codex-compat 双向一致性——SKILL.md 提及 ↔ 文件存在。"""
    errors = []
    for skill_dir in sorted(root.glob("skills/*")):
        sk = skill_dir / "SKILL.md"
        if not sk.exists():
            continue
        text = sk.read_text(encoding="utf-8")
        compat = sorted(skill_dir.glob("**/codex-compat.md"))
        mentioned = "codex-compat" in text
        if compat and not mentioned:
            errors.append((str(sk.relative_to(root)), compat[0].name,
                           "存在 codex-compat.md 但 SKILL.md 未提及——加载入口缺失，适配层不可达"))
        if mentioned and not compat:
            errors.append((str(sk.relative_to(root)), "codex-compat.md",
                           "SKILL.md 引用 codex-compat 但文件不存在——补文件或删引用"))
    return errors


def lint_frontmatter(root: Path) -> list[tuple[str, str, str]]:
    """L7: frontmatter 一致性——name==目录名、description 非空（不挑剔 YAML 风格：行内/块标量均合法）。"""
    errors = []
    for f in sorted(root.glob("skills/*/SKILL.md")):
        text = f.read_text(encoding="utf-8")
        rel = str(f.relative_to(root))
        if not text.startswith("---"):
            errors.append((rel, "frontmatter", "缺少 YAML frontmatter——skill 元数据不可解析"))
            continue
        block = text.split("---", 2)[1] if text.count("---") >= 2 else ""
        name = re.search(r"^name:\s*(\S+)", block, re.M)
        desc = re.search(r"^description:\s*(\S.*)?$", block, re.M)
        dirname = f.parent.name
        if not name:
            errors.append((rel, "name", "缺 name 字段"))
        elif name.group(1) != dirname:
            errors.append((rel, f"name={name.group(1)}", f"与目录名 {dirname} 不一致——触发与安装路径会错位"))
        if not desc or not desc.group(1):
            errors.append((rel, "description", "缺失或为空——description 是 available_skills 唯一常驻上下文（触发机制）"))
    return errors


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

    sizes, l3w, l3e = lint_skill_size(root)
    print(f"\n[L3] SKILL.md 体量（warning {len(l3w)} / error {len(l3e)}）——台账即趋势，CI 日志可追溯")
    for rel, n in sorted(sizes.items()):
        print(f"  · {rel}  {n} 行")
    for f, n, msg in l3w:
        print(f"  ⚠ {f}（{n}）  {msg}")
    for f, n, msg in l3e:
        print(f"  ✗ {f}（{n}）  {msg}"); has_error = True

    l4 = lint_verify_cmds(root)
    print(f"\n[L4] 验证命令需实测提醒（{len(l4)}）——每条正则/命令应先对已知样本跑通再入库（grep 正则漏计 README 的教训）")
    for f, loc, txt in l4:
        print(f"  · {f}:{loc}  {txt}")

    l5 = lint_ref_integrity(root)
    print(f"\n[L5] 引用完整性（{len(l5)}）——多平台适配后回归面翻倍，断链是最高频回归")
    for f, rel, msg in l5:
        print(f"  ✗ {f}  → {rel}  {msg}"); has_error = True

    l6 = lint_codex_compat(root)
    print(f"\n[L6] codex-compat 双向一致性（{len(l6)}）——提及↔文件必须成对存在")
    for f, rel, msg in l6:
        print(f"  ✗ {f}  [{rel}]  {msg}"); has_error = True

    l7 = lint_frontmatter(root)
    print(f"\n[L7] frontmatter 一致性（{len(l7)}）——name==目录名 + description 非空（触发机制静态前提）")
    for f, rel, msg in l7:
        print(f"  ✗ {f}  [{rel}]  {msg}"); has_error = True

    print("\n" + "=" * 66)
    print("结论: " + ("存在 error，需修复后重跑" if has_error else "无 error（warning/info 为提示级）"))
    return 1 if has_error else 0


if __name__ == "__main__":
    sys.exit(main())
