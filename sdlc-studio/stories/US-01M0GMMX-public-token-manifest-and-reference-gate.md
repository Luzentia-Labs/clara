# US-01M0GMMX: Public token manifest and reference gate

> **Status:** Done
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Template:** full
> **Epic:** EP-01M0GKNG
> **Serves:** Sofia Marchetti
> **Affects:** apps/docs/src/content/foundations/tokens.md, packages/tokens/dist/tokens.public.json, scripts/check-public-tokens.mjs
> **Points:** 2

## User Story

**As a** Sofia Marchetti
**I want** a generated manifest of exactly the public tier 2 set
**So that** the public/private boundary is machine-checkable rather than an honour system

## Context

### Persona Reference

**Sofia Marchetti** - builds against Clara and needs to know which tokens she can rely on.
[Full persona details](../personas/sofia-marchetti.md)

### Background

D0007 makes tier 2 public and tiers 1 and 3 private. That distinction is an honour system until
something checks it - and what breaks it is not malice, it is a docs example reaching for a
primitive because it happened to be the right grey. Once that ships in a copyable example,
consumers depend on it, and a private token becomes public by accident.

## Inherited Constraints

> See Epic for full constraint chain. Key constraints for this story:

| Source | Type | Constraint | AC Implication |
| --- | --- | --- | --- |
| D0007 | Visibility | Tier 2 public; tiers 1 and 3 may change in a minor | AC1, AC3 |
| TRD Section 9 gate 8 | CI | Docs and examples reference only `tokens.public.json` | AC2 |
| PRD F01 | Manifest | The manifest is exactly the tier 2 set | AC1 |

## Acceptance Criteria

### AC1: Manifest is generated

- **Given** the build
- **When** it completes
- **Then** `tokens.public.json` contains exactly the tier 2 set and nothing else
- **Verify:** shell node scripts/check-token-output.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC2: Docs are policed

- **Given** the docs site or a published example
- **When** it references a token outside the manifest
- **Then** CI fails
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

### AC3: Private tokens are documented as private

- **Given** the docs
- **When** a reader looks for tier 1 or tier 3
- **Then** they are documented as unsupported and changeable in a minor (D0007)
- **Verify:** shell node scripts/check-public-tokens.mjs
- **Verified:** yes (2026-08-23)
- **Verification target:** functional

> **Verification target tiers:** `functional` | `conversational` | `soak` | `live` - see `reference-test-best-practices.md#verification-depth-tiers`. The `- **Mutation-checked:**` and `- **Verified:**` lines arrive with promotion: they record work only implementation can do.

## Scope

### In Scope

- Public token manifest and reference gate

### Out of Scope

- Anything outside this component's own surface
- Documentation page content (owned by the documentation epic)

## Technical Notes

**Test-after.** No keyboard interaction table, so tests follow the implementation (D0024).

**Points:** 2 (modified Fibonacci; nothing here exceeds 8, the split threshold).

**Inherited constraints.** Publishing is a one-way door - anything reaching the public surface is permanent (D0001-D0008). Every CI gate blocks the merge; a gate that reports without blocking is not a gate. Load-bearing decisions are recorded via `decisions.py add`, never left in a commit message.

**Definition of done.** Tests covering the behaviour in the acceptance criteria above, the relevant CI gate wired and blocking, and any load-bearing decision recorded in `sdlc-studio/decisions.md`.

## Edge Cases & Error Handling

| Scenario | Expected Behaviour |
| --- | --- |
| A doc references a tier 1 primitive | Fails, naming the tier it actually belongs to |
| A doc references a token that does not exist | Fails - a typo is not a private token, and the message says so |
| The docs contain no token reference at all | Fails - a scan that matches nothing has verified nothing |
| The manifest and the tier manifest disagree | Fails - two sources disagreeing about what is public means neither can be trusted |
| The docs must NAME a private token to explain it | Written without the `--clara-` prefix, so it cannot be copy-pasted - the gate does not exempt itself |

> **Minimum edge cases:** 5 - 5 recorded.

## Test Scenarios

- [ ] A tier 1 reference in the docs fails the gate
- [ ] An unknown token reference fails the gate
- [ ] Docs with no token reference fail the gate
- [ ] A disagreement between the two manifests fails the gate
- [ ] The shipped docs pass, over a non-zero number of references

> **Minimum test scenarios:** 5 - recorded above.

## Dependencies

### Story Dependencies

| Story | Type | What's Needed | Status |
| --- | --- | --- | --- |
| [US-01M0GMAE](US-01M0GMAE-semantic-token-layer.md) | Blocked by (resolved) | The tier 2 tokens | Done |

### External Dependencies

| Dependency | Type | Status |
| --- | --- | --- |
| `build/tier-manifest.json` | Tier lookup | Emitted by the token build |
| US-01M0GMAE | Blocked by (resolved) | The tier 2 set the manifest describes | Done |

## Estimation

**Points:** 2
**Complexity:** Low. One scan and two floors; the care is in the floors.

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

**Affects production runtime:** false - the docs app is private and unpublished.

*Reversal is `git revert`.*

## Open Questions

None.

**Honest limit:** the gate scans the docs app, `design/`, and the two root markdown files. A token
referenced from somewhere else - a blog post, a Storybook story that does not exist yet - is
outside it. The scanned list is explicit in the script rather than implied by a glob, so widening
it is a visible change.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
