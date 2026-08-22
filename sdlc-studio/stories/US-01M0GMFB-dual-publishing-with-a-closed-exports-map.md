# US-01M0GMFB: Dual publishing with a closed exports map

> **Status:** Done
> **Verification depth:** deep
> **Author:** sdlc-studio; agent; v1
> **Plan:** PL-01M0HXNX
> **Supersedes:** BG-01M0HTRM, CR-01M0HT8N
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./packages/react/package.json, packages/tokens/package.json, packages/icons/package.json, scripts/check-exports.mjs, packages/tokens/LICENSE, packages/icons/LICENSE, packages/react/LICENSE
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** closed exports maps with no wildcard
**So that** no subpath becomes public API by accident, since every reachable subpath is permanent

## Context

### Persona Reference

**Sofia Marchetti** - full-stack developer building internal ERP applications; has lost a week per
project to libraries that resolve differently in her app than they did in their own docs.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Everything reachable from a published package is a permanent promise. A wildcard in an exports map
publishes the whole `dist` tree as API by accident; a `license` field with no licence file states a
grant it does not make; a single `.d.ts` served to both module conditions hands a `require`
consumer ESM-shaped types.

Five of the six criteria here were delivered by US-01M0GM9N as a consequence of building the
pipeline. What remains is the licence, which no gate in the project would have caught: `publint`
checks the `license` FIELD, never the FILE.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Packaging | Publishing is a one-way door; every reachable subpath is permanent (D0001-D0008) | AC1/AC3 keep the map closed. Licence text is NOT API, so AC6 carries no permanence risk. |
| TRD S5 | Public surface | The closed exports table is the whole published surface | AC1 asserts the map matches it exactly |
| TRD S5 | Public surface | `tokens.pairings.json` is not published (D0029) | Already honoured: it is written to `build/`, never `dist/` |
| TRD S9 g10 | Correctness | `publint` and `attw` fail CI on any error | AC2/AC5. Neither tool checks for a licence file, which is why AC6 needs its own assertion. |
| AGENTS.md | Legal | Published to public npm under `@luzentialabs` | AC6: a tarball claiming MIT with no licence text grants nothing |
| PRD | Performance | Per-component budgets apply to JavaScript only | Not applicable - this story adds no JavaScript |
| PRD | Security | No runtime environment variables or network calls | Not applicable - manifests and licence text only |

## Acceptance Criteria

### AC1: Exports are enumerated

- **Given** each package.json
- **When** I read the exports map
- **Then** only the subpaths listed in TRD Section 5 appear, and no `./*` wildcard
- **Verify:** shell node scripts/check-exports.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC2: publint is clean

- **Given** the built packages
- **When** I run `publint`
- **Then** zero errors
- **Verify:** shell pnpm check:publint
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC3: A wildcard fails CI

- **Given** an exports map
- **When** a `./*` wildcard is introduced
- **Then** the CI check fails
- **Verify:** shell node scripts/prove-guards-fail.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC4: The require condition declares CJS-shaped types

- **Given** each package manifest under `"type": "module"`
- **When** I read the `.` export
- **Then** the `require` condition carries its own `types` pointing at `./dist/index.d.cts`, distinct from the `import` condition's `./dist/index.d.ts`
- **Verify:** shell node -e "for(const n of ['tokens','icons','react']){const e=JSON.parse(require('fs').readFileSync('./packages/'+n+'/package.json'))['exports']['.'];if(!e.require||e.require.types!=='./dist/index.d.cts')process.exit(1)}"
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC5: attw reports no false module-shape diagnostic

- **Given** the packed tarball for each package
- **When** I run `attw --pack`
- **Then** it exits zero, with no false module-shape diagnostic. (Reverting the `require` condition produces **FalseESM** - "Import resolved to an ESM type declaration file, but a CommonJS JavaScript file" - not FalseCJS; the original wording named the wrong direction.)
- **Verify:** shell npx --yes @arethetypeswrong/cli --pack packages/react --profile node16 --exclude-entrypoints ./styles.css
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC6: Every published tarball carries its licence text

- **Given** `files: ["dist"]` and `license: "MIT"` on each package manifest
- **When** I pack the package
- **Then** the tarball contains a LICENSE file
- **Verify:** shell node scripts/check-license.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

> **Three verifiers were replaced after an independent review (F2, F5).** AC3 previously ran
> `check-exports.mjs` on a clean tree and asserted exit 0 - the opposite of the proposition it
> states. The reviewer replaced the guard with a script that only printed its PASS banner and the
> AC still reported pass. It now runs `prove-guards-fail.mjs`, which introduces a wildcard and
> asserts the guard exits non-zero. AC2 and AC5 previously covered `packages/react` alone; making
> `packages/icons` ESM-only produced a manifest pointing at a non-existent `dist/index.cjs` that
> publint rejected while the AC gate stayed green. AC2 and AC5 now run `pnpm check:publint` and
> `pnpm check:attw`, which each iterate all three packages.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Dual publishing with a closed exports map

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Absorbed findings.** This story carries the fix for BG-01M0HTRM (attw FalseCJS: one `.d.ts` served to both
conditions) as AC4-AC5, and the missing-LICENSE finding from CR-01M0HT8N as AC6. Both were raised by the
anton-reis seat in the US-01M0GMPJ delivery review and folded here on the operator's call rather than
delivered standalone, because this story rewrites the same three manifests.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A `./*` wildcard is added to an exports map | `check-exports` fails and blocks the merge. The whole `dist` tree becoming API by accident is unrecoverable once published. |
| A `.npmignore` is added later that excludes LICENSE | **Cannot occur** - npm always packs LICENSE regardless of `.npmignore`, confirmed empirically by the reviewer. The tarball assertion is still the right design (it kills a deleted and a drifted licence), but this was never a reason for it. |
| `files` is narrowed in a later change | LICENSE still packs, so `check-license` passes - correctly. `publint` is what catches a narrowed `files`, exiting 1 on every now-missing entry point. Different gate, and it works. |
| The root LICENSE is updated but the package copies are not | `check-license` compares each packaged licence byte-for-byte against the root LICENSE and fails on drift. Guarded after all - the guard was cheap once it was already packing the tarball. |
| A package is added to the workspace without a LICENSE | Caught: `check-license` iterates `readWorkspace()` rather than a hardcoded list, so any new non-private package is covered the moment it exists. It still inherits the hardcoded-roots limitation in `scripts/lib/workspace.mjs` that US-01M0GMKD AC5 fixes. |
| The `require` condition is reverted to a shared `.d.ts` | AC5 fails - attw reports FalseCJS. That is the regression pin for BG-01M0HTRM. |

