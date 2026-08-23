# Table - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A native table element. **This component is a stub.**

**Boundary:** server-capable (see `../../../client-boundary.json`). The stub is a plain element with
no state, so it renders on the server. The manifest's own note is that the static parts stay
server-capable and the interactive parts - sort, select, resize - become client when they are built;
splitting them is the reason a table can appear in a Server Component at all.

## Keyboard

Nothing beyond the browser's own table semantics is implemented yet. Sorting, selection and column
resizing - the parts that need keyboard design - are not built.

| Key | Result |
| --- | --- |
| Tab | Only what the caller's own markup provides. The stub adds no keyboard behaviour. |
| Arrow keys | Nothing. Sorting, selection and resizing - the parts that need keyboard design - are not built. |

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

It renders a plain `<table>`, so a caller supplying correct `<caption>`, `<th scope>` and header markup gets correct semantics from the browser. Clara adds none of its own yet, and claims none.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../__tests__/primitives.test.tsx` and `../__tests__/matrix.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.

- **Table is a stub.** Only the element wrapper is built and tested. Sorting, selection, resizing,
  sticky headers and virtualisation are unbuilt, so nothing about them is verified. `TableSortButton`
  exists and is tested; the table that would use it does not.
