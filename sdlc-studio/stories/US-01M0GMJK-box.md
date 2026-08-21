# US-01M0GMJK: Box

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/etc/clara-react.api.md, packages/react/src/components/Box/**, packages/react/src/components/Box/index.tsx
> **Points:** 2

## User Story

**As a** Sofia Marchetti
**I want** a constrained style surface for padding, background, border and radius
**So that** I can compose layout without writing ad-hoc CSS in every application

## Acceptance Criteria

### AC1: Token-constrained props

- **Given** a Box
- **When** I pass a spacing value
- **Then** only token scale values type-check; an arbitrary string is a TypeScript error
- **Verify:** vitest "Box spacing props are token-constrained"
- **Verification target:** functional

### AC2: Not a style escape hatch

- **Given** the Box API
- **When** I inspect it
- **Then** it exposes a constrained surface and does not accept arbitrary CSS
- **Verify:** shell ! grep -qE "css\?:|sx\?:" packages/react/etc/clara-react.api.md
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Box stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell pnpm lint:css
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Box
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Box theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Box story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/Box/index.tsx
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Box

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
