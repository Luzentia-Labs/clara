# US-01M0GMN0: F00 foundations pass: decide the visual language

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** design/foundations.md
> **Points:** 8

## User Story

**As a** Maintainer
**I want** Clara's visual identity decided inside a fixed five-day box
**So that** F01 has real values to build on and the pass cannot become the project

## Acceptance Criteria

### AC1: Every deliverable is recorded

- **Given** the five-day window
- **When** the pass ends
- **Then** neutral ramp and temperature, accent hue, colour space, radius character, border weight, elevation expression, two-part focus spec, type scale, motion, and the pairing table are all in `design/foundations.md`
- **Verify:** file design/foundations.md
- **Verification target:** functional

### AC2: Values are token-ready

- **Given** the recorded decisions
- **When** F01 begins
- **Then** every value is expressed as a tier 1 token
- **Verify:** grep "clara-" design/foundations.md
- **Verification target:** functional

### AC3: Compact floors are fixed

- **Given** compact density
- **When** the pass ends
- **Then** a minimum internal padding and a minimum adjacent-target spacing are stated, not only the 24x24 target floor
- **Verify:** grep "minimum internal padding" design/foundations.md
- **Verification target:** functional

### AC4: The box holds

- **Given** day six
- **When** the pass is not satisfied
- **Then** component work begins regardless (D0004)
- **Verify:** manual confirm component work started on schedule
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- F00 foundations pass: decide the visual language

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
