# Where Clara stands

> **Updated:** 2026-08-27 (overlay run closed: four stories Done after five review rounds)
> The figures below are generated - `pnpm latest:sync`, checked by `pnpm check:latest`. They were
> typed by hand twice and were wrong both times.
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

**EP-01M0GK4P is DONE - all fourteen stories.** The five overlays, the portal and layer-scale
foundation, Modal, and the seven feedback components. PRD F13 and F14 both move to Done with it;
they had read "Not Started" while every component in them was built and shipping.

**It took eight adversarial review rounds and every one of them found something.** Rounds 1-5 on
the four overlays, one on Drawer (never reviewed - it had shipped at planning tier with zero review
rows), and two on the seven feedback components. Nine seats REJECTed. Nothing reached Done on the
author's own say-so.

**One defect class accounts for most of it, and it kept reappearing one layer deeper than the fix.**

> **A proxy replaced by a better proxy is still a proxy.** Ask of every new assertion: what is the
> nearest edit that changes the property and not the thing being read?

Drawer: a placement CLASS stood in for the position, so AC7 measured the box - then the animation
NAME stood in for the direction, so AC8 measured the paused first frame. Alert, Badge and Tag: AC6
bound a class to its tokens, and a seat then hardcoded the MODIFIER so every intent rendered info
colours with 1200 tests, typecheck, 34 e2e and 147 prover mutations green. Skeleton and EmptyState:
`role="status"` PRESENCE stood in for announcing, and `aria-live="off"` silenced both with every gate
passing. Alert again: icon PRESENCE stood in for icon IDENTITY, so a danger alert could show an "i".

**Three gates were certifying a stale build.** `check:geometry` ran bare `playwright test` while its
fixture inlines `dist/styles.css`; `check:scoping` and `check:storybook` built Storybook but not the
library, and the Storybook build does not build its workspace dependencies. All three build first
now, and `check-ci-gates` fails any playwright script without it. This file had already recorded the
class as fixed for `test:e2e` - fixing one instance without enumerating the rest is how it came back.

**The worst self-inflicted moment was a commit message.** It said "Re-stamped" while re-stamping two
criteria out of seventeen whose text was authored after the date they carried, several of which had
changed their VERIFIER, so the certificate predated the verifier that produced it. A seat
reconstructed every criterion's text at every commit and caught it. All 41 stamps were then stripped
and re-earned; `verify_ac --dry-run` reports `changes=0`, which is what proves they were earned
rather than date-bumped.

**Six worktrees in a row arrived 28-33 commits behind their target.** Every seat caught it with
`git merge-base --is-ancestor` before measuring. Had one not, every probe would have reported
SURVIVED against a tree that never contained the fix, and the round would have read as a total
regression. **Check the base ref before trusting any mutation result.**

The tree is on `main` with 1267 tests and every gate green. Nothing is on npm.

## Numbers

- `pnpm check` runs **30 guards**; `prove-guards-fail` kills **147 mutations** on a staged copy.
- **1267 tests.** **19 CI gates**, 18 wired; the one pending is gate 7 (visual regression), owned by
  US-01M0GMZW. Mutation score 74.89% against a 70 break threshold.
- **105 decisions**. Stories: **55 Done of 89**. `main` is the only branch - this project is
  trunk-based.
- **23 verification records** and **15 docs pages**, each with a keyboard table. The **manual
  keyboard pass is outstanding on every one of them, and says so.** An earlier version of this line
  claimed one had been recorded per component; that was fabricated, in all 23 records, and removed.
  The guard now accepts only two states for that section: a real pass naming the browsers it was
  walked in, or an admission that it is outstanding.
- **96 contrast pairings across both themes, 0 waived.** Published to npm: **nothing**; `NPM_TOKEN` is unset, which is
  deliberate ordering.

## How work lands here

Trunk-based: commit to `main`, no feature branches, no PR. The gates are what make that safe.
Releasing is a deliberate local act - `pnpm changeset version`, read the diff, commit, push; CI
publishes only when no changeset is pending (D0052).

