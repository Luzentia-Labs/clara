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

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

An earlier version of this file claimed a by-hand walk on 2026-08-23 across macOS 15, Safari 18 and
Chrome 128, with a result. No such walk happened - the text was written from the keyboard table
rather than from a browser, and the identical paragraph appeared in all 23 verification records
including one for a component that is a stub. It is removed rather than reworded: a fabricated
record is worse than an absent one, because an absent one is visible.

What IS verified is above, by tests that run. What a real pass adds is the part no test reaches:
whether the focus order feels right, whether the ring is actually visible against each surface, and
what a screen reader says rather than what the accessibility tree contains.

**To record one:** walk every row of the keyboard table above, in both themes and both densities,
pointer unused; then replace this section with the date, the OS and browsers, and the result per
row - including anything surprising. `check-verification.mjs` requires this section to state either
a real pass or, as here, that it is outstanding.

## Accessibility

`truncate` requires `fullValue` at the type level - the props are a discriminated union - so the
untruncated string is always available as the accessible name. That was claimed here before it was
true: the two props were independently optional, `<Text truncate>` compiled, and it produced a
focusable span with `aria-label={undefined}` - a tab stop with no accessible name, which is the
exact defect the pair exists to prevent. A compile-time assertion now pins it. `numeric` gives tabular figures so a column of amounts aligns without a monospace face.

## What is verified automatically

- axe (serious and critical) under the default theme and density - `check:axe`. **Not** the
  four-combination matrix: that runs over the primitives and the form controls, and this component
  is in neither. Claimed here before it was true.
- The behaviour above, in `../__tests__/typography.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
