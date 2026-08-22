# US-01M0MQYN: Manual chunks so the use client directive survives bundling

> **Status:** Draft
> **Template:** full
> **Created:** 2026-08-22
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** packages/react/vite.config.ts, packages/react/src, packages/react/client-boundary.json, scripts/lib/chunk-plan.mjs, scripts/lib/directive.mjs, scripts/lib/exports-read.mjs, scripts/lib/finalize-dual.mjs, scripts/check-client-boundary.mjs, scripts/check-bundled-peers.mjs, scripts/prove-guards-fail.mjs, scripts/prove-coverage-gate.mjs, test/setup.ts
> **Epic:** EP-01M0GKNH
> **Points:** 8
> **Persona:** Sofia Marchetti

## User Story

**As a** Sofia Marchetti
**I want** Clara's client components to arrive marked and its server-capable ones unmarked
**So that** my App Router pages render on the server and I am not forced to wrap everything in a client boundary

## Context

### Persona Reference

**Sofia Marchetti** - ships Clara in three applications, one of them on Next.js App Router.
[Full persona details](../personas/sofia-marchetti.md)

### Background

Vite's library build drops module-level directives and Rollup downgrades it to a warning, so
nothing fails today. A single bundled chunk has one top, and TRD Section 7 requires the directive
on client components AND absent from server-capable ones - so the current output shape cannot
express the classification at all.

D0041 resolved this to manual chunks. The decisive property is the direction of control:
`client-boundary.json` is the INPUT to the build, not a description of it. The list and the shipped
output cannot disagree, because the list is what cuts the chunks.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| TRD Section 7 | Boundary | Client components carry the directive; server-capable ones carry NONE | AC1 - both halves checked |
| PRD F23 | Boundary | The directive survives in BOTH ESM and CJS | AC1 |
| D0041 | Architecture | Option A: manual chunks driven by the classification | AC2 |
| D0006 | Delivery | Exports map is closed, no wildcard; one stylesheet per package | AC4 - chunks are internal, not new subpaths |
| BG-01M0MFMZ history | Integrity | The bundle record binds record to bytes by sha256 | AC5 - only the directive stamp is forgiven, nothing else |
| AGENTS.md | Publishing | A renamed export or reachable path is permanent | AC4 |

## Acceptance Criteria

- **AC1:** ### AC1: The directive survives, on the client chunk only

- **Given** a fixture client component and a fixture server component built through the real config
- **When** I read the emitted chunks in both formats
- **Then** `"use client"` is the first statement of the client chunk in ESM and CJS, and appears in neither the server chunk nor the entry
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC2: The classification is the build's input

- **Given** client-boundary.json
- **When** a component is listed client-only
- **Then** it is cut into the client chunk, and a component emitted into the wrong chunk fails the build
- **Verify:** shell npx vitest run scripts/lib/__tests__/chunk-plan.test.ts scripts/lib/__tests__/directive.test.ts scripts/lib/__tests__/exports-read.test.ts
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC3: CJS intra-chunk requires resolve after the rename

- **Given** the CJS pass, whose files finalize-dual renames .js -> .cjs
- **When** index.cjs requires the client chunk
- **Then** the specifier names the .cjs file that exists, and requiring the built entry from Node succeeds
- **Verify:** shell node -e "require('./packages/react/dist/index.cjs')"
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC4: The exports map stays closed

- **Given** multiple files now in dist
- **When** a consumer tries to reach a chunk directly
- **Then** no new public subpath exists - the map still names only '.', './styles.css' and './package.json'
- **Verify:** shell node scripts/check-exports.mjs
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

### AC5: The guard layer holds under the new output shape

- **Given** the chunked build
- **When** the full gate set runs
- **Then** pnpm check passes, every chunk is hash-matched in the bundle record, and the mutation that strips the directive is killed
- **Verify:** shell pnpm check
- **Verified:** yes (2026-08-22)
- **Verification target:** functional

## Scope

### In Scope

- Cutting the build into a client chunk and a server chunk from `client-boundary.json`
- Stamping `"use client"` on the client chunk, in both formats, and nowhere else
- Making the boundary guard check all three places: client chunk, server chunk, entry
- Two fixture components (`Box`, `Button`) so the mechanism is provable rather than vacuous

### Out of Scope

- Real component work - `Box` and `Button` are fixtures; F01 replaces them
- The Next.js consumer app (US-01M0GMDV)
- The tier 2 semantic token rename (CR-01M0J0Z6, lands with US-01M0GMAE)

## Technical Notes

**Test-first.** `chunk-plan` and `directive` were both written as failing tests before the
implementation, because both are pure and their edge cases are the whole risk.

**Two things surfaced that the CR did not anticipate.**

