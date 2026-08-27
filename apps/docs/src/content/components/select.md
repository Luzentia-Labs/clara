# Select

```tsx
<Field label="Currency">
  <Select
    options={[
      { value: 'gbp', label: 'Pound sterling' },
      { value: 'eur', label: 'Euro' },
      { value: 'usd', label: 'US dollar', disabled: true },
    ]}
    value={currency}
    onValueChange={setCurrency}
  />
</Field>
```

A single choice from a known list.

## Put it in a Field

`Select` takes no `label` prop, like every other Clara control: the Field owns the label. This
matters more here than for a text input. The trigger is a `role="combobox"`, and that role does not
take its accessible name from its contents, so a `Select` outside a Field has **no name at all** -
not a poor one, none. A screen reader announces "combobox" and stops.

## `onValueChange` gives you the value

Not an event. The trigger is a button, so there is no meaningful `event.target.value` to read, and
handing back a synthetic event would make every caller reach through it for the one thing they
wanted. Every composite control in Clara reports the value itself.

Pair `value` with `onValueChange` for the controlled form, or pass `defaultValue` and let the
component hold it.

## Disabled options stay in the list

`disabled` on an option marks it `aria-disabled` and skips it when arrowing. It is not removed,
because a list that silently loses an entry is a list a user cannot reason about - "it was here
yesterday" has no answer.

The control itself takes `disabled` too, and it means the Clara thing: `aria-disabled` and a
suppressed handler, never the native attribute. The control keeps its tab stop, so a keyboard user
can reach it and find out it is unavailable rather than tabbing straight past it.

## Escape does not choose

Escape closes and selects nothing. The highlight is a cursor, not a choice, and treating it as one
would make Escape destructive on the one key people press to back out. Tab is the key that commits -
it takes the highlighted option and lets focus carry on, because swallowing Tab strands a keyboard
user inside the control.

## It works inside a Modal

The listbox portals out and takes the shared overlay layer, so which surface paints on top is decided
by the order they opened in rather than by a number somebody picked. There is nothing to configure.
