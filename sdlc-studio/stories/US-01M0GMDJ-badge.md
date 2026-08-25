# US-01M0GMDJ: Badge

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Badge/**, packages/react/src/components/Badge/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a count indicator whose intent is readable without colour
**So that** a hundred badges on a list screen do not become a colour puzzle

## Acceptance Criteria

### AC1: Intent is not colour alone

- **Given** a Badge with an intent
- **When** it renders
- **Then** a mark, icon or text label accompanies the colour (Tier 3 colour-alone gap)
- **Verify:** vitest "Badge intent is not colour alone"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Counts are announced

- **Given** a Badge carrying a count
- **When** a screen reader encounters it
- **Then** the count and its meaning are announced, not just the number
- **Verify:** vitest "Badge count is announced with meaning"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Badge stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Badge
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Badge theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Badge story
- **When** it is proposed for export
- **Then** a verification record, its cited tests, an axe assertion, and a docs page all exist and
  resolve
- **Verify:** shell node scripts/check-verification.mjs --component Badge
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**AC4 claimed a visual baseline that its verifier cannot see.** The Then-clause read "holds its
visual baseline in all four combinations" and the verifier is a Vitest matrix, which runs in jsdom.
jsdom computes no layout and resolves no custom property, so that test can observe that the
component rendered inside the right scope and that axe found nothing - and nothing about how it
looks. The clause now says that, and the visual baseline is named where it actually lives: gate 7,
Chromatic, US-01M0WSME, still pending. Recorded in the verification record's Stated gaps too.

**AC5's verifier was `file .../index.tsx`.** The criterion lists five artefacts - stories, tests,
an axe assertion, a visual baseline, a docs page - and the existence of `index.tsx` proves none of
them. It now runs `check-verification.mjs`, which resolves the record's cited test files, requires
the manual-pass section to state a real result or admit it is outstanding, and checks the docs page
exists. The same weakness was found and fixed in US-01M0GMZW's ACs the day before; it is a grooming
pattern across this epic rather than one story's slip.

**The visual baseline stays out of scope here**, rather than being quietly dropped: it is gate 7's,
it needs Chromatic and an operator-held token, and US-01M0WSME owns it (D0099).

## Scope

### In Scope

- Badge

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
