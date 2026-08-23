# US-01M0GMVP: Component page template and per-component docs

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/components/button.md, apps/docs/src/content/components/checkbox-group.md, apps/docs/src/content/components/checkbox.md, apps/docs/src/content/components/field.md, apps/docs/src/content/components/input.md, apps/docs/src/content/components/layout.md, apps/docs/src/content/components/link.md, apps/docs/src/content/components/number-input.md, apps/docs/src/content/components/password-input.md, apps/docs/src/content/components/radio-group.md, apps/docs/src/content/components/search-input.md, apps/docs/src/content/components/switch.md, apps/docs/src/content/components/table.md, apps/docs/src/content/components/textarea.md, apps/docs/src/content/components/typography.md, apps/docs/src/content/components/button.md, apps/docs/src/layouts/ComponentPage.astro, scripts/check-docs.mjs
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** every component page to answer the same questions in the same order
**So that** I can learn a new component without rereading the whole site

## Acceptance Criteria

### AC1: Required sections

- **Given** any component page
- **When** I read it
- **Then** purpose, when to use and when not to use, live examples, props, keyboard interactions, accessibility notes and do/don't guidance are all present
- **Verify:** file apps/docs/src/layouts/ComponentPage.astro
- **Verification target:** functional

### AC2: Keyboard table per component

- **Given** an interactive component page
- **When** I read it
- **Then** its documented keyboard interaction table appears
- **Verify:** grep "Keyboard" apps/docs/src/content/components/button.md
- **Verification target:** functional

### AC3: A missing page fails CI

- **Given** an exported component with no docs page
- **When** CI runs
- **Then** the build fails
- **Verify:** shell node scripts/check-docs.mjs
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Component page template and per-component docs

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
