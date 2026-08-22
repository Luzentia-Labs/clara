# PL-01M0J6TB: Button - Implementation Plan

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Story:** [US-01M0GM69](../stories/US-01M0GM69-button.md)
> **Epic:** [EP-01M0GKGS: Primitives - icons, layout, and actions](../epics/EP-01M0GKGS-primitives-icons-layout-and-actions.md)
> **Language:** TypeScript (strict) + CSS Modules
> **Points:** 5
> **Affects:** packages/react/src/components/Button/Button.tsx, packages/react/src/components/Button/Button.module.css, packages/react/src/components/Button/Button.test.tsx, packages/react/src/components/Button/verification.md, packages/react/src/index.ts

## READINESS FINDING - read this before anything else

**US-01M0GM69 cannot be implemented yet.** This is not a scheduling opinion; it is eight
prerequisites that do not exist, checked against the running build rather than inferred:

| What AC | needs | State today |
| --- | --- | --- |
| AC1 | `md` matches the density-driven control height | Density modes are US-01M0GMC6, **Draft**. No density system exists. |
| AC4 | Two-part focus indicator, 3:1 computed against **9 enumerated surfaces** | `focus` ring/offset tokens **MISSING**. So are `bg-canvas`, `bg-surface`, `bg-subtle`, `bg-emphasis`, `fg-on-emphasis`, `fg-disabled`, `border-focus`, `selected`. 9 of the 10 families F07 names do not exist. |
| AC6 | `pnpm lint:css` enforces tier 2/3-only | **The script does not exist.** There is no CSS lint at all, and `pnpm lint` is a known false green (exits 0 over zero packages). |
| AC7 | Visual baseline across both themes and both densities | No visual-regression tool is installed. Dark theme carries placeholder values pending US-01M0GMN0. |
| AC5 | `as="a"` polymorphism | The `as` idiom is US-01M0GMGZ, **Draft**. |
| Tech notes | All CSS inside `@layer clara.reset, clara.tokens, clara.components` | **No `@layer` appears in any emitted stylesheet.** US-01M0GM16 is Draft. |

Verified:

```
focus / selected / bg-canvas / bg-surface / bg-subtle / bg-emphasis
fg-on-emphasis / fg-disabled / border-focus   -> MISSING from tokens.css
emitted tier 2: Surface{Default,Subtle} Text{Default,Muted,OnAccent}
                Border{Default} Action{Primary,PrimaryHover,Danger} Spacing{Xs,Sm,Md,Lg}
pnpm lint:css -> DOES NOT EXIST
@layer in emitted CSS -> none
```

### The one that cannot be deferred

**The cascade layer must exist before the FIRST component stylesheet ships.** AGENTS.md is explicit
that `@layer` "cannot be retrofitted - adding it later silently changes specificity for every
consumer override in existence". Button is the first component. If it emits CSS outside the layer,
the guarantee is lost for the life of the package, and no later story can recover it.

`US-01M0GM16` is therefore a **hard** prerequisite, not a nice-to-have. Everything else on this
list degrades the story; this one makes it permanently wrong.

### Critical path

```
US-01M0GMN0  F00: decide the visual language          8   <- values everything else references
US-01M0GME0  Token pipeline and tier enforcement      5   <- gives AC6 its lint:css
US-01M0GMAE  Semantic token layer                     5   <- gives AC4 the 10 families (CR-01M0J0Z6)
US-01M0GM66  Legal pairing table + contrast gate      5   <- gives AC4 its computed assertion
US-01M0GM5M  Theming: light, dark, scoping            8   <- gives AC7 a real dark theme
US-01M0GMC6  Density modes                            5   <- gives AC1 its control height
US-01M0GM16  Cascade layers                           3   <- MUST precede any component CSS
US-01M0GMGZ  The `as` polymorphism idiom              3   <- gives AC5
                                                     ---
                                                      42 points before Button starts
```

**Recommendation: leave US-01M0GM69 at Draft** and take `US-01M0GMN0` (F00) next. The rest of this
plan is written so it is ready the moment the chain clears, and so the reasoning is not re-derived.

---

## Overview

Button is the first Clara component. Almost nothing about it is only about Button: it is where the
token tiers get exercised, where the cascade layer is proven, where the CSS Modules pipeline stops
being theoretical (CR-01M0HWDQ), and where three currently-vacuous gates - coverage, mutation score,
and the a11y assertion - acquire something to measure.

That is the real reason to get it right rather than early. Every later component inherits the shape
this one sets.

## Acceptance Criteria Summary

| AC | Name | Blocked by | Verifier state |
| --- | --- | --- | --- |
| AC1 | Variants and sizes | US-01M0GMC6 | `vitest "Button variants and sizes"` - fine once written |
| AC2 | Loading preserves width | - | fine |
| AC3 | Disabled stays focusable (D0022) | - | fine |
| AC4 | Focus indicator on 9 surfaces | US-01M0GMAE, US-01M0GM66 | fine |
| AC5 | Renders as anchor | US-01M0GMGZ | fine |
| AC6 | Token-only styling | US-01M0GME0 | **`pnpm lint:css` does not exist** |
| AC7 | Both themes and densities | US-01M0GM5M, US-01M0GMC6 | no visual tool installed |
| AC8 | Definition of done | - | **weak: `file verification.md` proves a file exists** |

### AC8's verifier is the fifth instance of a pattern this epic keeps correcting

`- **Verify:** file packages/react/src/components/Button/verification.md` passes the moment an empty
file exists. AC8 lists seven obligations - stories, tests, an axe assertion over default AND error
states, a visual baseline, a docs page, a keyboard table, a recorded manual pass - and the verifier
checks none of them.

