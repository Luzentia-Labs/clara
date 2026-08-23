# US-01M0GMAE: Semantic token layer

> **Status:** Done
> **Plan:** PL-01M0M9FC
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/tokens/generate-semantic.mjs, packages/tokens/src/semantic/color.json, packages/tokens/src/themes/dark.json, packages/tokens/src/pairings.json, packages/tokens/contrast-required.json, packages/tokens/tokens.public.lock.json, scripts/lib/row-surface.mjs, packages/tokens/src/__tests__/pairings.test.ts, scripts/check-contrast.mjs, scripts/check-public-tokens.mjs, scripts/check-token-output.mjs
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** tier 2 to name every family the component set actually needs
**So that** no component has to reach for a token that does not exist

## Context

### Persona Reference

**Sofia Marchetti** - full-stack developer building internal ERP applications; needs the 26th
component predictable from the 25th.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Tier 2 is the theming API Clara promises to keep. **Every name decided here is public and permanent
at first publish**, and this is the only story that decides all of them at once - roughly 47 names,
each with a dark counterpart and a place in the contrast table.

F00 (D0036) left three concrete inputs: the per-intent `fg-on-emphasis` taxonomy change, two step
choices proven by measurement, and 27 contrast pairings waived until these families exist. Round 6
of review added a fourth: `fg-on-emphasis` must be per-**theme** as well as per-intent, because at
`accent.500` the readable foreground is near-black, not white.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| PRD:224 | Naming | Tier 1 is `--clara-blue-600`; tier 2 is `--clara-color-fg-default` | Tier 1 currently occupies the `--clara-color-*` namespace tier 2 must own. It is private and may change in a minor, so this is the last moment to move it |
| PRD:245 | Coverage | `fg`/`bg`/`border` across neutral, accent, and the four status intents, plus `selected`, `fg-readonly`, and the two focus tokens | AC1/AC2 - the full matrix, not one grep |
| D0036 clause 5 | Taxonomy | `fg-on-emphasis` is PER-INTENT | 5 tokens, not 1 |
| Round 6 X2 | Taxonomy | ...and per-THEME - at `accent.500` white gives 3.23:1 | Dark counterparts are not a mirror |
| TRD S6 | Tiering | Tier 2 references tier 1 only | Enforced by `check-token-output`; must survive the rename |
| TRD S6 | Contrast | Every pairing meets its threshold **in both themes** | Now enforced; the 27 waived pairings un-waive here |
| PRD F01 | Public API | Tier 2 is the public surface | `tokens.public.lock.json` changes wholesale, deliberately |
| D0035 clause 2 | Contrast | A failing pairing never ships; the palette changes | Expect palette movement, not threshold movement |

## Acceptance Criteria

### AC1: Core families exist

- **Given** tier 2
- **When** I read the semantic set
- **Then** fg, bg and border are defined across neutral, accent, and the four status intents
- **Verify:** shell node scripts/check-token-output.mjs && node scripts/check-contrast.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: The four missing families exist

- **Given** tier 2
- **When** I read the semantic set
- **Then** accent, selected (bg and border), fg-readonly, and focus ring plus offset are all present
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: No dangling reference

- **Given** every component and tier 3 token
- **When** the build runs
- **Then** nothing references a semantic token that tier 2 does not define
- **Verify:** shell pnpm --filter @luzentialabs/clara-tokens build
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: Row precedence is defined

- **Given** a table row that is striped, hovered, selected and focused at once
- **When** it renders
- **Then** resolution is focus > selected > hover > striped, with selected and hover composing
- **Verify:** shell npx vitest run packages/tokens/src/__tests__/pairings.test.ts -t "row surface precedence"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Semantic token layer

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 8 - re-sized from 5 by operator decision, 2026-08-22.

~47 permanent public names, each needing a dark counterpart and a place in the contrast table, plus
a naming migration and a tier-predicate change that must land in the same commit (`PL-01M0M9FC`
findings 1 and 2). At 8 this sits on the split threshold: if the naming migration proves larger than
Phase 1-2 suggest, splitting it out is the pre-agreed relief valve.

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| The rename lands without the tier-predicate change | `tokens.public.json` silently emits the wrong set. `tokens.public.lock.json` is the backstop - it fires on every key change - but the two must land in one commit regardless |
| A tier 2 token references another tier 2 token | Build fails. Tier 2 references tier 1 ONLY (TRD S6); a chain through tier 2 makes the public surface self-referential |
| A dark counterpart is a naive mirror of light | Caught by the dark contrast table. `fg-on-emphasis` is the known case: white works on `accent.600` in light and fails on `accent.500` in dark |
| A required pairing is dropped so the gate goes green | `declaredLock` refuses a deletion; `highWaterMark` refuses a grown waiver |
| The waiver is left above zero at the end | This story is what closes it. Ending with `count > 0` means the families it names still do not exist |
| A ramp step is chosen that fails contrast | `success.600` (4.17) and `info.600` (4.25) both fail white and are recorded in `design/foundations.md`. Do not mirror accent/danger, which pass at 600 |
| `selected` is treated as a synonym for `accent` | PRD:245 is explicit that it is distinct from accent AND from the four intents. Row selection, MultiSelect and active navigation all need it separately |

