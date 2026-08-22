# PL-01M0KF4N: F00 foundations pass: decide the visual language - Implementation Plan

> **Status:** Draft
> **Created:** 2026-08-22
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GMN0](../stories/US-01M0GMN0-f00-foundations-pass-decide-the-visual-language.md)
> **Epic:** [EP-01M0GKNG: Foundations - visual identity and token system](../epics/EP-01M0GKNG-foundations-visual-identity-and-token-system.md)
> **Language:** Markdown (the decision record) + JavaScript (the contrast gate)
> **Points:** 8
> **Affects:** design/foundations.md, scripts/check-contrast.mjs, packages/tokens/src/primitive/base.json, packages/tokens/src/pairings.json

## THE SHAPE OF THIS STORY IS NOT WHAT THE BACKLOG SUGGESTS

**F00 is a design decision, not an implementation task.** Its ten deliverables are choices about
what Clara looks like: neutral ramp temperature, accent hue, ramp colour space, radius character,
border weight, elevation expression, focus specification, type scale, motion, and the pairing table.

An agent picking those means Clara's visual identity was chosen by an LLM inside a build story.
AGENTS.md is explicit that accessibility is split across two seats *on purpose* - Idris (ux) decides
inclusive design, Mira (qa) proves it - and the PRD names **Idris Vale** as the deciding seat with
**Daniel Achebe** evaluating. Neither is me.

So this plan splits the story along the only line that matters:

| Half | Who | State |
| --- | --- | --- |
| **The values** - all ten deliverables | Idris + operator | **Cannot be delegated.** Not attempted here. |
| **The gate that judges them** - the contrast verifier, the schema, the tier-1 shape | Implementable now | Planned in full below |

**The useful inversion: build the gate first.** The pairing table is ~28 pairings with per-role
thresholds, and it is the part of F00 that is machine-checkable rather than aesthetic. A verifier
that scores any candidate palette against it turns the design pass from "does this look right" into
"does this pass, and if not, exactly which pairing fails and by how much". That de-risks the human
half and can be built before a single colour is chosen.

---

## Acceptance Criteria Summary

| AC | Name | Verifier as written | State |
| --- | --- | --- | --- |
| AC1 | Every deliverable is recorded | `file design/foundations.md` | **Weak** - passes on an empty file |
| AC2 | Values are token-ready | `grep "clara-" design/foundations.md` | **Weak** - one occurrence anywhere passes |
| AC3 | Compact floors are fixed | `grep "minimum internal padding"` | **Weak** - the phrase, not a value |
| AC4 | The box holds | `manual confirm component work started` | Correct - a schedule fact, honestly manual |

**Three of four verifiers test for the presence of a string.** This is the sixth instance of the
pattern in this project (PL-01M0HRA0 AC3, PL-01M0HVR8 AC3, PL-01M0HXNX AC6, three in PL-01M0HZ74,
PL-01M0J6TB AC8). AC1 is the worst of the six: it gates a ten-deliverable design pass on a file
existing.

**Replace all three** with `scripts/check-foundations.mjs`, which parses `design/foundations.md` and
asserts each of the ten deliverables is present, non-empty, and - where the deliverable is a value
rather than prose - that the value parses. AC3 asserts a *number* with a unit, not the phrase.

AC4 stays manual and stays `Verify: manual ...`, never hand-stamped (AGENTS.md).

---

## Specification delta (engagement floor)

