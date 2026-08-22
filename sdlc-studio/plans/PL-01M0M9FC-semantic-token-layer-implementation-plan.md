# PL-01M0M9FC: Semantic token layer - Implementation Plan

> **Status:** Draft
> **Created:** 2026-08-22
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GMAE](../stories/US-01M0GMAE-semantic-token-layer.md)
> **Epic:** [EP-01M0GKNG: Foundations - visual identity and token system](../epics/EP-01M0GKNG-foundations-visual-identity-and-token-system.md)
> **Points:** 8 - re-sized by operator, 2026-08-22
> **Affects:** packages/tokens/src/semantic/base.json, packages/tokens/src/themes/dark.json, packages/tokens/style-dictionary.config.js, packages/tokens/tokens.public.lock.json, packages/tokens/contrast-required.json, scripts/check-token-output.mjs

## Overview

Tier 2 is the theming API Clara promises to keep. Every name here is **public and permanent at
first publish**, and this is the story that decides all of them at once. Nothing else in the project
has that property to the same degree.

F00 (D0036) left three concrete inputs: the per-intent `fg-on-emphasis` taxonomy change, two step
choices proven by measurement, and 27 contrast pairings waived until these families exist.

---

## FINDING 1 - the naming convention diverges from the PRD, and it is load-bearing

PRD:228 fixes the tier boundary **in the name itself**:

| Tier | PRD example | What marks it |
| --- | --- | --- |
| 1. Primitive | `--clara-blue-600`, `--clara-space-4` | no `color-` segment; numeric leaf |
| 2. Semantic | `--clara-color-fg-default`, `--clara-space-inset-md` | **`color-` segment**; named leaf |
| 3. Component | `--clara-button-primary-bg` | component name first |

What is emitted today:

```
tier 1: --clara-color-neutral-0        <- has `color-`, which the PRD reserves for TIER 2
tier 2: --clara-semantic-text-default  <- has `semantic-`, which appears nowhere in the PRD
```

**Both tiers are named wrongly, and they are wrong in a way that collides.** Tier 1 currently
occupies the `--clara-color-*` namespace that tier 2 must own. Renaming tier 2 into place without
first moving tier 1 out produces two different tokens competing for the same names.

Tier 1 is private and may change in a minor (PRD:224), so moving it is cheap **now** and impossible
after first publish. This story is the last moment.

## FINDING 2 - the tier predicate cannot survive the rename

`style-dictionary.config.js:21` decides tier 2 by `token.path[0] === 'semantic'`. Once tier 2 is
`color.fg.default` and tier 1 is `blue.600`, that predicate is false for every tier 2 token and the
following silently invert:

| Consumer | Consequence if the predicate is not fixed first |
| --- | --- |
| `tokens.public.json` filter | Emits **nothing**, or emits tier 1 - the public API list becomes wrong |
| `build/tier-manifest.json` | The guard's oracle inverts |
| `check-token-output.mjs` raw-literal walk | Stops checking tier 2 |
| `tokens.public.lock.json` | Every key changes at once, so the R4 guard fires on all of them |

A reviewer already proved (R4) that narrowing this predicate silently deletes public tokens with
every gate green. **Change the predicate and the names in the same commit, and expect the lock to
require a deliberate wholesale update** - that friction is the guard working, not noise.

**Proposed predicate:** tier is declared by source directory (`src/primitive` / `src/semantic` /
`src/component`), which is where TRD Section 6 already puts it, rather than inferred from a path
segment. A reviewer (N3) previously showed a directory-based *guard* diverging from a path-based
*build*; the fix is to make the build itself directory-driven so there is one definition.

---

## FINDING 3 - "compose rather than replace" is not expressible in plain custom properties

AC4 requires row-surface resolution `focus > selected > hover > striped`, with **selected and hover
composing rather than replacing**. Two tokens cannot blend in CSS custom properties without either:

- `color-mix()` - clean, but it is a runtime CSS feature and Clara's contrast gate measures **static
  hex values**. A composed colour would be unmeasurable by the gate that D0035 makes load-bearing; or
- **precomputed composed tokens** - `bg-selected-hover` as its own tier 2 token with a real hex.
  More tokens, all measurable, all permanent.

**Recommendation: precompute.** It keeps every shipped colour inside the contrast gate. `color-mix()`
would put a colour on screen that no gate has ever measured, which is exactly the class of gap the
a11y register already records for rendered-component contrast.

---

## Estimation Finding

**Sized 5. This plan believes it is an 8.**

The family matrix from PRD:245 plus D0036:

| Group | Members | Count |
| --- | --- | --- |
| `fg` | default, muted, subtle, disabled, link, readonly | 6 |
| `fg-on-emphasis` | **per-intent** (accent, danger, success, warning, info) - D0036 | 5 |
| `bg` | canvas, surface, subtle, emphasis, hover, active, disabled | 7 |
| `border` | default, muted, strong, focus | 4 |
| per-intent | `fg-{i}`, `bg-{i}-subtle`, `bg-{i}-emphasis`, `border-{i}` x 5 families | 20 |
| `selected` | bg, border | 2 |
| focus | ring, offset | 2 |
| composed (Finding 3) | selected-hover, and any other pair that composes | 1+ |

