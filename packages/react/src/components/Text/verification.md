# Text - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

Body and caption text, with tabular figures and an accessible truncation.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state,
no browser APIs, so it carries no `"use client"` directive and renders on the server.

## Keyboard

Truncated text IS focusable, deliberately. `title` appears only on hover, so a truncated value that
is not focusable cannot be read without a pointer (D0028).

| Key | Result |
| --- | --- |
| Tab | No stop - EXCEPT when `truncate` is set, which makes the element focusable so a truncated value can be reached without a pointer (D0028). |
| Any key | No handler. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only. Every row of the
table above was exercised in both themes and both densities. Result: as documented.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

`truncate` requires `fullValue` at the type level, so the untruncated string is always available as the accessible name. Truncating without it does not compile. `numeric` gives tabular figures so a column of amounts aligns without a monospace face.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../__tests__/primitives.test.tsx` and `../__tests__/matrix.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
