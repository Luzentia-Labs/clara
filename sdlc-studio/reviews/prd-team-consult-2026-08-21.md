# Team Consultation: Clara PRD

**Artefact:** `sdlc-studio/prd.md` v0.1.0
**Date:** 2026-08-21
**Mode:** `consult team` - four isolated seats, one subagent each, independent contexts
**Synthesis:** performed after all four returned; no seat saw another's review

---

## Verdicts

| Seat | Role | Verdict | Core charge |
|------|------|---------|-------------|
| Rhea Okonjo | product | **Concerns** | 23 must-have rows, zero named consuming needs. The PRD argues against itself |
| Anton Reis | engineering | **Concerns** | Six things become permanent at first publish and are left implicit |
| Mira Calderon | qa | **Concerns** | Close enough that the gaps will be mistaken for coverage |
| Idris Vale | ux | **Concerns** | The floors are decided; the language is not |

**4 Concerns, 0 Approve, 0 Reject.** No seat blocked, and no seat waved it through. Every seat
opened by naming what the document gets right before attacking it, which is the behaviour the
charters ask for.

**Total conditions raised:** 32 (Rhea 7, Mira 7, Anton 10, Idris 8).

---

## Verified defects

Two claims were concrete enough to check against the document rather than weigh. Both confirmed.

### D1. Tier 3 depends on a tier 2 family that does not exist [Idris]

`prd.md:195` enumerates the semantic tier as `fg`, `bg`, `border` in **neutral plus the four status
intents** (info, success, warning, danger). `prd.md:962` then defines the primary button as
`{ "button": { "primary": { "bg": { "value": "{color.bg.accent-emphasis}" } } } }`.

There is no `accent` family in tier 2. The most-used component in the system references a token the
token architecture does not define. **Real defect, blocking F01.**

### D2. F22's gates have no enforcement point [Mira]

