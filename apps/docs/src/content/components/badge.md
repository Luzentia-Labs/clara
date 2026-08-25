# Badge

```tsx
<Badge>Draft</Badge>
<Badge intent="warning">Pending review</Badge>
<Badge intent="danger" count={3} countLabel="overdue invoices" />
```

A compact status marker. It is output, not a control: it takes no focus and handles no key.

`intent` joins the accessible name as a word, so "Overdue" in a danger badge announces as
"Error: Overdue". A screen reader therefore never depends on the colour. `neutral` is the default
and adds nothing, because announcing "neutral" on every badge in a list screen says nothing.

`count` requires `countLabel`, in the type rather than by convention - `<Badge count={3} />` does
not compile. A bare number is the one badge shape whose visible text cannot carry its own meaning:
"3" in red beside "3" in green differs by colour alone. `count={0}` renders, because "0 errors" is
a real state.

## What Badge cannot do for you

**It cannot make your visible text distinguishable.** These two are identical to a sighted user who
cannot separate the two hues:

```tsx
<Badge intent="danger">Open</Badge>
<Badge intent="success">Open</Badge>
```

The accessible names differ. The screen does not. Colour is carrying the whole distinction, which
is what WCAG 1.4.1 exists to prevent, and no API can stop you writing it. Give the two states
different words - "Open" and "Closed", "Overdue" and "Paid" - and the colour becomes what it should
be, which is emphasis on a distinction the text already makes.
