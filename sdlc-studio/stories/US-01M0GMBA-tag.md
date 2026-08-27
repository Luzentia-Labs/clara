# US-01M0GMBA: Tag

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GK4P
> **Serves:** Grace Adeyemi, Sofia Marchetti
> **Affects:** packages/react/src/components/Tag/Tag.tsx, packages/react/src/components/Tag/Tag.stories.tsx, packages/react/src/components/Tag/__tests__/tag.test.tsx, packages/react/src/styles.css, e2e/stacking.spec.ts, packages/react/src/components/__tests__/prop-shapes.test-d.tsx, packages/react/src/index.ts, packages/react/src/components/Tag/index.tsx, scripts/check-component-css.mjs
> **Points:** 2

## User Story

**As a** Grace Adeyemi
**I want** a label chip whose intent is readable without colour
**So that** tags remain scannable in a dense list and for colour-blind users

## Context

### Persona Reference

**Grace Adeyemi** - works the keyboard, so a remove control that is reachable but unnamed is a
button she can focus and cannot identify.
[Full persona details](../personas.md#grace-adeyemi)

**Sofia Marchetti** - builds filter bars where every applied filter is a tag, and needs the removal
affordance to be part of the component rather than something she wires up.
[Full persona details](../personas.md#sofia-marchetti)

### Background

A tag is a badge that can be taken off. On an ERP screen it is almost always a filter: eight of them
in a row above a table, each removable, and a keyboard user tabbing through all eight.

That row is the whole design problem. Eight buttons all named "Remove" are eight identical stops
with no way to tell which is which - the control is reachable and useless. So the remove control's
accessible name is built from the tag's OWN value, `Remove ${children}`, and `children` is typed
`string` on the removable variant for exactly that reason: a `ReactNode` cannot be interpolated into
a name.

`removeLabel` exists on top of that for another word or another language, not as the way to supply
the missing name.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| Epic | Accessibility | No state in Clara is carried by colour alone, and none by motion alone (D0100). The seat that DECIDES inclusive design (Idris, ux) is not the seat that PROVES it (Mira, qa) - neither may assume the other covered it | AC1 - the intent reaches the accessible name as a word; AC2 - the remove control names the VALUE it removes; AC6 - the class resolves to its own intent's colours |
| PRD F01 | API surface | Tier 2 tokens are public and permanent at publish; tiers 1 and 3 are not. Prop types use literal unions, never a bare `string`, wherever the value set is closed | `TagIntent` is a five-member literal union. On the REMOVABLE variant `children` narrows to `string`, because a name built by interpolation cannot interpolate a node |
| PRD | Styling | Component CSS may reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI. All CSS emits inside `@layer clara.reset, clara.tokens, clara.components;` | AC3 |
| TRD Section 7 | Boundary | Every component is classified server or client, and the classification is proved by three oracles that deliberately do not share a reader (D0051) | Tag is CLIENT (`'use client'`), because a removable tag holds a click handler |
| PRD | Performance | Per-component JavaScript budgets apply; CSS is deliberately not tree-shaken and ships as one stylesheet | No AC of its own - held by `pnpm size` |

## Acceptance Criteria

### AC1: Intent is not colour alone

- **Given** a Tag with an intent
- **When** it renders
- **Then** the intent reaches the ACCESSIBLE NAME as a word, and the intent prop reaches its own
  class so the colour is a token rather than an inline style
- **And** the criterion used to read "a mark, icon or text label accompanies the colour", and
  Tag renders none of those three - only a `clara-visually-hidden` word. **BG-01M11KT6** carries
  the gap: Grace Adeyemi is named in this story's `Serves:` and is SIGHTED with a red-green
  deficiency, so an accessibility-tree carrier does not reach her, and red/green is exactly the pair
  she cannot separate. The title is left as written rather than quietly reworded, because it points
  at a real gap that renaming would hide
- **And** what IS guaranteed is stated in the component's own docblock and now in the criterion: the
  intent never depends on the colour for a screen-reader user. What is NOT guaranteed is that two
  tags with the same text and different intents look different, and no API can promise that
- **Verify:** vitest "Tag intent is not colour alone"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC2: Removable tags are labelled

- **Given** a removable Tag
- **When** a keyboard user reaches the remove control
- **Then** it is focusable and labelled with the value it removes
- **Verify:** vitest "Tag remove control names its value"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC3: Token-only styling

- **Given** the Tag stylesheet
- **When** the lint rule runs
- **Then** it references tier 2 or tier 3 tokens only, with no raw literal
- **Verify:** shell node scripts/check-component-css.mjs
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC4: Both themes and densities

- **Given** a Tag
- **When** it renders in dark theme and compact density
- **Then** it renders inside the correct scope and passes axe in all four combinations
- **Verify:** vitest "Tag theme and density matrix"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC5: Definition of done

- **Given** the Tag story
- **When** it is proposed for export
- **Then** a verification record exists carrying a keyboard table, an accessibility section, at least
  three resolving citations to what is verified automatically, and at least one stated gap - and the
  docs page it names exists
- **And** the wording and the VERIFIER were both wrong, and the verifier was the worse of the two.
  It read `file packages/react/src/components/Tag/index.tsx`: a definition-of-done criterion that
  passes because one file exists. Every other story in this epic runs
  `check-verification.mjs --component X`, which was available for Tag the whole time and reports
  `1 verification record(s), 11 citation(s) resolved` when asked. Deleting every test Tag has would
  not have moved the old verifier
- **And** the claim was the copied sentence the other six stories no longer carry - "stories, tests,
  an axe assertion over default and ERROR states, a VISUAL BASELINE, a docs page all exist". Tag has
  no error state, gate 7 is unwired so no baseline exists for any component, and
  `check-verification.mjs` has a rule for neither. **BG-01M107ND** carries the same correction for
  the 21 stories that still copy it
- **Verify:** shell node scripts/check-verification.mjs --component Tag
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC6: An intent class renders its OWN intent's colours

- **Given** a Tag in each of its four intents
- **When** its computed colours are read in a real browser, in both themes
- **Then** each intent class resolves to that intent's tier 2 pair, and the four intents are
  mutually distinct
- **And** BOTH halves are load-bearing. Without the distinctness check, a build that collapsed all
  four tier 2 aliases to one colour would satisfy the per-intent comparison and prove nothing
- **And** **this is not a contrast criterion and no contrast assertion could replace it.** Measured:
  repointing `.clara-tag--danger` at the info tokens left 1200 unit tests,
  `check-component-css` and `check-contrast` all green - because info-on-info is a perfectly good AA
  pair. The failure is a danger tag that renders as an information tag, with the colour
  saying one thing and the announced word saying another
- **And** it cannot be asserted in jsdom, which resolves no `var()` at all, so any verdict it
  reached here would be a false green by construction rather than a flaky one
- **Verify:** shell pnpm test:e2e -g "every intent class renders its own intent colours"
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

### AC7: The prop shapes cannot be written wrong

- **Given** the discriminated prop pairs on Tag
- **When** the workspace is type-checked
- **Then** every shape the component refuses is a COMPILE error, and each refusal is asserted
- **And** the guarantees held and NOTHING held them. Deleting a `?: never` discriminator left
  `pnpm typecheck` at exit 0, 1219 tests passing and the API report clean, and the variant
  interfaces were not even exported - so they reached `clara-react.api.md` only as
  `(ae-forgotten-export)` warnings and a breaking change to one would not have appeared in the public
  surface diff at all. They are exported now, which is what puts them under `check:api-report`
- **And** the assertions are written in TWO forms on purpose. A confirmation seat proved the JSX form
  insufficient by itself: JSX applies its own excess-children check, so deleting `children?: never`
  from `BadgeCountProps` was invisible through that route. Sweeping all seven discriminators one at a
  time, five were caught through JSX and two were not. Non-literal assignability assertions cover the
  rest, and narrowing assertions cover the two that a component merely happened to hold by reading
  the prop
- **And** an `@ts-expect-error` that would never have errored is dead weight reading as coverage, so
  the seat also replaced every directive with an inert token and confirmed all 14 sites produce a
  real `TS2322` naming the asserted cause
- **Verify:** shell pnpm typecheck
- **Verified:** yes (2026-08-27)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Tag

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Component CSS references tier 2 or tier 3 tokens only, never a literal. `as` is the only polymorphism idiom. No Radix type, prop name, or `data-*` attribute may reach the public surface. All CSS is emitted inside `@layer clara.reset, clara.tokens, clara.components;`.

**Definition of done** is the TSD's, not this story's: stories, unit and interaction tests using accessible queries, an axe assertion over default and error states, a visual baseline in both themes and both densities, a docs page, a mutation score at or above threshold.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| Eight removable tags in a filter bar | Eight DISTINCT accessible names, each naming its own value. This is the case the API is shaped around |
| A removable tag with a `ReactNode` child | A type error. `children` narrows to `string` on the removable variant, because `Remove ${node}` cannot produce a name |
| `removeLabel` given | It wins. That is for another word or another language, not for supplying a name the component would otherwise lack |
| Not removable | No control renders at all, rather than a disabled one. `onRemove` and `removeLabel` are a discriminated pair |
| The remove glyph reaching a screen reader | Nothing. It is `aria-hidden` - the button already has its name, and "x" read aloud is noise |
| `intent="neutral"` (the default) | Announces nothing extra, exactly as Badge does |
| Reached by keyboard | The control is in the tab order and operable by Enter and Space |
| An intent repointed at another intent's tokens | Caught by AC6 in a browser, and by nothing else |

## Test Scenarios

- [x] The remove control names the VALUE it removes, not just "Remove"
- [x] `removeLabel` overrides the name, for another word or another language
- [x] The control is reachable and operable from the keyboard
- [x] No control renders at all when the tag is not removable
- [x] The glyph is hidden from the accessibility tree, since the button already has a name
- [x] Every non-neutral intent joins its word to the accessible name, and neutral says nothing extra
- [x] axe passes removable and static
- [x] All four theme and density combinations render and pass axe
- [x] **In a browser:** every intent class resolves to its OWN intent's colour pair, in both themes

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocking | The tier 2 semantic tokens every colour here resolves through | Done |
| [US-01M0GM5M](US-01M0GM5M-theming-light-dark-and-context-based-scoping.md) | Blocking | `ClaraProvider`, and the rule that light lives on `:root` while only the dark selector scopes anything | Done |
| [US-01M0GMC6](US-01M0GMC6-density-modes-with-computed-geometry-assertions.md) | Blocking | The density scale the matrix criterion renders against | Done |
| [US-01M0WSME](US-01M0WSME-chromatic-visual-regression-blocking-on-unreviewed-diffs.md) | Non-blocking | Gate 7. Nothing here can see what the component LOOKS like | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| None at runtime | - | This component imports no third-party package. The library reads no environment variables and makes no network call |

## Estimation

**Points:** 2
**Complexity:** Low

The same size as Badge and for the same reason: the render is trivial and the work is in the
type shape. Narrowing `children` to `string` on the removable variant is the decision that has to be
right before publish - widening it afterwards is a minor, narrowing it is a major.

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

**Affects production runtime:** false

This is a library. It runs no service, holds no data and is never deployed - so there is nothing to
roll back operationally. What it HAS is a one-way door: once `Tag` and its props are published
under `@luzentialabs/clara-react`, a rename breaks consumers already shipped, and a bad release is
fixed FORWARD with a patch and never unpublished.

| Component | Reversal | Expected time |
| --- | --- | --- |
| The `Tag` export, before any publish | Revert the commit. `NPM_TOKEN` is unset deliberately, so nothing has left this repository | Minutes |
| The `Tag` export, after a publish | Not reversible. Deprecate the release, ship a corrected patch, leave the bad version in place - releases are immutable by policy | One release cycle |
| The four `--clara-tag-*` tier 3 token pairs | Not independently reversible | Requires re-running every consumer of the shared surface |

## Open Questions

- [ ] None. Both questions below were answered during the
      review round and are recorded under Resolved Questions.

## Resolved Questions

- [x] Should the removable variant accept a `ReactNode` child, like the static one?
      **No - settled by AC2.** The remove control's name is built by interpolating the child, and a
      node cannot be interpolated into a string. Allowing it would mean either an unnamed control or
      a silently generic one, and both are the defect AC2 exists to prevent.


- [x] Should a removable tag's whole surface be clickable, rather than just the control?
      **No.** A tag is frequently the label of something the user wants to click THROUGH to, and a
      whole-surface remove turns an ordinary click into a destructive one. The control is a distinct
      target with its own name, which is also what makes AC2 expressible.

## Test Plan

Every row below was RUN against this tree. `Mutant` is the production edit the criterion's own
verifier must fail on, and the verdict beside it is what happened when that edit was made.

| Criterion | Touches | Mutant - the production change this test must fail on | Title |
| --- | --- | --- | --- |
| AC1 | packages/react/src/components/Tag/Tag.tsx | **(review)** Also hardcode the modifier to `'clara-tag--info'`, and repoint the base rule's neutral tokens at danger - both KILLED now, both previously survived 1200 tests and the whole e2e suite. Badge carried a class assertion from the start and Tag did not, which is how the gap survived: the test already existed in this repository and was not copied. Then, the announcement mutant: suppress it with `{intent !== 'neutral' && (` becomes `{false && (`. KILLED, 4 tests, total still 1200. A suppression rather than a deletion, because deleting the span leaves invalid JSX and a suite that fails to compile reports a lower count rather than a failing assertion. | Intent is not colour alone |
| AC2 | packages/react/src/components/Tag/Tag.tsx | Replace ``aria-label={input.removeLabel ?? `Remove ${input.children}`}`` with a constant `aria-label="Remove"`. KILLED, 4 tests. The constant is the whole point: eight filter tags in a row all named "Remove" are eight identical tab stops with no way to tell which is which - reachable and useless. A mutant that DELETED the label would also be caught by axe, and would not prove the name is built from the value. | Removable tags are labelled |
| AC3 | packages/react/src/styles.css | Add `border-radius: 7px` to `.clara-tag` - a raw literal where a token belongs. KILLED, `check-component-css` exits 1. The verifier is a guard that READS the stylesheet, which is required here: no test imports a CSS file, so a vitest-only verifier over this mutant would be green by construction. | Token-only styling |
| AC4 | packages/react/src/theme/resolve.ts | `claraAttributes` returns `{}`, so the provider stops stamping its scope. KILLED, 4 of 4 combinations. Mutating the PROVIDER rather than the component is what proves the assertion reads the scope rather than merely finding the component. What this criterion claims is bounded and the story says so: jsdom sees no layout and resolves no custom property, so the APPEARANCE is gate 7's. | Both themes and densities |
| AC5 | packages/react/src/components/Tag/verification.md | Rename `## Keyboard` to `## Keys`. KILLED - `missing section "## Keyboard"`, exit 1. Renaming it to anything CONTAINING `## Keyboard` was accepted until 2026-08-27, when `sectionBody`'s prefix match was anchored to a whole line; that suffix form is now `prove-guards` mutation 147. The verifier itself was the defect here and is recorded in the criterion: it read `file .../index.tsx`, so it passed because one file existed. | Definition of done |
| AC6 | packages/react/src/styles.css | Repoint `.clara-tag--danger` at the info tokens, leaving the class name alone. KILLED by this criterion ALONE. Measured surviving everything else: 1200 unit tests, `check-component-css` and `check-contrast`. **No contrast assertion could ever catch it** - info-on-info is a good AA pair - which is why this criterion reads the computed colours and compares them against a probe carrying the intent's tier 2 pair, rather than measuring a ratio. | An intent class renders its OWN intent's colours |
| AC7 | packages/react/src/components/Tag/Tag.tsx, packages/react/src/components/__tests__/prop-shapes.test-d.tsx | Delete `TagStaticProps.onRemove` and `TagStaticProps.removeLabel` - each `?: never` discriminator, one at a time. ALL KILLED, and the sweep is the point: run individually rather than together, because deleting two at once masks which one was doing the work. Two of the seven across the three components previously SURVIVED this sweep - JSX excess-children checking hid them - and two more reddened only the component file rather than the assertions, so a refactor that stopped reading the prop would have unguarded them. | The prop shapes cannot be written wrong |

## Revision History

| Date | Author | Change |
| --- | --- | --- |
