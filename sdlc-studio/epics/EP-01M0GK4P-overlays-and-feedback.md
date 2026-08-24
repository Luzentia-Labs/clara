# EP-01M0GK4P: Overlays and feedback

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Modal, Drawer, Popover, Tooltip, DropdownMenu, and the feedback set. This is the highest-risk epic for accessibility: focus management is where keyboard users get stranded, and no automated rule catches a misplaced restoration target.

**PRD features:** F13, F14
**Delivery order:** 4 of 10 - **before** the advanced form controls, which are built on it
**Depends on:** EP EP-01M0GKGS, EP EP-01M0GKNG

## Scope

### In Scope

- Modal, Drawer, Popover, Tooltip, DropdownMenu on Radix, behind the isolation boundary
- Portal scoping: theme and density carried by context and re-applied on the portal root
- Token-driven z-index layer scale with defined nested-overlay stacking
- Toast with provider and live-region announcement; Alert, Badge, Spinner, ProgressBar, Skeleton, EmptyState

### Out of Scope

- Command palette (nice-to-have)
- Combobox and DatePicker popups - they consume this epic's primitives in EP EP-01M0GK91

## Acceptance Criteria (Epic Level)

- [ ] **Every overlay names its initial focus target on open and its restoration target on close, per dismissal route** (Escape, outside click, close button, successful commit)
- [ ] Focus placement is asserted by **element identity**, and each assertion is recorded as observed failing before it counts
- [ ] Escape from a Modal returns focus to the trigger, never to `<body>`
- [ ] A Combobox and a DropdownMenu inside a dark compact `<ClaraScope>` render dark and compact when portaled, captured as a visual baseline
- [ ] No overlay accepts a `theme`, `density`, or `portalContainer` prop
- [ ] Tooltip appears on hover **and** keyboard focus, is Escape-dismissible, and never carries information available nowhere else
- [ ] Scroll lock causes no layout shift from scrollbar removal
- [ ] Error toasts do not auto-dismiss by default; auto-dismiss pauses on hover and on focus
- [ ] All overlays are SSR-safe and render nothing on the server
- [ ] No Radix prop name, type, or `data-*` attribute appears in the public surface

## Story Breakdown

- [ ] [US-01M0GM61: Portal, layer scale, and scoping infrastructure](../stories/US-01M0GM61-portal-layer-scale-and-scoping-infrastructure.md)
- [ ] [US-01M0GM48: Modal](../stories/US-01M0GM48-modal.md)
- [ ] [US-01M0GMWW: Drawer](../stories/US-01M0GMWW-drawer.md)
- [ ] [US-01M0GMQJ: Popover](../stories/US-01M0GMQJ-popover.md)
- [ ] [US-01M0GM31: Tooltip](../stories/US-01M0GM31-tooltip.md)
- [ ] [US-01M0GM9W: DropdownMenu](../stories/US-01M0GM9W-dropdownmenu.md)
- [ ] [US-01M0GMK1: Toast](../stories/US-01M0GMK1-toast.md)
- [ ] [US-01M0GMDG: Alert](../stories/US-01M0GMDG-alert.md)
- [ ] [US-01M0GMDJ: Badge](../stories/US-01M0GMDJ-badge.md)
- [ ] [US-01M0GMBA: Tag](../stories/US-01M0GMBA-tag.md)
- [ ] [US-01M0GMBC: Spinner](../stories/US-01M0GMBC-spinner.md)
- [ ] [US-01M0GMY3: ProgressBar](../stories/US-01M0GMY3-progressbar.md)
- [ ] [US-01M0GMSQ: Skeleton](../stories/US-01M0GMSQ-skeleton.md)
- [ ] [US-01M0GMJ7: EmptyState](../stories/US-01M0GMJ7-emptystate.md)

## Risks

- Focus management is the single most common accessibility defect in component libraries and passes every axe rule when broken. The identity assertions are the mitigation
- Nested overlays (a Select inside a Modal) are where z-index and focus trapping interact badly; the layer scale must be defined before the first overlay ships

## Gaps between stories, found by the foundation's spec review

Two of this epic's own acceptance criteria are owned by no story, which is the "solved once in the
architecture rather than nine times" failure appearing at the epic level rather than in a component:

- **Scroll lock without layout shift** is an epic AC and appears only in Modal AC4. Drawer's five
  criteria contain none, and Drawer locks scroll for the same reason Modal does. Either the
  behaviour belongs in the shared overlay infrastructure with one criterion over it, or Drawer needs
  its own - but it must not be Modal's alone.
- **A portalled overlay rendering dark and compact, captured as a visual baseline** is an epic AC
  owned by nobody. DropdownMenu AC5 covers whole-page dark/compact, which is a different case: the
  point of the portalled one is that the overlay has LEFT the scoped subtree. It also cannot be
  captured until gate 7 is wired (US-01M0GMZW).

Both are recorded here rather than silently absorbed, so whoever picks up Drawer or DropdownMenu
finds them.

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
