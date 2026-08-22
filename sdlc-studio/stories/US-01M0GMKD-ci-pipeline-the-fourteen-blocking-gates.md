# US-01M0GMKD: CI pipeline: the fourteen blocking gates

> **Status:** Review
> **Supersedes:** CR-01M0HT8N
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/ci.yml, @changesets/cli, origin/main, scripts/lib/workspace.mjs
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** every gate defined in the TRD and TSD to run on each PR and block the merge
**So that** a defined gate with no enforcement point is not a gate

## Context

### Persona Reference

**Sofia Marchetti** - depends on Clara not shipping a regression she has to discover in her own app.
[Full persona details](../personas/sofia-marchetti.md)

### Background

The TSD says it "defines no gate without an enforcement point". Seven of the fourteen gates have no
runnable command yet, so this story had a choice between two dishonest options - omit them, and a
fourteen-gate contract reads as an eight-gate one; or list them, and an unenforced gate reads as
passing. **D0038** takes a third: enumerate all of them, run the ones that exist, and make the gap
itself enforceable - a pending gate must name an OPEN story.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD S9 / TSD | CI | Fourteen gates, every one blocking | AC1/AC2, and D0038 for the seven not yet runnable |
| TSD | CI | "Defines no gate without an enforcement point" | The manifest guard IS the enforcement point for the gap |
| D0033 | Runtime | Node floor is 20.19 | CI pins `node-version: 20.19.0`, not `lts/*` |
| CR-01M0HT8N | Guards | Guards must read the workspace from `pnpm-workspace.yaml` | AC5 |
| PRD | Security | No runtime env or network | CI needs `NPM_TOKEN` only at publish (US-01M0GMWF) |

## Acceptance Criteria

### AC1: All fourteen run

- **Given** a pull request
- **When** CI executes
- **Then** every gate in TRD Section 9 runs
- **Verify:** shell node scripts/check-ci-gates.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: Every gate blocks

- **Given** a failing gate
- **When** CI completes
- **Then** the merge is blocked, not merely annotated
- **Verify:** shell node scripts/check-ci-gates.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: A changeset is required

- **Given** a PR touching packages/
- **When** no changeset is present
- **Then** CI fails
- **Verify:** manual the changeset gate lands with US-01M0GMWF; recorded pending in ci-gates.json rather than claimed
- **Verification target:** functional

### AC4: Audit is clean

- **Given** the dependency tree
- **When** I run `pnpm audit`
- **Then** no high or critical CVE in a runtime dependency
- **Verify:** shell pnpm audit --audit-level=high --prod
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC5: The guards read the workspace from pnpm-workspace.yaml

- **Given** a new workspace glob added to `pnpm-workspace.yaml`
- **When** any guard script runs
- **Then** it sees the packages under that glob, because it resolves the globs from the file rather than a hardcoded root list
- **Verify:** shell npx vitest run scripts/lib/__tests__/workspace-roots.test.ts
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

> **AC5's verifier was replaced.** As authored it asserted the string `['packages','apps']` does not
> appear in the source - but that pair is the legitimate FALLBACK when `pnpm-workspace.yaml` is
> absent, so the verifier forbade a correct implementation while proving nothing about behaviour.
> It now adds a third glob and asserts the guards see what is under it, and that a glob the
> conventional pair does not include is honoured while one it removes is dropped.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- CI pipeline: the fourteen blocking gates

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Absorbed findings.** AC5 carries the workspace-layout finding from CR-01M0HT8N: `scripts/lib/workspace.mjs`
hardcodes `['packages','apps']` instead of resolving the globs in `pnpm-workspace.yaml`, so a new workspace
root would be invisible to every guard at once - including `check-private`, which is what keeps an
unintended package from being publishable. Raised by the anton-reis seat in the US-01M0GMPJ delivery
review; folded here because this story owns guard correctness.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A gate is added to the TRD but not the manifest | Undetectable by definition - the manifest is the record. Reviewed at epic close, not automated. Stated rather than implied. |
| A pending gate's story is closed without the gate landing | Fails: the manifest names a terminal story |
| A wired gate is removed from ci.yml | Fails: the command appears nowhere |
| `continue-on-error: true` is added to weaken a gate | Fails: a gate that reports without blocking is not a gate |
| A new workspace glob is added | Every guard sees it (AC5) - previously all four went blind at once |
| CI runs on a Node newer than the floor | The floor is pinned exactly; D0033's pins assume it |

> **Minimum edge cases:** 5 for non-API stories - 6 recorded.

## Test Scenarios

- [ ] All fourteen TRD gates appear in `ci-gates.json`
- [ ] Every wired gate's command appears in `ci.yml`
- [ ] Every pending gate names a story that exists and is open
- [ ] A pending gate whose story is closed fails the guard
- [ ] A wired gate missing from the workflow fails the guard
- [ ] `continue-on-error: true` anywhere fails the guard
- [ ] A third workspace glob is visible to every guard
- [ ] `pnpm check` includes the manifest guard

> **Minimum test scenarios:** 8 - 8 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMYH](US-01M0GMYH-api-surface-report-gate.md) | Blocks (satisfied) | Gate 11's command | Review |
| [US-01M0GM3X](US-01M0GM3X-test-harness-vitest-rtl-axe-playwright-stryker-size.md) | Blocks (satisfied) | Gates 3, 4, 10 | Review |
| [US-01M0GMWF](US-01M0GMWF-changesets-semver-policy-and-automated-publish.md) | Follows | The changeset gate and the publish job | Draft |
| [US-01M0GMDV](US-01M0GMDV-consumer-verification-apps.md) | Follows | Gate 14 | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| GitHub Actions | CI runner | Workflow authored; unverified until a push exists |
| `pnpm/action-setup`, `actions/setup-node` | CI | Standard |

## Estimation

**Points:** 8
**Complexity:** Medium. The workflow is mechanical; the judgement was what to do about seven gates
with no command, which D0038 settles.

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

**Affects production runtime:** false - CI configuration only, nothing published.

*Reversal is `git revert`.*

## Open Questions

None. The one decision - how ci.yml represents seven gates with no runnable command - was deferred
through the sprint queue and resolved as **D0038** (enumerate all fourteen; bind each pending gate
to an open story).

**Honest limit:** this workflow has never executed. There is no remote and no push, so `ci.yml` is
authored and its manifest is verified, but the run itself is unproven until the first push.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Absorbed the workspace-layout finding of CR-01M0HT8N as AC5 |
| 2026-08-22 | sdlc-studio | Delivered in RUN-01M0MFXJ. ci.yml authored, `ci-gates.json` enumerates all 16 gates (9 wired, 7 bound to open stories), `check-ci-gates` is the 15th guard and fails on a closed pending story, a missing wired command, or `continue-on-error`. AC5 delivered: guards read workspace roots from pnpm-workspace.yaml. AC3 marked manual pending US-01M0GMWF rather than claimed. |
