# Clara foundations - F00

> **Deliverable of US-01M0GMN0.** Direction decided by the Idris Vale (ux) seat, signed off by the
> operator 2026-08-22 as **D0036**. Timebox rules are **D0035**.
>
> Every colour here was generated in OKLCH and **measured against contrast before adoption**, not
> after. Three candidate pairings failed on first measurement and the values changed; that record is
> kept below rather than tidied away.

## Status of the ten deliverables

| # | Deliverable | Status |
| --- | --- | --- |
| 1 | Neutral ramp, 11 steps, temperature stated | **Decided** - slightly warm |
| 2 | Accent hue with reasoning | **Decided** - indigo ~275deg |
| 3 | Ramp generation colour space | **Decided** - OKLCH |
| 4 | Radius scale and character | **Decided** - subtle, 4px base |
| 5 | Border weight convention | **Provisional** |
| 6 | Elevation expression, incl. dark theme | **Provisional** |
| 7 | Two-part focus indicator | **Decided** - measured on all 6 enumerated surfaces |
| 8 | Type scale with body step named | **Provisional** |
| 9 | Legal pairing table, populated and passing | **Partial** - 8 declared and passing; 27 required pairings await the tier 2 families (US-01M0GMAE) |
| 10 | Motion durations and what motion may communicate | **Provisional** |
| AC3 | Compact density floors | **Decided** - D0037, consulted |

Under **D0035 clause 1** a Provisional value is still a real tier 1 token, so F01 is unblocked.
Under **clause 2** nothing here ships with a failing contrast pairing.

---

## 1-3. Colour

**Space: OKLCH**, compiled to hex at build time. Lightness is perceptually uniform, so step 500 of
the neutral ramp and step 500 of indigo read equally light - which HSL cannot promise, and which is
what makes the dark theme derivable rather than a second hand-tuned pass.

**Neutral: slightly warm** (hue 75, chroma 0.0028-0.0075). Warmth peaks mid-ramp and fades at both
ends, so white stays white and near-black does not go brown. Chosen for Grace Adeyemi's eight-hour
reading day; cool greys would also have competed with the indigo accent for the same axis.

**Accent: indigo, hue 275.** Far from both the success and danger axes, so it stays distinguishable
for someone with red-green colour vision deficiency. Green and red/orange were refused outright.

Lightness stops, 11 steps: `1.000 .976 .955 .905 .845 .760 .660 .560 .455 .345 .235`

| Ramp | Hue | Role |
| --- | --- | --- |
| neutral | 75 | surfaces, text, borders |
| accent | 275 | primary action, focus, selection |
| danger | 25 | destructive and error |
| warning | 75 | caution - see the hard case |
| success | 150 | confirmation |
| info | 235 | neutral information |


### The ramps as shipped

> **Regenerated from `packages/tokens/dist/tokens.css`, not transcribed.** A previous version of this
> table was pasted and then went stale when the gamut correction regenerated the palette - five of
> six rows were wrong, and one derived claim (`info.600`) had flipped from failing to passing. That
> is the same defect class as `oklch.mjs` being dead code, one layer out: the document became the
> copy nothing bound. `check-foundations.mjs` now compares these hexes against the shipped tokens.

Generated in OKLCH, compiled to hex. These are the values in `packages/tokens/dist/tokens.css`.

| Ramp | 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `neutral` | `#ffffff` | `#f8f7f4` | `#f2f0ed` | `#e2dfdb` | `#cfcbc7` | `#b4b0ac` | `#95928e` | `#777471` | `#585654` | `#3a3937` | `#1f1e1d` |
| `accent` | `#ffffff` | `#f5f7fe` | `#eceffe` | `#d6defe` | `#bdc9fe` | `#9babfd` | `#7b8ae4` | `#616db7` | `#48518b` | `#2f355d` | `#181c33` |
| `danger` | `#ffffff` | `#fef5f4` | `#feebe9` | `#fdd5d1` | `#fabab4` | `#f4928a` | `#d86e67` | `#ae5751` | `#843f3b` | `#582926` | `#301513` |
| `warning` | `#ffffff` | `#fbf6f0` | `#f8efe2` | `#f2dcbf` | `#e9c695` | `#dda552` | `#c28412` | `#9b690b` | `#754e02` | `#4e3304` | `#2a1b03` |
| `success` | `#ffffff` | `#f3f9f4` | `#e7f4e9` | `#cbe9d0` | `#aadbb3` | `#76c788` | `#4ba964` | `#3a874f` | `#296539` | `#1a4325` | `#0c2412` |
| `info` | `#ffffff` | `#f1f8fd` | `#e4f3fc` | `#c4e5fa` | `#9cd5f7` | `#5abdf2` | `#189ed8` | `#0f7eae` | `#045e84` | `#053e58` | `#042130` |

## 4. Radius - subtle

`none 0 · sm 2px · **md 4px (base)** · lg 8px · full 9999px`

Rounded corners accumulate into chrome at two hundred rows, and this seat's craft goal is density by
removing chrome rather than by crowding content.

## 7. Focus indicator - two-part, and here is why one part cannot work

PRD F07 requires a **ring** and an **offset** as separate tokens. The reason is measurable: the
offset gap renders the surface underneath, so the indicator must contrast with both the control and
its surround, and no single colour does that across every emphasis surface.

`focus.ring = neutral.900` · `focus.offset = neutral.0`

Measured across the enumerated surfaces. **At least one part carries >=3:1 on every one.**

An independent review then measured it against **all 66 tier 1 colour tokens in both themes**:
zero surfaces where neither part reaches 3:1, tightest margin 4.41:1 against a 3:1 floor. PRD F07
enumerates nine surfaces plus any ClaraScope dark sidebar; the table below samples six of them, and
the exhaustive sweep covers the rest.

