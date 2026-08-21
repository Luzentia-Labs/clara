# US-01M0GMA6: Automated accessibility harness and gate

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKVE
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/accessibility/index.md, packages/react/src/**/*.test.tsx, scripts/check-a11y-coverage.mjs
> **Points:** 3

## User Story

**As a** Maintainer
**I want** an axe assertion for every component wired into a blocking gate
**So that** the automated floor is real, while never being mistaken for a conformance claim

## Acceptance Criteria

### AC1: Every component asserted

- **Given** the component set
- **When** the suite runs
- **Then** each has an axe assertion covering its default and error states
- **Verify:** shell node scripts/check-a11y-coverage.mjs
- **Verification target:** functional

### AC2: Zero serious or critical

- **Given** all stories
- **When** the suite runs
- **Then** no violation at serious or critical severity; CI fails on any
- **Verify:** vitest "axe zero serious or critical"
- **Verification target:** functional

### AC3: Not a conformance claim

- **Given** the docs
- **When** a reader looks for the basis of the AA claim
- **Then** automation is documented as a floor that proves attributes are present and nothing more
- **Verify:** grep "attributes are present" apps/docs/src/content/accessibility/index.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Automated accessibility harness and gate

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
