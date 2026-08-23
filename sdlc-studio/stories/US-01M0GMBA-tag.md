# US-01M0GMBA: Tag

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Tag/**, packages/react/src/components/Tag/index.tsx
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a label chip whose intent is readable without colour
**So that** tags remain scannable in a dense list and for colour-blind users

## Acceptance Criteria

### AC1: Intent is not colour alone

- **Given** a Tag with an intent
- **When** it renders
- **Then** a mark, icon or text label accompanies the colour
- **Verify:** vitest "Tag intent is not colour alone"
- **Verification target:** functional

### AC2: Removable tags are labelled

- **Given** a removable Tag
- **When** a keyboard user reaches the remove control
- **Then** it is focusable and labelled with the value it removes
- **Verify:** vitest "Tag remove control names its value"
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Tag stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Tag
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "Tag theme and density matrix"
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Tag story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/Tag/index.tsx
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Tag

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
