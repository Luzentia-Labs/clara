# BG-01M0XJBW: Four known bypasses of the overlay-portal binding, each needing analysis the guard does not do

> **Status:** Fixed
> **Triaged-by:** claude-implementer; agent; opus-5
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/check-overlay-contract.mjs, scripts/prove-guards-fail.mjs
> **Severity:** major
> **Points:** 3

## Summary

`scripts/check-overlay-contract.mjs` requires every built overlay to RENDER a `<ClaraPortal>` and to refuse a Radix portal. It reads the TypeScript AST, so a comment, an unused import and a type-only import no longer satisfy it, and both of Radix's export names are matched.

Four bypasses remain, all reproduced at `rc=0 PASS` during round 8 of US-01M0GM61's review:

1. **A Radix portal re-exported through a local file.** `export { Portal } from '@radix-ui/react-dialog'` in the component's own directory, imported as `./portal`. The re-export file IS scanned, but `ExportDeclaration` is not handled, so the binding is never traced.
2. **An alias bound outside the import.** `const P = Portal` and then `<P>`. The import is seen; the local binding is not followed.
3. **A `<ClaraPortal>` inside an unreachable branch.** `if (false) { return <ClaraPortal>...</ClaraPortal> }` satisfies the check, against a docblock that claims "only a JSX element counts, which is the thing the runtime does" - a JSX element behind a dead branch is not what the runtime does.
4. **Cross-file resolution generally.** The guard reads each component's own directory and follows no import out of it.

## Steps to Reproduce

Stage a Drawer marked `built` and `overlay: true` in `client-boundary.json` with a source directory, then apply each shape and run `node scripts/check-overlay-contract.mjs`. All four exit 0.

AC8 no longer claims to catch them: its Then-clause enumerates the shapes it proves and carries the same humility clause AC5 does - a denylist of the evasions review actually found, which is not the same as proving the binding cannot be bypassed. So these are documented limitations rather than false claims, which is why they are a bug rather than a blocked criterion.

## Proposed Fix

Not one change - three, in increasing cost, and worth doing in that order because each stands alone.

1. **Handle `ExportDeclaration`** in the same walk that handles `ImportDeclaration`. Cheapest, and closes bypass 1 where the re-export file is already being scanned.
2. **Follow local bindings.** A `VariableDeclaration` whose initialiser is an identifier already bound to a Radix portal aliases it. This is shallow data flow over one file and closes bypass 2.
3. **Reachability, or drop the claim.** Bypass 3 needs to know a branch is dead, which is real analysis. The honest alternative is to narrow the docblock: say the guard checks that a `<ClaraPortal>` element is WRITTEN, not that it is reached. That is cheaper and it is true.

Bypass 4 is the general form of 1 and 2 and should not be attacked directly - a guard that resolves arbitrary imports is a bundler. Each fix needs its own `prove-guards-fail.mjs` entry, or it repeats the defect round 7 found in this same guard: a clause that exists and was never observed failing.

## Impact

Bounded, and worth stating precisely. None of these is what an author does by accident - each takes a deliberate indirection, and the two shapes an author reaches for WITHOUT thinking (a destructured `{ Portal }` and the auto-import `{ DialogPortal }`) are both caught. The realistic risk is not evasion but drift: a component that grows a local re-export file for unrelated reasons, and later routes its portal through it.

The reason to fix rather than accept: this guard is the declared binding for twelve overlays. A bypass that survives is one twelve components can each inherit, and the whole point of US-01M0GM61's AC8 is that a mechanism nothing obliges anyone to use is the defect the story exists to prevent (D0087).

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |

## Acceptance Criteria

### AC1: Three of the four bypasses are closed, and each is pinned

- **Given** a Radix portal reached by re-export, by alias, or rendered above its own import
- **When** the overlay contract runs
- **Then** each is refused, naming the local tag it was reached through
- **Verify:** shell node scripts/prove-guards-fail.mjs --only "Radix portal (rendered above|reached through|bound to a local)"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: A chain of aliases is closed too, not just one link

- **Given** `const A = Dialog.Portal; const B = A`
- **When** `<B>` is rendered
- **Then** it is refused - the binding pass runs to a FIXPOINT over every file, so a chain is no
  more of a bypass than a single alias
- **Verify:** shell node scripts/prove-guards-fail.mjs --only "chain of two aliases"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: The remaining limits are stated rather than implied

- **Given** the guard
- **When** its reach is described
- **Then** the two cases it still does NOT close are named in the file, with why
- **Verify:** grep "WHAT THIS GUARD DOES NOT CLOSE" scripts/check-overlay-contract.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification depth:** functional

## Fixed (2026-08-26) - three of four, plus one the bug did not list

The guard now resolves bindings in a separate pass, to a fixpoint, over ALL of a component's files
rather than as it walks each one.

| Bypass | Before | Now |
| --- | --- | --- |
| 1. Re-export through a local file | PASS rc=0 | **caught** |
| 2. Alias bound outside the import | PASS rc=0 | **caught** |
| 3. `<ClaraPortal>` in a dead branch | PASS rc=0 | see below |
| 4. Cross-file resolution generally | PASS rc=0 | **narrowed**, not closed |
| 5. Rendered ABOVE its own import (found in round 10, not in this bug) | PASS rc=0 | **caught** |
| 6. A CHAIN of two aliases (not previously recorded) | would have passed | **caught** |

Three structural causes, each fixed at the cause rather than at the symptom:

1. **Bindings were collected DURING the JSX walk.** Imports are hoisted, so a portal rendered above
   its own import was checked against an empty set. Bindings are now a separate first pass.
2. **Binding sets were PER FILE.** The re-export bypass spans two files - the Radix specifier in one,
   the render in another - so neither file alone looked wrong, and neither alone WAS wrong. The sets
   are now per COMPONENT, which is the unit that gets scanned.
3. **One pass could not follow a chain.** The binding pass now runs to a fixpoint over every file,
   so `const A = Portal; const B = A` is followed however it is ordered - and filesystem order stops
   deciding anything.

**Bypass 3 (the dead branch) is caught incidentally, and that is not good enough to claim.** The
probe is refused, but by the `constant open` rule added for BG-01M0Y2H2 rather than by any
reachability analysis. A dead-branch `<ClaraPortal open={someState}>` would still satisfy the
render check. Detecting unreachable code in general is undecidable, and a guard that recognised only
`if (false)` would be theatre. **Stated, not claimed.**

**Bypass 4 is narrowed rather than closed.** The guard follows re-exports and aliases within the
component's own directory, which is where every measured instance lived. It still follows no import
OUT of that directory. A component importing a portal from a shared helper elsewhere in the package
would not be seen.

Both remaining limits are now named in the guard file itself, so the next reader learns them from
the code rather than from this bug.
