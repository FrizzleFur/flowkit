#!/usr/bin/env python3
"""flowkit 教程站基线机检（sweep 周期落盘版, 可复用为终验 T4.1）
检查域: 剧本 JSON 合同 / 零依赖红线 / 章节完整性 / 组件协议
用法: cd <repo根> && python3 .plan-feat-sweep/verify.py
"""
import json, re, sys, glob, os

SITE = "site"
fails, warns = [], []

def check(cond, msg):
    if not cond:
        fails.append(msg)

def warn(cond, msg):
    if not cond:
        warns.append(msg)

# ---- 1. 剧本 JSON 合同（PROTOCOL.md schema v2 / v1 兼容） ----
# path-data.json 是 pathview 组件的数据文件（有 chapters 无 steps），不套剧本 schema
scripts = sorted(p for p in glob.glob(f"{SITE}/assets/scripts/*.json")
                 if os.path.basename(p) != "path-data.json")
pv = f"{SITE}/assets/scripts/path-data.json"
if os.path.exists(pv):
    d = json.load(open(pv, encoding="utf-8"))
    check(len(d.get("chapters", [])) == 11, f"{pv}: chapters != 11")
for p in scripts:
    try:
        d = json.load(open(p, encoding="utf-8"))
    except Exception as e:
        fails.append(f"{p}: JSON 解析失败 {e}")
        continue
    v = d.get("version")
    steps = d.get("steps", [])
    check(bool(d.get("title")), f"{p}: 缺 title")
    check(len(steps) > 0, f"{p}: 无 steps")
    if v == 2:
        for i, s in enumerate(steps):
            check(s.get("title") and s.get("desc"), f"{p}: step[{i}] 缺 title/desc（无哑动画纪律）")
    else:
        # v1: 标题在 annotation.title（HANDOFF 已知陷阱: 步级校验须按 schema 分支）
        for i, s in enumerate(steps):
            ann = s.get("annotation") or {}
            check(ann.get("title") and ann.get("desc"), f"{p}: v1 step[{i}] 缺 annotation.title/desc")

# ---- 2. 零依赖红线 ----
idx = open(f"{SITE}/index.html", encoding="utf-8").read()
cdns = re.findall(r'src="(https?:?//[^"]+)"', idx)
for c in cdns:
    check("docsify@5.0.0" in c, f"index.html: 非 docsify@5.0.0 钉版外链 {c}")
# 钉版外链必须带 SRI
for m in re.finditer(r'<script src="(//[^"]+)"([^>]*)></script>', idx):
    check('integrity="sha' in m.group(2), f"index.html: 外链无 SRI {m.group(1)}")
check(not os.path.exists(f"{SITE}/package.json"), "site/: 出现 package.json（破坏零构建）")

# ---- 3. 章节完整性（11 章 + 锚点表 + 组件头） ----
chapters = sorted(glob.glob(f"{SITE}/mechanisms/ch*.md")) + sorted(glob.glob(f"{SITE}/principles/ch*.md"))
check(len(chapters) == 11, f"章节数 {len(chapters)} != 11")
for p in chapters:
    t = open(p, encoding="utf-8").read()
    check("本章源码锚点表" in t, f"{p}: 缺源码锚点表")
    check("怎么用" in t, f"{p}: 缺「怎么用」节")
    check("批判小节" in t, f"{p}: 缺「批判小节」节")

# ---- 4. 组件协议（FlowSite.fns + data-ready; 持 timer 组件须 _fsClear） ----
comps = glob.glob(f"{SITE}/assets/interactive/*.js")
NON_MOUNTABLE = {"progress.js"}  # 站点服务类（全局打点/装饰, 幂等无挂载点）, data-ready 模式不适用
for p in comps:
    t = open(p, encoding="utf-8").read()
    check("FlowSite.fns.push" in t, f"{p}: 未走 FlowSite.fns 协议")
    if os.path.basename(p) not in NON_MOUNTABLE:
        check(re.search(r"data-(ready|[a-z-]+-ready)", t), f"{p}: 缺 data-ready 防重入")
    if "setInterval" in t:
        check("_fsClear" in t, f"{p}: 持续 timer（setInterval）但无 _fsClear 生命周期")
    # 一次性 setTimeout/rAF（动画触发帧、延时清理）不属泄漏，不要求 _fsClear

# ---- 5. 章内引用的剧本文件存在 ----
for p in chapters + [f"{SITE}/README.md", f"{SITE}/path.md"]:
    t = open(p, encoding="utf-8").read()
    for m in re.findall(r'data-script="([^"]+)"', t):
        check(os.path.exists(os.path.join(SITE, m)), f"{p}: 引用剧本不存在 {m}")

# ---- 6. index.html 注册的本地脚本存在 ----
for m in re.findall(r'<script src="(assets/[^"]+)"', idx):
    check(os.path.exists(os.path.join(SITE, m)), f"index.html: 本地脚本不存在 {m}")

print(f"剧本 {len(scripts)} 部 | 章节 {len(chapters)} 章 | 组件 {len(comps)} 个")
for w in warns: print(f"WARN {w}")
for f in fails: print(f"FAIL {f}")
print(f"== {'ALL PASS' if not fails else f'{len(fails)} FAIL / {len(warns)} WARN'} ==")
sys.exit(1 if fails else 0)