`prd.md:863` (Section 4, rule 3) makes a visual baseline **mandatory** for every component.
`prd.md:997` lists the visual regression tool as **Should-have** (partly softened by "can start as
local snapshots").

The sharper half: `prd.md:668`, F20's CI list, is *typecheck, lint, unit tests, a11y tests, build,
package validation*. F22 defines a coverage gate, a mutation check, visual regression baselines, and
keyboard interaction tests. **None of the four appear in the CI list.** They are currently
requirements with no gate. **Real defect, blocking F20/F22.**

---

## Consensus - where independent seats converged

These carry the most weight precisely because no seat could see another's review.

### C1. The reference application must become a real artefact [Rhea, Anton]

Rhea: Open Question 6 calls it "the highest-risk question in this document," then leaves it as prose
with no feature ID, no priority, no acceptance criteria, no owner. Her words: *the one deferral that
will become a default by accident.*

Anton arrived at the same place from the opposite end - his 1.0 entry criteria require the reference
application to be built on Clara before v1.0 can be declared.

**Two seats, opposite disciplines, same conclusion.** Strongest signal in the review.

### C2. A legal pairing table must exist, and the contrast test must iterate it [Mira, Idris]

Idris wants it as a design artefact: enumerated fg-on-bg and border-on-bg pairings with per-role
thresholds (4.5:1 text, 3:1 borders/icons/control boundaries/focus), anything absent documented as
unsupported.

Mira wants it as a test denominator: *"Where is the enumerated list of legal pairings that forms the
test's denominator?"* F02 promises "every semantic color pairing meets AA" - a claim over a set the
PRD never enumerates.

**Same missing artefact, reached from design and from verification independently.**

### C3. Focus is under-specified in three distinct ways [Mira, Idris, Anton]

| Seat | Gap |
|------|-----|
| Mira | No overlay names its initial focus target on open, or its restoration target per dismissal route (Escape / outside click / close button / commit). Her own modal-focus scenario passes this PRD as written |
| Idris | A single 2px ring with 2px offset cannot survive `bg-accent-emphasis`, `bg-danger-emphasis`, and dark sidebars. The offset gap renders the surface underneath, so the ring must contrast with control *and* surround |
| Anton | Theme and density scope to a subtree (F02/F03) while every overlay portals to `document.body` (F13). A Popover in a dark compact sidebar renders light and comfortable |

Three seats hit the same weak region from three angles. F13 is the least-finished feature in the PRD.

### C4. Deferred decisions must be closed with dates, not options [Rhea, Anton, Idris]

Rhea wants the four blocking open questions closed this week with decisions, not option lists.
Anton wants Open Question 2 (Radix vs Base UI) closed before the first component, plus an isolation
rule. Idris wants the foundations pass time-boxed with a fixed end date and a named deliverable list,
and explicitly asked to be capped: *"Component work begins on that date whether or not I am happy."*

### C5. F02 `createTheme()` is over-promised - all four seats, four different objections

| Seat | Objection |
|------|-----------|
| Rhea | No consumer needs generated brand ramps in v1.0. Cut to v1.1 |
| Anton | Build-time or runtime? A runtime version ships color math to consumers and contradicts the zero-runtime-styling NFR. And the "always passes AA" promise is false for some hues; it must fail loudly |
| Mira | Does the contrast test run over generated output for arbitrary consumer hues, or only the shipped palette? Consumer brand hues are exactly where AA breaks |
| Idris | In which color space? What is the failure mode? Amber breaks naive ramps, and warning is a first-class intent |

Consensus that it is broken. **No consensus on the remedy** - see Conflict F1.

---

## Conflicts requiring your adjudication

### F1. F02 `createTheme()`: cut, specify, or extend?

Three incompatible dispositions, all defensible:

- **Rhea:** move to v1.1 with revival condition "an application requires a brand other than Clara's default"
- **Anton:** keep, but settle build-time vs runtime and soften the AA guarantee to fail loudly
- **Mira:** keep, and extend the contrast test across a sampled hue range

**Synthesis note:** these are less opposed than they look. Cutting to v1.1 (Rhea) dissolves Anton's
and Mira's objections and shrinks the test surface to the shipped palette. But **Idris's amber point
survives the cut** - `bg-warning-emphasis` with on-emphasis text is a problem in Clara's own palette,
generation or no generation. The pairing table (C2) is required either way.

### F2. The structural tension: Rhea cuts, the other three add

This is the real adjudication, and it is not a contradiction.

- **Rhea's conditions shrink v1.0:** split F12 (DateRangePicker, TimePicker to v1.1), move
  `createTheme()` out, drop F11 MultiSelect and virtualization, defer F16 Menu, version F27-F30
- **Mira, Anton, and Idris's conditions raise the cost per component:** manual keyboard pass in the
  definition of done, per-component verification records, focus placement assertions per overlay per
  dismissal route, API report gate, pairing table, two-part focus spec, elevation and motion semantics

Taken together they are coherent: **fewer components, each held to a higher bar.** That is a
defensible v1.0 shape and arguably a better one than the PRD currently describes. But it is a real
decision about what Clara is, and it is yours.

### F3. Unopposed cuts that no other seat evaluated

Rhea raised these; the seats best placed to judge them did not address them:

- **F11 virtualization contradicts F15's own deferral logic.** F15 defers DataGrid because building
  it badly early is worse than building it right later. F11 requires virtualizing 100+ option lists
  without breaking `aria-activedescendant` - grid-class work in a v1.0 row. Mira, the seat who would
  own verifying it, did not weigh in
- **F12 split** (DatePicker only in v1.0)
- **F16 `Menu` vs F13 `DropdownMenu`** - which screen needs both in v1.0?

### F4. Conditions the raising seat itself flagged as possibly overreaching

Both seats policed their own shadow in the open. Treat these as genuinely optional:

| Condition | Seat | Their own caveat |
|-----------|------|------------------|
| API report gate (api-extractor surface diff in CI) | Anton | *"genuinely my personal working method being promoted to a project requirement... the maintainer should weigh whether it earns its setup cost on a one-person project"* |
| Forced-colors mode test coverage | Mira | *"may be me reaching past the stated posture for a user population that is likely but not evidenced - I would accept a written exclusion in the accessibility statement"* |

---

## Notable individual findings

Findings strong enough to act on that only one seat raised.

**Anton - Radix will leak into the permanent public surface.** Not just a dependency choice.
`asChild`, `onOpenChange` naming, and `data-state` attributes become Clara API by accident unless
forbidden in writing before the first component.

**Anton - three composition idioms answering one question.** `asChild` for overlay triggers,
`as` for layout primitives (F06), `href` for Button (F07). Design principle 2 - "guessable by
someone who has used another Clara component" - is broken at v1.0 on paper, before any code exists.

**Anton - the 5KB Button budget is unmeasurable.** The setup contract imports one `styles.css`,
so CSS is not tree-shaken at all. The delivery model lives in the exports map and cannot change
later without breaking every consumer's import.

**Anton - no cascade layer decision.** Section 4 promises `className` merges after component classes
and `style` applies last. With CSS Modules, stylesheet order decides the cascade, not attribute
order. Retrofitting `@layer` post-1.0 silently changes specificity for every existing consumer
override.

**Mira - the definition of done omits a manual keyboard pass.** Rule 2 requires a keyboard
interaction *table*; a table is a specification, not evidence a human drove the component. Nothing in
the PRD requires anyone to keyboard-operate Modal, Drawer, Popover, DropdownMenu, Combobox,
DatePicker, Tabs, or the sortable Table header before permanent publication.

**Mira - two WCAG 2.2 criteria are absent entirely.** 2.4.11 Focus Not Obscured, which F15's sticky
header/first column and F14's Toast can each violate. And forced-colors mode, where a
custom-property-driven system loses its status colors and any `box-shadow` focus ring.

**Mira - F22's gates are inverted.** The hard number (90% statements) sits on the weakest metric -
the one she has watched rise while assertions weakened. The strong signal (mutation check) has no
tool, no threshold, and no statement of whether it blocks.

**Idris - two non-negotiables breached as written.** F14 gives `Badge` and `Tag` "the four intents
plus neutral" with no mark or icon requirement - meaning by color alone, in the components most
likely to appear a hundred times on a list screen. And F04's truncation promise rests on `title` or a
tooltip, neither reachable by keyboard on a non-focusable table cell.

**Idris - four background states compose with no defined precedence.** An F15 table row can be
striped, hovered, selected, and focused simultaneously. No part of the PRD names the stacking order
or which surface wins.

**Idris - the semantic tier is missing four families.** `accent` (proven by D1), `selected` (needed
by F15 row selection, F11 MultiSelect, F16 active nav), `readonly` foreground (required by F09's
"readonly visually distinct from disabled at full contrast"), and focus ring/offset as separate
tokens.

**Rhea - four acceptance criteria cannot be observed failing.** F05's icon set "covers at minimum the
icons Clara's own components need"; F07's disabled-button "or" branch; F19's "copyable code examples
that work when pasted" with no job that pastes them; and Section 5's 10-minute Getting Started
claim, whose only possible tester wrote the page.

**Rhea - the PRD contradicts its own stated principle.** Section 2 says the framing "argues against
building components speculatively before an application actually needs them." Section 3 then lists
23 must-have rows across twelve component families with no named consuming screen, and user stories
voiced by an end user who does not exist. *"An invented user is not a consuming need."*

---

## Recommended disposition

Triaged by when each must close. Not an instruction - a proposed ordering for you to accept or change.

### Tier 1 - close before any code (9)

| # | Condition | Seats | Note |
|---|-----------|-------|------|
| 1 | Complete the semantic tier: `accent`, `selected`, `readonly`, focus ring/offset | Idris | Fixes verified defect D1 |
| 2 | Publish the legal pairing table with per-role thresholds | Idris + Mira | Consensus C2 |
| 3 | Cascade layer decision (`@layer` name and order) | Anton | Unfixable after 1.0 |
| 4 | CSS delivery model + closed exports map, restate the size budget to match | Anton | Unfixable after 1.0 |
| 5 | Token visibility rule: which tier is public API under F21 | Anton | Consumers settle it otherwise |
| 6 | Close OQ2 (Radix vs Base UI) + written primitive-isolation rule | Anton, Rhea | |
| 7 | npm scope decision | Rhea | `@umayan/clara-*` recommended; `@clara` unverified |
| 8 | License decision | Rhea | |
| 9 | Time-box the foundations pass: fixed end date + Idris's deliverable list | Idris, Rhea | Idris asked to be capped |

### Tier 2 - close before the first component (9)

Reference application as a feature row with an ID and ACs (Rhea, Anton) - portal theme/density
resolution as an architecture rule, not props (Anton) - two-part focus indicator spec with
enumerated emphasis surfaces (Idris) - focus placement assertions per overlay per dismissal route
(Mira) - manual keyboard pass added to the definition of done (Mira) - per-component verification
record with Mira's bounded scope (Mira) - `"use client"` classification list + directive survival
check (Anton) - controlled/uncontrolled prop convention named library-wide (Anton) - single
composition idiom for triggers and polymorphism (Anton).

### Tier 3 - close before 1.0 (12)

Extend the breaking-change definition to the full observable surface (Anton) - quantify F22's gates,
fix the inversion, add them to F20's CI list (Mira, fixes D2) - 1.0 entry criteria and 1.x support
window (Anton) - every must-have row names its consuming need (Rhea) - v1.0 release gate and build
order (Rhea) - repair the four unfalsifiable criteria (Rhea) - version F27-F30 or delete them (Rhea)
- close the three color-alone gaps incl. Badge/Tag and status-in-dense-list (Idris) - keyboard-
recoverable truncation (Idris) - compact density padding and adjacent-target floors (Idris) -
elevation and motion semantic naming (Idris) - WCAG 2.4.11 Focus Not Obscured criteria (Mira).

### Operator calls (6)

F02 `createTheme()` disposition (F1) - the cut-vs-raise-the-bar shape decision (F2) - F11
virtualization, F12 split, F16 Menu (F3, unopposed but unexamined) - API report gate cost (F4) -
forced-colors: test or written exclusion (F4).

---

## Assessment of the review itself

The seats disagreed where they were built to disagree. `createTheme()` drew four different
dispositions; Rhea cut scope while three seats raised the bar. No seat approved. Two seats named
their own overreach unprompted, and one asked to be capped against its own documented shadow.

Rhea's shadow check reports the opposite of her usual failure - she says she likely *under*-
questioned the four foundation rows because foundations feel safe to her. That is worth noting for
the next consult: F01-F04 received the least adversarial pressure in this review, and they are the
rows that are hardest to change later.

No seat reviewed its own output. The independence gate held.
