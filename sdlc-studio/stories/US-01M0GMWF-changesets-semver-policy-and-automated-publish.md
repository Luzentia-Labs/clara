# US-01M0GMWF: Changesets, semver policy, and automated publish

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .changeset/, .github/workflows/release.yml, @changesets/cli, CONTRIBUTING.md
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** releases driven by changesets with provenance attestation
**So that** consumers can verify where a package came from and know what an upgrade will do

## Acceptance Criteria

### AC1: Changeset flow works

- **Given** a package change
- **When** I add a changeset and run version
- **Then** the version and changelog update correctly
- **Verify:** shell npx --yes @changesets/cli status
- **Verification target:** functional

### AC2: Breaking-change policy is written

- **Given** the repo
- **When** I look for the policy
- **Then** the definition of breaking, the deprecation policy, and the v1.0 entry criteria and 1.x support window are documented (D0025)
- **Verify:** file CONTRIBUTING.md
- **Verification target:** functional

### AC3: Publish is CI-only with provenance

- **Given** the release workflow
- **When** a release runs
- **Then** it publishes only from main on a green gate, with npm provenance enabled
- **Verify:** grep "provenance" .github/workflows/release.yml
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Changesets, semver policy, and automated publish

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
