# NumberInput

A numeric entry control for quantities, amounts and codes.

```tsx
<Field label="Quantity">
  <NumberInput min={0} max={999} step={1} value={qty} onChange={onQty} />
</Field>
```

## Why it is not `type="number"`

A number input discards what it cannot parse and strips leading zeros from things that are
identifiers rather than quantities - order numbers, account codes, and an ERP is full of them. It
also changes its value when the page is scrolled over it, which is the reason it has the reputation
it has in data entry.

Clara uses `type="text"` with `inputMode="decimal"`, so the numeric keypad still appears on touch,
the value stays a string, and a scroll gesture cannot edit a figure the user is not looking at.
Validation stays the form's job.

## Bounds make it a spinbutton

Supplying `min` or `max` turns the control into a `role="spinbutton"` and announces the bounds with
`aria-valuemin` / `aria-valuemax` / `aria-valuenow`. Without a bound it is a plain textbox, which is
correct: an account code is not a value in a range, and announcing a range for one is noise.

Steps are rounded to the precision `step` implies, so a `0.1` step does not write
`0.30000000000000004` into a currency field.

## Not built yet

**Thousands separators are not implemented.** Formatting a value while it is being typed has to
preserve the caret across every insertion, deletion and paste, and getting it wrong is worse than
not doing it. It is tracked separately; today, format for display outside the control.
