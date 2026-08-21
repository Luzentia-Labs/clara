# US-01M0GMKM: Patterns section

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/patterns/**, apps/docs/src/content/patterns/index.md
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** the composite ERP patterns Clara does not ship as components documented
**So that** I build a list-detail screen the same way twice

## Acceptance Criteria

### AC1: Patterns are covered

- **Given** the section
- **When** I read it
- **Then** form layout, list-detail, bulk actions, destructive confirmation, filtering and status-in-a-dense-list are all documented
- **Verify:** file apps/docs/src/content/patterns/index.md
- **Verification target:** functional

### AC2: Grounded in the reference app

- **Given** each pattern
- **When** I read it
- **Then** it points at the reference application screen that demonstrates it
- **Verify:** grep "reference-app" apps/docs/src/content/patterns/index.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Patterns section

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
