# PL-01M0HRA0: pnpm workspace and repository scaffold - Implementation Plan

> **Status:** Draft
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GMPJ](../stories/US-01M0GMPJ-pnpm-workspace-and-repository-scaffold.md)
> **Epic:** [EP-01M0GKNH: Toolchain and release pipeline](../epics/EP-01M0GKNH-toolchain-and-release-pipeline.md)
> **Created:** 2026-08-21
> **Language:** TypeScript (config only - this story writes no application code)
> **Points:** 2

## Overview

Create the pnpm workspace: the directory layout from TRD Section 3, three package manifests, five
app manifests, and the constraints that make the layer order and the peer-dependency rule
structural rather than conventional.

This story writes **no TypeScript source**. It writes manifests, a workspace file, and three small
guard scripts. Its whole value is that everything after it inherits a correct shape, so the parts
worth care are the ones that are expensive to change later: package names (permanent once
published), the private flag on apps (a mis-publish cannot be undone), and React as a peer.

## Acceptance Criteria Summary

| AC | Name | Verifier |
| --- | --- | --- |
| AC1 | Workspace resolves | `shell pnpm install --frozen-lockfile` |
| AC2 | Layout matches the TRD | `file packages/react/package.json` |
| AC3 | Dependency direction is enforced | `shell pnpm -r exec node -e "process.exit(0)"` |

> **AC3's verifier is weak and is replaced in this plan.** `pnpm -r exec node -e "process.exit(0)"`
> exits 0 whether or not a cycle exists - it proves the workspace can run a command, not that the
> layer order holds. Phase 4 writes a real check and the story's Verify line is updated to call it.
> A verifier that cannot fail is the defect the whole test strategy exists to prevent.

---

## Technical Context

### Language and framework

- **Primary language:** TypeScript 5.x strict (declared here, exercised later)
- **Package manager:** pnpm 9+ with workspaces, no Turborepo (D0010)
- **Node:** 20 LTS+, pinned so local and CI cannot diverge
- **Test framework:** none yet - the harness is a separate story in this epic

### Relevant best practices

From `best-practices/typescript.md` and `javascript.md`, the parts that bind at this layer:

- Strict mode on from the first line; never `any` in a public signature
- `import type` for type-only imports, so the build can erase them
- Validate at boundaries - here, the boundary is the manifest schema, guarded by `publint` later

### Existing patterns

None. This is the first code in the repository. Everything it establishes becomes the pattern,
which is why the guards are written now rather than added once something has already drifted.

---

## Recommended Approach

**Strategy:** Test-after (D0024 - no keyboard interaction table).

**Rationale:** the acceptance criteria are structural facts about the repository, not behaviours of
a running unit. The honest test for "the workspace resolves" is running the install, so the checks
here are scripts and CI steps rather than unit tests. Two of the three guards are written in the
same phase as the thing they guard, which is as close to TDD as this story's shape allows.

### Test priority

1. The layer-order guard - it is the only AC whose failure is silent today
2. The private-flag guard - a mis-publish is irreversible (D0006, immutable releases)
3. The peer-dependency assertion - two Reacts in a consumer tree is a class of bug that is very
   hard to diagnose downstream and trivial to prevent here

---

## Implementation Phases

### Phase 1: Workspace root

Create `package.json` (private, no version), `pnpm-workspace.yaml`, `.npmrc`, and `tsconfig.base.json`.

- Root is `"private": true` and carries no `version` - it is never published
- `engines.node` pinned to the version CI uses (edge case 6)
- `packageManager` field pins the pnpm version so a contributor cannot silently use another
- `.npmrc`: `strict-peer-dependencies=true` so edge case 4 surfaces at install rather than at runtime

### Phase 2: Package manifests

Three manifests under `packages/`, named per D0001 and permanent once published:

| Directory | Name | Notes |
| --- | --- | --- |
| `packages/tokens` | `@luzentialabs/clara-tokens` | No React dependency of any kind |
| `packages/icons` | `@luzentialabs/clara-icons` | React as peer; depends on tokens |
| `packages/react` | `@luzentialabs/clara-react` | React as peer; depends on icons and tokens |

