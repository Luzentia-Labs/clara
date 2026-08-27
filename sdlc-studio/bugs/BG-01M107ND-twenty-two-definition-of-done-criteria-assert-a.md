# BG-01M107ND: Twenty-two definition-of-done criteria assert a visual baseline and a recorded manual pass that their own verifier never checks

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** sdlc-studio/stories/US-01M0GMWW-drawer.md, scripts/check-verification.mjs, scripts/prove-guards-fail.mjs
> **Severity:** Medium
> **Points:** 5

## Summary

Twenty-two acceptance criteria across this repo end with the same sentence: `stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist`. Each is verified by `node scripts/check-verification.mjs --component X`.

The verifier does not check two of the seven items it is asked to confirm.

1. **A visual baseline.** `check-verification.mjs` has no baseline rule at all - its `REQUIRED_SECTIONS` list (`scripts/check-verification.mjs:40-46`) covers Keyboard, Accessibility, What is verified automatically, Stated gaps, and the manual pass. CI gate 7 (visual regression) is the gate that would produce a baseline and it is still unwired, owned by US-01M0WSME. So no baseline exists for ANY component, and 22 criteria assert that one does.

2. **A recorded manual keyboard pass.** The guard's contract is deliberately weaker than the criterion's wording: `scripts/check-verification.mjs:322-328` accepts a real pass OR a plain statement that it is outstanding, and says those are the only two honest states. Every one of the 23 verification records takes the second branch - each says `Not performed. This is outstanding`. The guard is right; the criterion's wording is what is wrong.

So the criterion says `all exist` where two of the seven do not, and its own verifier is content. This is the overclaim class the epic has been correcting one story at a time - a criterion asserting more than the thing that checks it - reproduced identically 22 times because the sentence was copied.

It is not a code defect: the components are fine and the guard is fine. It is a spec-accuracy defect, and it matters because these are the criteria that decide Done.

Four of the five overlay stories are already Done carrying this wording, which is why this is filed rather than edited in place: rewriting a criterion under a Done stamp is the `stamp does not expire when the text changes` hazard LATEST.md already records.

## Steps to Reproduce

1. `grep -rlc "a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist" sdlc-studio/stories/ | wc -l` -> **22**.
2. `grep -n -i "baseline" scripts/check-verification.mjs` -> **nothing**. The verifier those 22 criteria name has no baseline rule.
3. `grep -rn "Not performed" packages/react/src/components/*/verification.md | wc -l` -> every record. The manual pass is outstanding everywhere, and each record says so.
4. `node scripts/check-verification.mjs --component Drawer` -> **PASS**, with both items absent.

The guard is not the defect: `check-verification.mjs:310` states its contract plainly, and it enforces exactly that contract. The criterion's text claims more than the contract.

## Proposed Fix

**Reword the criterion to claim what its verifier checks**, and say where the two missing items actually live.

The replacement sentence, for all 22:

> stories, tests, an axe assertion over default and error states, a docs page, a documented keyboard table, and a manual keyboard pass that is either recorded or plainly declared outstanding, all exist

That is the guard's real contract, stated as a criterion.

**The visual baseline moves rather than disappears.** It is a genuine definition-of-done item and it is genuinely blocked on gate 7 (US-01M0WSME). It belongs in each story's `## What is still not verified` framing and in the epic's blocking table, not in a criterion stamped `Verified: yes` by a verifier that cannot see it.

**Sequencing, deliberately.** Do not edit the four Done overlay stories in place: rewriting criterion text under a `Verified:` stamp is the hazard LATEST.md records under `Known gap in the tooling itself` - the stamp does not expire when the words change, so the story would carry a certification of different words. Reword, then re-run `verify_ac.py run` for every touched story in the same pass, so every stamp is re-earned against the new text.

**Guard it, or it comes back.** The wording was copied 22 times because nothing objected. A `prove-guards-fail` mutant - a criterion naming an artefact its own verifier has no rule for - is the executable form, and it is the same shape as the existing `a verified criterion whose verifier cannot reach the file its mutant changes`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