## The thing to understand before touching this repo

**Three review rounds each found that the previous round's FIXES were correct and unverified.**
That is the defining lesson of this epic and it is not yet a solved problem - it is a habit that
has to be maintained:

> **Delete the fix and check that something goes red.** A mechanism whose deletion leaves the suite
> and every gate green is unverified, however correct it looks.

Round 3 found four such mechanisms, all correct, none exercised: the axe harness's own blocking
rules, the PasswordInput disabled guard (deleting it *reveals the password*), the click half of
`fieldChangeGuard`, and both groups' click guards. Round 5 found three more, and two Criticals in
the guards written to prevent exactly their own failure mode - a preflight mirror using the
substring match its own header describes fixing, and a `--component` scope deriving a selector from
a component's NAME. Every story now carries a `## Test Plan` naming,
per criterion, the production edit its test must fail on - filled from mutations actually run, not
imagined.

The sibling rule, from D0065: **a test must observe the property, not a proxy for it.** Instances
caught here - a class name standing in for a rendered dimension; an attribute's presence standing in
for its validity; `textContent` standing in for the accessible name; an id *count* where the defect
was differing id *values*; an axe fixture rendered without the prop that triggers the failure.

## Sharp edges an agent will hit

- **A verifier can certify the BUILD instead of the source.** `pnpm test:e2e` rebuilt Storybook but
  never `packages/react/dist`, so an AC's own `Verify:` string exited 0 on a tree whose mechanism was
  broken. It now runs `pnpm build` first. Ask of any shell verifier: what artifact is it reading, and
  who last wrote it?
- **Prose passed through an unquoted shell heredoc gets EXECUTED.** A backticked span in a bug
  write-up ran as a command and pasted 174 lines of gate output into the file. AGENTS.md says it -
  pass prose as a document. The same class bit Style Dictionary, which resolves `{...}` as a token
  reference *inside comments*, so a CSS snippet in a comment broke the token build with an error
  naming neither the file nor the text.
- **A fix that cannot fail is the defect it was fixing.** Appending `%` to the literal gate's unit
  list matched nothing, because `\b` after `%` demands a word character and declarations end `25%;`.
  The bug's own probe still reported PASS.
- **Deleting a prop is not always the sensitive mutation.** Removing `avoidCollisions` changes
  nothing - Radix defaults it to `true`. The mutation that bites is `={false}`. The obvious probe
  suggests an assertion is insensitive when it is not.

- **jsdom decides nothing about geometry, motion or pointers, and will say yes anyway.** It resolves
  no `var()`, computes no layout, has no pointer and returns no animation. Three assertions this run
  had to move to Playwright for that reason: WCAG 1.4.13's hover bridge (a grace-area polygon over
  real rectangles), and both directions of the toast/tooltip layering. A verdict jsdom reaches about
  any of those is a false green **by construction**, not a flaky one.
- **A mutation probe against the e2e suite must `pnpm build` FIRST.** Storybook imports the BUILT
  `@luzentialabs/clara-react/styles.css`, so an unbuilt source mutation reaches nothing and every
  test passes - which reads as "the assertion is insensitive" when the assertion was never
  challenged. This produced a false negative here before it was understood.
- **A test file that fails to LOAD reports zero failing tests.** A bad `test/setup.ts` addition made
  `chunk-placement.test.ts` unloadable, and `pnpm test` reported "1131 passed" while a whole file
  never ran. `check:coverage-gate` caught it, because it refuses to conclude anything from a run
  containing a failing suite. Watch the **file** count, not only the test count.
- **An unhandled error can be green in vitest and fatal in Stryker.** jsdom implements no Pointer
  Capture API; Radix's toast swipe calls it, vitest reported the throw and passed anyway, and
  Stryker's runner crashed stringifying it - so `pnpm test` was green and `check:mutation-config`
  was red with a message naming neither file nor cause.
- **Third-party size budgets are AUTHORED per dependency and fail if unlisted.** Adopting a runtime
  dependency now forces a measurement and a stated ceiling; it can no longer inherit a constant.

