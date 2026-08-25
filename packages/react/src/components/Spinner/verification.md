# Spinner - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A busy indicator.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state, no
refs. Worth noting because it nearly shipped unclassified: Spinner had **no entry in `components`
at all**, the same gap Alert had, and the check that caught it was an assertion written into the
edit rather than a guard - the build would have caught it a step later.

## Keyboard

Not focusable. A busy indicator is output.

| Key | Result |
| --- | --- |
| Tab | No stop, in either mode. |
| Any key | No handler. |

## Recorded manual keyboard pass

**Not performed, and there is nothing for one to walk.** Spinner takes no focus and handles no key.

What a real pass WOULD add here is not keyboard: it is whether a screen reader announces the label
when the spinner appears mid-task, and whether the reduced-motion pulse is perceptible at all on a
low-contrast surface. Both are recorded under Stated gaps rather than dressed up as a keyboard walk.

## Accessibility

`role="status"`, not `alert`. A spinner is not an interruption - a screen reader should reach it in
its own time rather than have it cut across whatever is being read.

The ring is `aria-hidden`, so the label is announced once rather than twice.

## The rule this component exists to obey

**No state in Clara is carried by motion alone** (D0100) - the temporal form of the seat's standing
rule that no state is carried by colour alone. The ring says *right now*; the label says *what*.
Neither substitutes for the other.

`label` is therefore required and is NOT defaulted to "Loading". On a dense ERP screen with four
regions loading at once, "Loading" tells a screen-reader user that something is loading and not
which thing. The word Clara could have supplied is exactly the word that carries no information.

The label is required in **both** motion preferences. It is never the thing that gets removed.

## One ring, two contexts

`.clara-spinner__ring` is the same class `<Button loading>` renders. D0100 requires one
implementation rather than a second that drifts, and two spinners turning at different rates on one
screen is what drift would look like. Asserted twice over: structurally, that Spinner emits that
class; and in a browser, that the class actually animates in BOTH contexts - a structural assertion
alone cannot see whether a shared class is animating where it is used.

## What is verified automatically

- The label is announced, and the ring is `aria-hidden` so it is announced once -
  `__tests__/spinner.test.tsx`
- It renders the ring class Button renders - `__tests__/spinner.test.tsx`
- **It animates, and its iteration count is `infinite`** - `check:geometry`, in Chromium, on both
  the standalone Spinner and Button's ring. The iteration assertion is the one that generalises
  BG-01M0WZEM: an indicator that animates once and stops is the frozen ring in a new costume.
- **Under `prefers-reduced-motion: reduce` it displaces nothing and still changes over time** -
  `check:geometry`, sampled as properties rather than keyframe names so it survives a rename.
- It renders on the server - `__tests__/spinner.test.tsx`
- axe (serious and critical), and in all four theme x density combinations - `check:axe`
- Token-only styling - `check:component-css`

## Stated gaps

- **Nothing in the unit suite may assert anything about the animation, and nothing does.** jsdom
  resolves no animation at all, so a green Vitest test asserting motion would be a false green by
  construction (D0100). Every motion claim above is a browser assertion.
- **The reduced-motion pulse is not verified as PERCEPTIBLE.** The gate proves the colour changes
  and that both endpoints are tokens whose pairings are measured; it does not prove a user notices
  the difference between them at 14px.
- **The announcement is not verified as heard.** `getByRole('status')` proves the live region;
  nothing automated proves a screen reader reads the label when the spinner appears mid-task.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).
