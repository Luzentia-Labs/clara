# Where Clara stands

> **Updated:** 2026-08-23
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

The foundation toolchain is built, merged to `main`, and **proven** - CI and the release path have
both executed on a clean checkout, and the release path correctly declined to publish because a
changeset is pending. Nothing is on npm. Two components exist (`Box`, `Button`) as the minimum
surface the pipeline needs to be non-vacuous; real component work has not started, because F00 is
not finished.

## Numbers

- `pnpm check` runs **18 guards**; `prove-guards-fail` kills **44 mutations** on a staged copy.
- **246 tests**, 97% statements. `ci-gates.json` enumerates **19 gates** (12 wired, 7 pending, each
  bound to an open story); every TRD Section 9 gate is claimed by number.
- **52 decisions** recorded. `main` is the only branch - this project is trunk-based.
- Published to npm: **nothing**. `NPM_TOKEN` is not set, which is deliberate ordering.

## How work lands here

Trunk-based: commit to `main`, no feature branches, no PR required. The gates are what make that
safe. Releasing is a deliberate local act - `pnpm changeset version`, read the diff, commit, push;
CI publishes only when no changeset is pending (D0052).

## What is blocking what

| Blocker | Blocks | Note |
| --- | --- | --- |
| **Operator sign-off** | Closing EP-01M0GKNH | Four units have every AC passing but cannot reach Done: the author never records their own verdict. Evidence is in `reviews/RV-2026-08-22-run-01m0mfxj.md` and the round-2 review. |
| **US-01M0GMAE** (semantic token layer) | F01, and 27 waived contrast pairings | Planned as PL-01M0M9FC, not started. D0044 decided the TRD's tier 2 names win, so `tokens.public.lock.json` currently locks 15 keys under names that will change. |
| **US-01M0NJZN** (one chunk per client component) | Should land before F01 | D0048. The output shape is reachable from the exports map, so it is breaking after the first publish. |
| **US-01M0GMDV** (consumer apps) | Gate 14 | The only thing that proves the RSC boundary in a real App Router build. Absorbs BG-01M0MFMZ per D0042. |

## Sharp edges an agent will hit

- **The boundary mechanism has three oracles that deliberately do not share a reader** (D0051): the
  planner parses source with TypeScript's AST, the guard asserts placement from the bundle record,
  and a third reads the EMITTED bytes for client-only hooks. Do not "simplify" them into one - a
  single shared reader is exactly how two Criticals shipped green.
- **Never hand-roll a parser here.** Nine instances, nine defeats. TypeScript and `yaml` are both
  already dependencies.
- **A guard ships with its fail-proof in the same commit.** Three guards once went a run unproven
  and an adversarial reviewer broke all three on the first attempt.
- **The skill's retro parser cannot read this project's ids.** `ARTEFACT_ID_RE` requires four
  digits; `artifact.py` allocates ULIDs (`CR-01M0MK20`). So the retro's "filed" disposition and its
  known-issues rulings are unreachable, and the close reports them as malformed. Not a project
  defect - worth raising against the skill.

## Open items

- **CR-01M0HWDQ** (CSS Modules) - approved, scheduled with F01 (D0050).
- **BG-01M0MFMZ** - approach changed (D0042): verify in a real consumer, not another oracle rewrite.
- **RUN-01M0MFXJ** is mid-close and past its round cap; its remaining items are named in RETRO-0001.
- `daniel-achebe` persona card is provisional-unverified.
