# Where Clara stands

> **Updated:** 2026-08-22 (close of RUN-01M0MFXJ)
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

The foundation epic's toolchain is built and **CI has run green on a clean checkout** - the pipeline
is proven rather than asserted, which was not true before today. Still no components: the react
package exports nothing, so several gates are correct but currently measure an empty surface. Two
stories are Blocked on findings they themselves raised, and the whole epic is waiting on a
reviewer-of-record sign-off.

## Numbers that matter

- `pnpm check` runs **18 guards**; `prove-guards-fail` kills **30 mutations** on a staged copy.
- **52 unit tests.** `ci-gates.json` enumerates **19 gates** (12 wired and blocking, 7 pending, each
  bound to an open story); every TRD Section 9 gate is claimed by number.
- Stories: 2 Done, 6 Review, 2 Blocked, 76 Draft.
- PR #1 is open as a draft: https://github.com/Luzentia-Labs/clara/pull/1

## What is blocking what

| Blocker | Blocks | Note |
| --- | --- | --- |
| **Reviewer-of-record sign-off** | Closing EP-01M0GKNH | An adversarial review ran (`RV-2026-08-22-run-01m0mfxj.md`); the operator has not recorded a verdict. Author never signs their own work. |
| **CR-01M0MK20** (8) | First client component | Vite drops `"use client"` and a single chunk cannot carry a per-component classification. **Resolved to Option A** (manual chunks driven by `client-boundary.json`) in D0041 - decided, not yet built. |
| **F00 / US-01M0GMAE** | 27 waived contrast pairings | Planned (PL-01M0M9FC), sized 8, not implemented. |
| **No components (F01)** | US-01M0GMDV, gate 14, size budgets | Several gates are correct but vacuous until a component exists. |

## Open items

- **BG-01M0MFMZ** (Critical) - the peer guard. **D0042 changed the approach**: stop asserting over
  our own build output, verify in a real consumer instead. Folds into US-01M0GMDV.
- **CR-01M0MND5** - internal dependency range is exact-pinned by default rather than by decision.
- **CR-01M0HWDQ** (CSS Modules), **CR-01M0J0Z6** (tier 2 families) - untriaged.
- **`NPM_TOKEN` is not set on the repo.** The release workflow will fail if it fires.

## Standing lessons from this run

1. **A guard ships with its fail-proof in the same commit.** Three guards went a full run unproven;
   an adversarial reviewer broke all three on the first attempt.
2. **Stop hand-rolling parsers.** Seven instances so far. Workflow YAML now goes through a real
   parser (`lib/workflow.mjs`); export reading and the CSS brace walk are tested against the exact
   shapes that defeated them.
3. **Fixing a defect means fixing the class.** A substring-matching bug was fixed in one guard and
   left live in its sibling written the same day.
4. **Probe before deferring.** Attempting the smallest real version of a task is the cheapest way to
   learn whether it is reachable - it turned one wholesale defer into a shipped guard plus a
   permanent-consequence bug caught before publish.
