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
