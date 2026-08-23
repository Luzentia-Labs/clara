# EP-01M0GKGS: Primitives: icons, layout, and actions

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full

## Summary

The first components, and the ones that set every convention the rest of the library inherits: the `as` polymorphism idiom, ref forwarding, the token-only styling rule, and the focus indicator in practice. Getting these conventions right matters more than the components themselves.

**PRD features:** F05, F06, F07
**Delivery order:** 3 of 10
**Depends on:** EP EP-01M0GKNG (tokens), EP EP-01M0GKNH (build)

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
| --- | --- | --- | --- |
| PRD | Performance | Per-component JS budgets | One chunk per client component; 48 icons at 1.78 kB gzipped |
| PRD | Security | No runtime environment reads | These are presentational components |
| TRD Section 4 rule 8 | Architecture | `as` is the only polymorphism idiom | Every polymorphic component shares one typed contract |
| TRD Section 6 | Tech Stack | Component CSS reads tier 2 or 3 only | Gate 2, on the first stylesheets that could break it |

## Business Context

### Problem Statement

Every later component composes these. A layout primitive that took a raw spacing value, or a
button whose disabled state left the tab order, would be copied into forty components before
anyone noticed - and by then it is public API.

**PRD Reference:** PRD F03 (primitives), F04 (actions), F05 (icons)

### Value Proposition

The first real component surface, and the first time the foundations were used rather than
asserted. Three gates that had been pending since the beginning - axe, computed geometry, and the
component-CSS tier lint - could finally be wired, because there was something to check.

### Success Metrics

| Metric | Current | Target | Measurement |
| --- | --- | --- | --- |
| Components shipped | 2 fixtures | 14 real | the public API report |
| Icons | 0 | 48, counted per category | `check-icons` |
| Gates wired | 14 | 17 of 19 | `check-ci-gates` |
| axe coverage | none | every component, 4 theme/density combinations | `check:axe` |

## Scope

### In Scope

- Icon set on a 24x24 grid with the SVG-to-component pipeline
- Layout primitives: Stack, Inline, Grid, Box, Divider, with token-constrained spacing props
- Button, IconButton, ButtonGroup, Link
- The `as` polymorphism idiom, applied consistently and typed

### Out of Scope

- Icons beyond those Clara's own components need plus common ERP actions
- App shell and navigation layout (v1.1)

## Acceptance Criteria (Epic Level)

- [ ] `as` is the only polymorphism idiom; `asChild` appears nowhere in the public surface or the API report
- [ ] `IconButton` without an `aria-label` is a **TypeScript error**, not a runtime warning
- [ ] Spacing props accept only token scale values, enforced by TypeScript union types
- [ ] Button loading state preserves width (no layout shift) and announces via `aria-busy`
- [ ] `ButtonGroup` manages roving focus with arrow keys
- [ ] Importing a single icon adds <= 1KB gzipped; `Button` alone adds <= 3KB gzipped of JS
- [ ] Every component meets the full definition of done, including a recorded manual keyboard pass

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
| --- | --- | --- | --- |
| EP-01M0GKNG (foundations) | Blocking | Done | - |
| EP-01M0GKNH (toolchain) | Blocking | Done | - |

### Blocking

| Item | Type | Impact |
| --- | --- | --- |
| None remaining | - | All 11 stories Done |

## Risks & Assumptions

### Assumptions

- `as` covers every polymorphism need in v1; `asChild` is never reintroduced (D0008)
- The 48-icon set is enough for v1; adding one is a deliberate, counted change
- Component names and props are permanent from the first publish

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A loose polymorphic type accepts anything | Anticipated | High - it type-checks and breaks at runtime | Negative cases asserted at compile time with `@ts-expect-error` |
| An icon-only control ships with no accessible name | The commonest ERP a11y defect | High | `label` is a required prop, so omission is a compile error |
| An accessibility defect passes review | Observed - axe caught a CRITICAL on ButtonGroup's first run | High | axe on every component, in four theme/density combinations |
| A component hardcodes a value and works in one theme only | Anticipated | Medium | The full theme x density matrix is rendered and asserted |

## Technical Considerations

### Architecture Impact

Fixes the API shape every later component inherits: one polymorphism idiom, required accessible
names where a control has no visible text, and `aria-disabled` rather than the disabled attribute.
All three are permanent from the first publish.

### Integration Points

The token layer (tier 2 and 3 only), the theming context, and the icon pipeline that generates
components from SVG source.

## Sizing

**Size:** L

_A T-shirt size (S / M / L / XL) - the epic's own coarse estimate, made before decomposition. An epic is never sized in story points; STORY points belong on stories._

**Estimated Story Count:** not recorded

**Derived Point Total:** 26

_DERIVED, not estimated: the sum of this epic's stories' points. `reconcile` recomputes it, so it can never drift from the stories beneath it - do not hand-edit it._

**Complexity Factors:**

- not recorded

## Story Breakdown

- [x] [US-01M0GMGZ: The `as` polymorphism idiom](../stories/US-01M0GMGZ-the-as-polymorphism-idiom.md)
- [x] [US-01M0GMYZ: Icon pipeline and the enumerated v1 icon set](../stories/US-01M0GMYZ-icon-pipeline-and-the-enumerated-v1-icon-set.md)
- [x] [US-01M0GMJK: Box](../stories/US-01M0GMJK-box.md)
- [x] [US-01M0GMVN: Stack](../stories/US-01M0GMVN-stack.md)
- [x] [US-01M0GMQ7: Inline](../stories/US-01M0GMQ7-inline.md)
- [x] [US-01M0GMZC: Grid](../stories/US-01M0GMZC-grid.md)
- [x] [US-01M0GMBJ: Divider](../stories/US-01M0GMBJ-divider.md)
- [x] [US-01M0GM69: Button](../stories/US-01M0GM69-button.md)
- [x] [US-01M0GMW1: IconButton](../stories/US-01M0GMW1-iconbutton.md)
- [x] [US-01M0GM3S: ButtonGroup](../stories/US-01M0GM3S-buttongroup.md)
- [x] [US-01M0GMK8: Link](../stories/US-01M0GMK8-link.md)

## Test Plan

**Test Spec:** [TSnot recorded: not recorded](../test-specs/TSnot recorded-not recorded.md)

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Risks

- Conventions set here are inherited by 20+ later components, so a wrong call is expensive to unwind. The API report gate makes the surface visible in review from the first component

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
