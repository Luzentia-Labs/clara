# US-01M0GME0: Token pipeline and tier enforcement

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** ./stylelint.config.js, @luzentialabs/clara-tokens, packages/tokens/dist/tokens.css, packages/tokens/dist/tokens.ts, packages/tokens/src/**
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** the three-tier token architecture compiled from JSON with the tier rules enforced at build time
**So that** the tier discipline is structural rather than a code-review habit

## Acceptance Criteria

### AC1: Three tiers compile

- **Given** the token source
- **When** I run the build
- **Then** tokens.css, tokens.ts and tokens.json are emitted from `src/{primitive,semantic,component}`
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Tier references are validated

- **Given** a tier 3 token
- **When** it references a tier 1 token directly
- **Then** the build fails
- **Verify:** shell pnpm --filter @luzentialabs/clara-tokens build
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Component CSS is policed

- **Given** a component stylesheet
- **When** it references a tier 1 token or a raw colour, spacing, or radius literal
- **Then** the lint rule fails the build
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Prefix is universal

- **Given** every emitted custom property
- **When** I scan tokens.css
- **Then** all are prefixed `--clara-` with no exceptions
- **Verify:** shell node scripts/check-token-output.mjs && node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Token pipeline and tier enforcement

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
