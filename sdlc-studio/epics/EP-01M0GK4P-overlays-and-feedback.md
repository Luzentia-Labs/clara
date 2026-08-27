# EP-01M0GK4P: Overlays and feedback

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full

## Summary

Modal, Drawer, Popover, Tooltip, DropdownMenu, and the feedback set. This is the highest-risk epic for accessibility: focus management is where keyboard users get stranded, and no automated rule catches a misplaced restoration target.

**PRD features:** F13, F14
**Delivery order:** 4 of 10 - **before** the advanced form controls, which are built on it
**Depends on:** EP EP-01M0GKGS, EP EP-01M0GKNG

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
| --- | --- | --- | --- |
| PRD | Performance | Per-component JavaScript budgets apply (5 kB gzipped for a client chunk). CSS is deliberately NOT tree-shaken and ships as one stylesheet per package | Every overlay carries Radix, so the third-party chain is the budget's real content. `sync-size-budgets.mjs` authors a ceiling per dependency and FAILS on an unlisted one rather than inheriting a constant |
| PRD | Security | The library reads no environment variables at runtime and makes no network call | No AC of its own here. Recorded so its absence is a finding rather than an omission |
| TRD Section 7 | Architecture | Every portalled surface renders through `ClaraPortal`, takes its stacking from the shared overlay layer token, and returns null on the server. Which of two overlays paints on top is decided by OPEN order, not mount order (D0088, D0102) | The whole epic rests on US-01M0GM61. It also means gate 9's static fixture can hold NO overlay - `renderToStaticMarkup` plus a null-on-server portal - so every rendered claim in this epic is asserted against a live Storybook build instead |
| TRD | Tech Stack | Radix UI supplies focus scope, dismissal and positioning (ADR-004). No Radix type, prop name or `data-*` attribute may reach the public surface; `asChild`, `onOpenChange` and `data-state` are never Clara API | Epic AC10, held by `check:api-report`. It also bounds what this epic can fix: Tab-closes-a-menu and the popover trigger's `aria-haspopup` are Radix behaviours, filed rather than fought |

## Business Context

### Problem Statement

An ERP screen is layered by nature: a record opens over a list, a filter opens over a table, a
confirmation opens over the edit that provoked it. Every one of those layers is a place a keyboard
user can be stranded, and stranding is silent - the page looks right, and focus is on `document.body`.

Sofia has assembled the same twenty-five components four times across three libraries, and each time
she has lost a week to the same fights: a Select that will not open inside a Modal, an overlay that
returns focus to the top of the page, a drawer with weaker keyboard behaviour than the dialog beside
it because it was added later and nobody re-derived the rules. Grace is the person those defects
actually land on.

