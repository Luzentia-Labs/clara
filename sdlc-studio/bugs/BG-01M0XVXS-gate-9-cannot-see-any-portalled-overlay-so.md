# BG-01M0XVXS: Gate 9 cannot see any portalled overlay, so five components' rendered behaviour is unasserted

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/build-geometry-fixture.mjs, e2e/geometry.spec.ts, packages/react/src/components/Drawer/Drawer.stories.tsx
> **Severity:** major
> **Points:** 5

## Summary

`scripts/build-geometry-fixture.mjs` builds its fixture with `renderToStaticMarkup`, and `ClaraPortal` returns null on the server BY DESIGN (US-01M0GM61 AC4). So no portalled surface can appear in gate 9's fixture at all, and gate 9 is where every rendered-behaviour assertion in this project lives.

That is not a gap in any one component - it is a gap in the GATE's reach, and it is already costing two components their most important assertions:

- **Drawer** slides in from its edge and removes the slide under `prefers-reduced-motion` (D0100). Gate 9 asserts exactly this shape for Spinner and ProgressBar. Drawer cannot be added to the fixture, so nothing proves the panel slides from the correct edge or that the reduced-motion branch fires.
- **Popover** flips and shifts to stay on screen and stays anchored on scroll (US-01M0GMQJ AC2). Every word of that is layout, and jsdom computes none.

Three more overlays are about to inherit it: Tooltip, DropdownMenu and Toast.

## Steps to Reproduce

1. Read `scripts/build-geometry-fixture.mjs` - it renders with `renderToStaticMarkup`.
2. Read `packages/react/src/theme/ClaraPortal.tsx` - the host is created in an effect, so there is no server output. This is deliberate and asserted by US-01M0GM61 AC4.
3. Add any portalled component to the fixture's case list and observe that its selectors match nothing.

The mechanism to fix it already exists and is proven: `e2e/scoping.spec.ts` asserts the portal scoping case in a browser by serving the Storybook build, which is a CLIENT render, and `e2e/storybook.spec.ts` does the same for the toolbars.

## Proposed Fix

Give the geometry gate a second fixture that CLIENT-renders, alongside the SSR one it has - not a replacement, because the SSR fixture is what proves the components a consumer server-renders are measured as built.

The Storybook build is already the client-render mechanism in this repo and both existing browser specs serve it, so the cheapest correct shape is: a `motion-and-position` story per portalled overlay, and a gate 9 section that serves the static build the way `e2e/scoping.spec.ts` already does. `Drawer.stories.tsx` and a Popover story exist for it.

What it must then assert, per component: Drawer's slide and its removal under `emulateMedia({ reducedMotion: 'reduce' })`; Popover's flip and shift near a viewport edge, measured as a bounding box that stays inside the viewport rather than as a class name; and, once Tooltip and Toast exist, the two directions of D0102's stacking rule with `document.elementFromPoint` inside the overlap.

## Impact

It is the difference between a gate that covers the component set and one that covers the components that happen to render on a server.

Every rendered claim about the five overlays is currently unasserted: motion, positioning, collision handling, and the stacking that D0102's paired Tooltip/Toast criteria depend on - those two criteria are already written and name `pnpm test:e2e` selectors that have nowhere to live yet.

It also means the honest thing in each verification record is a stated gap, and five records repeating the same gap is a signal the gap belongs to the gate rather than to them.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
