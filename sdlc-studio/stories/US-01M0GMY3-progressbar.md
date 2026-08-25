# US-01M0GMY3: ProgressBar

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/ProgressBar/**, packages/react/src/components/ProgressBar/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** determinate and indeterminate progress with correct ARIA
**So that** I can tell how far through a long operation I am

## Acceptance Criteria

### AC1: ARIA values

- **Given** a determinate ProgressBar
- **When** it renders
- **Then** aria-valuenow, valuemin and valuemax are correct and update
- **Verify:** vitest "ProgressBar aria values"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Indeterminate mode

- **Given** an indeterminate ProgressBar
- **When** it renders
- **Then** it announces as busy without claiming a false percentage
- **Verify:** vitest "ProgressBar indeterminate mode"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the ProgressBar stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a ProgressBar
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "ProgressBar theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the ProgressBar story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component ProgressBar
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**Determinate and indeterminate are separate TYPES, not one type with a flag.** `indeterminate`
takes no `value` and `value` implies not-indeterminate, enforced by a union, so
`<ProgressBar indeterminate value={0} />` does not compile. AC2 says an indeterminate bar must not
claim a false percentage; making the two states one object with optional fields is exactly how a
false percentage gets passed.

**AC2 needed one more assertion than it asked for.** "Announces as busy without claiming a false
percentage" is satisfied by omitting `aria-valuenow` - but a quarter-width fill PARKED anywhere
reads as a percentage to a sighted user, which is the same false claim in the other channel. The
indeterminate variant therefore sets no inline width at all, and that is asserted.

**Neither AC mentioned motion, and D0100 rules on both modes.** Determinate does NOT animate and
must not transition: the fill's width is data, and a transitioned width shows a number that is not
the current value for the length of the transition while `aria-valuenow` already reports the new
one - a sighted user and a screen-reader user reading different values off one component. Asserted
in a browser as `transitionDuration === '0s'` exactly, which is what catches the 1ms transition that
looks like compliance. Mutation-checked both ways: a 1ms transition fails, and an `alternate`
direction fails with "an indeterminate bar must not reverse".

**Tier 2 gained `size.bar-thickness`, because a progress track could not be sized legally.** The
only tier 2 sizes were `control-height` and `target-min`, neither of which is a track, so the height
could only come from a SPACING token - which density re-tunes as a gap, and which
`check-component-css` now refuses. It is deliberately density-invariant: the band carries no text,
so nothing else scales with it, and thinning it in compact makes it harder to see for exactly the
user who chose compact. **This is a fifth permanent tier 2 name and the operator has ratified only
four** (D0101); it wants the same ratification before first publish.

**AC4 and AC5 corrected as in every other story in this epic.**

## Scope

### In Scope

- ProgressBar

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
