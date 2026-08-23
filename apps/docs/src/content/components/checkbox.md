# Checkbox

A tri-state box: checked, unchecked, or indeterminate.

```tsx
<Field label="Include cancelled orders">
  <Checkbox checked={value} onChange={(e) => setValue(e.currentTarget.checked)} />
</Field>
```

Used standalone, pass `label` and the control renders its own. **Inside a `<Field>` it does not** -
the Field's label is the name, and two labels pointing at one control make the accessible name both
of them concatenated.

## Indeterminate

`indeterminate` is a DOM property with no HTML attribute, and Clara keeps it applied - including
after a click, which clears it natively. A "select all" that draws a tick while announcing "mixed"
is how a partially-selected table lies about what a bulk action will affect.

It is announced as `aria-checked="mixed"`.

## Not colour alone

The checked state is drawn by the native control - `accent-color` only tints the tick. A custom box
would have to redraw the mark, which is how the mark gets lost and colour becomes the only signal
(WCAG 1.4.1).
