# US-01M0GME0: Token pipeline and tier enforcement

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** scripts/check-component-css.mjs, packages/tokens/src/component, packages/tokens/style-dictionary.config.js, packages/react/src/styles.css, ci-gates.json, scripts/check-public-tokens.mjs, scripts/check-token-output.mjs
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** the three-tier token architecture compiled from JSON with the tier rules enforced at build time
**So that** the tier discipline is structural rather than a code-review habit

## Context

### Persona Reference

**Anton Reis** - keeps the architecture honest.
[Full persona details](../personas/seats/anton-reis.md)

### Background

Three tiers are a naming convention until something enforces them. A component token reaching
straight past the semantic layer into a primitive is how that layer stops being the place a theme
is changed - and nothing in the output would look wrong.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 6 | Tiers | Tier 2 references tier 1 only; tier 3 references tier 2 only | AC2 |
| TRD Section 6 | Lint | Component CSS references tier 2 or 3 only, and no literal | AC3 |
| D0001 | Naming | `--clara-` in every tier | AC4 |
| D0007 | Visibility | Tier 2 public, tiers 1 and 3 private | AC1 |

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

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A tier 3 token references a primitive | The BUILD fails, naming both tiers - before anything is emitted |
| A tier 2 token references another tier 2 | Fails: a tier may only reference the one beneath it |
| Component CSS reads a primitive | Gate 2 fails, naming the tier it actually belongs to |
| A literal is written on the selector's own line | Caught - declarations come from PostCSS, not a line regex |
| A stylesheet reads no token at all | Fails: a gate that matched nothing has verified nothing |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] A tier 3 token referencing tier 1 fails the build
- [ ] Component CSS reading a tier 1 primitive fails gate 2
- [ ] A raw literal fails gate 2, including on the selector line
- [ ] Every emitted token carries the `--clara-` prefix
- [ ] Tier 3 never appears in the public manifest

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocked by (resolved) | The tier 2 layer | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `postcss` ^8.5 | CSS parsing | Already what Vite uses to read these files |
| US-01M0GMAE | Blocked by (resolved) | The tier 2 names tier 3 references | Done |

## Estimation

**Points:** 5
**Complexity:** Medium. The validation is small; the tier 3 layer it polices had to be built first.

> **Points** are a RELATIVE size on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20) - not
> "how long will this take" but "is this bigger than that one", sized against stories already
> delivered. The gaps widen deliberately, because uncertainty grows with size: it is much harder
> to argue a story is a 7 rather than an 8 than to choose between a 5 and an 8. A value off the
> scale is REFUSED, never rounded - the scale IS the estimate. Above 8, SPLIT the story;
> estimator consistency collapses beyond it, so a bigger number is a triage failure rather than
> a harder estimate. This is the one size vocabulary: the planner, the forecast and the measured
> velocity all read this field.

## Rollback Envelope

> Required when `affects_production_runtime: true`; optional otherwise. See `reference-story.md#rollback-envelope`.

**Affects production runtime:** false - nothing is published.

*Reversal is `git revert`.* Tier 3 is private, so its names are not permanent.

## Open Questions

None.

**Honest limit:** the lint covers `packages/react/src/**/*.css`. A style written inline in TSX, or
in a file type nobody has added yet, is outside it.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
