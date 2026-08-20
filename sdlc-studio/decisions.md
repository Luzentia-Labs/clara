# Project Decisions Log

The canonical, append-only home for load-bearing decisions every later artifact and
delegated agent inherits - both **product** decisions (scope cuts, the answers to the
PRD's open questions) and **implementation conventions** (error-envelope shape, ID scheme,
token strategy, migration style, test harness). One record, two views: an open question
lives in `PRD §Open Questions`; when resolved it is promoted here with a back-link, never
duplicated as free text in both. This block is injected into the handoff context delegated
agents read, so a decision is referenced once, not pasted N times.

## Decisions

| ID | Decision | Rationale | Status | Supersedes | Date |
| --- | --- | --- | --- | --- | --- |
| D0001 | npm scope and package names are `@luzentialabs/clara-tokens`, `@luzentialabs/clara-icons`, `@luzentialabs/clara-react`. The CSS custom property prefix stays `--clara-`. | A company scope rather than a common-noun one. Registry search returns zero packages and zero text matches for "luzentia"; `@clara` could not be confirmed free and short common-word scopes are frequently claimed-but-empty. The scope names the publisher, the prefix names the design system. Package names are permanent once published. Promoted from PRD Open Questions. | accepted | -- | 2026-08-21 |
| D0002 | License is MIT. | Standard for design systems (Radix, Chakra, Mantine). Maximum reuse, usable in client work, no adoption friction. Promoted from PRD Open Questions. | accepted | -- | 2026-08-21 |
| D0003 | Behavioural primitive layer is Radix UI, paired with a primitive-isolation rule (PRD Section 4 rule 7). | Mature, proven, largest community; for a solo maintainer proven-and-stable beats actively-churning. The isolation rule keeps `asChild`, `onOpenChange`, and `data-state` out of Clara's public API, so the dependency stays reversible instead of becoming permanent surface. Promoted from PRD Open Questions. | accepted | -- | 2026-08-21 |
| D0004 | Clara's visual identity is decided in F00, a time-boxed foundations pass of 5 working days. Component work begins on day 6 regardless of whether the pass is satisfied. | The ux seat's documented failure mode is refining foundations indefinitely, and that seat explicitly asked to be capped rather than trusted. A deadline held by the document is the cap. F00 blocks F01 and therefore every component. Promoted from PRD Open Questions. | accepted | -- | 2026-08-21 |
| D0005 | All Clara CSS is emitted inside named cascade layers, declared `@layer clara.reset, clara.tokens, clara.components;`. | Unlayered CSS wins over layered CSS regardless of specificity, and a consuming app's stylesheets are unlayered by default, so any consumer rule beats any Clara rule with no `!important` and no specificity contest. This is what makes the Section 4 className contract true. It cannot be retrofitted: introducing layers after v1.0 would silently change the resolved styles of every consumer override already shipped. | accepted | -- | 2026-08-21 |
| D0006 | CSS delivery is one stylesheet per package, deliberately not tree-shaken. The `exports` map enumerates its subpaths and contains no `./*` wildcard. | Simple and robust across bundlers. Forced the v0.1.0 per-component CSS budget to be restated honestly as a fixed stylesheet ceiling (15KB gzipped) plus JS-only per-component budgets, because under a single-stylesheet model no component has a separable CSS cost. The delivery model and every reachable subpath live in the exports map and are permanent once published. | accepted | -- | 2026-08-21 |
| D0007 | Tier 2 (semantic) tokens are public API covered by the breaking-change rule. Tier 1 (primitive) and tier 3 (component) tokens are private and may change in a minor. | Without a declared boundary the distinction is an honour system and consumers settle it for us by overriding tier 3. Enforced mechanically via a generated `tokens.public.json`, with CI failing if the docs site or a published example references a token outside it. | accepted | -- | 2026-08-21 |
| D0008 | `as` is Clara's single polymorphism and composition idiom, used on layout primitives, Button, and overlay triggers. `asChild` is not Clara API. | v0.1.0 carried three idioms answering one question (`asChild` for overlay triggers, `as` for layout primitives, `href` for Button), which broke PRD design principle 2 - "guessable by someone who has used another Clara component" - on paper before any code existed. | accepted | -- | 2026-08-21 |

## Notes

- Decisions are numbered globally and zero-padded: `D{NNNN}`.
- Append with `scripts/decisions.py add`; list with `scripts/decisions.py list`.
- `Status`: `accepted` | `superseded` | `revisited`. A superseding decision names the one
  it replaces in `Supersedes`.
- Distinct from the sprint per-tranche ledger (`scripts/ledger.py`), which is scoped to
  a single delivery run; this is the durable project spine.
