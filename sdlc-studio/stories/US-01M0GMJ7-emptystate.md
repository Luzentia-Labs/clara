# US-01M0GMJ7: EmptyState

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/EmptyState/**, packages/react/src/components/EmptyState/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** an empty state that distinguishes no-data-yet from no-results
**So that** I know whether to add a record or clear my filter

## Acceptance Criteria

### AC1: Two distinct cases

- **Given** an EmptyState
- **When** it renders
- **Then** documented guidance and distinct content separate 'no data yet' from 'no results for this filter'
- **Verify:** vitest "EmptyState distinguishes empty from filtered"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the EmptyState stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a EmptyState
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "EmptyState theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Definition of done

- **Given** the EmptyState story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component EmptyState
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC1 asks for "documented guidance AND distinct content", and the second half needed a mechanism
rather than a convention.** An author can write "Nothing found" for both cases, and then nothing in
the product distinguishes them. Two things now do:

- `reason` is required and closed, and reaches the DOM as `data-reason` plus a modifier class - so
  the distinction survives whatever copy the author writes, and a test can read it.
- **`action` is REQUIRED on `filtered` and optional on `empty`**, enforced by the type. A filtered
  empty state with no way out is a dead end: the records exist and the only route back is
  remembering which filter was set. An empty list with no create button is merely uneventful,
  because the data may legitimately arrive from elsewhere. This asymmetry is the criterion's
  "distinct content" made structural.

The documentation half is the docs page's table of what to write per case, and the verification
record states plainly what the type CANNOT enforce: that the title distinguishes the two. "Nothing
found" is accurate for both and useful for neither.

**AC3 and AC4 corrected as in Badge, Tag and Alert** - a jsdom matrix cannot see a visual baseline,
and `file index.tsx` proves none of the artefacts AC4 lists. Fourth instance; the pattern is the
epic's grooming, not any one story's.

**`role="status"`, not `alert`.** The state usually appears in response to a filter change the user
made without looking at this region, so it must announce - but it is also already the thing they
are looking at, so interrupting mid-sentence would be shouting about the obvious.

## Scope

### In Scope

- EmptyState

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
