# US-01M0GM9W: DropdownMenu

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** apps/docs/src/content/components/dropdown-menu.md, packages/react/src/components/DropdownMenu/DropdownMenu.tsx, packages/react/src/components/DropdownMenu/DropdownMenu.stories.tsx, packages/react/src/components/DropdownMenu/__tests__/dropdown-menu.test.tsx, packages/react/src/components/DropdownMenu/verification.md, scripts/check-component-css.mjs
> **Points:** 8

## User Story

**As a** Grace Adeyemi
**I want** an actions menu implementing the WAI-ARIA menu pattern
**So that** keyboard users can drive every action without a pointer

## Context

### Persona Reference

**Grace Adeyemi** - drives an ERP day almost entirely from the keyboard, and reaches for a mouse
only when a control leaves her no choice.
[Full persona details](../personas.md#grace-adeyemi)

### Background

A row of ERP records needs a per-row actions affordance: post, void, export, duplicate. Without a
menu each row grows a line of buttons, which is unusable at thirty rows and unreadable at three
hundred.

The pattern is WAI-ARIA's menu, and the reason to adopt Radix rather than write it is that the
pattern is mostly keyboard behaviour - roving focus, typeahead, submenu traversal, disabled skipping
- and every one of those is a place to get accessibility subtly wrong. ADR-004 took that trade
deliberately.

What Clara owns on top is the part Radix cannot: the API shape (`items` as data, so illegal
arrangements cannot be written), the token-only styling, and the portal scope that keeps a menu
opened from a dark sidebar dark.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Portal + scope | Every overlay renders through `ClaraPortal` and takes its stacking from a layer token (US-01M0GM61) | AC6 via `check:overlay-contract` |
| PRD | Bundle | Per-component JS budget, and an authored ceiling for each third-party runtime | AC6 via `pnpm size` (31.11 kB of 34 kB) |
| PRD | Public surface | No Radix type, prop name or `data-*` reaches Clara's API (Section 4 rule 7) | AC6 via `check:api` |

## Acceptance Criteria

### AC1: Menu pattern

- **Given** an open DropdownMenu
- **When** I use the keyboard
- **Then** arrow navigation, typeahead, submenus and disabled-item skipping all behave per the WAI-ARIA authoring practices
- **Verify:** vitest "DropdownMenu keyboard pattern"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC2: Focus restoration

- **Given** an open menu
- **When** it closes by any route
- **Then** focus returns to the trigger, asserted by element identity
- **Verify:** vitest "DropdownMenu focus restoration"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC3: Distinct from navigation

- **Given** the docs
- **When** a consumer chooses between menus
- **Then** DropdownMenu is documented as actions-only; navigation Menu is v1.1 (D0020)
- **And** the verifier checks the LOAD-BEARING strings, not the word "actions". A review
  rewrote the page to present DropdownMenu as a navigation menu - retitled the section,
  deleted the D0020 sentence - and the old `grep "actions"` still exited 0, because the word
  survived in one parenthetical. A criterion whose verifier survives its own Test Plan mutant
  is the defect class this epic exists to remove
- **And** the verifier is a `forbid` list, not a `grep` chain. Three rounds widened the grep - one
  token, then three, then a whole sentence - and each version killed the previous mutant and left
  the next: a page can keep every grepped sentence byte-identical and APPEND "this restriction is
  lifted; entries may be commands OR destinations", which is verbatim the wording this criterion
  forbids. Measured at exit 0 twice. Checking for present strings cannot catch an inversion, because
  inverting a page adds text rather than removing it
- **And** the mechanism already existed for exactly this class: `DOC_CLAIMS` in
  `check-verification.mjs` carries `require` AND `forbid` pairs, and `prove-guards` already proves an
  inverted SearchInput page dies. `dropdown-menu.md` simply was not enrolled
- **Verify:** shell node scripts/check-verification.mjs --component DropdownMenu --docs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC4: Token-only styling

- **Given** the DropdownMenu stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC5: Both themes and densities

- **Given** a DropdownMenu
- **When** it renders in dark theme and compact density
- **Then** it holds its visual baseline in all four combinations
- **Verify:** vitest "DropdownMenu theme and density matrix"
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

### AC6: Definition of done

- **Given** the DropdownMenu story
- **When** it is proposed for export
- **Then** stories, tests, an axe assertion over default and error states, a visual baseline, a docs page, a documented keyboard table and a recorded manual keyboard pass all exist
- **Verify:** shell node scripts/check-verification.mjs --component DropdownMenu
- **Verified:** yes (2026-08-26)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- DropdownMenu

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**TDD.** This component has a documented keyboard interaction table, so the table is the specification and its tests are written first (D0024).

**Points:** 8 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold, a documented keyboard interaction table, and a recorded manual keyboard pass.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A submenu entry is selected | Runs that entry's own handler, closes the WHOLE menu, and returns focus to the trigger |
| An entry is disabled | Announced, never focused by arrows, and its `onSelect` is unreachable |
| `items` changes LENGTH while the menu is open | Roving focus tracks a position, so the highlight can land on a different entry - warned in development, documented, and disclosed in the record |
| `items` changes without changing length | The same hazard, NOT warned - a known limit of the check, recorded |
| Arrowing off either end, at root or in a submenu | Wraps to the other end; `loop` is passed explicitly because Radix defaults it to false |
| Escape inside a submenu | Closes the whole menu, not just the submenu - an APG deviation, recorded rather than claimed away |
| Tab while open | Neither dismisses nor moves focus. Outside AC1's enumeration; recorded |
| A trigger with no accessible name | The menu inherits it, so the menu is unnamed too - the trigger must be named (an `IconButton` carries `label`) |
| A menu longer than the viewport | Caps to the height the popper measured and scrolls; without it the overflow is unreachable under a fixed wrapper |


## Test Scenarios

- [x] Arrow navigation moves the highlight and SKIPS the disabled entry
- [x] Arrowing off either end wraps, at root and inside a submenu
- [x] ArrowRight moves FOCUS into a submenu, not merely revealing it
- [x] Typeahead jumps to an entry by its label
- [x] A non-first entry runs its OWN handler and no other's
- [x] A submenu entry runs its own handler and closes the whole menu
- [x] A disabled entry's handler is unreachable
- [x] A separator is exposed as one and skipped by arrows
- [x] Focus returns to the trigger by identity on Escape, on selection, and on an outside click
- [x] The positioning props reach Radix - the root's four and the submenu's two
- [x] Changing the list length while open warns; a stable list does not
- [x] axe in all four theme x density combinations, scoped so the portalled menu is inspected
- [ ] Rendered geometry in a browser - no e2e case covers this component (recorded gap)
- [ ] Multi-character typeahead, its reset window, and first-letter collisions


## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM61](US-01M0GM61-portal-layer-scale-and-scoping-infrastructure.md) | hard | `ClaraPortal` and the layer scale | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `@radix-ui/react-dropdown-menu` | runtime | Installed, 31.11 kB against an authored 34 kB ceiling |

## Estimation

**Points:** 8
**Complexity:** High. Not for the rendering - that is a recursive map over a union - but for the
keyboard pattern, which is mostly third-party behaviour that has to be verified rather than written.
Five review rounds bear that out: every blocking finding was about EVIDENCE (a fixture that could
not reach what it asserted, a verifier that survived its own mutant, a rationale that was false)
rather than about the component misbehaving.

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

**Affects production runtime:** Yes - a published component and a new runtime dependency.

| Component | Reversal | Expected time |
| --- | --- | --- |
| `@luzentialabs/clara-react` | Nothing is published yet (`NPM_TOKEN` unset), so reversal today is `git revert` of the build commits. Once published, a release is IMMUTABLE and the reversal is a forward patch that removes the export - a breaking change requiring a major. | Pre-publish: minutes. Post-publish: a major release |

If `affects_production_runtime: false`, replace with: *Not applicable – story does not change runtime behaviour.*

## Open Questions

- [x] Should a same-length `items` substitution also warn? **Filed as BG-01M1037M.** The hazard is
      identical; the naive widening (`!==`) warns on every render for the common React shape, so it
      needs a structural comparison rather than an identity one.
- [x] Should Tab close the menu, per the WAI-ARIA APG menu-button pattern? **Filed as BG-01M103BV.**
      Radix's behaviour, not configurable from here, so conformance means Clara owning focus - which
      ADR-004 adopted Radix to avoid.

## Resolved Questions

- **Is a navigation menu still v1.1?** YES - D0020 stands. AC3 forbids presenting this component as
  a navigation menu, and since round 5 that is enforced by a `forbid` list rather than a grep, so the
  page cannot be inverted while the criterion passes. Ruled during this story; no change needed.
- **Is an unaimed action acceptable to ship?** NO in silence, YES disclosed - the QA seat's round-4
  ruling, taken as the design decision. It warns in development, the docs page carries a section, and
  the record carries the gap. BG-01M1037M narrows the remaining case.
