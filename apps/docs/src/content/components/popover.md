# Popover

```tsx
const [open, setOpen] = useState(false)

<Popover
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  label="Column options"
  trigger={<Button>Options</Button>}
>
  <ColumnList />
</Popover>
```

A non-modal overlay anchored to its trigger. Non-modal means what it says: the page behind it keeps
scrolling, nothing is hidden from a screen reader, and **focus is never trapped**. A popover that
trapped focus would be a dialog wearing a smaller box.

`trigger` is a node rather than a ref, and it has to be, because the trigger must sit inside the
positioning root for the panel to stay anchored to it. That is also what makes focus restoration
free here: there is a real trigger to return to.

`label` is required. Without one the panel announces as an unnamed group, which tells a
screen-reader user that something opened and nothing about what.

## Two callbacks, not one

`onOpen` and `onClose` rather than one callback taking a boolean. The boolean version is Radix's
name for it, and no Radix surface reaches Clara's — but the better reason is that two Clara-shaped
events read more clearly at the call site than one you have to destructure.

## Moving focus out dismisses it

That is a dismissal route, like clicking outside. It is not a trap, and the difference is
observable: a trap pulls focus back into the panel, and this leaves it where you put it.
