# FlowKit

> **📝 Blog Deep Dive**: [FlowKit: AI-Native Workflow Orchestration Toolkit](https://michaelmaomao.github.io/2026/05/05/FlowKit-AI%E5%8E%9F%E7%94%9F%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%BC%96%E6%8E%92%E5%B7%A5%E5%85%B7%E9%9B%86/) — Design motivation, core architecture, decision trade-offs and lessons learned

> AI-native workflow orchestration toolkit — structured pipelines from task analysis to verified delivery.

English | **[中文](README.md)**

## Pipeline Overview

```
                              ┌──────────────────────────────────────────────────┐
                              │                  FlowKit Pipeline                │
                              └──────────────────────────────────────────────────┘
         ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
  Input──▶│  Stage 0  │──▶│  Stage 1  │──▶│  Stage 2  │──▶│  Stage 3  │──┐
         │Superpowers│   │  Prompt   │   │Deep Think │   │Planning   │  │
         │   Check   │   │  Optimize │   │  (Forced) │   │(PlanMode) │  │
         └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
                                                                            │
         ┌──────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ Stage 3.5 │──▶│ Stage 3.6 │──▶│  Stage 4  │──▶│  Stage 5  │──┐
    │Plan Review│   │  Panel    │   │Multi-Agent│   │ Verify    │  │
    │ (Forced)  │   │  Review   │   │ Parallel  │   │ (Forced)  │  │
    └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
                                                                       │
         ┌──────────────────────────────────────────────────────────────┘
         ▼
    ┌─────────────────┐
    │  Stage 5.5/5.7  │  ── Auto-iterate when goals not met, Ralph Loop enforces persistence
    │  Iteration Loop │
    └─────────────────┘
```

## Why This Exists

Working with AI coding agents (Claude Code, Cursor, etc.) revealed a gap: **agents are powerful but undisciplined**. They skip verification, ignore edge cases, and declare "done" without evidence. FlowKit applies software engineering rigor to AI agent workflows — turning "vibes-based coding" into a repeatable engineering process.

## Core Modules

| Module | Purpose | Key Innovation |
|--------|---------|---------------|
| **[flow](skills/flow/SKILL.md)** | Lightweight orchestration | Parameter-controlled pipeline — enable only what you need |
| **[flow-deep](skills/flow-deep/SKILL.md)** | Full-depth orchestration | All quality gates forced ON — for high-stakes tasks |
| **[multi-agent](skills/multi-agent/SKILL.md)** | Agent team coordination | tmux-split parallel execution with phase-aware scheduling |
| **[prompt](skills/prompt/SKILL.md)** | Prompt scoring & optimization | Johari Window + 3S Principles quantitative evaluation |

## Design Highlights

### 1. Iron Laws — Non-negotiable Execution Discipline

Four rules with built-in rationalization prevention:

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     Iron Laws · Execution Rules                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   ┌──────────────┐    ┌──────────────┐                         │
  │   │  IL-1 · TDD  │    │IL-2 · Verify │                         │
  │   │              │    │              │                         │
  │   │ No code      │    │ No completion│                         │
  │   │ without test │    │ w/o evidence │                         │
  │   └──────┬───────┘    └──────┬───────┘                         │
  │          │                   │                                  │
  │          ▼                   ▼                                  │
  │   "Too simple to test"  "Should work"   ← Typical excuses     │
  │          │                   │                                  │
  │          └───────┬───────────┘                                  │
  │                  ▼                                              │
  │   ┌──────────────────────────────┐                             │
  │   │   Rationalization Table      │                             │
  │   │   Each excuse → Refuted      │                             │
  │   └──────────────────────────────┘                             │
  │                                                                  │
  │   ┌──────────────┐    ┌──────────────┐                         │
  │   │IL-3 · Debug  │    │IL-4 · Review │                         │
  │   │              │    │              │                         │
  │   │ No code fix  │    │ Review is    │                         │
  │   │ w/o root cause│   │ read-only    │                         │
  │   └──────────────┘    └──────────────┘                         │
  └─────────────────────────────────────────────────────────────────┘
```

### 2. Auto-Decide Layer — Reduces Human Review by 80%

During multi-role panel review (Stage 3.6), 6 principles automatically classify findings:

```
  Finding Input
      │
      ▼
  ┌──────────────────────┐
  │   Auto-Decide Layer  │
  ├──────────────────────┤
  │                      │
  │  P1 Standards ───────┼── Violated → AUTO_FIX
  │  P2 Risk Level ──────┼── High → FIX / Low → APPROVE
  │  P3 Consistency ─────┼── Matches prior → AUTO_APPROVE
  │  P4 YAGNI ───────────┼── Over-engineering → Escalate ⚖️
  │  P5 Security ────────┼── Security related → AUTO_FIX
  │  P6 Reversibility ───┼── Irreversible → Escalate ⚖️
  │                      │
  └──────┬───────┬───────┘
         │       │
         ▼       ▼
   ┌──────────┐  ┌──────────────────┐
   │ 80% Auto │  │ 20% Taste       │
   │ resolved │  │ Decisions       │
   │ (silent) │  │ escalated to    │
   └──────────┘  │ user (typically │
                 │ < 5 items)     │
                 └──────────────────┘
```

Only **Taste Decisions** reach the human — typically < 5 items instead of 20+.

### 3. STATE.md — Cross-Session Recovery

Crash recovery built into the pipeline:

```
  Session dies at Stage 4 Phase 2 💥
          │
          ▼
  ┌─────────────────────────┐
  │    .plan/STATE.md        │
  │                          │
  │  current_stage: 4        │
  │  current_phase: 2        │
  │  next_action: "Stage 5"  │
  │  progress: 65%           │
  └──────────┬──────────────┘
             │
             ▼
  New session reads STATE.md
          │
          ▼
  "You were at Stage 4, Phase 2
   — resume or restart?"
          │
          ▼
  Resumes exactly where it left off ──▶ Continue
```

No other community framework (GSD, GStack) has this capability.

### 4. Quantitative Prompt Scoring

Based on Johari Window theory + 3S Principles:

```
                AI Knows          AI Doesn't Know
            ┌──────────────┬──────────────┐
  User      │ Q1 Common    │ Q4 Domain    │
  Knows     │ Knowledge    │ Knowledge  ⚠ │
            │ Describe it  │ Must feed it │
            ├──────────────┼──────────────┤
  User      │ Q2 AI Expert │ Q3 Explore   │
  Doesn't   │ Trust AI     │ Co-discover  │
  Know      │              │              │
            └──────────────┴──────────────┘

  Q4 without feeding → Score ≤ 2/10 (Critical)
  Q4 with feeding    → Score 7.0-8.5/10
```

### 5. Fallback Protocol — Plan-First Error Handling

When execution hits unexpected issues, the first question is not "how do I fix this" but "what did the plan assume wrong":

```
  Execution exception
      │
      ├─ Minor deviation ────▶ Fix directly ──▶ Continue
      │
      ├─ Plan assumption wrong─▶ Plan Fallback
      │                          │
      │                     ┌────┴────┐
      │                     ▼         │
      │                 Pause exec    │
      │                 Log deviation │
      │                 Update plan   │
      │                 User confirm ─┘
      │                     │
      │                     ▼
      │                 Continue
      │
      └─ Same phase fails 2x
              │
              ▼
         Escalate back to Stage 2
```

## Flow vs Flow-Deep

| Aspect | `/flow` | `/flow-deep` |
|--------|---------|--------------|
| Superpowers check | — | Forced ON |
| Deep thinking | Optional (`--think`) | Forced (ST + Mermaid + 3-role discussion) |
| Plan Mode | Default ON, can disable | Cannot disable |
| Plan Review | Optional (`--plan-review`) | Forced |
| Panel Review | — | Default ON (3-5 roles) |
| TDD injection | Optional (`--tdd`) | Auto-injected |
| Verification | Can skip (`--no-verify`) | Cannot skip |
| Ralph Loop | Manual (`--ralph`) | Auto-triggers when iterations exhausted |

## Quick Start

This toolkit is designed for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI.

### One-line install (recommended)

Install all modules at once via [skills.sh](https://skills.sh) (Vercel Labs' package manager for Agent Skills):

```bash
npx skills add FrizzleFur/flowkit -a claude-code
```

Install a single module:

```bash
npx skills add https://github.com/FrizzleFur/flowkit/tree/main/skills/flow
```

### Manual install (fallback without Node)

```bash
# Copy individual modules you need
cp -r skills/flow ~/.claude/skills/
cp -r skills/flow-deep ~/.claude/skills/
cp -r skills/multi-agent ~/.claude/skills/
cp -r skills/prompt ~/.claude/skills/
```

Invoke in Claude Code:

```
/flow refactor the authentication module
/flow-deep redesign the payment system for multi-currency support
/prompt evaluate this prompt: "write a sorting algorithm"
```

## Design Philosophy

| Source | What it manages | What we took |
|--------|----------------|-------------|
| GStack | Decision flow | Auto-Decide Layer (P1-P6 + Taste Decision) |
| Superpowers | Execution discipline | Iron Laws + Rationalization Table |
| GSD | Context quality | STATE.md cross-session recovery |

**Original contributions not found in any community framework:**
- STATE.md crash recovery mechanism
- Auto-Decide Layer with 6 principles
- Ralph Loop integration (stop-hook + auto-iterate dual-layer iteration)
- Johari Window-based prompt scoring

## Changelog

### v1.1.0 (2026-08-21)

**flow-deep**
- Added **Context Guard** — detects real context usage at Stage/Phase boundaries via `scripts/check_context.py` (reads actual token usage from the session transcript, not model self-estimation); above 70% it prompts three options: save & continue / save & hand off (generates HANDOFF.md as the continuation prompt for the next agent) / skip
- Added **Proactive Checkpoint & Handoff protocol** — save checklist, HANDOFF.md template (references plan files by path instead of duplicating), per-Stage throttling, non-interactive fallback when AskUserQuestion is unavailable, silent degradation on detection failure (exit 0/1/2 contract)
- Added **prime-agent integration (C34)** — registered in capability-registry with auto-routing in skill-routing: `security-audit` / `code-verification` tasks route to prime-agent (IPython runs code for real verification) when available; disable with `--no-prime`
- Context trigger table P0 upgraded to script-based measurement, replacing unreliable "manual estimation"

### v1.0.0 (2026-07-16)

**flow-deep**
- Added **Goal Contract** — prevents the agent from doing correct-looking work that misses the user's actual outcome; provides Objective / Success Criteria / Non-goals / Verification Plan template
- Added **Workflow Script Patterns** — Review Workflow / Execution Workflow patterns for when Stage 4 Execution Router selects the Workflow backend
- Major `SKILL.md` update (532 → 694 lines); capability-registry / context-management / panel-review enhancements

**flow**
- Added **Selection Guide** — decision criteria for flow-deep vs flow vs grill-me, upgrade/downgrade signals, composition patterns, and three misuse cases
- `SKILL.md` update; cleanup-procedure / needs-exploration / stage55-iteration enhancements

**multi-agent**
- `SKILL.md` update (315 → 328 lines)

## License

MIT
