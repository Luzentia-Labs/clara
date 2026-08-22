# US-01M0GMWF: Changesets, semver policy, and automated publish

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .changeset/, .github/workflows/release.yml, @changesets/cli, CONTRIBUTING.md
> **Points:** 5

## User Story

**As a** Sofia Marchetti
**I want** releases driven by changesets with provenance attestation
**So that** consumers can verify where a package came from and know what an upgrade will do

## Context

### Persona Reference

**Sofia Marchetti** - runs Clara in three applications and needs to know, before upgrading, whether
a release can break her.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Releases are immutable. A bad one is fixed forward with a patch, never unpublished - so the publish
path is the one place in this project where a mistake cannot be taken back.

Two things follow. The publish workflow runs the **same gates CI does**, because a gate the release
path skips is advisory. And what counts as breaking is **written down**, because "nobody is using it
yet" is not a reason to ship a breaking change as a minor - it is a reason it gets discovered late.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| AGENTS.md | Releases | Immutable; fixed forward, never unpublished | AC3 - publish is main-only, on a green gate |
| D0021 | Semver | A tier 2 token VALUE change is a minor, batched, with a visual changelog | AC2 |
| D0025 | Versioning | v1.0 entry criteria and the 1.x support window | AC2 |
| PRD F21 | Semver | Tier 2 is covered by the breaking-change rule | AC2 |
| AGENTS.md | Secrets | `NPM_TOKEN` is the only publish secret; never committed | AC3 - referenced via `secrets`, never inlined |
| PRD | Security | No runtime env vars | The library reads none; this is CI-only config |

## Acceptance Criteria

### AC1: Changeset flow works

- **Given** a package change
- **When** I add a changeset and run version
- **Then** the version and changelog update correctly
- **Verify:** shell npx changeset status
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: Breaking-change policy is written

- **Given** the repo
- **When** I look for the policy
- **Then** the definition of breaking, the deprecation policy, and the v1.0 entry criteria and 1.x support window are documented (D0025)
- **Verify:** shell node scripts/check-release.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: Publish is CI-only with provenance

- **Given** the release workflow
- **When** a release runs
- **Then** it publishes only from main on a green gate, with npm provenance enabled
- **Verify:** shell node scripts/check-release.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Changesets, semver policy, and automated publish

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 5 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A `packages/**` change arrives with no changeset | CI fails. The changeset is what tells a consumer whether to upgrade. |
| The release workflow drops a gate CI runs | `check-release` fails - a gate the publish path skips is advisory |
| Someone enables publishing from a branch | Fails: publish is main-only, and a branch publish is not recoverable |
| A package loses `publishConfig.provenance` | Fails - the workflow flag alone attests nothing |
| A scoped package omits `access: public` | Fails: npm defaults a scoped package to restricted, so it would publish private |
| An app is versioned or published | Cannot: every app is in the changesets `ignore` list, by its real manifest name |
| A breaking change is proposed as a minor | Not machine-detectable. CONTRIBUTING.md defines what breaking means so the review has a standard to apply. |

> **Minimum edge cases:** 5 for non-API stories - 7 recorded.

## Test Scenarios

- [ ] `changeset status` runs and reports the pending bump
- [ ] A `packages/**` change with no changeset fails
- [ ] Apps are excluded from versioning by their real manifest names
- [ ] Publish is restricted to main
- [ ] The release workflow runs every gate CI runs
- [ ] Provenance is on in the workflow AND in all three manifests
- [ ] `access: public` is set on all three
- [ ] CONTRIBUTING.md documents breaking, deprecation, v1.0 criteria, and the support window

> **Minimum test scenarios:** 8 - 8 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMKD](US-01M0GMKD-ci-pipeline-the-fourteen-blocking-gates.md) | Blocks (satisfied) | The gate set the publish path mirrors | Review |
| [US-01M0GMYH](US-01M0GMYH-api-surface-report-gate.md) | Blocks (satisfied) | The surface report the version decision reads | Review |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `@changesets/cli` ^2.29 | Versioning | Pinned below 3.x - **D0039**, the fourth tool whose latest raised its Node floor above 20.19 |
| `changesets/action@v1` | CI | Standard |
| `NPM_TOKEN` | Secret | Referenced via `secrets`, never committed |

## Estimation

**Points:** 5
**Complexity:** Medium. The wiring is standard; the weight is in the policy, which is the artifact a
consumer actually relies on.

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

**Affects production runtime:** false today - nothing has been published.

*Reversal is `git revert`.* **This is the story that closes the envelope.** Once this workflow runs
once, every name in the published surface is permanent and no release can be withdrawn.

## Open Questions

None blocking.

**Honest limit:** neither workflow has ever executed. There is no remote, so the configuration is
authored and guarded but the run is unproven. `check-release` verifies the *shape* of the publish
path - main-only, gate parity, provenance in workflow and manifests - not that GitHub runs it.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Delivered in RUN-01M0MFXJ. changesets pinned to ^2.29 (D0039 - fourth tool over the Node floor), release.yml is main-only with provenance and full gate parity, CONTRIBUTING.md documents breaking/deprecation/v1.0/support window. `check-release` is the 16th guard - it caught two real gaps in my own workflow (size budgets and e2e missing from the publish path) and two bugs in itself (a regex that missed `- run:` lines, and substring matching that let `pnpm check:api` satisfy `pnpm check`). |
