# US-01M0GMJ8: Combobox

> **Status:** Review
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Combobox/**, packages/react/src/components/Combobox/verification.md, packages/react/src/lib/listbox.ts, packages/react/src/styles.css, packages/tokens/src/component/combobox.json, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** a filterable picker that loads options asynchronously
**So that** I can find one customer among thousands by typing, not scrolling

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

Sofia needs a Select that filters, because a list of 400 cost centres is not
navigable by typeahead alone. Combobox is the editable-trigger case of the same pattern: the trigger
is a textbox rather than a button, and what the user types is a filter query rather than a typeahead
buffer.

That single difference - `triggerKind` - has more consequences than it looks. Typeahead must be OFF,
because the same keystrokes are the query. Space must never be prevented, because it is a query
character and keydown precedes insertion. Both were found by measurement rather than by reasoning,
and both are now flags on the shared engine with their reasons recorded beside them.

Filtering also changes what the highlight should do: the option the user was pointing at may no
longer exist, so re-seating is correct here where it is wrong for MultiSelect.
## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Architecture | Sits on the shared listbox engine (D0105). The engine owns the keyboard model and the highlight; the component owns its markup | AC covering keyboard behaviour is satisfied by the engine, so a change there reddens every component on it |
| PRD | Accessibility | WCAG 2.2 AA. Non-text state indicators need 3:1 (PRD Section 7); the cursor and the CHOICE need separate visible carriers (D0124) | A criterion asserting a state is visible must name the channel carrying it, not just the class |
| PRD | Security | No network calls, no environment variables, no user data leaves the component | No AC covers data handling because there is none; stated so absence reads as deliberate |
| Epic | Architecture | `triggerKind: 'textbox'` - typeahead OFF, Space never prevented, and the highlight re-seats when the filtered list changes | Three ACs exist only because the trigger is editable, and each names the reason |

## Acceptance Criteria

### AC1: Combobox pattern

- **Given** an open Combobox
- **When** I type to filter
- **Then** the WAI-ARIA combobox pattern holds, including aria-activedescendant tracking the highlighted option
- **And** a printable key reaches the INPUT rather than being prevented. The engine treated Space
  as an OPEN key for every trigger, on a comment claiming it was "harmless for an input, where it is
  a printable character the input handles before this ever sees it" - false, because keydown
  precedes insertion. Measured before the fix, typing " Ac" produced "Ac". The engine now takes a
  required `triggerKind`, so the trigger says what it is instead of the engine assuming
- **Verify:** vitest "Combobox WAI-ARIA pattern|leading Space|Space as typing"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC2: Async states

- **Given** a Combobox with an async source
- **When** the source is loading, empty, or failing
- **Then** distinct loading, empty and error states render and are announced
- **Verify:** vitest "Combobox async loading empty error states"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Option ceiling

- **Given** a Combobox given more local options than the documented ceiling
- **When** it renders
- **Then** a development warning directs the consumer to async loading; client-side virtualization is v1.1 (D0019)
- **And** it fires when the list GROWS past the ceiling after mount, not only when it mounts past
  it. The latch was set before its own condition was evaluated, so the `options.length` dependency
  was dead and a list growing from 3 to 700 warned zero times - the most realistic shape of the
  mistake this criterion exists to catch
- **Verify:** vitest "Combobox warns above local option ceiling|GROWS past the ceiling"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC4: Option groups

- **Given** a Combobox with grouped options
- **When** it renders
- **Then** role=group with accessible group labels
- **Verify:** vitest "Combobox option groups"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Inside a scrollable table

- **Given** a Combobox in a scrollable Table cell
- **When** it opens
- **Then** the listbox is portalled OUT of the scroll container's subtree, so no ancestor's
  `overflow` can clip it
- **And** "not clipped and stays anchored on scroll" is a RENDERED fact and jsdom decides neither -
  it computes no layout and does no scrolling. What is asserted is the MECHANISM that makes clipping
  impossible; whether the panel stays anchored while a real container scrolls belongs in
  `e2e/stacking.spec.ts` and is named in the verification record as not yet covered
- **Verify:** vitest "Combobox inside scrollable container"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: Token-only styling

- **Given** the Combobox stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component Combobox
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

### AC7: Both themes and densities

- **Given** a Combobox
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "Combobox theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC8: Definition of done

- **Given** the Combobox story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component Combobox
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC9: The option state model carries both facts, and the group label is readable

- **Given** an open Combobox
- **When** the activedescendant cursor and the selected choice are both on screen
- **Then** each has its own visible carrier and they are never the same treatment: the cursor is a
  tint PLUS an inset leading bar, the choice is a check glyph (D0124)
- **And** the cursor's carrier clears the 3:1 PRD Section 7 sets for a non-text state indicator. The
  tint alone measured 1.14:1 light and 2.28:1 dark against the panel, and `check:contrast` could not
  see it because the only `bg.row-hover` pairing in the table was `fg.default` ON it, as TEXT - a
  state indicator is non-text, so the pair that needed measuring never existed
- **And** the group label renders at the 14px body floor, not 12px. It is the accessible name of the
  group and the sole carrier of its identity, so D0104's Q1 answers yes and there is no second
  question (D0121). It reached 12px through a tier 3 alias to `font.caption`, which made it
  invisible to the `--clara-font-caption` census D0104 was decided from
- **Verify:** vitest "visible carrier|stylesheets select on the option state model|group label sits at the body floor"
- **Verified:** yes (2026-08-29)
- **Verification target:** functional

> The RENDERED result is not verified and is not claimed to be: jsdom computes no layout and
> resolves no `var()`. What is checked is that the second channel is DECLARED
> (`check-component-css`, which exits 1 on its deletion - and so does the stylesheet-reading case in this criterion's own verifier, so BOTH channels see it) and that the
> token pair MEASURES (`check:contrast`). Appearance stays a stated gap until gate 7 (US-01M0WSME).

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Combobox

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

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
| The user types a filter query | The list re-filters and the highlight re-seats to the selected option or the first enabled one - the option it was on may no longer exist. |
| The query matches nothing | An empty listbox, announced, rather than a closed panel. Closing on no-match hides the fact that the query is the problem. |
| Space is typed into the query | Inserted as a character. It must never be prevented: keydown precedes insertion, so preventing it deletes the space. Measured - typing " Ac" into a closed Combobox produced "Ac" before the fix. |
| A printable character is typed | It is a QUERY character, never a typeahead key. Typeahead is a listbox affordance and is wrong for an editable trigger. |

> 10 edge cases.
> NO row here comes from round 1, which did not review Combobox. The last FOUR rows are this
> component'''s own: three from the D0121-D0124 repair round and the Space-on-a-textbox row from the
> measurement behind D0123. The rows above them are shared with the other listbox components, and
> the fresh-array-identity row is D0128 - a later decision, made for MultiSelect. Scoping this
> matters: the sentence it replaced over-attributed in exactly this way.

## Test Scenarios

- [x] The trigger is a textbox that owns a listbox
- [x] Typing filters the options and re-seats the highlight
- [x] Space is inserted into the query and never prevented
- [x] Typeahead is off - a printable character does not jump the highlight
- [x] The highlight skips disabled options and does not wrap
- [x] Escape closes and restores focus to the input
- [x] No Radix prop appears on the public surface
- [x] axe passes across four theme x density combinations
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
| US-01M0GMRK | Engine | The shared listbox engine (D0105) | Draft (built) |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| React 18 and 19 | peer | Supported, both |
| Radix UI primitives | runtime | Used for the portal and positioning only - never leaked to the API |
| `@internationalized/date` | runtime | Only for the two calendar stories, reached only through `lib/calendar.ts` (ADR-008 picks it, D0129 confines it) |

## Estimation

**Points:** 8
**Complexity:** High

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

- [x] BG-01M17P6M - ArrowDown can walk the highlight UP the screen on a grouped list. UNRESOLVED, filed, and inherited from the shared engine. Not stop-ship: nothing is published, and it is triaged with acceptance criteria.

## Resolved Questions

> Rulings, not open items. They live under their own heading because a ticked box with
> no destination is how a question stops being visible without being answered - the
> terminal-status gate refuses one, and it is right to.

- [x] Should typeahead be shared with Select? RESOLVED: no. It is a listbox affordance and is wrong for a combobox, where the same keystrokes are the query. It is a flag on the engine (`typeahead`) with the reason recorded, not a branch inside either component.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production change the criterion's own
verifier must fail on, and the verdict beside it is what happened.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/lib/listbox.ts, packages/react/src/components/Combobox/Combobox.tsx | TWO mutants, both KILLED. (a) Drop `aria-activedescendant` from `triggerProps`. (b) Remove `onOpenAutoFocus`'s `preventDefault`, so Radix moves focus into the panel and the caret leaves the input the user is still typing in. A THIRD was attempted and SURVIVED - clamping the highlight when `options` changes - which proved that effect DEAD: the effect above it already depends on `options`, so any filter re-seats the highlight anyway. The clamp is deleted rather than left with a row claiming a mutant that cannot fail. | Combobox pattern |
| AC2 | packages/react/src/components/Combobox/Combobox.tsx | TWO mutants, both KILLED. (a) Remove `role="status"` from the announcer, so the three states paint and announce nothing - AC2 asks for both halves and this is the half a screen-reader user has. (b) Run the local filter on the async path, which hides options the caller deliberately returned. | Async states |
| AC3 | packages/react/src/components/Combobox/Combobox.tsx | THREE mutants, all KILLED, one per clause. (a) Warn on the async path too - a warning that fires on the route it is telling you to take is worse than none. (b) Warn AT the ceiling rather than past it, which teaches people to ignore it at the documented limit. (c) Truncate what is shown. **(c) first SURVIVED**: it was aimed at the filter branch, and the test that counts options types nothing, so that branch never ran. Retargeted at the returned list. | Option ceiling |
| AC4 | packages/react/src/components/Combobox/Combobox.tsx | Drop `aria-labelledby` from the group, leaving `role="group"` intact. KILLED. The assertion reads the group's ACCESSIBLE NAME, not its text: a group containing the word "Europe" is not the same as one named it (D0065). | Option groups |
| AC5 | packages/react/src/components/Combobox/Combobox.tsx | Replace `ClaraPortal` with a plain `div`, keeping the JSX well-formed. KILLED - the listbox lands inside the `overflow: auto` ancestor, where no z-index can rescue it. | Inside a scrollable table |
| AC6 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-combobox__panel`. KILLED, `check-component-css` exits 1. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet. | Token-only styling |
| AC7 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`. KILLED, 4 of 4. Mutating the PROVIDER proves the assertion walks up from inside the portalled panel rather than reading the render container. | Both themes and densities |
| AC8 | packages/react/src/components/Combobox/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. | Definition of done |
| AC9 | packages/react/src/styles.css, packages/react/src/components/Combobox/Combobox.tsx, packages/tokens/src/component/combobox.json | FIVE mutants, all KILLED, and the first two by the GUARD while every test stayed green - which is the point. (a) Delete the `box-shadow` from `.clara-combobox__option--active`, returning the cursor to colour alone: `check-component-css` exits 1 AND the stylesheet-reading case fails. An earlier version said vitest stayed green at 53 passed; that was the PRE-REPAIR count, never re-measured, and three seats caught it. (b) Delete `color` from `.clara-combobox__check`, so the glyph inherits the option's colour and stops distinguishing choice from cursor: guard exits 1. (c) Rebind the check glyph to the cursor rather than the choice, collapsing the two facts. The `--selected` class this row used to name is gone: it carried no CSS rule, so asserting it was a proxy. (d) Repoint `option-check-fg` to `{color.bg.surface}`: `check:contrast` exits 1 - the glyph is the sole carrier of the choice and was in no pairing until round 3. (e) Delete the group label's `font-weight`: the guard exits 1. After D0121 moved the label to 14px, weight is the only non-colour channel separating a heading from the options under it. jsdom resolves no `var()` and computes no layout, so nothing here sees the RENDERED result - but the declarations themselves are readable, which is what the stylesheet-reading cases do. | The option state model carries both facts, and the group label is readable |

**Two mutants are deliberately absent.** Nothing here proves the panel stays ANCHORED while a real
container scrolls, or that it is unclipped in a rendered sense - jsdom does no layout and no
scrolling. And nothing proves a screen reader SPEAKS the status region; the tests read its content.
Both are named as stated gaps in the verification record rather than left implied.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
