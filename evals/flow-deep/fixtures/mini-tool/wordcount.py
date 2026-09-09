#!/usr/bin/env python3
"""mini-tool fixture —— eval 专用迷你目标仓（勿用于真实用途）

供 flow-deep 行为 evals 的文档型/代码型 case 使用：
- eval-2（文档型）：为它写 README
- eval-3（代码型）：为 count_words 补错误处理 + TDD
体量刻意保持迷你（<40 行），使 eval 单臂会话在 Stage 3 截断后总成本可控。
"""
import sys
from collections import Counter
from pathlib import Path


def count_words(path):
    text = Path(path).read_text(encoding="utf-8")
    words = text.lower().split()
    return len(words), Counter(words).most_common(5)


def main():
    path = sys.argv[1]
    total, top = count_words(path)
    print(f"total words: {total}")
    for w, n in top:
        print(f"  {w}: {n}")


if __name__ == "__main__":
    main()
