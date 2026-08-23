# US-01M0GMYZ: Icon pipeline and the enumerated v1 icon set

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKGS
> **Serves:** Sofia Marchetti
> **Affects:** packages/icons/**, packages/icons/ICONS.md, scripts/check-icons.mjs
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** a generated icon set from SVG source with a committed, counted list
**So that** the set is a specification rather than a promise to add icons as needed

## Acceptance Criteria

### AC1: List is enumerated

- **Given** the repo
- **When** I look for the icon list
- **Then** `packages/icons/ICONS.md` names all 48 icons by category, committed before implementation
- **Verify:** shell node scripts/check-icons.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: List and exports agree

- **Given** the built package
- **When** CI runs
- **Then** an exported icon absent from the list, or a listed icon unexported, fails the build
- **Verify:** shell node scripts/check-icons.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Icons inherit colour and size

- **Given** an icon
- **When** it renders inside text
- **Then** it uses currentColor and scales from font size, with a size prop override
- **Verify:** shell npx vitest run packages/icons/src/__tests__/icons.test.tsx -t "icon inherits currentColor and size"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Decorative by default

- **Given** an icon with no aria-label
- **When** it renders
- **Then** it is aria-hidden and treated as decorative
- **Verify:** shell npx vitest run packages/icons/src/__tests__/icons.test.tsx -t "icon without label is aria-hidden"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Import cost

- **Given** a single icon import
- **When** the bundle is measured
- **Then** it adds no more than 1KB gzipped
- **Verify:** shell pnpm size
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Icon pipeline and the enumerated v1 icon set

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
