# RETRO-0002: Deliver the semantic token layer and the gates that police it: tier 2 named per the TRD, the 27 waived contrast pairings resolved to real measurements, and the public token manifest enforced

> **Date:** 2026-08-23
> **Batch:** US01M0GM66, US01M0GMAE, US01M0GMMX
> **Goal:** Deliver the semantic token layer and the gates that police it: tier 2 named per the TRD, the 27 waived contrast pairings resolved to real measurements, and the public token manifest enforced.
> **Delivered:** 3 / 3   **Blocked:** 0

## Delivered

- **US-01M0GMAE** (8) - the tier 2 semantic layer, renamed to the TRD scheme per D0044
- **US-01M0GM66** (5) - the 48-row legal pairing table and the contrast gate that measures it
- **US-01M0GMMX** (2) - the public token manifest and TRD gate 8, which polices what the docs may reference


## Blocked / deferred

None. The batch was descoped to three units at plan time and all three landed.


## What went well

- **The waiver went 27 -> 0.** Every one of the 48 pairings is measured and passing in both themes. Idris's F00 condition - contrast never ships waived - was honoured by making the palette move, not the threshold.
- **The step assignment is SOLVED, not chosen.** `generate-semantic.mjs` walks candidate ramp steps until every pairing passes. That is what turned "the palette should meet AA" from an intention into a build step, and it is why the answer is reproducible rather than a set of hand-picked hexes nobody can re-derive.
- **Two design questions were closed by measurement.** The two-part focus indicator (D0054) and whether `selected` needs its own foreground (measured at 7.43:1 worst case, so no). Both had been sitting as prose.
- **48 is exactly the count review X5 said the PRD required** - independent confirmation the table is complete rather than merely large.


## What was hard / what stalled

- **Three guards defined a tier by a hardcoded name prefix** and would have gone silently vacuous at the rename: `check-contrast` prepended `semantic-` to every required pairing, `check-token-output` called anything not spelled `semantic-` a tier 1 primitive, and the contrast threshold came from a regex over the token name - which demanded 4.5:1 of `fg-disabled` where the PRD sets 3:1. Third time this session that "infer a category from a name" has had to be undone.
- **The PRD enumerated the same colour pair twice** under two roles, which made the row count ambiguous. Merging to one row at the strictest threshold is what produced the 48.


## Lessons

- **A rename is a test of what the guards actually key on.** Every guard that survived D0044 keyed on a manifest or a declared role; every one that broke keyed on a name prefix. That is a cheap, repeatable way to find the difference.
- **"Resolvable by measurement" should be honoured literally.** US-01M0GMAE's open question said exactly that. Measuring it took one command and produced a decision with numbers attached, where an opinion would have produced another round.
- **Solve, do not choose.** A palette assembled by eye cannot be re-derived when a ramp changes. A solver can, and it fails loudly when the ramps genuinely cannot satisfy the contract - which is how the two-part focus indicator got resolved rather than waived.


## Carried lessons

The 5 that matter most for the NEXT batch, chosen now rather than ranked from the whole
store. A ranking is a fact about the past; this is a decision, re-made every retro. Bullets,
not a numbered list, and drop one for each you add (`lessons carry --displaces`).

- EXAMPLE - replace this. A mechanism that reaches no caller is inert, however well it is tested. <!-- example -->
- EXAMPLE - replace this. An absence is not an answer: an empty result and an unanswerable question are different facts. <!-- example -->
- EXAMPLE - replace this. A repair breaks its neighbours, and a rename is cross-unit coupling. <!-- example -->
- EXAMPLE - replace this. An enumerated list silently exempts what it forgot. <!-- example -->
- EXAMPLE - replace this. Verify the premise before building on it. <!-- example -->

## Known issues carried

| Issue | Ruling | Ruled by | Date |
| --- | --- | --- | --- |
| CR01M0HWDQ | deferred | Richard Dale Umayan (operator) | 2026-08-23 |

The CSS Modules path stays scheduled with F01 per D0050 - the tier 2 names it would be written
against only just settled, so writing stylesheets before now would have been rework.

Not artefact-backed, ruled here: **`NPM_TOKEN` is still unset** (*accepted-risk* - outside the
agent's reach, and it fails loudly rather than silently), and **the skill's retro parser cannot
read this project's ULID ids** (*accepted-risk* - a skill limitation, recorded in reviews/LATEST.md).


## Estimate vs actual

**Were the estimates any good?** The plan forecast a token cost per unit; telemetry recorded
what each one actually cost. This section holds the comparison, so the question is asked every
sprint instead of only when someone remembers to ask it.

Generate it: `scripts/retro.py accuracy --id RETROxxxx --write` - it fills the block below from
the batch's telemetry and appends this sprint's row to `retros/VELOCITY.md`.

A unit with no per-unit telemetry record has its PER-UNIT ratio reported as **UNMEASURED** and
excluded from that ratio - it is never counted as accurate. But the token count itself is NOT
unmeasurable: the harness tracks it deterministically. An INTERACTIVE sprint (no runner) records no
per-unit actual, so the close captures this RUN's share of the harness-tracked total itself
(`accuracy --tokens-from-harness`, run by `sprint close --apply-signoff`) and the velocity row
records it. The meter is per-SESSION and cumulative, so what is captured is the delta from the
baseline stamped when the run opened - not the session total, which in a session holding more than
one sprint counts the earlier ones again. A run with no baseline (opened before the baseline
existed, or closed from a different session) reports **not-attributable** rather than a number:
there is no fallback to the raw total, because a plausible-looking figure that is not this sprint's
cost is worse than an absent one. When the capture cannot attribute, the close states why and
`accuracy --tokens N` remains the manual override.
Report it as **not-yet-captured** only while neither has happened, never as if the number were
unknowable. That figure is DESCRIPTIVE, never a target (see CR0273).

The forecast is a hypothesis, not a settled calibration. Read the ratio, write down what it
implies, and change the constants only on evidence a human has looked at - a fit to a couple of
sprints fits noise.

<!-- accuracy:begin (generated by retro.py accuracy --write) -->
<!-- accuracy:end -->

- not measured

## Actions raised

| Finding | Disposition |
| --- | --- |
| Three guards defined a tier by a hardcoded `semantic-` name prefix | fixed-in: 9fdecbc |
| The contrast threshold came from a regex over the token name, not the declared role | fixed-in: 9fdecbc |
| PRD Section 7 enumerated one colour pair twice, making the row count ambiguous | fixed-in: 9fdecbc |
| A single focus ring cannot clear 3:1 on every emphasis surface | declined: not a defect - PRD Section 7 predicted it and left the resolution to F00; resolved as D0054 |
| `selected` may need its own foreground | declined: measured at 7.43:1 worst case, so no token is needed - recorded as a ruling on the story |
| The public-token gate could pass over zero references | fixed-in: 9fdecbc |


## Close loop (gated)

`gate --require-retro RETROxxxx` (this retro's id, file form) fails until all four are true:

- [ ] this retro exists AND passes its content check - required sections, at least one real
      lesson, and every finding dispositioned (`retro.py validate --id RETROxxxx`)
- [ ] its lessons are in the project store, not just in this file (`retro.py extract --id RETROxxxx`)
- [ ] open lessons re-validated: each is closed, extended, or within its horizon (`lessons revalidate`)
- [ ] `retros/LESSONS-SUMMARY.md` regenerated from the still-valid lessons (`lessons summary`)

The next sprint reads them automatically: `sprint plan` prints the digest in the plan.

## Metrics

- Tokens: not separately measured · Duration: one continuous run · Critic rejects: 0 (plan-review APPROVE on all three)

