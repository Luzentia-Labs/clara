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

## Accessibility

Operable with no handler attached, so a header rendered before its sort logic exists does not throw.
The direction is carried on the control rather than in a detached legend, so it is announced with
the column it sorts.

## What is verified automatically

- axe (serious and critical) on a correctly marked-up table - `check:axe`
- The behaviour above, in `../__tests__/Table.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified.
- **`aria-sort` is not set by this control.** It belongs on the `<th>`, which the Table stub does not
  own yet, so the sort state is currently announced only through the button's own label.
