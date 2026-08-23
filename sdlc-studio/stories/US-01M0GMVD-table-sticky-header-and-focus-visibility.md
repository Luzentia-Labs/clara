# US-01M0GMVD: Table sticky header and focus visibility

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Table/**, packages/react/src/components/Table/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a sticky header that never hides the row I am tabbing to
**So that** keyboard navigation down a long table does not lose the focused row behind the header

## Acceptance Criteria

### AC1: Sticky header and first column

- **Given** a scrollable Table
- **When** I scroll
- **Then** the header and optional first column stay visible
- **Verify:** vitest "Table sticky header and first column"
- **Verification target:** functional

### AC2: Focus not obscured

- **Given** a Table with a sticky header
- **When** I tab down through rows
- **Then** the focused row is never hidden beneath the sticky header, satisfying WCAG 2.2 2.4.11
- **Verify:** vitest "Table focus is not obscured by sticky header"
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Table sticky header and focus visibility stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Table sticky header and focus visibility
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Table sticky header and focus visibility theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Table sticky header and focus visibility story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Table/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Table sticky header and focus visibility

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
