# Table

**This component is a stub, and it is not exported yet.** `@luzentialabs/clara-react` does not export
`Table` or `TableSortButton`, so the example below does not compile against the published package. It
is here because the pieces exist and are tested in the repo, and because the row-surface decision
below should not be re-derived when the real component is built.

**This component is a stub.** It renders a native `<table>` and adds nothing else.

```tsx
<Table>
  <caption>Open purchase orders</caption>
  <thead><tr><th scope="col">Reference</th></tr></thead>
  <tbody><tr><td>PO-4417</td></tr></tbody>
</Table>
```

Correct semantics come from your markup - `<caption>`, `<th scope>`, real header rows - and the
browser. Clara adds none of its own yet and claims none.

## What is not built

Sorting, selection, column resizing, sticky headers and virtualisation. Those are the parts that
need keyboard and announcement design, and they are tracked separately.

`TableSortButton` exists and is tested: it is the header control that reports the direction it was
SHOWING when activated, leaving the caller to decide what happens next. The table that would use it
does not exist yet.

## Row surfaces - decided, not yet rendered

An ERP row is routinely striped, hovered, selected and focused at once. The resolved order is
focus > selected > hover > striped, with selected and hover **composing** rather than one replacing
the other - hovering a selected row still looks selected, because otherwise the user loses track of
what they picked at the moment they reach for it. Focus is drawn over the row rather than replacing
its background (D0055).
