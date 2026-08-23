# Field framework - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

The Field owns the wiring every control inherits: one generated id, a label element bound by `htmlFor` for a single control and by `aria-labelledby` for a group, `aria-describedby` ordered description-then-error, `aria-invalid` and `aria-errormessage` when invalid.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

The label is a click target that moves focus into the control. Nothing in the Field itself takes a tab stop - the control does.


| Key | Result |
| --- | --- |
| Tab | Moves to the control. The Field itself takes no tab stop. |
| Click on the label | Moves focus into the control (`labelFor="control"` only; a group is named by `aria-labelledby` and has no `htmlFor`). |
| Tab, when disabled | Still reaches the control. `aria-disabled` keeps the tab stop so the reason attached to the field can be read. |

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

Ids come from `useId()`, so hydration does not re-wire the description. What is asserted is the
HYDRATION property, not "a server render and a fresh client render agree" - those legitimately
differ, because `useId` numbers each root independently. React keeps the server's attributes when
hydration disagrees, so the mismatch REPORT is the observable signal and that is what the test
asserts on.

`labelFor` decides what the label names: `control` binds it with `htmlFor`, `group` gives it an id
for a RadioGroup or CheckboxGroup to reference with `aria-labelledby`. It is explicit rather than
detected because detecting it needs an effect, and an effect that swaps `<label>` for `<span>` after
mount changes the markup between the server render and hydration. There is no placeholder-as-label path: a Field without a label does not compile. The error region is rendered only when there IS an error, so `role="alert"` announces on appearance instead of firing on mount.

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
- **The announced string order is checked manually** (AC5). The DOM order of `aria-describedby`
  determines it, and that is asserted in the tests, but what VoiceOver reads is recorded by hand.
