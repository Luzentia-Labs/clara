# US-01M0GM0F: DateRangePicker

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK91
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/reference-app/src/screens/List.tsx, packages/react/src/components/DateRangePicker/**, packages/react/src/components/DateRangePicker/verification.md, scripts/check-component-css.mjs
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
- **Verification target:** functional

### AC2: Presets

- **Given** a DateRangePicker
- **When** I open the presets
- **Then** this month, last quarter and year to date are available and keyboard reachable
- **Verify:** vitest "DateRangePicker presets are keyboard reachable"
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
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DateRangePicker stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
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
- **Verification target:** functional

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
