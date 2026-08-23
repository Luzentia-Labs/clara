# CheckboxGroup

Many answers to one question - the mirror of RadioGroup, and deliberately not the same keyboard
model.

```tsx
<Field label="Notify by" labelFor="group">
  <CheckboxGroup name="notify" legend="Notify by" defaultValue={['email']} options={[
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
  ]} />
</Field>
```

## Every box is its own tab stop

Unlike RadioGroup. That is correct: the options are independent, so each one is a separate decision
and each deserves its own stop.

## Required

There is no `aria-required` here. A `<fieldset>` is `role="group"`, which does not support it - and
"at least one of these" is a form-level rule rather than a property of a group whose boxes are each
independently optional. Inside a `<Field required labelFor="group">` the requirement is appended to
the group's caption as text, so it is actually announced.

## Controlled and uncontrolled

Both work. Uncontrolled, the group holds its own set: `onChange` always reports the full selection,
not just the box that was touched.
