# Test Strategy Document

> **Project:** Clara Design System
> **Version:** 0.1.0
> **Status:** Draft
> **Last Updated:** 2026-08-21
> **Owner:** Mira Calderon seat (qa) - see `personas/seats/mira-calderon.md`
> **PRD:** [PRD v0.2.0](prd.md) | **TRD:** [TRD v0.1.0](trd.md) | **Decisions:** D0013-D0016

## Overview

Clara is a component library, so the standard test pyramid does not apply. There is no API to
contract-test, no database to integrate against, and no user journey to drive end to end. What
replaces them is a **per-component verification matrix**: every exported component is proved
correct in behaviour, accessible in operation, stable in appearance, and correct in its published
package form.

Two facts set the bar. First, **blast radius**: a defect reaches every consuming application at
once. Second, **permanence**: a published release cannot be recalled. Together they mean the cost
of a missed defect is paid by everyone downstream, forever, and the cheapest place to catch it is
before merge.

The strategy's governing conviction, taken from the QA seat: **automation proves attributes are
present and nothing more.** Whether the result is usable is a separate question that costs a
keyboard, a screen reader, and time, and there is no substitute for spending them.

## Test Objectives

1. Prove every component is operable end to end by keyboard alone, by someone actually doing it
2. Prove screen reader output is comprehensible, not merely technically correct
3. Prove the test suite can fail - measured, not assumed
4. Prove every component holds across both themes and both densities, where contrast and
   target-size regressions hide
5. Prove the published package installs and builds in real consuming applications
6. Catch a public API surface change in review rather than on a consumer's install

## Scope

### In scope

- Component behaviour, including error, empty, disabled, and loading states
- Accessibility: automated assertions, keyboard operation, screen reader verification
- Visual appearance across theme x density
- Token contrast across the enumerated pairing matrix
- Package correctness and consumer installability
- Assertion integrity (mutation)

### Out of scope

- Load and stress testing. Clara serves no requests; the only performance concerns are bundle size
  and render time, covered by budgets rather than load tests
- Penetration testing. No network surface, no auth, no data. Security testing is supply chain
  scanning only
- Cross-browser matrix beyond the stated support targets
- Testing Radix's own behaviour. Clara tests its integration and its own surface, not its
  dependency's internals

---

## Test Levels

### Coverage targets

| Level | Target | Blocking | Rationale |
|-------|--------|----------|-----------|
| Statements | 90% | Yes | The skill default, and the PRD's stated number |
| Branches | **85%** | Yes | Added deliberately. Branches are where error paths and conditional rendering live, which is exactly where component libraries leak. Statement coverage can rise while assertions weaken; branch coverage is harder to satisfy vacuously |
| Mutation score | **70%** | Yes | The real quality signal. See below |
| Component story coverage | 100% | Yes | Every exported component has a story file, or CI fails |
| Component a11y assertion | 100% | Yes | Every exported component has an axe assertion |

> **On the inversion.** PRD F22 put a hard number (90% statements) on the weakest metric and left
> the strong signal (mutation) with no tool, no threshold, and no statement of whether it blocked.
> This document fixes that: both are now blocking, and the mutation gate is the one that answers
> "can these tests fail?"

### 1. Unit and interaction testing

| Attribute | Value |
|-----------|-------|
| Framework | Vitest + React Testing Library |
| Environment | jsdom |
| Execution | Every PR, blocking. Under 3 minutes locally |
| Scope | Every exported component and every exported hook |

**Rules:**

- Query by accessible role and name. `getByTestId` is permitted only where no accessible query
  exists, and each use carries a comment naming why
- Test the **error, empty, disabled, and loading states first**. The happy path never goes where
  libraries leak
- No snapshot test stands in for a behaviour test
- Controlled and uncontrolled modes are both exercised for every stateful component
- A flaky test is diagnosed, never retried, skipped, or given a longer timeout

### 2. Accessibility - automated

| Attribute | Value |
|-----------|-------|
| Framework | `axe-core` driven directly by a local matcher in `test/axe.ts` (**D0032** - `vitest-axe` is unmaintained), plus the Storybook a11y addon for interactive inspection |
| Execution | Every PR, blocking |
| Gate | **Zero violations at serious or critical severity** |
| Scope | Every exported component, in its default state **and its error state** |

Automated a11y is a floor, never a conformance claim. See level 3.

### 3. Accessibility - manual (bounded)

The stopping point is set here deliberately rather than left open, because "one more screen reader,
one more browser" has no natural end.

| Pass | Scope | Trigger |
|------|-------|---------|
| **Keyboard** | **Every exported component**, once, at export | Every new component; re-run on any change to focus behaviour or the keyboard table |
| **Screen reader (VoiceOver / Safari)** | Every interactive component | At export; re-run on any change to ARIA attributes, focus behaviour, or the keyboard table |
| **Screen reader (NVDA / Firefox)** | **Not currently performed - see Known gaps** | n/a |

