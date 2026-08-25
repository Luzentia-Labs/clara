# US-01M0GMK1: Toast

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** e2e/stacking.spec.ts, packages/react/src/components/Toast/**, packages/react/src/components/Toast/verification.md, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** transient notifications that are announced and never disappear before I read them
**So that** I learn whether my action succeeded without hunting for the answer

## Acceptance Criteria

### AC1: Announced by severity

- **Given** a toast
- **When** it appears
- **Then** success announces politely and error assertively via a live region
- **Verify:** vitest "Toast live region politeness by intent"
- **Verification target:** functional

### AC2: Errors persist

- **Given** an error toast
- **When** it appears
- **Then** it does not auto-dismiss by default
- **Verify:** vitest "error Toast does not auto-dismiss"
- **Verification target:** functional

### AC3: Timer pauses

- **Given** an auto-dismissing toast
- **When** I hover or focus it
- **Then** the dismiss timer pauses
- **Verify:** vitest "Toast timer pauses on hover and focus"
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Toast stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Toast
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Toast theme and density matrix"
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Toast story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Toast
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

### AC7: A toast arriving over an open tooltip wins

- **Given** an open Tooltip
- **When** a toast arrives
- **Then** the toast paints above the tooltip
- **Verify:** shell pnpm test:e2e -g "a toast arriving over an open tooltip paints above it"
- **Verification target:** functional

> D0102, and the mirror of Tooltip's AC7. It is what keeps the ruling honest in the other
> direction: a toast is the NEW information and a tooltip is stale the moment attention moves, so
> the same pair must resolve the other way when the toast is the thing that just arrived. Together
> the two criteria are why a constant is wrong here and open order is right.
>
> **Inherited constraints.** The Toast stylesheet takes `z-index` from `var(--clara-layer-toast)`,
> which is deliberately the SAME number as `--clara-layer-tooltip`, and the component sets no
> `z-index` in JavaScript.
>
> **Known residual (D0102, accepted).** A toast arriving into a viewport whose host is already on
> the page is a later toast in an EARLIER sibling, so a tooltip opened in between can cover it. Not
> fixed by re-appending the viewport host: moving a live DOM node re-parents its subtree, resetting
> focus and remounting anything stateful inside.

## Scope

### In Scope

- Toast

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**A toast action's accessible name is its explanation.** "Retry", "Undo", "View" are complete. If
the label needs a tooltip, the action is wrong rather than under-documented, and an action needing
more than a label belongs behind "View" - which opens a surface with room. Clara does not forbid a
tooltip on a toast action, because a `ToastAction` slot takes children and a prohibition Clara
cannot enforce is a wish rather than a design decision. The layering is correct either way (D0102).


**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
