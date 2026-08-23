# US-01M0GMKS: Tabs

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK5K
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Tabs/**, packages/react/src/components/Tabs/verification.md
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** tabs implementing the WAI-ARIA pattern with lazy panels
**So that** switching sections does not lose what I typed

## Acceptance Criteria

### AC1: Tabs pattern

- **Given** a Tabs set
- **When** I use arrow keys
- **Then** navigation follows the WAI-ARIA tabs pattern in both automatic and manual activation modes
- **Verify:** vitest "Tabs keyboard pattern both activation modes"
- **Verification target:** functional

### AC2: Lazy mounting preserves state

- **Given** a lazily-mounted panel
- **When** I switch away and back
- **Then** content state is preserved
- **Verify:** vitest "Tabs preserve panel state across switches"
- **Verification target:** functional

### AC3: Active state is not colour alone

- **Given** the active tab
- **When** it renders
- **Then** an indicator beyond colour marks it
- **Verify:** vitest "Tabs active state is not colour alone"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Tabs stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Tabs
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Tabs theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Tabs story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Tabs/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Tabs

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
