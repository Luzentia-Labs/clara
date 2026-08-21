# US-01M0GMQT: RadioGroup

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM2
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/components/RadioGroup/**, packages/react/src/components/RadioGroup/verification.md
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a radio group with correct roving focus
**So that** arrow keys move between options as a screen reader user expects

## Acceptance Criteria

### AC1: Roving focus

- **Given** a RadioGroup
- **When** I tab in and press arrow keys
- **Then** the group is one tab stop and arrows move and select per WAI-ARIA
- **Verify:** vitest "RadioGroup roving focus"
- **Verification target:** functional

### AC2: Radio only exists in a group

- **Given** the public API
- **When** I inspect it
- **Then** Radio is not exported for standalone use outside RadioGroup
- **Verify:** shell ! grep -qE "export.*Radio" packages/react/etc/clara-react.api.md
- **Verification target:** functional

### AC3: Group error

- **Given** a RadioGroup in error
- **When** it renders
- **Then** the error associates with the group, not an individual option
- **Verify:** vitest "RadioGroup error associates with group"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the RadioGroup stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell pnpm lint:css
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a RadioGroup
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "RadioGroup theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the RadioGroup story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/RadioGroup/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- RadioGroup

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
