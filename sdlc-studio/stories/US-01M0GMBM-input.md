# US-01M0GMBM: Input

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Input/**, packages/react/src/components/Input/verification.md
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a text input with prefix, suffix, clear and counter affordances
**So that** I can enter data all day without the control fighting me

## Acceptance Criteria

### AC1: Affordances

- **Given** an Input
- **When** I configure it
- **Then** prefix, suffix, clearable and a character counter all render and are keyboard reachable
- **Verify:** vitest "Input affordances"
- **Verification target:** functional

### AC2: Readonly versus disabled

- **Given** an Input
- **When** it is readonly or disabled
- **Then** the two are visually distinct and readonly text stays at full contrast
- **Verify:** vitest "Input readonly is distinct from disabled and full contrast"
- **Verification target:** functional

### AC3: Native convention

- **Given** an Input
- **When** I control it
- **Then** value, defaultValue and onChange follow the native React convention receiving the native event (D0022 shape rule)
- **Verify:** vitest "Input uses native change convention"
- **Verification target:** functional

### AC4: Autofill survives

- **Given** an Input
- **When** the browser autofills it
- **Then** the token-driven appearance is preserved in Chrome and Safari
- **Verify:** manual verify autofill styling in Chrome and Safari
- **Verification target:** conversational

### AC5: Token-only styling

- **Given** the Input stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC6: Both themes and densities

- **Given** a Input
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Input theme and density matrix"
- **Verification target:** functional

### AC7: Definition of done

- **Given** the Input story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Input/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Input

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
