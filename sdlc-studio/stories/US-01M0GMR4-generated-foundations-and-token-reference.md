# US-01M0GMR4: Generated foundations and token reference

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/foundations/**, apps/docs/src/content/foundations/tokens.md, scripts/check-public-tokens.mjs
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** token reference pages generated from the token source
**So that** the documented values can never drift from the built ones

## Acceptance Criteria

### AC1: Generated, not hand-written

- **Given** the token pages
- **When** the site builds
- **Then** swatches and values are generated from tokens.public.json
- **Verify:** grep "tokens.public.json" apps/docs/src/content/foundations/tokens.md
- **Verification target:** functional

### AC2: Only public tokens

- **Given** the pages
- **When** the check runs
- **Then** no token outside the public manifest is referenced
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verification target:** functional

### AC3: Usage, not just value

- **Given** each token
- **When** I read its entry
- **Then** the intended usage is documented, not only the value
- **Verify:** file apps/docs/src/content/foundations/tokens.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Generated foundations and token reference

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
