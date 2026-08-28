# BG-01M10BWX: check:keyboard runs a hand-typed file list, so 33 of 35 components with a keyboard table have no per-component keyboard gate

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** package.json, scripts/check-verification.mjs, AGENTS.md
> **Severity:** Medium
> **Points:** 5

## Summary

`check:keyboard` is a hand-enumerated list of test FILES in `package.json:61`. It runs six of them, filtered by `-t "keyboard|focus"`. **Thirty-five components carry a `## Keyboard` table in their verification record**, and a keyboard table is the specification those components are built from - D0024 says so, and every component story's Technical Notes repeat it.

So the gate that exists to hold keyboard behaviour runs the per-component tests of two of the thirty-five it covers. The other thirty-three are held only by whatever `matrix.test.tsx` and `primitives.test.tsx` happen to reach across all components at once, which is a different and much weaker claim than "this component's keyboard table is exercised".

The list is not wrong, it is STALE, and it goes stale silently by construction: adding a component with a keyboard table does not add it here, nothing notices, and `pnpm check` reports PASS. Drawer was added to it while closing US-01M0GMWW, which fixes one instance and not the mechanism - the next component to ship will be outside it for exactly the same reason.

This is the enumeration-staleness class the project already has a rule for: **never infer a category from a name, derive it** (D0051, D0067). Tier comes from the tier manifest; "built" comes from TypeScript's parser; which components have keyboard behaviour should come from which records declare a keyboard table, not from a string somebody remembered to edit.

## Steps to Reproduce

```text
# components declaring a keyboard table
grep -l "^## Keyboard" packages/react/src/components/*/verification.md | wc -l
```
-> `35`

```text
# per-component test files the gate actually runs
grep -n '"check:keyboard"' package.json
```
-> six files: `__tests__/matrix.test.tsx`, `__tests__/primitives.test.tsx`, `Field/__tests__/behaviour.test.tsx`, `Field/__tests__/controls.test.tsx`, `Modal/__tests__/behaviour.test.tsx`, `Drawer/__tests__/drawer.test.tsx`.

Enumerating the difference names 33 components with a keyboard table whose own tests the gate does not run - among them DropdownMenu, Popover, Tooltip and Toast, every overlay in the epic just closed except Modal and Drawer.

`pnpm check:keyboard` -> `Test Files 6 passed (6) / Tests 86 passed | 324 skipped (410)`, exit 0. The 324 skipped are the filter doing its job; the 33 missing files are not skipped, they are absent.

## Proposed Fix

**Derive the file list instead of typing it, which is the only fix that does not go stale again.**

Replace the hardcoded `npx vitest run <files> -t "keyboard|focus"` with a small script that:

1. Enumerates `packages/react/src/components/*/verification.md` and selects those declaring a `## Keyboard` section - that is the project's own definition of "has keyboard behaviour", already load-bearing for `check-verification.mjs`.
2. Resolves each one's `__tests__` directory.
3. **Fails** when a component declares a keyboard table and has no test file to run - that absence is the finding, and today it is invisible.
4. Runs vitest over the resolved set with the same `-t "keyboard|focus"` filter.

Step 3 is the part that matters. A derived list that silently runs fewer files is the same defect wearing a nicer implementation.

**Expect it to fail loudly the day it lands**, on some of the 33. That is the point, and it is why this is 5 points rather than 1: the script is small, and triaging what it surfaces is not.

**Report the count either way.** AGENTS.md's no-silent-caps rule applies directly - the PASS line should read `N component(s) with a keyboard table, N test file(s) run`, so a future gap is a number somebody can see rather than a discovery.

\*\*Related:\*\* BG-01M109XY (a gate that silently skips what it cannot check) and BG-01M107ND (a criterion claiming more than its verifier checks). All three are the same shape: the check is narrower than the claim, and nothing says so.

## Acceptance Criteria

### AC1: The file list is derived, not typed

- **Given** 35 components declaring a `## Keyboard` table
- **When** `check:keyboard` runs
- **Then** it resolves its file list from those records rather than from a hand-typed string, and its
  PASS line reports how many components were found and how many test files were run
- **Verify:** shell pnpm check:keyboard
- **Verification target:** functional

### AC2: A component with a keyboard table and no tests is a failure, not a silence

- **Given** a component declaring a keyboard table
- **When** it has no test file for the derived list to run
- **Then** the gate FAILS and names it, because that absence is the finding and today it is invisible
- **Verify:** shell pnpm check:keyboard
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
