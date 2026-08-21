# US-01M0GM3E: Accessibility statement and gap register

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKVE
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/accessibility/index.md
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a published statement naming conformance level, method, and every known gap
**So that** a gap that is not listed would be a claim of coverage

## Acceptance Criteria

### AC1: Statement is published

- **Given** the docs site
- **When** I visit the accessibility page
- **Then** conformance level, testing method and the gap register are all present
- **Verify:** file apps/docs/src/content/accessibility/index.md
- **Verification target:** functional

### AC2: NVDA gap named

- **Given** the register
- **When** I read it
- **Then** NVDA is named as unverified, with the reason, rather than implied by a general AA claim (D0016)
- **Verify:** grep "NVDA" apps/docs/src/content/accessibility/index.md
- **Verification target:** functional

### AC3: Forced-colors gap named

- **Given** the register
- **When** I read it
- **Then** forced-colors mode is named as untested for v1
- **Verify:** grep "forced-colors" apps/docs/src/content/accessibility/index.md
- **Verification target:** functional

### AC4: Register is current

- **Given** the register
- **When** a gap is closed or opened
- **Then** the page is updated in the same change
- **Verify:** manual confirm register updated alongside gap changes
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Accessibility statement and gap register

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
