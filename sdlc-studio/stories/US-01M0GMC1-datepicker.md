# US-01M0GMC1: DatePicker

> **Status:** Review
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/DatePicker/**, packages/react/src/components/DatePicker/verification.md, packages/react/src/lib/calendar.ts, packages/react/src/styles.css, packages/react/src/index.ts, packages/react/package.json, packages/react/client-boundary.json, packages/react/src/components/__tests__/boundary.test.tsx, packages/tokens/src/component/date-picker.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, scripts/check-component-css.mjs, scripts/check-verification.mjs, apps/docs/src/content/components/date-picker.md, .size-limit.json
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** to type a date directly or pick it from a calendar, whichever is faster
**So that** entering a posting date is not slower than writing it on paper

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

Grace types dates. She knows the format, she has the invoice in front of her, and
a calendar she has to click through is slower than the keyboard she is already using. Sofia's
previous four builds all shipped a date field that disabled the text input in favour of the picker,
which is the single complaint that generated this story.

So the text input is never disabled in favour of the calendar - both are always available, and the
calendar is an affordance rather than the only route. That constraint drives most of the design: the
input owns the value, the calendar seeds itself FROM the input, and a half-typed value has to remain
a valid state of the control rather than an error.

The grid is a `role="grid"` with roving tabindex, which is a different focus model from the listbox
components in this epic: a calendar is two-dimensional, so focus moves between cells rather than
staying on a trigger with `aria-activedescendant`.
## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Architecture | Sits on `useCalendarGrid` (D0131). The hook owns roving focus, the step table and week bounds; the component owns cell state | Keyboard ACs are satisfied by the hook, so its tests are the evidence for them |
| PRD | Architecture | `@internationalized/date` is the only date library (ADR-008), reached only through `lib/calendar.ts` (D0129). ISO strings on the public surface, never a Date object | No AC may expose a library type; the public API takes and returns `YYYY-MM-DD` strings |
| PRD | Accessibility | WCAG 2.2 AA. A date grid is 2D, so it uses roving tabindex and focus MOVES - unlike the listbox, where focus stays on the trigger | Focus-management ACs differ from the listbox components on purpose, and say so |
| PRD | API | The text input is never disabled in favour of the calendar | AC1 asserts it directly; the calendar is an additional route to the same value, never the only one |

## Acceptance Criteria

### AC1: Text entry is never disabled

- **Given** a DatePicker
- **When** I type a date
- **Then** direct text entry works and is never disabled in favour of the calendar
- **Verify:** vitest "DatePicker accepts direct text entry"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC2: Format is discoverable

- **Given** a DatePicker
- **When** I look for the expected format
- **Then** it appears in the field description, not only the placeholder
- **Verify:** vitest "DatePicker format is in the description"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC3: Calendar keyboard model

- **Given** an open calendar
- **When** I navigate by keyboard
- **Then** arrows move by day, PageUp and PageDown by month, Home and End to week bounds, Escape closes and restores
- **Verify:** vitest "DatePicker calendar keyboard navigation"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC4: Focused date is announced

- **Given** an open calendar
- **When** focus moves
- **Then** the focused date and its month context are announced
- **Verify:** vitest "DatePicker announces focused date and month"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC5: ISO string boundary

- **Given** the public API
- **When** I inspect the props
- **Then** value and onValueChange use ISO date strings; no @internationalized/date type reaches the surface (TRD ADR-008)
- **Verify:** shell ! grep -q "@internationalized" packages/react/etc/clara-react.api.md
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC6: Unavailable dates

- **Given** a DatePicker with min, max or a disabled-date predicate
- **When** I reach an unavailable date
- **Then** it is announced as unavailable rather than silently inert
- **Verify:** vitest "DatePicker announces unavailable dates"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC7: Token-only styling

- **Given** the DatePicker stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs --component DatePicker
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC8: Both themes and densities

- **Given** a DatePicker
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **And** "holds its visual baseline" is deliberately NOT claimed: jsdom computes no layout and
  resolves no custom property, so a matrix criterion verified by vitest cannot see appearance at
  all. That is gate 7's (US-01M0WSME), and every story in the preceding epic was corrected the
  same way
- **Verify:** vitest "DatePicker theme and density matrix"
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

### AC9: Definition of done

- **Given** the DatePicker story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the copied sentence this replaced claimed "a visual baseline ... and a recorded manual
  keyboard pass all exist". `check-verification.mjs` has a rule for neither: no baseline exists for
  any component because gate 7 is unwired (US-01M0WSME), and the guard deliberately accepts an
  honest "outstanding" for the manual pass. **BG-01M107ND** carries the same correction for the
  stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component DatePicker
- **Verified:** yes (2026-08-30)
- **Verification target:** functional

## Scope

### In Scope

- DatePicker

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
| The user has typed a half-finished date (`2026-0`) | Tolerated, not an error - it is the normal state of an input someone is filling in. The calendar still opens and falls back to today. Round 1 found it rendering ZERO day cells instead, with no roving tab stop and inert arrow keys. |
| The `value` prop itself is unparseable | Same fallback. A consumer passing bad data gets a usable control and their own value echoed back, not a crash. |
| The month has fewer than 42 day cells | `monthGrid` always returns six rows, so the grid does not change height between months and the layout does not jump. |
| The panel opens behind a portal | Focus must reach the roving cell. An effect on `open` runs before the portal content is in the DOM, so focus is taken at ATTACH time via a callback ref - measured, because the effect version left focus on the toggle. |
| A date outside `min`/`max`, or matched by `isDateUnavailable` | The cell renders but is not choosable, and Enter on it commits nothing. |
| The control is disabled | `aria-disabled` plus suppressed handlers on BOTH the input and the toggle. Round 1 found the toggle silently inert with no state in the a11y tree. |
| Escape while the calendar is open | Closes and RESTORES focus to the input. A dialog that closes and drops focus to the body strands a keyboard user at the top of the page. |

> 7 edge cases.
> Rows 1 and 2 are round 1's F2 and F7 - a truthy-but-unparseable seed emptying the entire grid,
> which survived because the test that named it never opened the calendar. Row 6 is F8: the "Choose
> date" toggle carried no `aria-disabled`. All three were found by an adversarial review rather than
> at design time.

## Test Scenarios

- [x] A date can be typed without ever opening the calendar
- [x] The text input is never disabled, and never carries the native `disabled` attribute
- [x] A half-typed date is tolerated AND still opens a usable 42-cell calendar
- [x] Arrow keys move by day, up/down by week, PageUp/PageDown by month, Home/End to the week bounds
- [x] Enter commits the focused day; Escape closes and restores focus to the input
- [x] The selected day is marked in the accessibility tree and in the class list
- [x] The format is stated in the accessible description, not only the placeholder
- [x] Exactly one cell carries `tabindex="0"`
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
| US-01M0GM3D | Framework | Field wiring, `fieldAriaProps` and `fieldChangeGuard` (D0068) | Done |

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

None. Every question this story raised has a ruling under Resolved Questions below.

## Resolved Questions

> Rulings, not open items. They live under their own heading because a ticked box with
> no destination is how a question stops being visible without being answered - the
> terminal-status gate refuses one, and it is right to.

- [x] ADR-008 - which date library? RESOLVED: `@internationalized/date`, reached only through `lib/calendar.ts`. Measured at 7.85 kB, the smallest third-party dependency in the repo against 15-34 kB for the Radix packages. D0129 and D0130 raised both size ceilings to take it.
- [x] Roving tabindex or `aria-activedescendant`? RESOLVED: roving tabindex. A grid is 2D and focus moves; the listbox pattern keeps focus on the trigger. They are different patterns and the record says so rather than implying one model covers both.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production change the criterion's own
verifier must fail on, and the verdict beside it is what happened.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/DatePicker/DatePicker.tsx | TWO mutants. (a) `disabled={isDisabled}` on the input, emitting the NATIVE attribute: KILLED - it leaves the tab order, which D0058 and D0064 exist to prevent. (b) Removing the `fieldChangeGuard` SURVIVED, because `readOnly` already blocks typing - so the hand-rolled `if (!isDisabled)` it replaced was dead code. Recorded rather than hidden: the guard stays because it is the shared mechanism D0068 keeps in one place and it also preventDefaults, but this criterion is carried by `readOnly`. | Text entry is never disabled |
| AC2 | packages/react/src/components/DatePicker/DatePicker.tsx | Drop `formatId` from the `aria-describedby` chain, leaving the format in the placeholder only. KILLED. The test reads the describedby ids back out of the document rather than checking the attribute is present, because an id naming nothing is the failure a presence check cannot see. | Format is discoverable |
| AC3 | packages/react/src/components/DatePicker/DatePicker.tsx | THREE mutants, all KILLED, one per axis of the keyboard model. (a) PageUp/PageDown move a WEEK instead of a month. (b) Home/End jump to the MONTH bounds instead of the focused week's. (c) Escape closes without restoring focus, stranding the user at the top of the page. | Calendar keyboard model |
| AC4 | packages/react/src/components/DatePicker/DatePicker.tsx | Pin the grid's `aria-label` to the VALUE's month rather than the focused date's, so paging past a month boundary stops announcing the new month. KILLED. This replaces a mutant that deleted a repeated month from the live region and SURVIVED - the day string already contains its month, so asserting the month inside it was a tautology. The redundancy was deleted and the property that actually changes is asserted instead. | Focused date is announced |
| AC5 | packages/react/etc/clara-react.api.md | Export `CalendarDate` from the package entry. The verifier greps the API report for `@internationalized`, so a library type on the public surface exits 1. `packages/react/src/lib/calendar.ts` is the only module that imports the library, which is what makes the boundary enforceable rather than aspirational. | ISO string boundary |
| AC6 | packages/react/src/lib/calendar.ts | Make `isUnavailable` ignore `min`, so a date before the minimum becomes selectable. KILLED, 1 failed. The grid keeps unavailable days IN it with `aria-disabled` rather than removing them, and the second case proves Enter refuses to commit one and the dialog stays open. | Unavailable dates |
| AC7 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-date-picker__panel` - a raw literal where a token belongs. `check-component-css --component DatePicker` exits 1. No test imports a CSS file, so the verifier must be a guard that READS the stylesheet. | Token-only styling |
| AC8 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. Mutating the PROVIDER proves the assertion walks up from inside the portalled panel rather than reading the render container. | Both themes and densities |
| AC9 | packages/react/src/components/DatePicker/verification.md | Rename `## Keyboard` to `## Keys`. `check-verification --component DatePicker` exits 1 on the missing section. It also refused this record once already, for citing `lib/calendar.ts` by a path that does not resolve from the repo root. | Definition of done |

**One mutant is deliberately absent.** Nothing here proves the grid LAYS OUT as a calendar - that
seven cells sit in a row, or that the focused day is visibly marked. jsdom computes no layout and
resolves no `var()`. The stylesheet-reading cases assert the declarations exist; what they render
is gate 7's, and it is unwired.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
