# US-01M0GMC1: DatePicker

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/components/DatePicker/**, packages/react/src/components/DatePicker/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** to type a date directly or pick it from a calendar, whichever is faster
**So that** entering a posting date is not slower than writing it on paper

## Acceptance Criteria

### AC1: Text entry is never disabled

- **Given** a DatePicker
- **When** I type a date
- **Then** direct text entry works and is never disabled in favour of the calendar
- **Verify:** vitest "DatePicker accepts direct text entry"
- **Verification target:** functional

### AC2: Format is discoverable

- **Given** a DatePicker
- **When** I look for the expected format
- **Then** it appears in the field description, not only the placeholder
- **Verify:** vitest "DatePicker format is in the description"
- **Verification target:** functional

### AC3: Calendar keyboard model

- **Given** an open calendar
- **When** I navigate by keyboard
- **Then** arrows move by day, PageUp and PageDown by month, Home and End to week bounds, Escape closes and restores
- **Verify:** vitest "DatePicker calendar keyboard navigation"
- **Verification target:** functional

### AC4: Focused date is announced

- **Given** an open calendar
- **When** focus moves
- **Then** the focused date and its month context are announced
- **Verify:** vitest "DatePicker announces focused date and month"
- **Verification target:** functional

### AC5: ISO string boundary

- **Given** the public API
- **When** I inspect the props
- **Then** value and onValueChange use ISO date strings; no @internationalized/date type reaches the surface (TRD ADR-008)
- **Verify:** shell ! grep -q "@internationalized" packages/react/etc/clara-react.api.md
- **Verification target:** functional

### AC6: Unavailable dates

- **Given** a DatePicker with min, max or a disabled-date predicate
- **When** I reach an unavailable date
- **Then** it is announced as unavailable rather than silently inert
- **Verify:** vitest "DatePicker announces unavailable dates"
- **Verification target:** functional

### AC7: Token-only styling

- **Given** the DatePicker stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC8: Both themes and densities

- **Given** a DatePicker
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "DatePicker theme and density matrix"
- **Verification target:** functional

### AC9: Definition of done

- **Given** the DatePicker story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/DatePicker/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- DatePicker

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
