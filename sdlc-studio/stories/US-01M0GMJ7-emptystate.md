# US-01M0GMJ7: EmptyState

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/EmptyState/**, packages/react/src/components/EmptyState/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** an empty state that distinguishes no-data-yet from no-results
**So that** I know whether to add a record or clear my filter

## Acceptance Criteria

### AC1: Two distinct cases

- **Given** an EmptyState
- **When** it renders
- **Then** documented guidance and distinct content separate 'no data yet' from 'no results for this filter'
- **Verify:** vitest "EmptyState distinguishes empty from filtered"
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the EmptyState stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a EmptyState
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "EmptyState theme and density matrix"
- **Verification target:** functional

### AC4: Definition of done

- **Given** the EmptyState story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/EmptyState/index.tsx
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- EmptyState

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
