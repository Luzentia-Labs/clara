# US-01M0GMJ8: Combobox

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Combobox/**, packages/react/src/components/Combobox/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a filterable picker that loads options asynchronously
**So that** I can find one customer among thousands by typing, not scrolling

## Acceptance Criteria

### AC1: Combobox pattern

- **Given** an open Combobox
- **When** I type to filter
- **Then** the WAI-ARIA combobox pattern holds, including aria-activedescendant tracking the highlighted option
- **Verify:** vitest "Combobox WAI-ARIA pattern"
- **Verification target:** functional

### AC2: Async states

- **Given** a Combobox with an async source
- **When** the source is loading, empty, or failing
- **Then** distinct loading, empty and error states render and are announced
- **Verify:** vitest "Combobox async loading empty error states"
- **Verification target:** functional

### AC3: Option ceiling

- **Given** a Combobox given more local options than the documented ceiling
- **When** it renders
- **Then** a development warning directs the consumer to async loading; client-side virtualization is v1.1 (D0019)
- **Verify:** vitest "Combobox warns above local option ceiling"
- **Verification target:** functional

### AC4: Option groups

- **Given** a Combobox with grouped options
- **When** it renders
- **Then** role=group with accessible group labels
- **Verify:** vitest "Combobox option groups"
- **Verification target:** functional

### AC5: Inside a scrollable table

- **Given** a Combobox in a scrollable Table cell
- **When** it opens
- **Then** the listbox is not clipped and stays anchored on scroll
- **Verify:** vitest "Combobox inside scrollable container"
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Combobox stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Combobox
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "Combobox theme and density matrix"
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Combobox story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component Combobox
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Combobox

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
