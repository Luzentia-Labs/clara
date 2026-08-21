# EP-01M0GKGS: Primitives: icons, layout, and actions

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

The first components, and the ones that set every convention the rest of the library inherits: the `as` polymorphism idiom, ref forwarding, the token-only styling rule, and the focus indicator in practice. Getting these conventions right matters more than the components themselves.

**PRD features:** F05, F06, F07
**Delivery order:** 3 of 10
**Depends on:** EP EP-01M0GKNG (tokens), EP EP-01M0GKNH (build)

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

## Story Breakdown

- [ ] [US-01M0GMGZ: The `as` polymorphism idiom](../stories/US-01M0GMGZ-the-as-polymorphism-idiom.md)
- [ ] [US-01M0GMYZ: Icon pipeline and the enumerated v1 icon set](../stories/US-01M0GMYZ-icon-pipeline-and-the-enumerated-v1-icon-set.md)
- [ ] [US-01M0GMJK: Box](../stories/US-01M0GMJK-box.md)
- [ ] [US-01M0GMVN: Stack](../stories/US-01M0GMVN-stack.md)
- [ ] [US-01M0GMQ7: Inline](../stories/US-01M0GMQ7-inline.md)
- [ ] [US-01M0GMZC: Grid](../stories/US-01M0GMZC-grid.md)
- [ ] [US-01M0GMBJ: Divider](../stories/US-01M0GMBJ-divider.md)
- [ ] [US-01M0GM69: Button](../stories/US-01M0GM69-button.md)
- [ ] [US-01M0GMW1: IconButton](../stories/US-01M0GMW1-iconbutton.md)
- [ ] [US-01M0GM3S: ButtonGroup](../stories/US-01M0GM3S-buttongroup.md)
- [ ] [US-01M0GMK8: Link](../stories/US-01M0GMK8-link.md)

## Risks

- Conventions set here are inherited by 20+ later components, so a wrong call is expensive to unwind. The API report gate makes the surface visible in review from the first component

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
