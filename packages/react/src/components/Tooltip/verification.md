# Tooltip - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A short explanation attached to a control, reachable by pointer AND by keyboard.

**Boundary:** client-only (see `../../../client-boundary.json`). It holds open state and pointer
timers, which TRD Section 7 makes the boundary test.

## Keyboard

| Key | Result |
| --- | --- |
| Tab | Moves focus TO the trigger, which opens the tooltip immediately - no hover delay applies to focus. |
| Tab (again) | Moves focus off the trigger, which closes the tooltip. The content is never in the tab order. |
| Escape | Dismisses it without moving focus, and without moving the pointer. |

The content is deliberately unreachable by Tab. That is not an oversight: a tooltip is announced
through `aria-describedby` on its trigger and disappears when attention moves, so anything focusable
inside one would be a control that paints and cannot be operated. `content` is typed `string`, which
makes that unrepresentable rather than merely discouraged.

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether the tooltip flips near a viewport edge rather
than being clipped, whether the pointer can actually travel from the trigger to the content without
it vanishing underneath (WCAG 1.4.13 "hoverable" - see the gap below), and whether the 700 ms open
delay reads as deliberate or as lag on a dense toolbar.

## Accessibility

**WCAG 1.4.13, Content on Hover or Focus.** Three requirements, each met by a mechanism:

- **Dismissable.** Escape closes it with no pointer movement. Asserted in `__tests__/tooltip.test.tsx`.
- **Hoverable.** The pointer may travel to the content. This is Radix's `disableHoverableContent`,
  which defaults to `false`; Clara neither sets it nor exposes it. See the gap below for why the
  assertion lives in a browser and not in jsdom.
- **Persistent.** It stays until focus or the pointer leaves. Radix applies no hide delay.

**AC1 is the component's reason to exist.** A hover-only tooltip is invisible to everyone not using
a mouse, which is the population most likely to need the explanation. The suite asserts it opens on
focus, closes when focus leaves, and that the trigger carries `aria-describedby` pointing at the
content's actual text - not merely that an attribute exists.

## Each Tooltip opens its own Radix provider

`@radix-ui/react-tooltip` throws without a provider ancestor - measured, not assumed:
``Error: `Tooltip` must be used within `TooltipProvider` ``. Requiring `ClaraProvider` was rejected
twice over: the message names a Radix type in a consumer's console, which Section 4 rule 7 forbids,
and it would put ~19 kB of tooltip machinery in the chunk of the library's ROOT, charged to every
consumer whether or not they render a tooltip.

The cost of the chosen shape is recorded rather than hidden: `skipDelayDuration` groups delays per
provider, so with one provider each, moving along a toolbar re-incurs the full 700 ms open delay on
every button. Nothing is incorrect; it is slower than it could be. A grouping provider is public
API - a one-way door - and no acceptance criterion asks for one, so it should arrive as its own
story with its own evidence rather than as a prop added on a guess.

## The z-index is earned, not silenced

`.clara-tooltip` declares `position: relative` alongside its layer token, for the reason
`.clara-popover` records: Radix's popper reads the computed z-index off the content and copies it
onto the wrapper it positions. `relative` renders identically to `static` with no offsets, so the
declaration is true on its own terms whether or not a third party keeps doing that.

`--clara-layer-tooltip` and `--clara-layer-toast` resolve to the SAME layer, deliberately (D0102).
Open order decides which paints on top, because the relationship is bidirectional.

## What is verified automatically

- It opens on keyboard focus, not only on hover - `__tests__/tooltip.test.tsx`
- The dev-only warning is ELIMINABLE from a production build, proved by bundling the built chunk
  with `NODE_ENV=production` and minifying it - `check:dev-warnings`. The timer, the selector and
  the message all shipped to consumers before that guard existed, against `dev-warning.ts`'s own
  promise
- A trigger made focusable in an EFFECT rather than in JSX is NOT warned about - the deferral that
  makes that true was itself unpinned for a round, because every other test set `tabIndex` in JSX -
  `__tests__/tooltip.test.tsx`
