# NumberInput

A numeric entry control for quantities, amounts and codes.

```tsx
<Field
  label="Quantity"
  description="Between 1 and the remaining quantity on the order"
  error={errors.qty}
>
  <NumberInput min={1} max={remaining} step={1} value={qty} onChange={onQty} />
</Field>
```

Note what the example shows and why. **A bounded NumberInput belongs in a Field that supplies the
error**, because the control does not detect errors itself - see below. And the range is in the
`description`, where every user can read it: `min` and `max` alone reach only a screen reader user
who focuses the field.

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

## The bounds are not enforced against typing, and the control does not flag it

`min` and `max` never reach the DOM, so the browser blocks nothing: clamping as the user types
fights them mid-entry, and rejecting a keystroke loses a paste. They clamp STEPPING, and they are
announced.

The control also does not mark itself invalid when a typed value falls outside them, and that is a
deliberate reversal. An earlier version did, and it fired while the user was typing correctly - a
valid `500` in a `min={100}` field passes through `5` and `50` on the way. It was also invisible to
sighted users, and once a control detects an error WCAG 2.2 SC 3.3.1 obliges it to describe that
error **in text** - which Clara has no honest way to write, because the real constraint on a
quantity in an ERP is the remaining amount on the order, not `max`.

So detection stays with your form, which is running it anyway, and the Field stays the single source
of invalidity. Supply `error` when the value is wrong.

**Clara will tell you if you forget.** In development only, a control holding an out-of-range value
inside a Field with no `error` logs one console warning when the field is blurred. It is stripped
from production builds, says nothing to your user, and fires on blur rather than on every keystroke -
a warning that cries wolf while someone types a correct value is one you learn to ignore.

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
