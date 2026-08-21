# US-01M0GM66: Legal pairing table and the contrast gate

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/tokens/dist/tokens.pairings.json, packages/tokens/src/pairings.json, packages/tokens/test/contrast.test.ts
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** an enumerated pairing matrix that the contrast test iterates
**So that** the claim that every pairing meets AA is quantified over a set that actually exists

## Acceptance Criteria

### AC1: Matrix is generated

- **Given** the token build
- **When** it completes
- **Then** `tokens.pairings.json` contains every pairing documented in PRD Section 7
- **Verify:** file packages/tokens/dist/tokens.pairings.json
- **Verification target:** functional

### AC2: Thresholds are per role

- **Given** the contrast test
- **When** it runs
- **Then** 4.5:1 for text, 3:1 for large text, 3:1 for borders, icons, control boundaries and the focus indicator
- **Verify:** vitest "contrast thresholds per role"
- **Verification target:** functional

### AC3: Both themes are covered

- **Given** the matrix
- **When** the test runs
- **Then** every pairing is asserted in light and dark
- **Verify:** vitest "contrast in both themes"
- **Verification target:** functional

### AC4: Row count is asserted

- **Given** the generator
- **When** a pairing is silently dropped
- **Then** the test fails on the count mismatch rather than passing vacuously
- **Verify:** vitest "pairing row count matches documented table"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Legal pairing table and the contrast gate

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
