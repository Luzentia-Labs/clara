# RETRO-0004: Complete EP-01M0GK91: build MultiSelect, DatePicker and DateRangePicker on the shared listbox engine, and resolve Select and Combobox to Done

> **Date:** 2026-08-30
> **Batch:** US01M0GM0F, US01M0GMC1, US01M0GMC7, US01M0GMJ8, US01M0GMRK
> **Goal:** Complete EP-01M0GK91: build MultiSelect, DatePicker and DateRangePicker on the shared listbox engine, and resolve Select and Combobox to Done.
> **Delivered:** 0 / 5 Done, 3 / 5 built   **Blocked:** 2 (deferred by the operator)
>
> **Read both numbers.** Three components were built, repaired and pushed; NONE of the five units
> reached Done, because none has an independent review sign-off. `0 / 5` is the status the gate
> reads. `3 / 5 built` is the work that exists.

## Delivered

Three of five units. **All three unbuilt components of EP-01M0GK91 now exist**, are gated by
`pnpm preflight`, and are pushed:

- **US-01M0GMC7 MultiSelect** - the third consumer of the listbox engine, and D0128's
  `closeOnSelect` so a multi-select does not close on every choice.
- **US-01M0GMC1 DatePicker** - the first component here that shares no engine with the listbox
  family: a `role="grid"` with roving tabindex, plus the adoption and measurement of
  `@internationalized/date` per ADR-008 (D0129, D0130).
- **US-01M0GM0F DateRangePicker** - the second consumer of D0131's `useCalendarGrid`.

**None of the five reached Done, and that is the honest result against the goal.** The Sprint Goal
said "build MultiSelect, DatePicker and DateRangePicker ... AND resolve Select and Combobox to
Done". The building half is complete; the resolving half is not, because nothing in this epic has
been signed off by anyone who did not write it.

## Blocked / deferred

**US-01M0GMRK Select and US-01M0GMJ8 Combobox were not advanced.** Both were already built and
repaired across four adversarial review rounds before this run opened. Their remaining path to Done
is process rather than code - an independent plan-review APPROVE and promotion from planning-tier
scaffold - and the operator deliberately stopped the review loop after round 4, on the finding that
it had turned inward and was reviewing my repairs rather than the product.

Attempting them here would have re-opened exactly that loop. Left where they are, deliberately.

## What went well

- **The run was opened properly, and it shows.** A Sprint Goal, a three-seat goal review, a named
  batch and a pinned base ref. RUN-01M0Q8VF closed with ten waivers because none of that existed;
  this close has real telemetry to report instead.
- **The lessons from the review rounds were APPLIED rather than relearned.** Every new component
  declared both contrast adjacencies from the start, carried `forced-color-adjust` on its check
  glyph, declared `font-size` on trigger and portalled panel, and named every file it touched in
  `Affects`. Select and Combobox each needed two corrections to reach that state; these three
  needed none.
- **The deferred-decision mechanism did its job.** The size-ceiling question was recorded, marked
  the unit Blocked, let the batch continue, and reached the operator as a structured choice with
  three priced options rather than as a silent default.
- **Mutants kept finding proxies in my own tests**, which is the process working rather than
  failing: three on DatePicker, two on DateRangePicker.

## What was hard / what stalled

- **Seven gate iterations on MultiSelect**, the component I had called the cheap one. Every catch
  was real and none was visible to the test suite: an untracked test file, a stale `planned` in the
  boundary manifest, a server-render crash only Stryker's dry run surfaces, a public API signature,
  a class-name convention derived from the component name, a missing size budget, and the `Touches`
  rule. Three of those seven had already been caught on other components the same day.
- **The size guard could not see the date dependency at all**, because a dependency reached through
  a `lib/` helper is hoisted into the shared chunk. My first repair was worse than the bug: it
  attributed the date library's weight to Alert.
- **I committed twice on work I had not confirmed.** Once with LATEST.md figures from a sync that
  was still running, and once nearly on a preflight that had never executed. Both were the same
  error - reporting from a command having been STARTED.

## Lessons

