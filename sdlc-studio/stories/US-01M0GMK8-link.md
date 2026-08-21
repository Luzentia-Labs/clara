# US-01M0GMK8: Link

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Link/**, packages/react/src/components/Link/verification.md
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a link that is distinguishable without relying on colour
**So that** I can tell a link from body text even if I cannot distinguish the colours

## Acceptance Criteria

### AC1: Not colour alone

- **Given** a Link in body text
- **When** it renders
- **Then** an underline or other non-colour affordance distinguishes it
- **Verify:** vitest "Link is distinguishable without colour"
- **Verification target:** functional

### AC2: External links are announced

- **Given** a Link to an external target
- **When** it renders
- **Then** the external destination is conveyed to assistive technology, not only by an icon
- **Verify:** vitest "external Link is announced"
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Link stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell pnpm lint:css
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Link
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Link theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Link story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Link/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Link

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
