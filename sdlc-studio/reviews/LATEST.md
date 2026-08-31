# Where Clara stands

> **Updated:** 2026-08-31 (RUN-01M17Q8Z: the blocking set cleared, the close at its round cap)
> The figures below are generated - `pnpm latest:sync`, checked by `pnpm check:latest`. They were
> typed by hand twice and were wrong both times.
> Read this first after any compaction or reset, then run `/sdlc-studio status`.

## One paragraph

**EP-01M0GK91's five components are built, independently reviewed and repaired.** MultiSelect,
DatePicker and DateRangePicker were built in this run; Select and Combobox were resolved in it. All
five stories are `full` tier with an independent plan-review APPROVE, and every unit carries a
delivery verdict. The tree is green.

The tree is on `main` with 1399 tests and every gate green. Nothing is on npm.

**Three review sequences ran, and each one found something the one before it had missed.** That is
the finding worth carrying, not the fix list.

> **A fix for a vacuity can itself be vacuous.** Twice in one day: the commit that made the APG
> deviation count machine-read contained a PageUp pin that could not fail, and the commit that
> fixed a scenario ticked-with-no-test contained a typeahead test that could not fail on the flag
> it named. Both were caught by a seat, not by the author, and both were inside the repair for
> exactly that defect class.

**Round 1 on the three new components returned three real user-facing defects and five tests that
could not fail** - and it was the FIRST round on that code. DateRangePicker banked a pending start
across every dismissal except Escape. DatePicker rendered a calendar of ZERO day cells for any
unparseable seed, including a half-typed `2026-0`. MultiSelect re-seated its highlight on every
toggle, so the next Enter hit a value the user was not looking at. Cost about 130k tokens. Compare
rounds 3-4 on Select and Combobox: ~1.35M for one user-facing defect. **The first round on
unreviewed code is where quality is cheapest; late rounds are where it is dearest.**

**The engagement floor was skipped, and the bill arrived at the close rather than in the code.** All
five stories were `Template: planning` scaffolds coded against directly. Nothing failed at build
time - preflight was green, a review had approved three components - and then `sprint close` refused
at 14 items, twelve of them rooted in that one fact. Promoting the five and writing the 40 deferred
sections is what cleared it. A specification written after the code is evidence of what was built,
not of what was intended, and each story says so in its own Context section.

**Verification method, three failures, one root.** A probe that silently did not apply and reported
green; a probe that hit the wrong CSS selector; and a mutation "verified" on a suite-wide failure
count when the failures came from pre-existing tests rather than the test under check. Every mutation
probe now asserts the substitution landed, isolates with `-t`, and expects the count to move from 0
failed to 1 failed on that one test.

**Six REJECTs on Select before its APPROVE triggered a convergence escalation**, which is the tool
working: `critic.py` notified the operator that the repair was not converging. The close then
stopped at its declared round cap of 6 rather than starting a seventh, and says so - `a cap nobody
enforces is a comment`.

## Numbers

- `pnpm check` runs **30 guards**; `prove-guards-fail` kills **147 mutations** on a staged copy.
- **1399 tests.** **19 CI gates**, 18 wired; the one pending is gate 7 (visual regression), owned by
  US-01M0GMZW. Mutation score 74.89% against a 70 break threshold.
- **131 decisions**. Stories: **55 Done of 89**. `main` is the only branch - this project is
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

## Open at the close of RUN-01M17Q8Z (2026-08-30)

The run was left OPEN by operator decision. These are the 14 outstanding items' roots, not a waiver:

| Open | Why it is open |
| --- | --- |
| **All five stories are `Template: planning`** | US-01M0GM0F, US-01M0GMC1, US-01M0GMC7, US-01M0GMJ8, US-01M0GMRK were coded against as scaffolds. Each defers 8 sections and needs a plan-review. This is the single root of 12 of the 14 blockers, and closing needs 40 retrospective sections plus 5 overrides. |
| **Select carries round 4's REJECT** | US-01M0GMRK's latest verdict is REJECT (mira-calderon, 2026-08-29); Combobox's is APPROVE. That asymmetry alone is why review coverage reads 4 of 5. Its findings are mostly record-prose accuracy, plus one real gap: no tier 3 text pairing for the listbox panel. |
| **The mutation lane is stale** | Evidence is from `c3982994a`, not this tree; 3 of 10 files of the recorded surface, one self-reported. Already carried as CR-01M153BV - do not re-file it. |
| **The per-commit gate is unenforced** | The policy declares a `selected` per-commit lane, and no commit hook is readable at any of the four paths checked. Policy and reality are UNRECONCILED, and no full run has ever been measured, so the gate's cost is UNKNOWN rather than zero. |

## Outstanding at the close of RUN-01M17Q8Z (2026-08-31)

| Open | Why |
| --- | --- |
| **BG-01M1AJSR** | Six measured APG deviations on the shared listbox pattern, recorded and pinned but not resolved. Each changes keyboard behaviour for three shipped components at once, so it is an operator decision, not an implementer's correction. The bug lays out three options and picks none. |
| **BG-01M1AN45** | `check-verification`'s shared-engine allowance validates the cited FILE, never the CLAIM. Filed rather than fixed: the base rule has the same granularity, and a further round of tightening risks implying a guarantee the check cannot give. |
| **BG-01M19411, BG-01M17P6M, BG-01M159WJ** | Carried from earlier. The flat per-component barrel-entry budget; ArrowDown walking a grouped highlight upward; a highlight reset on a fresh array identity. |
| **The mutation lane** | Evidence is from `c3982994a`, not this tree - 3 of 10 files of the recorded surface, one self-reported. Carried as CR-01M153BV; do not re-file. |
| **The per-commit gate** | Policy declares a `selected` per-commit lane and no commit hook is readable at any of the four paths checked. Policy and reality UNRECONCILED, and no full run has ever been measured, so its cost is UNKNOWN rather than zero. |
| **The manual keyboard pass** | Outstanding on every record in this epic, and each says so. Not a Done gate; it is the thing no automated check reaches. |

## Deferred at close (RUN-01M0Q8VF)

- CR-01M1534S: [checklist] goal-seat-reviewed: Sprint Goal stated and seat-reviewed BEFORE the plan - past its window (`sprint plan`) (deferred, not waived)
- CR-01M15331: [checklist] batch-boundary-review: Review at each delivery batch boundary - past its window (`sprint review-batch`) (deferred, not waived)
- CR-01M153BV: [gate] mutation: 5 survived, 0 error(s) of 5 applied (0 truncated) - advisory - summary is from the run at c3982994a, not this tree (090edfbf7); mutation evidence covers 3/10 file(s) of the recorded surface (nothing changed since HEAD); 1 of those is self-reported (mutants registered by hand, not a measured run): package.json; STALE (edited since mutated): .size-limit.json, package.json, Toast.tsx (+4 more) (deferred, not waived)
