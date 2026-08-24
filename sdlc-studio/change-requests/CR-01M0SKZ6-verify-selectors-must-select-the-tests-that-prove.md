# CR-01M0SKZ6: Verify selectors must select the tests that prove their criterion, not any test

> **Status:** inbox
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

Each was found by a review seat probing by hand, never by a gate. Every one was fixed at the instance; the guard that should catch the class is unchanged.

Proposed rule: a criterion's Test Plan row already names the production mutant. Require that the file(s) that mutant names are imported by at least one test file containing a test the verifier selects - the same citation-content check `check-verification.mjs` already applies to verification records (D0078). A criterion whose mutant names `ClaraPortal.tsx` and whose verifier selects only tests in `packages/tokens` is then a build failure rather than a review finding.

## Impact

{{who this affects and what breaks}}

## Acceptance Criteria

### AC1: A verifier that cannot reach its mutant's file fails the build

- **Given** a story criterion whose Test Plan row names a production file
- **When** the criterion's `Verify:` selector matches no test in any test file that imports that file
- **Then** `check-story-verifiers.mjs` fails, naming the criterion, the mutant's file and the test files the selector did reach
- **Verify:** shell node scripts/check-story-verifiers.mjs

### AC2: The rule is proved able to fail

- **Given** the mutation prover
- **When** a real criterion's verifier is repointed at a test in another package
- **Then** `check:prove-guards` turns red
- **Verify:** shell node scripts/prove-guards-fail.mjs

### AC3: The three known instances are covered retroactively

- **Given** US-01M0GMF3 AC3, US-01M0GM61 AC3 and US-01M0GM61 AC4 restored to the selectors they carried when each was found
- **When** the guard runs
- **Then** all three fail, which is the evidence that the rule catches the class rather than the last instance
- **Verify:** manual restore each of the three selectors in turn and confirm the guard rejects it

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-24 | sdlc-studio | Created via `new` (deterministic) |
