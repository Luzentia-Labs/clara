# US-01M0GMRK: Select

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Select/**, packages/react/src/components/Select/verification.md
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a select for short, known option sets
**So that** picking from a handful of options is fast and predictable

## Acceptance Criteria

### AC1: Listbox pattern

- **Given** an open Select
- **When** I use the keyboard
- **Then** aria-expanded, aria-controls, aria-activedescendant and the listbox and option roles are all correct
- **Verify:** vitest "Select listbox pattern"
- **Verification target:** functional

### AC2: Full keyboard operation

- **Given** a Select
- **When** I use only the keyboard
- **Then** arrows move, Enter selects, Escape closes and restores, Home and End jump, Tab commits
- **Verify:** vitest "Select keyboard operation"
- **Verification target:** functional

### AC3: Composite value convention

- **Given** a Select
- **When** I control it
- **Then** value, defaultValue and onValueChange receive the value itself rather than an event
- **Verify:** vitest "Select uses onValueChange"
- **Verification target:** functional

### AC4: Works inside a Modal

- **Given** a Select inside an open Modal
- **When** it opens
- **Then** the listbox renders above the modal without clipping
- **Verify:** vitest "Select inside Modal"
- **Verification target:** functional

### AC5: Token-only styling

- **Given** the Select stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell pnpm lint:css
- **Verification target:** functional

### AC6: Both themes and densities

- **Given** a Select
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Select theme and density matrix"
- **Verification target:** functional

### AC7: Definition of done

- **Given** the Select story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Select/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Select

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
