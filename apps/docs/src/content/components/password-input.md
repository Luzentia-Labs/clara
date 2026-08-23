# PasswordInput

A masked text control with a reveal toggle.

```tsx
<Field label="API key">
  <PasswordInput />
</Field>
```

## The toggle names the action, not the state

It reads "Show password" while the value is hidden and "Hide password" while it is revealed - the
action it will perform. A name that reports the current state is read at the wrong moment and tells
the user the opposite of what pressing it does.

The toggle is a real button: it is in the tab order and operable with Enter and Space. Revealing
does not move focus out of the field, so the user can keep typing.
