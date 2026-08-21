# US-01M0GMAE: Semantic token layer

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** @luzentialabs/clara-tokens, packages/tokens/dist/tokens.css, packages/tokens/src/semantic/*.json
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** tier 2 to name every family the component set actually needs
**So that** no component has to reach for a token that does not exist

## Acceptance Criteria

### AC1: Core families exist

- **Given** tier 2
- **When** I read the semantic set
- **Then** fg, bg and border are defined across neutral, accent, and the four status intents
- **Verify:** grep "color-bg-accent-emphasis" packages/tokens/dist/tokens.css
- **Verification target:** functional

### AC2: The four missing families exist

- **Given** tier 2
- **When** I read the semantic set
- **Then** accent, selected (bg and border), fg-readonly, and focus ring plus offset are all present
- **Verify:** grep "color-fg-readonly" packages/tokens/dist/tokens.css
- **Verification target:** functional

### AC3: No dangling reference

- **Given** every component and tier 3 token
- **When** the build runs
- **Then** nothing references a semantic token that tier 2 does not define
- **Verify:** shell pnpm --filter @luzentialabs/clara-tokens build
- **Verification target:** functional

### AC4: Row precedence is defined

- **Given** a table row that is striped, hovered, selected and focused at once
- **When** it renders
- **Then** resolution is focus > selected > hover > striped, with selected and hover composing
- **Verify:** vitest "row surface precedence"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Semantic token layer

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
