# US-01M0GMKD: CI pipeline: the fourteen blocking gates

> **Status:** Draft
> **Supersedes:** CR-01M0HT8N
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/ci.yml, @changesets/cli, origin/main, scripts/lib/workspace.mjs
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** every gate defined in the TRD and TSD to run on each PR and block the merge
**So that** a defined gate with no enforcement point is not a gate

## Acceptance Criteria

### AC1: All fourteen run

- **Given** a pull request
- **When** CI executes
- **Then** every gate in TRD Section 9 runs
- **Verify:** file .github/workflows/ci.yml
- **Verification target:** functional

### AC2: Every gate blocks

- **Given** a failing gate
- **When** CI completes
- **Then** the merge is blocked, not merely annotated
- **Verify:** grep "continue-on-error: false|^(?!.*continue-on-error)" .github/workflows/ci.yml
- **Verification target:** functional

### AC3: A changeset is required

- **Given** a PR touching packages/
- **When** no changeset is present
- **Then** CI fails
- **Verify:** shell npx --yes @changesets/cli status --since=origin/main
- **Verification target:** functional

### AC4: Audit is clean

- **Given** the dependency tree
- **When** I run `pnpm audit`
- **Then** no high or critical CVE in a runtime dependency
- **Verify:** shell pnpm audit --audit-level=high --prod
- **Verification target:** functional

### AC5: The guards read the workspace from pnpm-workspace.yaml

- **Given** a new workspace glob added to `pnpm-workspace.yaml`
- **When** any guard script runs
- **Then** it sees the packages under that glob, because it resolves the globs from the file rather than a hardcoded root list
- **Verify:** shell node -e "const s=require('fs').readFileSync('scripts/lib/workspace.mjs','utf8');if(!s.includes('pnpm-workspace.yaml')||/\\['packages',\\s*'apps'\\]/.test(s))process.exit(1)"
- **Verification target:** functional

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

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Absorbed the workspace-layout finding of CR-01M0HT8N as AC5 |
