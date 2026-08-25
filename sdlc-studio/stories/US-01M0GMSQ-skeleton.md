# US-01M0GMSQ: Skeleton

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Skeleton/**, packages/react/src/components/Skeleton/index.tsx, scripts/check-component-css.mjs
> **Points:** 1

## User Story

**As a** Grace Adeyemi
**I want** loading placeholders that do not spam a screen reader
**So that** a loading list announces once rather than forty times

## Acceptance Criteria

### AC1: Hidden from AT

- **Given** a set of Skeletons
- **When** they render
- **Then** each is aria-hidden and the loading state is announced once at the container level
- **Verify:** vitest "Skeleton container announces once"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Token-only styling

- **Given** the Skeleton stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Both themes and densities

- **Given** a Skeleton
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Skeleton theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Definition of done

- **Given** the Skeleton story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Skeleton
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC1 requires a container, so the story ships two exports.** "Each is aria-hidden AND the loading
state is announced once at the container level" cannot be satisfied by a placeholder alone -
something has to do the announcing. `SkeletonGroup` is that container, named for the
`CheckboxGroup` / `RadioGroup` precedent already in the codebase.

`Skeleton` has **no `label` prop and no aria override**, deliberately. Forty announcements is the
defect this story exists to prevent - it is the user story verbatim - so the API does not offer the
shape that causes it. That is the same move Badge's required `countLabel` and Tag's string
`children` make: put the constraint in the type rather than in a docs warning.

**No motion, and that is a ruling rather than an omission (D0100).** Spinner's story carries an
explicit reduced-motion criterion and this one carries none, in a document written before anyone
asked the question - which the UX seat read as evidence that stillness was always the intent. A
skeleton's information is its SHAPE; a shimmer adds nothing the shape has not said. `.clara-skeleton`
is in `check-component-css.mjs`'s NO_MOTION contract so it cannot be added back silently, and the
diagnostic names D0100 rather than Modal's D0094 - sending a reader to the wrong decision record is
its own defect.

**AC3 and AC4 corrected as in every other story in this epic** - a jsdom matrix cannot see a visual
baseline, and `file index.tsx` proves none of the artefacts AC4 lists.

**Named as a gap rather than solved:** nothing announces when the placeholders are REPLACED, which
is the moment the user is actually waiting for. It belongs to whoever performs the swap and Clara
cannot do it for them, so it is stated in the verification record and the docs page instead of being
left for someone to discover.

## Scope

### In Scope

- Skeleton

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 1 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
