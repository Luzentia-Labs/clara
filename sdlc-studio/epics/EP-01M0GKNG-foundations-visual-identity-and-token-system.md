# EP-01M0GKNG: Foundations: visual identity and token system

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Decide Clara's visual identity inside a hard 5-day box, then build the three-tier token system, theming, density, and typography on top of the values it produces. Every component epic is blocked on this one, so it starts immediately and ends on schedule whether or not the design pass is satisfied.

**PRD features:** F00, F01, F02, F03, F04
**Delivery order:** 2 of 10 - runs in parallel with the toolchain epic. **F00 blocks everything downstream.**
**Depends on:** None (F00 is design work). EP EP-01M0GKNH is parallel, not a prerequisite.

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

## Story Breakdown

- [ ] [US-01M0GMN0: F00 foundations pass: decide the visual language](../stories/US-01M0GMN0-f00-foundations-pass-decide-the-visual-language.md)
- [ ] [US-01M0GME0: Token pipeline and tier enforcement](../stories/US-01M0GME0-token-pipeline-and-tier-enforcement.md)
- [ ] [US-01M0GMAE: Semantic token layer](../stories/US-01M0GMAE-semantic-token-layer.md)
- [ ] [US-01M0GM66: Legal pairing table and the contrast gate](../stories/US-01M0GM66-legal-pairing-table-and-the-contrast-gate.md)
- [ ] [US-01M0GMMX: Public token manifest and reference gate](../stories/US-01M0GMMX-public-token-manifest-and-reference-gate.md)
- [ ] [US-01M0GM5M: Theming: light, dark, and context-based scoping](../stories/US-01M0GM5M-theming-light-dark-and-context-based-scoping.md)
- [ ] [US-01M0GMC6: Density modes with computed geometry assertions](../stories/US-01M0GMC6-density-modes-with-computed-geometry-assertions.md)
- [ ] [US-01M0GMT2: Typography scale and tabular numerals](../stories/US-01M0GMT2-typography-scale-and-tabular-numerals.md)

## Risks

- The UX seat's documented failure mode is refining foundations indefinitely. The 5-day box is the mitigation and it is held by the document, not by intent
- `bg-warning-emphasis` with on-emphasis text is the pairing most likely to fail at 4.5:1 in any amber ramp. It is decided deliberately in F00 rather than discovered during component work

## Open Questions

_None open._ Both questions closed on 2026-08-21: `createTheme()` deferred to v1.1 (D0017); a tier 2 token **value** change is a minor, batched and visually changelogged, and a broken contrast pairing is a bug rather than a release (D0021).

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
