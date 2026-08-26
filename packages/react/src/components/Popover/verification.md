# Popover - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A non-modal overlay anchored to its trigger.

**Boundary:** client-only (see `../../../client-boundary.json`). `onOpen` and `onClose` are function
props, which TRD Section 7 makes the boundary test.

## Keyboard

| Key | Result |
| --- | --- |
| Tab | Moves through the panel and OUT of it. Focus is never trapped. |
| Escape | Dismisses, and focus returns to the trigger. |
| Enter / Space | Activates the trigger, and the focused control inside. Platform behaviour, unchanged. |

Moving focus out of the panel by any route dismisses it. That is a dismissal, not a trap - the two
are distinguishable and the tests distinguish them.

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether the panel actually flips near a viewport edge
rather than being clipped, whether it stays anchored while a scroll container moves under it, and
whether the focus ring is visible against the panel surface in both themes.

## Accessibility

`role="group"` with a required `label`, wired through a visually-hidden element and
`aria-labelledby`. Without a name the panel announces as an unnamed group, which tells a
screen-reader user that something opened and nothing about what.

**The background is NOT hidden and NOT inert.** That is what non-modal means, and it is asserted
rather than assumed: the page keeps scrolling, nothing is marked `aria-hidden`, and focus may rest
outside the panel.

## Why this has none of Modal's focus machinery

Modal and Drawer share `useOverlayFocusRestore` because Clara exposes no trigger for them - the
consumer owns the opener, so Clara has to capture `document.activeElement` at the right commit and
restore it itself, which took nine review rounds to get right.

A Popover's trigger is INSIDE the component, because it has to be for the panel to stay anchored to
it. So Radix holds a real ref and its own restore is correct by construction. Adding Clara's
machinery here would be two mechanisms racing for one outcome, which is the defect
`onCloseAutoFocus` preventDefault exists to prevent in Modal.

## The z-index is earned, not silenced

`.clara-popover` declares `position: relative` alongside its layer token. Radix positions the panel
with a wrapper it renders itself, so a naive reading says a z-index on the content is inert - but
the popper reads the computed z-index off the content and copies it onto that wrapper
(`setContentZIndex(window.getComputedStyle(content).zIndex)`), which is why the token belongs here.

That is a third party's runtime behaviour and invisible to any stylesheet, so `relative` - which
renders identically to `static` with no offsets - makes the declaration true on its own terms.

## What is verified automatically

- Focus returns to the trigger on Escape, by identity - `__tests__/popover.test.tsx`
- The background stays reachable, unhidden and scrollable while it is open -
  `__tests__/popover.test.tsx`
- Focus may rest outside the panel and is not yanked back, and the resulting dismissal does not
  steal focus to the trigger on the way out - `__tests__/popover.test.tsx`
- An outside click dismisses it - `__tests__/popover.test.tsx`
- The collision props actually REACH the panel, so AC2's narrowed claim has a witness. Deleting
  `avoidCollisions` and `collisionPadding` used to leave the entire repository green -
  `__tests__/collision.test.tsx`
- The panel carries an accessible name - `__tests__/popover.test.tsx`
- It renders through `ClaraPortal` and takes its stacking from a layer token -
  `check:overlay-contract`
- Token-only styling, and a layer token that is not inert - `check:component-css`
- axe while open, in all four theme x density combinations, scoped to `document.body` so the
  PORTALLED panel is actually inspected - `check:axe`. This line claimed the coverage while the
  matrix ran `runAxe(container)`, which holds only the trigger; a second review round rejected
  the story for exactly that gap between record and test

## Stated gaps

- ~~**AC2's positioning is NOT verified.**~~ **Now verified in a browser (BG-01M0XVXS closed).**
  `e2e/stacking.spec.ts` opens the against-the-edge story and asserts the panel stays inside the
  viewport on all four edges AND reports a different `data-side`, so it demonstrably moved rather
  than being clamped over its trigger. The jsdom tests still assert only that the behaviour is
  CONFIGURED, which remains the weaker claim - both now exist, and they are different claims.
  Scroll-anchoring specifically is still unasserted.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
