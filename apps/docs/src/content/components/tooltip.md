# Tooltip

```tsx
<Tooltip content="Recalculates every open line on this order">
  <IconButton icon={<RefreshIcon />} label="Recalculate" />
</Tooltip>
```

A short explanation attached to a control. It opens on **focus as well as hover**, which is the
whole reason it exists: a hover-only tooltip is invisible to everyone not using a mouse, and that is
the population most likely to need the explanation.

`content` is a `string`, not a node, and that is deliberate. A tooltip's content is not in the tab
order, is announced through `aria-describedby` on the trigger, and disappears the moment attention
moves — so a focusable element inside one is a control that paints and cannot be operated. Typing it
as a string makes that unrepresentable instead of leaving it to a documentation warning nobody
reads.

## The child must be focusable

`aria-describedby` is wired onto whatever `children` renders. Put the tooltip on a `<button>`, an
`IconButton`, a link — something a keyboard user can reach. A tooltip on a `<span>` describes
something nobody can focus, so the explanation never arrives.

Clara warns about this in development, naming the element it found. If you genuinely need a
non-interactive trigger, `tabIndex={0}` makes it focusable and the warning stops.

## A tooltip is never the only route to essential information

If losing the tooltip would lose the meaning, the tooltip is the wrong control. It is transient by
design and unavailable on touch, so anything essential belongs in the visible label, helper text, or
a Popover the user can open and keep open.

## WCAG 1.4.13

Content that appears on hover or focus has to be dismissable, hoverable and persistent. All three
are on by default and none of them is a prop:

- **Escape** dismisses it without moving the pointer.
- The pointer can travel from the trigger to the tooltip without it vanishing underneath.
- It stays until focus or the pointer leaves.

There is no `disableHoverableContent`, deliberately. A prop that switches the hover bridge off is a
prop that lets a consumer fail 1.4.13.

## Keyboard

| Key | Result |
| --- | --- |
| Tab | Moves focus to the trigger, which opens the tooltip immediately — no hover delay applies to focus. |
| Tab (again) | Moves focus off the trigger, which closes it. The content is never in the tab order. |
| Escape | Dismisses it without moving focus or the pointer. |

## The open delay

A tooltip opens 700 ms after the pointer arrives, and immediately on focus. Each Tooltip manages its
own timing, so moving along a toolbar waits out that delay on every button rather than showing the
second and third instantly. If that becomes a problem on a real dense toolbar, the fix is a shared
grouping provider — it is not in the API yet because nothing has yet shown it is needed, and public
API is permanent once published.
