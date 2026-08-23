# Where Clara stands

> **Updated:** 2026-08-23 (close of RUN-01M0P7YW)
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

**EP-01M0GKNH (toolchain and release pipeline) is Done - all 12 stories.** CI and the release path
both execute on `main` and the release path correctly declines to publish while a changeset is
pending. Nothing is on npm. The semantic token layer has landed and **the contrast waiver is zero**:
all 48 legal pairings are measured and passing in both themes. Two components exist (`Box`,
`Button`) as the minimum surface the pipeline needs to be non-vacuous; real component work still
waits on the rest of F00.

## Numbers

- `pnpm check` runs **20 guards**; `prove-guards-fail` kills **48 mutations** on a staged copy.
- **272 tests**, 97.1% statements. `ci-gates.json` enumerates **19 gates** (14 wired, 5 pending,
  each bound to an open story); every TRD Section 9 gate is claimed by number.
- **55 decisions**. Stories: **15 Done of 88**. `main` is the only branch - this project is
  trunk-based.
- **48 contrast pairings, 0 waived** (high-water mark 27, and it may only shrink).
- Published to npm: **nothing**. `NPM_TOKEN` is not set, which is deliberate ordering.

## How work lands here

Trunk-based: commit to `main`, no feature branches, no PR required. The gates are what make that
safe. Releasing is a deliberate local act - `pnpm changeset version`, read the diff, commit, push;
CI publishes only when no changeset is pending (D0052).

## What is blocking what

| Blocker | Blocks | Note |
| --- | --- | --- |
| **Operator sign-off** | Closing EP-01M0GKNH | Four units have every AC passing but cannot reach Done: the author never records their own verdict. Evidence is in `reviews/RV-2026-08-22-run-01m0mfxj.md` and the round-2 review. |
| **The rest of F00** | F01 | `EP-01M0GKNG` is 3 of 8: tier-enforcement lint (US-01M0GME0), theming (US-01M0GM5M), density (US-01M0GMC6), typography (US-01M0GMT2) and the F00 pass itself (US-01M0GMN0) remain. |

## Sharp edges an agent will hit

- **The boundary mechanism has three oracles that deliberately do not share a reader** (D0051): the
  planner parses source with TypeScript's AST, the guard asserts placement from the bundle record,
  and a third reads the EMITTED bytes for client-only hooks. Do not "simplify" them into one - a
  single shared reader is exactly how two Criticals shipped green.
- **Never hand-roll a parser here.** Nine instances, nine defeats. TypeScript and `yaml` are both
  already dependencies.
- **A guard ships with its fail-proof in the same commit.** Three guards once went a run unproven
  and an adversarial reviewer broke all three on the first attempt.
- **Tier is decided by the tier MANIFEST, never by a name prefix.** Three guards keyed on the string
  `semantic-` and went silently vacuous the moment D0044 renamed tier 2. Same rule as the boundary
  oracles: do not infer a category from a name.
- **The palette is SOLVED, not chosen.** `generate-semantic.mjs` walks candidate ramp steps until all
  48 pairings pass. Do not hand-edit `src/semantic/color.json` or `src/themes/dark.json` - they are
  generated, and a hand-picked hex cannot be re-derived when a ramp changes.
- **The skill's retro parser cannot read this project's ids.** `ARTEFACT_ID_RE` requires four
  digits; `artifact.py` allocates ULIDs (`CR-01M0MK20`). So the retro's "filed" disposition and its
  known-issues rulings are unreachable, and the close reports them as malformed. Not a project
  defect - worth raising against the skill.

## Open items

- **CR-01M0HWDQ** (CSS Modules) - approved, scheduled with F01 (D0050).
- **BG-01M0MFMZ** - approach changed (D0042): verify in a real consumer, not another oracle rewrite.
- **RUN-01M0MFXJ** is mid-close and past its round cap; its remaining items are named in RETRO-0001.
- `daniel-achebe` persona card is provisional-unverified.