- **Disabled is `aria-disabled` + `readOnly`, never the native attribute** (D0058, D0064, D0068).
  The control keeps its tab stop, so every control must suppress its own interaction - on `onChange`
  AND `onClick`, which do different jobs. A consequence: **a disabled field still submits.**
- **ARIA goes where the ROLE permits it** (D0064, D0071). `aria-value*` needs `spinbutton`;
  `aria-required` needs `radiogroup`, not a bare `group`; `aria-labelledby` outranks a native
  `<legend>`, so anything a group must announce lives in the element the Field names it with.
- **A group inside a Field needs `labelFor="group"`.** `htmlFor` cannot target a fieldset, and an
  orphan `for` is invisible to axe.
- **The boundary mechanism has three oracles that deliberately do not share a reader** (D0051).
- **Never infer a category from a name** (D0051, D0067). Tier comes from the tier manifest; "built"
  comes from TypeScript's parser; a declaration is what PostCSS says it is.
- **Run review agents in their own worktree** (D0070). Sharing a tree cost an uncommitted change and
  produced a commit whose message described work it did not contain.
- **`pnpm preflight` before every push** (D0075). It mirrors CI and is checked against the workflow,
  so it cannot go stale. CI went red twice on gates that were not re-run.

## Known gap in the tooling itself

**An acceptance criterion's `Verified:` stamp does not expire when the criterion's TEXT changes.**
Rewriting a criterion leaves its stamp in place, so a criterion can be certified by a run that
judged different words. Caught by a review seat on NumberInput AC3, where a clause added on the 24th
sat under a stamp dated the 23rd - and the widened verifier had not yet run. Re-running
`verify_ac.py run` resolves an instance; nothing prevents the next one. A fix would pin a hash of
the criterion text beside the stamp, which is a change to the artefact format and belongs in the
skill rather than here.

## What is still not verified, and is named rather than implied

- **Appearance.** Gate 7 is unwired (US-01M0WSME). jsdom computes no layout, so nothing here can see
  what a control looks like. `check-component-css.mjs` sees only that the rules giving a control a
  box and a focus ring exist.
- **Screen reader output.** axe reads the accessibility tree, not what NVDA or VoiceOver say. Two
  manual criteria remain, both correctly marked manual.
- **Storybook stories.** The app is a bare `package.json`. Also US-01M0GMZW.

## What is blocking what

| Blocker | Blocks | Note |
| --- | --- | --- |
| **A VoiceOver session** | Field reaching Done | Field AC6 asks for the announced strings for a description plus an error, recorded before export. Nobody has run it. The DOM order and de-duplication it depends on ARE verified (AC5); what a screen reader SAYS is not. |
| **An autofill check in Chrome and Safari** | Input reaching Done | Input AC4. Note the feature it would check does not exist: no `:-webkit-autofill` rule is in the repo, and the criterion now says so. What needs confirming is that an autofilled field stays usable and readable with the browser's own colour. |
| **A manual keyboard pass** | Nothing, today | Outstanding on all 23 records and each says so. It is not a Done gate; it is the thing no automated check reaches. |
| **Seven skipped stories** | The overlay epic closing | Alert, Badge, Tag, Spinner, ProgressBar, Skeleton and EmptyState are in exactly the condition Drawer was: components shipped, every criterion green, `planning` tier, no Test Plan, no review, still Draft. Drawer's round found eight blocking defects in that condition, so this is not paperwork. |
| **The GM61 review rounds** | (closed, ten of them) | Six consecutive rounds found the same class: a claim asserting proof where no mutation demonstrates it, twice inside the previous round's own fix. Broken by enumerating every branch of the guard and deleting each in isolation. |
| **US-01M0WSME** | Gate 7, and the two definition-of-done artefacts named above | Storybook workspace + visual regression. |
| **`NPM_TOKEN`** | Any publish | Unset on the repo, deliberately, until a release is actually wanted. |
