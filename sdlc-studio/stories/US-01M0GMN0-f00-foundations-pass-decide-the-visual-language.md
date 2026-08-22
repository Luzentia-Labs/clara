# US-01M0GMN0: F00 foundations pass: decide the visual language

> **Status:** Draft
> **Plan:** PL-01M0KF4N
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** design/foundations.md
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
- **Verify:** manual confirm component work started on schedule
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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Planned as PL-01M0KF4N. Held at Draft: the value decisions belong to Idris + operator, not an agent. Phase 1 (contrast gate) is unblocked and implementable. Three of four verifiers flagged weak - the sixth instance in this project. |
| 2026-08-22 | sdlc-studio | Phase 1 of PL-01M0KF4N delivered: `check-contrast.mjs` is the 12th guard, proven able to fail. D0035 makes it load-bearing - F00 cannot close on a failing table. Story stays Draft: the ten value decisions are Idris + operator, options in `design/f00-options.md`. |
| 2026-08-22 | operator + sdlc-studio | Direction decided (D0036) and tier 1 landed. 6 ramps x 11 OKLCH steps, radius/space/type/duration scales, two-part focus indicator measured across all 6 enumerated surfaces. 3 candidate pairings failed first measurement and the values changed. Declared pairings 3 -> 8, all passing. AC3 (compact floors) still needs a number. |
