# US-01M0GMWW: Drawer

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Drawer/**, packages/react/src/components/Drawer/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a side panel with the same focus guarantees as a dialog
**So that** a drawer is not a second-class dialog with weaker keyboard behaviour

## Acceptance Criteria

### AC1: Placements

- **Given** a Drawer
- **When** I set placement
- **Then** left, right and bottom all render correctly
- **Verify:** vitest "Drawer placements"
- **Verification target:** functional

### AC2: Focus parity with Modal

- **Given** a Drawer
- **When** it opens and closes by any route
- **Then** initial focus and restoration behave identically to Modal, asserted by identity
- **Verify:** vitest "Drawer focus parity with Modal"
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Drawer stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Drawer
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Drawer theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Drawer story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Drawer
- **Verification target:** functional

### AC6: Scroll lock without layout shift

- **Given** a Drawer that is open
- **When** the page behind it would otherwise scroll
- **Then** it does not, and locking the scroll causes no layout shift from the scrollbar being removed
- **And** this is asserted here rather than left to Modal AC4: a Drawer locks scroll for the same
  reason a Modal does, and an epic acceptance criterion owned by one of the two components is the
  "solved once or nine times" failure appearing at epic level (found by the foundation's spec review)
- **Verify:** vitest "Drawer locks scroll"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Drawer

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
