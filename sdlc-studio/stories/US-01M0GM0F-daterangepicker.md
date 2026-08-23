# US-01M0GM0F: DateRangePicker

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/reference-app/src/screens/List.tsx, packages/react/src/components/DateRangePicker/**, packages/react/src/components/DateRangePicker/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a start and end date with common period presets
**So that** selecting last quarter takes one click rather than two calendar hunts

## Acceptance Criteria

### AC1: Range selection

- **Given** a DateRangePicker
- **When** I select a start and end
- **Then** both are captured and the range is announced
- **Verify:** vitest "DateRangePicker range selection"
- **Verification target:** functional

### AC2: Presets

- **Given** a DateRangePicker
- **When** I open the presets
- **Then** this month, last quarter and year to date are available and keyboard reachable
- **Verify:** vitest "DateRangePicker presets are keyboard reachable"
- **Verification target:** functional

### AC3: Consumed by the reference app

- **Given** the F31 list screen
- **When** its filter bar renders
- **Then** it uses DateRangePicker, satisfying the consuming-need rule
- **Verify:** file apps/reference-app/src/screens/List.tsx
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DateRangePicker stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a DateRangePicker
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "DateRangePicker theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the DateRangePicker story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/DateRangePicker/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- DateRangePicker

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
