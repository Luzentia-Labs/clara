# US-01M0GMN0: F00 foundations pass: decide the visual language

> **Status:** Done
> **Plan:** PL-01M0KF4N
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** design/foundations.md, scripts/check-foundations.mjs
> **Points:** 8

> **DIRECTION DECIDED 2026-08-22 (D0036).** The operator took the Idris seat's leanings in full:
> slightly warm neutral, indigo accent, OKLCH, subtle 4px radius, and per-intent `fg-on-emphasis`
> for the hard case. `design/foundations.md` records 5 of 10 deliverables Decided, 4 Provisional
> under D0035, 1 Partial pending the tier 2 families. Tier 1 values are landed and every declared
> pairing passes.
>
> **AC3 closed (D0037, consulted via the Idris seat):** compact floors are 4px vertical / 8px
> horizontal internal padding, and 4px between adjacent interactive targets - a 28px pitch that
> clears WCAG 2.2 SC 2.5.8. Derived from the PRD's own control height and body size, and recorded as
> consulted rather than signed off, so it is reversible.
>
> **This story is a DESIGN DECISION, not an implementation task.** Its ten deliverables - neutral
> ramp temperature, accent hue, colour space, radius character, border weight, elevation, focus
> spec, type scale, motion, pairing table - are choices about what Clara looks like. The PRD names
> **Idris Vale** (ux) as the deciding seat and **Daniel Achebe** as evaluator. An agent choosing
> them means Clara's visual identity was picked by an LLM inside a build story.
>
> `PL-01M0KF4N` splits it: **Phase 1 (the contrast gate) is buildable now with no design input** and
> de-risks the rest, because the PRD's known-hard pairing (amber `bg-warning-emphasis`, PRD:1207)
> eliminates candidate palettes and should surface on day 0 rather than day 5. **Phase 2 is fenced
> for Idris and the operator.**

## User Story

**As a** Maintainer
**I want** Clara's visual identity decided inside a fixed five-day box
**So that** F01 has real values to build on and the pass cannot become the project

## Context

### Persona Reference

**Idris Vale** - decides inclusive design.
[Full persona details](../personas/seats/idris-vale.md)

### Background

Every component inherits the visual language, so deciding it late means deciding it forty times.
F00 is a time-boxed pass that fixes it once, with a hard cap: component work begins on day 5
whether or not every value feels finished (D0035). A Provisional value is still a real token - the
box exists so the pass cannot become the project.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0035 | Timebox | 5 working days, calendar-called, no judgement | AC4 |
| D0035 clause 1 | Scope | A Provisional value is still a real tier 1 token | AC2 |
| D0035 clause 2 | Contrast | Nothing ships with a failing pairing | AC1 |
| PRD:204 | Record | Every deliverable is recorded in design/foundations.md | AC1 |
| D0037 | Density | The compact floors are numbers, derived not chosen | AC3 |

## Acceptance Criteria

### AC1: Every deliverable is recorded

- **Given** the five-day window
- **When** the pass ends
- **Then** neutral ramp and temperature, accent hue, colour space, radius character, border weight, elevation expression, two-part focus spec, type scale, motion, and the pairing table are all in `design/foundations.md`
- **Verify:** shell node scripts/check-foundations.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: Values are token-ready

- **Given** the recorded decisions
- **When** F01 begins
- **Then** every value is expressed as a tier 1 token
- **Verify:** shell node scripts/check-foundations.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: Compact floors are fixed

- **Given** compact density
- **When** the pass ends
- **Then** a minimum internal padding and a minimum adjacent-target spacing are stated, not only the 24x24 target floor
- **Verify:** shell node scripts/check-foundations.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC4: The box holds

- **Given** day six
- **When** the pass is not satisfied
- **Then** component work begins regardless (D0004)
- **Verify:** manual The box held: F00 was time-boxed to 5 working days from 2026-08-21 (D0035). Component work began on 2026-08-23 with Box, Button, Heading, Text and the theming providers built, inside the box. Two deliverables (elevation, motion) remain Provisional under D0035 clause 1, which is exactly what the clause is for - they are consumed by components, so F01 is where they stop being guesses.
- **Verified:** yes (2026-08-23)
- **Verification target:** conversational

> **Three verifiers were replaced.** As authored, AC1 ran `file design/foundations.md` (passes on an
> empty file), AC2 grepped for `"clara-"` and AC3 for the phrase `"minimum internal padding"`. They
> were weak, and they were also brittle: AC2 and AC3 both went red the moment the document was
> reworded, while the content they claimed to check had just been added. A verifier that fails when
> the work is done and passes when it is not is worse than none. `check-foundations.mjs` asserts all
> ten deliverables carry a status, that colour values are real hex (69 of them), that the density
> floors are numbers with units, and that every Provisional value carries a revisit condition
> (D0035 clause 1). Seventh instance of this pattern in the project.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- F00 foundations pass: decide the visual language

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A deliverable is left undecided at day 5 | Recorded Provisional WITH a revisit condition - the gate fails on one without |
| A colour value is described in prose | Fails - the gate requires real hex values that exist in the build |
| A density floor is written as a word | Fails - the floors must be numbers |
| A pairing fails contrast | Never ships (clause 2), regardless of the timebox |
| The pass overruns | Component work starts anyway - that is what the box is |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] All ten deliverables carry a status
- [ ] Every Provisional one carries a revisit condition
- [ ] Colour values are real hexes that exist in the built tokens
- [ ] Density floors are numbers
- [ ] No pairing ships failing

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Completes | Made three deliverables real | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| None | - | This is the first thing that happens |

## Estimation

**Points:** 8
**Complexity:** High, and mostly judgement rather than code - which is why it is time-boxed.

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

*Reversal is `git revert`.* The values are tier 1 and tier 2; the tier 2 half is permanent once published.

## Open Questions

None.

**Honest limit:** elevation and motion remain Provisional. Both are consumed by components rather
than by the token layer, so a value chosen now would be chosen without the thing that uses it -
which is what D0035 clause 1 exists to permit.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Planned as PL-01M0KF4N. Held at Draft: the value decisions belong to Idris + operator, not an agent. Phase 1 (contrast gate) is unblocked and implementable. Three of four verifiers flagged weak - the sixth instance in this project. |
| 2026-08-22 | sdlc-studio | Phase 1 of PL-01M0KF4N delivered: `check-contrast.mjs` is the 12th guard, proven able to fail. D0035 makes it load-bearing - F00 cannot close on a failing table. Story stays Draft: the ten value decisions are Idris + operator, options in `design/f00-options.md`. |
| 2026-08-22 | operator + sdlc-studio | Direction decided (D0036) and tier 1 landed. 6 ramps x 11 OKLCH steps, radius/space/type/duration scales, two-part focus indicator measured across all 6 enumerated surfaces. 3 candidate pairings failed first measurement and the values changed. Declared pairings 3 -> 8, all passing. AC3 (compact floors) still needs a number. |
