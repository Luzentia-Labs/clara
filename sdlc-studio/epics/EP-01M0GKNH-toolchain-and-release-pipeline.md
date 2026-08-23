# EP-01M0GKNH: Toolchain and release pipeline

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full

## Summary

Establish the buildable and testable scaffold: pnpm workspaces, Vite library builds, dual ESM/CJS publishing with a closed exports map, the 14-gate CI pipeline, Changesets, and the server/client boundary rules. This epic produces no user-visible component. It produces the machinery every later epic depends on, and the green gate that makes autonomous delivery possible.

**PRD features:** F20, F21, F22, F23
**Delivery order:** 1 of 10 - no dependencies. **Build this first, by hand, to a green gate.** The sprint loop cannot run until a quality gate exists and passes.
**Depends on:** None

## Inherited Constraints

> See PRD and TRD for full constraint details. Key constraints for this epic:

| Source | Type | Constraint | Impact |
| --- | --- | --- | --- |
| PRD | Performance | Size budgets are per-component for JavaScript; CSS is one fixed sheet ceiling | Budgets generated per client component (D0048/D0053) |
| PRD | Security | The library reads no environment variables; `NPM_TOKEN` is the only publish secret | Publish is main-only with provenance; no secret is committed |
| TRD | Architecture | Layered token-first monorepo; react depends on icons depends on tokens | Dual ESM/CJS with a closed exports map, cascade layers, per-boundary chunks |
| TRD | Tech Stack | Node 20.19 floor; Vite library mode; pnpm workspaces | Four tools pinned below their latest because their latest raised the Node floor (D0033, D0039) |

## Business Context

### Problem Statement

Clara had specifications and no toolchain. Nothing could be built, tested, measured or published,
so every claim about quality was an assertion about intent.

This epic builds the machinery that makes later claims checkable: a build that emits what the
exports map promises, gates that fail for the right reason, and a publish path that cannot quietly
skip one.

**PRD Reference:** PRD F20 (package and consumer verification), F21 (semver), F23 (SSR and RSC)

### Value Proposition

Every later epic inherits a green gate. A component story can be about the component, because the
build, the boundary, the budgets and the publish path are already settled and enforced.

The counterfactual is what makes this worth 12 stories: three adversarial review rounds found two
Criticals that every gate had reported green. Without the machinery, those ship.

### Success Metrics

| Metric | Current | Target | Measurement |
| --- | --- | --- | --- |
| Deterministic guards | 0 | >= 15 | `pnpm check` |
| Guard mutations proven killable | 0 | every guard | `prove-guards-fail.mjs` |
| CI gates enumerated and blocking | 0 | every TRD Section 9 gate | `check-ci-gates.mjs` |
| Consumer verification | none | Vite + Next App Router from the tarball | `verify-consumers.mjs` |

## Scope

### In Scope

- pnpm workspace with `packages/{tokens,icons,react}` and `apps/{storybook,docs,reference-app,verify-vite,verify-next}`
- Vite library-mode builds emitting ESM + CJS + declarations for all three packages (TRD ADR-007)
- Closed `exports` maps with no `./*` wildcard; `publint` and `attw` clean
- The 14 blocking CI gates defined in TRD Section 9 / TSD
- Vitest + RTL + axe, Playwright, Stryker, size-limit, api-extractor wired and running
- Changesets, semver policy, deprecation policy, automated publish with provenance
- `"use client"` classification list and the directive-survival check
- Consumer verification apps that build from the published tarball

### Out of Scope

- Any component implementation
- Token values (EP EP-01M0GKNG)
- Docs site content (EP EP-01M0GKM4)

## Acceptance Criteria (Epic Level)

- [ ] `pnpm -r build` produces publishable artifacts for all three packages
- [ ] All 14 CI gates exist, run on every PR, and **block the merge**. A gate that reports without blocking does not count
- [ ] `publint` and `attw` pass with zero errors; no `./*` wildcard in any exports map
- [ ] A CI check fails the build if a component CSS file references a tier 1 token or a raw literal
- [ ] The API report (`api-extractor`) is committed per package and CI fails on an uncommitted surface change
- [ ] The built CSS declares `@layer clara.reset, clara.tokens, clara.components;` before any rule
- [ ] A test in the Next.js verification app asserts a consumer class overrides a component style without `!important`
- [ ] The published tarball installs and builds in a fresh Vite app and a fresh Next.js App Router app, with no hydration warnings
- [ ] The `"use client"` directive survives bundling in both ESM and CJS output for every client component
- [ ] The gate is green on an empty component set, so later epics inherit a working pipeline

## Dependencies

### Blocked By

