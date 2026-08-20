<!--
File: sdlc-studio/personas/index.md
Purpose: Lists all personas active for this project
Related: reference-persona.md, help/persona.md
-->
# Project Personas

Personas for the **Clara Design System**. This index lists all active personas by category.

**Last updated:** 2026-08-21
**Generated from:** `sdlc-studio/prd.md`

---

## Operating Model

Clara has one maintainer. These seats are **lenses worn by separate agent instances**, not
colleagues. The author != reviewer gate is enforced by instance separation, and that separation is
the only thing that makes a review here honest: a seat that reviews its own output is simply the
author agreeing with themselves.

**Risk class:** irreversible distribution. Clara scores low on every conventional risk axis (no
money movement, no PII, no uptime SLA) and high on two the standard list does not cover:

1. **Blast radius** - a defect reaches every consuming application at once.
2. **Permanence** - a published version cannot be recalled, and a renamed prop or token breaks
   consumers already shipped.

Every seat's paranoia is calibrated to those two, not to a generic quality bar.

**Accessibility compliance:** internal bar, no formal artifact. WCAG 2.2 AA is held as a genuine
standard because it is the right way to build. No VPAT is produced, though test evidence is retained
so one would be cheap to produce later.

---

## Team Personas (Working Seats)

Four seats. The cast is deliberately capped: persona proliferation is the documented failure mode,
and a fifth voice that never changes an outcome is overhead.

### Product Amigo

| Persona | Role | Summary | File |
|---------|------|---------|------|
| Rhea Okonjo | `product` | Scope discipline. Holds v1.0 against a design system's natural tendency to over-build; every component must trace to an application that needed it | [Details](seats/rhea-okonjo.md) |

### Engineering Amigo

| Persona | Role | Summary | File |
|---------|------|---------|------|
| Anton Reis | `engineering` | Publishing is a one-way door. Owns the public API surface, semver honesty, token architecture, and consumer bundle cost | [Details](seats/anton-reis.md) |

### QA Amigo

| Persona | Role | Summary | File |
|---------|------|---------|------|
| Mira Calderon | `qa` | Automation proves attributes are present and nothing more. Owns the definition of done and **accessibility verification** | [Details](seats/mira-calderon.md) |

### UX Amigo

| Persona | Role | Summary | File |
|---------|------|---------|------|
| Idris Vale | `ux` | Clarity is subtractive. Owns the visual language and **inclusive design** decisions | [Details](seats/idris-vale.md) |

---

## Accessibility Ownership (split, deliberately)

The validator's role vocabulary (`engineering, qa, product, security, sre, data, ux`) has no
`accessibility` role, so accessibility is split across two seats **on purpose** rather than
squeezed into a fake one. Both halves have a named owner:

| Half | Owner | Covers |
|------|-------|--------|
| **Inclusive design** - the decision | Idris Vale (`ux`) | Color-never-alone, focus indicator design across every surface, target sizing, legibility floor, reading and tab order |
| **Verification** - the proof | Mira Calderon (`qa`) | axe assertions, keyboard operation, manual screen reader passes, contrast matrix across themes, focus restoration |

**Neither seat may assume the other covered it.** This is written into both cards. The failure mode
this guards against is accessibility collapsing into "axe passed", which is exactly what happened in
the incident that shaped Mira's card.

---

## Stakeholder Personas

None yet. Run `/sdlc-studio persona generate --stakeholders` to grow the panel.

For Clara the plausible panel is small and worth thinking about before generating: the **library
consumer** (a developer installing Clara, and Clara's true Primary user), the **end user** of
applications built on Clara (operations staff, keyboard-heavy, mixed accessibility needs), and the
**reviewing stakeholder** who judges whether the result reads as enterprise-credible. All three are
described in PRD §2.

---

## Consultation Defaults

| Artefact | Team seats consulted | Stakeholders |
|----------|---------------------|--------------|
| PRD | Product | End users, business |
| TRD | Engineering, UX | - |
| TSD | QA, Engineering | - |
| Epic | Product, Engineering | Affected users |
| User Story | Product | Primary persona |
| Token / visual change | UX, Engineering | - |
| New component | All four | End users |
| Public API change | Engineering, Product | Library consumer |
| Release readiness | QA, Engineering | - |

Override with `--persona`, or bypass with `--skip-personas`.

---

## Standing Tensions

Where disagreement is expected, so synthesis knows where to look. These are the tensions working,
not failing:

| Between | The conflict | Honest resolution |
|---------|-------------|-------------------|
| Rhea <-> Idris | Ship components now vs settle the visual identity first | A time-boxed foundations pass with a defined exit, not a winner |
| Rhea <-> Mira | Release date vs definition of done | Expect at every release boundary |
| Rhea <-> Anton | v1.0 velocity vs API stability work | Scope pressure is how a v1.1 breaking change gets made |
| Anton <-> Idris | A visual result the token tiers do not express | Usually the semantic layer is missing a token, not a reason to bypass the tiers |
| Mira <-> Idris | Design intent vs verification burden across theme x density | Usually means the intent was not written precisely enough to test |
| Anton <-> Mira | Lock the API then test vs test then lock | Testing is how the API's problems surface |

---

## Persona Sources

| Source | Count | Notes |
|--------|-------|-------|
| Generated | 4 | Inferred from `sdlc-studio/prd.md`, 2026-08-21 |
| Archetypes | 0 | No shipped archetype cards used |
| Imported | 0 | - |
| Authored | 0 | - |

**Provenance:** all four cards carry a generation stamp. `validate.py seats --require-stamp` passes
with 0 errors, 0 warnings.

---

## Usage

```bash
/sdlc-studio consult team sdlc-studio/prd.md      # all four seats review the PRD
/sdlc-studio consult idris-vale <artefact>        # single seat
/sdlc-studio chat mira-calderon                   # interactive session
/sdlc-studio persona review                       # revisit and refine these cards
```

Resolve a seat for a review programmatically:

```bash
scripts/persona_resolve.py resolve --seat qa --render review
```

---

*See `reference-persona.md` for detailed persona workflows.*
