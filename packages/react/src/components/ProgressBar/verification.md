# ProgressBar - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

Determinate and indeterminate progress.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state, no
refs.

## Keyboard

Not focusable. Progress is output.

| Key | Result |
| --- | --- |
| Tab | No stop, in either mode. |
| Any key | No handler. |

## Recorded manual keyboard pass

**Not performed, and there is nothing for one to walk.** The component takes no focus and handles
no key.

What a real pass would add is whether a screen reader announces value CHANGES at a useful cadence,
or reads every percentage point of a long operation. That is a live-region behaviour no test here
reaches, and it is the most likely thing to be wrong in practice.

## Accessibility

`role="progressbar"` with a required `label`. The label is required because "62%" of what is the
question a label answers, and a bar with no name is a bar a screen-reader user cannot place.

**Indeterminate omits `aria-valuenow`, `aria-valuemin` and `aria-valuemax` entirely.** That is what
indeterminate MEANS in ARIA. Reporting `0` would be a confident claim that nothing has happened
yet, which is a different statement and a false one.

`value` is clamped to `[0, max]` rather than trusted: a caller computing 105 of 100 should see a
full bar, not one that runs past its own track.

## Motion, and the absence of it

**Determinate does not animate and must not transition** (D0100). The fill's width is DATA. A
transitioned width shows a number that is not the current value for the length of the transition,
while `aria-valuenow` already reports the new one - so a sighted user and a screen-reader user would
read different values off the same component. Asserted as `transitionDuration === '0s'` exactly,
which is what catches the 1ms transition that looks like compliance.

**Indeterminate traverses**, and the period falls out of geometry rather than being chosen: the
quarter-track segment displaces track + segment = 1.25 track-widths = five feature-widths, so
`step x 5`. Never `alternate` - a bar that bounces backwards reads as a failure or an undo, which is
a different message from "still working".

**Under `prefers-reduced-motion: reduce` the traverse is removed**, because a traverse is a
translation and translation is what the vestibular response is triggered by. The liveness it carried
is replaced: the fill becomes the full track and cycles between two existing tokens on the same
period. A quarter segment parked anywhere would read as a percentage, which AC2 forbids.

## What is verified automatically

- `aria-valuenow`, `valuemin` and `valuemax` are correct, update, and honour a non-100 `max` -
  `__tests__/progress-bar.test.tsx`
- Out-of-range values clamp - `__tests__/progress-bar.test.tsx`
- Indeterminate omits all three value attributes and sets no inline width -
  `__tests__/progress-bar.test.tsx`
- **Determinate neither animates nor transitions**, and is actually showing a non-zero width so the
  assertion is not over an empty element - `check:geometry`
- **Indeterminate animates, forever, and never reverses** - `check:geometry`
- **Under reduced motion it stops translating and still changes colour** - `check:geometry`
- It renders on the server - `__tests__/progress-bar.test.tsx`
- axe (serious and critical) in both modes, and in all four theme x density combinations -
  `check:axe`
- Token-only styling - `check:component-css`

## Stated gaps

- **Announcement cadence is unverified.** Nothing here proves a screen reader reports value changes
  usefully rather than reading every percentage point. Named in the manual pass above.
- **The traverse geometry is asserted as behaviour, not as distance.** The gate proves the fill
  animates, runs forever and does not reverse; it does not measure that the segment travels exactly
  track-plus-segment, which is the derivation the period comes from.
- **`inlineSize` is the one inline style Clara writes**, because a class cannot express an arbitrary
  percentage and a token would be a hand-typed number. It is the datum, not a design value - but it
  does mean `check-component-css` cannot see it, and a future bug that wrote a colour there would be
  invisible to that guard.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
