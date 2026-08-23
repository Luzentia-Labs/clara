# CheckboxGroup - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from
the tests that actually run, so it can be checked rather than believed.

A fieldset of independent options - many answers to one question.

**Boundary:** client-only (see `client-boundary.json`). A Field renders a context Provider, so
neither it nor any control that reads its wiring can be a Server Component (D0060).

## Keyboard

Every box is its own tab stop, unlike RadioGroup. That is correct: the options are independent, so
each one is a separate decision.

Uncontrolled use holds its own state. The first implementation derived the selected set from
`value ?? defaultValue ?? []`, so with no `value` the set was frozen at the initial one and every
`onChange` was computed from it - ticking A then B reported `["b"]` rather than `["a","b"]` while
the boxes on screen stayed correct, so a form reading `onChange` submitted a set the user could not
see.


| Key | Result |
| --- | --- |
| Tab | **One stop per option** - unlike RadioGroup, because the options are independent decisions. |
| Space | Toggles the focused option. |
| Space, when disabled | No-op. |

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

A `<fieldset>` whose `<legend>` names the question, so a screen reader announces the question before
each answer. Inside a `<Field labelFor="group">` the Field's label names the group through
`aria-labelledby` instead - `htmlFor` cannot target a fieldset, and binding one produced a label
that pointed at nothing while looking correct on screen.

There is deliberately no `aria-required`: a `<fieldset>` is `role="group"`, which does not support
it, and "at least one of these" is a form-level rule rather than a property of the group.

## What is verified automatically

- axe (serious and critical) in all four theme x density combinations - `check:axe`
- The behaviour above, in `../Field/__tests__/behaviour.test.tsx`
- Token-only styling, no literals and no tier 1 reads - `check:component-css`
- Colour pairings measured against the palette, both themes - `check:contrast`

## Stated gaps

- **Screen reader testing is not automated.** axe checks the accessibility tree, not what NVDA or
  VoiceOver actually announce. PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7), so the rendered appearance is unverified - only
  the markup, the tokens and the measured contrast are.
