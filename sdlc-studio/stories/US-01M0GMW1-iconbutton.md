# US-01M0GMW1: IconButton

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/IconButton/**, packages/react/src/components/IconButton/verification.md
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** an icon-only button that cannot ship without an accessible name
**So that** an unlabelled icon button is impossible rather than merely discouraged

## Acceptance Criteria

### AC1: Label is required at the type level

- **Given** an IconButton
- **When** aria-label is omitted
- **Then** it is a TypeScript error, not a runtime warning
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "IconButton requires aria-label"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Hit area holds

- **Given** an IconButton in compact density
- **When** it renders
- **Then** the target is at least 24x24px even where the visual box is smaller
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "IconButton target size in compact"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the IconButton stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a IconButton
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "IconButton theme and density matrix"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the IconButton story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/IconButton/verification.md
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- IconButton

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
