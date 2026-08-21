# US-01M0GMAV: Copyable examples that are proven to build

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** scripts/verify-doc-examples.mjs
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a CI job that extracts every documented example and builds it
**So that** a pasted example works, rather than being asserted to work

## Acceptance Criteria

### AC1: Extraction runs

- **Given** the docs
- **When** CI runs
- **Then** every fenced example is extracted and compiled in the verification app
- **Verify:** shell node scripts/verify-doc-examples.mjs
- **Verification target:** functional

### AC2: A broken example fails

- **Given** an example that no longer compiles
- **When** CI runs
- **Then** the build fails naming the page and the example
- **Verify:** shell node scripts/verify-doc-examples.mjs
- **Verification target:** functional

### AC3: Getting Started is externally verified

- **Given** the Getting Started page
- **When** a reader who did not write it follows it
- **Then** where they got stuck is recorded; until such an observer exists the claim is marked unverified
- **Verify:** manual record an external observer walkthrough of Getting Started
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Copyable examples that are proven to build

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
