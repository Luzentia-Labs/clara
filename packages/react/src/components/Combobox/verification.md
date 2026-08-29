# Combobox - verification record

PRD F17 requires a per-component record rather than a blanket claim. This one is written from the
tests that actually run, so it can be checked rather than believed.

A text input that filters a list. The WAI-ARIA **combobox** pattern: `role="combobox"` on the input,
`role="listbox"` on the popup, and `aria-activedescendant` tracking the highlight while focus and
the caret stay in the input.

**Boundary:** client-only (see `../../../client-boundary.json`). It holds open state, the query and
the highlight. Flagged `overlay: true`, so `check:overlay-contract` requires `ClaraPortal` and the
shared layer token.

**Docs page:** `combobox.md`

## Keyboard

| Key | Result |
| --- | --- |
| ArrowDown / ArrowUp / Enter (closed) | Opens the list |
| ArrowDown / ArrowUp (open) | Moves the highlight, SKIPPING disabled options, without wrapping |
| Home / End (OPEN) | Jumps to the first / last ENABLED option. Neither OPENS a closed Combobox - measured |
| Enter | Selects the highlighted option and closes |
| Escape | Closes WITHOUT selecting. A highlight is not a choice |
| Tab | COMMITS the highlight and lets focus move on |
| Any printable character, INCLUDING Space | Goes to the INPUT as the query. **Typeahead is off here**, unlike Select: the same keystrokes cannot both filter the list and jump the highlight somewhere else |
| Space | Types a space. It is NOT an opening key here, because on a textbox trigger Space is a query character. The engine takes a required `triggerKind` so the trigger states what it is rather than the engine assuming - it previously prevented Space for every trigger, on a comment claiming that was harmless for an input, and typing " Ac" produced "Ac" |

Focus and the text caret never leave the input. That is what `aria-activedescendant` is for, and it
is why `onOpenAutoFocus` is prevented.

## Accessibility

`role="combobox"` with `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` and
`aria-activedescendant` on the input; `role="listbox"` on the popup; `role="option"` on each entry.
`aria-controls` is absent while closed, because naming a listbox that is not rendered points at
nothing.

Groups are `role="group"` with `aria-labelledby` pointing at the VISIBLE label, never a duplicated
`aria-label` that can drift from what is on screen. The engine keeps ONE flat option index across
groups, because two index spaces would be two sources of truth about the highlight and
`aria-activedescendant` can name only one.

The status region is ALWAYS present and empty until there is something to say. A region created in
the same commit as its text is commonly not announced at all - which the Input component records at
length - and here the announcement IS the feature: loading, empty and error each have to reach a
screen-reader user, not merely paint.

Radix's positioned wrapper is given `role="presentation"`; it renders `role="dialog"` by default,
and a dialog wrapping a listbox is not this pattern.

## What is verified automatically

- The combobox/listbox/option roles, `aria-autocomplete`, `aria-expanded`, `aria-controls`, and an
  `aria-activedescendant` whose id RESOLVES to a rendered option - `__tests__/combobox.test.tsx`
- Focus and the caret stay in the input while the highlight moves - `__tests__/combobox.test.tsx`
- Filtering narrows the list AND the highlight never points past it - the defect being an index into
  the previous list, so the activedescendant names an id no longer in the DOM
- Loading, empty and error each render AND announce, and the status region is present-and-empty when
  there is nothing to say - `__tests__/combobox.test.tsx`
- The local-ceiling warning fires past the ceiling, does NOT fire at it, does NOT fire on the async
  path however many options there are, and nothing is truncated - `__tests__/combobox.test.tsx`
- Groups carry an accessible NAME, and the flat index crosses a group boundary
- The listbox portals out of an `overflow: auto` ancestor - `__tests__/combobox.test.tsx`
- axe closed and open, and in all four theme x density combinations - `check:axe`
- Token-only styling, the layer token, and the panel's own `color` - `check:component-css`,
  `check:overlay-contract`

## Stated gaps

- **A Combobox outside a Field has no accessible name**, for the same reason Select does not:
  `role="combobox"` is not a name-from-content role. Filed as **BG-01M11WQZ**, against the shared
  `fieldAriaProps` rather than this component, because it affects all eight controls.
- **Nothing here proves the panel is unclipped.** AC5 asks that the listbox is not clipped inside a
  scrollable table and stays anchored on scroll. What is asserted is the MECHANISM - the listbox is
  portalled out of the scroll container's subtree - because jsdom computes no layout and no
  scrolling. Whether it stays anchored while a real container scrolls is a rendered fact and belongs
  in `e2e/stacking.spec.ts`, which does not yet cover it.
- **The announcement is asserted as CONTENT, not as speech.** The tests read the status region's
  text. Whether a screen reader speaks it, and when, is not decidable here - and the epic's own Risks
  section says the combobox pattern is intricate and easy to get subtly wrong in ways every
  automated check passes.
- **Screen reader testing is not automated.** PRD F17 names NVDA as a stated gap; it stays one.
- **Visual regression is not yet wired** (gate 7, US-01M0WSME).

**Forced-colors: the option state model has NO carrier for the cursor, and the check glyph was
exempt.** Measured by two review seats in Chromium. `box-shadow` is forced to `none` and the active
row's background is forced to `Canvas`, so the activedescendant cursor has zero carriers there -
not one, as an earlier decision claimed. The check glyph had the opposite problem: an SVG's UA
`forced-color-adjust` is `preserve-parent-color`, so its author colour was NOT forced and it painted
Clara's accent on the user's Canvas at 2.83:1 and 1.62:1 in two of four theme x forced-palette
combinations. `forced-color-adjust: auto` is now declared on the glyph as the remedy; **that remedy
is not verified in a browser here**, because this repository has no forced-colors coverage - the
mechanism is measured, the fix is not. Repo-wide forced-colors support is BG-01M159D6.

## Recorded manual keyboard pass

**Not performed. This is outstanding, and it is the one artefact here that automation cannot
supply.**

What a real pass adds that the tests cannot: whether a screen reader announces each highlight change
as the user arrows through a filtered list, whether the loading and empty messages interrupt at a
useful moment rather than on every keystroke, and whether the panel is readable and reachable at a
real viewport size with a real scroll container behind it.
