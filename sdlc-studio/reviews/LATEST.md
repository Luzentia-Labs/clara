# LATEST - orientation snapshot

> **Updated:** 2026-08-22 (F00 direction decided; round 5 repaired)
> A state snapshot, not a transcript. Re-read this after any compaction or fresh session,
> then run `/sdlc-studio status`. Overwrite it in place; do not append history.

## Where the project is

**Foundation epic in flight.** `EP-01M0GKNH` (Toolchain and release pipeline) is the
foundation epic and is being built **by hand to a green gate** before any
`sprint --epic` hand-off. 4 of its 11 stories have moved.

| Unit | State |
| --- | --- |
| US-01M0GMPJ - pnpm workspace and repository scaffold | **Done**, 3/3 ACs verified, APPROVE from the anton-reis seat |
| US-01M0GM9N - Package builds: Vite library mode and the tokens pipeline | **Review** - 3/3 ACs verified. `PL-01M0HVR8` Complete. Awaiting a non-author verdict. |
| US-01M0GMFB - Dual publishing with a closed exports map | **Done** - 6/6 verified, APPROVED by anton-reis in round 4. |
| US-01M0GM3X - Test harness (Vitest, RTL, axe, Playwright, Stryker, size-limit) | **Review** - 4/4 ACs verified. Re-sized 5 -> 8 by operator. `PL-01M0HZ74` Complete. |
| The other 7 stories in EP-01M0GKNH | Draft |

Repository state: all three packages now BUILD. `pnpm build` emits ESM + CJS + declarations
(`.d.ts` and `.d.cts`) for each, plus `tokens.css`, `themes/dark.css`, two JSON manifests, and one
`styles.css`. `publint` is clean and `attw` exits 0 on all three.

`pnpm check` passes all **ten** guards (layers, private, peers, exports, license, bundled-peers,
token-output, stylesheets, mutation-config, prove-guards);
`pnpm typecheck` passes for all three packages. Every package now carries its own LICENSE, and
`scripts/check-license.mjs` asserts the TARBALL contains it and that it matches the root
byte-for-byte - `publint` checks the license FIELD, never the FILE, which is how that defect
survived the scaffold review's own gate run.

**The packages export nothing yet, deliberately.** Every named export becomes permanent public API
at first publish, so the surface stays empty until the stories that own it decide it. Token VALUES
are placeholders replaced wholesale by US-01M0GMN0 (F00); the tier 2 NAMES are the commitment.

## What is true that a reader would otherwise get wrong

- **`pnpm lint` exits 0 over zero packages.** It is a false green, not a passing lint.
- **`status.py hint` reports "no personas yet".** False negative: the script globs for a
  single `sdlc-studio/personas.md`, this project uses the `personas/` directory form.
  Personas are complete - 3 users, 4 working seats, 1 stakeholder. Ignore that rung.
- **The Code pillar percentage is meaningless right now.** Every guard passes because
  there is nothing yet to fail them.

## Discovery backlog

**Three open items.** **BG-01M0J70K** (High) - the mutation gate has never executed; `stryker run` reports "No tests were executed" though vitest passes inside its own sandbox. D0015's blocking gate is aspirational until fixed.
 **CR-01M0J0Z6** (Medium, S) - the tier 2 semantic family names contradict TRD
Section 6; that is US-01M0GMAE's design call, disclosed rather than decided in a build story.
**CR-01M0HWDQ** (Medium, size S) - the CSS Modules half of the react build is not
proven end to end. The emitted stylesheet comes from a plain CSS file, because Vite removes a CSS
Module that no component consumes. Closes naturally with the first component story, which must
assert its hashed class name appears in `dist/styles.css`.

Previously The three findings from the `US-01M0GMPJ` delivery review were triaged on
2026-08-21 and are all terminal:

