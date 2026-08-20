# Clara

A design system and React component library for enterprise web applications.

*Clara* means clear. Clarity is the product requirement, not the aesthetic. Every decision is
judged against whether it makes an interface easier to read, easier to predict, and faster to act
on when someone is doing the same task for the two-hundredth time that day.

> ## Status: specifications only
>
> **There is no code in this repository yet.** No packages are published, nothing is installable,
> and there is no build or test command to run. What exists is the specification work that comes
> before the first line: a product requirements document, four working review seats, and a recorded
> set of architectural decisions.
>
> This notice will be wrong at some point. Until it is, take it literally.

## Why

Building enterprise web applications repeatedly means rebuilding the same twenty-five components
each time, and getting them slightly wrong each time. The existing options each carry a cost:
Material UI brings a strong consumer-grade opinion and a heavy runtime styling engine; Ant Design
is dense but visually dated and shallow to customize; Chakra and Mantine target consumer apps and
are weak on data-heavy screens; shadcn/ui is an excellent starting point but a copy-paste one, so
every project drifts independently.

The gap Clara targets: dense enough for real ERP screens, calm enough to look at for eight hours,
accessible without extra work, and versioned once so it can be reused across projects.

## Design principles

These are the tie-breakers. When two options are defensible, the one serving the higher principle
wins.

1. **Clarity over decoration.** No shadow, gradient, or animation exists unless it communicates
   state, hierarchy, or causality.
2. **Predictable over clever.** The same interaction produces the same result everywhere.
3. **Density without noise.** Density comes from removing chrome, never from shrinking type below
   legibility or crowding targets.
4. **Accessible by default, not by option.** There is no `accessible` prop.
5. **Composable, not endlessly configurable.** A small component that composes beats one with
   thirty props.
6. **Themeable only at the token layer.** Consumers change the look by overriding tokens, never by
   overriding component internals.
7. **Quiet by default.** Color is reserved for meaning.

## Planned architecture

Layered and token-first. Each layer depends only on the one below it.

```
  Consuming applications
            |
  @luzentialabs/clara-react     components, CSS Modules, TypeScript types
            |
  @luzentialabs/clara-icons     SVG icon set as React components
            |
  @luzentialabs/clara-tokens    design tokens as CSS variables, TS constants, JSON
            |
  tokens/*.json                 the single source of truth for the visual language
```

An application can adopt the tokens alone and style its own markup without ever installing the
React components.

## Decisions made so far

Recorded in full, with reasoning, in [`sdlc-studio/decisions.md`](sdlc-studio/decisions.md).

| # | Decision |
|---|----------|
| D0001 | npm scope `@luzentialabs/clara-*`. CSS custom property prefix stays `--clara-` |
| D0002 | MIT license |
| D0003 | Radix UI as the behavioral primitive layer, with a rule that no Radix API leaks into Clara's public surface |
| D0004 | Visual identity decided in a time-boxed 5-day foundations pass; component work starts on day 6 regardless |
| D0005 | All CSS emitted inside `@layer clara.reset, clara.tokens, clara.components;` |
| D0006 | One stylesheet per package, deliberately not tree-shaken; closed `exports` map |
| D0007 | Tier 2 (semantic) tokens are public API; tier 1 and tier 3 are private |
| D0008 | `as` is the single polymorphism idiom; `asChild` is not Clara API |

Several of these exist because publishing to npm is a one-way door. A renamed prop or token breaks
consumers already shipped, and a published version cannot be recalled. The decisions that are
expensive-or-impossible to reverse were made first, on purpose.

## Scope

**v1.0** targets tokens, theming, density, typography, icons, layout primitives, and eleven component
families (F06-F16) covering layout, forms, overlays, feedback, data display, and navigation. Accessibility target is
WCAG 2.2 AA, held as a genuine internal bar.

**Deferred to v1.1:** advanced DataGrid, application shell, Figma library. Deferred because
building them before a real application defines their requirements produces the wrong version of
each.

## Repository layout

```
sdlc-studio/
  prd.md                 product requirements
  decisions.md           the decision log
  personas/seats/        four working review seats
  reviews/               specification review records
  epics/ stories/ ...    backlog (empty)
AGENTS.md                how to work in this repo (agents read this first)
```

This project is developed specification-first. The PRD is reviewed by four independent review
seats (product, engineering, QA, UX) before work proceeds; the most recent review is in
`sdlc-studio/reviews/`.

## Contributing

Not yet open to contributions. The specification is still moving and the toolchain does not exist.

## License

MIT. See [LICENSE](LICENSE).
