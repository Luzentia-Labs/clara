# BG-01M11KT6: Badge and Tag claim a visible non-colour carrier and render none, missing the sighted colour-deficient persona both stories name

> **Status:** inbox
> **Created:** 2026-08-27
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/src/components/Badge/Badge.tsx, packages/react/src/components/Tag/Tag.tsx, packages/react/src/styles.css, apps/docs/src/content/components/badge.md, apps/docs/src/content/components/tag.md
> **Severity:** Medium
> **Points:** 5

## Summary

Badge and Tag each carry a criterion titled "Intent is not colour alone" whose text requires "a mark, icon or text label accompanies the colour". Neither component renders any of those three.

What they render is `<span class="clara-visually-hidden">Error: </span>` - a word in the accessibility tree and nothing on screen. `grep "clara-badge__\|clara-tag__" packages/react/src/styles.css` returns only `__count`, `__remove` and its focus rule: no icon, no mark, no visible label beyond the author's own text.

**This misses the persona both stories name.** Grace Adeyemi is listed in `Serves:` on both, and `sdlc-studio/personas/grace-adeyemi.md:26` describes a mild red-green colour vision deficiency. She is SIGHTED. A visually-hidden word reaches her not at all, and red/green is precisely the pair she cannot separate - so `<Badge intent="danger">Open</Badge>` and `<Badge intent="success">Open</Badge>` are identical to her, which is the exact failure the criterion's title names.

Alert solves this: it renders an icon, and the icon is now asserted by IDENTITY rather than presence. Badge and Tag do not, and the criterion says they do.

`Badge.tsx:50-54` already concedes the limit in a JSDoc - "It cannot guarantee the VISIBLE text distinguishes two badges" - so the knowledge was in the file. The criterion above it was stamped `Verified: yes` claiming the opposite, and the test behind it asserts only the hidden word. The criterion text is corrected in both stories as part of this finding; what remains is the DESIGN question, which is not the author's to settle.

Raised by the engineering review seat; it belongs to the UX seat, which owns inclusive design.

## Steps to Reproduce

1. `grep -n "clara-badge__\|clara-tag__" packages/react/src/styles.css` -> `__count`, `__remove`, `__remove:focus-visible`. No icon or mark rule exists.
2. Render `<Badge intent="danger">Open</Badge>` beside `<Badge intent="success">Open</Badge>`. The DOM differs only by a `clara-badge--danger` / `clara-badge--success` class and a visually-hidden word.
3. Simulate a red-green deficiency, or read the two swatches: `--clara-color-bg-danger-subtle` against `--clara-color-bg-success-subtle` is the one pair Grace's persona names.
4. `sdlc-studio/personas/grace-adeyemi.md:26` - she is sighted, with a mild red-green deficiency, so the accessibility-tree carrier does not reach her.

No automated gate can decide this and none is claimed to: axe does not evaluate whether two colours are distinguishable to a specific deficiency, and the contrast gate measures foreground against background rather than intent against intent.

## Proposed Fix

**The UX seat rules; the options are not equal and none is free.**

1. **Add a visible mark to the non-neutral intents.** A leading dot, rule or small glyph, tokenised so it inherits the intent colour. It is the treatment Alert already uses and the only one that reaches Grace directly. Cost: a badge is the smallest surface in the library and a 16px glyph inside a 20px pill is most of the pill. It also changes the rendered box of every badge and tag already shipped, which is a visual break even though it is not an API break.

2. **Require the visible text to carry it, at the type level.** Refuse `children` that is only a status word, or require a `label` distinct from the intent. Unenforceable in practice - `"Open"` is a legitimate label for both a danger and a success badge, and no type can tell them apart.

3. **Narrow the criterion and document the limit** - which is what the code already does and the criterion did not. Badge and Tag guarantee the intent reaches the ACCESSIBLE NAME; they do not guarantee two badges are visually distinguishable, and the docs say so where a consumer will read it. Cheapest, honest, and it leaves Grace relying on the author choosing distinct words.

\*\*Interim, already applied:\*\* AC1's text in both stories now claims what is true and what its verifier checks - the intent reaches the accessible name - and no longer claims a mark or icon that does not exist. The title stays as a pointer to this bug rather than being quietly reworded, because the gap is real and renaming it away would hide it.

**Recommendation: 1 for Tag, 3 for Badge**, and the split is the point rather than a hedge. A tag sits in a filter bar where a dot fits and where the intent is the whole message. A count badge is 20px of pill and its text is usually a number, where a glyph would crowd out the number and say less than the word already does. Whoever rules should say so per component rather than for both at once.

## Acceptance Criteria

### AC1: A Tag carries a VISIBLE non-colour mark

- **Given** D0106's ruling, and a Tag with a non-neutral intent
- **When** it renders
- **Then** a visible mark accompanies the colour, so a sighted user with a colour deficiency can tell
  two same-text tags apart
- **And** neutral carries none. Neutral means "no intent", and a mark there would say something is
  the matter when nothing is
- **Verify:** vitest "Tag intent is not colour alone"
- **Verification target:** functional

### AC2: Badge claims only what it guarantees

- **Given** D0106's ruling that a 20px pill of digits is the wrong surface for a glyph
- **When** Badge's criterion and docs page are read
- **Then** both state that the intent reaches the ACCESSIBLE NAME, and that two same-text badges are
  not visually distinguishable - rather than claiming a mark that is not rendered
- **Verify:** shell node scripts/check-verification.mjs --component Badge --docs
- **Verification target:** functional

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-27 | sdlc-studio | Created via `new` (deterministic) |