The CR named `finalize-dual`'s `.js` -> `.cjs` rename as the interaction to watch, and it was
real - but the deeper problem was upstream. Sharing one `output` block gave both format passes the
same `chunkFileNames`, so the CJS pass silently overwrote the ESM chunks and `dist/index.js`
imported a file full of `require()` calls. Both formats loaded fine in isolation during the build;
only reading the emitted bytes caught it. Each format now names its chunks by its own extension,
which also makes the rename step a no-op rather than a dependency.

Second, bundling the declarations became mandatory rather than cosmetic. Without `bundleTypes` the
entry `.d.ts` re-exports `./components/Box/Box` with no extension, which node16 ESM resolution
cannot follow - attw reports InternalResolutionError and gate 10 fails. It also stops a
`dist/components/` tree from shipping, which would widen the deep-import surface D0006's closed
exports map exists to prevent.

### API Contracts

No public API change beyond the two fixture components. The exports map is untouched: `.`,
`./styles.css`, `./package.json`. The chunks are internal files the entry imports - reachable by
the bundler, not by a consumer's import specifier.

### Data Requirements

`packages/react/client-boundary.json` is read at build time. It is build input, not documentation.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A component exists in `src/components` but is not classified | The BUILD fails, before anything is emitted - earlier than the exports check can catch it |
| The directive is stripped from either format | `check-client-boundary` fails; pinned by two mutations, one per format |
| A directive appears on the server chunk or the entry | Fails - marking everything client passes a naive "is it present" test and defeats the feature |
| Both format passes write the same chunk filename | Caught during implementation: the CJS pass overwrote the ESM chunks and `index.js` imported `require()` calls. Each format now names its chunks by its own extension |
| A post-build step edits the client chunk beyond the stamp | The bundle record rejects it; only a leading directive is undone before comparison |
| A client component is built but no client chunk exists | Fails - the classification drove no chunking, so the build ignored the list |

> **Minimum edge cases:** 5 - 6 recorded.

## Test Scenarios

- [ ] `componentOf` reads the component from a module path, including backslash separators
- [ ] A module belonging to no component is left unchunked, so the entry stays undirectived
- [ ] An unclassified component throws at build time
- [ ] A dependency under a `components/` path is never chunked
- [ ] The directive is idempotent and goes above a license comment, below a shebang
- [ ] CJS specifier rewriting touches relative requires only, never bare specifiers or plain strings
- [ ] Both built formats load: `require()` and `import()` both resolve
- [ ] A server render of the server component produces exact markup
- [ ] A server render of the client component reads no browser global (asserted via recording getters)
- [ ] Two renders produce identical markup, so hydration has nothing to disagree with

> **Minimum test scenarios:** 8 - 10 recorded.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GM0R](US-01M0GM0R-server-and-client-boundary-classification.md) | Unblocks | Its AC2 and AC3 were blocked on this; both now pass | Verified |
| CR-01M0MK20 | Implements | The approved change this story delivers | Approved |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| Rollup `manualChunks` / `output` array | Build | Via Vite 6; one output block per format |
| `unplugin-dts` `bundleTypes` | Types | Enabled here - extensionless re-exports failed node16 resolution |

## Estimation

**Points:** 8
**Complexity:** High. The chunking is small; the interactions are not. Four guards, the dual-build
finalizer, the type bundling and the size budgets all had to move with it.

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

**Affects production runtime:** false - nothing is published.

*Reversal is `git revert`.* Doing this BEFORE the first publish is the whole point: the output
shape is reachable from the exports map, so changing it afterwards is a breaking change, and
retrofitting after F01 would mean re-cutting every chunk.

## Open Questions

None blocking.

**Honest limits.** The directive is verified by reading the built chunks and by the guard, not by a
running Next.js App Router app - that is US-01M0GMDV, still blocked on nothing but its own scope
now that components exist. And `Box`/`Button` are deliberately minimal fixtures: they exist to
prove the pipeline, and F01 will replace them with real components against the same machinery.

## Summary

Vite's library build drops module-level directives and Rollup downgrades it to a warning, so nothing fails today. A single bundled chunk has one top, and TRD Section 7 requires the directive on client components AND absent from server-capable ones - so the current output shape cannot express the classification at all. Resolved to Option A in D0041: Rollup manualChunks reads client-boundary.json and cuts a client chunk and a server chunk; a build step prepends the directive to the client chunk only. The entry re-exports from both and carries no directive, so it stays server-capable and the boundary forms exactly where a consumer imports a client component. The decisive property is that the classification becomes load-bearing build input: the list and the shipped output cannot disagree, because the list is what cuts the chunks.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Created via `new` (deterministic) |
