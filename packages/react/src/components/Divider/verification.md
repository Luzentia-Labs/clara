# Divider - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A rule between regions, semantic or decorative.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state,
no browser APIs, so it carries no `"use client"` directive and renders on the server.

## Keyboard

Not focusable in either mode; a separator is never a stop.

| Key | Result |
| --- | --- |
| Tab | No stop, in either mode. A separator is never a focus target. |
| Any key | No handler. |

## Recorded manual keyboard pass

Walked by hand on 2026-08-23, macOS 15, Safari 18 and Chrome 128, keyboard only. Every row of the
table above was exercised in both themes and both densities. Result: as documented.

This is a point-in-time record, not a gate. It is re-walked when the keyboard table changes.

## Accessibility

`role="separator"` by default, so it announces a boundary. `decorative` sets `aria-hidden` instead - announcing "separator" for a rule that only exists to look right is noise, and which one it is only the author knows.

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
