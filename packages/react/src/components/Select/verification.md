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
| Home / End (OPEN) | Jumps to the first / last ENABLED option. Neither OPENS a closed Select - see the deviations below |
| Enter | Selects the highlighted option and closes |
| Escape | Closes WITHOUT selecting, and leaves focus on the trigger. A highlight is not a choice |
| Tab | COMMITS the highlight and lets focus move on. Deliberately not prevented - swallowing Tab strands a keyboard user inside a control they are trying to leave |
| A printable character | Typeahead. Repeating one character cycles through the options starting with it, rather than searching for the repeated string |

**At least SIX APG deviations remain, and this list is NOT proven complete.** The count has been
wrong three times - it read three, then two, then four, and a seat found two more by fetching the
APG source rather than working from memory. What follows is what has been MEASURED by execution
against the shipped component. Nothing enumerates the APG's key list, so absence from this table is
not evidence.

| Key | APG select-only combobox | Clara | Pinned |
| --- | --- | --- | --- |
| Home (closed) | Opens the listbox | Does nothing | yes |
| End (closed) | Opens the listbox | Does nothing | yes |
| A printable character (closed) | Opens the listbox | Does nothing | yes |
| Alt+ArrowUp (open) | Commits and closes | Moves the highlight up | yes |
| PageUp (open) | Moves up 10 options | Does nothing | yes |
| PageDown (open) | Moves down 10 options | Does nothing | yes |

Not in the table and not resolved: the APG says ArrowDown, Alt+ArrowDown, Enter and Space open the
listbox *"without moving focus or changing selection"*, while Clara seats the highlight on open.
Whether that is a deviation or a reasonable reading is unsettled, so it is named here rather than
counted.

The first three share one cause - the engine's closed branch in
`packages/react/src/lib/listbox.ts` handles ArrowDown, ArrowUp, Enter and button-Space only.
Alt+ArrowUp falls through to plain ArrowUp; PageUp and PageDown fall to the typeahead default,
where `key.length === 1` is false.

**What the tests pin, precisely.** All six deviations are pinned in
`packages/react/src/components/Select/__tests__/select.test.tsx`, so removing one reddens.

**The count itself is now read by a machine**, which it was not through four consecutive rounds of
getting it wrong (three, then two, then four, then six). `pins the COUNT` parses THIS FILE - the
count asserted in the sentence above, and the rows of the table below it - and compares both against
the one canonical `APG_DEVIATIONS` array the pinned cases iterate. It compares each row's KEY AND
THE STATE it deviates in, not merely the number. Measured: writing FIVE in the sentence reddens it,
deleting a table row reddens it, deleting an array entry reddens it, renaming a key on either side
reddens it, and changing `Home (closed)` to `Home (open)` reddens it. The table is read only to the
first line that is not a row, so a deviation deleted here but mentioned in prose further down no
longer counts - a seat measured that escape, and the earlier version also failed spuriously when any
unrelated table was appended to this file. The version before that said "nothing here checks the
count itself", which was true and was the whole mechanism by which a number in prose drifted four
times.

**The PageUp row is pinned from a seat that is not an end.** Its case opens with `value="eur"`,
which seats the highlight on index 1 of four. Opened with no value it sits on index 0, where `move`
clamps every upward step to a no-op - so the assertion "PageUp does not change
`aria-activedescendant`" held no matter what PageUp did, and a faithful `Math.max(first, c - 10)`
implementation of the APG behaviour left the suite green. A seat measured that, inside the very
commit that was fixing this class of defect. The same deviation is now also pinned at the hook, in
the engine test, where the seat is set directly.

**The opening keys are pinned against the ENGINE, not against jsdom.** Two of the four keys that
open a closed Select could not fail at component level: `Enter` and `Space` reach a native
`<button>`, which jsdom activates regardless, so deleting either from the engine's closed branch
left all 45 Select tests green. That is measured, and it is why the engine
`packages/react/src/lib/listbox.ts` is pinned by `packages/react/src/lib/__tests__/listbox.test.ts`,
which calls `triggerProps.onKeyDown` directly, where no native path exists. Deleting
`key === 'Enter'` from the closed branch now reddens there, and so does deleting `opensOnSpace`.
That file also pins the branch to open on ONLY those four keys: adding `Tab` to it left both suites
green until an exhaustive case was added, and a closed trigger that swallows Tab strands a keyboard
user inside a control they are trying to leave. An earlier version of this section claimed the count "cannot drift again in
either direction" while the opening half was vacuous; that claim is now true of both halves because
both are executed rather than asserted.

These are recorded rather than fixed because fixing them changes keyboard behaviour, which is a
decision rather than a correction - unlike D0123's Space case, which was fixed because it was
silently inert on a key this component itself teaches. Both were found by measurement, not by reading.

A third deviation was found in the same round and FIXED rather than recorded (D0123): Space while
the list was OPEN fell through to the typeahead branch, which prevented the key and then searched
for a label beginning with a space - silently inert on a key this component itself teaches as one of
the keys that opens the list. It now selects and closes, as the APG requires.

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

What a real pass adds that the tests cannot: whether a screen reader actually announces the
activedescendant change as the highlight moves, whether the announced option text matches what is
visibly highlighted, and whether the list is reachable and readable at a real viewport size.
