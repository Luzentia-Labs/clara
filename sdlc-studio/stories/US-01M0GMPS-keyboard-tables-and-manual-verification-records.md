# US-01M0GMPS: Keyboard tables and manual verification records

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKVE
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/components/*/verification.md, packages/react/src/components/Field/verification.md, packages/react/src/components/Modal/verification.md, scripts/check-verification-records.mjs
> **Points:** 5

## User Story

**As a** Maintainer
**I want** a committed verification record per component holding what was actually announced
**So that** 'testing happened' is replaced by a criterion that can be observed failing

## Acceptance Criteria

### AC1: Record exists and is current

- **Given** every exported component
- **When** the check runs
- **Then** a `verification.md` exists and is current, or the gate fails
- **Verify:** shell node scripts/check-verification-records.mjs
- **Verification target:** functional

### AC2: Announced, not expected

- **Given** each record
- **When** I read it
- **Then** it captures the strings actually announced by VoiceOver, not the strings expected
- **Verify:** grep "Announced:" packages/react/src/components/Field/verification.md
- **Verification target:** functional

### AC3: Keyboard pass per component

- **Given** every exported component
- **When** it is exported
- **Then** a manual keyboard pass is recorded, re-run on any change to focus behaviour or the keyboard table
- **Verify:** file packages/react/src/components/Modal/verification.md
- **Verification target:** functional

### AC4: Focus identity assertions

- **Given** every overlay
- **When** the suite runs
- **Then** initial focus and restoration are asserted by element identity for every dismissal route
- **Verify:** vitest "overlay focus identity assertions"
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Keyboard tables and manual verification records

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
