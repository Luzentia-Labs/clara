# RETRO-0003: Complete EP-01M0GKM2: the Field framework and the eight basic inputs, with label, description, error and required state wired automatically to every control

> **Date:** 2026-08-28
> **Batch:** US01M0GM0D, US01M0GM2K, US01M0GM2X, US01M0GM3D, US01M0GM9E, US01M0GMAG, US01M0GMBM, US01M0GMF3, US01M0GMMM, US01M0GMQT
> **Goal:** Complete EP-01M0GKM2: the Field framework and the eight basic inputs, with label, description, error and required state wired automatically to every control.
> **Delivered:** 10 / 10   **Blocked:** 0

## Delivered

All ten units of EP-01M0GKM2, and the epic is Done:

- US-01M0GM3D - the Field framework: label, description, error and required state wired to every
  control, with `fieldAriaProps`, `fieldChangeGuard` and `fieldDisabled` as the shared mechanism
- Input, Textarea, NumberInput, PasswordInput, SearchInput - the five text controls
- Checkbox, CheckboxGroup, RadioGroup, Switch - the four toggle controls

**This retro is written after the fact, and says so.** The run was never closed at the time; two
further epics have closed since. What follows is what the artefacts still support, and the sections
that cannot be reconstructed say that rather than being filled with plausible numbers.

## Blocked / deferred

Nothing. The run record reports `remaining: 0`, and every story in the epic reads Done in the index.

## What went well

- **The shared Field mechanism held.** Ten controls take their label, description, error and
  required state from one place, and later epics inherited it without change - Select and Combobox
  wired into `fieldAriaProps` unmodified two epics later.
- **The disabled decision survived contact.** D0058 and D0064 chose `aria-disabled` plus `readOnly`
  over the native attribute, so a disabled control keeps its tab stop. It has been re-derived twice
  since by review seats and held both times.
- **Nothing shipped on the author's own sign-off.** The review-coverage step reports 10/10 units
  covered by an independent pass.

## What was hard / what stalled

- **This close.** The run was left open at the end of the sprint, and reopening it months later
  found the telemetry gone: no start time, no batch units, no per-unit cost. Ten checklist items
  were unanswerable in principle rather than skipped, and are waived under D0110-D0119 rather than
  filled with numbers nobody measured.
- **The batch was 10 units against a standing appetite of 8.** The ceiling was raised to accept it
  and the run is reported against the standing appetite, not the raised one.

## Lessons

- **A run that is not closed loses its own telemetry.** Not "is harder to close" - loses it. The
  cost, the estimate accuracy and the mutation survivors for this sprint are unrecoverable, and the
  only honest close was to waive ten checklist items naming why. Close the run when the work stops,
  or accept that its numbers are gone.
- **A stale run record is worse than none.** `status.py` reported this sprint as the current run
  through two subsequent epic closures, so anyone reading it for orientation was told the project
  was somewhere it left long ago. That is the same failure `sdlc-studio/reviews/LATEST.md` was
  rewritten to stop, in a different file.

## Carried lessons

The 5 that matter most for the NEXT batch, chosen now rather than ranked from the whole
store. A ranking is a fact about the past; this is a decision, re-made every retro. Bullets,
not a numbered list, and drop one for each you add (`lessons carry --displaces`).

Chosen against the batch that comes next - the thirteen triaged bugs.

- **A test must observe the property, not a proxy for it, and a proxy replaced by a better proxy is
  still a proxy** (D0065). Round 1 of this epic found eight instances, every one already stamped
  `Verified: yes`. The next batch is full of the same shape: BG-01M11KT6 must show a visible mark
  and BG-01M11JWY must produce an announcement, and a class name or an element's presence will
  stand in for either without complaint.
- **Delete the mechanism and check that something goes red.** Round 2 found `labelFor="group"` -
  the entire fix - in no test file, with 751 tests and 23 gates green. Every Critical that round
  was found this way, and the corollary is cheaper still: for each assertion, name the production
  edit that would make it fail. Where the answer is "none", the test is decoration.
- **An enumerated list goes stale silently, by construction.** `check:keyboard` names six test
  files by hand and 33 of the 35 components carrying a keyboard table sit outside it; adding a
  component does not add it there and `pnpm check` still reports PASS. BG-01M10BWX and BG-01M109XY
  are both this class, and D0051 and D0067 already give the rule - derive the category, never infer
  it from a name.
- **jsdom answers yes about geometry, motion, pointers and timing regardless.** A verdict it
  reaches on any of those is a false green by construction, not a flaky one. BG-01M105X5 measured
  it: `delayDuration=5000` left 16 of 16 jsdom tests and the whole e2e suite green, so a sevenfold
  pointer-latency regression is invisible to every check in this repository.
- **Repairing one instance without enumerating the rest is how the class comes back.** Drawer was
  added to `check:keyboard` while closing US-01M0GMWW - one instance fixed, the mechanism untouched,
  so the next component ships outside the gate for exactly the same reason. The same shape left
  three gates certifying a stale build after `test:e2e` had already been fixed for it.

