# US-01M0GMYH: API surface report gate

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./api-extractor.json, packages/*/etc/*.api.md, packages/react/etc/clara-react.api.md
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a committed API surface report per package that CI diffs
**So that** an accidental public API change is caught in review rather than by a consumer on install

## Acceptance Criteria

### AC1: Report is generated and committed

- **Given** each package
- **When** I run the API extractor
- **Then** a `.api.md` is produced and committed
- **Verify:** file packages/react/etc/clara-react.api.md
- **Verification target:** functional

### AC2: An uncommitted change fails CI

- **Given** a changed public signature
- **When** CI regenerates the report
- **Then** the build fails on the diff
- **Verify:** shell pnpm api:check
- **Verification target:** functional

### AC3: Radix does not leak

- **Given** the generated report
- **When** I search it
- **Then** no type imported from `@radix-ui/*` appears (D0003, TRD ADR-004)
- **Verify:** shell ! grep -q "@radix-ui" packages/react/etc/clara-react.api.md
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- API surface report gate

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
