# US-01M0GMQJ: Popover

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** e2e/stacking.spec.ts, packages/react/src/components/Popover/**, packages/react/src/components/Popover/verification.md, packages/react/src/theme/ClaraPortal.tsx, packages/react/src/styles.css, packages/tokens/src/component/popover.json, packages/react/src/index.ts, packages/react/client-boundary.json, packages/react/package.json, packages/react/etc/clara-react.api.md, packages/tokens/etc/clara-tokens.api.md, packages/react/src/components/__tests__/boundary.test.tsx, apps/docs/src/content/components/popover.md, scripts/check-verification.mjs, scripts/sync-size-budgets.mjs, scripts/prove-guards-fail.mjs, .size-limit.json
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a non-modal overlay that returns focus correctly and stays anchored
**So that** a popover neither traps me nor drifts away from its trigger

## Acceptance Criteria

### AC1: Non-modal focus

- **Given** an open Popover
- **When** I dismiss it
- **Then** focus is never trapped, and on ESCAPE it returns to the trigger
- **And** on the other two dismissal routes it deliberately does NOT return: an outside click leaves
  focus where the click landed, and moving focus out leaves it where the user put it. Yanking focus
  back to a trigger somebody just navigated away from is the trap this component exists not to be,
  and Radix suppresses the restore after an outside interaction for that reason. An earlier version
  of this Then-clause said "focus returns to the trigger" for every route, which is true of one
- **Verify:** vitest "Popover returns focus without trapping"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Positioning

- **Given** a Popover near a viewport edge
- **When** it opens
- **Then** the collision behaviour is configured and the requested placement reaches the panel
- **And** the RENDERED half of this criterion - that it actually flips, shifts and stays anchored -
  is not verified here and cannot be: it is entirely layout, jsdom computes none, and gate 9's
  fixture is a server render that no portalled surface appears in at all. Asserted separately in
  `e2e/stacking.spec.ts`, in a real browser, since BG-01M0XVXS closed - the panel stays on screen
  when pinned against an edge, and reports a different `data-side`, so it demonstrably moved. This
  clause previously deferred the rendered half as unclaimable; that stopped being true
- **Verify:** vitest "Popover collision handling is configured"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Popover stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Popover
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Popover theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Popover story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component Popover
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC2 cannot be verified where its verifier points, and that is stated rather than papered over.**
"Flips and shifts to stay visible, and stays anchored on scroll" is entirely layout, and the
verifier is a Vitest test. jsdom computes no layout at all, so the strongest honest claim in that
runner is that the collision behaviour is CONFIGURED - a much weaker statement than the criterion
makes. The rendered behaviour needs a browser, and gate 9's fixture is a `renderToStaticMarkup`
render that no portalled surface appears in at all. Filed as **BG-01M0XVXS**, which is the same gap
Drawer's slide has: it belongs to the GATE's reach rather than to either component, and three more
overlays are about to inherit it.

**This component deliberately does NOT use the shared focus machinery, and the reason is the
opposite of an inconsistency.** Modal and Drawer share `useOverlayFocusRestore` because Clara
exposes no trigger for them, so Clara must capture and restore focus itself. A Popover's trigger is
INSIDE the component - it has to be for the panel to stay anchored - so Radix holds a real ref and
its own restore is correct by construction. Adding Clara's machinery would be two mechanisms racing
for one outcome, which is precisely the defect Modal's `onCloseAutoFocus` preventDefault exists to
prevent.

**AC1 says "without ever having been trapped", and trapping had to be asserted the way a trap
manifests.** A first attempt used `userEvent.tab()` and read a non-trap as a trap: the panel is
portalled to the end of `document.body`, so tabbing out of it has no following tabbable and jsdom
does not wrap the way a browser does. A second attempt asserted the panel was still open after
focus moved out, and failed because moving focus out DISMISSES a non-modal popover - correct
behaviour, and a dismissal rather than a trap. What is asserted now is that focus stays where the
user put it and is not stolen back on the way out, which is how a focus scope actually manifests.

**Two callbacks, `onOpen` and `onClose`,** rather than one taking a boolean. `onOpenChange` is
Radix's name and no Radix surface reaches Clara's (TRD Section 402), but the better reason is that
two Clara-shaped events read more clearly at a call site than one that must be destructured.

**AC4 corrected as in every other story in this epic.**

## Scope

### In Scope

- Popover

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Test Plan

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Popover/Popover.tsx | Set `modal={true}` (measured: 3 fail), or suppress Radix's restore with `onCloseAutoFocus` preventDefault (measured: 1 fails). | Non-modal focus |
| AC2 | packages/react/src/components/Popover/Popover.tsx | Delete `avoidCollisions` and `collisionPadding={8}`. This SURVIVED the whole repository until `__tests__/collision.test.tsx` was written - `collisionPadding` defaults to 0, so the documented 8px gap could be lost in silence. | Positioning |
| AC3 | packages/react/src/styles.css | Add a raw literal or a tier 1 token reference to the `.clara-popover` rules. | Token-only styling |
| AC4 | packages/react/src/theme/ClaraPortal.tsx | Strip `claraAttributes` from the portal root. Before the AC4 assertion walked UP from inside the panel, this left all 14 Popover tests green while failing 7 elsewhere. | Both themes and densities |
| AC5 | packages/react/src/components/Popover/verification.md | Delete the record, its docs page, or its keyboard table. | Definition of done |

## Spec delta

Derived after an independent review REJECTED the first pass. Four blocking findings, all confirmed
by re-running the reviewer's own mutations, and all fixed here.

1. **The axe assertions could not see the component.** `runAxe(container)` was scoped to the React
   root while the panel portals to `document.body`, so an injected `aria-allowed-attr` violation
   left every gate green. Now `runAxe(document.body)`, and the violation reddens it. Drawer had the
   identical blindness and is fixed in the same pass.
2. **AC2's own narrowed claim had no witness.** The criterion was correctly narrowed from "it flips"
   to "the collision behaviour is configured" - and then nothing observed the configuration either.
   `__tests__/collision.test.tsx` records the props reaching the panel, which is the criterion's
   actual subject.
3. **AC4 observed a proxy** (D0065): `container.querySelector('[data-clara-theme]')` finds the
   provider's OWN element, not the portal's scope. It now walks up from an element inside the panel,
   which is what Modal already did. The same proxy was in Drawer, Tooltip, Toast and DropdownMenu -
   every portalled overlay - and all five are fixed.
4. **The story carried no `## Test Plan`**, and `check-story-verifiers.mjs` skips a story that has
   none - both the row-alignment check and the `Touches` reachability check begin
   `if (!text.includes('## Test Plan')) continue`. So five `Verified: yes` stamps sat outside the
   gate AGENTS.md mandates for exactly this. The table above closes it.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
