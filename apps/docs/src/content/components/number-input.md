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

## Naming any of min, max or step makes it a spinbutton

Supplying `min`, `max` **or** `step` opts the control into numeric semantics: it becomes a
`role="spinbutton"`, gains the arrow, Page and Home/End keys, and announces whichever of
`aria-valuemin` / `aria-valuemax` / `aria-valuenow` it has.

Supplying **none** leaves it a plain textbox, and that is the point: an account code is not a value
in a range. Announcing a range for one is noise, and - worse - the stepping keys would rewrite it.
`00417` with Arrow Up must stay `00417`, and the arrow key must keep moving the caret.

A `step` with no bounds is an ordinary case (a quantity with no maximum), so it steps and announces
`aria-valuenow` without a min or max.

Steps are rounded to the precision `step` implies, so a `0.1` step does not write
`0.30000000000000004` into a currency field.

## Keys

| Key | Result |
| --- | --- |
| Arrow Up / Down | Step by `step` (default 1), clamped to `min` and `max`. |
| PageUp / PageDown | Step by ten times `step`, clamped. |
| Home / End | Jump to `min` / `max`. No-op when that bound is not set. |
| Any of the above, with no min/max/step | Nothing. The control is a plain textbox and the keys behave as they would in one. |

## Not built yet

**Thousands separators are not implemented.** Formatting a value while it is being typed has to
preserve the caret across every insertion, deletion and paste, and getting it wrong is worse than
not doing it. It is tracked separately; today, format for display outside the control.
