# US-01M0GM9N: Package builds: Vite library mode and the tokens pipeline

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** @arethetypeswrong/cli, packages/*/vite.config.ts, packages/react, packages/react/dist/index.js, packages/tokens/dist/tokens.css, packages/tokens/style-dictionary.config.js
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** each package to build to ESM and CJS with declarations
**So that** the packages are publishable at all

## Acceptance Criteria

### AC1: react and icons build via Vite

- **Given** the two component packages
- **When** I run the build
- **Then** ESM, CJS, and .d.ts are emitted with CSS Modules compiled to one stylesheet
- **Verify:** file packages/react/dist/index.js
- **Verification target:** functional

### AC2: tokens builds via Style Dictionary plus tsc

- **Given** the tokens package
- **When** I run the build
- **Then** tokens.css, themes/dark.css, tokens.ts and the JSON manifests are emitted without a Vite build (D0028)
- **Verify:** file packages/tokens/dist/tokens.css
- **Verification target:** functional

### AC3: Declarations are correct

- **Given** the built packages
- **When** I run `attw`
- **Then** types resolve correctly in every module mode with zero errors
- **Verify:** shell npx --yes @arethetypeswrong/cli --pack packages/react
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Package builds: Vite library mode and the tokens pipeline

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
