# US-01M0GM5M: Theming: light, dark, and context-based scoping

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** packages/react/src/theme, packages/react/src/index.ts, scripts/lib/surface-contract.mjs, scripts/api-report.mjs
> **Points:** 8

## User Story

**As a** Sofia Marchetti
**I want** theme to propagate through React context so portaled content inherits correctly
**So that** a Popover opened inside a dark sidebar is not light

## Context

### Persona Reference

**Sofia Marchetti** - ships Clara in three applications.
[Full persona details](../personas/sofia-marchetti.md)

### Background

PRD F02 says theme activates via `data-clara-theme` on any ancestor. TRD ADR-006 refines that,
because DOM inheritance alone cannot work: every overlay portals to `document.body` and so leaves
the themed subtree in the DOM while remaining a descendant in the React tree.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD ADR-006 | Propagation | Theme and density travel by React context, not DOM inheritance | AC3 |
| TRD Section 4 rule 2 / D0018 | API | No overlay takes theme, density or portalContainer | AC4 |
| PRD F23 | SSR | No component reads a browser API during render | AC1, AC5 |
| PRD F02 | Flash | The documented pattern avoids a flash of incorrect theme | AC5 |

## Acceptance Criteria

### AC1: Default and system

- **Given** no explicit setting
- **When** the app renders
- **Then** light is the default and the theme follows prefers-color-scheme
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "theme follows system preference"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Explicit forcing

- **Given** data-clara-theme is set
- **When** the app renders
- **Then** the explicit value wins over the system preference
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "explicit theme wins"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Context, not DOM

- **Given** a ClaraScope with a dark theme
- **When** a descendant portals to document.body
- **Then** the portal root carries data-clara-theme=dark and renders dark (TRD ADR-006)
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "portal inherits scoped theme"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC4: No overlay props

- **Given** the public API
- **When** I inspect every overlay
- **Then** none accepts a theme, density, or portalContainer prop
- **Verify:** shell node scripts/api-report.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC5: No flash in SSR

- **Given** a server render
- **When** the page hydrates
- **Then** no layout shift and no flash of the wrong theme
- **Verify:** shell npx vitest run packages/react/src/theme/__tests__/theming.test.tsx -t "no theme flash on hydration"
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Theming: light, dark, and context-based scoping

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| An overlay opens from a dark scope inside a light page | Renders dark - the portal root re-applies the resolved values |
| A scope overrides only density | Keeps the inherited theme |
| The OS preference changes while the page is open | Follows it, via a subscription made in an effect |
| Server render with `theme="system"` | Resolves to light deterministically and never reads matchMedia |
| Any overlay grows a `theme` prop | Fails the surface contract - it is solved once, in the architecture |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] System preference resolves both ways, and follows a later change
- [ ] An explicit theme beats the system preference
- [ ] Portalled content carries the scope's theme, and escapes the provider's subtree
- [ ] A density-only scope inherits the theme
- [ ] Server render emits the attribute already set
- [ ] Server render never reads matchMedia, even for `system`
- [ ] theme/density are rejected on anything but the theming providers

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocked by (resolved) | The tier 2 layer | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `react-dom` `createPortal` | Portalling | Peer, external in the build |
| US-01M0GMAE | Blocked by (resolved) | The tokens the themes override | Done |

## Estimation

**Points:** 8
**Complexity:** High. The portal case is the whole reason for context, and it is the one that cannot be tested by rendering a tree in isolation.

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

**Affects production runtime:** false - nothing is published.

*Reversal is `git revert`.* `ClaraProvider`, `ClaraScope`, `ClaraPortal` and `useClaraSettings` are now public API.

## Open Questions

None.

**Honest limit:** `theme="system"` flashes on first paint by construction - the preference cannot be
read during a server render. The no-flash path is to resolve on the server and pass the theme
explicitly, which is tested; the flash on the convenience path is documented rather than fixed.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
