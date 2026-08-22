# PL-01M0HXNX: Dual publishing with a closed exports map - Implementation Plan

> **Status:** Complete
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GMFB](../stories/US-01M0GMFB-dual-publishing-with-a-closed-exports-map.md)
> **Epic:** [EP-01M0GKNH: Toolchain and release pipeline](../epics/EP-01M0GKNH-toolchain-and-release-pipeline.md)
> **Language:** JSON manifests and licence text; no application code
> **Points:** 5
> **Affects:** packages/tokens/LICENSE, packages/icons/LICENSE, packages/react/LICENSE, packages/tokens/package.json, packages/icons/package.json, packages/react/package.json

## Overview

Five of this story's six acceptance criteria already pass, delivered by US-01M0GM9N: the exports
maps are closed and wildcard-free, `publint` is clean, the guard fails on a wildcard, the `require`
condition declares `./dist/index.d.cts`, and `attw` reports no FalseCJS.

What remains is **AC6**: every published tarball must carry its licence text. All three manifests
declare `"license": "MIT"` while the only licence file in the repository is at the root, so each
tarball would claim MIT and carry no licence at all. For a public library that is a real defect,
not cosmetic - it is the difference between a stated licence and a granted one.

This plan therefore covers one AC, plus the verification hardening that AC6 turned out to need.

## Acceptance Criteria Summary

| AC | Name | State entering this story |
| --- | --- | --- |
| AC1 | Exports are enumerated | Passing (US-01M0GM9N) |
| AC2 | publint is clean | Passing (US-01M0GM9N) |
| AC3 | A wildcard fails CI | Passing (US-01M0GM9N) |
| AC4 | require declares CJS types | Passing - regression pin for BG-01M0HTRM |
| AC5 | attw reports no FalseCJS | Passing - regression pin for BG-01M0HTRM |
| AC6 | Tarballs carry licence text | **FAILING - this plan's work** |

---

## Specification delta (engagement floor)

Six files, so the interactions are named before any change.

| # | Existing requirement it interacts with | Interaction | Resolution |
| --- | --- | --- | --- |
| 1 | `files: ["dist"]` on all three manifests | A root-level LICENSE is outside `dist`. The obvious reading is that `files` must grow an entry. | **It must not.** npm always includes `LICENSE`, `README`, and `package.json` from the package root regardless of `files` - confirmed empirically below, not assumed. Adding `LICENSE` to `files` would be a no-op that implies `files` controls something it does not. `files` is left untouched. |
| 2 | Root `LICENSE` (MIT, Luzentia Labs, 2026) | Three packages need the same text. A symlink would avoid duplication. | **Copy, not symlink.** npm does not reliably follow a symlink into a tarball, so a symlink risks publishing a broken link - the exact failure this AC exists to prevent. Three identical copies is the boring, correct answer. |
| 3 | AC6's authored verifier checks `existsSync(packages/*/LICENSE)` | It tests a proxy (a file on disk) rather than the property the AC states (the file is in the tarball). A `.npmignore` or a `files` change could later exclude it and the verifier would still pass. | **Strengthen the verifier** to pack each package and assert LICENSE is in the tarball contents. Same class of fix as PL-01M0HRA0's AC3 and PL-01M0HVR8's AC3: a verifier that cannot fail is the defect the test strategy exists to prevent. |
| 4 | Publishing is a one-way door (D0001-D0008) | Licence text is not API and is freely changeable, so this interaction is benign. | Noted and dismissed explicitly. No permanence risk. |
| 5 | CR-01M0HT8N, superseded into this story's AC6 | The CR is already terminal, pointing here. | AC6 passing is what makes that supersession honest. No CR reopening needed. |
| 6 | TRD Section 9 gate 10 (`publint`) | `publint` does not check for a licence FILE, only the `license` FIELD - which is why this defect survived the scaffold review's own gate run. | The tarball assertion in interaction 3 is the enforcement point, since publint will never provide one. |

Interactions named: 6. Resolved: 6. Unresolved: 0.

---

## Recommended Approach

**Strategy:** Test-first, unusually for this epic. AC6 already fails against a real runner, so the
failing test exists before the change - the ideal case D0024 describes as natural rather than
ceremonial. Harden the verifier first (it should still fail, for the right reason), then make it pass.

---

