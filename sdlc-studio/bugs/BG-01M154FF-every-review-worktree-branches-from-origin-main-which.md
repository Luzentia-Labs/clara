# BG-01M154FF: Every review worktree branches from origin/main, which is 38 commits behind local main, so a seat measures a tree that never contained the unit

> **Status:** inbox
> **Severity:** High
> **Points:** 3
> **Affects:** AGENTS.md, sdlc-studio/reviews/LATEST.md
> **Created:** 2026-08-29
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

LATEST.md records the symptom - 'six worktrees in a row arrived 28-33 commits behind their target' - and prescribes the guard: check the base ref before trusting any mutation result. It does not record the CAUSE, so the class recurred, and the gap has grown from 33 to 38.

The cause is mechanical. The harness creates an agent worktree branched from `origin/main`. This project is trunk-based (D0052): work is committed to local `main` and pushed deliberately, so `origin/main` is behind local `main` by however many commits have not been pushed. Today `origin/main` is 14eaed4 and local `main` is c16aec2, a gap of 38 commits which includes 8bde87f and 090edfb - the two commits that BUILT the units under review.

Measured this run: four seats were dispatched to review US-01M0GMRK and US-01M0GMJ8. `git worktree list` showed all four pinned at 14eaed4. In those worktrees `packages/react/src/components/Select/` and `packages/react/src/components/Combobox/` do not exist at all, and the story files carry their PRE-CORRECTION acceptance criteria with zero Verified stamps, so a seat would also have been judging against the wrong criteria.

WHY THIS IS WORSE THAN AN ABSENT RESULT. Four of Select's seven Verify expressions are `vitest -t` NAME filters. A name-filtered run against zero matching test files exits 0, so every Test Plan mutant reports SURVIVED against a tree that never contained the mechanism. That is indistinguishable, in the report, from an insensitive assertion - the round would have read as a total regression of work that is in fact present and passing on main. The same shape reaches the shell verifiers: `check-component-css.mjs --component Select` and `check-verification.mjs --component Select` pass having never seen Select.css or verification.md.

Two of the four seats refused to measure and named the defect, which is the guard working. But the guard is per-seat and advisory: it depends on every future prompt remembering to include the base-ref check, and on every seat honouring it. Two other seats in the same round reached c16aec2 by self-healing mid-run, which produced exactly the condition one refusing seat warned about - a round returning a mix of stale and current verdicts that the caller cannot tell apart from the verdicts alone.

The fix has to make the base correct rather than make each seat check it. Options, for whoever rules: (1) push local main before dispatching a review round, so origin/main is current and every worktree is right by construction - it also makes the gap self-limiting; (2) have the dispatcher verify and advance each worktree before handing over, so no seat is ever given a wrong tree; (3) keep the per-seat check but make it a hard gate that refuses rather than a prompt convention, and require every verdict to record the ref it was measured at so a mixed round is detectable.

## Steps to Reproduce

1. Be on a trunk-based repo where local `main` is ahead of `origin/main` (here: 38 commits).
2. Dispatch any review seat with worktree isolation.
3. In the worktree run `git log --oneline -1` - it reports origin/main's commit, not local main's.
4. Run `git merge-base --is-ancestor <local-main-sha> HEAD` - exits 1.
5. Run `git rev-list --left-right --count <local-main-sha>...HEAD` - reports `38 0`, i.e. behind and not ahead.
6. `ls packages/react/src/components/Select/` - No such file or directory.
7. Run any of the unit's `vitest -t` verifiers - exits 0 having selected nothing.

## Proposed Fix

Make the base correct rather than ask every seat to check it. The ruling belongs to the operator because option 1 is an outward-facing action, so this records the three and what each costs.

1. PUSH LOCAL MAIN BEFORE DISPATCHING A REVIEW ROUND. Every worktree is then right by construction, and the gap is self-limiting rather than growing every sprint (33 in the last recorded instance, 38 now). Cost: a push is gated on `pnpm preflight` per D0075, and it is a deliberate act rather than an automatic one, so it has to be a step in the round's own runbook rather than a side effect.

2. THE DISPATCHER VERIFIES AND ADVANCES EACH WORKTREE BEFORE HANDING IT OVER. No seat is ever given a wrong tree, so no seat has to know about the hazard. `git reset --hard <main-sha>` is safe on a throwaway worktree-agent-* branch and nowhere else, and the dispatcher is the one place that knows the branch is disposable - which is why a seat asked before doing it, correctly.

3. KEEP THE PER-SEAT CHECK, BUT MAKE IT A GATE RATHER THAN A PROMPT CONVENTION, and require every verdict to record the ref it measured at. This is the option that survives someone forgetting: today the check lives in whatever the dispatching prompt happened to say, which is the same enumeration-staleness class as `check:keyboard`'s hand-typed file list (BG-01M10BWX). Recording the ref on the verdict row is the part that makes a MIXED round detectable after the fact; without it, a self-healed seat and a stale one produce identical rows.

1 and 3 are complementary rather than alternatives: 1 removes the cause, 3 catches the next cause. Whichever is taken, `critic.py record` should carry the measured ref so that a verdict with no ref is visibly unattributable rather than silently trusted.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: LATEST.md records the symptom - 'six worktrees in a row arrived 28-33 commits behind their target' - and prescribes the guard: check the base ref before...
- [ ] **AC2** The proposed fix lands, pinned by a test: Make the base correct rather than ask every seat to check it.

## Impact

A whole review round can report a total regression of code that is present and green on main, or - worse - return a mix of stale and current verdicts with nothing in the verdict rows to distinguish them. The two-role gate would then record independent sign-off that was performed against a tree without the unit in it.

## Status note, 2026-08-29

**The INSTANCE is cleared; the CLASS is not, so this stays open.** `main` was pushed on 2026-08-29
(`14eaed4..10d2824`, 41 commits), so `origin/main` is current and a worktree branched from it today
is correct. That was the operator's chosen remedy and it is option 1 above.

What it does not do is stop the next occurrence. The gap reappears the moment commits accumulate
locally again, which is the normal state of a trunk-based repo between pushes - it was 33 when
LATEST.md first recorded the symptom and 38 by the time it was root-caused. Options 2 and 3 remain
the durable half: a dispatcher that verifies the base before handing over, and a base-ref check that
is a gate rather than a prompt convention, with the measured ref recorded on every verdict row so a
MIXED round is detectable after the fact rather than by luck.

Verified after the push: `git merge-base --is-ancestor 10d2824 origin/main` exits 0.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-29 | sdlc-studio | Filed |
