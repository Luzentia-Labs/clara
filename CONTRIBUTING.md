# Contributing to Clara

## The one rule everything else follows from

**Publishing is a one-way door.** npm releases are immutable: a bad release is fixed forward with a
patch, never unpublished. So the question that matters before any change is not "does this work"
but "can this be taken back". Usually it cannot.

## What counts as breaking

A change is **major** if it could make a consuming application fail to build, fail to type-check, or
render differently in a way the consumer did not ask for. Concretely:

| Change | Version |
| --- | --- |
| Removing or renaming an exported name | **major** |
| Removing or renaming a component prop | **major** |
| Narrowing a prop's accepted type | **major** |
| Removing or renaming a **tier 2** token | **major** - tier 2 is the theming API (PRD F01) |
| Removing a subpath from an `exports` map | **major** |
| Changing a documented default | **major** |
| Changing a documented behaviour, including keyboard interaction | **major** |
| Adding a required prop | **major** |
| **Changing a tier 2 token's VALUE** | **minor**, batched, with a visual changelog entry (D0021) |
| Adding an exported name, prop, or tier 2 token | minor |
| Widening a prop's accepted type | minor |
| Changing a **tier 1** or **tier 3** token | minor - both are private (PRD:224) |
| Bug fix with no surface change | patch |

Two of these are counter-intuitive and are decided deliberately:

- **A tier 2 value change is a minor, not a major.** Literally it alters every consuming app's
  appearance at once, which argues for major - but requiring a major for every neutral-ramp tweak
  makes the system unusable, and no real design system does it. Batching plus a visual changelog
  gives consumers the warning they need without freezing the palette (D0021).
- **A value change that breaks a documented contrast pairing is a bug, not a release.** It is fixed,
  not versioned.

**The version is decided by what changed, never by delivery pressure.** "Nobody is using it yet" is
not a reason to ship a breaking change as a minor - it is a reason it will be discovered late.

## Deprecation

Anything being removed is deprecated for **one minor release** before the major that removes it. A
deprecation carries: a `@deprecated` JSDoc tag naming the replacement, a runtime warning in
development only, and a changelog entry. Nothing is removed that was never deprecated.

## v1.0 entry criteria (D0025)

1.0 is not a date. It is reached when **all three** hold:

1. Every must-have feature row in the PRD is Complete.
2. The reference application is built on the **published** package, not the workspace.
3. The API surface report is **stable across two consecutive releases with no change**.

The third is the real test: it is what proves the surface has settled, which is the entire meaning
of 1.0 for a library.

**1.x support window:** six months after 2.0 ships, critical and security fixes only. Stated because
a team running three applications needs to know where they stand before they upgrade.

## Changesets

Every change to `packages/**` carries a changeset. `pnpm changeset` writes it; CI fails without one.

The changeset text is read by consumers deciding whether to upgrade, so write it for them - what
changed and what they must do, not what the commit did.

## Before you open a PR

`pnpm check` runs the deterministic guards. CI runs the full gate set - see `ci-gates.json`, which
enumerates every TRD Section 9 gate: the ones that run today, and the ones still pending with the open
story that lands each (D0038).

Review is independent of the author. Whoever wrote a change never records its sign-off.