- A natively disabled control gets advice that works (`aria-disabled`, D0058) rather than being told
  to use a button it is already using - `__tests__/tooltip.test.tsx`
- Two broken tooltips produce TWO warnings naming each trigger, not one line naming neither -
  `__tests__/tooltip.test.tsx`
- A NON-FOCUSABLE trigger warns in development, and a focusable one (including a `span` carrying
  `tabIndex`) stays silent - both halves, because a warning that fires on correct usage is one a
  developer learns to filter, which is the failure `dev-warning.ts` names in its own docblock -
  `__tests__/tooltip.test.tsx`
- It closes again when focus leaves, so it is not a permanent overlay - `__tests__/tooltip.test.tsx`
- The trigger's `aria-describedby` resolves to an element whose text IS the content -
  `__tests__/tooltip.test.tsx`
- Escape dismisses it, and the content is genuinely absent beforehand so the disappearance is a
  dismissal rather than a no-op - `__tests__/tooltip.test.tsx`
- It renders in all four placements and defaults to `top` - `__tests__/tooltip.test.tsx`
- The positioning props actually REACH the content - `placement`, collision avoidance, a non-zero
  collision padding and a side offset. Found by a self-sweep rather than a review: Popover and
  DropdownMenu each gained this test after a seat measured their positioning being deletable with
  every gate green, and Tooltip had the identical hole with nobody looking -
  `__tests__/positioning.test.tsx`
- It works with no `ClaraProvider` above it, rather than throwing a Radix error -
  `__tests__/tooltip.test.tsx`
- A tooltip on a toast's action paints ABOVE the toast, a toast arriving over an open tooltip
  paints above IT, and a tooltip opened over a live toast paints above that - all three directions
  of the shared-layer mechanism, probed with `document.elementFromPoint` inside a measured overlap -
  `e2e/stacking.spec.ts`
- The font size is Clara's, not the consumer's `body` - `e2e/stacking.spec.ts`
- It renders through `ClaraPortal` and takes its stacking from a layer token, with a NON-CONSTANT
  `open` so the host is appended when the surface opens - `check:overlay-contract`
- Token-only styling, and a layer token that is not inert - `check:component-css`
- axe while open, in all four theme x density combinations - `check:axe`

## Stated gaps

- **Unreachable by TOUCH GESTURE, but reachable by assistive technology on the same device.**
  Measured: tap does not open it, a long press does not open it, but FOCUS does - including a
  programmatic `.focus()`, because Radix opens on focus whenever no pointer is down. VoiceOver's
  rotor and TalkBack's swipe move DOM focus, so the mobile screen-reader path reaches the content.
  A sighted touch user has no route, which is why AC3 forbids a tooltip being the sole source of
  anything. An earlier version of this bullet claimed programmatic focus left it closed and that
  there was "no route at all" on a phone - false, and understating a path worth protecting.

- **The hover bridge is NOT verified in jsdom, and cannot be.** Radix implements WCAG 1.4.13's
  "hoverable" requirement as a grace-area polygon computed from the trigger's and the content's
  bounding rectangles and the live pointer position. jsdom lays nothing out - every rect is zero and
  there is no pointer geometry - so the polygon is degenerate and any verdict reached there would be
  a false green by construction. What protects the mechanism in the meantime is the public surface:
  `TooltipProps` exposes no `disableHoverableContent`, so a consumer cannot disable the bridge, and
  the API-surface gate fails if one is added. The behavioural assertion belongs in Playwright.
- ~~**AC7 is NOT satisfied yet.**~~ **Satisfied since Toast shipped (bcb98f9).** This paragraph said
  "Toast is not built" for a commit after it was, which is the stale-orientation failure AGENTS.md
  warns about in miniature. All three directions are now asserted in `e2e/stacking.spec.ts`, and the
  third one exists because the first two were both consistent with MOUNT order as well as open
  order - a defect that froze the stacking at mount order passed them both.
- **Positioning is NOT verified.** Flip, shift and collision padding are entirely layout. The tests
  assert the behaviour is CONFIGURED, which is a much weaker claim than that it happens. Same gap
  as Popover's, and it belongs to the gate: BG-01M0XVXS.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