- **A gate catching you repeatedly is the gate doing the remembering you are not.** Three of
  MultiSelect's seven catches had already fired that day on Select and Combobox. The guards are a
  better memory than my attention, which is an argument for running them earlier and more often,
  not for being embarrassed by them.
- **"The command was started" is not "the command passed".** This is the same shape as reading a
  mutant verdict off a probe that never applied to disk, and it produced two bad commits here.
  Wait for the result, then report it.
- **A repair for a guard can reproduce the defect the guard exists to catch.** Following each
  chunk's shared import made every component match every shared dependency, so the budget named
  Alert for the date library's weight - which is precisely what that file's own comment warns
  about, committed while fixing something else.
- **A ceiling raised whenever it fires is not a ceiling.** The entry allowance moved twice in one
  sprint, and the second raise's own justification said a limit set at today's number fails on the
  next component. It did, immediately. The number was never the problem.

## Carried lessons

The five that matter most for the NEXT batch, which is the review of these five units.

- **Derive by execution BEFORE the sentence exists.** The Combobox docstring was wrong three times
  by three routes - never derived, carried from a report, then written from a decision's prose - and
  the version that survived is the one where every claim was measured first.
- **Assert the property, and check the assertion can distinguish.** Three proxies this sprint got
  past me and were caught by mutants: an endpoint that could also be in-range, a preset whose dates
  were never checked, and a month repeated inside a string that already contained it.
- **Both adjacencies, always.** A mark is drawn on something; declare the contrast pair for every
  surface it can sit on, not the one that looks right. Select and Combobox each needed two
  corrections to learn this and the three new components needed none.
- **Run the gates early.** Seven iterations on MultiSelect were seven catches that could each have
  been found a minute after the code was written rather than at the end.
- **A guard's refusal names the symptom, not always the cause.** `size:sync` said "inlined in no
  built client chunk", which reads as "move the code" - and moving it changed nothing, because the
  bundler hoists it wherever it lives.

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
| BG-01M19411 | not-stop-ship | sdlc-studio; agent | 2026-08-30 |
| BG-01M17P6M | not-stop-ship | sdlc-studio; agent | 2026-08-30 |
| BG-01M159WJ | not-stop-ship | sdlc-studio; agent | 2026-08-30 |
| US-01M0GMRK | deferred | Richard Dale Umayan (operator) | 2026-08-30 |
| US-01M0GMJ8 | deferred | Richard Dale Umayan (operator) | 2026-08-30 |

**BG-01M19411 is this sprint's own output.** The barrel-entry size budget is a flat per-component
allowance that moved twice during this run. Not stop-ship: nothing is published, the number is
generous rather than tight, and the budget still fires - it just gets re-authored when it does,
which is the defect.

**BG-01M17P6M and BG-01M159WJ reach the components this sprint built**, through the shared listbox
engine: ArrowDown can walk the highlight up the screen on a grouped list, and a parent re-render
with a fresh array identity resets the highlight. Both are pre-existing and were filed before this
run; MultiSelect inherits them and DateRangePicker does not, since the calendar grid is a different
engine. Not stop-ship because nothing is published and both are triaged with acceptance criteria.

**US-01M0GMRK and US-01M0GMJ8 are DEFERRED by the operator**, not by me. Both are built and
repaired; what remains is an independent sign-off, and the operator stopped the review loop after
four rounds on the finding that it had turned inward. That is a decision on the record rather than
an omission.

**The agent-ruled rows say so.** Nothing here is published - both packages are `0.0.0` and
`NPM_TOKEN` is unset - so a stop-ship ruling would be a claim about a ship that does not exist. The
operator should override any row where that reading is wrong.

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

- **UNMEASURED per unit, and for a reason that is now narrower than last time.** This run DID open
  properly - `sprint plan --write` recorded a Sprint Goal, a three-seat goal review, the five batch
  units by id, and a base ref - so the checklist items that were unanswerable in RUN-01M0Q8VF are
  answerable here. What is still absent is per-unit token telemetry and a
  `session_token_baseline`, because the run was driven interactively rather than by the sprint
  runner, so no per-unit actual was ever recorded to compare a forecast against.
