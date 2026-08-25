# Spinner

```tsx
<Spinner label="Loading invoices" />
```

A busy indicator. `label` is required and there is no default, because the default Clara could have
supplied is "Loading" — which, on a screen with four regions loading at once, tells a screen-reader
user that something is loading and not which thing.

The ring is the same one `<Button loading>` draws. One implementation, so the two cannot end up
turning at different rates on the same screen.

## The motion is never the only carrier

No state in Clara is carried by motion alone. The ring says *right now*; the label says *what*. That
is why the label is required in both motion preferences and is never the thing that gets removed.

Under `prefers-reduced-motion: reduce` the ring stops rotating and pulses between two colours
instead — same period, no displacement. It is **replaced, not removed**: a spinner that stops is
indistinguishable from a system that has hung, which is the exact thing a busy indicator exists to
deny.

## One indicator per region

Never one per row, never one per cell. A loading table shows one indicator or a set of skeletons,
not forty rings. A form submitting shows one on the submit control, not one per field.

Six spinning rings in peripheral vision is its own accessibility problem, and it is not one a token
can fix — it is a composition you choose.
