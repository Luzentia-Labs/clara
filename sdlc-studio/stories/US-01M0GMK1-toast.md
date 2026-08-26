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
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Errors persist

- **Given** an error toast
- **When** it appears
- **Then** it does not auto-dismiss by default
- **Verify:** vitest "error Toast does not auto-dismiss"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Timer pauses

- **Given** an auto-dismissing toast
- **When** I hover or focus it
- **Then** the dismiss timer pauses
- **Verify:** vitest "Toast timer pauses on hover and focus"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the Toast stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a Toast
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Toast theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the Toast story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Toast
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

### AC7: A toast arriving over an open tooltip wins

- **Given** an open Tooltip
- **When** a toast arrives
- **Then** the toast paints above the tooltip
- **Verify:** shell pnpm test:e2e -g "a toast arriving over an open tooltip paints above it"
- **Verified:** yes (2026-08-26)
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

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Toast/Toast.tsx | Announce everything with `type="background"`. Measured: the assertive test fails. The polite direction is asserted too, so announcing EVERYTHING assertively also fails. | Announced by severity |
| AC2 | packages/react/src/components/Toast/Toast.tsx | Drop the `duration: Infinity` for `danger`. Measured: the persistence test fails. The companion test requires a success toast to DISMISS, so a component where nothing auto-dismisses fails as well. | Errors persist |
| AC3 | packages/react/src/components/Toast/Toast.tsx | Remove the viewport, which is what Radix binds the pause handlers to. The resume test also fails if a pause never ends. | Timer pauses |
| AC4 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to the Toast rules. | Token-only styling |
| AC5 | packages/react/src/components/Toast/Toast.tsx | Rename the theme or density attribute. | Both themes and densities |
| AC6 | packages/react/src/components/Toast/verification.md | Delete the Toast verification record, its docs page, or its keyboard table. | Definition of done |
| AC7 | packages/react/src/styles.css | Give `.clara-toast__viewport` a layer other than `--clara-layer-toast`. Measured: setting `--clara-layer-overlay` turns "a toast arriving over an open tooltip paints above it" red. **The probe must `pnpm build` first** - Storybook imports the BUILT stylesheet, so an unbuilt mutation reaches nothing and every test passes. | A toast arriving over an open tooltip wins |

## Spec delta

Derived before implementation, per the engagement floor.

**AC7 is one half of a mechanism completed with Tooltip's AC7.** Both were unassertable until both
components existed; they are now asserted together in `e2e/stacking.spec.ts` with
`document.elementFromPoint` inside a VERIFIED overlap - the overlap is measured and required to be
real before the probe reads a point, because a probe inside a region only one element covers passes
regardless of which paints on top. Never by comparing computed `z-index`: the two are equal by
design, so a comparison would report "equal" in both directions and prove nothing (D0065, D0102).

**Interactions resolved during implementation:**

1. **Politeness and persistence are ONE prop.** `intent` decides both. Two props would let a
   consumer build the incoherent halves - an assertive toast that vanishes before it can be read, or
   a permanent one nobody is told about.
2. **The layer token goes on the VIEWPORT, not the toast.** Unlike Popover and Tooltip, Radix copies
   no computed z-index here; the viewport is an ordinary fixed element and is what forms the
   stacking context, so a token on `.clara-toast` alone would be inert inside it. This also forced
   the class to be `.clara-toast__viewport` rather than `.clara-toast-viewport`: `check-overlay-contract`
   resolves a component's rules by BEM (`base`, `base__*`, `base--*`), and a hyphen suffix is none of
   those. Renaming was correct; adding an inert token to `.clara-toast` to satisfy the guard would
   have been the exact "silencing a guard" shape D0087 exists to catch.
3. **Motion is Class B (D0100), so reduced motion REPLACES it rather than removing it.** The slide
   from the viewport edge is the only signal distinguishing a toast that just arrived from one
   already there - the "liveness" meaning. Removing it removes information, so the reduced-motion
   rule substitutes a fade.
4. **`@radix-ui/react-toast` measured 12.8 kB, budget 15 kB** - the smallest of the four overlays,
   because a toast is the one that is not positioned against a trigger and so carries no
   `@radix-ui/react-popper` and none of the `@floating-ui` chain.
5. **jsdom implements no Pointer Capture API.** Radix's swipe handling calls `hasPointerCapture` on
   every pointerdown, which raised an UNHANDLED error that vitest reports and then passes anyway,
   while Stryker's runner crashed on it - so `pnpm test` was green and `check:mutation-config` was
   red with a message naming neither file nor cause. `test/setup.ts` now implements the real
   per-element, per-pointer-id semantics rather than a stub returning `false`, because a stub would
   let a test pass through a branch a browser would not have taken.
6. **That polyfill then had to be guarded with `typeof Element !== 'undefined'`**, because the setup
   file also loads for node-environment suites. Without the guard `test/build/chunk-placement.test.ts`
   failed to LOAD - and a suite that fails to load reports zero failing tests, so `pnpm test` said
   "1131 passed" while a whole file never ran. Caught by `check:coverage-gate`, which refuses to draw
   a conclusion from a run with a failing suite.

## A defect found here, shipped briefly, then fixed

**BG-01M0Y2H2 - two simultaneous toasts rendered two overlapping viewports. FIXED in 461b73f.**

Measured `viewports: 2, toasts: 2`, and a review then measured it worse than recorded: in Chromium
both occupied the identical rect and `elementFromPoint` on the first toast's close button returned
the SECOND toast's, so a covered toast's controls were unreachable rather than merely hidden - and
with `duration: Infinity` on `danger`, a covered error toast persisted forever.

Every criterion here concerns ONE toast, which is why they all passed while the case was broken.
Every `<Toast>` now registers into one module-level shared stack; `ToastProps` is unchanged.

This section previously said the defect was shipped and stated, which was true when written and
false one commit later. `verification.md` was updated and this file was not.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
