# DatePicker - verification record

**Docs page:** `date-picker.md`
**Boundary:** client - it holds open state, the roving grid focus and the live region (TRD Section 7)

## Keyboard

| Key | Result |
| --- | --- |
| Tab (in the field) | Reaches the text input, then the calendar button. Both are always reachable |
| ArrowLeft / ArrowRight (grid) | Moves the roving focus by one DAY |
| ArrowUp / ArrowDown (grid) | Moves by one WEEK |
| PageUp / PageDown (grid) | Moves by one MONTH |
| Home / End (grid) | Jumps to the start / end of the focused WEEK, not the month |
| Enter / Space (grid) | Selects the focused day and closes. Refused on an unavailable day |
| Escape (grid) | Closes and RESTORES focus to the text input |

**The grid uses ROVING TABINDEX, not `aria-activedescendant`.** Select, Combobox and MultiSelect
keep focus on the trigger and move a highlight; a calendar moves focus itself, because it is two
dimensional and the cell is the thing being operated on. Exactly one cell carries `tabindex="0"` at
a time - without that a keyboard user tabs through 42 cells to leave the grid.

This is why DatePicker shares no engine with the other three. The shared listbox engine models one
axis and one focus owner, and forcing a grid through it would fit worse than the twelve lines here.

## Accessibility

- Text entry is the primary control and is never disabled in favour of the calendar. Typing is
  faster for anyone who knows the date, and it is the only route for a user who cannot operate a
  grid.
- Disabled is `aria-disabled` plus `readOnly` and the shared `fieldChangeGuard`, never the native
  attribute (D0058, D0064, D0068), so the control keeps its tab stop.
- The expected format is in the accessible DESCRIPTION, not only the placeholder - a placeholder
  disappears exactly when the user needs it and is not reliably announced.
- A polite live region states the focused date whenever focus moves. The month CONTEXT is the
  grid's own accessible name, which changes when paging - the date string already carries its own
  month, so repeating it in the live region said nothing, and a mutant proved that by surviving.
- An unavailable date stays IN the grid carrying `aria-disabled` and announces itself as
  unavailable. A hole where the 14th should be is harder to understand than a 14th that says it
  cannot be picked.
- ISO date strings only on the public surface (ADR-008). `packages/react/src/lib/calendar.ts` is
  the only module that touches `@internationalized/date`, and `check:api` asserts the boundary.

## What is verified automatically

- `vitest` over every acceptance criterion, each with a Test Plan mutant that was RUN.
- `check-component-css --component DatePicker` - tier 2/3 tokens only, and the shape contract
  requires the input's `font-size`, the panel's `color` and `font-size`, the focused day's second
  channel, the selected day's own foreground, and the unavailable day's colour.
- `check:contrast` over six declared pairings, including the selected day's own text on its own
  fill and the unavailable day against the panel - an unavailable day is still reading text.
- `runAxe` over the four theme x density combinations, on the container AND `document.body`,
  because the panel portals out of the container.

## Stated gaps

- **Appearance.** jsdom computes no layout and resolves no `var()`. Gate 7 is unwired
  (US-01M0WSME).
- **Forced-colors.** `box-shadow` is forced to `none` there, so the roving cursor's inset bar does
  not survive - the focus ring does. Repo-wide forced-colors support is BG-01M159D6.
- **Locale.** Week layout and month names are fixed to `en-GB` in `packages/react/src/lib/calendar.ts`. Making that a
  prop is not in this story and is not claimed.
- **Screen reader output.** axe reads the accessibility tree, not what NVDA or VoiceOver say.
- **Storybook stories.** The app is a bare `package.json` (US-01M0GMZW).

## Recorded manual keyboard pass

Not performed. This is outstanding, and is stated rather than implied.