- **`retro.py accuracy` still cannot run at all**, for the same mechanical reason RETRO-0003
  recorded: `ARTEFACT_ID_RE` requires four digits after the prefix and this project's ids are
  ULIDs, so the Batch field parses to 0 units against a declared 5 and the command refuses rather
  than writing a partial denominator to `VELOCITY.md`. That refusal is correct. It does mean no
  velocity row exists for this sprint or the three before it, and none will until the parser reads
  ULIDs. The same limitation is why one row in Actions raised above reads `declined` where `filed`
  would be true.
- **What CAN be said about size**: three components were forecast at 5 + 8 + 5 = 18 points and all
  three were built. That is a points count, not a cost, and it is not evidence the estimates were
  good - only that the batch was finished.

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
| The size guard cannot see a dependency reached through a `lib/` helper - it is hoisted to the shared chunk, so every budget ignored it and none measured it | fixed-in: d80eb30 |
| The first repair for that made every component match every shared dependency, and named ALERT for the date library's weight | fixed-in: d80eb30 |
| The barrel-entry budget is a flat per-component allowance and drifted twice in one sprint | declined: not actioned IN this sprint - it is filed as BG-01M19411 and ruled not-stop-ship in Known issues carried above. Recorded as declined only because this retro's parser matches a four-digit id and this project uses ULIDs, so a filed disposition cannot be expressed in this column - the same limitation RETRO-0002 and RETRO-0003 both carry |
| DatePicker's live region repeated the month the date string already carried, so asserting it was a tautology | fixed-in: 3ff2743 |
| The disabled model had no test on DatePicker at all - D0058/D0064 were assumed rather than asserted | fixed-in: 3ff2743 |
| A hand-rolled change guard was dead code, duplicating `fieldChangeGuard` which D0068 exists to keep in one place | fixed-in: 3ff2743 |
| An endpoint could carry BOTH the endpoint and in-range classes, and the test could not tell | fixed-in: d80eb30 |
| The preset test checked the buttons existed but never which dates they produced, so "Last quarter" could become this quarter | fixed-in: d80eb30 |
| Focus never reached DatePicker's grid - the effect ran before the portal content mounted | fixed-in: 3ff2743 |
| Two commits were made on results that had not arrived: stale LATEST.md figures, and a preflight that never ran | fixed-in: 5a0ff62 |
| `pnpm test:mutation` evidence is still from the token pipeline at c3982994a rather than this tree | declined: already carried as CR-01M153BV from the previous run's close, and re-filing it would double-count one piece of work |
| The manual keyboard pass is outstanding on all three new verification records | declined: it is the thing no automated check reaches, each record says so in its own words, and it is not a Done gate |

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
- **Duration:** opened 2026-08-29T21:41:20Z, closed 2026-08-30. The span includes an operator stop
  and resume partway through DatePicker, so it is wall-clock rather than working time.
- **Critic rejects:** none in this run. No unit in this batch was reviewed - that is the gap the
  goal verdict is `partial` for, not a clean sheet. The four adversarial rounds on Select and
  Combobox happened BEFORE this run opened and are recorded against RUN-01M0Q8VF's successor
  commits, not here.
- **Gate iterations:** 7 on MultiSelect, 3 on DatePicker, 3 on DateRangePicker. Every catch was
  real and none was visible to `pnpm test`.

## Deferred at close

Closed with known outstanding work (RUN-01M17Q8Z): the operator chose file-and-close over another fix cycle. Nothing here was waived - each blocker is a filed artefact:

- CR-01M1BD2D: [checklist] batch-boundary-review: Review at each delivery batch boundary - past its window (`sprint review-batch`) (deferred, not waived)
- CR-01M1BDWZ: [gate] mutation: 5 survived, 0 error(s) of 5 applied (0 truncated) - advisory - summary is from the run at c3982994a, not this tree (b7aecbd4a); mutation evidence covers 3/10 file(s) of the recorded surface (nothing changed since HEAD); 1 of those is self-reported (mutants registered by hand, not a measured run): package.json; STALE (edited since mutated): .size-limit.json, package.json, Toast.tsx (+4 more) (deferred, not waived)
