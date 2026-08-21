# US-01M0GMJX: Reduced motion support

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKVE
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/foundations/motion.md, packages/tokens/src/semantic/motion.json
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** prefers-reduced-motion honoured library-wide
**So that** motion never becomes a barrier for people it makes unwell

## Acceptance Criteria

### AC1: Non-essential motion is disabled

- **Given** any animated component
- **When** prefers-reduced-motion is set
- **Then** non-essential animation is disabled without losing the information the motion carried
- **Verify:** vitest "reduced motion disables non-essential animation"
- **Verification target:** functional

### AC2: Motion has a stated purpose

- **Given** the motion tokens
- **When** I read the docs
- **Then** what motion is permitted to communicate under principle 1 is stated
- **Verify:** grep "motion" apps/docs/src/content/foundations/motion.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Reduced motion support

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
