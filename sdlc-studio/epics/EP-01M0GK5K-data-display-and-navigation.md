# EP-01M0GK5K: Data display and navigation

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Table and the data display set, plus navigation. Deliberately a well-built basic Table rather than an early DataGrid, on the reasoning that building a grid before a real application defines its requirements produces the wrong grid.

**PRD features:** F15, F16
**Delivery order:** 7 of 10
**Depends on:** EP EP-01M0GKGS, EP EP-01M0GK4P, EP EP-01M0GKM2 (selection controls)

## Scope

### In Scope

- Table: semantic markup, sticky header and first column, sortable headers, row selection, loading/empty/error states
- Card, Avatar, Tag, DescriptionList
- Tabs, Breadcrumb, Pagination. **Navigation `Menu` deferred to v1.1** with F25 AppShell (D0020)
- The status-in-dense-list pattern (icon and label, colour as reinforcement)

### Out of Scope

- DataGrid: virtualization, inline edit, column resize/reorder/pin (v1.1, F24)
- App shell and sidebar navigation (v1.1, F25)

## Acceptance Criteria (Epic Level)

- [ ] Semantic `<table>` with `<caption>`, `<thead>`, and correct `<th scope>`
- [ ] Sortable headers use `aria-sort` and are keyboard-operable buttons within the header cell
- [ ] Numeric columns default to right-aligned with tabular numerals
- [ ] Row selection supports header select-all with the indeterminate state
- [ ] Row surface precedence holds when a row is striped, hovered, selected, and focused simultaneously
- [ ] **WCAG 2.2 2.4.11 Focus Not Obscured:** a focused row is never hidden beneath the sticky header while tabbing
- [ ] Zebra striping is opt-in and off by default
- [ ] Horizontal overflow scrolls within the table container; the page body never scrolls horizontally
- [ ] Truncated cell values remain **recoverable by keyboard**, not only by pointer hover
- [ ] `Tabs` supports both automatic and manual activation with arrow-key navigation
- [ ] Active navigation state is conveyed by more than colour

## Story Breakdown

- [ ] [US-01M0GM5P: Table core](../stories/US-01M0GM5P-table-core.md)
- [ ] [US-01M0GM77: Table sorting](../stories/US-01M0GM77-table-sorting.md)
- [ ] [US-01M0GM82: Table selection](../stories/US-01M0GM82-table-selection.md)
- [ ] [US-01M0GMVD: Table sticky header and focus visibility](../stories/US-01M0GMVD-table-sticky-header-and-focus-visibility.md)
- [ ] [US-01M0GM8B: Truncation utility](../stories/US-01M0GM8B-truncation-utility.md)
- [ ] [US-01M0GM1R: Status in a dense list pattern](../stories/US-01M0GM1R-status-in-a-dense-list-pattern.md)
- [ ] [US-01M0GMA2: Card](../stories/US-01M0GMA2-card.md)
- [ ] [US-01M0GMZ6: Avatar](../stories/US-01M0GMZ6-avatar.md)
- [ ] [US-01M0GMBF: DescriptionList](../stories/US-01M0GMBF-descriptionlist.md)
- [ ] [US-01M0GMKS: Tabs](../stories/US-01M0GMKS-tabs.md)
- [ ] [US-01M0GMAK: Breadcrumb](../stories/US-01M0GMAK-breadcrumb.md)
- [ ] [US-01M0GMX3: Pagination](../stories/US-01M0GMX3-pagination.md)

## Risks

- Sticky headers plus focus management is a known WCAG 2.2 failure that the PRD originally omitted entirely
- Keyboard-recoverable truncation has no obvious pattern; it needs a design decision before the Table ships

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
