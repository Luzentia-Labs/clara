# US-01M0GMC7: MultiSelect

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/MultiSelect/**, packages/react/src/components/MultiSelect/verification.md, packages/react/src/lib/listbox.ts, packages/react/src/styles.css, packages/react/src/index.ts, packages/tokens/src/component/multi-select.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, scripts/check-component-css.mjs, package.json
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** multiple selection rendered as removable tags
**So that** I can see and undo each selection without reopening the list

## Context

> **Written retrospectively.** This section was authored on 2026-08-31, after the code shipped,
> when `sprint close` refused the run because every story in the batch was a planning-tier scaffold
> that had been coded against directly. That is the engagement floor in AGENTS.md, and it was
> skipped. Recording that here rather than presenting this as a plan that preceded the work: a
> specification written after the fact is evidence of what was built, not of what was intended.

### Persona Reference

**Sofia Marchetti** (primary) - full-stack developer building internal ERP apps; she is the one who
calls this component's API and overrides its tokens.
**Grace Adeyemi** (served) - accounts payable clerk, 200-400 lines a day on one fixed monitor, with
a mild red-green colour vision deficiency she has never mentioned at work. She never touches the
API, and every contrast, density and focus floor in this story exists for her.
[Full persona details](../personas/index.md#design-personas)

### Background

Grace filters a 400-line payables queue by currency, and needs several at once. A
single-choice Select forces her to re-open the control for every value, and a checkbox list of 30
currencies does not fit the row of filters above a dense table.

MultiSelect is the accumulating case of the same listbox pattern Select already implements, which is
why it reuses the engine (D0105) rather than reimplementing it. The one behavioural difference is
that a choice does NOT end the interaction: the list stays open so several values can be picked in
one visit. That single difference is `closeOnSelect` (D0128), and it turned out to have consequences
the engine had not been asked to handle - see Open Questions.

The selected values are shown as Tags, reusing the component that already solves "a removable chip
named for what it removes" rather than growing a second vocabulary for the same thing.
## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Architecture | Sits on the shared listbox engine (D0105). The engine owns the keyboard model and the highlight; the component owns its markup | AC covering keyboard behaviour is satisfied by the engine, so a change there reddens every component on it |
| PRD | Accessibility | WCAG 2.2 AA. Non-text state indicators need 3:1 (PRD Section 7); the cursor and the CHOICE need separate visible carriers (D0124) | A criterion asserting a state is visible must name the channel carrying it, not just the class |
| PRD | Security | No network calls, no environment variables, no user data leaves the component | No AC covers data handling because there is none; stated so absence reads as deliberate |
| Epic | API | Reuses `Tag` for the selected values rather than inventing a chip | The remove control's accessible name is `Remove <label>`, which is Tag's contract, not a new one |

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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The consumer passes an empty `options` array | Renders an empty listbox rather than throwing. No highlight is seated, and arrow keys are inert because there is nothing to move to. |
| Every option is `disabled` | The highlight seats nowhere (`seek` returns -1) and stays at -1. Enter commits nothing. The list still opens, so the user can see that everything is unavailable rather than facing a control that appears broken. |
| The control is `disabled` | `aria-disabled` plus a suppressed handler, never the native attribute (D0058, D0064). The tab stop is KEPT so a keyboard user can reach it and learn it is unavailable. Every affordance inside it carries the same state - round 1 found three that did not. |
| The consumer re-renders with a fresh `options` array identity | The list must not lose the user's place. For a list that closes on choice this is a re-seat; for one that stays open it holds the highlight by value (D0128). |
| The panel is portalled outside the provider's DOM scope | The panel declares its own `color` and `font-size` rather than inheriting: a portal escapes the consumer's cascade, so anything inherited is whatever `document.body` happens to carry. |
| Forced-colors mode | `box-shadow` is forced to `none`, so any state carried only by a shadow disappears. Recorded as a gap (BG-01M159D6) rather than claimed - jsdom cannot see it either way. |
| A choice is made while the list is open | The list STAYS open (D0128) and the highlight stays on the option the user is looking at. Round 1 found it snapping back to the first selected option on every toggle, so the next Enter hit a value the user had not chosen. |
| Tab is pressed with a highlight seated | The list closes WITHOUT committing. In an accumulating list, committing a cursor the user never chose adds a value they may not notice, and an accidental toggle is worse than a lost one (D0128). |
| The last selected value is removed | The tag list disappears entirely rather than leaving an empty `<ul>`, and the live region announces the new count. |

> 9 edge cases. The last three in this table were found by round 1's adversarial
> review rather than at design time, which is what skipping the engagement floor cost.

## Test Scenarios

- [x] Each tag's remove control is named for the value it removes, not "Remove"
- [x] Removing a tag drops exactly that value and reports the rest
- [x] The list stays open across several toggles and the highlight does not move
- [x] Tab closes without committing the highlighted option
- [x] A check glyph renders on each selected option and on no unselected one
- [x] The remove control carries `aria-disabled` when the control is disabled, and never the native attribute
- [x] The live region is present and empty before there is anything to say
- [x] axe passes across four theme x density combinations, on the container and on `document.body`

> All scenarios are executed by the suites named in the Test Plan below. The manual
> keyboard pass is NOT among them and is outstanding, which the verification record states.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| US-01M0GMRK | Engine | The shared listbox engine and its option-state token model | Draft (built) |
| US-01M0GM0D | Pattern | Tag, reused for the selected values | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| React 18 and 19 | peer | Supported, both |
| Radix UI primitives | runtime | Used for the portal and positioning only - never leaked to the API |
| `@internationalized/date` | runtime | Only for the two calendar stories, reached only through `lib/calendar.ts` (ADR-008) |

## Estimation

**Points:** 5
**Complexity:** Medium

> Sized against the components already delivered in the preceding epic. This is a RELATIVE size on
> the modified Fibonacci scale, not a duration.
>
> **This estimate was never measured against an actual.** The run was driven interactively rather
> than by the sprint runner, so no per-unit token or time actual was recorded, and
> `retro.py accuracy` cannot run at all here - its id regex wants four digits where this project
> uses ULIDs. RETRO-0004 records both facts. The points below are therefore a forecast with no
> feedback loop attached, and should be read as one.

## Rollback Envelope

**Affects production runtime:** false

*Not applicable - this story does not change runtime behaviour of any deployed system.* Clara is a
library with no backend, no network calls and no environment variables. Nothing here is published:
both packages sit at `0.0.0` and `NPM_TOKEN` is unset on the repo, deliberately, until a release is
actually wanted.

The reversal that DOES matter is the one that cannot be done: publishing is a one-way door. A
renamed prop, exported name or tier 2 token breaks consumers already shipped, and a bad release is
fixed forward with a patch, never unpublished. That is why the public surface diff is reviewed
before the implementation rather than after it.

## Open Questions

- [x] D0128 - does a choice close the list? RESOLVED: no. `closeOnSelect` was added to the engine rather than branching inside MultiSelect, so Select and Combobox keep their behaviour unchanged and the difference is one flag with one reason recorded against it.
- [x] What happens to the highlight when the parent re-renders? RESOLVED late, by round 1's review rather than at design time. A controlled parent with an inline `options` array hands the engine a fresh array identity on every toggle, which re-seated the highlight. The engine now holds it by value while the list stays open. This should have been an Edge Case before the code, and was not.

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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
