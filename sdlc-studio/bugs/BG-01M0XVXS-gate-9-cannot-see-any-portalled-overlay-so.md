# BG-01M0XVXS: Gate 9 cannot see any portalled overlay, so five components' rendered behaviour is unasserted

> **Status:** Fixed
> **Triaged-by:** claude-implementer; agent; opus-5
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

## Acceptance Criteria

### AC1: Portalled overlays have a gate that can see them

- **Given** a component whose surface is portalled
- **When** its rendered behaviour needs asserting
- **Then** there is a suite that can observe it - a live Storybook build, where the portal actually
  exists
- **Verify:** shell pnpm test:e2e -g "a drawer slides in from the edge it is anchored to"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Drawer's slide and its reduced-motion branch are asserted

- **Given** the three placements
- **When** each opens
- **Then** each animates on its OWN axis - so a left drawer cannot silently reuse the right-hand
  keyframe and slide in from the wrong side - and under reduced motion the animation is `none`
- **Verify:** shell pnpm test:e2e -g "a drawer (slides in from the edge|removes its slide)"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Popover's collision handling is asserted as a RENDERED fact

- **Given** a popover asking for a placement with no room
- **When** it opens
- **Then** it stays inside the viewport on all four edges and reports a different `data-side`, so it
  demonstrably moved rather than being clamped on top of its trigger
- **Verify:** shell pnpm test:e2e -g "a popover pinned against an edge stays on screen"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Fixed (2026-08-26)

The static fixture was NOT made to hold portals. It cannot: `ClaraPortal` returns null on the server
by design (US-01M0GM61 AC4), and forcing it would mean server-rendering something the architecture
deliberately refuses to.

Instead the portalled assertions live where a portal actually exists - a live Storybook build, in
`e2e/stacking.spec.ts`. That harness was built for the tooltip hover bridge and the D0102 layering,
and it now carries every rendered claim the static fixture structurally could not:

| Claim | Was |
| --- | --- |
| Drawer slides in from its own edge, per placement | unasserted |
| Drawer removes the slide under reduced motion (Class A) | unasserted |
| Popover stays on screen when pinned against an edge | unasserted |
| Tooltip's WCAG 1.4.13 hover bridge | unasserted |
| Tooltip renders at Clara's font size, not the page's | unasserted |
| All three directions of the tooltip/toast shared layer | unasserted |
| Toast REPLACES its slide under reduced motion (Class B) | unasserted |
| Three toasts stack, and every close button is hittable | unasserted |

Nine assertions, 29 e2e tests total.

Proved by mutation, each in its own direction:

- Pointing the left drawer at the right-hand keyframe reddens the axis assertion.
- Deleting the reduced-motion rule reddens the Class A assertion.
- `avoidCollisions={false}` reddens the popover with "clipped off the left edge".

**One probe worth recording because it is misleading.** DELETING `avoidCollisions` does not redden
the popover test - Radix defaults it to `true`, so the deletion changes nothing rendered. The
sensitive mutation is `={false}`. The obvious probe would have suggested the assertion was
insensitive when it is not, and the test now says so at the point of use.
