# BG-01M1AJSR: Six APG deviations on the shared listbox pattern are recorded and pinned, but not resolved

> **Status:** inbox
> **Created:** 2026-08-31
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/lib/listbox.ts, packages/react/src/components/Select/verification.md, packages/react/src/components/Select/__tests__/select.test.tsx, packages/react/src/lib/__tests__/listbox.test.ts
> **Severity:** Medium
> **Points:** 5

## Summary

Six measured APG deviations are recorded and pinned on the select-only combobox
pattern, and none is fixed. They are shared: the closed branch lives in the engine, so Select,
Combobox and MultiSelect deviate together.

The six, all measured by execution against the shipped components and pinned in
packages/react/src/components/Select/`__tests__`/select.test.tsx:

- Home (closed), End (closed), a printable character (closed): the APG opens the listbox on each;
  Clara does nothing. The engine's closed branch handles ArrowDown, ArrowUp, Enter and button-Space
  only.
- Alt+ArrowUp (open): the APG commits and closes; Clara falls through to plain ArrowUp and moves the
  highlight.
- PageUp (open), PageDown (open): the APG moves 10 options; Clara does nothing - both fall to the
  typeahead default, where key.length === 1 is false.

Why this is a decision rather than a defect to fix quietly: each one changes keyboard behaviour for
three shipped components at once. That is the operator's call, not an implementer's, which is why
the deviations were recorded and pinned rather than repaired. D0123's Space case was fixed instead,
because it was silently inert on a key the component itself teaches - a different situation.

The record also says "at least SIX ... and this list is NOT proven complete". Nothing enumerates the
APG's key list, so absence from the table is not evidence of conformance. The count is now
machine-checked against the pinned cases by key and state, after being wrong four times.

This bug exists because the question had no artefact. US-01M0GMRK's Open Questions cited
BG-01M17P6M for it, which is a different bug entirely (ArrowDown walking the highlight up a grouped
list). A plan-review caught the misattribution.

## Steps to Reproduce

Each deviation is reproducible from a shipped component, and all six are already pinned as
CURRENT behaviour, so the suite is green with them present and reddens if any is silently fixed.

Closed-list deviations - `packages/react/src/lib/listbox.ts:169` handles `ArrowDown`, `ArrowUp`,
`Enter` and button-`Space` only:

1. Render `<Select options={OPTIONS} />`, focus the trigger, press `Home`. The listbox does not
   open. The APG's select-only combobox opens on it. Same for `End` and for any printable
   character.
2. `pnpm vitest run packages/react/src/lib/__tests__/listbox.test.ts` - the cases named
   `DEVIATION: %s does not open a closed list` assert exactly this, at the hook, where a native
   `<button>` cannot mask the engine.

Open-list deviations:

3. Open a Select with `value="eur"`, press `PageUp`. `aria-activedescendant` does not move; the APG
   moves 10 options. Same for `PageDown`. Both fall to the typeahead default at
   `packages/react/src/lib/listbox.ts:209`, where `key.length === 1` is false.
4. Press `Alt+ArrowUp` on an open Select. It moves the highlight up instead of committing and
   closing - it falls through to the plain `ArrowUp` case.

Evidence that the count is now held rather than asserted:
`pnpm vitest run packages/react/src/components/Select -t "pins the COUNT"` parses
`packages/react/src/components/Select/verification.md` and compares the asserted count, the rows of
its table and the canonical `APG_DEVIATIONS` array by key AND state. Measured: changing the count
word, deleting a table row, deleting an array entry, renaming a key on either side, or changing
`Home (closed)` to `Home (open)` each redden it.

## Proposed Fix

**Not a fix to apply unilaterally - this needs an operator decision first**, which is why it is
filed rather than repaired. Each deviation changes keyboard behaviour for three shipped components
at once, because the closed branch lives in the shared engine (D0105). That is a product decision,
not a correction.

The three options, in the order they should be considered:

1. **Close them.** Add `Home`, `End` and printable-character opening to the engine's closed branch,
   `PageUp`/`PageDown` as a 10-option step in the open branch, and `Alt+ArrowUp` as commit-and-close.
   Roughly a 5-point change. It brings the pattern to the APG and removes six rows from the record -
   but it changes muscle memory for anyone already using Select, Combobox and MultiSelect.
2. **Close some.** `PageUp`/`PageDown` are the least disruptive (they currently do nothing at all,
   so nothing can regress) and the most valuable in a long list. `Alt+ArrowUp` is the most
   disruptive, because it currently MOVES the highlight and would start committing.
3. **Keep them, as now.** Recorded, measured, pinned and machine-counted. This is the current state
   and it is defensible - what is not defensible is the state before, where the count was prose.

Whichever is chosen, the record's caveat has to survive it: "at least SIX ... and this list is NOT
proven complete". Nothing enumerates the APG's key list, so absence from the table is not evidence
of conformance, and closing the six named here does not make the component conformant - only
conformant on six keys somebody checked.

D0123's Space case is the precedent for fixing rather than recording, and it is a narrow one: that
key was silently inert on a key the component itself teaches as one that opens the list, which is a
defect rather than a deviation.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-31 | sdlc-studio | Created via `new` (deterministic) |
