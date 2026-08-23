# US-01M0GM1R: Status in a dense list pattern

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/patterns/status-in-lists.md, packages/react/src/components/Status/index.tsx, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** a documented pattern for row status that does not tint rows
**So that** four statuses in two hundred rows stay scannable and survive black and white printing

## Acceptance Criteria

### AC1: Column, not tint

- **Given** the pattern
- **When** a status is shown
- **Then** it uses a status column with icon and short label; a tinted row is explicitly rejected
- **Verify:** grep "status column" apps/docs/src/content/patterns/status-in-lists.md
- **Verification target:** functional

### AC2: Colour reinforces only

- **Given** a status row
- **When** colour is removed
- **Then** the status is still fully readable
- **Verify:** vitest "status pattern readable without colour"
- **Verification target:** functional

### AC3: Numeric conventions

- **Given** a negative or credit figure
- **When** it renders
- **Then** the convention does not depend on red
- **Verify:** vitest "negative and credit conventions do not rely on red"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Status in a dense list pattern stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Status in a dense list pattern
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Status in a dense list pattern theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Status in a dense list pattern story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/Status/index.tsx
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Status in a dense list pattern

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
