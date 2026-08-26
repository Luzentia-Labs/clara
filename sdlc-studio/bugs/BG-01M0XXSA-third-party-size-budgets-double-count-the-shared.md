# BG-01M0XXSA: Third-party size budgets double-count the shared @floating-ui chain

> **Status:** Fixed
> **Triaged-by:** claude-implementer; agent; opus-5
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/sync-size-budgets.mjs, .size-limit.json
> **Severity:** Medium
> **Points:** 2

## Summary

Each `third-party runtime:` size budget measures its own client chunk in isolation, with every OTHER declared runtime dependency in its `ignore` list. Transitive dependencies are in nobody's ignore list, so a chain shared across several Radix packages is counted in full inside each entry that reaches it. `@radix-ui/react-popover` reports 24.09 kB, roughly 14 kB of which is `@radix-ui/react-popper` + `@floating-ui/react-dom` + `/dom` + `/core`. Tooltip, DropdownMenu and Select all carry that same chain, so each will report its own ~24 kB for weight a consumer pays ONCE.

Every individual number stays true - a consumer importing only Popover really does pay 24.09 kB - and no gate is currently wrong. What is false is the implication that the entries sum, which is exactly what a reader does with a list of budgets. `sync-size-budgets.mjs` already makes this argument for React and for declared Radix packages ('shared by every overlay that uses it - so a consumer using six of them pays it once'); the per-dependency split applied it to DECLARED deps and not to the transitive chain underneath them.

This does not bite until a second popper-based overlay ships, which is the next story. Filed now because the comment in sync-size-budgets.mjs points at it.

## Steps to Reproduce

1. `pnpm build`
2. `pnpm size` and add up the five `third-party runtime:` figures: 15.08 + 31.1 + 24.09 + 12.8 +
   19.26 = **102.33 kB**.
3. No consumer has ever paid that. Each entry ignores the other DECLARED runtime dependencies, but
   the transitive `@radix-ui/react-popper` -> `@floating-ui/react-dom` -> `/dom` -> `/core` chain is
   in nobody's ignore list, so all three popper-based entries report it in full.

## Acceptance Criteria

### AC1: The deduplicated total is measured, not inferred

- **Given** the built package
- **When** the size gate runs
- **Then** one budget reports what a consumer importing everything actually pays, with shared code
  counted once - measured 46.65 kB against a naive sum of 102.33 kB
- **Verify:** shell node scripts/sync-size-budgets.mjs --check && pnpm size
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: That budget BINDS

- **Given** the union budget
- **When** the measured size exceeds it
- **Then** `pnpm size` exits non-zero
- **And** proved by mutation: lowering the limit to 40 kB gives rc=1; restored gives rc=0
- **Verify:** manual lower the union limit to 40 kB and confirm pnpm size exits 1
- **Verification target:** functional

### AC3: The entry cannot be quietly deleted

- **Given** `.size-limit.json`
- **When** the union entry is removed
- **Then** the drift check fails with `differs from the classification`
- **Verify:** shell node scripts/sync-size-budgets.mjs --check
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC4: The per-dependency entries no longer read as addable

- **Given** the budget names
- **When** a reader scans them
- **Then** each says it is measured alone and points at the union entry
- **Verify:** grep "measured alone - these DO NOT SUM" .size-limit.json
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

## Proposed Fix

Measure the package ENTRY with only peers ignored. It re-exports every component, so following its
imports is what a consumer's bundler does, and shared code is counted once.

**Not** by passing size-limit an array of chunks: it sums paths rather than deduplicating them,
reporting 102.45 kB - the double-count with a new name. That was tried first.

> **Verification depth:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |

## Fixed (2026-08-26)

The double-count is now MEASURED rather than argued, and bounded by a budget that binds.

`.size-limit.json` gains one entry: the package ENTRY bundled with nothing but peers ignored. The
entry re-exports every component, so following its imports is what a consumer's bundler actually
does, and shared code is counted once.

| | |
| --- | --- |
| Naive sum of the five per-dependency entries | **102.33 kB** |
| Deduplicated, measured | **46.65 kB** |
| Double-counted | **~56 kB** |

So the premise held, and by more than the bug estimated - the shared chain is not the only thing
counted repeatedly.

The per-dependency entries are RENAMED from "(shared by every overlay that uses it)" to
"(measured alone - these DO NOT SUM, see the union entry)". The old name described the sharing but
still read as a set of addable figures, which is what a reader does with a list of budgets.

**A first attempt was itself the bug with a new name.** It handed size-limit an ARRAY of the five
chunks, expecting it to bundle them together and dedupe. It does not: it measures each path and adds
them, reporting **102.45 kB** - within 120 B of the naive sum. It looked like a working dedup entry
and was the double-count relabelled. Recorded in the script, because that is the exact failure the
entry exists to correct.

**Also corrected in the same pass:** the comment written alongside the first attempt cited
"41.19 kB" as measured. It was not measured; it was a guess written in the past tense, which is the
defect class this project has spent ten review rounds removing. Replaced with the real figure.

Proved both directions:

- Lowering the union limit to 40 kB turns `pnpm size` red (rc=1); restored, rc=0.
- Deleting the entry from `.size-limit.json` turns `sync-size-budgets --check` red
  (`differs from the classification`); restored, PASS with 34 budgets.

Limit set at **50 kB**, leaving headroom for the six overlays still planned. They are all
popper-based, so each should add its own code and almost none of the shared chain - if one moves
this number by more than a couple of kB, that is precisely the signal this entry exists to give.
