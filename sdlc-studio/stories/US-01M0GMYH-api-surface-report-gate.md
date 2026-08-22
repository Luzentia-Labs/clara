# US-01M0GMYH: API surface report gate

> **Status:** Review
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNH
> **Serves:** Sofia Marchetti
> **Affects:** ./api-extractor.json, packages/*/etc/*.api.md, packages/react/etc/clara-react.api.md
> **Points:** 3

## User Story

**As a** Sofia Marchetti
**I want** a committed API surface report per package that CI diffs
**So that** an accidental public API change is caught in review rather than by a consumer on install

## Context

### Persona Reference

**Sofia Marchetti** - upgrades Clara across three applications and needs to know when a signature moved.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Publishing is a one-way door. A committed `.api.md` makes the door visible: CI regenerates the
report and fails on any diff, so no public signature changes without the change appearing in review.

It also enforces D0003 - no Radix type may reach the public surface. `asChild`, `onOpenChange` and
`data-state` are never Clara API, and a leaked Radix TYPE drags its whole idiom into the contract
permanently.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0001-D0008 | Permanence | Everything public is permanent | AC1/AC2 - the report is the record of what was promised |
| D0003 / ADR-004 | Encapsulation | Radix must not leak | AC3 |
| TRD S9 gate 11 | CI | API report diff clean, blocking | AC2 |
| AGENTS.md | Types | No `any` in a public API; literal unions over bare `string` | The report makes both visible in review |
| PRD | Security | No runtime env or network | Build-time analysis only |

## Acceptance Criteria

### AC1: Report is generated and committed

- **Given** each package
- **When** I run the API extractor
- **Then** a `.api.md` is produced and committed
- **Verify:** file packages/react/etc/clara-react.api.md
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: An uncommitted change fails CI

- **Given** a changed public signature
- **When** CI regenerates the report
- **Then** the build fails on the diff
- **Verify:** shell pnpm api:check
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: Radix does not leak

- **Given** the generated report
- **When** I search it
- **Then** no type imported from `@radix-ui/*` appears (D0003, TRD ADR-004)
- **Verify:** shell node scripts/api-report.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- API surface report gate

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 3 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A public signature changes and the report is not regenerated | CI fails on the diff. This is the gate. |
| A Radix type is re-exported, even as a type alias | Fails - a type leak is as permanent as a value leak |
| A new package is added with no `api-extractor.json` | Fails - an unreported public surface is worse than a reported one |
| The report is regenerated but not committed | Fails in CI, where the working tree is clean |
| A package is built stale and the report reflects old types | Fails - the gate requires `dist/index.d.ts` to exist and be current |
| An export is REMOVED | Also a diff, and also breaking - the gate does not care about direction |

> **Minimum edge cases:** 8 for API stories, 5 for others - 6 recorded.

## Test Scenarios

- [ ] A committed `.api.md` exists for every published package
- [ ] Adding a public export fails the gate until the report is regenerated
- [ ] Removing a public export fails it too
- [ ] A Radix type in the surface fails, with the offending line named
- [ ] A package with no api-extractor.json fails
- [ ] The gate is in `pnpm check`
- [ ] `pnpm api:update` regenerates and the gate then passes
- [ ] The report shows the surface a consumer actually sees, not the source

> **Minimum test scenarios:** 10 for API stories - 8 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM9N](US-01M0GM9N-package-builds-vite-library-mode-and-the-tokens.md) | Blocks (satisfied) | `dist/index.d.ts` to analyse | Review |
| [US-01M0GMKD](US-01M0GMKD-ci-pipeline-the-fourteen-blocking-gates.md) | Follows | Wires this as blocking gate 11 | Draft |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `@microsoft/api-extractor` 7.59 | Build-time analysis | Added. Justified: type extraction is harder than the four parsing tasks this project has already hand-rolled and got wrong |

## Estimation

**Points:** 3
**Complexity:** Low - one config per package and a driver script. The value is entirely in it
existing before the surface grows.

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

**Affects production runtime:** false - a build-time report, no shipped code.

*Reversal is `git revert`.* The reports themselves are the thing worth keeping.

## Open Questions

None blocking. One finding the report surfaced, recorded for US-01M0GMMX: **`clara-tokens` exports
all 13 tier 1 primitives as named JS exports** (`BorderThin`, `Space1`, ...). Tier 1 is documented as
private and changeable in a minor (PRD:224), but the JS entry has no lock equivalent to
`tokens.public.lock.json`. Round 7 raised this as informational; the report now makes it visible on
every run, which is the point.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Delivered in RUN-01M0MFXJ. api-extractor wired per package, reports committed, `check:api` is the 14th guard. Proven to fail on an unreported signature change AND on a Radix type leak. |
