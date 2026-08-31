# US-01M0GM0F: DateRangePicker

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/DateRangePicker/**, packages/react/src/components/DateRangePicker/verification.md, packages/react/src/lib/calendar.ts, packages/react/src/lib/calendar-grid.ts, packages/react/src/components/DatePicker/DatePicker.tsx, packages/react/src/styles.css, packages/react/src/index.ts, packages/react/client-boundary.json, packages/react/src/components/__tests__/boundary.test.tsx, packages/tokens/src/component/date-range-picker.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, scripts/check-component-css.mjs, scripts/check-verification.mjs, apps/docs/src/content/components/date-range-picker.md, .size-limit.json
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a start and end date with common period presets
**So that** selecting last quarter takes one click rather than two calendar hunts

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

Grace reconciles a period, not a day: "last quarter", "this month", or two dates
she picks herself. The presets are not a convenience feature - they are the common case, and putting
them before the grid in the tab order says so.

DateRangePicker reuses `useCalendarGrid` (D0131) rather than a shared calendar COMPONENT, because a
range needs cell states a single picker does not: days that are neither endpoint but lie between
them. Sharing the model and not the markup was the cheaper half to share.

The interaction is two picks with a state between them. That intermediate state - a start chosen and
an end still pending - is where this story's real complexity lives, and it is where round 1 found a
defect: the pending start survived being dismissed.
## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Architecture | Sits on `useCalendarGrid` (D0131). The hook owns roving focus, the step table and week bounds; the component owns cell state | Keyboard ACs are satisfied by the hook, so its tests are the evidence for them |
| PRD | Architecture | `@internationalized/date` is the only date library (ADR-008), reached only through `lib/calendar.ts` (D0129). ISO strings on the public surface, never a Date object | No AC may expose a library type; the public API takes and returns `YYYY-MM-DD` strings |
| PRD | Accessibility | WCAG 2.2 AA. A date grid is 2D, so it uses roving tabindex and focus MOVES - unlike the listbox, where focus stays on the trigger | Focus-management ACs differ from the listbox components on purpose, and say so |
| Epic | Architecture | Reuses the calendar HOOK, not a calendar component - a range needs in-range cell states a single picker does not | Markup ACs are this component's own; keyboard ACs are the hook's |

## Acceptance Criteria

### AC1: Range selection

- **Given** a DateRangePicker
- **When** I select a start and end
- **Then** both are captured and the range is announced
- **Verify:** vitest "DateRangePicker range selection"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC2: Presets

- **Given** a DateRangePicker
- **When** I open the presets
- **Then** this month, last quarter and year to date are available and keyboard reachable
- **Verify:** vitest "DateRangePicker presets are keyboard reachable"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC3: Consumable in the shape a filter bar needs

- **Given** a filter bar composing DateRangePicker with the controls beside it
- **When** a range is chosen and then cleared
- **Then** the component drives from a controlled ISO-string pair, reports both endpoints through one
  callback, and clears back to an empty range without the caller reaching past the public API
- **And** this criterion was SPLIT, because as written it could not be delivered by this epic. It
  read "the F31 list screen ... uses DateRangePicker" and its verifier was
  `file apps/reference-app/src/screens/List.tsx` - a path that does not exist. `apps/reference-app`
  is a bare `package.json` whose build script is `echo "not yet implemented" && exit 1`, and it is
  owned by **EP-01M0GKV1**. A criterion naming another epic's deliverable makes this story
  un-closable for a reason that is not its own, which is the identical defect found and split in
  EP-01M0GK4P's own criterion 4
- **And** the verifier was `file <path>`, which passes because a file EXISTS. That is the weakest
  verifier class in this repository and it was already found once on Tag's AC5, where a
  definition-of-done criterion passed on one file existing while every test could have been deleted
- **And** what this epic CAN prove is the consuming need itself: that the public API supports the
  composition a filter bar requires. When EP-01M0GKV1 builds the list screen it inherits a component
  already proved consumable, and its own criterion owns the integration
- **Verify:** vitest "DateRangePicker drives a filter bar"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DateRangePicker stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component DateRangePicker
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a DateRangePicker
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "DateRangePicker theme and density matrix"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the DateRangePicker story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component DateRangePicker
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

## Scope

### In Scope

- DateRangePicker

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
| The two dates are chosen backwards (end first) | They are ordered rather than rejected. A user who clicks the later date first meant a range, not an error. |
| The panel is dismissed with a start chosen but no end | The pending start is DISCARDED. Round 1 found it cleared on Escape alone, so clicking away and reopening completed a range against a date the user had abandoned. |
| The same date is chosen twice | A single-day range, which is a legitimate period and not an error state. |
| An endpoint would otherwise also count as in-range | It never does: `inRange` uses STRICT `>` and `<`, so the two classes are mutually exclusive by construction rather than composed. They have to be - both `--endpoint` and `--in-range` declare `background`, the same channel, so an element carrying both would have one silently win. AC1's own mutant is widening `>` to `>=`. The CURSOR is the thing that composes, and only because it uses `box-shadow` rather than a background. |
| A preset is chosen | It sets both endpoints at once and closes, with no pending state in between. |
| Clear is pressed | Both endpoints and any pending start are dropped together, and the announcement says so. |
| The control is disabled | The trigger and the Clear button both carry `aria-disabled`; round 1 found Clear silently inert. |

> 7 edge cases.
> Row 2 is round 1's F1 - a pending start banked across every dismissal except Escape, so a later
> single pick completed a range against an abandoned date. Row 7 is F8: the Clear control was
> silently inert when disabled. Both were found by an adversarial review rather than at design time.

## Test Scenarios

- [x] Both endpoints are captured and the panel stays open between them
- [x] Endpoints chosen backwards are ordered rather than rejected
- [x] A pending start is discarded by Escape AND by any other dismissal route
- [x] Each preset produces the dates its label claims, asserted by value not by presence
- [x] Arrow, Page and Home/End keys drive the grid; Enter commits; Escape closes and restores focus
- [x] An endpoint does not also carry the in-range class
- [x] Clear carries `aria-disabled` when the control is disabled
- [x] axe passes across four theme x density combinations

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
| US-01M0GMC1 | Engine | `useCalendarGrid` and `lib/calendar.ts` (D0131) | Blocked (built) |

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

- [x] One month or two side by side? RESOLVED: one, paging. A two-month view is more keystrokes saved but more layout than this story carries, and it is recorded as a stated gap in the verification record rather than left implicit.
- [x] Where do presets sit in the tab order? RESOLVED: before the grid, because they are the common case. Reaching them should not require tabbing through 42 day cells.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production change the criterion's own
verifier must fail on, and the verdict beside it is what happened.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/DateRangePicker/DateRangePicker.tsx | THREE mutants, all KILLED. (a) Commit a range on the FIRST choice instead of holding it as a pending start - the panel closes after one date and a range can never be picked. (b) Drop the `.sort()` so endpoints chosen backwards report end-before-start. (c) Widen the in-range test from `>` to `>=` so an endpoint is ALSO drawn as context. (c) SURVIVED at first: the test asserted an in-range day is not an endpoint but never that an endpoint is not in-range, so both classes on one cell passed. A cell carrying both puts two backgrounds on one day and which paints depends on stylesheet order. | Range selection |
| AC2 | packages/react/src/lib/calendar.ts | TWO mutants, both KILLED, and both found a proxy first. (a) `lastQuarterStart = thisQuarterStart` turns "Last quarter" into the current quarter. (b) Year to date starts in February. Both SURVIVED the original test, which checked only that the preset buttons existed and that a range came back - the label is a claim about WHICH dates, so the dates are now computed from today and asserted. | Presets |
| AC3 | packages/react/src/components/DateRangePicker/DateRangePicker.tsx | Make Clear reset only the internal pending state without calling `onValueChange`, so a controlled caller's value never changes and the filter cannot be removed. KILLED. The test drives a real controlled component with an `output` reading the value back, because a filter bar's requirement is that the caller's state moves - not that a handler fired. | Consumable in the shape a filter bar needs |
| AC4 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-date-range-picker__panel` - a raw literal where a token belongs. `check-component-css --component DateRangePicker` exits 1. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet. | Token-only styling |
| AC5 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. Mutating the PROVIDER proves the assertion walks up from inside the portalled panel rather than reading the render container. | Both themes and densities |
| AC6 | packages/react/src/components/DateRangePicker/verification.md | Rename `## Keyboard` to `## Keys`. `check-verification --component DateRangePicker` exits 1 on the missing section. | Definition of done |

**Also mutated, and killed by BOTH channels:** giving the roving cursor a `background` instead of
its `box-shadow` fails the stylesheet-reading case AND `check-component-css`. That one matters
because a day can be the cursor and an endpoint simultaneously, so the cursor takes the channel
that composes rather than the one it would have to win.

**One mutant is deliberately absent.** Nothing here proves the two endpoints and the days between
them are DISTINGUISHABLE on screen - that is three surfaces whose difference jsdom cannot see. The
contrast pairs are measured and the declarations are asserted; what they look like is gate 7's.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
