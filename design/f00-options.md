# F00 options - Idris Vale (ux seat) consult

> **Status:** Options for operator decision. **Nothing here is decided.**
> **Seat:** Idris Vale, work render. **Evaluated by:** Daniel Achebe (stakeholder), per PRD F00.
> **Input to:** `design/foundations.md` (the deliverable), `PL-01M0KF4N` (the plan).
>
> Idris's documented shadow is refining foundations indefinitely, and this seat asked to be capped
> rather than trusted (D0004). These options are therefore written to be *chosen between*, not
> explored. Each names what it costs.

## The two people this is decided for

**Grace Adeyemi** processes 200-400 invoice lines a day, works from peripheral vision by 4pm, and
has a **mild red-green colour vision deficiency she has never mentioned at work**. She will never
file an issue. **Sofia Marchetti** builds the screens and needs the 26th component predictable from
the 25th.

Grace's CVD is not a nice-to-have constraint. It eliminates whole hue families from the accent
role, because accent must never be confusable with success or danger.

---

## Decision 1 - Neutral ramp temperature

| Option | What it buys | What it costs |
| --- | --- | --- |
| **Cool** (blue-tinted greys) | Reads technical and current; the default in developer tooling | Competes with a blue-family accent - greys and accent fight for the same axis. Colder screens read more fatiguing over an 8-hour shift, which is Grace's whole day |
| **Warm** (yellow/red-tinted) | Softer over long sessions; measurably less clinical | Warm greys clash with a cool accent; at low saturation reads beige and dated |
| **True neutral** | Maximum accent freedom, no competition | Idris's own lens: *"Would someone recognize this as Clara, or as any neutral system?"* This is the genericness risk stated in the seat's Pushes Back list |
| **Slightly warm neutral** (2-4% warm at mid-steps) | Serves the 8-hour goal, leaves the accent axis free, retains some identity | Requires discipline in the ramp generator; too much warmth and it is beige |

**Idris leans:** slightly warm neutral. It is the only option that serves Grace's 8-hour case
without spending the accent axis, and it answers the genericness objection without decoration.

## Decision 2 - Accent hue

Constrained hard. Accent must be distinguishable from **success** and **danger** by someone with
red-green CVD, and must carry white text on its emphasis surface at 4.5:1.

| Option | Verdict |
| --- | --- |
| **Green** | **Refuse.** Collides with success, and sits on Grace's confusable axis |
| **Red / orange** | **Refuse.** Collides with danger and warning |
| **Blue** (~250deg) | Safe, high contrast headroom, CVD-clear. The most generic enterprise choice - Idris's "restraint confused with blandness" |
| **Teal / cyan** (~200deg) | Distinctive, CVD-safe. Struggles to reach 4.5:1 against white without going dark enough to read as petrol |
| **Indigo / violet** (~275deg) | Distinctive, CVD-clear, ample contrast headroom (measured: `#4640c4` carries white at **7.52:1**) |

**Idris leans:** indigo. It is far from both status axes, safe for Grace, and has the headroom the
pairing table needs. Teal is the alternative if indigo reads too branded.

## Decision 3 - Ramp generation colour space

| Option | Note |
| --- | --- |
| **OKLCH** | PRD-recommended. Perceptually uniform lightness, so an 11-step ramp steps evenly and dark-theme inversion is predictable rather than hand-tuned. Browser support is irrelevant - the build emits hex |
| **HSL** | Familiar, but its lightness is not perceptual: step 5 of a yellow ramp and step 5 of a blue ramp look nothing alike |
| **Hand-tuned** | Best possible result, unbounded cost. This is exactly the shadow D0004 exists to cap |

**Idris leans:** OKLCH. Low risk, already recommended, and it makes the dark theme derivable rather
than a second design pass.

## Decision 4 - Radius character

| Option | What it costs at 200 rows |
| --- | --- |
| **Sharp** (0-2px) | Maximum density, cleanest tabular read. Can feel severe on buttons and modals |
| **Subtle** (4px base) | The enterprise middle. Reads intentional without accumulating |
| **Rounded** (8px+) | Friendly in a demo. At table scale the radius becomes chrome, and chrome is what Idris removes to get density |

**Idris leans:** subtle, 4px base. Rounded fails the seat's own density-by-subtraction test.

---

## THE HARD CASE - and it is worse than "hard"

PRD:1207 says amber `bg-warning-emphasis` "cannot carry white text at 4.5:1 and cannot carry
near-black at 4.5:1 in every ramp", and that it must be **decided deliberately in F00**.

Measured, WCAG 2.x relative luminance, near-black `#1b1f24`:

| amber | vs white | vs near-black |
| --- | --- | --- |
| `#9a5c00` | **5.38** | 3.08 |
| `#b26a00` | 4.24 | 3.91 |
| `#c47f00` | 3.29 | **5.03** |
| `#e8a317` | 2.17 | **7.64** |

**The curves cross without ever overlapping at 4.5:1.** At `#b26a00` neither passes. There is no
amber that carries both.

This is not a colour choice. It is a **token taxonomy** consequence:

| Option | Consequence |
| --- | --- |
| **A. `fg-on-emphasis` becomes per-intent** - white on accent/danger/success/info, near-black on warning | The honest fix, and what most systems do. But `fg-on-emphasis` stops being one token, which changes the tier 2 shape Anton owns and touches CR-01M0J0Z6 |
| **B. Darken warning emphasis to <= `#9a5c00`** so white works | Keeps one token. But `#9a5c00` is brown, not amber - it stops reading as *warning* at a glance, which is the entire job of the colour for Grace scanning at 4pm |
| **C. Drop `bg-warning-emphasis` entirely** - warning appears only as `bg-warning-subtle` | Removes the pairing rather than solving it. Legitimate: warning may not need an emphasis surface. But F13/F15 may want one later, and adding it post-publish is a new token |

**Idris leans:** A. Grace scans by shape and colour position at 4pm; a brown warning chip is a
warning she does not see. Per-intent `fg-on-emphasis` costs one taxonomy change now versus a
permanently wrong colour later.

**This one is genuinely the operator's**, because it changes the tier 2 token shape and therefore
what US-01M0GMAE builds.

---

## What Idris will not defer

These are the seat's non-negotiables and are not offered as options:

- No status, selection, or error state carried by colour alone - always a mark, icon, or text
- Body text never below 14px in any density; 12px only for genuinely non-essential metadata
- Interactive targets at or above 24x24px regardless of density
- No colour enters the palette without a semantic meaning and a name that survives both themes
- The focus indicator survives **every** background token, including all emphasis surfaces

---

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | idris-vale (consulted) | Options opened for four decisions plus the hard case. Contrast figures measured, not estimated. |
