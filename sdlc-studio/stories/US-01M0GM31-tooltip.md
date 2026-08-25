# US-01M0GM31: Tooltip

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** e2e/stacking.spec.ts, packages/react/src/components/Tooltip/**, packages/react/src/components/Tooltip/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a tooltip reachable by keyboard as well as pointer
**So that** the explanation is not invisible to the people most likely to need it

## Acceptance Criteria

### AC1: Keyboard reachable

- **Given** a Tooltip trigger
- **When** I focus it with the keyboard
- **Then** the tooltip appears on focus as well as hover
- **Verify:** vitest "Tooltip appears on keyboard focus"
- **Verification target:** functional

### AC2: Escape dismissible and hover-safe

- **Given** an open Tooltip
- **When** I press Escape, or move the pointer toward the tooltip
- **Then** it dismisses on Escape and remains visible while the pointer travels to it
- **Verify:** vitest "Tooltip escape and hover bridge"
- **Verification target:** functional

### AC3: Never the sole source

- **Given** any Tooltip
- **When** it carries content
- **Then** the same information is available elsewhere; a tooltip is never the only route to essential information
- **Verify:** manual audit tooltip content for sole-source information
- **Verification target:** conversational

### AC4: Token-only styling

- **Given** the Tooltip stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Tooltip
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Tooltip theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Tooltip story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Tooltip
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

### AC7: Above a toast, because it describes what is on top

- **Given** a Toast carrying an action
- **When** a Tooltip on that action opens
- **Then** the tooltip paints above the toast
- **Verify:** shell pnpm test:e2e -g "a tooltip on a toast action paints above it"
- **Verification target:** functional

> D0102. The two tokens share one layer and OPEN ORDER decides, so this criterion and Toast's AC7
> are the two directions of one mechanism - neither is meaningful without the other. Assert with
> `document.elementFromPoint` inside the overlap, not by comparing computed `z-index` values: D0065
> records what asserting a proxy for the property cost last time, and here the two elements have
> the SAME z-index by design, so a comparison would prove nothing.
>
> **Inherited constraints.** The Tooltip stylesheet takes `z-index` from
> `var(--clara-layer-tooltip)`, and the component sets no `z-index` in JavaScript - a computed
> number in an inline style is the one shape `check-component-css.mjs` cannot see.

## Scope

### In Scope

- Tooltip

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
