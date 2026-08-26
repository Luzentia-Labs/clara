# BG-01M0XX4V: AC5's verifier runs at 96% of the verify timeout and has stamped a false Verified: no

> **Status:** Fixed
> **Triaged-by:** anton-reis; persona; review-seat
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


## Acceptance Criteria

### AC1: The prover reads a quiescent baseline, not a file another process is editing

- **Given** a story file whose `Verified:` stamps are being rewritten in the working tree
- **When** `prove-guards-fail.mjs` runs
- **Then** every mutation still dies, because the prover stages `sdlc-studio/stories` from `git HEAD`
- **Verify:** shell node scripts/prove-guards-fail.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: The race was real, and the fix is what closes it

- **Given** the OLD working-tree staging restored
- **When** the same story is rewritten mid-run
- **Then** mutations SURVIVE that otherwise die - so the fix is load-bearing, not decorative
- **Verify:** manual revert stageStoriesFromHead to cpSync, flip Verified stamps, confirm SURVIVED
- **Verification target:** functional

### AC3: The clean run is established once per guard, not once per case

- **Given** 135 cases sharing 20 distinct guards
- **When** the prover runs
- **Then** the unmutated precondition is established 20 times rather than 135, and a guard that
  fails unmutated is still caught and reported
- **Verify:** shell node scripts/prove-guards-fail.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Fixed (2026-08-26) - the self-reference

**This was the dangerous half, and it is closed.**

`verify_ac.py run` rewrites a story's `Verified:` lines as it walks the criteria. US-01M0GM61's AC5
invokes this prover, and the prover mutates a story criterion to build its
`a verified criterion whose verifier cannot reach the file its mutant changes` case. The prover was
therefore reading a file the process invoking it was concurrently editing.

`sdlc-studio/stories` is now staged from **git HEAD** via `stageStoriesFromHead()`, which no other
process holds open. It falls back to the working tree only when the directory is untracked
wholesale, and says so - a silent fallback would reintroduce the race.

**Proved by counterfactual, both directions**, flipping 11 `Verified: yes` stamps to `no` in
`US-01M0GM48-modal.md` to simulate a concurrent `verify_ac` pass:

| Staging | Result |
| --- | --- |
| Working tree (the old code, restored for the probe) | **FAIL** - `a vitest-only verifier over a mutant in an asset no test can load: SURVIVED` and `a Test Plan row naming a file that does not exist: SURVIVED` |
| `git HEAD` (the fix) | **PASS**, 135 killed |

So the race was not theoretical and the fix is what closes it. Note the direction: the old code
reported a *broken guard* when the guard was fine. The same coupling can report a guard as fine when
it is broken, which is the class that took ten review rounds to clear out of US-01M0GM61.

## Fixed - the timing margin

Measured on a quiet machine, and the first attempt did NOT work:

| | real |
| --- | --- |
| Prover, before any change (135 mutations) | 97.8s |
| Prover, after the clean-run cache (136 mutations) | **103.2s** |
| AC5's full chained expression | **105.1s** against a 120s default |
| AC5 filtered to its own claim | **34.5s** |
| US-01M0GM61's WHOLE 8-criterion run, after | **83.4s** |

**The clean-run cache bought nothing measurable.** It removes 115 redundant guard invocations, which
sounded like the cost and was not: staging dominates - 136 tree copies - and the guard runs are
cheap beside them. It is kept because it is strictly less work and reports a broken guard once under
its own name rather than 45 times, but it is not the fix and this record does not pretend it was.

**The fix is `--only`.** `prove-guards-fail.mjs` takes a regex over mutation names, and AC5 now
runs `--only "z-index|layer|overlay"` - 33 mutations, the ones the criterion actually claims.

That is not merely faster, it is more honest. A criterion that shells out to 136 mutations to
substantiate a claim about the layer scale is asserting far more than it means, and the surplus is
other criteria's evidence borrowed to look thorough. `pnpm check` still runs the prover
UNFILTERED, so nothing stops being proved on the CI path.

**A filter matching nothing FAILS.** A selector that silently selects zero cases and exits 0 would
be the vacuous gate this whole file exists to prevent, and the most embarrassing possible instance
of it. Proved: `--only zzz-no-such` exits 1 with a message naming the pattern;
`--only "z-index|layer|overlay"` exits 0 with 33; unfiltered exits 0 with 136.

> **Note to future editors:** this section was written twice. The first attempt passed the
> prose through an UNQUOTED shell heredoc, so every backticked span was executed as a command
> and 174 lines of `pnpm check` output were pasted into this file where the words should have
> been. AGENTS.md says it plainly - pass prose as a document, not as a shell argument.

## Superseded - the earlier note on this half

The clean run is now established **once per guard instead of once per case**. 135 cases share only
20 distinct guards, and the unmutated verdict cannot depend on which mutation is about to be
applied - all 135 stages are copies of the same tree - so the other 115 clean runs re-established a
fact already established. The precondition is not weakened: a guard failing unmutated is still
caught, and now reported once under its own name rather than 45 times.

**(Superseded by the measurements above; kept because it records what was true at the time.)**
**The speedup is NOT measured, and this bug stays open on that point.** The four overlay review
seats were running concurrently on this machine during the only window available to time it, and a
wall-clock number taken under that contention says nothing - a run measured 192.98s where the
pre-change baseline was 97.78s, which is the load, not the change. Recording a figure taken under
those conditions would be exactly the kind of measured-sounding claim this project keeps deleting.

**Re-measure on a quiet machine before closing this half**, and if the margin is still thin, the
remaining options are unchanged: parallelize the two case loops across cores (`user 125s` against
`real 98s` says it is barely parallel today, and staging is I/O bound), stage the tree copy once and
reuse it, or give the prover a `--only` filter so an AC pins exactly the mutations it claims.
