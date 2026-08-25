# US-01M0WSME: Chromatic visual regression, blocking on unreviewed diffs

> **Status:** Draft
> **Created:** 2026-08-25
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** .github/workflows/ci.yml, apps/storybook/package.json, ci-gates.json
> **Epic:** EP-01M0GKM4
> **Points:** 5

## User Story

**As a** {{role}}
**I want** {{capability}}
**So that** {{benefit}}

## Acceptance Criteria

- **AC1:** AC1 - Chromatic runs on every pull request and BLOCKS the merge on an unreviewed diff. A run that reports without blocking is not a gate (D0038), and `check-ci-gates` already refuses `if: false`, `continue-on-error` and `|| true`.
AC2 - The dedicated baselines TSD Section 5 names beyond the per-component stories exist: the focus indicator against EVERY background token including all emphasis surfaces; a Combobox and a DropdownMenu inside a dark compact `<ClaraScope>` on a light comfortable page, proving TRD ADR-006's portal scoping; and the full component set side by side in both densities.
AC3 - The project token is read from a CI secret and appears in no committed file. AGENTS.md permits `CHROMATIC_PROJECT_TOKEN` as a CI secret and forbids committing it.
AC4 - `ci-gates.json` gate 7 moves from `pending` to `wired` and names the command CI actually runs.
  - **Verify:** m

## Summary

Gate 7 - "Visual regression: no unreviewed diffs" - is the last pending gate in `ci-gates.json`, and until this story nothing delivered it. It was bound to `US-01M0WSME`, whose four acceptance criteria build the Storybook workspace (toolbars, a11y addon, autodocs, Pages deploy) and never mention a baseline or a diff. A gate pointing at a story that does not deliver it is a gate nobody owns.

TSD Section 5 specifies the capability: Chromatic (D0013), consuming the Storybook stories F18 already requires, running every PR, blocking on unreviewed diffs, over a matrix of every component x {light, dark} x {comfortable, compact}.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-25 | sdlc-studio | Created via `new` (deterministic) |
