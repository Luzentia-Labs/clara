# US-01M0GMBA: Tag

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Tag/**, packages/react/src/components/Tag/index.tsx, scripts/check-component-css.mjs
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
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: Removable tags are labelled

- **Given** a removable Tag
- **When** a keyboard user reaches the remove control
- **Then** it is focusable and labelled with the value it removes
- **Verify:** vitest "Tag remove control names its value"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Tag stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Tag
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Tag theme and density matrix"
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Tag story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page all exist
- **Verify:** file packages/react/src/components/Tag/index.tsx
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**Tag is client-only, and the classification said server.** AC2 requires a remove control that is
focusable and named for its value, which means `onRemove` - a function prop, and TRD Section 7
makes that the boundary test. `client-boundary.json` is corrected with the reason recorded, the way
Field's reclassification was. It stays ONE component rather than splitting into a server `Tag` and
a client `RemovableTag`, because splitting moves the choice into the consumer's import statement.

**AC4 claimed a visual baseline its verifier cannot see** - a Vitest matrix runs in jsdom, which
computes no layout and resolves no custom property. Same correction as Badge's, and the same
grooming pattern across this epic.

**AC2 gained a rendered assertion it did not ask for, and should have.** "Focusable and labelled"
is satisfiable by a 6px button. The remove control is the smallest thing Clara asks anyone to hit
accurately, and it is hit while scanning a filter bar rather than while looking at it - so it is
now in gate 9's fixture and its 24x24 floor is measured in a real browser in both densities. The
stylesheet comment claiming gate 9 measures it was written first; rendering it there is what made
the claim true rather than aspirational.

`children` narrows to `string` on the removable variant. That is a deliberate API constraint rather
than an implementation limit: the remove control's name has to come from somewhere, and asking a
consumer to write the text twice is how the two drift apart.

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
