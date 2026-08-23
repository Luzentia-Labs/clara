# Button, IconButton, ButtonGroup

```tsx
<ButtonGroup label="Order actions">
  <Button variant="primary" onClick={save}>Save</Button>
  <Button onClick={cancel}>Cancel</Button>
</ButtonGroup>
```

## Disabled keeps its tab stop

Clara uses `aria-disabled`, not the native attribute. A natively disabled button leaves the tab
order, so a keyboard user can never reach it - and the explanation for why it is disabled is usually
attached to it. Activation is suppressed in the handler instead, including `preventDefault` for
`as="a"`, which would otherwise navigate.

`loading` sets `aria-busy` and preserves the button's width, so the layout does not jump.

## IconButton needs a name

`label` is a required prop. An icon-only button with no accessible name is the most common
accessibility defect in enterprise UI, and making it a compile error is cheaper than finding it in
an audit. The icon itself is hidden from assistive technology so the control is not announced twice.

## ButtonGroup is a toolbar

One tab stop for the group, arrow keys within it, wrapping, plus Home and End. That is toolbar
behaviour, and it applies to every ButtonGroup rather than changing based on what is inside it - a
component that silently switched keyboard models would be worse than either choice (D0059).
