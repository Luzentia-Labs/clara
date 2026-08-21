# EP-01M0GKV1: Reference application

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

A real list screen and a real form screen, built entirely on Clara, consuming the published tarball. This is the integration proof and the gate on v1.0. Its purpose is to find API problems while they are still cheap to fix, which it cannot do if it is built last.

**PRD features:** F31
**Delivery order:** 8 of 10 - **starts at roughly the 40% mark, not at the end**
**Depends on:** EP EP-01M0GKM2 at minimum; grows as later epics land

## Scope

### In Scope

- A list screen: Table with sort/selection/sticky header, Pagination, SearchInput, filters, EmptyState, bulk action
- A form screen: Field framework end to end with every input type, validation, Modal confirmation, Toast on save
- A findings log recording every place the application needed an escape hatch

### Out of Scope

- A real backend - fixtures only
- Production deployment
- Visual design beyond what Clara provides

## Acceptance Criteria (Epic Level)

- [ ] Both screens are built entirely from `@luzentialabs/clara-react`, with no ad-hoc CSS beyond page layout
- [ ] **Every escape hatch the application needs is recorded as a finding against the component that forced it.** This is the output the epic exists to produce
- [ ] Both screens are operable end to end by keyboard alone
- [ ] Both pass the axe suite and render correctly in dark theme and compact density
- [ ] The application consumes the **published tarball**, not workspace source
- [ ] **No PRD feature row is marked Complete for v1.0 until the reference application renders on it**
- [ ] Every must-have component row can name the screen that consumes it, or moves to v1.1 with a revival condition

## Story Breakdown

- [ ] [US-01M0GMP0: Reference app scaffold consuming the published tarball](../stories/US-01M0GMP0-reference-app-scaffold-consuming-the-published-tarball.md)
- [ ] [US-01M0GM4H: List screen](../stories/US-01M0GM4H-list-screen.md)
- [ ] [US-01M0GME4: Form screen](../stories/US-01M0GME4-form-screen.md)
- [ ] [US-01M0GMP1: Findings review and the v1.0 consuming-need audit](../stories/US-01M0GMP1-findings-review-and-the-v1-0-consuming-need.md)

## Risks

- Treating this as a demo rather than a deliverable is the failure mode. Two review seats independently identified it as the highest-risk deferral in the PRD
- Starting it late defeats its purpose entirely: it finds problems cheaply only while the API is still soft

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
