# Toast

```tsx
const [open, setOpen] = useState(false)

<Toast
  open={open}
  onClose={() => setOpen(false)}
  intent="success"
  title="Journal 4471 posted"
/>
```

A transient notification that is announced, and that never disappears before it is read.

## `intent` decides how it is announced AND whether it persists

Those look like two settings and are one. An error is the only toast whose content you have to act
on, so:

- **`danger`** is announced **assertively** and **does not auto-dismiss**.
- **Everything else** is announced politely and dismisses after about five seconds.

There is no `duration` prop and no `politeness` prop, deliberately. Separate props would let you
build the incoherent halves — an assertive toast that vanishes before it can be read, or a permanent
one nobody is told about.

## The timer pauses while you are reading

Hovering the toast, or moving focus into it, pauses the dismiss countdown; it resumes when you leave.
A toast that expired while you were tabbing toward its "Undo" button would take the action away at
the moment you reached it.

## Colour is never the only carrier

The stripe down the side shows the intent, and the intent word is also joined to the accessible name.
A screen reader reads "Error: Could not post journal 4471" — not the title alone in a colour nobody
hears.

## One action, and its label has to be complete

`action` takes a single control: "Retry", "Undo", "View". A toast is transient, so an action whose
label needs explaining is the wrong action — put it behind "View", which opens a surface with room
to explain.

## Keyboard

| Key | Result |
| --- | --- |
| F8 | Moves focus into the toast viewport. This is how a toast is reachable without a pointer. |
| Tab | Moves through the action and the close button once the viewport has focus. |
| Enter / Space | Activates the focused control. |
| Escape | Returns focus out of the viewport. |

## Stacking with a Tooltip

Toasts and tooltips share one layer on purpose, and whichever opened **last** paints on top. That is
not an oversight — the relationship genuinely runs both ways. A tooltip on a toast's own "Retry"
button has to sit above the toast, and a toast that has just arrived has to sit above a tooltip that
was already open. No fixed number satisfies both.
