# US-01M0GMZW: Storybook workspace with theme and density toolbars

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/pages.yml, apps/storybook/package.json, apps/storybook/.storybook/main.ts, apps/storybook/.storybook/preview.tsx
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a playground where every component can be seen in all four theme and density combinations
**So that** I can choose the right component and props before writing code

## Acceptance Criteria

### AC1: Toolbars exist

- **Given** Storybook
- **When** it loads
- **Then** global toggles switch theme and density
- **Verify:** file apps/storybook/.storybook/preview.tsx
- **Verification target:** functional

### AC2: a11y addon is on

- **Given** any story
- **When** I open the a11y panel
- **Then** axe violations are visible in the UI
- **Verify:** grep "addon-a11y" apps/storybook/.storybook/main.ts
- **Verification target:** functional

### AC3: Autodocs from types

- **Given** a component
- **When** I open its docs tab
- **Then** the props table is generated from TypeScript with TSDoc descriptions
- **Verify:** file apps/storybook/.storybook/main.ts
- **Verification target:** functional

### AC4: Static build deploys

- **Given** the default branch
- **When** a merge lands
- **Then** Storybook builds statically and deploys to GitHub Pages (D0027)
- **Verify:** grep "storybook" .github/workflows/pages.yml
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Storybook workspace with theme and density toolbars

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
