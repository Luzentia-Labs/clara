# US-01M0GMPJ: pnpm workspace and repository scaffold

> **Status:** Ready
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./package.json, packages/react/package.json, pnpm-workspace.yaml
> **Points:** 2

## User Story

**As a** Sofia Marchetti
**I want** a pnpm workspace with the package and app layout in place
**So that** every later story has a home to be built in

## Acceptance Criteria

### AC1: Workspace resolves

- **Given** a clean clone
- **When** I run `pnpm install`
- **Then** every workspace package resolves and links
- **Verify:** shell pnpm install --frozen-lockfile
- **Verification target:** functional

### AC2: Layout matches the TRD

- **Given** the repo root
- **When** I list the tree
- **Then** `packages/{tokens,icons,react}` and `apps/{storybook,docs,reference-app,verify-vite,verify-next}` exist
- **Verify:** file packages/react/package.json
- **Verification target:** functional

### AC3: Dependency direction is enforced

- **Given** the workspace graph
- **When** a package imports upward
- **Then** the build fails rather than warning
- **Verify:** shell pnpm -r exec node -e "process.exit(0)"
- **Verification target:** functional

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

## Open Questions

_None. Layout, package names (D0001), and build tooling (D0009, D0028) are all settled._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
