# CR-01M0SKZ6: Verify selectors must select the tests that prove their criterion, not any test

> **Status:** Complete
> **Triaged-by:** anton-reis; persona; v1
> **Created:** 2026-08-24
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/check-story-verifiers.mjs
> **Priority:** Medium
> **Type:** Feature
> **Points:** 5

## Summary

This is the D0078 shape-versus-content lesson at its third recurrence, in the one gate AGENTS.md says makes Done mean done. `reconcile --verify` is the pre-release gate; a verifier that selects the wrong tests turns it into a green check that ran nothing relevant, and the failure mode is invisible because the tests it does select genuinely pass.

`check-story-verifiers.mjs` asserts that a criterion's `Verify:` selector matches SOME test in the suite. It does not assert that it matches THE test that proves the criterion. Three times now a criterion has been stamped `Verified: yes` by a green run of tests that could not see the behaviour it names:

1. US-01M0GMF3 AC3 - the verifier selected three stepping tests, none of them the account-code test the criterion was rewritten for.
2. US-01M0GM61 AC3 - the verifier selected three token comparisons in the tokens package while the DOM-order test that proves the whole stacking redesign lived in the react package under a describe the selector never reached. The story's own Test Plan mutant left all four verifiers green.
3. US-01M0GM61 AC4 - the verifier owned a test that is not an SSR property, so a purely client-side mutation reddened the SSR criterion.

4. US-01M0GM48 AC8 - `check-verification.mjs` requires a keyboard table to EXIST, not to be true. Rewriting Modal's Escape row to "Does nothing. Use the close button." left `check-verification.mjs --component Modal` green. The table is the specification D0024 says the tests are written from, so a table that contradicts the code inverts the whole TDD claim for that component.
5. US-01M0GM48 AC8 - the same criterion asserted that Storybook stories, a visual baseline and a recorded manual keyboard pass "all exist", and was stamped `Verified: yes` while the repo had no `.storybook`, no `*.stories.*`, an unwired gate 7, and a verification record whose own text said the manual pass was outstanding. Corrected in the story; the guard could not have caught it.

Each was found by a review seat probing by hand, never by a gate. Every one was fixed at the instance; the guard that should catch the class is unchanged.

## The originally proposed rule does not work - measured

The first proposal was: "the Test Plan row already names the production mutant, so require the
file(s) it names to be imported by a test the verifier selects." A measurement over the whole
corpus (87 Test Plan rows, 56 criteria stamped `Verified: yes` with a vitest verifier) says that
rule is inapplicable:

- **55 of 56** rows name **no file at all**. They name a symbol, an attribute, or a behaviour.
- Mining identifiers out of the prose instead was tried, tuned over five passes, and abandoned. It
  is wrong in both directions and the errors are not rare: `setTimeout` in "wrap `onChange` in a
  `setTimeout`" names the mutation to ADD, not code that exists; `aria-checked="mixed"` is written
  `aria-checked={indeterminate ? 'mixed' : undefined}` in the source; and common words like `open`
  and `children` match every file, so the rule passes vacuously on exactly the criterion it was
  built to catch. Each fix for one class opened another.

A guard that fires on noise is worse than no guard - this repo has already recorded that lesson
twice. So the answer is not a better heuristic.

## The rule that does work: stop inferring, and make the row say it

Add a machine-readable **`Touches`** column to the Test Plan: the source file(s) the mutant changes.
Then the check is exact rather than inferred:

1. Every `Verified: yes` criterion's Test Plan row names at least one file in `Touches`.
2. The tests the verifier selects must transitively import at least one of those files - or, when
   `Touches` names an asset no test imports (a stylesheet, a token JSON), the verifier must also run
   a guard that reads it. That second clause is exactly what Modal AC5 needed: its mutant changed
   `styles.css`, its verifier ran vitest only, and jsdom computes no layout, so the criterion was
   green against a modal whose body did not scroll.

This costs one column across 87 rows, and it forces the author to state what they are mutating -
which is the discipline the CR is about, not a side effect of it.

**Validated against the three historical cases before proposing:** the rule catches US-01M0GM61 AC3
(verifier selected token tests, mutant changed `ClaraPortal.tsx`) and US-01M0GM48 AC5 (vitest-only
verifier, mutant changed `styles.css`). It does NOT catch US-01M0GMF3 AC3, where the verifier
selected the right FILE but the wrong tests within it. That third case needs per-test analysis and
is out of scope here - recorded so the CR is not read as claiming more than it delivers.

## Impact

**Who this affects:** every story in the project, and `reconcile --verify` - the pre-release gate AGENTS.md names as what makes "Done" mean done. 50 verifiers across 88 stories run through this guard today.

**What breaks if it is not done:** nothing breaks loudly, which is the problem. A criterion whose selector reaches the wrong tests reports `Verified: yes` on a green run, and the tests it selects genuinely pass - so there is no red build, no failing assertion, and no artifact that looks wrong. It is found only by a human applying the criterion's own mutant by hand, which has now happened three times in two epics. The cost of leaving it is that the release gate's guarantee is weaker than it reads, and nobody can tell which criteria are affected without repeating the manual probe on all 50.

**What breaks if it IS done:** existing stories whose selectors are mis-aimed start failing `pnpm check`. That is the point, but it is a migration: expect a first run to surface several, each needing a selector fix or a criterion rewrite. Land it with the fixes, not before them.

## Acceptance Criteria

### AC1: Every verified criterion says what its mutant touches

- **Given** a story criterion stamped `Verified: yes`
- **When** its Test Plan row has no `Touches` entry, or names a path that does not exist
- **Then** `check-story-verifiers.mjs` fails, naming the story and the criterion
- **Verify:** shell node scripts/check-story-verifiers.mjs

### AC2: A verifier that cannot reach what it certifies fails the build

- **Given** a criterion whose `Touches` names a source file
- **When** no test selected by its `Verify:` pattern transitively imports that file
- **Then** the build fails, naming the criterion, the file, and the test files the selector did reach
- **And** when `Touches` names an asset no test can import - a stylesheet, a token source - the
  criterion's verifier must also run a guard that reads it, because a vitest-only verifier over a
  CSS change is green by construction in jsdom
- **Verify:** shell node scripts/check-story-verifiers.mjs

### AC3: The rule is proved able to fail, on the cases it was written for

- **Given** the mutation prover
- **When** a criterion's verifier is repointed away from the file its mutant touches
- **Then** `check:prove-guards` turns red
- **And** the two historical cases are reproduced as mutations rather than described: US-01M0GM61
  AC3 (verifier selected token tests while the mutant changed `ClaraPortal.tsx`) and US-01M0GM48
  AC5 (vitest-only verifier over a `styles.css` mutant)
- **Verify:** shell node scripts/prove-guards-fail.mjs

### AC4: The corpus is migrated, not exempted

- **Given** all 87 Test Plan rows across the story corpus
- **When** the guard runs
- **Then** every row carries a real `Touches` entry and the whole suite passes, with no allowlist,
  no grandfathering and no "existing rows are exempt" clause - the migration is the work, and a rule
  that applies only to new stories would leave every current criterion uncovered
- **Verify:** shell node scripts/check-story-verifiers.mjs && node scripts/check-tracked.mjs

### AC5: What it does NOT catch is written down

- **Given** the guard's docblock and this CR
- **When** a reader asks what it covers
- **Then** both state that a verifier selecting the right FILE but the wrong tests within it is out
  of scope (US-01M0GMF3 AC3), so the guard is not read as proving more than it does
- **Verify:** manual read the docblock and confirm the limitation is stated

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-24 | sdlc-studio | Created via `new` (deterministic) |