| # | Interaction | Resolution |
| --- | --- | --- |
| 1 | **D0004: 5 working days, component work starts day 6 regardless** | The timebox is the point of the story - the ux seat asked to be capped rather than trusted. The plan must define what "unsatisfied but shipped" looks like, or day 6 arrives with no rule. See "When the box expires" below. |
| 2 | **PRD Section 7 pairing table** - ~28 pairings, 4.5:1 text / 3:1 non-text | Becomes `scripts/check-contrast.mjs`. This is the acceptance test for the entire pass. |
| 3 | **PRD:1207 the hard case** - `fg-on-emphasis` on `bg-warning-emphasis`. Amber carries neither white nor near-black at 4.5:1 in every ramp. | The PRD says this is "decided deliberately in F00, not discovered during component work". The gate must therefore FAIL on it by default rather than silently rounding - a deliberate decision needs a forced choice, not a pass. |
| 4 | **PRD:1219** - `border-focus` must survive **every** emphasis surface plus F02's dark-sidebar | This is why the indicator is two-part. The gate checks ring AND offset against each enumerated surface, not the ring alone. |
| 5 | **TRD Section 6 tier 2 family enumeration** vs **CR-01M0J0Z6** | The delivered placeholder families contradict the TRD. F00 is the moment that resolves - whatever it names becomes what US-01M0GMAE builds. Close CR-01M0J0Z6 here or explicitly defer it. |
| 6 | **PRD:245** - 11-step ramps per hue, primitive tier | The tier 1 shape is fixed already; F00 supplies values into a known schema, not a new one. |
| 7 | **D0001 / `--clara-` prefix, tier gates** | Already enforced by `check-token-output` and `check-stylesheets`. F00's values inherit those gates for free. |
| 8 | **PRD:312 compact floors** | AC3. Two 24x24 targets touching satisfies the letter of the target rule and is still crowding - so a *minimum adjacent-target spacing* is required alongside the target size. Both are numbers the gate can assert. |
| 9 | **jsdom cannot compute contrast (a11y gap register, gap 3)** | This gate closes half of that gap: it proves *declared pairings*. Rendered-component contrast stays uncovered; do not let F00 be read as closing gap 3. |
| 10 | **The current token values are placeholders** | `packages/tokens/src/primitive/base.json` and `semantic/base.json` are replaced wholesale. `tokens.public.lock.json` will need a deliberate update, which is exactly the friction R4 added on purpose. |

