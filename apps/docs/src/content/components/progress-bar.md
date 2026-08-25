# ProgressBar

```tsx
<ProgressBar label="Posting invoices" value={62} />
<ProgressBar label="Checking supplier" indeterminate />
```

`label` is required. "62%" of what is the question a label answers.

`indeterminate` takes no `value`, and that is enforced by the type — the two are separate variants,
so `<ProgressBar indeterminate value={0} />` does not compile. An indeterminate bar omits
`aria-valuenow` entirely, because that is what indeterminate means in ARIA. Reporting `0` would be a
confident claim that nothing has happened yet.

Out-of-range values clamp. If your arithmetic produces 105 of 100, you get a full bar rather than
one that runs past its track.

## A determinate bar does not animate

Its width is data. A transitioned width shows a number that is not the current value for the length
of the transition — while `aria-valuenow` already reports the new one. For those 200ms a sighted
user and a screen-reader user are reading different values off the same component.

This is asserted in a browser as exactly `0s`, so a 1ms transition does not pass for compliance.

## An indeterminate bar traverses, and never bounces

A segment crosses the track and starts again. It never reverses: a bar that bounces backwards reads
as a failure or an undo, which is a different message from "still working".

Under `prefers-reduced-motion: reduce` the traverse stops — a traverse is a translation, and
translation is what triggers the vestibular response — and the whole track pulses between two
colours instead, on the same period. A parked segment would read as a percentage it does not know.
