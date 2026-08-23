# Textarea - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A multi-line text control that can grow with its content, up to a cap.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Enter inserts a newline; it does not submit. Tab leaves the control rather than indenting.


| Key | Result |
| --- | --- |
| Enter | Inserts a newline. Does **not** submit the form. |
| Tab | Leaves the control. Does not indent - a textarea that captures Tab is a keyboard trap. |
| Any printing key | Types, and re-measures the height when `maxRows` is set. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

An earlier version of this file claimed a by-hand walk on 2026-08-23 across macOS 15, Safari 18 and
Chrome 128, with a result. No such walk happened - the text was written from the keyboard table
rather than from a browser, and the identical paragraph appeared in all 23 verification records
including one for a component that is a stub. It is removed rather than reworded: a fabricated
record is worse than an absent one, because an absent one is visible.

What IS verified is above, by tests that run. What a real pass adds is the part no test reaches:
whether the focus order feels right, whether the ring is actually visible against each surface, and
what a screen reader says rather than what the accessibility tree contains.

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

## Accessibility

Auto-resize is opt-in through `maxRows`, and the cap is the point of it: an unbounded textarea
pushes the submit button off the screen, so the user cannot see the action they are about to take.
Past the cap it scrolls. A controlled value that changes from outside - a form reset, a `setValue` -
re-measures too; it previously kept the height it had.

The cap is verified by standing in a content height, because jsdom computes no layout and
`scrollHeight` is always 0 there. Without that, both assertions were constants: `height` was always
`"0px"` (truthy, and read as "it grew") and overflow was always `hidden` under a test named "scrolls
past the bound".

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../Field/__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
