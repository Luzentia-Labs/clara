# US-01M0GM48 Modal - specification delta

> The engagement floor (AGENTS.md): this change touches more than one source file, so every existing
> requirement it interacts with is named here, with how the interaction is resolved, BEFORE any code.
> One acceptance criterion per interaction that needs one.
>
> Derived at `b5e2ab1`. Facts below were measured, not assumed - the measurement is stated each time.

## What Modal is the first of

Modal is the first overlay, so it is the first consumer of everything US-01M0GM61 built and the
trigger for two things the foundations epic deliberately left open. Thirteen more overlays inherit
whatever is settled here, which is why the delta is long: almost none of it is Modal-specific.

## A. Interactions with what already exists

| # | Existing requirement | How Modal touches it | Resolution | AC |
| --- | --- | --- | --- | --- |
| 1 | **D0090** - `ClaraPortal` takes a required `open` | Modal renders through it | Modal passes its own `open` straight through. It does not wrap it in a `Presence` or a conditional - that is the shape D0090 exists to stop | AC1 |
| 2 | **D0090** - portalled content lands on the SECOND commit; focus must come from inside | AC1 "focus moves to its named initial target" | The focus effect lives in the portalled content, not in Modal's own body. An effect in Modal's body finds a null ref - proved in `theming.test.tsx` | AC1 |
| 3 | **D0088** - one `overlay` layer, DOM order decides nesting | Scrim and panel | Both live in ONE portal host as siblings, panel after scrim. No per-role token, no z-index between them; the browser's tree order already separates them | AC9 |
| 4 | **D0087/D0088 z-index guard** | `.clara-modal` CSS | `var(--clara-layer-overlay)` on the base class, with an unconditional non-static `position` on the same base class - the guard requires the companion | AC6 |
| 5 | **ADR-004 / D0003** - Radix behind a hard isolation boundary | Modal wraps `@radix-ui/react-dialog` | No `asChild`, `onOpenChange`, `data-state`, or any Radix type in Clara's surface. `check-api` already fails on all four | AC10 |
| 6 | **`check-bundled-peers`** - "declared dependencies and peers must stay external" | Radix is a new dependency | **Measured:** Radix Dialog is **15.19 kB gzipped**. Bundled it would be 3x the whole per-component budget. The build's `external` list was hardcoded and did not include it, so it WAS bundled and the guard caught it. Fixed at the root: the list is now read from the manifest, so the rule lives in one place | AC11 |
| 7 | **Per-component size budget, 5 kB** | Modal's chunk | With Radix external the chunk carries Clara's wrapper only. Budget stays 5 kB; no recalibration needed, which is a better answer than the one anticipated | AC11 |
| 8 | **`check-client-boundary`** | Modal is interactive | Classified `client`, entry in `client-boundary.json`, its own stamped chunk | AC10 |
| 9 | **TRD Section 6** - component CSS reads tier 2 or 3 only | Modal stylesheet | Tier 3 `modal-*` tokens over tier 2 | AC6 |
| 10 | **SHAPE_CONTRACT** (`check-component-css.mjs`) | jsdom computes no layout, so nothing else can see a modal with no box | `.clara-modal` and `.clara-modal__scrim` get entries | AC6 |
| 11 | **D0005** - all CSS inside `@layer clara.components` | Modal stylesheet | Automatic through the build; asserted by `check-stylesheets` | AC6 |
| 12 | **Drawer AC6** (added this run) | Scroll lock is now owned by two stories | The lock is written once in Modal's implementation and reused, not solved twice | AC4 |
| 13 | **Epic AC** - portalled overlay dark/compact visual baseline | Modal is the obvious first subject | **Still cannot be owned.** It needs gate 7 (US-01M0GMZW), which is not wired. Stays outstanding at epic level rather than being quietly absorbed here | - |
| 14 | **`as` is Clara's only polymorphism idiom** | Modal | Not polymorphic. A dialog that renders as something else is not a dialog. Stated so the next reader does not have to wonder | - |

## B. Two things Modal is contractually obliged to decide

Both are `Provisional` in F00 with a written revisit condition, and this story meets one of them.

### B1. Elevation - the revisit condition fires HERE

`design/foundations.md` deliverable 6: *"Not expressed as shadow tokens yet. Surfaces are
distinguished by `bg` steps only. **Revisit when:** the first Modal and Popover ship - shadows
barely register in dark theme, so this needs both themes side by side."*

This story is the first half of that condition. It cannot be deferred silently: a provisional value
whose revisit condition has fired and which nobody revisited is exactly the drift
`check-foundations` was written to catch.

**Resolution:** decide it here, with both themes on screen, or record why the second half (Popover)
is genuinely needed first. Not left unmentioned either way.

### B2. Scrim colour - a new permanent public token

No scrim colour exists. `color.bg` has 18 roles and none of them is a backdrop. A modal without one
has nothing to separate it from the page.

**Resolution:** a new tier 2 token is public API and permanent from first publish (PRD F01, D0007),
so it needs a recorded decision and a `tokens.public.lock.json` entry in the same commit - not a
tier 3 token invented inside Modal, which is where a backdrop colour would naturally but wrongly go.

### B3. Motion - the revisit condition does NOT fire here

Deliverable 10's condition is *"the first Drawer and Toast ship"*. Modal is neither. Tier 1
durations exist (`instant 0 · fast 120ms · base 200ms`) and motion may communicate *state change and
spatial origin only*. Modal uses them or ships without a transition; it does not promote them to
tier 2, because that is Drawer's and Toast's call to make.

## C. What the story was missing

- **No Test Plan.** Eight criteria, no mutant named for any of them. `check-story-verifiers`
  requires 1:1 rows.
- **No keyboard interaction table**, though Technical Notes says "this component has a documented
  keyboard interaction table, so the table is the specification and its tests are written first
  (D0024)". The table does not exist, so the TDD instruction currently points at nothing.
- **AC1 and AC2 say "named" target** without saying named by what. Focus restoration "asserted by
  element identity" is right and needs the API that makes it expressible.
- **No criterion for the Radix boundary**, which is the single most permanent thing here.

## D. New criteria this delta adds

| AC | Why it did not exist |
| --- | --- |
| AC9 | Nesting by DOM order was decided after this story was written |
| AC10 | The Radix isolation boundary had no criterion anywhere in the epic |
| AC11 | Radix as a dependency is new, and "stays external" is what keeps the budget honest |

## E. Order of work

1. Tokens and decisions first (B1, B2) - component CSS cannot reference what does not exist.
2. Keyboard table into the story, then its tests (D0024: TDD, table is the specification).
3. Component, then CSS, then the guards' entries (SHAPE_CONTRACT, budget, boundary).
4. Docs page and verification record.
5. `reconcile --verify`, then adversarial review from a seat that did not write it.
