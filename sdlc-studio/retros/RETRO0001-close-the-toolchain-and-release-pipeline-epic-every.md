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

- **BG-01M0MFMZ** (Critical, 8) - the peer guard's structural fix. Defeated seven times, each a different root cause; a reviewer's conclusion was that another oracle rewrite will not close it.
- **CR-01M0MK20** (8) - build output cannot express the server/client classification. Must land before the first client component publishes.
- **CR-01M0HWDQ** (CSS Modules), **CR-01M0J0Z6** (tier 2 families) - untriaged.
- **27 waived contrast pairings**, high-water-marked, bound to US-01M0GMAE.
- **Six stories at Review with no non-author verdict.** The two-role gate is unsatisfied for the entire epic.
- **Neither workflow has ever executed.** There is no remote. CI and release are authored and guarded, not proven.


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

- Triage **CR-01M0MK20** before any F01 component story starts - the output shape is cheapest to change now, while nothing is published.
- Get a non-author verdict on the six Review stories, or the epic cannot close.
- Decide the fate of **BG-01M0MFMZ** - it is Critical and has resisted seven fixes.
- Push to a remote so CI and release stop being untested assertions.


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