Each declares `"private": false`, `"publishConfig": {"access": "public"}`, `sideEffects`, and a
placeholder `exports` map with **no `./*` wildcard** - the closed map is a separate story, but the
wildcard must never exist even briefly, because a published wildcard is permanent.

### Phase 3: App manifests

Five under `apps/`: `storybook`, `docs`, `reference-app`, `verify-vite`, `verify-next`.

Every one is `"private": true`. This is the single most consequential line in the phase: an app
published by accident cannot be unpublished, only deprecated.

### Phase 4: The three guards

Small Node scripts under `scripts/`, each wired to CI in the pipeline story:

| Script | Asserts | Replaces |
| --- | --- | --- |
| `check-layers.mjs` | The dependency graph respects tokens <- icons <- react, and contains no cycle. Reads each manifest's deps and walks the graph | AC3's placeholder verifier |
| `check-private.mjs` | Every `apps/*` manifest has `"private": true` | Edge case 7 |
| `check-peers.mjs` | React appears only as a peer dependency, never a direct one, in every published package | Edge case 4 |

Each guard is **mutation-checked before it counts**: introduce the fault it is meant to catch,
confirm the script exits non-zero, restore. A guard never seen to fail is not a guard.

### Phase 5: Update the story's AC3 verifier

Replace `shell pnpm -r exec node -e "process.exit(0)"` with `shell node scripts/check-layers.mjs`
in the story file, and record the mutation-check result on the AC.

---

## Edge Case Handling Plan

All 7 story edge cases are handled. Unhandled: 0.

| # | Edge Case | Handling Strategy | Phase |
| --- | --- | --- | --- |
| 1 | Stale or absent lockfile | `--frozen-lockfile` in CI; lockfile committed | 1 |
| 2 | Upward dependency between packages | `check-layers.mjs` walks the graph and fails on a violation or cycle | 4 |
| 3 | Package without a manifest | `pnpm-workspace.yaml` globs `packages/*`; install reports an unmatched entry | 1 |
| 4 | Conflicting peer versions | `strict-peer-dependencies=true` plus `check-peers.mjs` | 1, 4 |
| 5 | Root script run without a filter | Root scripts use `-r` explicitly, or fail naming the filter needed | 1 |
| 6 | Node version divergence | `engines.node` + `packageManager` pinned; CI uses the same version | 1 |
| 7 | An app published by accident | `"private": true` on every app; `check-private.mjs` asserts it | 3, 4 |

---

## Files to Create

| Path | Purpose |
| --- | --- |
| `package.json` | Workspace root, private, engines and packageManager pinned |
| `pnpm-workspace.yaml` | Workspace globs |
| `.npmrc` | `strict-peer-dependencies=true` |
| `tsconfig.base.json` | Strict mode, shared by every package |
| `packages/{tokens,icons,react}/package.json` | Three published manifests |
| `packages/{tokens,icons,react}/tsconfig.json` | Extends the base |
| `apps/{storybook,docs,reference-app,verify-vite,verify-next}/package.json` | Five private apps |
| `scripts/check-layers.mjs` | Layer-order and cycle guard |
| `scripts/check-private.mjs` | Private-flag guard |
| `scripts/check-peers.mjs` | Peer-dependency guard |

No existing file is modified except the story, in Phase 5.

---

## Risks

- **Package names are permanent from the first publish.** Nothing here publishes, but the names are
  set now and every later story inherits them. `@luzentialabs` was verified unused on 2026-08-21
  (D0001); if the org turns out to be claimed, this is the cheapest moment to find out. Worth
  running `npm org create luzentialabs` before Phase 2 rather than after.
- **A placeholder `exports` map can leak a wildcard.** Writing `"./*"` even as a temporary
  convenience creates a public subpath the moment anything publishes. The map stays closed from the
  first line.
- **The guards are only as good as their mutation check.** Three scripts that always exit 0 would
  pass this story and silently disarm three constraints. Phase 4 is not done until each has been
  observed failing.

---

## Rollback Envelope

**Affects production runtime:** false - nothing is published or deployed by this story.

Reversal is `git revert`; there is no external state to unwind.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Initial plan from US-01M0GMPJ |
