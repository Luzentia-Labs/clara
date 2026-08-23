# US-01M0GM82: Table selection

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Table/**, packages/react/src/components/Table/verification.md
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** row selection with a header select-all that shows partial state
**So that** I can act on a subset without losing track of what is selected

## Acceptance Criteria

### AC1: Select-all is indeterminate

- **Given** some rows selected
- **When** the header checkbox renders
- **Then** it is indeterminate with aria-checked=mixed
- **Verify:** vitest "Table select-all is indeterminate"
- **Verification target:** functional

### AC2: Selection precedence

- **Given** a row that is selected, hovered and focused
- **When** it renders
- **Then** surface precedence resolves focus > selected > hover > striped
- **Verify:** vitest "Table row surface precedence"
- **Verification target:** functional

### AC3: Count is announced

- **Given** the selection
- **When** it changes
- **Then** the selected count is announced
- **Verify:** vitest "Table announces selection count"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Table selection stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Table selection
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Table selection theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Table selection story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Table/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Table selection

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
