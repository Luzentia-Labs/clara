# US-01M0GMQ7: Inline

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/components/Inline/**, packages/react/src/components/Inline/index.tsx
> **Points:** 1

## User Story

**As a** Sofia Marchetti
**I want** horizontal layout with wrapping and token-scale gaps
**So that** rows of controls align consistently

## Acceptance Criteria

### AC1: Wraps predictably

- **Given** an Inline that overflows
- **When** it renders
- **Then** children wrap with the gap preserved on both axes
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Inline wraps preserving gap"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the Inline stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a Inline
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Inline theme and density matrix"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Definition of done

- **Given** the Inline story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/Inline/index.tsx
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Inline

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 1 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
