# TableSortButton - verification record

PRD F17 requires a record per component rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

The column-header control that toggles sort direction. It lives under `Table/` but is a separate
component with a separate boundary, so it carries its own record - the directory's `verification.md`
covers `Table`, which is server-capable, and this one is not.

**Boundary:** client (see `../../../client-boundary.json`). It takes an `onSort` function prop, and
a function prop is the first half of the TRD Section 7 rule.

## Keyboard

It is a real `<button>` inside the header cell, so Enter and Space activate it for free. Activating
reports the direction that was being SHOWN, not the one being moved to - the caller decides what
happens next, and a control that reported a direction it had not yet applied would be describing the
future rather than the present.


| Key | Result |
| --- | --- |
| Tab | One stop, in the header cell. |
| Enter / Space | Reports the direction that was being SHOWN. The caller decides what happens next. |

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

Operable with no handler attached, so a header rendered before its sort logic exists does not throw.

**The direction is not announced.** The accessible name is the constant "sort"; the direction is
internal state that reaches no `aria-*` and no rendered text. An earlier version of this record
claimed the opposite, and contradicted itself two paragraphs later. `aria-sort` belongs on the
`<th>`, which the Table stub does not own - so until the real Table exists there is nowhere correct
to put it, and the honest statement is that a screen reader user cannot tell which way the column
will sort.

## What is verified automatically

- axe on a correctly marked-up table - `check:axe`. **This control is not in that fixture**, so
  what is covered is the table markup around it, not this button.
- The behaviour above, in `../__tests__/Table.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified.
- **The direction is not announced at all**, as the Accessibility section above states. `aria-sort`
  belongs on the `<th>`, which the Table stub does not own, and the button's own label is the
  constant "sort". An earlier version of this line said the state was announced through the label,
  contradicting the section above it.
