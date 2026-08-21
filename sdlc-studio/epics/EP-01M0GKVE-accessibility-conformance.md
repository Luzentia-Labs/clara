# EP-01M0GKVE: Accessibility conformance

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

The conformance close: verify the whole library against WCAG 2.2 AA, complete the per-component verification records, and publish an accessibility statement that names the gaps rather than implying coverage. The per-component work happens inside each component epic; this epic is the sweep, the evidence, and the honest public statement.

**PRD features:** F17
**Delivery order:** 10 of 10 - the conformance close, but its practices run throughout
**Depends on:** Every component epic

## Scope

### In Scope

- Full-library WCAG 2.2 AA sweep including 2.4.11 Focus Not Obscured
- A complete and current `verification.md` for every exported component
- A per-component colour-alone audit
- The published accessibility statement: conformance level, testing method, and every known gap
- Reduced-motion support library-wide

### Out of Scope

- A formal VPAT - the posture is an internal bar, not a compliance artifact (D0016). Evidence is retained so one would be cheap later
- NVDA verification - stated known gap
- Forced-colors mode support - stated known gap for v1

## Acceptance Criteria (Epic Level)

- [ ] Zero axe violations at serious or critical severity across all stories; CI fails on any
- [ ] Every interactive component has a documented keyboard interaction table **and a recorded manual keyboard pass**
- [ ] A current `verification.md` exists for every exported component, recording **the strings actually announced**, not the strings expected
- [ ] Focus is visible on every interactive element against every background token, proven by computed contrast assertion
- [ ] No information anywhere in Clara is conveyed by colour alone; the audit covers `Badge` and `Tag` by name
- [ ] `prefers-reduced-motion` disables non-essential animation library-wide
- [ ] The accessibility statement is published and **names NVDA and forced-colors as gaps explicitly**

## Story Breakdown

- [ ] [US-01M0GMA6: Automated accessibility harness and gate](../stories/US-01M0GMA6-automated-accessibility-harness-and-gate.md)
- [ ] [US-01M0GMPS: Keyboard tables and manual verification records](../stories/US-01M0GMPS-keyboard-tables-and-manual-verification-records.md)
- [ ] [US-01M0GMXH: Colour-alone audit](../stories/US-01M0GMXH-colour-alone-audit.md)
- [ ] [US-01M0GMJX: Reduced motion support](../stories/US-01M0GMJX-reduced-motion-support.md)
- [ ] [US-01M0GM3E: Accessibility statement and gap register](../stories/US-01M0GM3E-accessibility-statement-and-gap-register.md)

## Risks

- The failure mode this epic exists to prevent is accessibility collapsing into 'axe passed'. Automation proves attributes are present and nothing more
- Deferring all conformance work to this epic would make it enormous and late. The per-component definition of done is what keeps it a sweep rather than a rescue

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
