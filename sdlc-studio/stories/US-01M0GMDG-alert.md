# US-01M0GMDG: Alert

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Alert/**, packages/react/src/components/Alert/index.tsx, scripts/check-component-css.mjs
> **Points:** 3

## User Story

**As a** Grace Adeyemi
**I want** an inline banner whose meaning survives without colour
**So that** I can tell a warning from an error without distinguishing hues

## Acceptance Criteria

### AC1: Intent carries an icon

- **Given** an Alert of any intent
- **When** it renders
- **Then** an intent icon accompanies the colour so meaning is not colour-alone
- **Verify:** vitest "Alert intent is not colour alone"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Contrast holds

- **Given** each intent
- **When** it renders in both themes
- **Then** the background and foreground pair meets AA
- **Verify:** vitest "Alert intent contrast both themes"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Alert stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Alert
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Alert theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Alert story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Alert
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC1 says "an intent icon accompanies the colour" and that is only half of not-colour-alone.** An
icon is what a sighted user reads; it is `aria-hidden`, so it carries nothing in the accessibility
tree. Alert therefore carries the intent TWICE - the icon on screen, and a visually-hidden word in
the accessible name - and both are asserted separately, including that the icon IS hidden so the
intent is announced once rather than twice.

**`role` differs by intent, which no criterion asked for.** `danger` and `warning` are
`role="alert"` (assertive, interrupts); `info` and `success` are `role="status"` (waits its turn).
An error the user must act on interrupts and a confirmation does not. Asserted per intent, and
recorded in the verification record as MARKUP rather than behaviour - `getByRole` proves the
attribute, not that a screen reader actually interrupts. That is the gap the manual pass exists for.

**AC4 and AC5 corrected as in Badge and Tag** - a jsdom matrix cannot see a visual baseline, and
`file index.tsx` proves none of the five artefacts AC5 lists. Third and final instance of the same
grooming pattern in this epic.

**Alert is client-only and had no entry in `client-boundary.json` at all** - only a `special` note
about its boundary. The BUILD caught it, refusing to chunk an unclassified component, which is the
right layer: a client component that ships unmarked crashes the server render of every App Router
consumer.

**AC2 gained a stronger assertion than it asked for.** "Contrast holds" is now measured with
`contrastRatio` over the token build's own emitted pairings for both themes, and a MISSING pairing
fails rather than skips - a loop reporting success over four `undefined`s is exactly the vacuous
pass that `check:contrast`'s own row-count assertion exists to prevent. Mutation-checked: forcing
`fg-danger` to a near-background value gives `1.245 to be greater than or equal to 4.5`.

## Scope

### In Scope

- Alert

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
