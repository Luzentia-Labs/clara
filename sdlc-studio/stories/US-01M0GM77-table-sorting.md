# US-01M0GM77: Table sorting

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Table/**, packages/react/src/components/Table/verification.md, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** sortable column headers operable by keyboard
**So that** I can reorder by amount without reaching for the mouse

## Acceptance Criteria

### AC1: aria-sort

- **Given** a sortable header
- **When** it renders
- **Then** aria-sort reflects the current state and updates on change
- **Verify:** vitest "Table header aria-sort"
- **Verification target:** functional

### AC2: Keyboard operable

- **Given** a sortable header
- **When** I focus and activate it by keyboard
- **Then** the sort applies and the new order is announced
- **Verify:** vitest "Table sort is keyboard operable"
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Table sorting stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Table sorting
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Table sorting theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Table sorting story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Table/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Table sorting

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
