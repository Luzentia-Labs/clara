# US-01M0GMAG: Checkbox

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Checkbox/**, packages/react/src/components/Checkbox/verification.md, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** a checkbox whose state is unmistakable including partial selection
**So that** I can tell selected from partially-selected at a glance in a table header

## Acceptance Criteria

### AC1: Indeterminate is correct

- **Given** an indeterminate Checkbox
- **When** a screen reader reads it
- **Then** aria-checked is mixed
- **Verify:** vitest "Checkbox indeterminate is aria-checked mixed"
- **Verification target:** functional

### AC2: Not colour alone

- **Given** a checked Checkbox
- **When** it renders
- **Then** a mark and shape convey the state, not colour alone
- **Verify:** vitest "Checkbox state is not colour alone"
- **Verification target:** functional

### AC3: Label is a target

- **Given** a Checkbox with a label
- **When** I click the label
- **Then** the control toggles, and the hit area is at least 24x24px in compact
- **Verify:** vitest "Checkbox label is a click target"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Checkbox stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Checkbox
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Checkbox theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Checkbox story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Checkbox/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Checkbox

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
