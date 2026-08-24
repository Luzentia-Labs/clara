# Modal

A dialog that takes focus, keeps it, and gives it back.

```tsx
const [open, setOpen] = useState(false)
const reasonRef = useRef<HTMLInputElement>(null)

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Reverse this posting"
  description="The reversal is dated today and cannot be undone."
  initialFocus={reasonRef}
  footer={<>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    <Button onClick={commit}>Reverse</Button>
  </>}
>
  <Field label="Reason"><Input ref={reasonRef} /></Field>
</Modal>
```

## One callback, every route

`onClose` is called for **all four** ways a dialog ends: Escape, a click on the scrim, the close
button, and whatever your footer does. There is deliberately not a separate prop per route - a
consumer who has to remember to wire a fourth one will forget, and the symptom is a keyboard user
stranded on `<body>` with no way back to where they were.

Focus returns to whatever opened the dialog. You do not have to do anything for that to work. Pass
`returnFocus` only when the opener is about to disappear - a row action whose row the dialog
deletes, for instance.

## Name the field, not the dialog

`initialFocus` should point at the thing the user came here to do. Without it, focus lands on the
close button: safe, and almost never useful.

Do not point it at the destructive action. A dialog that opens with **Delete** focused turns a
stray Enter into a deletion.

## `title` is required

An unnamed dialog is announced as "dialog", which tells a screen reader user nothing about what just
took over their screen. It is a required prop so the omission is a compile error rather than
something an audit finds later.

Use `description` for the **consequence**, not for instructions. "This cannot be undone" belongs
there; "Enter a reason below" does not, because the field's own label already says that.

## When not to use one

| Instead of a Modal | Use |
| --- | --- |
| Confirming something reversible | Nothing. Do it, and offer Undo in a Toast. |
| A form longer than the viewport | A page. A modal that scrolls internally is a page in a costume. |
| Showing a validation error | The Field's own `error`. |
| A menu, or a picker attached to a control | DropdownMenu or Select - they position against the control instead of taking the screen. |

`dismissible={false}` blocks Escape and the scrim click for a decision that must be answered. It
does **not** remove the close button, because a dialog with no way out is a trap rather than a
safeguard.

## Stacking

Every Clara overlay shares one layer and nests by **open order**: whatever was opened last is on
top. A Select opened inside a Modal clears it; a Modal opened over a menu covers the menu. You do
not set a `z-index`, and there is no per-role token to reach for. See
[design tokens](../foundations/tokens.md) for what that asks of your own page chrome.

## Motion

There is none, on purpose. A centred dialog has no direction to come from, and the whole viewport
dimming is already an unmistakable signal. Because there is no animation, there is nothing for
`prefers-reduced-motion` to reduce.

## Accessibility

- `role="dialog"` with `aria-modal`, named by `title` and described by `description`.
- Focus moves in on open and cannot leave: Tab wraps at both ends.
- The background is **inert**, not merely focus-trapped, so a screen reader cannot browse it either.
- Escape works from inside a text input.
- The page behind is scroll-locked, with the scrollbar's width given back as padding so nothing
  shifts sideways when the dialog opens.
