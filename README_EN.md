# FlowKit

> **📝 Blog Deep Dive**: [FlowKit: AI-Native Workflow Orchestration Toolkit](https://michaelmaomao.github.io/2026/05/05/FlowKit-AI%E5%8E%9F%E7%94%9F%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%BC%96%E6%8E%92%E5%B7%A5%E5%85%B7%E9%9B%86/) — Design motivation, core architecture, decision trade-offs and lessons learned

> AI-native workflow orchestration toolkit — structured pipelines from task analysis to verified delivery, with 75% automatic context relay keeping long tasks alive across sessions.

English | **[中文](README.md)**

![FlowKit multi-agent tmux in action](docs/images/multi-agent-tmux.jpg)

> Live session — the main session fans out a shard checklist while multiple agents build in parallel across tmux panes; the status bar underneath is [glm-quota-hud](https://github.com/FrizzleFur/glm-quota-hud) watching GLM quota and context headroom in real time.

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
| **[auto-skill](skills/auto-skill/SKILL.md)** | Cross-session memory | Stage -1 recall + Stage 5.8 distillation — experience loop (personal data stays local; repo ships protocol & skeleton only) |

## Showcase

### Multi-Agent Parallel Execution

The hero image is a real work session: the main session breaks out a fan-out shard checklist (`Wave2 P0 fan-out (7/11)`), and each agent digs deep in its own context — a single agent ran 11 minutes straight to deliver one complete batch, while the main session only orchestrates, integrates, and verifies. tmux split panes are a visualization enhancement: without tmux, execution silently degrades to pane-free concurrency with zero capability loss.

### Companion Tool: glm-quota-hud — a Quota Dashboard in Your Status Bar

Parallel agents burn quota fast. The status bar in the hero image — `V1 🔥 95% | mcp23% | 📈21.4%/h ⚠3:19` — is [glm-quota-hud](https://github.com/FrizzleFur/glm-quota-hud) in action: GLM Coding Plan dual-account quota (5h windows / weekly credit pools / rate forecasting / depletion countdowns) pinned to the Claude Code status bar, so you see the 429 before it hits:

![glm-quota-hud status bar](docs/images/glm-hud.jpg)

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
cp -r skills/auto-skill ~/.claude/skills/
```

Invoke in Claude Code:

```
/flow refactor the authentication module
/flow-deep redesign the payment system for multi-currency support
/prompt evaluate this prompt: "write a sorting algorithm"
```

## Multi-Platform Support (new in v1.6.1)

The full flowkit family now runs on **OpenAI Codex CLI**, with zero impact on the Claude Code experience:

| Platform | Invocation | Adaptation |
|----------|-----------|------------|
| Claude Code | `/flow` | Native mechanisms, unchanged |
| Codex CLI | `$flow` | Built-in `codex-compat.md` layer per skill (mechanism mapping: AskUserQuestion→numbered options, Plan Mode→plan presentation + manual toggle, Task system→.plan file protocol, Agent→spawn_agent tool family) |
| DeepSeek dsh | `/flow` | Natively isomorphic (ask_user_question / exit_plan_mode / hooks.json reuse); theoretically works, not yet field-tested |

To install on Codex: symlink or copy each skill folder under `skills/` into `~/.agents/skills/` (the Codex USER-level skill directory). The SKILL.md format follows the open [agentskills.io](https://agentskills.io) standard.

Design principles: frontmatter and descriptions are untouched (CC triggering behavior is unaffected); adaptation content lives in reference files loaded via progressive disclosure only on non-CC platforms; missing Codex interaction primitives are degraded-and-simulated rather than dropped.

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
- Loop Memory three-tier records (TSV logs history / memory stores future rules / experience bank for global distillation) + on-the-loop mid-run async steering
- Johari Window-based prompt scoring

## Changelog

> Full version history (since v1.0.0) lives in [CHANGELOG.md](CHANGELOG.md). The Chinese entries are authoritative; version numbers and module names are shared across languages.

### v1.8.0 (2026-09-10)

**Loops layer (first step of graph-loop adoption) + flow-deep environment degradation protocol**
- New **Loops layer** — `evals/loops/` two loop contracts + CI cron trigger: repo-integrity-loop (weekly automated lint, the first mounted scheduled loop of the whole system; no-op is a valid run) and brain-integrity-loop (local shared-brain watchdog, mounting up to the user); signal registry makes five cross-loop edges explicit — tasks and loops are orthogonal kinds of being; start single-layer, no evolve
- flow-deep **environment degradation protocol** — unified 3-step degradation for non-interactive channels (subagent/headless/Ralph) and missing dependencies; driven by T-301 three-arm behavioral evals, verified by iteration-2 regression
- Constitution Gates timing clarified + Stage 2 ordering note + TOC added to three large references

### v1.7.0 (2026-09-09)

**Evals system + single source of truth (regression test net for skills themselves)**
- New **three-layer evals** (L0 static assertions / L1 trigger / L2 behavioral) — filling the gap of "the pipeline verifies everything except itself"; five anti-drift rules + environment-triple discipline (`evals/README.md`)
- **lint 7 assertions + GitHub Actions CI gate** — reference integrity, codex-compat bidirectional consistency, frontmatter consistency added; zero LLM cost; first run caught 3 real defects
- **flow-deep behavioral evals (T-301)** — 3 task types × single-arm × Stage-3-checkpoint truncation, 24 machine assertions all green establishing the green baseline (`benchmarks/iteration-1.json`)
- **check_context.py window fix** (first harvest from evals) — resolution chain: explicit > FLOWKIT_CONTEXT_WINDOW > ANTHROPIC_MODEL inference > default; measured false alarm 96% → 19%
- **Single source of truth migration** — this repo is now the canonical home of the 5 core skills; `~/.claude/skills` switched to reverse symlinks, ending three-way copy drift; per-skill README guides open-sourced along the way
- **T-302 trigger eval arena** — near-miss zero false triggers across rounds; explicit-command anchoring adopted as product decision

### v1.6.1 (2026-09-08)

**Family-wide multi-platform adaptation (Codex CLI)**
- flow / multi-agent / prompt / auto-skill gain a "Platform Compatibility" section + a `codex-compat.md` adaptation layer — usable in OpenAI Codex CLI via the `$flow` prefix
- Four-piece mechanism mapping: AskUserQuestion→numbered plain-language options, Plan Mode approval→plan presentation + manual toggle, Task system→planning-with-files file protocol, Agent orchestration→spawn_agent tool family
- Zero impact on Claude Code: frontmatter/description untouched; adaptation content loaded via progressive disclosure only on non-CC platforms
- SKILL.md format shares the agentskills.io open standard — one entity, multi-platform symlinks

## Community

This project is shared and discussed on the [LINUX DO](https://linux.do) community. Feedback and discussion welcome.

## License

MIT