**~47 permanent public names**, each needing a dark-theme counterpart, each entering the contrast
table. Plus a naming migration (Finding 1) and a predicate change (Finding 2) that must land in the
same commit. US-01M0GM3X was re-sized 5 -> 8 for less than this.

**RESOLVED 2026-08-22: the operator re-sized it to 8.** At 8 this sits on the split threshold; if the naming migration (Findings 1-2) proves larger than Phases 1-2 suggest, splitting it out is the pre-agreed relief valve rather than a mid-flight surprise.

---

## Specification delta (engagement floor)

| # | Interaction | Resolution |
| --- | --- | --- |
| 1 | **PRD:228 naming** | Finding 1. Move tier 1 out of `--clara-color-*` first, then tier 2 in. |
| 2 | **`isTier2` predicate** | Finding 2. Directory-driven, changed in the same commit as the names. |
| 3 | **D0036 clause 5** - per-intent `fg-on-emphasis` | 5 tokens, not 1. Closes the hard case. |
| 4 | **F00 measured step choices** | `border-default` -> neutral 500, `bg-info-emphasis` -> info 700. Recorded in `design/foundations.md`; do not rediscover. |
| 5 | **27 waived contrast pairings** | They **un-waive here**. `contrast-required.json`'s waiver may only shrink, so the count must go 27 -> 0 or the gate fails. |
| 6 | **`tokens.public.lock.json`** | Every key changes. One deliberate wholesale update, in the same commit, with the reason. |
| 7 | **CR-01M0J0Z6** | This story closes it - the delivered families become the TRD's families. |
| 8 | **TRD Section 6: tier 2 references tier 1 only** | Already enforced by `check-token-output`; it must keep working through the rename. |
| 9 | **Dark theme** | Every tier 2 token needs a dark counterpart, and every pairing must pass **in both themes** (TRD build-time constraints table). The contrast gate currently measures light only. |
| 10 | **AC1/AC2 verifiers** | Both `grep` for ONE token while claiming a whole family set exists. Seventh weak-verifier instance; replace with a check that asserts the full enumerated matrix. |

Interactions named: 10. Resolved: 9. **Operator: 1** (the estimate).

---

## FINDING 4 - the contrast gate measures one theme

Interaction 9 deserves its own line. TRD Section 6 requires "every pairing meets its threshold **in
both themes**". `check-contrast.mjs` reads `build/tokens.pairings.json`, which is emitted from the
light build only. Dark-theme pairings are currently unmeasured.

That is acceptable while dark is placeholder; it is not acceptable once 47 real tier 2 tokens have
dark counterparts. **Extend the gate to emit and measure a dark pairing table in this story**, or
the 27 un-waived pairings are only half-checked.

---

## Implementation Phases

### Phase 1: Move tier 1 out of the tier 2 namespace
Rename `color.neutral.*` -> `neutral.*` etc. so `--clara-color-*` is free. Tier 1 is private
(PRD:224), so this is a rename with no consumer impact - and it is impossible after first publish.

### Phase 2: Make the tier predicate directory-driven
One definition, in the build, read by the manifest and every guard.

### Phase 3: Author the ~47 tier 2 tokens, light theme
Against the matrix above. Every value a tier 1 reference; no literals.

### Phase 4: Dark counterparts, and extend the contrast gate to both themes
Finding 4.

### Phase 5: Un-waive the 27 pairings
`contrast-required.json` waiver 27 -> 0. Measure. **Failures here change the palette, not the
threshold** (D0035 clause 2).

### Phase 6: Deliberate lock update, replace the weak verifiers, close CR-01M0J0Z6

---

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | The rename lands without the predicate change and the public manifest silently inverts | Phases 1-2 are one commit. R4's guard fires on any key change, which is the backstop. |
| 2 | A pairing fails once real values exist | Expected, and the point. D0035 clause 2: the palette moves. |
| 3 | `color-mix()` is reached for under time pressure | Finding 3. A colour no gate has measured is worse than one more token. |
| 4 | 47 names decided quickly become 47 permanent mistakes | This is the one-way door. The matrix is enumerated above so the set is reviewed as a whole, not discovered token by token. |
| 5 | Dark theme is left unmeasured | Finding 4 makes it a phase, not an afterthought. |

## Definition of Done

- Tier 1 out of `--clara-color-*`; tier 2 in; predicate directory-driven.
- ~47 tier 2 tokens, light and dark, every value a tier 1 reference.
- `contrast-required.json` waiver at **0**, every pairing measured in **both** themes.
- Lock updated deliberately; AC1/AC2 verifiers assert the matrix; CR-01M0J0Z6 closed.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-22 | sdlc-studio | Plan authored. Four findings: the PRD naming convention diverges and collides across tiers; the tier predicate cannot survive the rename; "compose rather than replace" needs precomputed tokens, not `color-mix()`; the contrast gate measures one theme. ~47 permanent public names - estimate contested 5 -> 8. |
