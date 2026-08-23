# Field

The wrapper that gives a control its label, description and error, and wires the associations
between them. Every Clara form control reads its wiring from a Field.

```tsx
<Field label="Supplier" description="Registered name" error={errors.supplier}>
  <Input {...register('supplier')} />
</Field>
```

## What it wires for you

| You write | The control gets |
| --- | --- |
| `label` | A real `<label>` bound by `htmlFor`. There is no placeholder-as-label path. |
| `description` | A `<p>` with an id, first in `aria-describedby`. |
| `error` | A `role="alert"` region, second in `aria-describedby`, plus `aria-invalid` and `aria-errormessage`. |
| `required` | `aria-required`, and a visible asterisk that is `aria-hidden` (the announcement comes from the property). |
| `disabled` | `aria-disabled` and `readOnly` - **not** the native `disabled` attribute. See below. |

Description before error is deliberate: the hint explains what to enter, the error explains what went
wrong with what was entered, and that is the order a person needs them in.

## Wrapping a group

A `RadioGroup` or `CheckboxGroup` is a `<fieldset>`, and `htmlFor` cannot target a fieldset. Pass
`labelFor="group"`:

```tsx
<Field label="Payment terms" labelFor="group">
  <RadioGroup name="terms" legend="Payment terms" options={terms} />
</Field>
```

Without it the label binds to an id that does not exist: it moves focus nowhere and names nothing,
and no automated check can see it - axe has no rule for an orphan `for`.

## Disabled keeps its tab stop

Clara disables with `aria-disabled` plus `readOnly`, never the native attribute. A natively disabled
control leaves the tab order, so a keyboard user can never reach it - and an ERP form is frequently
mostly disabled, with the reason attached to the very control they cannot reach.

Two consequences you should know about:

- **A disabled field still submits.** Native `disabled` excludes a control from form submission;
  `aria-disabled` does not. Omit the value yourself when building the payload, or do not render the
  field at all when it should not be sent.
- **Each control suppresses its own change.** That is handled inside Clara; you do not need to guard
  your own `onChange`.

## Composition

The wiring travels by React context, so the control does not have to be a direct child. A control
inside a layout primitive, a fragment or a tooltip is wired exactly the same.
