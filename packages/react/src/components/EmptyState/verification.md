# EmptyState - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

The state a dense list screen is in more often than anyone designs for.

**Boundary:** server-capable (see `../../../client-boundary.json`). `action` is a NODE, not a
callback, so whatever handler it carries belongs to the consumer's own component and EmptyState
stays free of function props. A list screen can therefore be a Server Component and still render
its empty case.

## Keyboard

Not focusable. Any tab stop inside it belongs to the `action` the consumer supplied, and behaves
however that component behaves.

| Key | Result |
| --- | --- |
| Tab | No stop of its own. Reaches the action, if there is one. |
| Any key | No handler. |

## Recorded manual keyboard pass

**Not performed, and there is little for one to walk.** EmptyState takes no focus and handles no
key. What a pass would confirm is not keyboard but announcement order: whether a screen reader
reads the title before the guidance when the state appears after a filter change, which is the only
moment its `role="status"` matters.

## Accessibility

`role="status"` rather than `role="alert"`. An empty list is information, and it is already the
thing the user is looking at - interrupting a screen reader mid-sentence to announce it would be
shouting about the obvious.

**A claim that used to sit here was false and is corrected.** It read "It still announces, because
the state usually appears in response to a filter change the user made without looking at this
region." The second half is the case that is MOST at risk, not least: the region and its text are
created in the same commit, which is precisely the shape this repo records as commonly silent. See
the stated gap below.

## The distinction this component exists for

`reason` is required and closed: `empty` means no records exist, `filtered` means records exist and
none matched. They call for opposite actions, and a user shown the wrong one either hunts for data
that was filtered out or creates a duplicate of a record that was there all along.

Two things make the distinction survive contact with an author:

- **It is in the DOM**, as `data-reason` and a modifier class, not only in the copy. An author can
  write "Nothing found" for both cases; the markup still says which is which, so a test and a
  consumer's own styling can both read it.
- **`action` is REQUIRED on `filtered` and optional on `empty`**, enforced by the type. A filtered
  empty state with no way out is a dead end - the records exist and the only route back is
  remembering which filter was set. An empty list with no create button is merely uneventful,
  because the data may legitimately arrive from somewhere else.

## What is verified automatically

- The two cases are distinguishable in the markup, independent of the copy -
  `__tests__/empty-state.test.tsx`
- Each case's default guidance points at a different way forward, and the two do not read the same
  - `__tests__/empty-state.test.tsx`
- An author-supplied description replaces the guidance without losing the distinction -
  `__tests__/empty-state.test.tsx`
- It announces as `status` - `__tests__/empty-state.test.tsx`
- It renders on the server - `__tests__/empty-state.test.tsx`
- axe (serious and critical) in both cases and in all four theme x density combinations -
  `check:axe`, `__tests__/empty-state.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`

## Stated gaps

- **The announcement may not actually be made, and nothing here can tell.** The `role="status"`
  region and its text are created in the SAME commit, and this repo has already recorded, in
  the Input component, that "a region that appears in the same commit as its text is
  commonly not announced at all - so the boundary crossing, the one announcement that matters, was
  the likeliest to be silent". Input answers it with an announcer that is always present and empty
  until there is something to say; that shape needs an effect, and an effect makes a component
  client-only.

  What IS proved here: the region exists, carries `role="status"`, is not silenced with
  `aria-live="off"` or `aria-hidden`, and appears exactly once. What is NOT proved is that a screen
  reader speaks it, and no gate in this repository can decide that - jsdom has no announcement
  model and axe reads the accessibility tree rather than what is spoken.

  Filed as **BG-01M11JWY**, with the boundary trade-off stated: the fix is known, and paying for it
  costs this component its server classification.

- **Nothing enforces that the TITLE distinguishes the two cases.** The type forces a `reason` and
  an escape route; it cannot force "No invoices yet" over "Nothing found". The docs page carries
  that guidance, which is the half of AC1 that is documentation by nature.
- **The announcement ORDER is unverified.** `getByRole('status')` proves the live region exists;
  nothing automated proves a screen reader reads the title before the guidance when the state
  replaces a table after a filter change. Named in the manual pass above.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME), so the rendered appearance is
  unverified - only the markup and the tokens are.
