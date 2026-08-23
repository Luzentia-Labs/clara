# US-01M0GMC6: Density modes with computed geometry assertions

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/tokens/src/themes/compact.json, packages/tokens/src/semantic/geometry.json, packages/tokens/src/__tests__/density.test.ts, packages/tokens/style-dictionary.config.js
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** comfortable and compact density with floors that are computed rather than eyeballed
**So that** density never degrades into crowding, and a wrong value cannot pass by being unchanged

## Context

### Persona Reference

**Idris Vale** - decides inclusive design.
[Full persona details](../personas/seats/idris-vale.md)

### Background

An ERP screen is dense by necessity, and density is where accessibility floors get quietly
traded away. D0037 fixed the numbers by DERIVING them from the PRD's own control height and body
size, so the arithmetic is checkable rather than a matter of taste.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0037 | Density | 4px/8px internal padding, 4px adjacent-target spacing at compact | AC4 |
| PRD:164 | Targets | Interactive targets at or above 24x24 regardless of density | AC2 |
| WCAG 2.2 SC 2.5.8 | Spacing | 24px target + 4px gap = 28px pitch clears the exception | AC2 |
| TRD ADR-006 | Scope | Density scopes to a subtree, not the document | AC5 |

## Acceptance Criteria

### AC1: Control heights

- **Given** each density
- **When** a control renders
- **Then** comfortable is 40px and compact is 32px, asserted by computed style
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "control heights per density"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Target size floor

- **Given** compact density
- **When** any interactive target renders
- **Then** its bounding box is at least 24x24px
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "target size floor in compact"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Type floor

- **Given** either density
- **When** body text renders
- **Then** it is at least 14px; nothing renders below 12px and 12px is metadata only
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "type floor holds"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Padding and spacing floors

- **Given** compact density
- **When** adjacent interactive targets render
- **Then** the minimum internal padding and adjacent-target spacing fixed in F00 both hold
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "D0037"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: Scoped density

- **Given** a ClaraScope with compact density
- **When** it renders inside a comfortable page
- **Then** only the scoped subtree and its portals are compact
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/density.test.ts -t "density scopes to subtree"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Density modes with computed geometry assertions

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
| Compact resolves to the same numbers as comfortable | Fails - compact must be measurably denser, not merely different |
| A compact override names a token the base does not define | Fails - a token existing at one density only is how a component loses its spacing |
| Body type shrinks at compact | Fails - density changes spacing, never legibility |
| Density is applied at `:root` only | Fails - a subtree must be able to be compact inside a comfortable page |
| A target falls under 24px at compact | Fails - the floor holds regardless of density |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] Compact padding and adjacent spacing match D0037 exactly
- [ ] Target + gap clears the 2.5.8 pitch at both densities
- [ ] The control still holds its text at compact
- [ ] Compact is measurably denser than comfortable
- [ ] Compact overrides only tokens the base defines
- [ ] The body type step is unchanged by density
- [ ] Density is attribute-scoped, not root-only

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocked by (resolved) | The tier 2 layer | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| US-01M0GMAE | Blocked by (resolved) | The semantic geometry density overrides | Done |

## Estimation

**Points:** 5
**Complexity:** Medium. The numbers were already decided; the work is making them checkable and scoped.

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

*Reversal is `git revert`.* The density tokens are tier 2 and therefore permanent once published.

## Open Questions

None.

**Honest limit:** the geometry is asserted on token VALUES, not on rendered layout. A component that
ignores its own spacing tokens would still pass - that belongs with the component.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
