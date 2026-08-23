# US-01M0GMP0: Reference app scaffold consuming the published tarball

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKV1
> **Serves:** Sofia Marchetti
> **Affects:** apps/reference-app, apps/reference-app/package.json, apps/reference-app/FINDINGS.md, apps/reference-app/package.json
> **Points:** 3

## User Story

**As a** Maintainer
**I want** a real application that installs Clara the way a consumer would
**So that** the integration proof exercises what consumers actually receive, not workspace source

## Acceptance Criteria

### AC1: Installs from tarball

- **Given** the reference app
- **When** it installs Clara
- **Then** it consumes the packed tarball, not a workspace link
- **Verify:** grep "file:.*tgz" apps/reference-app/package.json
- **Verification target:** functional

### AC2: Builds clean

- **Given** the reference app
- **When** it builds
- **Then** the build succeeds with no hydration warnings
- **Verify:** shell cd apps/reference-app && pnpm build
- **Verification target:** functional

### AC3: Findings log exists

- **Given** the app
- **When** development begins
- **Then** `FINDINGS.md` exists to record every escape hatch the app needs
- **Verify:** file apps/reference-app/FINDINGS.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Reference app scaffold consuming the published tarball

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
