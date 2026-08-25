# US-01M0GMBC: Spinner

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Spinner/**, packages/react/src/components/Spinner/index.tsx, scripts/check-component-css.mjs
> **Points:** 1

## User Story

**As a** Grace Adeyemi
**I want** a busy indicator with an accessible label
**So that** I know the system is working rather than stuck

## Acceptance Criteria

### AC1: Labelled

- **Given** a Spinner
- **When** it renders
- **Then** it carries an accessible label describing what is loading
- **Verify:** vitest "Spinner has accessible label"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Respects reduced motion

- **Given** a Spinner
- **When** prefers-reduced-motion is set
- **Then** the motion is REPLACED, not removed: the ring displaces nothing across the cycle and
  still changes over time, on the same period (D0100)
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Spinner stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Spinner
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Spinner theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Spinner story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Spinner
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC2's verifier was unsatisfiable and would have been a false green forever.** It read
`vitest "Spinner respects reduced motion"`. jsdom resolves no animation at all - `getComputedStyle`
returns nothing for it - so a Vitest test asserting a reduced-motion treatment can only ever pass
having observed nothing. D0100 names this criterion specifically and requires it re-pointed at
gate 9 before implementation, not after. It now runs `pnpm check:geometry`, which asserts in
Chromium under `page.emulateMedia({ reducedMotion: 'reduce' })` that the ring displaces nothing
across the cycle and still changes over time.

The Then-clause is also rewritten. "Animation is reduced without losing the busy indication" is the
right instinct stated too weakly to implement: D0100's rule is that where the motion IS the
information it is REPLACED, not reduced, because a spinner that stops is indistinguishable from a
system that has hung.

**AC1's label is required and not defaulted**, which no criterion asked for and the D0100 ruling
requires: no state in Clara is carried by motion alone. "Loading" is the default Clara could have
supplied, and it is exactly the word that carries no information on a screen with four regions
loading at once.

**The ring is shared with Button, not reimplemented.** D0100 is explicit that Spinner "is the same
ring, and it must be built as one implementation shared with Button rather than as a second one
that drifts". `.clara-spinner__ring` is that implementation; Button contributes only positioning.
Gate 9 measures BOTH, because a structural assertion that two components emit the same class cannot
see whether the class actually animates in each place.

**AC4 and AC5 corrected as in Badge, Tag, Alert and EmptyState** - a jsdom matrix cannot see a
visual baseline, and `file index.tsx` proves none of the artefacts AC5 lists.

## Scope

### In Scope

- Spinner

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
