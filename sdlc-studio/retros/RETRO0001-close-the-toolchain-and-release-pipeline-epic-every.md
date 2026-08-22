# RETRO-0001: Close the toolchain and release pipeline epic: every remaining story delivered and verified, so later epics inherit a green gate

> **Date:** 2026-08-22
> **Batch:** US01M0GM0R, US01M0GM16, US01M0GMDV, US01M0GMKD, US01M0GMWF, US01M0GMYH
> **Goal:** Close the toolchain and release pipeline epic: every remaining story delivered and verified, so later epics inherit a green gate.
> **Delivered:** 4 / 6   **Blocked:** 2 (both with the finding that blocked them)

## Delivered

- **US-01M0GM16** (3) - cascade layers; all Clara CSS emits inside `@layer clara.reset, clara.tokens, clara.components`
- **US-01M0GMYH** (3) - api-extractor surface report, committed; catches signature drift and Radix leaks
- **US-01M0GMKD** (8) - CI pipeline, all gates enumerated, each pending one bound to an open story
- **US-01M0GMWF** (5) - changesets, main-only publish with provenance, written semver policy


## Blocked / deferred

- **US-01M0GM0R** - the classification shipped as build input and its guard is wired and proven killable, but the directive cannot survive today. **CR-01M0MK20** (8): Vite drops module-level directives with only a warning, and a single bundled chunk has one top, so the directive is either on every component or on none - while TRD Section 7 requires it on client components AND absent from server-capable ones. The output shape has to change.
- **US-01M0GMDV** - the consumer apps have nothing to consume. Zero components means a Vite build proves an empty import and the Next.js app's whole point (hydration, directive survival) is unreachable. Descoped to F01, with gate 14 still pending and bound to the story. The packaging half was reachable and shipped as `check-pack`.


## What went well

- **Guards caught the author.** `check-release` found two gates missing from my own publish path when I wrote it, and a third (`check:client-boundary`) two stories later. Every one of those would have made a gate advisory at the one moment that cannot be undone.
- **Descoping found the bug.** US-01M0GMDV was going to be deferred wholesale. Packing the tarball first - to decide honestly whether anything was reachable - surfaced `workspace:*` shipping verbatim under `npm pack`. That fails every consumer install permanently. We are correct today only because changesets uses `pnpm publish`; nothing asserted it.
- **Vacuous passes were caught rather than banked.** Three ACs across the two blocked stories would have reported green over an empty set. They are recorded manual/BLOCKED with the reason, not stamped.
- **Autonomy held.** Four stories, one CR, two guards, one decision, zero blocking questions.


## What was hard / what stalled

- **The build/spec conflict was invisible until probed.** Nothing in the toolchain fails when `use client` is dropped - Rollup warns and moves on. It took building a throwaway probe component to see it. A warning is not a gate, and this class of defect is only found by running the thing.
- **Two stories were sized against a repo that does not exist yet.** US-01M0GM0R (3) and US-01M0GMDV (3) both assume components. Neither could reach Done at any level of effort; the estimate was wrong about dependencies, not about size.


## Lessons

- **A guard driven by its own list checks nothing.** `check-client-boundary` reads what the package EXPORTS and compares against the classification. Keyed off the list instead, it would have printed a healthy "39 classified" while an unclassified component shipped beside it. Same failure shape as the peer guard's seven defeats: the oracle must be independent of the thing it validates.
- **"Correct by accident of tool choice" is an untested invariant.** The publish path is safe because changesets happens to use pnpm. That is not a property anyone chose, wrote down, or could see. Gate it or it is luck.
- **Probe before deferring.** The cheapest way to decide whether work is reachable is to attempt the smallest real version of it. Doing so turned a wholesale defer into a shipped guard plus a permanent-consequence bug caught pre-publish.


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
| BG01M0MFMZ | not-stop-ship | Richard Dale Umayan (operator) | 2026-08-22 |
| declined: not fixed in this run - filed as CR-01M0MK20, approved, resolution decided in D0041, next run | deferred | Richard Dale Umayan (operator) | 2026-08-22 |
| CR01M0J0Z6 | deferred | Richard Dale Umayan (operator) | 2026-08-22 |
| CR01M0HWDQ | not-stop-ship | Richard Dale Umayan (operator) | 2026-08-22 |
| declined: not fixed in this run - filed as CR-01M0MND5, approved and scheduled | accepted-risk | Richard Dale Umayan (operator) | 2026-08-22 |