## Known issues carried

Every finding this sprint leaves OPEN, with the ruling somebody made on it. This is the one
compulsory close item the tree cannot derive: whether an open defect stops the ship is a
judgement, so it is recorded here and the sprint checklist reads it back. An open finding
with no row is reported as UNRULED, because "we carried it" and "nobody looked" must never
read the same.

Ruling is one of `stop-ship`, `not-stop-ship`, `accepted-risk`, `deferred`. A `stop-ship`
ruling HOLDS the close, which is the point of being able to make one.

| Issue | Ruling | Ruled by | Date |
| --- | --- | --- | --- |
| BG-01M11WQZ | not-stop-ship | sdlc-studio; agent | 2026-08-29 |
| BG-01M10BWX | not-stop-ship | sdlc-studio; agent | 2026-08-29 |
| US-01M0WSME | deferred | sdlc-studio; agent | 2026-08-29 |
| US-01M0GMZW | deferred | sdlc-studio; agent | 2026-08-29 |

**BG-01M11WQZ is this sprint's own surface.** It affects `packages/react/src/lib/field-context.ts`,
the mechanism US-01M0GM3D delivered: a control rendered outside a Field gets no accessible name and
nothing warns, and for `role=combobox` there is no name at all. It is open, triaged, carries
acceptance criteria and three points, and is in the next batch.

**BG-01M10BWX leaves nine of this epic's ten controls without a per-component keyboard gate.**
Field's two test files are two of the six `check:keyboard` names by hand; Input, Textarea,
NumberInput, PasswordInput, SearchInput, Checkbox, CheckboxGroup, RadioGroup and Switch are held
only by what `matrix.test.tsx` and `primitives.test.tsx` reach across all components at once, which
is a weaker claim than the one their keyboard tables make.

**US-01M0WSME and US-01M0GMZW carry what this epic could not verify.** Gate 7 is unwired, so no
visual baseline exists for any of the ten controls and nothing in the repository can see what they
look like; Storybook stories do not exist. Both are named in each story's own definition-of-done
criterion rather than claimed - Input AC8 states them explicitly - and in every verification
record's Stated gaps.

**The ruling is the agent's, not the operator's, and the basis is that there is nothing to stop.**
Both packages are at `0.0.0` and `NPM_TOKEN` is unset, so no consumer can reach any of this. A
`stop-ship` ruling would be a claim about a ship that does not exist. The operator should override
these rows if the reading is wrong.

Not artefact-backed, ruled here: **the manual keyboard pass is outstanding on all ten of this
epic's verification records** (*accepted-risk* - each record says so in its own words, and the
guard now accepts only a real pass naming its browsers or an admission that it is outstanding), and
**the skill's retro parser cannot read this project's ULID ids** (*accepted-risk* - carried
unchanged from RETRO-0002; see Estimate vs actual below, where it is now measured rather than
asserted).

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

- **UNMEASURED, and for two independent reasons - neither of them a skipped step.** First, the run
  recorded no per-unit telemetry and no `session_token_baseline`, so this sprint's cost is
  *not-attributable* rather than unknown-but-guessable; the waivers D0110 to D0119 name that and
  refuse to substitute a plausible number. Second, `retro.py accuracy` cannot run here at all:
  its `ARTEFACT_ID_RE` requires four digits after the prefix, and this project's ids are ULIDs
  (`US-01M0GM0D`), so the Batch field parses to 0 units against a declared 10 and the command
  refuses rather than writing a partial denominator to `VELOCITY.md`. That refusal is correct
  behaviour. It does mean no velocity row exists for this sprint or the two before it, and none
  will until the parser reads ULIDs.

## Actions raised

**Are there any CRs or Bugs you want to raise in this project to address any of the
issues found?**

This is the question that turns a retro into work. Every finding gets a disposition:
**file it** (a BG/CR id), **record it fixed in-sprint** (`fixed-in: <sha or unit>`), or
**decline it with a reason**. All three are green. What does not pass is silence - a
finding written down and left to rot. The three are counted separately at close: a sprint
that repaired eleven findings reads as eleven fixed, not eleven declined.

To say "nothing worth raising", say so in a row and give the reason. An empty table is
not an answer.

All three accepted dispositions are shown below, filled in rather than described - the
vocabulary is exact and a refusal is a poor place to meet it for the first time. Replace
every EXAMPLE row; a row left in place is reported at the close, and a retro still carrying EVERY demonstration line this template ships is REFUSED by it.

