# MultiSelect - verification record

**Docs page:** `multi-select.md`
**Boundary:** client - `useState` and a Popover surface (TRD Section 7)

## Keyboard

| Key | Result |
| --- | --- |
| ArrowDown / ArrowUp / Enter / Space (closed) | Opens the list |
| ArrowDown / ArrowUp (open) | Moves the highlight, SKIPPING disabled options, without wrapping |
| Home / End (OPEN) | Jumps to the first / last ENABLED option. Neither OPENS a closed MultiSelect |
| Enter / Space (open) | TOGGLES the highlighted option and leaves the list OPEN (D0128) |
| Escape | Closes WITHOUT changing the selection. The dismiss key, in every mode |
| Tab | Closes and commits NOTHING (D0128). Single-select commits on Tab; here the highlight is a cursor rather than an intent, and a value silently added to an accumulating list may never be noticed |
| Any printable character | Typeahead, as in Select - there is no text entry to compete with |

Focus never leaves the trigger. That is what `aria-activedescendant` is for, and it is why
`onOpenAutoFocus` is prevented.

Each selection also renders as a removable `Tag` in the trigger row, whose remove control is
reachable by keyboard and named with the value it removes - so a choice can be dropped without
reopening the list.

**The same APG deviations Select carries apply here**, since both run the shared engine: Home, End
and printable characters do not OPEN a closed control, and PageUp / PageDown do nothing. This list
is NOT proven complete - nothing enumerates the APG key list, so absence from it is not evidence.
See `packages/react/src/components/Select/verification.md` for the measured table.

## Accessibility

- `role="combobox"` on the trigger with `aria-expanded`, `aria-controls` and
  `aria-activedescendant`; `role="listbox"` with `aria-multiselectable="true"` on the popup.
- Disabled is `aria-disabled` plus a suppressed handler, never the native attribute (D0058, D0064),
  so the control keeps its tab stop and a keyboard user can reach it and learn it is unavailable.
- A polite live region is ALWAYS present and empty until there is something to say. It is the only
  signal a screen-reader user gets that a toggle landed, because the list stays open and focus does
  not move.
- The cursor and the choice have separate visible carriers (D0124): a tint plus an inset leading bar
  for the cursor, a check glyph for the choice. Neither is conveyed by colour alone.

## What is verified automatically

- `vitest` over every acceptance criterion, each with a Test Plan mutant that was RUN.
- `check-component-css --component MultiSelect` - tier 2/3 tokens only, and the shape contract
  requires the trigger's `font-size`, the panel's `color` and `font-size`, the cursor's second
  channel and the glyph's `color` plus `forced-color-adjust`.
- `check:contrast` over five declared pairings: the cursor bar and the check glyph each against
  BOTH surfaces they sit on, and the panel's own text pair.
- `runAxe` over the four theme x density combinations, on the container AND on `document.body`,
  because the panel portals out of the container.

## Stated gaps

- **Appearance.** jsdom computes no layout and resolves no `var()`, so nothing here sees what the
  control looks like. Gate 7 is unwired (US-01M0WSME).
- **Forced-colors.** The cursor has NO carrier there: `box-shadow` is forced to `none` and the
  active row's background is forced to `Canvas`. The glyph declares `forced-color-adjust: auto` as
  the remedy for the SVG exemption measured on Select and Combobox, and **that remedy is not
  verified in a browser** - this repository has no forced-colors coverage (BG-01M159D6).
- **Screen reader output.** axe reads the accessibility tree, not what NVDA or VoiceOver say.
- **Storybook stories.** The app is a bare `package.json` (US-01M0GMZW).
- **The repo-wide keyboard gate does not reach this component.** Its file list is hand-typed, which
  BG-01M10BWX records, so no keyboard-table row here is gate-enforced beyond this unit's own tests.

## Recorded manual keyboard pass

Not performed. This is outstanding, and is stated rather than implied.
