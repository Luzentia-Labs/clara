# US-01M0GMC6: Density modes with computed geometry assertions

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/theme/**, packages/tokens/src/semantic/density.json
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** comfortable and compact density with floors that are computed rather than eyeballed
**So that** density never degrades into crowding, and a wrong value cannot pass by being unchanged

## Acceptance Criteria

### AC1: Control heights

- **Given** each density
- **When** a control renders
- **Then** comfortable is 40px and compact is 32px, asserted by computed style
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "control heights per density"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Target size floor

- **Given** compact density
- **When** any interactive target renders
- **Then** its bounding box is at least 24x24px
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "target size floor in compact"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Type floor

- **Given** either density
- **When** body text renders
- **Then** it is at least 14px; nothing renders below 12px and 12px is metadata only
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "type floor holds"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Padding and spacing floors

- **Given** compact density
- **When** adjacent interactive targets render
- **Then** the minimum internal padding and adjacent-target spacing fixed in F00 both hold
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "D0037"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Scoped density

- **Given** a ClaraScope with compact density
- **When** it renders inside a comfortable page
- **Then** only the scoped subtree and its portals are compact
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "density scopes to subtree"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Density modes with computed geometry assertions

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