**What is recorded.** A committed `verification.md` per component containing:

1. The keyboard interaction table, with the observed result per row
2. **The strings actually announced**, not the strings expected
3. The date and the tool version

The criterion is "a current verification record exists for every exported component", which can be
observed failing. "Testing happened" cannot.

**Known gaps (stated, not hidden).** NVDA is Windows-only and the maintainer works on macOS, so
NVDA verification is not performed. NVDA and VoiceOver differ in real ways, so this is a genuine
gap, not a formality. It is recorded in the accessibility statement on the docs site as an explicit
known limitation rather than papered over by a general AA claim. Revisit if a Windows environment
becomes available or a consumer requires it.

### 4. Keyboard interaction testing (automated)

| Attribute | Value |
|-----------|-------|
| Framework | Playwright against built Storybook |
| Execution | Every PR, blocking. CI-only |
| Scope | Every component with a documented keyboard table |

**Focus assertions are mandatory and explicit.** For every overlay - Modal, Drawer, Popover,
DropdownMenu, Tooltip, and the Combobox and DatePicker popups - the suite asserts the **identity of
the focused element**:

| Event | Asserted |
|-------|----------|
| On open | The named initial focus target receives focus |
| Escape | The named restoration target receives focus |
| Outside click | The named restoration target receives focus |
| Close button | The named restoration target receives focus |
| Successful commit | The named restoration target receives focus |

"Restores focus correctly" is not a test. The named target is.

> This level exists because of a specific failure: a modal whose Escape handler closed it and left
> focus on `<body>`, returning a keyboard user to the top of the page with no way back. Every axe
> rule was green, because every individual attribute was correct. No automated rule catches it.
> A focus-identity assertion does.

### 5. Visual regression

| Attribute | Value |
|-----------|-------|
| Tool | **Chromatic** (D0013) |
| Source | Existing Storybook stories - no separate driving code |
| Execution | Every PR, blocking on unreviewed diffs |
| Matrix | Every component x {light, dark} x {comfortable, compact} |

Chromatic consumes the stories F18 already requires, so the baseline matrix is close to free. Its
review interface is the deciding factor: 100+ baselines is a triage problem, and bulk-approving
diffs without looking is the failure mode this level exists to prevent.

**Dedicated baselines beyond per-component stories:**

- The focus indicator rendered against **every** background token, including all emphasis surfaces
- A Combobox and a DropdownMenu inside a dark compact `<ClaraScope>` on a light comfortable page,
  proving TRD ADR-006's portal scoping (trigger and portal content must match)
- The full component set side by side in both densities

### 6. Token contrast testing

| Attribute | Value |
|-----------|-------|
| Framework | Vitest, computed contrast assertion |
| Input | `tokens.pairings.json` (PRD Section 7) |
| Execution | Every PR, blocking |

Iterates the enumerated pairing matrix in both themes, asserting the per-role threshold: 4.5:1
text, 3:1 large text, 3:1 non-text (borders, icons, control boundaries, focus indicator).

**It also asserts its own row count matches the documented table**, so a pairing silently dropped
from the generator fails rather than passing vacuously.

> **Why computed and not visual.** A visual regression baseline catches *change*; it cannot catch
> *wrong*. A focus ring with insufficient contrast on day one stays green for two years, because
> nothing changed. Correctness claims need computed assertions. This applies equally to the focus
> ring against emphasis surfaces and to the density height and target-size floors.

### 7. Computed geometry assertions

| Attribute | Value |
|-----------|-------|
| Framework | Playwright, computed style and bounding box |
| Execution | Every PR, blocking |

| Assertion | Value |
|-----------|-------|
| Control height, comfortable | 40px |
| Control height, compact | 32px |
| Interactive target, both densities | >= 24 x 24px |
| Body text, both densities | >= 14px |
| Adjacent target spacing, compact | Per F00's stated minimum |

Same reasoning as level 6: these are correctness claims, so a side-by-side story is not evidence.

### 8. Mutation testing

| Attribute | Value |
|-----------|-------|
| Tool | **Stryker Mutator** (D0015) |
| Scope | **Changed files only** - full-package mutation is too slow for the PR path |
| Threshold | **70% mutation score**, blocking |
| Execution | Every PR |

The threshold starts at 70 because it must be achievable from day one to be real; it ratchets
upward as the suite matures. A threshold chosen to be passable rather than meaningful is a known
risk of this gate and is watched for rather than treated as settled once it exists.