Interactions named: 10. Resolved: 9. **Requires the operator/Idris: 1** (interaction 5's family set).

---

## Recommended Approach

**Gate first, values second.** Phase 1 is buildable today and has no dependency on any aesthetic
choice. Phases 2-3 are the design pass and belong to Idris and the operator.

This ordering is not merely convenient. The PRD's hard case (interaction 3) is a constraint that
*eliminates* candidate palettes. Discovering it on day 5 wastes the box; having the gate on day 0
means every candidate is scored the moment it is proposed.

---

## Implementation Phases

### Phase 1: The contrast gate (AGENT, no design input needed) - **DELIVERED 2026-08-22**

1. `scripts/check-contrast.mjs`: WCAG 2.x relative-luminance contrast, reading the pairing table
   from `packages/tokens/build/tokens.pairings.json` (already emitted, D0029) and the resolved
   token values from the build.
2. Per-role thresholds: 4.5:1 text, 3:1 non-text, per PRD Section 7.
3. Report **every** failing pairing with its measured ratio and its shortfall - not the first.
   A design pass needs the whole list to choose against, not one error at a time.
4. Wire into `pnpm check` as a twelfth guard.
5. Prove it fails: a deliberately low-contrast pairing must be caught. Add it to
   `prove-guards-fail.mjs`.
6. Extend `src/pairings.json` from 3 entries to the full ~28 the PRD enumerates.

### Phase 2: The decision pass (IDRIS + OPERATOR - not an agent task)

The ten deliverables, scored continuously against Phase 1's gate.

### Phase 3: Land the values (AGENT, once Phase 2 decides)

Replace the placeholder tier 1 values, update `tokens.public.lock.json` deliberately, run every
gate, resolve or defer CR-01M0J0Z6.

---

## When the box expires - SETTLED, D0035

Operator interviewed 2026-08-22. All four clauses are decided, not proposed:

1. **An undecided deliverable takes its fallback and ships** as a real tier 1 token marked
   `Provisional` with a revisit condition. F01 is never blocked by an aesthetic question.
2. **A failing contrast pairing never ships provisional.** The palette changes; the accent hue is
   the cheapest lever. **F00 does not close on a failing table.**
3. **The calendar declares the box expired** - five working days, no judgment call. This preserves
   D0004's own logic: "a deadline held by the document is the cap". An operator decision on day 5
   would reintroduce the pressure the ux seat asked to be protected from.
4. **Day 6 starts the F01 token chain only** - US-01M0GME0, US-01M0GMAE, US-01M0GM66, US-01M0GM5M.
   Components wait for the token layer they consume, so nothing is built on provisional tokens that
   then move.

**Consequence for Phase 1:** clause 2 promotes the contrast gate from useful to load-bearing. It is
now the thing that decides whether F00 can close at all, which is a second reason to build it before
the pass starts rather than during it.

---

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | An agent quietly picks the visual identity because the story looked implementable | This document. Phase 2 is fenced and named. |
| 2 | The hard case (amber) is discovered on day 5 | Phase 1 exists precisely to surface it on day 0. |
| 3 | F00 is read as closing a11y gap 3 | Interaction 9. It proves declared pairings only. |
| 4 | `tokens.public.lock.json` churn is treated as noise | It is the R4 guard working. Every add/remove is deliberate and needs a recorded decision. |
| 5 | The timebox is silently extended | AC4 is a `manual` verify, correctly. It is the operator's to answer honestly. |

---

## Definition of Done

- `check-contrast.mjs` exists, is in `pnpm check`, and is proven able to fail.
- All ten deliverables recorded, each either Decided or Provisional-with-revisit-condition.
- Every pairing in the table passes its threshold, or the palette changed until it did.
- The three weak verifiers replaced; AC4 left manual.
- CR-01M0J0Z6 resolved or explicitly deferred with a reason.

---

## Phase 1 delivery record

**Built:** `scripts/lib/wcag.mjs` (WCAG 2.x relative luminance, dependency-free and short enough to
verify against the spec), `scripts/check-contrast.mjs`, `packages/tokens/contrast-required.json`.
`pnpm check` is now **12 guards**; `prove-guards-fail.mjs` proves **15** named mutations.

**Three assertions, not one.** The obvious gate - "every declared pairing passes" - is the one that
can be gamed, and it was:

| # | Assertion | Why it is there |
| --- | --- | --- |
| 1 | Every declared pairing meets its threshold | The gate as specified. Reports **every** failure with its measured ratio and shortfall, because a design pass needs the whole list to choose against; one error at a time turns a five-day box into five one-day boxes. |
| 2 | No declared pairing may disappear | **Found by testing, not by design.** Deleting two of three declared pairings passed the first version - the cheapest way to green a red gate is to delete the failing row. `declaredLock` pins the present set. |
| 3 | The declared table covers what the PRD requires | The required list lives in a committed file the build does not write - the same reasoning as `tokens.public.lock.json`. A check whose input is authored by the thing being checked is a witness to internal consistency only. |

**The 27-pairing gap is enumerated, not implied.** PRD Section 7 requires 27 pairings; the
placeholder tier 2 families cannot express any of them (CR-01M0J0Z6). Rather than silently checking
3 and calling it a gate, `contrast-required.json` lists all 27, waives them explicitly against
**US-01M0GMAE**, and the waiver **may only shrink** - declaring fewer than 27 missing is a failure.
The banner says so out loud on every run.

**Proven able to fail**, both ways, before being trusted:

```
semantic-text-muted on semantic-surface-default: 1.87:1, needs 4.5:1 (short by 2.63)
declared pairing "semantic-text-on-accent on semantic-action-primary" has been REMOVED
```

**Measured while building it - the hard case is worse than PRD:1207 states.** No amber carries both
white and near-black at 4.5:1; the curves cross without overlapping (at `#b26a00`, 4.24 and 3.91).
This is a token TAXONOMY consequence, not a colour choice: `fg-on-emphasis` cannot remain a single
token if `bg-warning-emphasis` is amber. Options are in `design/f00-options.md` for the operator.

**Phases 2-3 remain fenced.** The value decisions belong to Idris and the operator.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-22 | operator | Timebox-expiry rule settled by interview and recorded as D0035; clause 2 makes the Phase 1 contrast gate load-bearing rather than merely useful |
| 2026-08-22 | sdlc-studio | Plan authored. **Headline: F00 is a design decision, not an implementation task** - the ten deliverables belong to Idris and the operator, and this plan does not attempt them. Phase 1 (the contrast gate) is buildable now and de-risks the human half. 10 interactions (9 resolved, 1 needs the operator), three weak verifiers flagged - the sixth instance in this project. |
| 2026-08-22 | sdlc-studio | **Phase 1 delivered.** Contrast gate built, wired as the 12th guard, and proven able to fail two ways. The 27-pairing gap is enumerated and waived against US-01M0GMAE rather than left implicit. Phases 2-3 remain fenced for Idris + operator. |