| Finding | Disposition |
| --- | --- |
| Round 1: eight criteria stamped `Verified: yes` whose test observed a proxy rather than the property - a class name for a rendered dimension, an attribute's presence for its validity, an id count where the defect was differing id values | fixed-in: 121d032 |
| Round 2: `labelFor="group"`, the whole fix for a Field label bound to a fieldset, appeared in no test file - deleting both halves left 751 tests and 23 gates green | fixed-in: f45dc54 |
| Round 2: `check:axe` named the file holding 54 axe assertions and selected them with a pattern matching no block in it - 86 skipped, 0 run, exit 0 | fixed-in: f45dc54 |
| Round 2: `fieldChangeGuard` was installed on `onClick` only, so a disabled checkbox reverted its DOM toggle while `onChange` still fired reporting `checked === true` | fixed-in: f45dc54 |
| Round 2: two acceptance criteria named features that did not exist anywhere in the repository | fixed-in: f45dc54 |
| Round 3: five Highs, no Criticals | fixed-in: ec2fbe0 |
| Round 6: guards checking the shape of a record rather than its content | fixed-in: feaa477 |
| Criteria that were falsifiable and wrong, and criteria aimed at something other than their own subject | fixed-in: f9c29e4 and bcac2a7 |
| A control rendered outside a Field gets no accessible name and nothing warns | declined: already filed as BG-01M11WQZ by a later review and ruled in Known issues carried above; filing it a second time would double-count one defect |
| `check:keyboard` runs a hand-typed file list, leaving nine of this epic's ten controls without a per-component keyboard gate | declined: already filed as BG-01M10BWX and ruled above, same reason |
| The plan reviews were retrospective - the code was written before the plans were finalised, which both plan reviewers said unprompted and correctly treated as weakening their own approval | declined: a process defect inside a closed epic, not repairable within it; the standing remedy is the engagement floor in AGENTS.md, which requires the specification delta before any code and was adopted after this epic |
| `reviews/RV-2026-08-23-ep-01m0gkm2.md` stops at "Round 3 - in progress" while the commit log names rounds up to 6 | declined: the record is accurate about rounds 1 and 2 and stops there. This retro now carries the full round count and the verdict-ledger totals, and back-filling a closed epic's review record with rounds nobody wrote up at the time would manufacture a record rather than correct one |

<!-- file one with: scripts/file_finding.py · check with: scripts/retro.py dispose --id RETROxxxx -->

## Close loop (gated)

`gate --require-retro RETROxxxx` (this retro's id, file form) fails until all four are true:

- [ ] this retro exists AND passes its content check - required sections, at least one real
      lesson, and every finding dispositioned (`retro.py validate --id RETROxxxx`)
- [ ] its lessons are in the project store, not just in this file (`retro.py extract --id RETROxxxx`)
- [ ] open lessons re-validated: each is closed, extended, or within its horizon (`lessons revalidate`)
- [ ] `retros/LESSONS-SUMMARY.md` regenerated from the still-valid lessons (`lessons summary`)

The next sprint reads them automatically: `sprint plan` prints the digest in the plan.

## Metrics

- **Tokens:** not-attributable. The run opened with `session_token_baseline: null`, and there is no
  fallback to a session total - a plausible-looking figure that is not this sprint's cost is worse
  than an absent one.
- **Duration:** the run record opens at 2026-08-23T12:09:23Z and closes on 2026-08-29. That span is
  the record's, not the work's: the work stopped days before the close and the record was left
  open, which is the failure this retro's Lessons section is about. The working period is not
  recoverable.
- **Critic rejects:** 23 REJECT against 21 APPROVE across this epic's ten stories in
  `reviews/plan-review-verdicts.md`. At least six review rounds ran - the commit log names rounds
  2, 3 and 6, and `121d032` remediates two more - of which `RV-2026-08-23-ep-01m0gkm2.md` wrote up
  the first two: 4 Critical, 10 High, 13 Medium and 10 Low code-review findings between them.
  Rounds 1 and 2 each REJECTed all ten stories.

## Appetite overage

This run was ACCEPTED over its standing appetite: 10 units against a standing appetite of 8. The ceiling was raised (`--appetite-units`/`--appetite-minutes`) to take the batch; the run is reported against the standing appetite, not the raised ceiling, so the over-commitment and the decision to accept it both stay on the record.

## Deferred at close

Closed with known outstanding work (RUN-01M0Q8VF): the operator chose file-and-close over another fix cycle. Nothing here was waived - each blocker is a filed artefact:

- CR-01M1534S: [checklist] goal-seat-reviewed: Sprint Goal stated and seat-reviewed BEFORE the plan - past its window (`sprint plan`) (deferred, not waived)
- CR-01M15331: [checklist] batch-boundary-review: Review at each delivery batch boundary - past its window (`sprint review-batch`) (deferred, not waived)
- CR-01M153BV: [gate] mutation: 5 survived, 0 error(s) of 5 applied (0 truncated) - advisory - summary is from the run at c3982994a, not this tree (090edfbf7); mutation evidence covers 3/10 file(s) of the recorded surface (nothing changed since HEAD); 1 of those is self-reported (mutants registered by hand, not a measured run): package.json; STALE (edited since mutated): .size-limit.json, package.json, Toast.tsx (+4 more) (deferred, not waived)
