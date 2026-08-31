# US-01M0GMRK: Select

> **Status:** Review
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Select/**, packages/react/src/components/Select/verification.md, packages/react/src/lib/listbox.ts, packages/react/src/styles.css, packages/tokens/src/component/select.json, packages/tokens/src/pairings.json, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a select for short, known option sets
**So that** picking from a handful of options is fast and predictable

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

The single-choice list, and the component the rest of this epic is built on. Its
keyboard model became `lib/listbox.ts` (D0105), which Combobox and MultiSelect now share.

It follows the APG's **select-only combobox**: the trigger carries `role="combobox"`, focus never
leaves it, and the highlight is communicated with `aria-activedescendant`. That choice is why the
focus model differs from the calendar components in this epic, and the record says so explicitly
rather than leaving a reader to infer that one model covers everything.

The component deviates from the APG in six measured places. Those deviations are recorded rather
than fixed, because fixing them changes keyboard behaviour, which is a decision rather than a
correction. The count itself has a history - see Open Questions.
## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Architecture | Sits on the shared listbox engine (D0105). The engine owns the keyboard model and the highlight; the component owns its markup | AC covering keyboard behaviour is satisfied by the engine, so a change there reddens every component on it |
| PRD | Accessibility | WCAG 2.2 AA. Non-text state indicators need 3:1 (PRD Section 7); the cursor and the CHOICE need separate visible carriers (D0124) | A criterion asserting a state is visible must name the channel carrying it, not just the class |
| PRD | Security | No network calls, no environment variables, no user data leaves the component | No AC covers data handling because there is none; stated so absence reads as deliberate |
| PRD | API | Radix must not leak: `asChild`, `onOpenChange` and `data-state` are never Clara API; `as` is the single polymorphism idiom | No AC may expose a Radix prop, and the API surface guard enforces it |

## Acceptance Criteria

### AC1: Listbox pattern

- **Given** an open Select
- **When** I use the keyboard
- **Then** aria-expanded, aria-controls, aria-activedescendant and the listbox and option roles are all correct
- **Verify:** vitest "Select listbox pattern"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC2: Full keyboard operation

- **Given** a Select
- **When** I use only the keyboard
- **Then** arrows move, Enter selects, Escape closes and restores, Home and End jump, Tab commits,
  and Space selects and closes as the APG requires (D0123) - it used to fall through to the
  typeahead branch, which prevented the key and searched for a label beginning with a space, so it
  was silently inert on a key this component itself teaches as one of the keys that OPENS the list
- **And** typeahead cycles on a repeated character rather than searching for the repeat, and a
  printable key held with Meta, Control or Alt is left to the browser. Each deleted clean against
  the whole suite before this round. The cycling behaviour is stated in the keyboard table; the
  modifier-key exclusion is NOT, which an earlier version of this clause wrongly claimed
- **Verify:** vitest "Select keyboard operation|commits on Space|cycles typeahead|modified printable key|APG deviations are recorded and pinned"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC3: Composite value convention

- **Given** a Select
- **When** I control it
- **Then** value, defaultValue and onValueChange receive the value itself rather than an event
- **Verify:** vitest "Select uses onValueChange"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC4: Works inside a Modal

- **Given** a Select inside an open Modal
- **When** it opens
- **Then** the listbox is portalled OUT of the modal's subtree, onto a host carrying Clara's scope
  attributes, so it takes the shared overlay layer and is themed by where it was written
- **And** "renders above the modal without clipping" is a RENDERED fact and jsdom decides none of
  it - no layout, no paint order. Measured: an assertion that the listbox renders and selects inside
  a Modal stayed green with `ClaraPortal` removed entirely, because a listbox nested in the modal
  still renders and still selects. Presence was standing in for stacking (D0065). What is asserted
  here is the MECHANISM that produces the stacking; the painting half belongs in `e2e/stacking.spec.ts`
  with every other overlay's rendered claim, and is named in the verification record as not yet done
- **Verify:** vitest "Select inside Modal"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC5: Token-only styling

- **Given** the Select stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component Select
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC6: Both themes and densities

- **Given** a Select
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "Select theme and density matrix"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC7: Definition of done

- **Given** the Select story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component Select
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC8: The option state model carries both facts, and neither by colour alone

- **Given** an open Select
- **When** the activedescendant cursor and the selected choice are both on screen
- **Then** each has its own visible carrier and they are never the same treatment: the cursor is a
  tint PLUS an inset leading bar, and the choice is a check glyph
- **And** the cursor's carrier clears the 3:1 PRD Section 7 sets for a non-text state indicator. The
  tint alone measured 1.14:1 in light and 2.28:1 in dark against the panel - two review seats
  measured it independently, one with `scripts/lib/wcag.mjs` and one in Chromium against the built
  dist - and colour alone is refused by D0100 and D0104 whatever the ratio (D0124)
- **And** the bar is INSET rather than an outline, because D0054 makes the focus indicator an
  outline plus an offset ring and a keyboard cursor must not render as a focus ring
- **Verify:** vitest "visible carrier|separates the CURSOR|stylesheets select on the option state model|option state tokens are pinned at both ends"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

> The RENDERED result of this criterion is not verified and is not claimed to be. jsdom computes no
> layout and resolves no `var()`, so what is checked here is that the second channel is DECLARED
> (`check-component-css`, which exits 1 on its deletion - and so does the stylesheet-reading case in this criterion's own verifier, so BOTH channels see it) and that the
> token pair MEASURES (`check:contrast`, over a pairing that did not exist before D0124). What a
> user sees stays a stated gap until gate 7, owned by US-01M0WSME.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Select

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
| The APG lists a key Clara does not handle | Recorded as a measured deviation with the count machine-checked, not fixed silently. AT LEAST six exist, and the list is NOT proven complete - nothing enumerates the APG's key list, so absence from the table is not evidence of conformance. The record carries that caveat deliberately and this story keeps it: the count read three, then two, then four before anything executed it. |
| Space while the list is OPEN | Selects and closes, per the APG (D0123). It previously fell to the typeahead branch and searched for a label beginning with a space - silently inert on a key this component itself teaches as one that opens the list. |
| Space on a TEXTBOX trigger | Never prevented - it is a query character there, and keydown precedes insertion, so preventing it deletes the user's space. |
| A printable character is repeated | Typeahead cycles through options starting with that character rather than searching for the repeated string. |

> 10 edge cases.
> NO row here comes from round 1: round 1 reviewed MultiSelect, DatePicker and DateRangePicker, and
> did not look at Select. The last four rows come from the earlier D0121-D0124 repair round and from
> D0123's Space case, which is a different set of rounds against a different component.

## Test Scenarios

- [x] The trigger is a combobox owning a listbox, and says so only while open
- [x] The highlight tracks with `aria-activedescendant` and the id RESOLVES to a rendered option
- [x] The highlight skips disabled options and does not wrap at either end
- [x] Home and End jump to the first and last ENABLED options
- [x] Space while open commits and closes (D0123)
- [x] The six APG deviations are pinned, and the COUNT is read by a machine
- [x] Enter and Space open the closed list through the ENGINE, not through native button activation
- [x] The option state tokens are pinned at both ends
- [x] It stays operable inside a Modal

> Every scenario above is executed. Most are covered by the suites named in the Test Plan below;
> a few are held by repo-wide guards that the Test Plan does not list, because they are not
> per-component verifiers - the public-surface scenario is `scripts/api-report.mjs`, and the
> token-only styling one is `scripts/check-component-css.mjs`. Naming that difference matters: an
> earlier version of this footnote said "the suites named in the Test Plan below" and a plan-review
> found scenarios ticked off with nothing behind them at all.
>
> The manual keyboard pass is NOT among them. It is outstanding on every record in this epic, it is
> the thing no automated check reaches, and each verification record says so in its own words.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| US-01M0GM3D | Framework | Field wiring and `fieldAriaProps` | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| React 18 and 19 | peer | Supported, both |
| Radix UI primitives | runtime | Used for the portal and positioning only - never leaked to the API |
| `@internationalized/date` | runtime | Only for the two calendar stories, reached only through `lib/calendar.ts` (ADR-008 picks it, D0129 confines it) |

## Estimation

**Points:** 5
**Complexity:** Medium

> Sized against the components already delivered in the preceding epic. This is a RELATIVE size on
> the modified Fibonacci scale, not a duration.
>
> **This estimate was never measured against an actual.** The run was driven interactively rather
> than by the sprint runner, so no per-unit token or time actual was recorded, and
> `retro.py accuracy` cannot run at all here - its id regex wants four digits where this project
> uses ULIDs. RETRO0004 records both facts. The points below are therefore a forecast with no
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

- [x] BG-01M1AJSR - should the six APG deviations be FIXED rather than recorded? UNRESOLVED as a product question, and deliberately so: each changes keyboard behaviour for three components at once, which is a decision for the operator rather than a correction an implementer makes. Recorded, measured and pinned in the meantime. This question had NO artefact until a plan-review found the story citing BG-01M17P6M for it, which is a different bug (ArrowDown walking the highlight up a grouped list); BG-01M1AJSR was filed to hold it.

## Resolved Questions

> Rulings, not open items. They live under their own heading because a ticked box with
> no destination is how a question stops being visible without being answered - the
> terminal-status gate refuses one, and it is right to.

- [x] Why did the deviation count drift four times? RESOLVED: nothing read it. It was prose, and every repair asserted it could not drift again without adding anything that would notice. It is now parsed out of the record and compared against the pinned cases by key.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production change the criterion's own
verifier must fail on, and the verdict beside it is what happened.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/lib/listbox.ts | TWO mutants, both KILLED. (a) Drop `aria-activedescendant` from `triggerProps` - the highlight stops being announced at all. (b) Emit `aria-controls` unconditionally, so a closed trigger names a listbox that is not rendered. The suite reads the activedescendant id back OUT of the document rather than checking the attribute is present, because an id naming a removed element is the failure a presence check cannot see. | Listbox pattern |
| AC2 | packages/react/src/lib/listbox.ts | FIVE mutants, all KILLED, one per branch of the keyboard table. (a) Remove `onOpenAutoFocus`'s `preventDefault` in Select.tsx, so Radix moves focus into the panel and the announced highlight and the real focus disagree. (b) Stop skipping disabled options when arrowing. (c) Make Escape commit - a highlight is not a choice, and treating it as one makes Escape destructive on the key users press to back out. (d) `preventDefault` on Tab, which strands a keyboard user inside the control. (e) Make the arrows wrap, which the APG's listbox does not. THREE further mutants beyond the five above, all KILLED. (f) `if (triggerKind !== 'button') break` -> `break`, deleting the Space commit D0123 requires. (g) `const cycling = ...` -> `false`, deletable against the whole suite before this round while the keyboard table stated the behaviour. (h) Drop the `metaKey`/`ctrlKey`/`altKey` exclusion, so the typeahead `preventDefault` swallows Ctrl+F and Cmd+A. | Full keyboard operation |
| AC3 | packages/react/src/components/Select/Select.tsx | TWO mutants, both KILLED. (a) Pass the option object instead of `option.value`, so the callback reports something with a shape rather than the value. (b) `const current = uncontrolled` - the controlled branch stops reading `value`, so a caller that rejects a change still sees it applied. Note (b) is the mutant that WORKS: the first attempt removed the `if (value === undefined)` guard around `setUncontrolled`, and that SURVIVED, because the controlled branch reads `value` first and the guard is redundant for display. A row recording it would have claimed a verdict nobody could reproduce. | Composite value convention |
| AC4 | packages/react/src/components/Select/Select.tsx | Replace `ClaraPortal` with a plain `div`, keeping the JSX well-formed. KILLED. It previously SURVIVED against an assertion that the listbox renders and selects inside a Modal - true whether portalled or not. The assertion now reads that the dialog does not CONTAIN the listbox and that the listbox landed on a Clara-scoped host. | Works inside a Modal |
| AC5 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-select__listbox-panel` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet or the row is green by construction. | Token-only styling |
| AC6 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4. Mutating the PROVIDER is what proves the assertion walks up from inside the portalled panel rather than reading the render container, which carries the same attributes and was never the portal's scope. | Both themes and densities |
| AC7 | packages/react/src/components/Select/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. | Definition of done |
| AC8 | packages/react/src/styles.css, packages/react/src/components/Select/Select.tsx, packages/tokens/src/component/select.json | SIX mutants, all KILLED, and three of them by a GUARD alone - which is the point of the row. (a) Delete the `box-shadow` from `.clara-select__option--active`, returning the cursor to colour alone: `check-component-css` exits 1 AND the stylesheet-reading case fails. (b) Delete `color` from `.clara-select__listbox-panel`: guard exits 1 while vitest stays green - this one IS guard-only, and it is why the panel is enrolled in the shape contract. (c) Repoint `option-cursor` to `{color.border.default}`: `check:contrast` exits 1 at 2.72:1 light and 2.36:1 dark against the TINT the inset bar is drawn on. An earlier pairing measured the bar against the PANEL, the more permissive of its two adjacencies. (d) Repoint `option-check-fg` to `{color.bg.surface}`: exits 1 at 1.00:1. That token was in no pairing until round 3 - removing the `--selected` class was right, since it carried no CSS rule, but it made the glyph the sole carrier. (e) Bind the check glyph to `activeIndex` instead of the value, collapsing choice into cursor: the separation case reddens. It replaces a mutant that bound a `--selected` CLASS, which styled nothing, so it reddened a test while changing nothing a user could see. (f) Delete `forced-color-adjust` from `.clara-select__check`: guard exits 1. | The option state model carries both facts, and neither by colour alone |

**One mutant is deliberately absent.** Nothing here proves the listbox PAINTS above a modal, flips
at a viewport edge, or stays unclipped in a scrollable container. Those are rendered facts, jsdom
decides none of them, and the browser assertions Popover has in `e2e/stacking.spec.ts` do not yet
exist for Select. The verification record names it as a stated gap rather than leaving the Test Plan
implying coverage that is not there.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
