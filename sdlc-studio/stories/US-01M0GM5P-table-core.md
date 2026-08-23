# US-01M0GM5P: Table core

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Table/**, packages/react/src/components/Table/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a semantic table with correct alignment and first-class loading, empty and error states
**So that** I can scan a column of figures without losing my place

## Acceptance Criteria

### AC1: Semantic markup

- **Given** a Table
- **When** it renders
- **Then** a real table element with caption, thead, and th scope correctly applied
- **Verify:** vitest "Table semantic markup"
- **Verification target:** functional

### AC2: Numeric alignment

- **Given** a numeric column
- **When** it renders
- **Then** it is right-aligned with tabular numerals by default
- **Verify:** vitest "Table numeric columns are tabular and right aligned"
- **Verification target:** functional

### AC3: States are first-class

- **Given** a Table
- **When** its data is loading, empty or failed
- **Then** the Table renders each state itself rather than leaving it to the consumer
- **Verify:** vitest "Table loading empty and error states"
- **Verification target:** functional

### AC4: Striping is opt-in

- **Given** a Table
- **When** it renders by default
- **Then** rows are separated by a border token, not zebra striping
- **Verify:** vitest "Table striping is off by default"
- **Verification target:** functional

### AC5: Overflow is contained

- **Given** a wide Table
- **When** it renders
- **Then** horizontal overflow scrolls inside the table container and the page body never scrolls horizontally
- **Verify:** vitest "Table contains horizontal overflow"
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Table core stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Table core
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Table core theme and density matrix"
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Table core story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Table
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Table core

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
