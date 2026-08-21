# US-01M0GMPJ: pnpm workspace and repository scaffold

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./package.json, packages/react/package.json, pnpm-workspace.yaml
> **Points:** 2

## User Story

**As a** Sofia Marchetti
**I want** a pnpm workspace with the package and app layout in place
**So that** every later story has a home to be built in

## Context

### Persona Reference

**Sofia Marchetti** - Full-stack developer building internal ERP applications. Reads types in autocomplete far more often than documentation, and treats a library whose source she must read as a library that failed.
[Full persona details](../personas.md#sofia-marchetti)

### Background

The first code in the repository. Nothing exists to follow, so everything this story establishes becomes the pattern - which is why the three guards are written now rather than added after something has already drifted.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Sequencing | This epic must reach a green, red-capable gate before the sprint loop can run at all (reference-sprint.md:38) | Each guard is mutation-checked: a check that cannot fail would hand the loop a gate that cannot go red |
| PRD | Performance | None at this layer - no runtime code ships | n/a |
| PRD | Security | Supply chain is Clara's whole threat surface (TRD Section 11) | Lockfile committed; `strict-peer-dependencies=true`; every app private so a mis-publish is impossible |

## Acceptance Criteria

### AC1: Workspace resolves

- **Given** a clean clone
- **When** I run `pnpm install`
- **Then** every workspace package resolves and links
- **Verify:** shell pnpm install --frozen-lockfile
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC2: Layout matches the TRD

- **Given** the repo root
- **When** I list the tree
- **Then** `packages/{tokens,icons,react}` and `apps/{storybook,docs,reference-app,verify-vite,verify-next}` exist
- **Verify:** file packages/react/package.json
- **Verified:** yes (2026-08-21)
- **Verification target:** functional

### AC3: Dependency direction is enforced

- **Given** the workspace graph
- **When** a package imports upward
- **Then** the build fails rather than warning
- **Verify:** shell node scripts/check-layers.mjs
- **Verified:** yes (2026-08-21)
- **Verification target:** functional
- **Mutation-checked:** making `clara-tokens` depend on `clara-react` turns `check-layers` red (exit 1); restored, exit 0

> The original verifier (`pnpm -r exec node -e "process.exit(0)"`) exited 0 whether or not a cycle
> existed - it proved the workspace could run a command, not that the layer order held. Replaced in
> PL-01M0HRA0 Phase 5 with a check that can actually fail.

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- pnpm workspace and repository scaffold

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| # | Scenario | Expected Behaviour |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Groomed to Ready: edge cases, test scenarios, dependencies |
| 2026-08-21 | sdlc-studio | Implemented via PL-01M0HRA0. AC3's verifier replaced - the original could not fail. All 3 guards mutation-checked. |
| 1 | `pnpm install` run with a stale or absent lockfile | `--frozen-lockfile` fails loudly rather than silently resolving new versions. A library's lockfile drift is how a transitive dependency changes without anyone deciding it |
| 2 | A workspace package declares a dependency on a package above it in the layer order (`tokens` importing from `react`) | The build fails, naming both packages and the direction. A cycle is a build failure, not a code-review catch |
| 3 | A package is added under `packages/` without a `package.json` | `pnpm install` reports it as an unmatched workspace glob rather than skipping it silently |
| 4 | Two packages declare different versions of the same peer dependency (React) | Install surfaces the peer conflict. Two Reacts in a consumer's tree is a class of bug that is very hard to diagnose downstream |
| 5 | A developer runs a package script from the repo root expecting it to filter | Root scripts either apply to all workspaces via `-r` or fail with a message naming the filter needed - never silently act on one package |
| 6 | Node version differs from the one the toolchain expects | `engines` is declared and install warns; CI pins the version so local and CI cannot diverge unnoticed |
| 7 | An app under `apps/` is added to the workspace and accidentally published | Every app declares `"private": true`, so a publish attempt is refused by npm |

## Test Scenarios

- [ ] `pnpm install --frozen-lockfile` succeeds on a clean clone
- [ ] Every workspace package resolves and links; `pnpm -r list` shows all of them
- [ ] The directory layout matches TRD Section 3 exactly
- [ ] An upward dependency (tokens -> react) fails the build
- [ ] Every `apps/*` package declares `"private": true`
- [ ] React appears as a peer dependency in `clara-react`, never as a direct one
- [ ] `engines.node` is declared and matches the version CI pins

## Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| None | - | This story is the root of the dependency graph |

## Estimation

**Points:** 2
**Complexity:** Low - configuration and three small scripts, no application logic

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

| Component | Reversal | Expected time |
| --- | --- | --- |
| Workspace scaffold (config only) | `git revert` - no external state, nothing published or deployed | under 1 minute |

If `affects_production_runtime: false`, replace with: *Not applicable – story does not change runtime behaviour.*

## Open Questions

_None. Layout, package names (D0001), and build tooling (D0009, D0028) are all settled._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