| Dependency | Type | Status | Owner |
| --- | --- | --- | --- |
| Node 20.19 LTS | Runtime floor | Met | - |
| npm registry (`@luzentialabs`) | Publish target | Reachable; `NPM_TOKEN` not yet set | operator |

### Blocking

| Item | Type | Impact |
| --- | --- | --- |
| None remaining | - | All 12 stories Done |

## Risks & Assumptions

### Assumptions

- Consumers install from npm with a package manager that honours `exports`; the closed map assumes it
- The Node floor stays at 20.19 for v1.x, which is what forces four tools to be pinned below their latest
- Publishing is one-way: a name in the published surface is permanent, so the surface stays deliberately small

### Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A guard passes without checking anything | Observed, repeatedly | Critical - a green gate hides a real defect | Every guard carries a mutation proving it can fail, plus explicit vacuity floors |
| A hand-rolled parser is defeated by ordinary input | Observed, nine times | High | TypeScript and `yaml` are dependencies; no new hand-rolled parsers |
| A rename silently disables a guard keyed on a name prefix | Observed, three at once | High | Guards consult manifests and declared roles, not name shapes |
| The publish path skips a gate CI runs | Observed, three times | Critical - a release cannot be withdrawn | `check-release` compares the two command sets exactly |

## Technical Considerations

### Architecture Impact

Sets the shape every later epic inherits, and most of it is one-way. The cascade layer contract, the
closed exports map, the tier boundary, and the client/server chunk topology are all reachable from
the published surface, so each is a breaking change after the first publish rather than a
refactor - which is why they were settled here rather than during component work.

### Integration Points

npm (publish, with provenance via OIDC), GitHub Actions (CI and release), and the consumer surface
itself - a Vite app and a Next.js App Router app that install the published tarball from outside
this workspace, because inside it pnpm links the packages and the test proves nothing.

## Sizing

**Size:** XL

_A T-shirt size (S / M / L / XL) - the epic's own coarse estimate, made before decomposition. An epic is never sized in story points; STORY points belong on stories._

**Estimated Story Count:** not recorded

**Derived Point Total:** 58

_DERIVED, not estimated: the sum of this epic's stories' points. `reconcile` recomputes it, so it can never drift from the stories beneath it - do not hand-edit it._

**Complexity Factors:**

- not recorded

## Story Breakdown

- [x] [US-01M0GMPJ: pnpm workspace and repository scaffold](../stories/US-01M0GMPJ-pnpm-workspace-and-repository-scaffold.md)
- [x] [US-01M0GM9N: Package builds: Vite library mode and the tokens pipeline](../stories/US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md)
- [x] [US-01M0GMFB: Dual publishing with a closed exports map](../stories/US-01M0GMFB-dual-publishing-with-a-closed-exports-map.md)
- [x] [US-01M0GM16: Cascade layers and the consumer override guarantee](../stories/US-01M0GM16-cascade-layers-and-the-consumer-override-guarantee.md)
- [x] [US-01M0GMKD: CI pipeline: the fourteen blocking gates](../stories/US-01M0GMKD-ci-pipeline-the-fourteen-blocking-gates.md)
- [x] [US-01M0GM3X: Test harness: Vitest, RTL, axe, Playwright, Stryker, size-limit](../stories/US-01M0GM3X-test-harness-vitest-rtl-axe-playwright-stryker-size.md)
- [x] [US-01M0GMYH: API surface report gate](../stories/US-01M0GMYH-api-surface-report-gate.md)
- [x] [US-01M0GMWF: Changesets, semver policy, and automated publish](../stories/US-01M0GMWF-changesets-semver-policy-and-automated-publish.md)
- [x] [US-01M0GM0R: Server and client boundary classification](../stories/US-01M0GM0R-server-and-client-boundary-classification.md)
- [x] [US-01M0GMDV: Consumer verification apps](../stories/US-01M0GMDV-consumer-verification-apps.md)
- [x] [US-01M0MQYN: Manual chunks so the use client directive survives bundling](../stories/US-01M0MQYN-manual-chunks-so-the-use-client-directive-survives.md)
- [x] [US-01M0NJZN: One chunk per client component so budgets are real](../stories/US-01M0NJZN-one-chunk-per-client-component-so-budgets-are.md)

## Test Plan

**Test Spec:** [TSnot recorded: not recorded](../test-specs/TSnot recorded-not recorded.md)

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Risks

- The CI gate list is long and could take longer to build than expected; the mitigation is that every gate is cheap individually and the alternative is defining gates with no enforcement point, which is the defect this epic exists to prevent
- Vite library mode with multi-entry CSS Modules is the least-proven part of the stack; a spike on one trivial component de-risks it before the full build is wired

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
