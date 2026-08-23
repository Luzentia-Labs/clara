# US-01M0GM69: Button

> **Status:** Draft
> **Plan:** PL-01M0J6TB
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Button/**, packages/react/src/components/Button/verification.md
> **Points:** 5

> **NOT READY - do not start.** `PL-01M0J6TB` checked this story's prerequisites against the
> running build: 8 depend-on stories are Draft, 9 of the 10 tier 2 token families F07 enumerates do
> not exist, `pnpm lint:css` (AC6's verifier) is not a script, and no `@layer` appears in any
> emitted stylesheet. ~42 points sit on the critical path first.
>
> **The one that cannot be deferred is US-01M0GM16 (cascade layers).** Button is the first
> component; AGENTS.md states `@layer` cannot be retrofitted without silently changing specificity
> for every consumer override in existence. CSS shipped outside the layer is permanently wrong.

## User Story

**As a** Grace Adeyemi
**I want** a button whose importance and state are immediately readable
**So that** I know what the primary action on a screen is and whether it is available

## Acceptance Criteria

### AC1: Variants and sizes

- **Given** a Button
- **When** I set variant and size
- **Then** primary, secondary, ghost and danger render at sm, md and lg, md matching the density control height
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Button variants and sizes"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Loading preserves width

- **Given** a Button
- **When** it enters the loading state
- **Then** interaction is disabled, width is preserved so there is no layout shift, and aria-busy is set
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Button loading preserves width"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Disabled stays focusable

- **Given** a disabled Button
- **When** a keyboard user tabs to it
- **Then** it uses aria-disabled, remains in the tab order, announces as disabled, and does nothing on activation (D0022)
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "disabled Button is focusable and announces"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Focus indicator survives every surface

- **Given** a focused Button
- **When** it renders on each enumerated surface
- **Then** the two-part indicator meets 3:1 against the control and its surround on all of them, asserted by computation
- **Verify:** shell node scripts/check-contrast.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Renders as anchor

- **Given** a Button with as="a" and href
- **When** it renders
- **Then** it produces an anchor with correct role semantics
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Button renders as anchor"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Button stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Button
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** shell npx vitest run packages/react/src/components/__tests__/matrix.test.tsx -t "Button theme and density matrix"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Button story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** file packages/react/src/components/Button/verification.md
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Button

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
| 2026-08-21 | sdlc-studio | Planned as PL-01M0J6TB. Held at Draft: readiness check found 8 Draft prerequisites, 9 missing tier 2 families, a non-existent AC6 verifier, and no cascade layer. AC8's verifier flagged as a weak-verifier instance. |
