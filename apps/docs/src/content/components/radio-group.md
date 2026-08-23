# RadioGroup

One answer to one question.

```tsx
<Field label="Payment terms" labelFor="group">
  <RadioGroup name="terms" legend="Payment terms" options={[
    { value: '30', label: 'Net 30' },
    { value: '60', label: 'Net 60' },
  ]} />
</Field>
```

Pass `labelFor="group"` on the Field: `htmlFor` cannot target a fieldset.

## There is no standalone Radio

Clara exports none, deliberately. A lone radio is a control the user cannot deselect, and shipping
one invites exactly that.

## Keyboard

The group is **one tab stop**, and arrow keys move and choose within it. That is the browser's own
behaviour for same-named radios, not a roving `tabindex` implementation, so it stays correct
everywhere without Clara maintaining it.

## Errors belong to the question

`aria-invalid` and `aria-errormessage` sit on the fieldset, not on an individual radio. Marking every
option invalid says each answer is wrong, when what is wrong is that none was chosen.
