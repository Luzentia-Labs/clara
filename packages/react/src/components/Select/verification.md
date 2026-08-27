# Select - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A single-choice control that opens a list. The APG **select-only combobox**: the trigger carries
`role="combobox"` and the popup carries `role="listbox"`.

**Boundary:** client-only (see `../../../client-boundary.json`). It holds open state and the
activedescendant highlight, which TRD Section 7 makes the boundary test. It is also flagged
`overlay: true`, so `check:overlay-contract` requires it to render through `ClaraPortal` and take the
shared layer token.

**Docs page:** `select.md`

## Keyboard

| Key | Result |
| --- | --- |
| ArrowDown / ArrowUp / Enter / Space (closed) | Opens the list, with the highlight on the SELECTED option or on the first enabled one |
| ArrowDown / ArrowUp (open) | Moves the highlight, SKIPPING disabled options. It does not wrap: the APG's listbox does not, and wrapping in a long list moves the highlight somewhere the user did not expect |
| Home / End | Jumps to the first / last ENABLED option |
| Enter | Selects the highlighted option and closes |
| Escape | Closes WITHOUT selecting, and leaves focus on the trigger. A highlight is not a choice |
| Tab | COMMITS the highlight and lets focus move on. Deliberately not prevented - swallowing Tab strands a keyboard user inside a control they are trying to leave |
| A printable character | Typeahead. Repeating one character cycles through the options starting with it, rather than searching for the repeated string |

**Focus never moves off the trigger.** That is what `aria-activedescendant` means, and it is why
`onOpenAutoFocus` is prevented. Let Radix move focus into the panel and the announced highlight and
the real focus disagree, which is worse than having no highlight at all.

## Accessibility

`role="combobox"` on the trigger, `role="listbox"` on the popup, `role="option"` on each entry, with
`aria-expanded`, `aria-controls` and `aria-activedescendant` on the trigger. `aria-controls` is
absent while closed, because naming a listbox that is not rendered points at nothing.

`aria-selected` marks the CHOICE; the activedescendant highlight is the CURSOR. They are different
facts, a screen reader announces both, and neither may stand in for the other.

Radix's positioned wrapper is given `role="presentation"`. It renders `role="dialog"` by default, and
a dialog wrapping a listbox is not this pattern - axe reports it, and a screen reader would announce
a dialog the user never opened.

Disabled is `aria-disabled` plus a suppressed handler, never the native attribute (D0058, D0064), so
the control keeps its tab stop and a keyboard user can reach it and learn it is unavailable.

## What is verified automatically

- The combobox/listbox/option roles, `aria-expanded`, `aria-controls`, and an
  `aria-activedescendant` whose id RESOLVES to a rendered option - `__tests__/select.test.tsx`
- Focus stays on the trigger while the highlight moves - `__tests__/select.test.tsx`
- The full keyboard table above, including disabled-skipping, both non-wrapping ends, Escape not
  selecting, and Tab committing AND letting focus leave - `__tests__/select.test.tsx`
- `onValueChange` receives the value itself rather than an event, and the controlled form does not
  move on its own - `__tests__/select.test.tsx`
- It renders and stays operable inside a Modal - `__tests__/select.test.tsx`
- axe closed and open, and in all four theme x density combinations - `check:axe`
- Token-only styling, the layer token, and the panel's own `color` - `check:component-css`,
  `check:overlay-contract`

## Stated gaps

- **A Select outside a Field has NO ACCESSIBLE NAME.** `role="combobox"` does not take its name from
  its contents, so without a Field's `aria-labelledby` the control is unnamed - measured, axe reports
  `[critical] button-name`. Every Clara control expects a Field to own its label and Input has no
  standalone tests at all, so this follows the convention rather than departing from it; it is named
  here because the consequence is sharper for a combobox than for a text input, and because nothing
  in the library warns about it. Filed as **BG-01M11WQZ**.
- **The listbox is not verified in a browser.** jsdom computes no layout, so nothing here proves the
  panel is positioned, flips at a viewport edge, or is unclipped inside a scrollable container.
  Popover's equivalent claims are asserted in `e2e/stacking.spec.ts` against a served Storybook
  build, and Select's are not yet.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one. The
  epic's own Risks section says the combobox pattern is intricate and easy to get subtly wrong in
  ways every automated check passes, and that a manual pass is required rather than an axe assertion.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether a screen reader actually announces the
activedescendant change as the highlight moves, whether the announced option text matches what is
visibly highlighted, and whether the list is reachable and readable at a real viewport size.
