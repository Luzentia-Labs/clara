# US-01M0GMMX: Public token manifest and reference gate

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/foundations/tokens.md, packages/tokens/dist/tokens.public.json, scripts/check-public-tokens.mjs
> **Points:** 2

## User Story

**As a** Sofia Marchetti
**I want** a generated manifest of exactly the public tier 2 set
**So that** the public/private boundary is machine-checkable rather than an honour system

## Acceptance Criteria

### AC1: Manifest is generated

- **Given** the build
- **When** it completes
- **Then** `tokens.public.json` contains exactly the tier 2 set and nothing else
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Docs are policed

- **Given** the docs site or a published example
- **When** it references a token outside the manifest
- **Then** CI fails
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Private tokens are documented as private

- **Given** the docs
- **When** a reader looks for tier 1 or tier 3
- **Then** they are documented as unsupported and changeable in a minor (D0007)
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Public token manifest and reference gate

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
