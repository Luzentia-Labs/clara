# US-01M0GM48: Modal

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Modal/**, packages/react/src/components/Modal/verification.md
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a dialog that traps focus and returns me exactly where I was
**So that** keyboard navigation never strands me behind a closed dialog

## Acceptance Criteria

### AC1: Named focus targets

- **Given** a Modal
- **When** it opens
- **Then** focus moves to its named initial target, not to the document body
- **Verify:** vitest "Modal initial focus target"
- **Verification target:** functional

### AC2: Restoration per route

- **Given** an open Modal
- **When** it closes by Escape, outside click, close button, or successful commit
- **Then** focus returns to the named restoration target on every route, asserted by element identity
- **Verify:** vitest "Modal focus restoration per dismissal route"
- **Verification target:** functional

### AC3: Background is inert

- **Given** an open Modal
- **When** I tab repeatedly
- **Then** focus never reaches background content, which is marked inert
- **Verify:** vitest "Modal marks background inert"
- **Verification target:** functional

### AC4: No scrollbar shift

- **Given** a Modal
- **When** it opens on a scrollable page
- **Then** scroll lock causes no layout shift
- **Verify:** vitest "Modal scroll lock causes no shift"
- **Verification target:** functional

### AC5: Content scrolls internally

- **Given** a Modal with long content
- **When** it renders
- **Then** the body scrolls while header and footer stay fixed
- **Verify:** vitest "Modal body scrolls internally"
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Modal stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Modal
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Modal theme and density matrix"
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Modal story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Modal/verification.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Modal

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
