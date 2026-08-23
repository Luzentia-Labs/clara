# Textarea

A multi-line text control.

```tsx
<Field label="Notes">
  <Textarea rows={3} maxRows={8} />
</Field>
```

## Auto-resize is opt-in, and always capped

Pass `maxRows` to make the control grow with its content. Omit it and the height is fixed.

The cap is the feature, not a limit bolted onto it. An unbounded textarea grows until the submit
button is off the screen, and the user cannot see the action they are about to take. Past `maxRows`
the control scrolls.

A controlled value that changes from outside - a form reset, a `setValue` - re-measures too.

## Keys

Enter inserts a newline and does not submit. Tab leaves the control rather than indenting: a
textarea that captures Tab is a keyboard trap.
