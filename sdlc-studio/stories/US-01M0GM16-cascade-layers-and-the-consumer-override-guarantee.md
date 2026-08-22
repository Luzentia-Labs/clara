# US-01M0GM16: Cascade layers and the consumer override guarantee

> **Status:** Review
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** apps/verify-next, packages/react/dist/styles.css, packages/react/src/styles/layers.css
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** all Clara CSS emitted inside named cascade layers
**So that** a consumer's own class beats a component style with no !important and no specificity contest

## Context

### Persona Reference

**Sofia Marchetti** - builds internal ERP screens on Clara and will need to override its styles in
ways Clara did not anticipate.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Clara ships one stylesheet per package, deliberately not tree-shaken (D0006). Under CSS Modules,
**stylesheet order decides the cascade, not attribute order** (TRD:571) - so without layers, whether
a consumer's class beats a Clara class depends on bundler ordering nobody controls, and the usual
escape is `!important`.

`@layer` fixes the order by contract instead. **It cannot be retrofitted:** adding it after release
silently changes specificity for every consumer override already written (D0005). This story exists
before the first component for that reason alone.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0005 / TRD:318 | Cascade | All Clara CSS inside `@layer clara.reset, clara.tokens, clara.components;` | AC1 - the declaration precedes every rule |
| D0006 | Delivery | One stylesheet per package, not tree-shaken | The layer block is emitted once per sheet, not per component |
| AGENTS.md | Permanence | "Cannot be retrofitted - adding it later silently changes specificity for every consumer override in existence" | AC3, and the reason this story precedes every component |
| TRD:571 | Cascade | Under CSS Modules, stylesheet ORDER decides the cascade | Why attribute order cannot be relied on |
| PRD | Security | No runtime env or network | Build-time CSS transform only |

## Acceptance Criteria

### AC1: Layers are declared

- **Given** the built stylesheet
- **When** I read its first rule
- **Then** `@layer clara.reset, clara.tokens, clara.components;` precedes every rule
- **Verify:** shell node scripts/check-stylesheets.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: A consumer class wins

- **Given** the Next.js verification app
- **When** a consumer class targets a Clara component
- **Then** the consumer style applies without `!important`
- **Verify:** shell npx vitest run test/cascade-layer.test.ts -t "an unlayered consumer rule outranks every Clara layer"
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: Retrofit is impossible later

- **Given** the decision record
- **When** anyone proposes deferring layers
- **Then** D0005 records that adding them post-1.0 silently changes every existing override
- **Verify:** manual D0005 records that adding layers post-1.0 silently changes every existing override; read 2026-08-22, present in decisions.md
- **Verification target:** conversational

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Cascade layers and the consumer override guarantee

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A stylesheet ships with no `@layer` declaration | Build fails. An unlayered sheet cannot be layered later without changing every consumer override. |
| The layer names or their ORDER change | Failure. The order IS the contract: reset loses to tokens loses to components, and anything unlayered beats them all. |
| A second `@layer` block is emitted | Failure. Two declarations mean the effective order depends on which the browser sees first. |
| A consumer writes an unlayered class | It wins, without `!important`. That is the whole guarantee - unlayered styles outrank every layer. |
| A component stylesheet is added later without the wrapper | Caught by the same guard, because it checks emitted output rather than source. |
| The tokens package emits two sheets | Both must carry the declaration - `tokens.css` and `themes/dark.css` are separate subpaths. |

> **Minimum edge cases:** 8 for API stories, 5 for others - not an API story; 6 recorded.

## Test Scenarios

- [ ] Every emitted stylesheet begins with the layer declaration
- [ ] The declaration names exactly `clara.reset, clara.tokens, clara.components`, in that order
- [ ] No stylesheet carries two declarations
- [ ] An unlayered consumer class overrides a Clara component class with no `!important`
- [ ] Removing the declaration from any sheet fails the build
- [ ] Reordering the layer names fails the build
- [ ] Component rules sit inside `clara.components`, not at the top level
- [ ] D0005 records why deferral is not available

> **Minimum test scenarios:** 10 for API stories, 8 for UI - 8 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM9N](US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md) | Blocks (satisfied) | A build that emits stylesheets | Review |
| [US-01M0GM69](US-01M0GM69-button.md) | **Blocked by this** | The first component CSS must be emitted inside the layer from its first line | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| Vite CSS pipeline | Build | Present |
| Style Dictionary `css/variables` format | Build | Present |

## Estimation

**Points:** 3
**Complexity:** Low to build, high to get wrong. The transform is a few lines; the cost of omitting
it is unbounded and unrecoverable after release.

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

**Affects production runtime:** false - nothing is published yet.

*Reversal is `git revert` today.* After first publish it is **not reversible**: removing or
reordering layers changes the resolved style of every consumer override written against them.

## Open Questions

None. The layer names and their order are fixed by D0005 and TRD:318; this story implements them
rather than choosing them.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Delivered in RUN-01M0MFXJ. `scripts/lib/cascade-layer.mjs` wraps every emitted stylesheet; applied in `finalize-dual` (the step every package runs last) after a Vite plugin proved to run BEFORE Vite's own CSS emit and silently did nothing. `check-stylesheets` now enforces the contract - missing declaration, wrong order, duplicate declaration, and rules outside any layer all fail. 7 tests. AC3 is a genuine manual read, stamped with its date. |