**The manual companion.** Before a new test is trusted, break the thing it covers on purpose and
confirm it goes red. Record it: `Mutation-checked: removing <X> turns <test> red.` A test never
observed failing is not yet a test.

### 9. Package and consumer verification

| Attribute | Value |
|-----------|-------|
| Tools | `publint`, `attw`, `api-extractor`, real consumer builds |
| Execution | Every PR, blocking |

| Check | Fails when |
|-------|-----------|
| `publint` | Any packaging error |
| `attw` | Types resolve incorrectly in any module mode |
| API report diff | The generated surface differs from the committed `.api.md` (D0016, TRD ADR-010) |
| Exports map | A `./*` wildcard is present |
| Size budgets | Any TRD Section 10 budget exceeded |
| Vite consumer app | Tarball fails to install or build |
| Next.js App Router app | Tarball fails to build, or any hydration warning appears |
| `"use client"` survival | The directive is missing from built ESM or CJS for any client component |

The tarball-into-a-real-app check is the only test that exercises what a consumer actually
receives. Everything else tests the source.

---

## Test Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Vitest + jsdom against source | Fixtures only |
| Local Storybook | Interactive inspection, a11y addon, manual passes | Story args |
| CI (GitHub Actions) | All 14 gates | Fixtures |
| Chromatic | Visual baseline storage and review | Built Storybook |
| Consumer verification | Fresh Vite and Next.js apps built from the tarball | n/a |

No staging or production environment exists. Clara is published, not deployed.

## Test Data Strategy

Clara stores and transmits no data, so there is no test data problem in the usual sense. What
exists:

- **Fixtures:** static option lists, table rows, and form values defined inline per test
- **Scale fixtures:** a 2,000-option list for Combobox virtualization; a 500-row and a 50,000-row
  table set for render benchmarks
- **Locale fixtures:** date values across locales and first-day-of-week settings for F12
- **Sensitive data:** none, ever. No fixture contains anything resembling real personal data, and
  no test makes a network call

---

## Automation Strategy

### Automated

Everything that can be. Component behaviour, axe assertions, keyboard interaction, visual
baselines, contrast, geometry, mutation, packaging, consumer builds.

### Deliberately manual

| Activity | Why it cannot be automated |
|----------|---------------------------|
| Screen reader comprehensibility | Tools verify ARIA attributes are present; only a person can judge whether the announcement makes sense |
| Keyboard operation feel | Tab order can be asserted; whether the path is sane cannot |
| Visual quality judgement | "Does this read as clear and enterprise-credible" has no assertion |
| Composition in real screens | A component can pass every isolated test and still be awkward inside a dense form. The reference application is the only test for this |

### Framework stack

| Layer | Tool |
|-------|------|
| Unit / interaction | Vitest + React Testing Library |
| Accessibility (automated) | axe-core via a local matcher (D0032) |
| Keyboard / geometry | Playwright |
| Visual regression | Chromatic |
| Mutation | Stryker |
| Package validation | publint, attw, api-extractor |
| Coverage | v8 |

---

## CI/CD Integration

### Pipeline

| Stage | Runs |
|-------|------|
| Pre-commit (local) | Lint, format, typecheck on staged files |
| **Pull request** | All 14 gates below. Every one blocks |
| Merge to main | Full suite, then Storybook and docs deploy |
| Release | Full suite + `gate.py --release` + provenance publish |

### Quality gates

Mirrors TRD Section 9. **Every gate blocks the merge** - this document defines no gate without an
enforcement point.

| # | Gate | Blocking |
|---|------|----------|
| 1 | Typecheck; no `any` in a public signature | Yes |
| 2 | Lint; token-tier and literal rules in component CSS | Yes |
| 3 | Unit + interaction tests pass | Yes |
| 4 | Statement coverage >= 90%; branch coverage >= 85% | Yes |
| 5 | axe: zero serious or critical violations | Yes |
| 6 | Keyboard interaction suite, including focus-identity assertions | Yes |
| 7 | Visual regression: no unreviewed diffs | Yes |
| 8 | Token contrast, both themes, row count matched | Yes |
| 9 | Computed geometry: heights, target size, type floors | Yes |
| 10 | Mutation score >= 70% on changed files | Yes |
| 11 | API report diff clean | Yes |
| 12 | `publint`, `attw`, no exports wildcard | Yes |
| 13 | Size budgets | Yes |
| 14 | Consumer verification: Vite + Next.js builds, no hydration warnings | Yes |

Plus: changeset present on any `packages/` change, and `pnpm audit` clean of high/critical CVEs.

### Time budget

| Suite | Budget | Where |
|-------|--------|-------|
| Unit + interaction + axe | **Under 3 minutes** | Local and CI |
| Keyboard, geometry, visual, mutation, consumer verification | CI only | CI |

