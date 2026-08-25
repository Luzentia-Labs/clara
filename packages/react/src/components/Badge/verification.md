# Badge - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A compact status marker: a label, or a count with what it counts.

**Boundary:** server-capable (see `../../../client-boundary.json`). No function props, no state, no
refs, no browser APIs, so it carries no `"use client"` directive and renders on the server. Asserted
by a `renderToStaticMarkup` test rather than inferred from the prop list.

## Keyboard

Not focusable in either mode. A badge is output, not a control, and giving status text a tab stop
would add a stop that does nothing to every row of a list screen.

| Key | Result |
| --- | --- |
| Tab | No stop, in either mode. |
| Any key | No handler. |

## Recorded manual keyboard pass

**Not performed, and there is nothing for one to walk.** Badge takes no focus and handles no key,
so the keyboard table above has no row a by-hand pass could confirm or contradict.

What a manual pass WOULD add here is not keyboard at all - it is whether each intent's colour pair
is distinguishable from the others at badge size, on both themes, by someone with a colour vision
deficiency. That is a real gap and it is recorded under Stated gaps rather than dressed up as a
keyboard walk.

## Accessibility

The intent reaches the **accessible name** as a word - "Error: Overdue", "Warning: Pending review" -
so a screen reader never depends on the colour (WCAG 1.4.1). `neutral` adds nothing, because it is
the default and announcing it would put a meaningless word on every badge in the system.

A count badge requires `countLabel`, in the type rather than by convention: `count` and `countLabel`
are one variant of a union, so `<Badge count={3} />` does not compile. A bare number is the one
badge shape whose visible text cannot carry its own meaning - "3" in red beside "3" in green differs
by colour alone - so the label is not optional.

`count={0}` renders. It is a real state ("0 errors"), and a falsy check would silently drop it.

## What is verified automatically

- The intent word joins the accessible name for all four non-neutral intents, and does not for
  `neutral` - `__tests__/badge.test.tsx`
- A count announces what it counts, and zero survives - `__tests__/badge.test.tsx`
- axe (serious and critical) with a label and with a count, and in all four theme x density
  combinations - `check:axe`, `../__tests__/matrix.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`
- Server rendering produces markup with no directive - `__tests__/badge.test.tsx`

## Stated gaps

- **The component cannot enforce that the VISIBLE text distinguishes two badges.**
  `<Badge intent="danger">Open</Badge>` beside `<Badge intent="success">Open</Badge>` reads
  identically to a sighted user who cannot separate the two hues. The accessible name differs; the
  screen does not. No API can prevent an author writing that, so the docs state it rather than the
  component implying it is solved.
- **Intent hues are not verified as distinguishable FROM EACH OTHER.** `check:contrast` measures
  each pairing against its own background for legibility, which is a different question from
  whether danger and warning are separable at badge size. Nothing measures the second.
- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME), so the rendered appearance is
  unverified - only the markup, the tokens and the measured contrast are. Gate 9
  (`pnpm check:geometry`) covers the type floor in both densities, which is the part of "how it
  looks" that is a correctness claim.