Precedent: PL-01M0HRA0 AC3, PL-01M0HVR8 AC3, PL-01M0HXNX AC6, and three verifiers in PL-01M0HZ74.
**Replace it** with a check that parses `verification.md` and asserts each required section is
present and non-empty, and that the manual keyboard pass carries a date and a name. The manual pass
itself stays `Verify: manual ...` - never hand-stamped, per AGENTS.md.

---

## Specification delta (engagement floor)

| # | Interaction | Resolution |
| --- | --- | --- |
| 1 | **AGENTS.md: cascade layers cannot be retrofitted** | US-01M0GM16 lands first. Button's CSS Module emits inside `@layer clara.components` from its first line. Non-negotiable and unrecoverable if missed. |
| 2 | **AGENTS.md: Radix must not leak** - no `asChild`, `onOpenChange`, `data-state` in Clara API | Button needs no Radix primitive at all. Keep it dependency-free; a Radix `Slot` for `as` would leak its idiom (Section 4 rules 7-8). |
| 3 | **PRD F07 + D0022: disabled uses `aria-disabled` and stays focusable** | Native `disabled` is never used. The component must swallow activation itself (click and key), because `aria-disabled` is advisory to AT and does nothing to events. This is the subtle part: a test asserting only the attribute would pass while the button still fired. |
| 4 | **CR-01M0HWDQ: the CSS Modules path is unproven** | Button closes it. Add an AC asserting Button's hashed class name appears in `dist/styles.css` - not just that the file exists. |
| 5 | **PRD budget: importing Button alone adds <=3KB gzipped JS** | `.size-limit.json` currently budgets whole entry files at 5 kB, which is not the same measurement. Add a per-component import-cost entry. |
| 6 | **D0024: TDD, because the component has a keyboard interaction table** | **The story does not contain that table.** It is named in AC8 as an artifact to produce. Author the table FIRST - it is the specification the tests are written from - then the tests, then the component. |
| 7 | **PRD F01: tier 2 is public API** | Button must reference only tier 2/3. Any gap it hits is a signal the semantic layer is wrong (US-01M0GMAE), never a licence to reach for tier 1 or a literal. |
| 8 | **`export {}` in `packages/react/src/index.ts`** | Button is the first real export. Once published it is permanent - prop names, variant strings, size strings all become API. The union types are the surface to get right. |
| 9 | **TSD: axe over default AND error states** | Button has no error state. Either AC8's wording narrows to the states Button actually has, or "error" is defined for it. Flag, do not silently drop. |
| 10 | **Coverage/mutation are vacuous today** | Button is what makes them real. Expect the first honest coverage number here, and expect it to be below 90% until the tests are complete - that is the gate working. |

Interactions named: 10. Resolved: 8. **Flagged for the operator: 2** (interaction 9's error-state
wording; interaction 5's budget shape).

---

## Recommended Approach

**Strategy: TDD, mandated by D0024** - this component has a keyboard interaction table, so the table
is the specification and its tests come first. This is the first story in the project where TDD
applies rather than test-after; every prior one was structural.

**Order:** keyboard table -> failing tests -> types -> component -> CSS Module -> verification record.

Writing the prop types before the body is Anton's stated practice and matters most here: a type that
permits a nonsensical combination (`variant="ghost"` with `loading` and `as="a"`) is an unfinished
type, and every one of these is permanent at first publish.

---

## Implementation Phases

### Phase 0: Prerequisites (NOT this story)
The 42 points above. This plan does not start until they are green.

### Phase 1: The keyboard interaction table (the specification)
Author it into the story. Enter and Space activate; Space activates on keyup not keydown; disabled
swallows both; `as="a"` follows link semantics (Enter only, no Space). This table is what Phase 2
tests.

### Phase 2: Failing tests (TDD)
One test per row of the table, plus AC2 (width preserved, `aria-busy`), AC3 (focusable, announces,
does NOT activate), AC4 (computed contrast per surface), AC5 (anchor semantics), and an axe
assertion. Run them; they must fail for the right reasons.

### Phase 3: Types, then component
Literal unions for `variant` and `size`, never bare `string` (AGENTS.md). `as` as the single
polymorphism idiom. No `any` in the public signature.

### Phase 4: CSS Module
Inside `@layer clara.components`. Tier 2/3 tokens only. Verify Button's hashed class reaches
`dist/styles.css` (interaction 4, closing CR-01M0HWDQ).

### Phase 5: Verification record and the real gates
`verification.md` with every AC8 section filled. Then the first honest run of coverage, mutation,
and size-limit against real code.

---

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | Button ships CSS outside the cascade layer | Interaction 1. Unrecoverable, so it gates the story rather than being reviewed for. |
| 2 | `aria-disabled` set but activation not suppressed | Phase 2 asserts the click handler does NOT fire, not merely that the attribute is present. |
| 3 | The public surface is decided by accident | Types before body; the prop union IS the API review. |
| 4 | AC4's 9 surfaces do not all exist even after US-01M0GMAE | Re-check the enumerated list against the delivered families before starting; raise a CR if short. |
| 5 | Coverage drops below 90% and reads as a regression | It is the opposite - the first real number. Do not lower the threshold (TSD is explicit). |

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created via `new` (deterministic) |
| 2026-08-21 | sdlc-studio | Plan authored. **Headline: the story is not Ready** - 8 prerequisites Draft, 9 of 10 required tier 2 families missing, `lint:css` absent, no `@layer` emitted. 10 interactions (8 resolved, 2 flagged), 5 risks. AC8's verifier flagged as the fifth weak-verifier instance. |
