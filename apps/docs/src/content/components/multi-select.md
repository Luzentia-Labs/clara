# MultiSelect

```tsx
<Field label="Currencies">
  <MultiSelect
    options={[
      { value: 'gbp', label: 'Pound sterling' },
      { value: 'eur', label: 'Euro' },
      { value: 'usd', label: 'US dollar', disabled: true },
    ]}
    values={currencies}
    onValuesChange={setCurrencies}
  />
</Field>
```

Several choices from a known list, each shown as a removable tag.

## Put it in a Field

`MultiSelect` takes no `label` prop, like every other Clara control: the Field owns the label. The
trigger is a `role="combobox"`, and that role does not take its accessible name from its contents,
so a `MultiSelect` outside a Field has **no name at all** - not a poor one, none.

## The list stays open

Choosing does not close the list, unlike `Select`. Picking five values should not mean opening the
list five times. `Escape` closes it, in every mode.

`Tab` closes it and **commits nothing**. In a single-select, Tab commits the highlighted option
deliberately. Here the highlight is a cursor rather than an intent, and where selections accumulate
a value added by accident may never be noticed - so Tab leaves the selection exactly as it was.

## The tags are the undo

Each selection renders as a removable `Tag`, and each remove control is named with the value it
removes - `Remove Euro`, not `Remove`. A keyboard user tabbing through several otherwise hears the
same string every time and cannot tell which one they are about to drop. This is why the tags are
worth the row they occupy: they are how a choice is undone without reopening the list.

## What is announced

A polite live region reports the new count whenever the selection changes. It is the only signal a
screen-reader user gets that a toggle landed, because the list stays open and focus never leaves the
trigger.

## Values, not events

`values`, `defaultValues` and `onValuesChange` hand you the array itself. The trigger is a button
with no meaningful `event.target.value`, so an event would force you to reach through a synthetic
object for the one thing you wanted.
