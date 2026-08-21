# US-01M0GM8N: Docs site scaffold, built with Clara

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/pages.yml, @luzentialabs/clara-react, apps/docs/**, apps/docs/package.json, apps/docs/src/content/index.md
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** a documentation site built with Clara itself
**So that** a visitor sees the system working before reading a word about it

## Acceptance Criteria

### AC1: Built with Clara

- **Given** the docs site
- **When** I inspect its components
- **Then** it is built from Clara components, not a separate design
- **Verify:** grep "@luzentialabs/clara-react" apps/docs/package.json
- **Verification target:** functional

### AC2: Section structure

- **Given** the site
- **When** I navigate it
- **Then** Getting Started, Principles, Foundations, Components, Patterns, Accessibility, Changelog and Contributing all exist
- **Verify:** file apps/docs/src/content/index.md
- **Verification target:** functional

### AC3: Same accessibility bar

- **Given** the docs site
- **When** the suite runs
- **Then** it passes the same axe gate as the library
- **Verify:** vitest "docs site axe clean"
- **Verification target:** functional

### AC4: Deploys on merge

- **Given** the default branch
- **When** a merge lands
- **Then** the site deploys to GitHub Pages
- **Verify:** grep "docs" .github/workflows/pages.yml
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Docs site scaffold, built with Clara

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
