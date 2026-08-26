# BG-01M0XN7S: Clara ships no font-family token at all, and PRD F04 AC2 requires one

> **Status:** Fixed
> **Triaged-by:** Claude Opus 5; agent; claude-opus-5
> **Created:** 2026-08-26
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/tokens/src/primitive/base.json, packages/tokens/src/semantic/geometry.json, packages/react/src/styles.css, scripts/build-geometry-fixture.mjs
> **Severity:** major
> **Points:** 3

## Summary

`grep -rn "font-family"` across the repo returns matches only in two test fixtures - `scripts/build-geometry-fixture.mjs` and `scripts/make-manual-fixture.mjs` - which set `system-ui` themselves. There is no `font-family` in `packages/tokens/src/` at any tier, none in `packages/react/src/styles.css`, and none emitted in `dist/tokens.css`.

PRD F04 AC2 requires a documented system stack with a single-token override point. It is unmet.

So every Clara component currently renders in whatever typeface the consumer's page happens to set, and the two fixtures that measure Clara's own geometry set a typeface the shipped package does not.

## Steps to Reproduce

1. `grep -rl "font-family\|fontFamily" packages/tokens/src/` -> no matches.
2. `grep -c "font-family" packages/react/src/styles.css` -> 0.
3. `grep -c "font-family" packages/tokens/dist/tokens.css` -> 0.
4. Read PRD F04 AC2.

Found by the Idris (ux) seat while measuring string widths for D0104 - it had to pick a typeface to measure in, and discovered Clara does not name one.

## Proposed Fix

A tier 1 stack and a tier 2 alias, per PRD F04 AC2's "single-token override point":

- tier 1 `font.family.system` - the documented stack.
- tier 2 `font.family` -> `{font.family.system}`, emitted as `--clara-font-family`.
- `:root` in the component stylesheet, or the tokens stylesheet, sets `font-family: var(--clara-font-family)` once. A consumer overrides the tier 2 token and everything follows.

Naming note: this is a SIXTH permanent tier 2 name and the operator has ratified five (D0101, D0103). It wants the same ratification, and it should probably be settled in the same sitting as D0104's `meta` versus `metadata`.

The fixtures should then stop setting their own `system-ui` and inherit, so gate 9 measures what the package ships rather than what the fixture chose.

## Impact

Load-bearing for every type decision already recorded, which is why it is filed rather than left.

**12px legibility is a property of a typeface.** D0104 rules on what may render below the 14px body floor, and the whole argument rests on how a string reads at a size - which Clara does not currently control. The same is true of the 14px floor itself (PRD:333) and of the 24px line-box reservation D0037 derived the density floors from, and of D0098's control-height arithmetic, which assumes a line box that a different typeface would change.

It also makes the geometry gate's measurements less than they appear: `build-geometry-fixture.mjs` sets `system-ui` in the fixture, so gate 9 measures Clara's boxes in a typeface the package never asks for. Those measurements are still right about padding and borders - which is most of what they assert - but any assertion that depends on a line box is measuring the fixture's choice.

Nothing is broken for a consumer today: a page that sets its own font gets it, which is usually what a consumer wants. The defect is that Clara has no opinion and states one nowhere, while several of its recorded decisions assume it does.

## Acceptance Criteria

- **AC1** - A tier 2 `font.family` exists, references a tier 1 stack, and emits
  `--clara-font-family`. The tier boundary is what makes it overridable without reaching into a
  primitive.
- **Verify:** shell pnpm check:token-output
- **Verified:** yes (2026-08-26)

- **AC2** - The stylesheet applies it ONCE, so a consumer setting one token gets every Clara
  surface - which is what PRD F04 AC2 means by a single override point.
- **Verify:** grep "^:root \{ font-family: var\(--clara-font-family\)" packages/react/src/styles.css
- **Verified:** yes (2026-08-26)
  <!-- Escaped: the `grep` verb is RIPGREP, so the pattern is a regex and an unescaped
       `var(--clara-font-family)` reads as a capture group matching `var--clara-font-family`,
       which is not in the file. The criterion failed while the declaration was present. -->

- **AC3** - The geometry gate measures the face the PACKAGE ships, not one the fixture chose.
- **Verify:** shell pnpm check:geometry
- **Verified:** yes (2026-08-26)

## Verification

**Verified by:** Claude Opus 5 (agent)

**Verification date:** 2026-08-26

**Verification depth:** functional

Tier 1 is `font.stack.system` rather than `font.family.system`: a tier 1 `font.family` GROUP
collides with the tier 2 `font.family` LEAF and makes the reference self-referential, which is the
same collision `size.bar` hit and which the repo already avoids by hyphenating
(`size.control.comfortable` -> `size.control-height`). Here the public name was chosen first, so
tier 1 moved instead.

Both fixtures stopped setting their own `system-ui`. Gate 9 still passes with them inheriting, which
is the part worth recording: the control heights, target sizes and type floors it asserts hold on
the face the package actually ships, and were not resting on the fixture's guess.

**What this does NOT resolve:** the decisions that assumed a typeface were made before one existed.
D0037's 24px line-box reservation and D0098's `40 = 24 + 2x8` arithmetic are unchanged and still
correct on this stack, but neither was DERIVED from it. If the stack is ever changed, both want
re-checking, and D0100's note that no line-height token exists anywhere still stands.

**Not yet adversarially reviewed.**

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-26 | sdlc-studio | Created via `new` (deterministic) |
