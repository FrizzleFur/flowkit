#!/usr/bin/env python3
"""auto-skill 经验库引用完整性检查（REC-2 — serena memories check 的移植）

哲学来源：serena 的 `serena memories check`——悬空引用报告 + 近似名候选，
只报告不自动修复（保守策略）。

检查三类完整性：
  1. 绝对路径引用：条目正文与「关键文件/路径」字段中的 /Users/... 路径是否存在
     （含目录迁移残留识别：/Users/<旧用户名>/... → 当前用户名映射建议）
  2. [[wikilink]] 引用：目标在库内（experience/ + knowledge-base/）是否可解析
  3. 索引对称性：_index.json 登记的文件 vs 磁盘实存文件，双向核对

用法：
  python3 ~/.claude/skills/auto-skill/scripts/check_integrity.py [--root <auto-skill目录>]

输出：人类可读报告（断链清单 + 近似名候选 + 统计）。退出码 0=有发现也正常返回（检查工具，非 gate）。
"""
import argparse
import difflib
import json
import re
import sys
from pathlib import Path

# 绝对路径模式：macOS 用户路径，遇空白/中文标点/全角开闭括号/引号终止
# （全角开括号必须排除：路径后紧跟「（注释」时贪婪匹配会吞掉左括号——2026-08-30 首跑实测）
PATH_RE = re.compile(r"`?(/Users/[A-Za-z0-9_.\-]+(?:/[^\s`'\"\(\)\[\]（）【】「」『』《》<>，。；：，。；）】、]+)*)`?")
WIKILINK_RE = re.compile(r"\[\[([^\]|:][^\]|]*)(?:\|[^\]]+)?\]\]")  # 首字符排除 : —— [[:<:]] 等 BSD 字符类不是 wikilink


def extract_paths(text: str) -> list[str]:
    """提取正文中的绝对路径，过滤明显非文件引用的（如裸 /Users/xxx）。"""
    out = []
    for m in PATH_RE.finditer(text):
        p = m.group(1).rstrip('.,;:，。；：')
        if p.count("/") >= 2:  # 至少 /Users/name/x 才算具体路径
            out.append(p)
    return out


def find_wikilink_target(target: str, known_names: list[str]) -> str | None:
    """库内文件名（去 .md）精确匹配。"""
    name = target.split("/")[-1].strip()
    return name if name in known_names else None


def close_matches(target: str, known_names: list[str], n: int = 3) -> list[str]:
    name = target.split("/")[-1].strip()
    return difflib.get_close_matches(name, known_names, n=n, cutoff=0.6)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent), help="auto-skill 根目录")
    args = ap.parse_args()
    root = Path(args.root)

    exp_dir, kb_dir = root / "experience", root / "knowledge-base"
    md_files = sorted([*exp_dir.glob("*.md"), *kb_dir.glob("*.md")])
    if not md_files:
        print("未发现任何 .md 条目，检查结束")
        return

    known_names = [f.stem for f in md_files]
    current_user = Path.home().name
    broken_paths, broken_links, migration_hits = [], [], []

    for f in md_files:
        text = f.read_text(encoding="utf-8")
        # --- 1. 绝对路径 ---
        for p in extract_paths(text):
            if Path(p).exists():
                continue
            seg = p.split("/")
            if len(seg) > 2 and seg[2] and seg[2] != current_user:
                migration_hits.append((f.name, p, f"/Users/{current_user}/" + "/".join(seg[3:])))
            else:
                broken_paths.append((f.name, p))
        # --- 2. wikilink ---
        for m in WIKILINK_RE.finditer(text):
            target = m.group(1).strip()
            if not find_wikilink_target(target, known_names):
                broken_links.append((f.name, target))

    # --- 3. 索引对称性 ---
    index_mismatches = []
    for idx_path in [exp_dir / "_index.json", kb_dir / "_index.json"]:
        if not idx_path.exists():
            continue
        try:
            idx = json.loads(idx_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            index_mismatches.append((idx_path.name, f"_index.json 解析失败: {e}"))
            continue
        entries = idx.get("skills", []) or idx.get("categories", [])
        # skills 条目用 file 字段；categories 条目用 name 字段（文件名 = name + .md）
        listed = {e.get("file") or (e.get("name", "") + ".md" if e.get("name") else "")
                  for e in entries}
        listed_stems = {Path(x).stem for x in listed if x}
        for e in entries:
            fp = e.get("file")
            if fp and not (idx_path.parent / fp).exists():
                index_mismatches.append((idx_path.name, f"登记文件不存在: {fp}"))
        local_stems = {f.stem for f in idx_path.parent.glob("*.md") if f.stem != "_index"}
        for orphan in sorted(local_stems - listed_stems):
            index_mismatches.append((idx_path.name, f"磁盘有文件但未登记: {orphan}.md"))

    # --- 报告 ---
    print("=" * 64)
    print("auto-skill 经验库完整性检查报告（REC-2）")
    print(f"扫描: {len(md_files)} 个条目 | 库根: {root}")
    print("=" * 64)

    def section(title: str, rows: list, hint_fn=None) -> None:
        print(f"\n## {title}（{len(rows)}）")
        if not rows:
            print("  无 — OK")
            return
        for src, item in rows:
            print(f"  [{src}] {item}")
            if hint_fn:
                for h in hint_fn(item):
                    print(f"      候选: {h}")

    section("断链绝对路径（真断，需人工核实）", broken_paths)
    print(f"\n## 目录迁移残留（/Users/<旧用户名>/ → 建议替换为 /Users/{current_user}/）({len(migration_hits)})")
    if not migration_hits:
        print("  无 — OK")
    else:
        for src, old, new in migration_hits:
            exists = "替换后存在" if Path(new).exists() else "替换后仍不存在"
            print(f"  [{src}] {old}\n      建议 → {new}（{exists}）")
    section("断链 wikilink（库内无同名条目）", broken_links,
            lambda t: [f"{c}" for c in close_matches(t, known_names)])
    section("索引不对称", index_mismatches)

    total = len(broken_paths) + len(migration_hits) + len(broken_links) + len(index_mismatches)
    print("\n" + "=" * 64)
    print(f"总计发现: {total} 处（断路径 {len(broken_paths)} / 迁移残留 {len(migration_hits)} / "
          f"断 wikilink {len(broken_links)} / 索引不对称 {len(index_mismatches)}）")
    print("策略: 只报告不修复 — 修复请人工确认后进行（serena memories check 同款保守策略）")


if __name__ == "__main__":
    sys.exit(main())
