# US-01M0GMZW: Storybook workspace with theme and density toolbars

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning
> **Epic:** EP-01M0GKM4
> **Serves:** Sofia Marchetti
> **Affects:** .github/workflows/pages.yml, apps/storybook/package.json, apps/storybook/.storybook/main.ts, apps/storybook/.storybook/preview.tsx
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a playground where every component can be seen in all four theme and density combinations
**So that** I can choose the right component and props before writing code

## Evidence for wiring this (added 2026-08-25, from Modal's review rounds)

Three adversarial rounds on Modal (US-01M0GM48) produced a concrete argument for this story, and it
is recorded here so whoever picks it up does not have to rediscover it. Every one of these was found
by rendering in Chromium by hand, and none is observable from jsdom or from a stylesheet:

| What was wrong | Why nothing here could see it |
| --- | --- |
| A 2000px child rendered at 18px and the modal body did not scroll (`flex: 1` overriding `flex-shrink: 0`) | jsdom computes no layout |
| The panel rendered wider than the viewport (`box-sizing` missing, Clara ships no reset) | jsdom computes no layout |
| `.focus()` on a `[hidden]` element was a silent no-op, so focus landed on `document.body` | jsdom honours no `hidden` |
| Closing a dialog scrolled the page from y=4000 to 0 (`focus()` without `preventScroll`) | jsdom has no scroll position |
| A `useConfirm()` provider landed the user on the page's skip link after every confirmed action | React's deletion traversal order differs from jsdom's, and traversal order is not something a test can pin |
| A closed Modal stole focus and scrolled the page on mount, and again under StrictMode | jsdom models neither |

D0096 records the boundary: the text-based CSS contracts in `check-component-css.mjs` are a floor.
They read the stylesheet, not the cascade, so they cannot see specificity, source order, inheritance,
or a later rule overriding an earlier one. A computed-style assertion on a rendered panel catches all
four rows above for free, and is immune to the syntactic dodges that took three rounds to close
(`background-image`, the `overflow` shorthand, `:is()`, `[class~=]`).

**This is now the highest-value unbuilt story in the epic** - twelve more overlays inherit the floor.

## Acceptance Criteria

### AC1: Toolbars exist

- **Given** Storybook
- **When** it loads
- **Then** global toggles switch theme and density
- **Verify:** shell pnpm check:storybook
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC2: a11y addon is on

- **Given** any story
- **When** I open the a11y panel
- **Then** axe violations are visible in the UI
- **Verify:** grep "addon-a11y" apps/storybook/.storybook/main.ts
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC3: Autodocs from types

- **Given** a component
- **When** I open its docs tab
- **Then** the props table is generated from TypeScript with TSDoc descriptions
- **Verify:** shell pnpm check:storybook
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

### AC4: Static build deploys

- **Given** the default branch
- **When** a merge lands
- **Then** Storybook builds statically and deploys to GitHub Pages (D0027)
- **Verify:** grep "upload-pages-artifact" .github/workflows/pages.yml
- **Verified:** yes (2026-08-25)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Specification delta (2026-08-26)

**Three of the four acceptance criteria verified that a file existed, not that anything worked.**
AC1 was `file apps/storybook/.storybook/preview.tsx` and AC3 was `file .../main.ts`. A `preview.tsx`
containing one comment satisfies both, and so does a toolbar that renders and changes nothing.

That is not hypothetical here. During implementation, `storybook build` reported success while
EVERY story rendered as `ReferenceError: React is not defined` in the preview iframe - the config
files compiled to bare `React.createElement` calls with no import, because the automatic JSX runtime
was not reaching them. Both original verifiers passed against that build. The playground was green
in CI and blank in a browser, which is the exact shape D0099 was recorded about.

AC1 and AC3 now run `pnpm check:storybook`, which builds the playground and asserts in Chromium
that switching the theme global repaints the canvas, that switching the density global changes a
Button's computed height to the 40px/32px scale gate 9 holds (D0098), and that the autodocs props
table is generated from the TypeScript types. AC4 greps for `upload-pages-artifact` rather than the
word "storybook", which appears in a comment.

AC2 keeps its grep. The a11y ADDON is a panel the author opens while working; the blocking
assertion is gate 5 (`pnpm check:axe`), which already exists and already runs. Asserting the addon
is registered is the honest scope of this criterion, and an addon nobody opens is not a gate.

**Gate 7 is no longer bound to this story.** `ci-gates.json` had this story owning "Visual
regression: no unreviewed diffs", which none of its four criteria deliver - and closing it would
have left the gate owned by a closed story. Gate 7 is Chromatic (TSD Section 5) and is now owned by
US-01M0WSME. See D0099.

## Scope

### In Scope

- Storybook workspace with theme and density toolbars

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
