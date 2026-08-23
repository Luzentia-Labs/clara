# EP-01M0GKNG: Foundations: visual identity and token system

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full

## Summary

Decide Clara's visual identity inside a hard 5-day box, then build the three-tier token system, theming, density, and typography on top of the values it produces. Every component epic is blocked on this one, so it starts immediately and ends on schedule whether or not the design pass is satisfied.

**PRD features:** F00, F01, F02, F03, F04
**Delivery order:** 2 of 10 - runs in parallel with the toolchain epic. **F00 blocks everything downstream.**
**Depends on:** None (F00 is design work). EP EP-01M0GKNH is parallel, not a prerequisite.

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
| --- | --- | --- | --- |
| PRD | Performance | One stylesheet per package; per-component JS budgets | Tokens add ~1 kB gzipped to the entry |
| PRD | Security | No runtime environment reads | The token layer is static CSS and constants |
| TRD | Architecture | Three tiers; tier 2 public, tiers 1 and 3 private | Enforced at build time and by two CI gates |
| TRD | Tech Stack | Style Dictionary 4, OKLCH ramps | The palette is solved, not hand-picked |

## Business Context

### Problem Statement

Every component inherits the visual language, so deciding it late means deciding it forty times -
and inconsistently. Worse, the quality claims attached to it ("every pairing meets AA") were
quantified over a set nobody had enumerated, which made them unfalsifiable.

**PRD Reference:** PRD F00 (foundations pass), F01 (design token system), F02 (theming and density)

### Value Proposition

F01 can be about components. The colours, spacing, type, density and theming are settled, and each
is enforced rather than documented: a component reaching past the semantic layer fails the build,
and a pairing that stops meeting its threshold fails CI.

The measurable outcome is the contrast waiver going 27 to 0 - not by lowering a threshold, but by
moving colours until all 48 pairings passed.

### Success Metrics

