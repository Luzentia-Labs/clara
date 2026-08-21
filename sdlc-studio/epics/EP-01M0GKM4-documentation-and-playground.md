# EP-01M0GKM4: Documentation and playground

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Storybook as the component playground and the source Chromatic reads, plus a docs site that explains the design language rather than merely listing components. The docs site is built with Clara, so a visitor sees the system working before reading a word about it.

**PRD features:** F18, F19
**Delivery order:** 9 of 10 - Storybook starts with the first component, the docs site consolidates later
**Depends on:** EP EP-01M0GKGS onward; Storybook is incremental per component

## Scope

### In Scope

- Storybook with theme and density toolbar toggles, autodocs from TSDoc, a11y addon
- Stories covering default, every variant and size, disabled, loading, error, empty
- Docs site: Getting Started, Principles, Foundations, Components, Patterns, Accessibility, Changelog, Contributing
- The accessibility statement, naming every known gap
- Token reference pages generated from the token source

### Out of Scope

- Figma library (v1.1, F26)
- Video or interactive tutorials

## Acceptance Criteria (Epic Level)

- [ ] CI fails if a component is exported from `@luzentialabs/clara-react` without a story file
- [ ] Every component page carries purpose, when-to-use and when-not-to-use, live examples, props, keyboard interactions, accessibility notes, and do/don't guidance
- [ ] The Patterns section documents the composite ERP patterns Clara does not ship: form layout, list-detail, bulk actions, destructive confirmation, filtering, **and status in a dense list**
- [ ] Token reference pages are generated from `tokens.public.json`, never hand-maintained; CI fails if a non-public token is referenced
- [ ] **The accessibility statement lists every known gap by name** - NVDA unverified, forced-colors untested. A gap that is not listed is a claim of coverage
- [ ] Code examples work when pasted into a fresh project, verified by a CI job that pastes them
- [ ] The docs site is built with Clara and passes the same accessibility gate as the library

## Story Breakdown

- [ ] [US-01M0GMZW: Storybook workspace with theme and density toolbars](../stories/US-01M0GMZW-storybook-workspace-with-theme-and-density-toolbars.md)
- [ ] [US-01M0GMNM: Story coverage gate](../stories/US-01M0GMNM-story-coverage-gate.md)
- [ ] [US-01M0GM8N: Docs site scaffold, built with Clara](../stories/US-01M0GM8N-docs-site-scaffold-built-with-clara.md)
- [ ] [US-01M0GMR4: Generated foundations and token reference](../stories/US-01M0GMR4-generated-foundations-and-token-reference.md)
- [ ] [US-01M0GMVP: Component page template and per-component docs](../stories/US-01M0GMVP-component-page-template-and-per-component-docs.md)
- [ ] [US-01M0GMKM: Patterns section](../stories/US-01M0GMKM-patterns-section.md)
- [ ] [US-01M0GMAV: Copyable examples that are proven to build](../stories/US-01M0GMAV-copyable-examples-that-are-proven-to-build.md)

## Risks

- Documentation is the first thing dropped under time pressure and the reason a design system fails to be adopted, including by its own author six months later

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
