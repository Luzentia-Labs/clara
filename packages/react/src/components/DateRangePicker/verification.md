# DateRangePicker - verification record

**Docs page:** `date-range-picker.md`
**Boundary:** client - it holds open state, the pending endpoint, the roving grid focus and a live region (TRD Section 7)

## Keyboard

| Key | Result |
| --- | --- |
| Tab (in the field) | Reaches the trigger, then Clear when a range is set |
| Tab (in the panel) | Reaches the presets FIRST, then the grid - the shorter route to the usual answer comes first |
| ArrowLeft / ArrowRight (grid) | Moves the roving focus by one DAY |
| ArrowUp / ArrowDown (grid) | Moves by one WEEK |
| PageUp / PageDown (grid) | Moves by one MONTH |
| Home / End (grid) | Jumps to the start / end of the focused WEEK |
| Enter / Space (grid) | First press sets the START and leaves the panel open. Second completes the range and closes |
| Enter / Space (preset) | Applies that preset and closes |
| Escape | Closes, discards a pending start, and restores focus to the trigger |

The grid is `useCalendarGrid`, the same hook DatePicker drives (D0131) - one keyboard model, two
components. What differs is what CHOOSING means, which each component supplies.

## Accessibility

- The trigger's accessible NAME is the Field's label; the range is its visible TEXT. Two different
  facts, and `aria-labelledby` outranking contents is D0064.
- Disabled is `aria-disabled` plus a suppressed handler, never the native attribute (D0058, D0064).
- A polite live region announces the pending start ("Start 12 March 2026. Choose an end date."),
  the completed range, the applied preset, and the clear - so a screen-reader user is told which
  half of the interaction they are in, which is otherwise invisible when the panel stays open.
- Three day states that must COMPOSE: an endpoint is a filled cell with its own foreground, an
  in-range day is a weaker tinted surface with its own foreground, and the roving cursor is an
  inset bar on the SHADOW channel. The cursor deliberately does not take the background, because a
  day can be the cursor and an endpoint at once and one of the two facts would be lost.
- An unavailable day stays IN the grid, carries `aria-disabled`, and cannot be chosen.
- ISO date strings only on the public surface (ADR-008); `packages/react/src/lib/calendar.ts` is
  the only module that touches the date library.

## What is verified automatically

- `vitest` over every acceptance criterion, each with a Test Plan mutant that was RUN.
- `check-component-css --component DateRangePicker` - tier 2/3 tokens only, and the shape contract
  requires the trigger's `font-size`, the panel's `color` and `font-size`, both day surfaces WITH
  their own foregrounds, and the cursor's `box-shadow`.
- `check:contrast` over seven declared pairings, including the in-range day's text on the in-range
  surface - context is still reading text.
- `runAxe` over the four theme x density combinations, on the container AND `document.body`.

## Stated gaps

- **Appearance.** jsdom computes no layout and resolves no `var()`. Gate 7 is unwired
  (US-01M0WSME).
- **Forced-colors.** `box-shadow` is forced to `none` there, so the roving cursor's bar does not
  survive; the focus ring does. Repo-wide support is BG-01M159D6.
- **Locale.** Week layout, month names and the preset labels are fixed to `en-GB`. Not in this
  story and not claimed.
- **Two-month view.** A single month grid is shown. Ranges spanning months are selectable by
  paging, which is more keystrokes than a side-by-side pair would be; that is not in this story.
- **Screen reader output.** axe reads the accessibility tree, not what NVDA or VoiceOver say.
- **Storybook stories.** The app is a bare `package.json` (US-01M0GMZW).


## Round 1 adversarial review (2026-08-30)

An independent reviewer, not the author, probed this component and mutation-verified every finding.
What it changed here:

- **F1 (defect, fixed).** A pending start survived every dismissal except Escape. Clicking outside
  and reopening completed a range against a date the user had abandoned. `closePanel` now clears it
  on every route out - Escape, outside click, a second trigger click, and Radix's own dismiss.
- **F4 (test that could not fail, fixed).** Every grid interaction in this suite was a CLICK, so
  deleting `onKeyDown` from the tbody left all 16 tests green and the keyboard table above rested on
  nothing. Five keyboard tests now drive it; deleting `onKeyDown` turns 3 red.
- **F8 (fixed).** The Clear control was silently inert when disabled - no `aria-disabled`, no visual
  state. It now carries both (D0058, D0064).

## Recorded manual keyboard pass

Not performed. This is outstanding, and is stated rather than implied.
