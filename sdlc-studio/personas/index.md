<!--
File: sdlc-studio/personas/index.md
Purpose: Lists all personas active for this project
Related: reference-persona.md, help/persona.md
-->
# Project Personas

Personas for the **Clara Design System**. This index lists all active personas by category.

**Last updated:** 2026-08-21 (design personas and stakeholder panel added)
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

## Design Personas

The cast Clara is designed **for**. Stories reference these by name; `validate serves` reads them.
Cooper's rule holds: one Primary per interface.

| Persona | Cast | Interface | Summary | File |
|---------|------|-----------|---------|------|
| Sofia Marchetti | **primary** | The Clara public API and token layer | Full-stack developer building internal ERP apps. Has assembled the same 25 components four times and lost a week each time to the same fights | [Details](sofia-marchetti.md) |
| Grace Adeyemi | **served** | None - she never touches Clara's API | Accounts payable clerk. 200-400 lines a day, eight hours, one fixed monitor, mild red-green colour vision deficiency she has never mentioned at work. The reason the floors exist, and she will never file an issue | [Details](grace-adeyemi.md) |
| Theo Lindgren | **negative** | n/a | Consumer and marketing surface builder. Everything he wants is legitimate; none of it is Clara's job. Serving him would not make Clara worse at his job, it would make Clara worse at Sofia's and Grace's | [Details](theo-lindgren.md) |

**Why the developer is Primary rather than the operator.** Clara's interface is its API and its
tokens, and Sofia is the only one who touches them. Grace experiences the *result* of every
decision but can neither call a component nor override a token, so designing "for" her at the API
layer would be incoherent. Served is the honest designation, and it does not make her needs
secondary - the density, contrast, focus and target-size floors exist for her, and Idris (ux) holds
them on her behalf.

---

## Stakeholder Personas

The panel Clara must answer to but who never build. **Assumption personas until validated against
real people** (Cooper's rule), so they keep their provisional stamp and there is no batch-accept.

| Persona | Type | Cast | Summary | File |
|---------|------|------|---------|------|
| Daniel Achebe | `buyer` | Customer | Operations Director who signs off the build. Once approved a tool that worked correctly and looked like a prototype; his team's confidence never recovered | [Details](stakeholders/daniel-achebe.md) |

**Arbitration rule, carried on the card itself:** a stakeholder's goals never override the
Primary's interface. When Daniel's wants conflict with what Sofia needs from the API or Grace needs
from the screen, the Primary wins the interface and Daniel's needs are met elsewhere.

**Why the panel has one card.** Clara has no paying buyer, no compliance regime (D0016 sets
accessibility as an internal bar with no VPAT), and no runtime, so no ops or support function
exists. The ERP end user was considered for a `served` stakeholder card and placed as a **design
persona** instead, because Clara is genuinely designed for her - two cards for one person in two
homes would drift. Inventing a compliance officer and an ops manager for a project that has neither
would be the persona proliferation this skill warns against.

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
| Generated | 8 | 4 seats, 3 design personas, 1 stakeholder - inferred from `sdlc-studio/prd.md`, 2026-08-21 |
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
