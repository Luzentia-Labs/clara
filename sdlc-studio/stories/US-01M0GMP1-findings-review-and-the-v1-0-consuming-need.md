# US-01M0GMP1: Findings review and the v1.0 consuming-need audit

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKV1
> **Serves:** Sofia Marchetti
> **Affects:** apps/reference-app/FINDINGS.md, scripts/reconcile.py, sdlc-studio/prd.md
> **Points:** 3

## User Story

**As a** Maintainer
**I want** the findings turned into component changes and every must-have row traced to a screen
**So that** the invented users in the PRD are replaced by evidence

## Acceptance Criteria

### AC1: Findings are triaged

- **Given** FINDINGS.md
- **When** the screens are complete
- **Then** every entry is filed as a bug or CR against the component that forced it
- **Verify:** shell python3 scripts/reconcile.py detect
- **Verification target:** functional

### AC2: Every row names a consumer

- **Given** the PRD feature inventory
- **When** the audit runs
- **Then** every must-have row names the reference screen that consumes it, or moves to v1.1 with a revival condition
- **Verify:** grep "Needed by" sdlc-studio/prd.md
- **Verification target:** functional

### AC3: Completion is gated

- **Given** any feature row
- **When** it is proposed as Complete for v1.0
- **Then** it is refused unless the reference application renders on it
- **Verify:** manual confirm no row marked Complete without reference-app usage
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Findings review and the v1.0 consuming-need audit

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
