# Goal Contract

Use this reference before prompt optimization, planning, execution, or verification.

## Purpose

Goal Contract prevents the agent from doing a lot of correct-looking work that misses the user's actual outcome.

## Minimal Template

```markdown
# Goal Contract

## Objective
[One sentence: what final outcome should be true?]

## Success Criteria
- [Observable, verifiable condition]
- [Observable, verifiable condition]

## Constraints
- [Files, behavior, compatibility, safety, or process limits]

## Non-goals
- [Adjacent work that should not be done]

## Verification Plan
- [Command, check, artifact, or human review needed]

## Execution Strategy
Serial / multi-agent / Workflow, with one sentence explaining why.
```

## Clarifying Ambiguous Goals

When the objective contains words like "better", "optimize", "clean up", "improve", "全面", "更好用", ask before planning.

Useful questions:
1. Which dimension matters most: user experience, performance, maintainability, reliability, security, SEO, deployment, or content quality?
2. What would convince you this is done: passing tests, faster build time, fewer errors, visual change, checklist report, or deployed result?
3. What should not change: public behavior, file structure, theme, deployment pipeline, tests, or article content?
4. Is this exploration only, implementation included, or implementation plus verification?

Prefer 2-4 concrete options with a recommended default. Avoid asking broad questions like "any other requirements?".

## Default Constraints for Test-Fix Tasks

For tasks like "fix tests", "make npm test pass", or "repair failing CI", include these constraints unless the user explicitly says otherwise:

- Do not skip, delete, or weaken failing tests to manufacture a pass.
- Do not hide failures by suppressing errors or lowering assertions.
- Identify the root cause before changing implementation.
- Keep the smallest change that makes the existing expected behavior pass.
- Verification must include the failing command and relevant targeted checks.

Suggested Success Criteria:
- The originally failing command passes.
- No tests were skipped, deleted, or weakened.
- The root cause is summarized.
- Relevant regression coverage exists or the original failing test is preserved.

## Execution Strategy Hints

| Situation | Strategy |
|---|---|
| Single file, low risk, reversible | Serial |
| Multiple independent implementation tasks | multi-agent |
| Multi-dimensional review or deterministic fan-out | Workflow |
| Shared-file parallel edits | Serial or Workflow with worktree isolation |

## Completion Contract

Stage 5 must convert Success Criteria into a Goal Verification table. If any criterion lacks evidence, the status is not DONE.
