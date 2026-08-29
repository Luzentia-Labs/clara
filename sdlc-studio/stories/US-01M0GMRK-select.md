# US-01M0GMRK: Select

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Select/**, packages/react/src/components/Select/verification.md, packages/react/src/lib/listbox.ts, packages/react/src/styles.css, packages/tokens/src/component/select.json, packages/tokens/src/pairings.json, scripts/check-component-css.mjs
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a select for short, known option sets
**So that** picking from a handful of options is fast and predictable

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
  printable key held with Meta, Control or Alt is left to the browser. Both behaviours were stated
  in the keyboard table and asserted nowhere: each deleted clean against the whole suite
- **Verify:** vitest "Select keyboard operation|commits on Space|cycles typeahead|modified printable key"
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
- **Verify:** vitest "visible carrier|separates the CURSOR|stylesheets select on the option state model"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

> The RENDERED result of this criterion is not verified and is not claimed to be. jsdom computes no
> layout and resolves no `var()`, so what is checked here is that the second channel is DECLARED
> (`check-component-css`, which reddens on its deletion while all 53 tests stay green) and that the
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
| AC8 | packages/react/src/styles.css, packages/react/src/components/Select/Select.tsx | TWO mutants, both KILLED by the GUARD while every test stayed green - which is the point of the row. (a) Delete the `box-shadow` from `.clara-select__option--active`, returning the cursor to colour alone: `check-component-css` exits 1, vitest reports 53 passed. (b) Delete `color` from `.clara-select__listbox-panel`, the dark-on-dark defect its own comment describes: guard exits 1, vitest reports 53 passed. jsdom resolves no `var()` and computes no layout, so a vitest-only verifier over this criterion is green by construction. TWO mutants, both KILLED. (a) Remove the `--selected` class, so the CHOICE has no carrier - the state this criterion was written against. (b) Bind `--selected` to `activeIndex` instead of the value, collapsing choice into cursor: the separation case reddens, which is what stops the two facts sharing one treatment. | The option state model carries both facts, and neither by colour alone |

**One mutant is deliberately absent.** Nothing here proves the listbox PAINTS above a modal, flips
at a viewport edge, or stays unclipped in a scrollable container. Those are rendered facts, jsdom
decides none of them, and the browser assertions Popover has in `e2e/stacking.spec.ts` do not yet
exist for Select. The verification record names it as a stated gap rather than leaving the Test Plan
implying coverage that is not there.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