Two carried items have no artifact id and so are ruled here rather than in the table: the **27 waived contrast pairings** are *deferred* (high-water-marked so the count can only shrink, bound to US-01M0GMAE), and **NPM_TOKEN not being set** is *accepted-risk* (outside the agent's reach, and it fails loudly rather than silently).

**Why each ruling.** BG-01M0MFMZ is not-stop-ship because D0042 changed the approach rather than
retrying it, and nothing publishes before the consumer apps exist, so the risk window is empty.
CR-01M0MK20 and CR-01M0J0Z6 are deferred rather than stop-ship because both are approved with a
decided resolution and neither can be reached before the work they belong to - but both are
hard blockers for the thing they name: no client component may publish before MK20 lands, and no
tier 2 token may publish before J0Z6 does, because tier 2 is public API under D0007. CR-01M0HWDQ
is a coverage gap, not a defect - a CSS Module needs a consuming component to survive bundling.
CR-01M0MND5 is accepted-risk because it is permanent per published version and nothing is
published. NPM_TOKEN is accepted-risk because it is outside the agent's reach and fails loudly.


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

> **Tooling note.** Three rows below read `declined:` where the accurate disposition is *filed*.
> `retro.py`'s `ARTEFACT_ID_RE` requires four DIGITS (`(?:CR|BG|US)-?\d{4}`), but every id this
> project allocates is ULID-style (`CR-01M0MND5`), so the "filed" state is unreachable here and a
> real filing would otherwise be counted as undecided. The prose names the artifact in each case.
> Worth raising against the skill.

| Finding | Disposition |
| --- | --- |
| Substring + `.some()` matching let CI drop nine deterministic guards (C1) | fixed-in: c5a5d6a |
| A `run: \|` block scalar emptied the gate comparison with no vacuity floor (C2) | fixed-in: c5a5d6a |
| "Publish is main-only" was a string test `workflow_dispatch` satisfied (C3) | fixed-in: c5a5d6a |
| Three legal ways to make a gate advisory, none modelled (H2) | fixed-in: c5a5d6a |
| Three TRD Section 9 gates absent from the manifest (H3) | fixed-in: c5a5d6a |
| The export reader was defeated by minified output (H4) | fixed-in: c5a5d6a |
| `check-client-boundary` vacuous while printing a healthy line (H5) | fixed-in: c5a5d6a |
| Three new guards had no fail-proof at all (H6) | fixed-in: c5a5d6a |
| The api-extractor "report out of date" branch was dead code (H7) | fixed-in: c5a5d6a |
| The Radix leak check missed `asChild`, `any` and bare `string` (H8) | fixed-in: c5a5d6a |
| `release.yml` ran the size budgets and browser suite twice (M1) | fixed-in: c5a5d6a |
| The CSS brace walk was blind to strings (M3) | fixed-in: c5a5d6a |
| Gate counts disagreed three ways across four files (M4) | fixed-in: c5a5d6a |
| The publish command in a `with:` key was unguarded (M5) | fixed-in: c5a5d6a |
| `reviews/LATEST.md` stale - the post-compaction re-entry file (M6) | fixed-in: c5a5d6a |
| Two new parser libs shipped untested; the coverage gate caught it | fixed-in: 2de784e |
| `pnpm pack` exact-pins internal deps, so consumers can get duplicate token packages | declined: not fixed in this run - filed as CR-01M0MND5, approved and scheduled |
| Vite drops `"use client"`; one chunk cannot carry a per-component classification | declined: not fixed in this run - filed as CR-01M0MK20, approved, resolution decided in D0041, next run |
| The peer guard cannot be closed by another oracle rewrite | declined: D0042 changed the approach - verify in a real consumer instead of another oracle rewrite; folds into US-01M0GMDV |
| US-01M0GM16 AC2 does not test its Then (needs the Next.js app) (M2) | declined: unreachable until F01 - same blocker as US-01M0GMDV, recorded rather than papered over |
| `catalog:` protocol missing from the unresolvable list | declined: no catalogs are declared; noted in the review record for when one is |
| `.size-limit.json` measures empty entries today | declined: true of every budget until F01; not a defect in the budget |


## Close loop (gated)

`gate --require-retro RETROxxxx` (this retro's id, file form) fails until all four are true:

- [ ] this retro exists AND passes its content check - required sections, at least one real
      lesson, and every finding dispositioned (`retro.py validate --id RETROxxxx`)
- [ ] its lessons are in the project store, not just in this file (`retro.py extract --id RETROxxxx`)
- [ ] open lessons re-validated: each is closed, extended, or within its horizon (`lessons revalidate`)
- [ ] `retros/LESSONS-SUMMARY.md` regenerated from the still-valid lessons (`lessons summary`)

The next sprint reads them automatically: `sprint plan` prints the digest in the plan.

## Metrics

- Tokens: over the declared batch budget (breaker read 25% over at batch start) · Duration: one continuous run · Critic rejects: n/a (no non-author review ran)

