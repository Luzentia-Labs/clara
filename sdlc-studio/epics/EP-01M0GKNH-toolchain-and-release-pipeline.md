# EP-01M0GKNH: Toolchain and release pipeline

> **Status:** Draft
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** planning

## Summary

Establish the buildable and testable scaffold: pnpm workspaces, Vite library builds, dual ESM/CJS publishing with a closed exports map, the 14-gate CI pipeline, Changesets, and the server/client boundary rules. This epic produces no user-visible component. It produces the machinery every later epic depends on, and the green gate that makes autonomous delivery possible.

**PRD features:** F20, F21, F22, F23
**Delivery order:** 1 of 10 - no dependencies. **Build this first, by hand, to a green gate.** The sprint loop cannot run until a quality gate exists and passes.
**Depends on:** None

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

## Risks

- The CI gate list is long and could take longer to build than expected; the mitigation is that every gate is cheap individually and the alternative is defining gates with no enforcement point, which is the defect this epic exists to prevent
- Vite library mode with multi-entry CSS Modules is the least-proven part of the stack; a spike on one trivial component de-risks it before the full build is wired

## Open Questions

_None open. Every PRD open question is closed (D0001-D0016) or promoted to F31._

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Created from PRD v0.3.0 |
