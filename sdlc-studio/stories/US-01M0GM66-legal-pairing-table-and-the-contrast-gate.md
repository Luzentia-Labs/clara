# US-01M0GM66: Legal pairing table and the contrast gate

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/tokens/dist/tokens.pairings.json, packages/tokens/src/pairings.json, packages/tokens/test/contrast.test.ts
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** an enumerated pairing matrix that the contrast test iterates
**So that** the claim that every pairing meets AA is quantified over a set that actually exists

## Context

### Persona Reference

**Mira Calderon** - proves accessibility rather than assuming it.
[Full persona details](../personas/seats/mira-calderon.md)

### Background

F02 promises that every semantic colour pairing meets WCAG 2.2 AA in both modes. That is a claim
quantified over a set, and until this story the set was not enumerated - so the claim was
unfalsifiable. PRD Section 7 is that set; this is the gate that measures it.

The cheapest way to make a red contrast gate green is to delete the failing row, which is why the
required list is committed separately from the generated one and the row count is asserted.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| PRD Section 7 | Contrast | 4.5:1 text, 3:1 non-text; disabled at a Clara 3:1 floor | AC2 |
| PRD Section 7 | Coverage | The row count matches the documented table | AC4 |
| PRD F02 | Themes | Every pairing holds in BOTH themes | AC3 |
| D0054 | Focus | The two-part indicator replaces the direct ring-on-emphasis rows | AC1 |

## Acceptance Criteria

### AC1: Matrix is generated

- **Given** the token build
- **When** it completes
- **Then** `tokens.pairings.json` contains every pairing documented in PRD Section 7
- **Verify:** shell node scripts/check-contrast.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Thresholds are per role

- **Given** the contrast test
- **When** it runs
- **Then** 4.5:1 for text, 3:1 for large text, 3:1 for borders, icons, control boundaries and the focus indicator
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/pairings.test.ts -t "contrast thresholds per role"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Both themes are covered

- **Given** the matrix
- **When** the test runs
- **Then** every pairing is asserted in light and dark
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/pairings.test.ts -t "contrast in both themes"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Row count is asserted

- **Given** the generator
- **When** a pairing is silently dropped
- **Then** the test fails on the count mismatch rather than passing vacuously
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/pairings.test.ts -t "pairing row count"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Legal pairing table and the contrast gate

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
| A failing row is deleted to green the gate | Fails - `declaredLock` pins every declared pair and may only grow |
| The waiver count is edited upward | Fails - capped by a committed high-water mark |
| A pairing is declared but its token stops existing | Fails - names resolve against the built graph |
| The same colour pair appears under two roles | Merged to one row at the stricter threshold, so the count stays unambiguous |
| A theme stops being emitted | Caught - the themes must resolve to genuinely different colours |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] Every declared pairing meets its threshold in light
- [ ] Every declared pairing meets its threshold in dark
- [ ] The declared count equals the committed contract's count
- [ ] Every required pairing is declared, by emitted token name
- [ ] Thresholds are 4.5 text / 3 non-text, per role not per name
- [ ] The waiver is zero and at or below its high-water mark
- [ ] The two themes resolve to genuinely different colours

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocked by (resolved) | The tier 2 tokens | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `scripts/lib/wcag.mjs` | Measurement | Verified against published reference values |
| US-01M0GMAE | Blocked by (resolved) | The tokens the pairings name | Done |

## Estimation

**Points:** 5
**Complexity:** Medium. The measurement is arithmetic; the difficulty is making the gate impossible to green by deletion.

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

*Reversal is `git revert`.* The contract file is committed separately from the generated table on purpose, so reverting the palette cannot quietly revert what the palette is required to meet.

## Open Questions

None.

**Honest limit:** contrast is measured on RESOLVED token values, not on rendered pixels. Opacity,
overlays and background images can all change what a user actually sees, and none of that is in
scope here - it belongs with the components that introduce it.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