**When the budget is exceeded**, the rule is: move the slowest suite to CI-only before weakening
any assertion. Coverage and mutation thresholds are never lowered to make the clock. A suite slow
enough to stop being run locally has already failed.

---

## Definition of Done (per component)

A component may not be exported until **all** of the following exist. This supersedes PRD Section 4
rule 3, which omitted the manual keyboard pass.

- [ ] Stories covering default, every variant, every size, disabled, loading, error, and empty
- [ ] Unit and interaction tests using accessible queries
- [ ] An axe assertion covering the default and error states
- [ ] A visual baseline in both themes and both densities
- [ ] A documented keyboard interaction table
- [ ] **A recorded manual keyboard pass**
- [ ] **A recorded VoiceOver pass** (interactive components), with the announced strings captured
- [ ] Focus-identity assertions (overlays)
- [ ] A docs page with usage, props, keyboard, and accessibility notes
- [ ] Mutation score at or above threshold on the changed surface

---

## Defect Management

| Severity | Definition | Response |
|----------|-----------|----------|
| **Critical** | Accessibility barrier, or a defect present in a published release affecting consumers | Patch release immediately. Releases are immutable, so the only route is forward |
| **High** | Component unusable in a documented case; visual regression shipped | Fix before the next release |
| **Medium** | Impaired with a workaround; a documented edge case fails | Next release |
| **Low** | Cosmetic, or an undocumented edge case | Backlog |

**Verification depth for a bug fix:** at minimum **functional** - a test exercising the original
failing path, observed failing before the fix. A smoke check that the component still renders is
never evidence of a fix. Accessibility fixes additionally require a manual pass with the assistive
technology that surfaced the defect.

Every fixed bug gets a regression test that was observed failing against the unfixed code.

---

## Roles

One maintainer, four review seats. The seats are lenses, and the independence gate is enforced by
separate agent instances.

| Seat | Owns |
|------|------|
| Mira Calderon (qa) | This strategy, verification depth, the definition of done, accessibility **verification** |
| Idris Vale (ux) | Inclusive design **decisions** - what gets verified, and the geometry and contrast floors |
| Anton Reis (engineering) | Package and API surface gates |
| Rhea Okonjo (product) | Whether a gate's cost is worth its catch |

Accessibility is split between the QA and UX seats deliberately. **Neither may assume the other
covered it.**

---

## Test Organisation

```text
packages/react/src/components/<Name>/
  index.tsx
  styles.module.css
  <Name>.test.tsx          unit + interaction + axe
  <Name>.stories.tsx       Storybook, feeds Chromatic
  <Name>.keyboard.spec.ts  Playwright keyboard + focus identity
  verification.md          recorded manual passes
packages/tokens/test/
  contrast.test.ts         iterates tokens.pairings.json
  tiers.test.ts            tier reference rules
e2e/
  geometry.spec.ts         computed heights, target sizes, type floors
  scoping.spec.ts          portal theme/density inheritance
apps/verify-vite/          consumer verification target
apps/verify-next/          consumer verification target
```

Tests live beside the component. A component directory shows at a glance whether it is finished.

---

## Known Gaps

Recorded so they are not mistaken for coverage. This section is the honest counterpart to the gate
table.

| Gap | Status | Revisit when |
|-----|--------|--------------|
| **NVDA verification not performed** | Accepted. macOS-only maintainer; NVDA is Windows-only. Recorded in the public accessibility statement | A Windows environment is available, or a consumer requires it |
| **Forced-colors mode (Windows High Contrast) untested** | Accepted for v1. A token-driven system can lose status colors and `box-shadow` focus rings there. Recorded as a known limitation in the accessibility statement | A Windows-heavy consumer appears, or before any formal conformance claim |
| JAWS untested | Accepted. Out of scope at this scale | Not planned |
| Real-screen composition | Only the reference application tests this, and it does not exist yet | Reference application is built |
| Mutation threshold may be set to be passable | Watched, not solved | Ratchet as the suite matures |

---

## Related Specifications

- [Product Requirements Document](prd.md)
- [Technical Requirements Document](trd.md)
- [Decisions log](decisions.md)
- [Team consultation review](reviews/prd-team-consult-2026-08-21.md)

## Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-08-21 | 0.1.0 | Initial TSD. Replaces the standard test pyramid with a per-component verification matrix appropriate to a library. Adds branch coverage and a blocking mutation gate, fixing the inversion where the hard number sat on the weakest metric. Adds the manual keyboard pass to the definition of done. Makes focus placement an explicit identity assertion per overlay per dismissal route. Replaces visual-baseline verification with computed assertions wherever the claim is correctness rather than change. Bounds manual accessibility scope, and records NVDA and forced-colors as stated known gaps rather than implied coverage. Closes the visual regression tooling open question. |