**PRD Reference:** [F13 Overlays and F14 Feedback and status](../prd.md#f13-overlays)

### Value Proposition

One portal mechanism, one layer scale, one focus implementation - so the twenty-sixth overlay is
predictable from the twenty-fifth, and a drawer is not a second-class dialog.

The part that is hard to buy elsewhere is that the guarantees are CHECKED. Focus restoration is
asserted by element identity against a page where the anonymous fallback would land somewhere else;
every rendered claim is measured in a browser because jsdom would say yes to all of them; and every
criterion carries the production edit its own test must fail on.

### Success Metrics

| Metric | Current | Target | Measurement |
| --- | --- | --- | --- |
| Stories Done in this epic | 7 of 14 | 14 of 14 | `sdlc-studio/stories/_index.md`, maintained by `reconcile` |
| Criteria whose verifier can reach the file its own mutant changes | 92 across the project | Every criterion in this epic | `node scripts/check-story-verifiers.mjs` |
| Overlays proved to render through `ClaraPortal` and take a layer token | 6 of 6 built | 6 of 6 | `node scripts/check-overlay-contract.mjs` |
| Rendered claims asserted in a real browser rather than jsdom | 34 | Every geometry, motion, colour or pointer claim in the epic | `pnpm test:e2e` |
| Radix names in the public surface | 0 | 0 - permanently, because publishing is a one-way door | `node scripts/check-api-report.mjs` |

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
- [x] A **DropdownMenu** inside a dark compact `<ClaraScope>` renders dark and compact when portalled.
      Held by the theme-and-density matrix criterion in every overlay story, each of which walks UP
      from an element inside the panel rather than querying the render container - the container
      carries the same attributes, so querying it found a correct-looking answer that was never the
      portal's scope (D0065)
- [ ] **Split, because as written this criterion named work outside its own epic.** Two halves cannot
      be delivered here and are not this epic's to deliver: **Combobox** does not exist and belongs to
      EP-01M0GK91, which inherits `ClaraPortal` and the layer scale from US-01M0GM61; and **"captured
      as a visual baseline"** needs gate 7, which is unwired and owned by US-01M0WSME. Both are
      recorded in Dependencies as non-blocking. Leaving the criterion whole would have made this epic
      un-closable for reasons belonging to two other units
- [ ] No overlay accepts a `theme`, `density`, or `portalContainer` prop
- [ ] Tooltip appears on hover **and** keyboard focus, is Escape-dismissible, and never carries information available nowhere else
- [ ] Scroll lock causes no layout shift from scrollbar removal
- [ ] Error toasts do not auto-dismiss by default; auto-dismiss pauses on hover and on focus
- [ ] All overlays are SSR-safe and render nothing on the server
- [ ] No Radix prop name, type, or `data-*` attribute appears in the public surface

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
| --- | --- | --- | --- |
| EP-01M0GKNG (foundations, visual identity, tokens) | Blocking | Done | The tier 2 semantic layer every colour here resolves through, and the density scale |
| EP-01M0GKNH (toolchain and release pipeline) | Blocking | Done | The build, the deterministic guards, and CI |
| EP-01M0GKGS (primitives, icons, layout, actions) | Blocking | Done | `Button`, `IconButton` and the icon set every overlay renders |
| US-01M0WSME (Storybook workspace + visual regression) | Non-blocking | Draft | Gate 7. It owns the two definition-of-done artefacts this epic cannot produce: a captured visual baseline, and the appearance half of epic AC4 |
| EP-01M0GK91 (advanced form controls) | Non-blocking | Draft | Owns `Combobox`, which epic AC4 originally named. See the note under that criterion |

### Blocking

| Item | Type | Impact |
| --- | --- | --- |
| EP-01M0GK5K (data display and navigation) | Blocking | A `Table` row action opens a `DropdownMenu`; a column filter opens a `Popover`. Both are this epic's |
| EP-01M0GK91 (advanced form controls) | Blocking | `Select` and `Combobox` are popper surfaces and inherit `ClaraPortal`, the layer scale and the open-order rule from US-01M0GM61 |
| EP-01M0GKVE (accessibility conformance) | Blocking | Focus management is the highest-risk surface in the library and it is this epic's; the conformance epic audits what is built here |

## Risks & Assumptions

### Assumptions

- Radix's focus scope, dismissal and positioning are correct enough to build on, and where they are
  not, Clara owns the difference rather than forking them (ADR-004). Measured exceptions are filed,
  not patched around: BG-01M103BV (Tab does not close a menu, against the APG) and BG-01M105C0
  (the popover trigger announces `aria-haspopup="dialog"` while its panel is a group).
- jsdom is adequate for structure, roles and names, and adequate for NOTHING about geometry, motion,
  colour or pointers. Every claim in the second category is asserted in a browser.
- A manual keyboard pass and screen-reader verification remain outstanding across the library, and
  every verification record says so rather than implying otherwise.

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A focus restoration target that is wrong only on one dismissal route | High - it happened repeatedly | A keyboard user stranded on `document.body`, which is the failure these components are named for | Restoration is ONE implementation (`lib/overlay-focus.ts`), shared by Modal and Drawer, and the parity tests run the same scenarios against both. Nine adversarial rounds are recorded in its comments |
| A test that observes a PROXY rather than the property (D0065) | High - found at three depths in one story | A criterion reads as proved when the property it names can still be wrong | Every criterion carries a Test Plan row naming the production edit its verifier must fail on, and the edit is RUN. `check-story-verifiers` refuses a row whose `Touches` file the verifier cannot reach |
| A repair introducing a worse defect than the one it fixed | Measured once, and it was the worst defect of the run | The shared toast stack published during render, so any Suspense boundary orphaned an entry that owned the host forever and `<Toast>` rendered nothing, permanently, with every gate green | Confirming rounds. The author never records their own sign-off, and a repair is re-reviewed rather than assumed |
| Publishing a prop name or tier 2 token that later has to change | Low now, permanent if it happens | A one-way door: consumers already shipped break | `check:api-report` diffs the public surface, and no overlay accepts `theme`, `density` or `portalContainer` |

## Technical Considerations

### Architecture Impact

This epic establishes the portal layer the rest of the library builds on. `ClaraPortal` creates the
host, stamps theme and density onto it, and returns null on the server; the layer scale gives every
portalled surface ONE `z-index`, so which of two overlays paints on top is decided by open order and
tree order rather than by a per-role number nobody can reason about (D0088, D0102).

Two consequences reach beyond this epic. `Select`, `Combobox` and every future popper inherit the
whole mechanism rather than reimplementing it. And gate 9's static geometry fixture can hold no
overlay at all - it is a `renderToStaticMarkup` render and the portal returns null on the server by
design - so every rendered claim about an overlay is asserted against a served Storybook build.

### Integration Points

- `ClaraProvider` / `ClaraScope` - the portal host reads the nearest settings and stamps them onto
  the host, so a portalled panel is themed by where it was WRITTEN and not by where it lands
- `@radix-ui/react-*` - focus scope, dismissal, positioning. Bounded by `check:api-report`, which
  fails on any Radix prop name, type or `data-*` attribute in the public surface
- `packages/react/src/styles.css` - one stylesheet, layered, with the panel shape and value
  contracts in `check-component-css.mjs` enrolling every portalled surface
- `e2e/stacking.spec.ts` - where every rendered claim in this epic lives, because jsdom can hold none
  of them

## Sizing

**Size:** XL

_A T-shirt size (S / M / L / XL) - the epic's own coarse estimate, made before decomposition. An epic is never sized in story points; STORY points belong on stories._

**Estimated Story Count:** 14

**Derived Point Total:** 54

_DERIVED, not estimated: the sum of this epic's stories' points. `reconcile` recomputes it, so it can never drift from the stories beneath it - do not hand-edit it._

**Complexity Factors:**

- Focus management is the highest-risk surface in the library, and no automated rule catches a
  misplaced restoration target - only a test that asserts the target by IDENTITY, against a page
  where the fallback would land somewhere else
- Every rendered claim needs a browser, because jsdom resolves no `var()`, computes no layout, has
  no pointer and returns no animation - and the static fixture cannot hold a portal
- Radix is a dependency with opinions. Where its behaviour and the APG disagree, the choice is
  Clara's to make and to record
- Publishing is a one-way door, and this epic defines the prop vocabulary six later components copy

## Story Breakdown

- [x] [US-01M0GM61: Portal, layer scale, and scoping infrastructure](../stories/US-01M0GM61-portal-layer-scale-and-scoping-infrastructure.md)
- [x] [US-01M0GM48: Modal](../stories/US-01M0GM48-modal.md)
- [x] [US-01M0GMWW: Drawer](../stories/US-01M0GMWW-drawer.md)
- [x] [US-01M0GMQJ: Popover](../stories/US-01M0GMQJ-popover.md)
- [x] [US-01M0GM31: Tooltip](../stories/US-01M0GM31-tooltip.md)
- [x] [US-01M0GM9W: DropdownMenu](../stories/US-01M0GM9W-dropdownmenu.md)
- [x] [US-01M0GMK1: Toast](../stories/US-01M0GMK1-toast.md)
- [x] [US-01M0GMDG: Alert](../stories/US-01M0GMDG-alert.md)
- [x] [US-01M0GMDJ: Badge](../stories/US-01M0GMDJ-badge.md)
- [x] [US-01M0GMBA: Tag](../stories/US-01M0GMBA-tag.md)
- [x] [US-01M0GMBC: Spinner](../stories/US-01M0GMBC-spinner.md)
- [x] [US-01M0GMY3: ProgressBar](../stories/US-01M0GMY3-progressbar.md)
- [x] [US-01M0GMSQ: Skeleton](../stories/US-01M0GMSQ-skeleton.md)
- [x] [US-01M0GMJ7: EmptyState](../stories/US-01M0GMJ7-emptystate.md)

## Test Plan

There is no separate test spec for this epic, and that is deliberate rather than missing: the
executable plan lives per story, as a `## Test Plan` table naming - for every criterion - the
production edit its verifier must fail on. `check-story-verifiers.mjs` enforces one row per
criterion and proves each row's `Verify:` selector can reach the file its own mutant changes.

The epic-level gates that hold this epic as a whole:

| Gate | What it holds |
| --- | --- |
| `node scripts/check-overlay-contract.mjs` | Every built overlay RENDERS `ClaraPortal` and takes its stacking from a layer token - resolved to a fixpoint across all component files, so a re-export, an alias or an alias chain cannot hide a Radix portal |
| `node scripts/check-component-css.mjs` | Tier 2 and 3 tokens only, plus the shape and value contracts enrolling all six portalled panels |
| `pnpm test:e2e` | Every rendered claim: the tooltip hover bridge, both directions of D0102 layering, toast stacking and motion class, drawer placement and entrance, popover collision, panel contrast in both themes, and intent-colour binding |
| `node scripts/check-verification.mjs` | A per-component record with a keyboard table, resolving citations, and a manual pass either recorded or plainly declared outstanding |
| `node scripts/check-api-report.mjs` | No Radix prop name, type or `data-*` in the public surface; no `any`; no bare `string` for a closed value set |

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Risks

- Focus management is the single most common accessibility defect in component libraries and passes every axe rule when broken. The identity assertions are the mitigation
- Nested overlays (a Select inside a Modal) are where z-index and focus trapping interact badly; the layer scale must be defined before the first overlay ships

## Gaps between stories, found by the foundation's spec review

Two of this epic's own acceptance criteria were owned by no story, which is the "solved once in the
architecture rather than nine times" failure appearing at the epic level rather than in a component:

- **Scroll lock without layout shift** was an epic AC appearing only in Modal AC4, while Drawer
  locks scroll for the same reason Modal does. **Now owned:** Drawer AC6 (US-01M0GMWW). Recording
  it in prose was necessary and not sufficient - a criterion with no story is a criterion nothing
  runs, so it has been given the second component that needs it rather than left as a note.
- **A portalled overlay rendering dark and compact, captured as a visual baseline** is an epic AC
  owned by nobody, and cannot be given an owner today: it cannot be captured until visual regression
  (gate 7, US-01M0WSME) is wired. DropdownMenu AC5 covers whole-page dark/compact, which is a
  different case - the point of the portalled one is that the overlay has LEFT the scoped subtree.
  **Outstanding**, and it belongs to whichever overlay story is being written when gate 7 lands.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