| Metric | Current | Target | Measurement |
| --- | --- | --- | --- |
| Contrast pairings waived | 27 | 0 | `check-contrast` |
| Legal pairings enumerated | 8 | 48 (the PRD's own count) | `check-contrast` row-count assertion |
| Tier enforcement | none | build-time + CI gate 2 | `check-component-css` |
| Public token surface | undefined | 53 tier 2 tokens, locked | `tokens.public.lock.json` |

## Scope

### In Scope

- F00 foundations pass: neutral ramp and temperature, accent hue, color space, radius character, border weight, elevation expression, two-part focus specification, type scale, motion, and the legal pairing table
- Three-tier token architecture with the tier-reference rules enforced at build time
- Semantic families: neutral, accent, selected, four status intents, plus `fg-readonly` and the two focus tokens
- Row-surface precedence (focus > selected > hover > striped)
- Light and dark themes; `<ClaraProvider>` and `<ClaraScope>` with **React context propagation** (TRD ADR-006)
- Comfortable and compact density with the legibility and target-size floors
- Type scale with tabular numerals; `tokens.public.json` and `tokens.pairings.json` emitted

### Out of Scope

- `createTheme()` brand ramp generation - deferred, see Open Questions
- Any component consuming these tokens
- Figma variable sync (v1.1)

## Acceptance Criteria (Epic Level)

- [ ] F00 completes within 5 working days and every deliverable is recorded in `design/foundations.md`. **Component work begins on day 6 regardless**
- [ ] Every value in `design/foundations.md` is expressed as a tier 1 token
- [ ] Tier 2 names every family the component set requires; no tier 3 or component AC references a semantic token that does not exist
- [ ] `tokens.public.json` contains exactly the tier 2 set; CI fails if docs or examples reference a token outside it
- [ ] The contrast test iterates `tokens.pairings.json` in both themes and asserts its row count matches the documented table
- [ ] Theme and density propagate through React context; a Combobox inside a dark compact `<ClaraScope>` renders dark and compact when portaled to `document.body`
- [ ] Computed assertions hold: 40px/32px control heights, >= 24x24px targets, >= 14px body text in both densities
- [ ] The focus indicator meets 3:1 against every enumerated surface, asserted by computation rather than by a visual baseline

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
| --- | --- | --- | --- |
| EP-01M0GKNH (toolchain) | Blocking | Done | - |
| Style Dictionary 4 | Build | In use |

### Blocking

| Item | Type | Impact |
| --- | --- | --- |
| None remaining | - | All 8 stories Done |

## Risks & Assumptions

### Assumptions

- The six ramps are enough for v1; a new intent would need its own ramp and its own pairings
- Elevation and motion stay Provisional until components consume them (D0035 clause 1)
- Tier 2 names are permanent from first publish, so they were settled before any component shipped

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A pairing is deleted to green a red gate | Anticipated | High - the claim becomes unfalsifiable again | `declaredLock` pins every pair; the list may only grow |
| A waiver generation returns | Observed once (27 waived) | High | Waiver capped by a committed high-water mark that may only shrink |
| A guard keyed on a token NAME goes vacuous at a rename | Observed, three at once | High | Tier comes from the build's manifest, never a name prefix |
| A component reaches past the semantic layer | Observed on the first stylesheet written | Medium - theming silently stops working for that component | Build-time tier validation plus CI gate 2 |

## Technical Considerations

### Architecture Impact

Defines the public token surface, which is permanent from first publish, and the three-tier
boundary that keeps tiers 1 and 3 changeable. Adds context-based theming, which is the reason
overlays can be themed at all.

### Integration Points

The token build (Style Dictionary), the CSS consumers load, and the React context every component
reads for theme and density.

## Sizing

**Size:** XL

_A T-shirt size (S / M / L / XL) - the epic's own coarse estimate, made before decomposition. An epic is never sized in story points; STORY points belong on stories._

**Estimated Story Count:** not recorded

**Derived Point Total:** 44

_DERIVED, not estimated: the sum of this epic's stories' points. `reconcile` recomputes it, so it can never drift from the stories beneath it - do not hand-edit it._

**Complexity Factors:**

- not recorded

## Story Breakdown

- [x] [US-01M0GMN0: F00 foundations pass: decide the visual language](../stories/US-01M0GMN0-f00-foundations-pass-decide-the-visual-language.md)
- [x] [US-01M0GME0: Token pipeline and tier enforcement](../stories/US-01M0GME0-token-pipeline-and-tier-enforcement.md)
- [x] [US-01M0GMAE: Semantic token layer](../stories/US-01M0GMAE-semantic-token-layer.md)
- [x] [US-01M0GM66: Legal pairing table and the contrast gate](../stories/US-01M0GM66-legal-pairing-table-and-the-contrast-gate.md)
- [x] [US-01M0GMMX: Public token manifest and reference gate](../stories/US-01M0GMMX-public-token-manifest-and-reference-gate.md)
- [x] [US-01M0GM5M: Theming: light, dark, and context-based scoping](../stories/US-01M0GM5M-theming-light-dark-and-context-based-scoping.md)
- [x] [US-01M0GMC6: Density modes with computed geometry assertions](../stories/US-01M0GMC6-density-modes-with-computed-geometry-assertions.md)
- [x] [US-01M0GMT2: Typography scale and tabular numerals](../stories/US-01M0GMT2-typography-scale-and-tabular-numerals.md)

## Test Plan

**Test Spec:** [TSnot recorded: not recorded](../test-specs/TSnot recorded-not recorded.md)

## Open Questions

_None open._ Both questions closed on 2026-08-21: `createTheme()` deferred to v1.1 (D0017); a tier 2 token **value** change is a minor, batched and visually changelogged, and a broken contrast pairing is a bug rather than a release (D0021).

## Risks

- The UX seat's documented failure mode is refining foundations indefinitely. The 5-day box is the mitigation and it is held by the document, not by intent
- `bg-warning-emphasis` with on-emphasis text is the pairing most likely to fail at 4.5:1 in any amber ramp. It is decided deliberately in F00 rather than discovered during component work

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
