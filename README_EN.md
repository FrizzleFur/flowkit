# FlowKit

> **📝 Blog Deep Dive**: [FlowKit: AI-Native Workflow Orchestration Toolkit](https://michaelmaomao.github.io/2026/05/05/FlowKit-AI%E5%8E%9F%E7%94%9F%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%BC%96%E6%8E%92%E5%B7%A5%E5%85%B7%E9%9B%86/) — Design motivation, core architecture, decision trade-offs and lessons learned

> AI-native workflow orchestration toolkit — structured pipelines from task analysis to verified delivery, with 75% automatic context relay keeping long tasks alive across sessions.

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

### 4. Auto Handoff — Automatic Context Relay at 75%

The enemy of long tasks is context rot: quality degrades as the window fills, until auto-compact crudely compresses or the session overflows. Auto Handoff proactively relays to a fresh window at **75%** — triggered by `scripts/check_context.py` reading real API usage from the session transcript (precise measurement, not model self-estimation):

```
  Old session (context ≥ 75%)                  New session (context ≈ 14%)
  ┌───────────────────────────┐                ┌───────────────────────────┐
  │ check_context.py measures │                │ HANDOFF.md is the prompt  │
  │          │                │                │          │                │
  │ Five plan files +         │   tmux window  │ Reads STATE.md etc.       │
  │ HANDOFF.md written        │ ───spawn────▶  │ in order                  │
  │          │                │                │          │                │
  │ tmux new-window relay     │                │ Resumes from Next Action  │
  │ Old window wraps up       │                │ Continues as if nothing   │
  └───────────────────────────┘                └───────────────────────────┘
```

Four design points:

- **User control**: automation is opt-in — pick "hand off and remember" in the dialog; the preference is written to STATE.md and inherited by the successor; `--no-auto-handoff` exits anytime
- **Runaway guard**: `--handoff-max` (default 3) caps relay generations, preventing infinite relay loops
- **Traceable**: the nested session starts with `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` so it stays resumable via `--resume`
- **Verified end-to-end**: real tmux spawn → new session reads HANDOFF.md → resumes from Next Action

It is the proactive sibling of STATE.md recovery: STATE.md answers "how to resume after a crash", Auto Handoff answers "when to proactively switch windows".

### 5. Quantitative Prompt Scoring

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

### 6. Fallback Protocol — Plan-First Error Handling

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
- Auto Handoff — 75% automatic context relay (tmux spawn, verified end-to-end)
- Auto-Decide Layer with 6 principles
- Ralph Loop integration (stop-hook + auto-iterate dual-layer iteration)
- Johari Window-based prompt scoring

## Changelog

### v1.3.0 (2026-08-28)

**flow-deep**
- Added **Auto Handoff (75% automatic context relay)** — the Context Guard dialog gains a "hand off and remember" option (armed state written to STATE.md, inherited by successor sessions); when armed, boundary measurements ≥ 75% relay automatically without prompting: five plan files + HANDOFF.md → tmux new-window spawn of the successor session (`CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` keeps nested sessions resumable)
- Added `--no-auto-handoff` / `--handoff-max N` flags (relay cap defaults to 3 generations to prevent infinite loops)
- Constitution principle #4 amended: from "ask, never auto-handoff" to "prompt with a rememberable choice"
- Chain verified end-to-end: real tmux spawn → new session reads HANDOFF.md → resumes from Next Action

**multi-agent**
- Added **Fast Path risk routing** — routes by task nature (read-only vs write) before dispatching: one-phrase fan-outs (research / review / comparison) go through shard decomposition + informational preview + direct batched dispatch + shard-checklist verification, while write tasks still run the full Step 0-5 flow; the routing decision requires an explicit anchor line (`路由判定: 只读 → Fast Path`), and the ≤2 concurrency hard cap stays unchanged
- Trigger words aligned with official Tips and Chinese colloquial phrasing ("fan out subagents", "派团队", "扇出", etc.)
- Agent mapping table rewritten to **dynamic-discovery-first** (the old voltagent plugin mappings are dead; anything not in the available list degrades to general-purpose) — fixing broken Agent calls caused by copying the old table

### v1.2.1 (2026-08-21)

**multi-agent / flow / flow-deep**
- **Softened the hard tmux dependency** — execution mode is now environment-adaptive dual-mode: with tmux it runs the tmux-split team layout; without tmux it **silently degrades** to same-message concurrent agents (no install prompt, no retry request)
- The degraded mode keeps the scale-tier hard constraint (≤ 4 concurrent per message against 429) and the Delegate coordination protocol; pane cleanup steps are skipped automatically
- Why: tmux is a visualization enhancement, not a capability prerequisite — most environments simply don't have it, and forcing a prompt interrupts the task flow

### v1.2.0 (2026-08-21)

**flow**
- Grilling adds **anti-interrogation rules** — incremental disclosure (state what judgment the last answer updated before each question), conclusion-changing criterion (only ask questions whose answers could change the conclusion), explicit stopping (stop as soon as information suffices, never pad the count); absorbed from Socratic questioning to fix "endless grilling exhausts the user"
- Requirements exploration closing adds a **six-part consultation summary** — original question / real problem / confirmed facts / unverified assumptions / key variables / an accurate actionable new question, handing later Stages a clarified question instead of scattered Q&A
- Three-role discussion upgraded — each role states four items (adding a **falsifiability declaration**: what new evidence would change its judgment); round two surfaces the **disagreement triad** (shared facts / real disagreements / underlying assumptions) before synthesizing; unresolved disagreements are recorded explicitly instead of being prematurely smoothed over

**prompt**
- Added **interaction pacing control** checklist (multi-turn conversational prompts) — delayed conclusions / one question at a time / anti-formalism / information-density criterion, covering the multi-turn quality dimension beyond Johari+3S

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
