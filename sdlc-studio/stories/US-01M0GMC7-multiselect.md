# US-01M0GMC7: MultiSelect

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/MultiSelect/**, packages/react/src/components/MultiSelect/verification.md, packages/react/src/lib/listbox.ts, packages/react/src/styles.css, packages/react/src/index.ts, packages/tokens/src/component/multi-select.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, scripts/check-component-css.mjs, package.json
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** multiple selection rendered as removable tags
**So that** I can see and undo each selection without reopening the list

## Acceptance Criteria

### AC1: Removable tags

- **Given** a MultiSelect with selections
- **When** I reach a remove control by keyboard
- **Then** it is focusable and labelled with the value it removes
- **Verify:** vitest "MultiSelect remove control names its value"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC2: Count is announced

- **Given** a MultiSelect
- **When** the selection changes
- **Then** the new selected count is announced
- **Verify:** vitest "MultiSelect announces selected count"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the MultiSelect stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component MultiSelect
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a MultiSelect
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "MultiSelect theme and density matrix"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the MultiSelect story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component MultiSelect
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC6: The list stays open while selecting, and Tab commits nothing

- **Given** a MultiSelect
- **When** I toggle options with Enter, Space or a click
- **Then** the listbox stays open and each toggle adds or removes exactly one value
- **And** Escape still closes, as it does in every mode
- **And** Tab closes WITHOUT committing the highlight (D0128): in single-select Tab commits
  deliberately, but here the highlight is a cursor rather than an intent, and an accidental toggle
  in an accumulating list is worse than a lost one because the user may not notice it was added
- **Verify:** vitest "MultiSelect keeps the list open|MultiSelect Tab commits nothing"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC7: The option state model carries both facts, neither by colour alone

- **Given** an open MultiSelect
- **When** the activedescendant cursor and a selected option are on screen
- **Then** each has its own visible carrier and they are never the same treatment - the cursor is a
  tint plus an inset leading bar, a selected option carries a check glyph (D0124)
- **And** both carriers are measured against BOTH surfaces they sit on, the panel and the active
  row's tint. Select and Combobox each had to be corrected twice for declaring only the more
  permissive adjacency, so this component declares both from the start
- **Verify:** vitest "MultiSelect stylesheets select on the option state model|MultiSelect option state tokens are pinned at both ends"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

> The RENDERED result is not verified and is not claimed to be: jsdom computes no layout and
> resolves no `var()`. What is checked is that the second channel is DECLARED
> (`check-component-css`) and that the token pairs MEASURE (`check:contrast`). Appearance stays a
> stated gap until gate 7, owned by US-01M0WSME. In forced-colors the cursor has no carrier at all,
> which is BG-01M159D6.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production change the criterion's own
verifier must fail on, and the verdict beside it is what happened.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/MultiSelect/MultiSelect.tsx | TWO mutants, both KILLED. (a) `removeLabel="Remove"` on every tag, so a keyboard user tabbing through several hears one string and cannot tell which they are about to drop - 2 failed. (b) `apply([...current])` on remove, so the control is named correctly and drops nothing - 1 failed. Naming and behaviour are separate claims and each has its own probe. | Removable tags |
| AC2 | packages/react/src/components/MultiSelect/MultiSelect.tsx | Render the count unconditionally instead of empty-until-there-is-something-to-say. KILLED, 1 failed. A live region created in the same commit as its text is commonly not announced at all, which is why the empty state is asserted rather than only the populated one. | Count is announced |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-multi-select__listbox-panel` - a raw literal where a token belongs. `check-component-css --component MultiSelect` exits 1. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet or the row is green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. Mutating the PROVIDER is what proves the assertion walks up from inside the portalled panel rather than reading the render container, which carries the same attributes and was never the portal's scope. | Both themes and densities |
| AC5 | packages/react/src/components/MultiSelect/verification.md | Rename `## Keyboard` to `## Keys`. `check-verification --component MultiSelect` exits 1 on the missing section. The guard also refused this record twice while it was being written - once for a missing `**Boundary:**` line, once for citing the repo-wide keyboard gate as covering a file that gate does not run. | Definition of done |
| AC6 | packages/react/src/lib/listbox.ts | TWO mutants, both KILLED, one per half of D0128. (a) `closeOnSelect: true`, so the list closes on the first choice - 1 failed. (b) Drop the `if (closeOnSelect)` guard on Tab so it commits in multi mode, adding a value the user never chose - 1 failed. The engine is shared, so both mutants were also checked against Select and Combobox: 75 tests there stay green either way, which is what proves the option is a mode rather than a behaviour change. | The list stays open while selecting, and Tab commits nothing |
| AC7 | packages/react/src/styles.css, packages/tokens/src/component/multi-select.json | TWO mutants, both KILLED, and the first by BOTH channels. (a) Delete the `box-shadow` from `.clara-multi-select__option--active`, returning the cursor to colour alone: the stylesheet-reading case fails AND `check-component-css` exits 1. (b) Repoint `option-cursor` to `{color.bg.row-hover}`, making the bar the colour of the tint it sits on: `check:contrast` exits 1 at 2.28:1 dark. Both adjacencies were declared from the start here - Select and Combobox each needed two corrections to reach that. | The option state model carries both facts, neither by colour alone |

**One mutant is deliberately absent.** Nothing here proves the panel PAINTS above a modal, flips at
a viewport edge, or that the cursor bar is visible in forced-colors - it is not, and the record says
so. Those are rendered facts, jsdom decides none of them, and gate 7 is unwired.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- MultiSelect

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