| Item | Disposition |
| --- | --- |
| BG-01M0HTRM (attw FalseCJS) | Superseded -> US-01M0GMFB AC4/AC5; delivered by `PL-01M0HVR8` Phase 3 |
| CR-01M0HT8N (LICENSE, workspace globs) | Superseded -> US-01M0GMFB AC6 + US-01M0GMKD AC5 |
| CR-01M0HTB4 (TRD contradiction) | Complete - TRD Section 5 corrected, D0029 recorded |

## Gate state

| Gate | State |
| --- | --- |
| `reconcile.py detect` | drift_items=0 |
| `validate.py check` | 101 checked, 0 errors, 0 warnings |
| Executable AC verify | 1 story verified (US-01M0GMPJ), 0 stale, 0 manual |
| Formal review record | **none** - `.local/review-state.json` does not exist. TRD and TSD have never had a formal review leg. PRD has a team consult (`prd-team-consult-2026-08-21.md`). |

## The review record so far

**Four rounds. One APPROVE (US-01M0GMFB); the peer guard rejected all four times.** Every version of the peer guard that
INFERRED whether React was external was defeated: marker strings (React 19 renamed them), output
text (a `@license` comment saying `from "react"` passed), then source text (`jsx: react-jsx` means
no component ever names React, so it skipped every peer on the unmodified tree). The version that
reads what the bundler RECORDED - `chunk.modules` from a Rollup plugin - is the first that holds.

Round 4 added the sharpest version: the record was **correct** and the guard **never read it**,
because a filename decided whether to look. Observation only helps if nothing upstream decides
whether to observe. The guard is now an allowlist - every inlined module must be a package-relative
path under that package's own `src/` - with no mode selection at all.

`pnpm check` is 11 guards; `prove-guards-fail.mjs` proves 11 named mutations killable on a staged
copy.

Full record: `sdlc-studio/reviews/findings/RV-2026-08-21-us01m0gm9n-us01m0gmfb.md`.

## Next step

**THREE stories sit at Review** (US-01M0GM9N, US-01M0GMFB, US-01M0GM3X) with no standing
non-author verdict. The round-3 repairs and the whole test harness are unreviewed.

**Button is NOT the next story.** It was planned (`PL-01M0J6TB`) and held at Draft: 8 prerequisites
are Draft, 9 of the 10 tier 2 families F07 needs do not exist, AC6's verifier `pnpm lint:css` is not
a script, and no `@layer` is emitted anywhere. ~42 points sit ahead of it.

**F00's direction is DECIDED** (D0036) and tier 1 is landed - 6 OKLCH ramps, scales, and a two-part
focus indicator measured across all six enumerated surfaces. `design/foundations.md` has the record.

**The next story is `US-01M0GMAE` (semantic token layer)**. It has three concrete inputs waiting:
the per-intent `fg-on-emphasis` taxonomy change (D0036 clause 5), the tier 2 step choices proven by
measurement (`border-default` -> neutral 500, `bg-info-emphasis` -> info 700), and the 27 waived
contrast pairings that un-waive when the families exist.

Still open on F00 itself: **compact density floors (AC3) need a number.**

One ordering constraint that is easy to miss and impossible to undo: **US-01M0GM16 (cascade layers)
must land before ANY component stylesheet ships.** AGENTS.md states `@layer` cannot be retrofitted
without silently changing specificity for every consumer override in existence. Button is the first
component, so the layer has to exist before it does.

Two notes for whoever plans the next one:

- `transition.py` refuses `In Progress` on a planning-tier story. Budget for
  `artifact.py promote --to full` plus filling 8 sections. All three stories so far hit this.
- **Do not upgrade the test toolchain to latest** (D0033). jsdom 30, Stryker 10 and size-limit 13
  all require Node 22+, above this project's `>=20.19.0` floor. The pins are deliberate.

## Standing constraints that outlive any one story

Publishing is a one-way door. Cascade layers cannot be retrofitted. Radix must not leak
into Clara API. Tier 2 tokens are public API; tiers 1 and 3 are not. See `AGENTS.md`
"Gotchas" - all of them are permanent-if-wrong.
