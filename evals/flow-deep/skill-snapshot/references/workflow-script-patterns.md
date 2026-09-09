# Workflow Script Patterns

Use this reference when Stage 4 Execution Router selects Workflow as the execution backend.

## Input Contract

Workflow agents should consume clarified artifacts, not raw user intent:
- Goal Contract: objective, success criteria, constraints, non-goals, verification plan
- `task_plan.md`: phases, dependencies, files, completion criteria
- `findings.md`: research, assumptions, prior review results

If these artifacts disagree, stop and return to Stage 3 or Stage 0.5 before running Workflow.

## Pattern 1: Review Workflow

Use for performance, security, architecture, maintainability, or broad codebase audits.

Shape:
1. Fan out reviewers by dimension.
2. Merge and deduplicate findings.
3. Adversarially verify each high-impact finding.
4. Synthesize results against Goal Contract.

Best fit:
- Multi-dimensional audits
- Independent read-only analysis
- Findings need verification before reporting

Avoid when:
- The task is a single known issue
- The user only wants a quick explanation

## Pattern 2: Execution Workflow

Use for implementation or migration only when tasks are independent enough to avoid merge conflicts.

Shape:
1. Split plan into independent work items.
2. Use worktree isolation for parallel edits when conflicts are possible.
3. Verify each work item independently.
4. Merge or summarize results in dependency order.

Guardrails:
- Do not let multiple agents edit the same files in the same worktree.
- If dependencies are sequential, prefer current-session serial execution.
- If assumptions fail, return to Stage 3 Plan Fallback.

## Pattern 3: Verification Workflow

Use when success criteria require multiple independent checks.

Shape:
1. Convert each Success Criteria into a verification task.
2. Run evidence collection independently.
3. Mark each criterion as Pass, Fail, or Needs Review.
4. Return a Goal Verification table.

Best fit:
- Release readiness checks
- Refactor safety checks
- Multi-command validation
- Manual plus automated evidence collection

## Pattern 4: Loop-until-dry Workflow

Use when the unknown set of issues matters more than one pass of discovery.

Shape:
1. Run diverse finders.
2. Deduplicate against all previously seen findings.
3. Verify new findings.
4. Repeat until consecutive rounds produce no new verified findings.

Best fit:
- Bug hunts
- Security reviews
- Dead code discovery
- Migration completeness checks

Stop conditions:
- No new findings for the configured dry rounds
- Token or time budget reached
- Goal Contract says enough coverage has been achieved

## Common Mistakes

| Mistake | Correction |
|---|---|
| Running Workflow on single-file edits | Use Complexity Gate and choose serial execution |
| Feeding raw user prompt to Workflow agents | Feed Goal Contract and plan files instead |
| Treating findings as facts | Add adversarial verification |
| Parallel editing shared files without isolation | Use worktree isolation or serialize |
| Reporting activity instead of goal completion | End with Goal Verification table |