> **Minimum edge cases:** 8 for API stories, 5 for others - 7 recorded.

## Test Scenarios

- [ ] Every family PRD:245 enumerates is emitted, asserted against a committed matrix rather than one grep
- [ ] `fg-readonly`, `selected` (bg and border), and both focus tokens exist
- [ ] `fg-on-emphasis` exists per intent, and differs between light and dark where contrast requires
- [ ] No tier 2 token references another tier 2 token
- [ ] No tier 2 token is a raw literal
- [ ] Every tier 2 token has a dark counterpart
- [ ] `contrast-required.json` waiver count is **0**
- [ ] Every required pairing passes in light
- [ ] Every required pairing passes in dark
- [ ] `tokens.public.json` contains exactly the tier 2 set, and `tokens.public.lock.json` matches it
- [ ] Row-surface precedence resolves focus > selected > hover > striped, with selected and hover composing
- [ ] `pnpm check` passes all guards after the rename

> **Minimum test scenarios:** 10 for API stories, 8 for UI - 12 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMN0](US-01M0GMN0-f00-foundations-pass-decide-the-visual-language.md) | Blocks (satisfied) | Tier 1 ramps and the D0036 direction | Draft, direction decided |
| [US-01M0GME0](US-01M0GME0-token-pipeline-and-tier-enforcement.md) | Overlaps | Owns `lint:css` and tier enforcement; this story must not duplicate it | Draft |
| [CR-01M0J0Z6](../change-requests/CR-01M0J0Z6-tier-2-semantic-families-do-not-match-the.md) | Closed by this | The delivered families become the TRD's families | inbox |
| [US-01M0GM69](US-01M0GM69-button.md) | Follows | Nine of its ten required tier 2 families come from here | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| Style Dictionary 4 | Build | Installed |
| `scripts/lib/wcag.mjs` | Contrast measurement | Present, verified correct in round 6 |
| `packages/tokens/generate-ramps.mjs` | Tier 1 source of truth | Present |

## Estimation

**Points:** 8 - re-sized from 5 by operator decision, 2026-08-22.
**Complexity:** High. ~47 permanent public names, each with a dark counterpart and a contrast-table
row, plus a naming migration and a tier-predicate change that must land in one commit. The names are
the risk, not the volume: they are permanent at first publish.

> **Points** are a RELATIVE size on the modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20) - not
> "how long will this take" but "is this bigger than that one", sized against stories already
> delivered. The gaps widen deliberately, because uncertainty grows with size: it is much harder
> to argue a story is a 7 rather than an 8 than to choose between a 5 and an 8. A value off the
> scale is REFUSED, never rounded - the scale IS the estimate. Above 8, SPLIT the story;
> estimator consistency collapses beyond it, so a bigger number is a triage failure rather than
> a harder estimate. This is the one size vocabulary: the planner, the forecast and the measured
> velocity all read this field.

## Rollback Envelope

> Required when `affects_production_runtime: true`; optional otherwise. See `reference-story.md#rollback-envelope`.

**Affects production runtime:** false - nothing is published yet.

*Reversal is `git revert`.* But note what is NOT reversible: **after first publish, every tier 2 name
decided here is permanent**. The rollback envelope is empty today and closes entirely at
US-01M0GMWF. That asymmetry is the reason this story is worth slowing down for.

## Open Questions

None.

## Resolved Questions

- **Does `selected` need a full `fg`/`bg`/`border` set, or only `bg` and `border`?** -
  **RESOLVED 2026-08-23 by measurement, which is how the question asked to be settled.** Only `bg`
  and `border`, as PRD:245 says. `fg-default` clears 4.5:1 on every selected surface in both
  themes with room to spare - light 14.54:1 on `bg-selected` and 12.47:1 on `bg-selected-hover`,
  dark 11.74:1 and 7.43:1. The worst case is 7.43:1 against a 4.5:1 floor, so a dedicated
  `fg-selected` would add a permanent public token (D0007) that no pairing needs. Both pairings are
  in the enumerated table and measured by the gate, so if a future palette change erodes that
  margin, CI fails rather than the question quietly reopening.

Settled, recorded so they are not re-litigated:

- `fg-on-emphasis` is per-intent (D0036) **and** per-theme (round 6 X2).
- Composed surfaces are precomputed tokens, not `color-mix()` - a composed colour no gate has
  measured is the class of gap the a11y register already records (`PL-01M0M9FC` Finding 3).
- Tier 1 moves out of `--clara-color-*` first; the predicate changes in the same commit.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | operator | Re-sized 5 -> 8 per the estimation finding in PL-01M0M9FC |
| 2026-08-22 | sdlc-studio | Promoted planning -> full; filled the 8 deferred sections. 7 edge cases, 12 test scenarios, 4 dependencies. One open question for the operator (`selected` needing a fg). |
