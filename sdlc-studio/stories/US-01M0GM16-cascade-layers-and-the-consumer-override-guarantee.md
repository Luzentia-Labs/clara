# US-01M0GM16: Cascade layers and the consumer override guarantee

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** apps/verify-next, packages/react/dist/styles.css, packages/react/src/styles/layers.css
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** all Clara CSS emitted inside named cascade layers
**So that** a consumer's own class beats a component style with no !important and no specificity contest

## Acceptance Criteria

### AC1: Layers are declared

- **Given** the built stylesheet
- **When** I read its first rule
- **Then** `@layer clara.reset, clara.tokens, clara.components;` precedes every rule
- **Verify:** grep "@layer clara.reset, clara.tokens, clara.components" packages/react/dist/styles.css
- **Verification target:** functional

### AC2: A consumer class wins

- **Given** the Next.js verification app
- **When** a consumer class targets a Clara component
- **Then** the consumer style applies without `!important`
- **Verify:** vitest "consumer class overrides component style"
- **Verification target:** functional

### AC3: Retrofit is impossible later

- **Given** the decision record
- **When** anyone proposes deferring layers
- **Then** D0005 records that adding them post-1.0 silently changes every existing override
- **Verify:** manual read D0005 in decisions.md
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Cascade layers and the consumer override guarantee

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
