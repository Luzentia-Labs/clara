# Alert - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A banner carrying an intent - a form-level error, a saved confirmation, a policy warning.

**Boundary:** client-only (see `../../../client-boundary.json`). `onDismiss` is a function prop,
which TRD Section 7 makes the boundary test. A non-dismissible Alert would be server-capable; it
stays ONE component for the reason Tag does, so the choice is not moved into the consumer's import
statement.

Worth recording because it nearly shipped wrong: Alert had a `special` note explaining its boundary
and **no entry in `components` at all**, so the edit that classified it matched nothing. The BUILD
refused rather than a guard - an unclassified component fails `chunkFor` outright, which is the
right layer for it, since a client component that ships unmarked crashes the server render of every
App Router consumer.

## Keyboard

A non-dismissible Alert is not focusable and adds no tab stop.

| Key | Result |
| --- | --- |
| Tab | Moves to the dismiss control, when there is one. A static Alert has no stop. |
| Enter | Activates the dismiss control. |
| Space | Activates the dismiss control. Native `<button>` behaviour, unchanged. |
| Escape | No handler. An Alert is part of the page, not a dismissible overlay - Escape belongs to the overlay that contains it, if any. |

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether a screen reader actually interrupts on a
`danger` Alert appearing mid-task and stays quiet on a `success` one, which is the whole point of
the role split below. `getByRole` proves the role is present; it does not prove the announcement
behaves.

**To record one:** trigger each intent while a screen reader is mid-sentence, in both themes and
both densities; then replace this section with the date, the OS, the screen readers, and what each
did.

## Accessibility

**The intent is carried twice, on purpose, and neither carrier substitutes for the other.** The
ICON carries it on screen - an icon is what makes this not colour-alone for a sighted user who
cannot separate the hues. The visually-hidden WORD carries it in the accessibility tree, where the
icon is `aria-hidden` precisely so the intent is announced once rather than twice.

**`role` differs by intent.** `danger` and `warning` are `role="alert"`, an assertive live region
that interrupts whatever a screen reader is saying. `info` and `success` are `role="status"`, which
waits its turn. An error the user must act on interrupts; a confirmation does not.

## What is verified automatically

- Every intent renders an icon, and the icon is `aria-hidden` - `__tests__/alert.test.tsx`
- Every intent carries its word into the accessible name - `__tests__/alert.test.tsx`
- The role split, asserted per intent - `__tests__/alert.test.tsx`
- **Every intent's foreground/background pair meets its threshold in BOTH themes**, measured with
  `contrastRatio` over the token build's own emitted pairings - `__tests__/alert.test.tsx`. A
  missing pairing fails rather than skips, so the loop cannot report success over four `undefined`s.
- The dismiss control is reachable by Tab and activates on Enter; a static Alert renders no control
  at all - `__tests__/alert.test.tsx`
- The dismiss control clears 24x24 in both densities, measured in a real browser - `check:geometry`
- axe (serious and critical), dismissible and static, with and without a title, and in all four
  theme x density combinations - `check:axe`, `__tests__/alert.test.tsx`
- Token-only styling, and a two-part focus indicator (D0054) - `check:component-css`

## Stated gaps

- **The role split is verified as MARKUP, not as behaviour.** `getByRole('alert')` proves the
  attribute; nothing automated proves a screen reader actually interrupts. Named in the manual pass
  above as the thing that pass would add, because it is the reason the split exists.
- **The intent icons are not verified as distinguishable from each other** at the size they render,
  which is the icon analogue of the gap Badge records for its hues.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME), so the rendered appearance is
  unverified - only the markup, the tokens, the measured contrast and the measured target size are.
