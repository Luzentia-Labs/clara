# US-01M0GM0F: DateRangePicker

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/DateRangePicker/**, packages/react/src/components/DateRangePicker/verification.md, packages/react/src/lib/calendar.ts, packages/react/src/lib/calendar-grid.ts, packages/react/src/components/DatePicker/DatePicker.tsx, packages/react/src/styles.css, packages/react/src/index.ts, packages/react/client-boundary.json, packages/react/src/components/__tests__/boundary.test.tsx, packages/tokens/src/component/date-range-picker.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, scripts/check-component-css.mjs, scripts/check-verification.mjs, apps/docs/src/content/components/date-range-picker.md, .size-limit.json
> **Points:** 5

## User Story

**As a** Grace Adeyemi
**I want** a start and end date with common period presets
**So that** selecting last quarter takes one click rather than two calendar hunts

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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
