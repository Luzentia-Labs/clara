# DateRangePicker

```tsx
<Field label="Period">
  <DateRangePicker value={range} onValueChange={setRange} />
</Field>
```

A start and an end, with presets for the ranges people actually ask for.

## One controlled pair, one callback

`value` is `{ start, end }` as ISO `YYYY-MM-DD` strings, and `onValueChange` reports both endpoints
together - including the empty range when the user clears it. A filter bar can therefore drive it,
read it, and remove it without reaching past the public API.

## Choosing a range

The first date sets the start and the panel stays open; the second completes the range and closes
it. Chosen backwards, the earlier date becomes the start - clicking the end first means a range,
not a mistake. The days between the endpoints are marked as context, distinct from the endpoints
themselves.

## Presets first

`This month`, `Last quarter` and `Year to date` are buttons before the grid in the tab order,
because "last quarter" is the request a finance user actually has and expressing it through a grid
is a dozen arrow presses and an off-by-one. "Last quarter" means the quarter *before* the current
one - a closed period, which is what makes it comparable.
