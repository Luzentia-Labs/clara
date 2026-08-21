# US-01M0GMNM: Story coverage gate

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** scripts/check-stories.mjs
> **Points:** 2

## User Story

**As a** Maintainer
**I want** CI to fail when a component is exported without stories
**So that** the visual baseline matrix and the docs cannot silently miss a component

## Acceptance Criteria

### AC1: Missing story fails

- **Given** an exported component with no story file
- **When** CI runs
- **Then** the build fails naming the component
- **Verify:** shell node scripts/check-stories.mjs
- **Verification target:** functional

### AC2: State coverage

- **Given** each story file
- **When** the check runs
- **Then** default, every variant, every size, disabled, loading, error and empty are covered where applicable
- **Verify:** shell node scripts/check-stories.mjs --states
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Story coverage gate

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
