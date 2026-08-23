# Switch

A binary control whose change takes effect **immediately**, with no separate save step.

```tsx
<Switch label="Email alerts" checked={alerts} onChange={(e) => setAlerts(e.currentTarget.checked)} />
```

## Switch or Checkbox?

This is the only decision the component asks you to make, and it is decided entirely by **when the
change takes effect** - not by how the control looks.

| Use | When |
| --- | --- |
| **Switch** | Flipping it applies the change **immediately**. There is no Save button, and the system state changes the moment the user releases the control. |
| **Checkbox** | The value is part of a form that is submitted later. Nothing happens until Save. |

A switch inside a form with a Save button is the common misuse: it promises immediacy the form does
not deliver, so the user believes the setting is already applied and navigates away. Use a Checkbox
there. Equally, a checkbox wired to an immediate side effect under-promises - the user reaches for a
Save button that does not exist.

Because a switch applies immediately, it needs somewhere to put failure. If the write can fail,
reflect the failure on the control (revert it and explain), rather than leaving it showing a state
the server never accepted.

## Accessibility

- `role="switch"`, so it is announced as "on" or "off", not "checked" or "ticked".
- The label is a real `<label>`, so the text is a click target - and inside a `<Field>` the Field's
  label is the name instead, because two labels on one control make the accessible name both of
  them concatenated.
- The on state is not communicated by colour alone.
- There is no indeterminate switch. A switch is on or off; a third state means you want a Checkbox.
