# BG-01M0XX4V: AC5's verifier runs at 96% of the verify timeout and has stamped a false Verified: no

> **Status:** inbox
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/prove-guards-fail.mjs, sdlc-studio/stories/US-01M0GM61-portal-and-layer-scale.md
> **Severity:** Medium
> **Points:** 3

## Summary

US-01M0GM61 AC5's verifier is `shell node scripts/check-component-css.mjs && node scripts/prove-guards-fail.mjs`. Measured at 14eaed4: the prover alone is 97.8s real (135 mutations, each staging a copy of the tree), and chained behind check-component-css the pair measures ~115s. `verify_ac.py --timeout` defaults to 120s and the project's `.config.yaml` exposes no timeout key, so the default is what `reconcile --verify` gets.

This is not a hypothetical margin. Round 10's reviewer hit it: on one of three runs at an unmutated tree, AC5 timed out and the harness rewrote the story to `**Verified:** no (2026-08-26)`. A false `no` stamped into a story by a clock is worse than a slow gate, because `reconcile --verify` is the gate that makes Done mean done - it converts a timing flake into a spec claim.

The margin closes on its own. The prover's runtime grows monotonically with guard count: this sprint's four added mutations (131 -> 135) are what moved it to the edge, and every overlay still to build adds more. Raising the timeout defers the same cliff rather than removing it.

Workaround in use: `--timeout 400` (validated by the round 10 reviewer, ac=8 pass=8 fail=0 changes=0).

Candidate fixes, in preference order: (1) parallelize the prover's two sequential loops over CASES and `OUTPUT_CASES` across cores - `user 125s` vs `real 98s` shows it is barely parallel today, and tree-staging is I/O bound so the headroom is large; (2) stage the tree copy once and reuse it across mutations rather than per-mutation; (3) give prove-guards-fail a `--only` filter so an AC can pin exactly the mutations it claims, which is both faster and MORE precise than 'the whole suite passed'.

Deliberately not fixed inside the GM61 close: the prover is the project's central proof mechanism at 1821 lines, AC5's expression was verified byte-for-byte by round 10, and rewriting its execution model unreviewed to reclaim a five-second margin would need its own review round.

## Steps to Reproduce

{{steps}}

## Proposed Fix

{{fix}}

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |

## Second defect found while closing: the verifier is self-referential

Reproduced at `14eaed4` + this sprint's tree, twice in a row.

`verify_ac.py run` walks a story's criteria in order and **rewrites the story file** as it goes,
stamping each `- **Verified:**` line. AC5's verifier is `prove-guards-fail.mjs`, which stages a copy
of the tree - **including `sdlc-studio/stories/`** - and mutates a story criterion to build its
`a verified criterion whose verifier cannot reach the file its mutant changes` case.

So when AC5 runs, the file the prover reads has already been edited by the run that is invoking it.
On the failing pass, five earlier ACs had just been stamped `no` by an unrelated environment fault
(`vitest` not on `PATH`), which changed the set of `Verified: yes` criteria available to mutate, and
the mutation SURVIVED:

```
FAIL AC5: shell node scripts/check-component-css.mjs && node scripts/prove-guards-fail.mjs
  | a verified criterion whose verifier cannot reach the file its mutant changes:
  |   SURVIVED - check-story-verifiers.mjs exited 0 with the mutation applied
```

Run standalone against the same tree one minute later, `node scripts/prove-guards-fail.mjs` is
`PASS ... 135 mutation(s) killed`, that case included. Nothing was wrong with the guard.

Two things follow, and the second is the dangerous one:

1. The `PATH` fault is its own trap - `vitest` is a workspace binary, so a bare
   `verify_ac.py run` outside `pnpm` stamps every vitest-backed criterion `no`
   (`[Errno 2] No such file or directory: 'vitest'`, `changes=5`). Invoke it with
   `node_modules/.bin` on `PATH`.
2. **A verifier that reads the artifact the harness is concurrently rewriting cannot give a stable
   verdict**, and this one fails OPEN in the direction that matters: it reported a guard as broken
   when the guard was fine. The same coupling can report a guard as fine when it is broken, which is
   the exact class - a claim asserting proof where no mutation demonstrates it - that took ten
   review rounds to clear out of US-01M0GM61.

Candidate fix, beyond the three already listed above: `prove-guards-fail.mjs` should stage
`sdlc-studio/stories/` from **`git show HEAD:`** rather than the working tree, so its story mutations
are built against a committed, quiescent baseline instead of a file another process holds open.
