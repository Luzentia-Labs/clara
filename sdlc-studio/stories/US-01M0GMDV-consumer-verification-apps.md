# US-01M0GMDV: Consumer verification apps

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/ci.yml, apps/verify-next, apps/verify-vite
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** fresh Vite and Next.js apps that build from the published tarball
**So that** the only real test of a package is a consumer, and everything else tests the source

## Acceptance Criteria

### AC1: Vite app builds from tarball

- **Given** a packed tarball
- **When** the Vite app installs and builds
- **Then** the build succeeds
- **Verify:** shell cd apps/verify-vite && pnpm build
- **Verification target:** functional

### AC2: Next.js App Router builds clean

- **Given** the same tarball
- **When** the Next.js app builds
- **Then** it succeeds with zero hydration warnings
- **Verify:** shell cd apps/verify-next && pnpm build
- **Verification target:** functional

### AC3: The check is wired to CI

- **Given** the pipeline
- **When** a PR runs
- **Then** consumer verification is one of the blocking gates
- **Verify:** grep "verify-next" .github/workflows/ci.yml
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Consumer verification apps

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