| Surface | ring | offset |
| --- | --- | --- |
| bg-canvas | 16.64 | 1.00 |
| bg-subtle | 14.63 | 1.14 |
| accent-emphasis | 3.47 | 4.80 |
| danger-emphasis | 3.39 | 4.90 |
| warning-emphasis | 7.59 | 2.19 |
| dark surface (neutral-900) | 1.00 | 16.64 |

On light surfaces the dark ring carries the indicator; on emphasis and dark surfaces the light
offset does. Neither alone survives the set, which is precisely the PRD's point.

## THE HARD CASE - `fg-on-emphasis` on `bg-warning-emphasis`

> The ambers below are **illustrative**, not Clara colours - they exist to show the curves never
> overlap. Clara ships none of them.

PRD:1207 flagged this. Measured, it is sharper than the wording suggests: **no amber carries both
white and near-black at 4.5:1.** The curves cross without ever overlapping.

| amber | vs white | vs near-black |
| --- | --- | --- |
| `#9a5c00` | **5.38** | 3.08 |
| `#b26a00` | 4.24 | 3.91 |
| `#c47f00` | 3.29 | **5.03** |

**Resolved (D0036, option A): `fg-on-emphasis` becomes PER-INTENT** - white on
accent/danger/success/info, near-black on warning. Darkening warning until white works produces a
brown, and a brown warning chip is a warning Grace does not see at 4pm.

This is a **tier 2 taxonomy change** and is US-01M0GMAE's to implement. It interacts with
CR-01M0J0Z6.

## Tier 2 step choices proven by measurement

Discovered while testing; recorded so US-01M0GMAE does not rediscover them:

| Mapping | Step | Why |
| --- | --- | --- |
| `border-default` | neutral **500** | 300 gives 1.61:1 and 400 gives 2.15:1 against canvas - both under the 3:1 floor |
| `bg-accent-emphasis` | accent **600** | carries white at 4.80:1 |
| `bg-danger-emphasis` | danger **600** | carries white at 4.90:1 |
| `bg-info-emphasis` | info **600** | carries white at **4.55:1**. **Corrected:** an earlier note said 600 gave 4.25 and pushed this to 700 - that figure described the pre-gamut-correction palette and 600 now passes. US-01M0GMAE must not inherit the old number. |
| `bg-warning-emphasis` | warning **600** | carries white at 4.75:1. Note the hard case still applies to `fg-on-emphasis` generally |
| `bg-success-emphasis` | success **700** | 600 carries white at only **4.41:1** - the one intent whose 600 step fails, and the reason not to mirror the others |

---

## Provisional - D0035 clause 1

Each lands as a real token so F01 is unblocked, with the condition that revisits it.

| Deliverable | Provisional value | Revisit when |
| --- | --- | --- |
| **5. Border weight** | `thin 1px` (default), `thick 2px` | The first Table and Input ship together and rule weight can be judged at real density |
| **6. Elevation** | Not expressed as shadow tokens yet. Surfaces are distinguished by `bg` steps only | The first Modal and Popover ship - shadows barely register in dark theme, so this needs both themes side by side |
| **8. Type scale** | `xs 12 · sm 14 · md 16 · lg 20 · xl 24 · 2xl 32`, **body = `sm` 14px** | The reference application shows real density. Idris's floor holds regardless: body never below 14px, 12px only for genuinely non-essential metadata |
| **10. Motion** | `instant 0 · fast 120ms · base 200ms`. Motion may communicate **state change and spatial origin only** - never decoration | The first Drawer and Toast ship |

---

## Non-negotiable, not provisional

Carried from the Idris seat; these are not open for a later trade:

- No status, selection, or error state carried by colour alone - always a mark, icon, or text
- Body text never below 14px in any density; 12px only for genuinely non-essential metadata
- Interactive targets at or above 24x24px regardless of density
- No colour enters the palette without a semantic meaning and a name that survives both themes
- The focus indicator survives **every** background token, including all emphasis surfaces

## Compact density floors - DECIDED (D0037, consulted)

Required by PRD:312, and the last open F00 deliverable. **Derived from the PRD's own numbers rather
than chosen**, so the arithmetic is checkable:

| Floor | Compact | Comfortable | Derivation |
| --- | --- | --- | --- |
| Internal padding, vertical | **4px** | 8px | control 32px - a 24px line box for 14px text, halved. Lands on `space.2`. |
| Internal padding, horizontal | **8px** | 12px | 4px puts a label visually against the control edge |
| Adjacent interactive targets | **4px** | 8px | 24px target + 4px gap = **28px pitch**, clearing WCAG 2.2 SC 2.5.8's spacing exception |

The PRD's argument is that two 24x24 targets touching satisfies the letter of the target rule and is
still crowding. A 4px gap is what separates two chips at a glance without adding chrome.

**Consulted through the Idris seat, not operator-signed.** Unlike a tier 2 name, a spacing floor is
not permanent at publish, and US-01M0GMC6 will exercise it against real components. Reversible.

---

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | idris-vale + operator | F00 opened. 5 of 10 deliverables decided (D0036), 4 provisional under D0035, 1 partial pending the tier 2 families. All colour measured before adoption. |
| 2026-08-22 | idris-vale (consulted) | Compact density floors decided (D0037): 4px/8px internal padding, 4px adjacent-target spacing. Derived from the PRD's control height and body size rather than chosen. Closes AC3. |
| 2026-08-22 | sdlc-studio | Ramp table, focus table and step choices REGENERATED from dist/tokens.css after round 7 found them describing the pre-gamut-correction palette. `info.600` corrected: it now passes at 4.55 and the reason to push it to 700 no longer exists. |
