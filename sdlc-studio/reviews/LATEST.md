# Where Clara stands

> **Updated:** 2026-08-26 (close of the EP-01M0GK4P overlay run - all five overlays built)
> The figures below are generated - `pnpm latest:sync`, checked by `pnpm check:latest`. They were
> typed by hand twice and were wrong both times.
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

**All five overlays are built** - Popover, Tooltip, Toast and DropdownMenu joined Modal and Drawer
this run - and **US-01M0GM61 (portal + layer scale) is Done after TEN review rounds**, six of which
found the same class of defect: a claim asserting proof where no mutation demonstrates it. Rounds 8
and 9 each found it inside the previous round's fix. A systematic pass - every branch of
`check-overlay-contract.mjs` deleted in isolation - ended it, and round 10 re-derived that
independently and approved.

**The four new overlay stories are NOT transitioned to Done.** Each needs its independent
adversarial review first; the author never records their own verdict. Their acceptance criteria all
verify green (`ac=7 pass=7` Toast, `ac=7 pass=6 manual=1` Tooltip, `ac=6 pass=6` DropdownMenu),
which is a different and weaker statement than "reviewed".

The tree is on `main` with 1155 tests and every gate green. Nothing is on npm.

## Numbers

- `pnpm check` runs **29 guards**; `prove-guards-fail` kills **135 mutations** on a staged copy.
- **1155 tests.** **19 CI gates**, 18 wired; the one pending is gate 7 (visual regression), owned by
  US-01M0GMZW. Mutation score 74.89% against a 70 break threshold.
- **104 decisions**. Stories: **43 Done of 89**. `main` is the only branch - this project is
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
| **Independent review** | US-01M0GM31, US-01M0GMK1, US-01M0GM9W, US-01M0GMQJ reaching Done | All four overlay stories verify green and none has been reviewed. `transition.py` enforces this - it refuses Done without a plan-review APPROVE from a reviewer who is not the author. |
| **The GM61 review rounds** | (closed, ten of them) | Six consecutive rounds found the same class: a claim asserting proof where no mutation demonstrates it, twice inside the previous round's own fix. Broken by enumerating every branch of the guard and deleting each in isolation. |
| **US-01M0WSME** | Gate 7, and the two definition-of-done artefacts named above | Storybook workspace + visual regression. |
| **`NPM_TOKEN`** | Any publish | Unset on the repo, deliberately, until a release is actually wanted. |