> **Minimum edge cases:** 8 for API stories, 5 for others - not an API story; 6 recorded.

## Test Scenarios

- [ ] Every exports map contains only the subpaths in the TRD Section 5 closed table
- [ ] No exports map contains a `./*` wildcard
- [ ] Introducing a wildcard makes `check-exports` exit non-zero
- [ ] `publint` is clean for all three packages
- [ ] The `.` export's `require` condition points at `./dist/index.d.cts`, not `./dist/index.d.ts`
- [ ] `attw` reports no FalseCJS for any package
- [ ] `packages/tokens` packs a tarball containing a LICENSE file
- [ ] `packages/icons` packs a tarball containing a LICENSE file
- [ ] `packages/react` packs a tarball containing a LICENSE file
- [ ] Each packaged LICENSE is byte-identical to the repository root LICENSE

> **Minimum test scenarios:** 10 for API stories, 8 for UI - 10 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM9N](US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md) | Blocks (satisfied) | A real `dist` to pack, and the `.d.cts` emission AC4/AC5 assert | Review |
| [US-01M0GMPJ](US-01M0GMPJ-pnpm-workspace-and-repository-scaffold.md) | Blocks (satisfied) | The closed exports maps and `check-exports` | Done |
| [US-01M0GMKD](US-01M0GMKD-ci-pipeline-the-fourteen-blocking-gates.md) | Follows | Wires publint/attw as blocking CI gates; this story only proves they pass locally | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `publint` | Verification, via `npx` | Available |
| `@arethetypeswrong/cli` | Verification, via `npx` | Available |
| `npm pack` | Verification (bundled with Node) | Available |

## Estimation

**Points:** 5
**Complexity:** Low as it now stands. The 5 was sized when the story owned the whole dual-publishing
surface; US-01M0GM9N delivered five of its six criteria as a by-product of building the pipeline,
leaving the licence. The estimate is left at 5 rather than revised down, because velocity is
measured against what was committed, and silently reducing a delivered story flatters the number.

> **Points** are a RELATIVE size on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20) - not
> "how long will this take" but "is this bigger than that one", sized against stories already
> delivered. The gaps widen deliberately, because uncertainty grows with size: it is much harder
> to argue a story is a 7 rather than an 8 than to choose between a 5 and an 8. A value off the
> scale is REFUSED, never rounded - the scale IS the estimate. Above 8, SPLIT the story;
> estimator consistency collapses beyond it, so a bigger number is a triage failure rather than
> a harder estimate. This is the one size vocabulary: the planner, the forecast and the measured
> velocity all read this field.

## Rollback Envelope

> Required when `affects_production_runtime: true`; optional otherwise. See `reference-story.md#rollback-envelope`.

**Affects production runtime:** false

*Not applicable - nothing is published by this story.* The packages remain at `0.0.0` and
unpublished. Reversal is `git revert`. Adding licence text is additive and carries no consumer
impact even after publication.

## Open Questions

None. The one judgement call - copy the licence text rather than symlink it - is settled in
`PL-01M0HXNX` interaction 2: npm does not reliably follow a symlink into a tarball, so a symlink
risks publishing a broken link, which is the exact failure AC6 exists to prevent.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Absorbed BG-01M0HTRM (AC4-AC5) and the LICENSE finding of CR-01M0HT8N (AC6); points 3 -> 5 |
| 2026-08-21 | sdlc-studio | Promoted planning -> full; filled the 8 deferred sections to clear the In Progress gate |
| 2026-08-21 | sdlc-studio | AC6 delivered: per-package LICENSE plus `scripts/check-license.mjs`, which asserts tarball contents and byte-equality with the root licence |
| 2026-08-21 | sdlc-studio | REJECT from anton-reis repaired: AC3 now runs `prove-guards-fail.mjs` and asserts the guard exits non-zero on an injected wildcard (F2); AC2/AC5 widened to all three packages via `check:publint` / `check:attw` (F5); two unreachable edge-case rows corrected (F12); FalseCJS renamed to FalseESM (F15). |
| 2026-08-21 | sdlc-studio | Second REJECT repaired: `prove-guards-fail.mjs` (which AC3 runs) rewritten to stage a temp copy - it no longer writes to the working tree. Verified against 12 SIGINT interrupts and 8 concurrent runs with tracked files byte-identical throughout (N5). It now also distinguishes a guard that rejected a mutation from one that crashed. |
| 2026-08-21 | sdlc-studio | Third REJECT repaired. R8: `prove-guards-fail` extended from 4 guards to 11 named mutations, now covering the output guards where both Criticals lived. R9 (temp-dir leak on signal), R11, R12 fixed. |
