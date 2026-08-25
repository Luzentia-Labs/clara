# Alert

```tsx
<Alert intent="danger" title="Posting failed">
  Three invoices could not be posted. Check the period and try again.
</Alert>

<Alert intent="success" onDismiss={() => setSaved(false)}>Saved.</Alert>
```

A banner carrying an intent. `intent` is required - there is no neutral alert, because that is a
paragraph.

**The intent is carried three ways and you need all three.** The colour is emphasis. The icon is
what a sighted user reads when they cannot separate your warning hue from your danger hue. The word
- "Error:", "Warning:" - is what a screen reader announces, and it is why the icon is `aria-hidden`:
the intent is said once, not twice.

**`role` is chosen for you, and it differs.** `danger` and `warning` render `role="alert"`, which
interrupts a screen reader mid-sentence. `info` and `success` render `role="status"`, which waits.
An error someone must act on interrupts; a confirmation does not. If you find yourself wanting a
`success` alert to interrupt, the thing you want is probably an error.

`onDismiss` adds a dismiss control. Without it there is no control and no tab stop, which matters
when a form renders one alert per failed section.

## Escape does not dismiss it

An Alert is part of the page, not an overlay. Escape belongs to whatever overlay contains it - a
Modal, a Drawer - and taking that key here would make a banner swallow the dismissal of the dialog
it sits in.