## Implementation Phases

### Phase 1: Harden AC6's verifier before fixing anything

1. Replace AC6's `existsSync` check with one that packs each package and inspects tarball contents.
2. Run it. It must still FAIL - now proving the tarball lacks a licence rather than that a path is
   absent. A verifier that changes from pass to fail here would mean the original was wrong in the
   other direction.

### Phase 2: Give each package its licence

1. Copy the root `LICENSE` verbatim into `packages/tokens/`, `packages/icons/`, `packages/react/`.
2. Do **not** touch `files` (interaction 1).
3. Confirm `npm pack --dry-run` lists LICENSE for each package.

### Phase 3: Confirm nothing else moved

1. AC1-AC5 still pass (they are regression pins for BG-01M0HTRM; a manifest edit is exactly what
   would break them).
2. `pnpm check` still passes all four guards.
3. `publint` still clean on all three.

---

## Edge Case Handling Plan

| # | Edge case | Handling |
| --- | --- | --- |
| 1 | A future `.npmignore` excludes LICENSE | Phase 1's tarball assertion catches it; the `existsSync` form would not. |
| 2 | `files` is later narrowed | Same assertion covers it. |
| 3 | The root LICENSE and a package copy drift | Out of scope. Worth a guard later; noted, not silently assumed handled. |

---

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Packing in the verifier is slow (three `pnpm pack` runs) | Acceptable: it runs on the AC gate, not per-test. Measured in Phase 1; if it exceeds the verify timeout, fall back to `npm pack --dry-run`, which does no I/O. |
| 2 | Editing manifests breaks AC4/AC5 | Phase 2 does not edit manifests at all. Phase 3 re-runs the full AC set regardless. |

---

## Definition of Done

- AC6 passes against the hardened verifier; AC1-AC5 still pass.
- `pnpm check` 4/4, `publint` clean, `attw` exit 0 on all three.
- Licence drift between root and packages recorded as a follow-up if not guarded.

---

## Implementation Deviations

| # | Plan said | Actual | Why |
| --- | --- | --- | --- |
| 1 | Harden AC6's verifier inline | Wrote `scripts/check-license.mjs` and pointed AC6 at it | The assertion needed to pack a tarball, read the packed licence, and compare it to the root - too much for a `node -e` one-liner, and it belongs in the check suite where CI can run it anyway. |
| 2 | (not planned) | Wired `check:license` into `pnpm check` | The guard is only worth writing if it runs. `pnpm check` is now 5 guards, not 4. |
| 3 | (not planned) | The guard also asserts byte-equality with the root LICENSE | Nearly free once it was already reading the packed file, and it closes the drift edge case the story had recorded as unguarded. The story's edge-case table was corrected rather than left claiming otherwise. |
| 4 | (not planned) | The guard iterates `readWorkspace()` rather than the three known packages | A fourth package is covered the moment it exists. It still inherits the hardcoded-roots limitation US-01M0GMKD AC5 fixes. |

### Interaction outcomes

1. **Confirmed empirically, not assumed** - `npm pack --dry-run` lists LICENSE with `files: ["dist"]` untouched. `files` was not modified.
2. **Honoured** - three verbatim copies, no symlink.
3. **Delivered** - AC6 now asserts tarball contents. It was run BEFORE the fix and failed for the right reason (tarball carries no licence), not the old reason (path absent).
4. **Dismissed explicitly** - licence text is not API; no permanence risk.
5. **Honoured** - CR-01M0HT8N's supersession into AC6 is now honest, because AC6 passes.
6. **Addressed** - `publint` checks the license FIELD, never the FILE, which is exactly why this defect survived the scaffold review. `check-license` is the enforcement point publint will never provide.

### Regression check

AC1-AC5 re-verified after the change: 6/6 on this story, and US-01M0GM9N (3/3) and US-01M0GMPJ
(3/3) re-run unchanged. The BG-01M0HTRM pins (AC4/AC5) still hold.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-21 | sdlc-studio | Plan authored: 3 phases, 6 interactions resolved. Scope is AC6 only - AC1-AC5 were delivered by US-01M0GM9N and stand as regression pins. |
| 2026-08-21 | sdlc-studio | Implemented. AC6 delivered test-first; 6/6 verified; 4 deviations recorded; `pnpm check` is now 5 guards. |
