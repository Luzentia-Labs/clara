# Product Requirements Document

**Project:** Clara Design System
**Version:** 0.2.0
**Last Updated:** 2026-08-21
**Status:** Draft (Tier 1 review conditions applied)

---

## 1. Project Overview

### Product Name

Clara - a design system and React component library for enterprise web applications.

### Purpose

Clara is a reusable design system distributed as npm packages, providing a token-driven
visual language and an accessible React component library for building enterprise web
applications (ERP, admin consoles, internal tools, back-office systems).

The name carries the brief: *clara* means clear. Clarity is the product requirement, not
just the aesthetic. Every decision in Clara is judged against whether it makes the
interface easier to read, easier to predict, and faster to act on when a user is doing
the same task for the two-hundredth time that day.

### Tech Stack

| Layer | Choice | Confidence |
|-------|--------|------------|
| Language | TypeScript (strict mode) | [HIGH] |
| Component framework | React 18 and 19 | [HIGH] |
| Styling | CSS custom properties (design tokens) + CSS Modules | [HIGH] |
| Behavioral primitives | **Radix UI** primitives for complex widgets (decided 2026-08-21; isolation rule in Section 4 rule 7) | [HIGH] |
| Token pipeline | Style Dictionary (JSON source of truth to CSS/TS/JSON outputs) | [MEDIUM] |
| Build | tsup or Vite library mode, ESM + CJS output | [MEDIUM] |
| Monorepo | pnpm workspaces + Turborepo | [MEDIUM] |
| Docs | Storybook 8 (playground) + Astro or Next.js docs site (design language) | [MEDIUM] |
| Versioning | Changesets, semantic versioning | [HIGH] |
| Testing | Vitest + React Testing Library, axe-core, Playwright, Chromatic | [MEDIUM] |
| Registry | Public npm, scope `@luzentialabs` (verified unused 2026-08-21) | [HIGH] |
| License | MIT | [HIGH] |

### Architecture Pattern

Layered, token-first monorepo. Each layer depends only on the layer below it:

```
  Consuming applications (your future ERP apps)
            |
  @luzentialabs/clara-react     - components, CSS Modules, TypeScript types
            |
  @luzentialabs/clara-icons     - SVG icon set as React components
            |
  @luzentialabs/clara-tokens    - design tokens as CSS variables, TS constants, JSON
            |
  tokens/*.json    - the single source of truth for the visual language
```

Consequences of this shape:

1. An application can adopt `@luzentialabs/clara-tokens` alone and style its own markup, without ever
   installing React components.
2. Every component's appearance is fully determined by CSS custom properties, so a theme
   is a stylesheet, not a rebuild.
3. The Figma library and the code library read from the same token JSON, which is how the
   two stay in sync.

---

## 2. Problem Statement

### Problem Being Solved

Building enterprise web applications repeatedly means rebuilding the same twenty-five
components each time, and getting them slightly wrong each time. Off-the-shelf libraries
solve part of this but each carries a cost:

| Option | Why it falls short here |
|--------|------------------------|
| Material UI | Strong opinion (Material Design) that reads as consumer-grade and Google-branded in an enterprise context. Heavy runtime styling engine. Theming fights the library as often as it uses it. |
| Ant Design | Genuinely good for ERP density, but the visual language is dated and heavily opinionated, and customization is shallow. |
| Chakra / Mantine | Pleasant DX, but consumer-app aesthetics and weak on the dense, data-heavy screens ERP work demands. |
| shadcn/ui | Excellent primitives, but it is a copy-paste starting point, not a versioned system. Every project drifts independently. |
| Building per-project | Inconsistent, slow, and accessibility is quietly skipped every time. |

The specific gap: a system that is **dense enough for real ERP screens**, **calm enough to
look at for eight hours**, **accessible without extra work**, and **owned by me**, so it
can be versioned once and reused across every project.

### Target Users

| User | Description | Primary need |
|------|-------------|--------------|
| **The library consumer (primary)** | Me, and any developer building an application on Clara. Installs the package and composes screens. | Predictable APIs, complete TypeScript types, no need to read the source to use a component correctly. |
| **The library maintainer** | Me, extending Clara over time as new applications reveal gaps. | A contribution path that keeps quality high without ceremony: add a component, get tokens, a11y checks, docs, and a changeset for free. |
| **The end user** | Operations staff, finance teams, warehouse and admin users of the ERP applications built on Clara. Often keyboard-heavy, often on the same screen all day, mixed accessibility needs. | Legible dense data, no ambiguity about state, full keyboard operation, no surprises. |
| **The reviewing stakeholder** | A client or manager evaluating whether the app looks credible and professional. | It must read as enterprise software, not a hobby project or a template. |

### Context

This is a greenfield project with no existing code. It is a personal foundation
investment: Clara pays for itself across the second and third application built on it,
not the first. That framing matters for scope decisions - it justifies doing the token
architecture and accessibility properly up front, and it argues against building
components speculatively before an application actually needs them.

### Design Principles

These are the tie-breakers. When two options are defensible, the one that better serves
the higher principle wins.

1. **Clarity over decoration.** No shadow, gradient, or animation exists unless it
   communicates state, hierarchy, or causality. A user should never have to work out what
   an element is.
2. **Predictable over clever.** The same interaction produces the same result everywhere.
   A component's API should be guessable by someone who has used another Clara component.
3. **Density without noise.** ERP screens carry a lot of data. Clara achieves density by
   removing chrome (borders, padding, decoration), never by shrinking type below
   legibility or crowding touch targets past usability.
4. **Accessible by default, not by option.** A component that cannot be operated by
   keyboard and announced by a screen reader is not finished. There is no `accessible`
   prop.
5. **Composable, not endlessly configurable.** Prefer a small component that composes with
   others over one component with thirty props. If a use case needs an escape hatch, give
   it one honest escape hatch rather than twenty variants.
6. **Themeable only at the token layer.** Consumers change the look by overriding tokens.
   They never need to override component internals, and Clara never promises internal
   class names as API.
7. **Quiet by default.** Color is reserved for meaning. A default Clara screen is
   neutral; the blue, red, amber, and green are earned by status, not spent on chrome.

---

## 3. Feature Inventory

| Feature | Description | Status | Priority | Location |
|---------|-------------|--------|----------|----------|
| F00 Foundations pass | Time-boxed visual identity decision. Produces the tier 1 values F01 cannot be built without | Not Started | Must-have (blocking) | `design/foundations.md` |
| F01 Design token system | Three-tier token architecture, JSON source, multi-format output | Not Started | Must-have | `packages/tokens` |
| F02 Theming and color modes | Light/dark modes, brand override, per-subtree theming | Not Started | Must-have | `packages/tokens`, `packages/react` |
| F03 Density modes | Comfortable and compact scales for data-heavy screens | Not Started | Must-have | `packages/tokens` |
| F04 Typography system | Type scale, font stack, line heights, tabular numerals | Not Started | Must-have | `packages/tokens` |
| F05 Icon library | Consistent SVG icon set as tree-shakeable React components | Not Started | Must-have | `packages/icons` |
| F06 Layout primitives | Stack, Inline, Grid, Box, Divider, Spacer | Not Started | Must-have | `packages/react` |
| F07 Buttons and actions | Button, IconButton, ButtonGroup, Link | Not Started | Must-have | `packages/react` |
| F08 Form field framework | Field wrapper: label, description, error, required, disabled wiring | Not Started | Must-have | `packages/react` |
| F09 Text inputs | Input, Textarea, NumberInput, PasswordInput, SearchInput | Not Started | Must-have | `packages/react` |
| F10 Selection controls | Checkbox, CheckboxGroup, Radio, RadioGroup, Switch | Not Started | Must-have | `packages/react` |
| F11 Select and Combobox | Native-feel Select, searchable Combobox, MultiSelect | Not Started | Must-have | `packages/react` |
| F12 Date and time inputs | DatePicker, DateRangePicker, TimePicker | Not Started | Must-have | `packages/react` |
| F13 Overlays | Modal, Drawer, Popover, Tooltip, DropdownMenu | Not Started | Must-have | `packages/react` |
| F14 Feedback and status | Toast, Alert, Badge, Spinner, ProgressBar, Skeleton, EmptyState | Not Started | Must-have | `packages/react` |
| F15 Data display | Table (basic), Card, Avatar, Tag, DescriptionList, Tooltip content | Not Started | Must-have | `packages/react` |
| F16 Navigation | Tabs, Breadcrumb, Pagination, Menu | Not Started | Must-have | `packages/react` |
| F17 Accessibility conformance | WCAG 2.2 AA across the library, automated and manual verification | Not Started | Must-have | cross-cutting |
| F18 Storybook workspace | Interactive playground, all states, a11y addon, controls | Not Started | Must-have | `apps/storybook` |
| F19 Documentation site | Design language, principles, tokens, usage guidance, code recipes | Not Started | Must-have | `apps/docs` |
| F20 Build and publish pipeline | ESM+CJS builds, types, CI, npm publish | Not Started | Must-have | `.github/workflows`, root |
| F21 Versioning and release process | Changesets, semver policy, changelog, deprecation policy | Not Started | Must-have | root |
| F22 Test infrastructure | Unit, a11y, and visual regression harnesses with coverage gates | Not Started | Must-have | cross-cutting |
| F23 SSR and RSC compatibility | Works in Next.js App Router and Vite SSR without hydration errors | Not Started | Must-have | `packages/react` |
| F24 DataGrid (advanced) | Sorting, filtering, virtualization, column resize, inline edit, selection | Not Started | Should-have (v1.1) | `packages/react` |
| F25 Application shell | AppShell, Sidebar nav, Topbar, PageHeader, layout scaffolding | Not Started | Should-have (v1.1) | `packages/react` |
| F26 Figma library | Published Figma UI kit generated from the same tokens | Not Started | Should-have (v1.1) | `design/figma` |
| F27 Command palette | Global keyboard-driven action search | Not Started | Nice-to-have | `packages/react` |
| F28 Filter builder | Composable query/filter UI for list screens | Not Started | Nice-to-have | `packages/react` |
| F29 Charts | Token-aligned chart primitives for dashboards | Not Started | Nice-to-have | `packages/charts` |
| F30 Tailwind token preset | Clara tokens exposed as a Tailwind theme preset | Not Started | Nice-to-have | `packages/tailwind-preset` |

---

### Feature Details

#### F00 Foundations pass (blocking, time-boxed)

**User Story:** As the maintainer, I want Clara's visual identity decided inside a fixed window so
that F01 can be built on real values, and so that the foundations work cannot quietly become the
project.

**Serves:** The library maintainer, the reviewing stakeholder

**Why it is a feature row and not an open question:** v0.1.0 left this as an unbounded open question.
The UX seat's documented failure mode is refining foundations indefinitely, and that seat explicitly
asked to be capped rather than trusted. A deadline held by the document is the cap.

**Duration:** 5 working days. **Component work begins on day 6 whether or not the pass is happy.**

**Deliverables** (all of them, or the pass has not finished):

- [ ] Neutral ramp, 11 steps, with its temperature stated as a decision (warm / cool / true neutral)
- [ ] Accent hue chosen, with the reasoning recorded
- [ ] Ramp generation color space named (OKLCH recommended for perceptual uniformity)
- [ ] Radius scale, and the radius *character* stated (sharp / subtle / rounded)
- [ ] Border weight convention
- [ ] Elevation expression, including how it reads in dark theme where shadows barely register
- [ ] Focus indicator specification as a **two-part** indicator (ring plus offset, each its own token), since the offset gap renders the surface underneath and the ring must contrast with both control and surround
- [ ] Type scale steps with the body step named explicitly
- [ ] The legal pairing table (Section 7), populated and passing its own contrast thresholds
- [ ] Motion durations, and a statement of what motion is permitted to communicate

**Acceptance Criteria:**

- [ ] Every deliverable above is recorded in `design/foundations.md`
- [ ] Every value is expressed as a tier 1 token ready for F01 to consume
- [ ] The pairing table passes its thresholds in both light and dark before the pass is declared done
- [ ] No component work begins before the pass completes; no component work is blocked by it after day 5

**Dependencies:** None. This is the first thing that happens.
**Status:** Not Started
**Confidence:** [HIGH] - the scope and cap are decided; the values inside are not

---

#### F01 Design token system

**User Story:** As a library consumer, I want every visual value in Clara to come from a
named token so that I can retheme an entire application by changing a small set of values
rather than overriding component styles.

**Serves:** The library consumer, the library maintainer

**Design:** Three tiers, with a strict dependency direction.

| Tier | Example | Who may reference it | Public API? |
|------|---------|---------------------|-------------|
| 1. Primitive | `--clara-blue-600`, `--clara-space-4`, `--clara-radius-2` | Only tier 2. Never a component. | **Private.** May change in a minor. |
| 2. Semantic | `--clara-color-fg-default`, `--clara-color-bg-danger-subtle`, `--clara-space-inset-md` | Components, and consuming applications. | **Public.** Covered by F21's breaking-change rule. |
| 3. Component | `--clara-button-primary-bg`, `--clara-input-height` | Only the component that owns it. | **Private.** May change in a minor. |

> **Token visibility rule.** Tier 2 is the theming API Clara promises to keep. Tier 1 and tier 3
> are implementation detail: overriding them is unsupported and they may change without a major
> version. The boundary is machine-readable, not an honor system - the build emits
> `tokens.public.json` containing exactly the tier 2 set, and CI fails if the docs site or any
> published example references a token outside it.

Note: the CSS custom property prefix stays `--clara-` regardless of the npm scope. The scope
names the publisher; the prefix names the design system.

**Acceptance Criteria:**

- [ ] Token source of truth is JSON under `packages/tokens/src/`, organized by tier
- [ ] Build emits: `tokens.css` (CSS custom properties), `tokens.ts` (typed constants), `tokens.json` (for Figma and other tooling)
- [ ] Every CSS custom property is prefixed `--clara-` with no exceptions
- [ ] Primitive tier covers: color ramps (11 steps per hue), spacing scale, radius scale, border widths, shadow levels, font sizes, font weights, line heights, z-index layers, motion durations and easings
- [ ] Semantic tier covers at minimum: `fg` (default, muted, subtle, on-emphasis, disabled, link), `bg` (canvas, surface, subtle, emphasis, hover, active, disabled), `border` (default, muted, strong, focus), in **neutral, accent, and the four status intents** (info, success, warning, danger)
- [ ] Semantic tier additionally names the four families the component set requires and v0.1.0 omitted:
  - `accent` - the family `--clara-button-primary-bg` and every primary action resolve to. Required by F07, F11, F16
  - `selected` - `bg` and `border`. Required by F15 row selection, F11 MultiSelect, F16 active navigation. Distinct from `accent` and from the four intents
  - `fg-readonly` - required by F09's "readonly is visually distinct from disabled and remains at full contrast"
  - `focus` - ring color and offset as **two separate tokens**, per F07's focus specification
- [ ] Row-surface precedence is defined and documented: for a table row that is simultaneously striped, hovered, selected, and focused, the resolution order is **focus ring > selected > hover > striped**, with selected and hover composing rather than replacing
- [ ] A CI check fails the build if any component CSS file references a tier 1 token directly
- [ ] A CI check fails the build if any component CSS file contains a hard-coded color, spacing, or radius literal
- [ ] Build emits `tokens.public.json` containing exactly the tier 2 set; CI fails if the docs site or a published example references a token outside it
- [ ] Build emits `tokens.pairings.json`, the enumerated legal foreground/background and border/background pairings (Section 7). The F02 contrast test iterates that file, and asserts its row count matches the documented table
- [ ] Clara's CSS is emitted inside named cascade layers, declared in this order: `@layer clara.reset, clara.tokens, clara.components;`
- [ ] Token names are documented with intended usage, not just value, in the docs site

**Dependencies:** None. This is the root of the dependency graph.
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F02 Theming and color modes

**User Story:** As a library consumer, I want to switch between light and dark modes and
apply my own brand color so that Clara-based applications fit their context without
forking the library.

**Serves:** The library consumer, the end user

**Acceptance Criteria:**

- [ ] Light mode is the default and requires no configuration
- [ ] Dark mode activates via `data-clara-theme="dark"` on any ancestor element
- [ ] `data-clara-theme="light"` forces light mode regardless of system preference
- [ ] With no attribute set, the theme follows `prefers-color-scheme`
- [ ] Theme can be scoped to a subtree, so a dark sidebar inside a light page works correctly with no style leakage
- [ ] Only tier 1 and tier 2 tokens are redefined per theme; no component CSS is theme-aware
- [ ] A documented `createTheme()` helper accepts a brand hue and generates a conforming 11-step ramp that passes contrast requirements at the semantic mappings
- [ ] Switching themes causes no layout shift and no flash of unstyled content in SSR
- [ ] Every semantic color pairing meets WCAG 2.2 AA contrast in both modes, verified by an automated contrast test over the token matrix

**Dependencies:** F01
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F03 Density modes

**User Story:** As an end user working through hundreds of rows of ERP data, I want a
compact layout option so that I can see more records without scrolling, while other users
keep a comfortable layout.

**Serves:** The end user, the library consumer

**Acceptance Criteria:**

- [ ] Two modes: `comfortable` (default) and `compact`, set via `data-clara-density`
- [ ] Density is scopeable to a subtree, so a compact table can sit inside a comfortable page
- [ ] Comfortable control height is 40px; compact control height is 32px
- [ ] Density changes control heights, internal padding, table row height, and vertical rhythm between form fields
- [ ] Density does **not** change font sizes below the minimum legible size (14px body text in both modes)
- [ ] Density does **not** reduce interactive target size below 24x24px, per WCAG 2.2 Target Size (Minimum)
- [ ] Every component with vertical padding responds to density; verified by a Storybook story rendering the full component set in both modes side by side

**Dependencies:** F01
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F04 Typography system

**User Story:** As an end user reading dense financial and operational data, I want type
that stays legible and aligns numerically so that I can scan columns without
misreading figures.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] Type scale defined as tokens with at least 7 steps, each with a paired line height
- [ ] Default font stack is a system UI stack, with a documented single-token override point for a custom typeface
- [ ] Body text minimum is 14px; no Clara component renders text below 12px, and 12px is reserved for non-essential metadata only
- [ ] A `tabular` variant using `font-variant-numeric: tabular-nums` is available and is the default inside Table numeric cells
- [ ] Heading components (`Heading` with `level` and `size` decoupled) allow correct semantic heading order independent of visual size
- [ ] Long text truncation is a documented, opt-in utility that always exposes the full value via `title` or a tooltip, never silently

**Dependencies:** F01
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F05 Icon library

**User Story:** As a library consumer, I want a consistent icon set that ships with Clara
so that I do not have to source, size, and color icons separately in every project.

**Serves:** The library consumer

**Acceptance Criteria:**

- [ ] Icons ship as individual tree-shakeable React components from `@luzentialabs/clara-icons`
- [ ] All icons are on a 24x24 grid with consistent stroke width and optical weight
- [ ] Icons inherit `currentColor` and size from font size by default, with a `size` prop override
- [ ] Every icon accepts `aria-label`; when omitted, the icon renders `aria-hidden="true"` and is treated as decorative
- [ ] v1 set covers at minimum the icons Clara's own components need, plus common ERP actions: navigation, status, CRUD, sort/filter, file, calendar, user, settings
- [ ] Importing a single icon adds no more than 1KB gzipped to a consumer bundle
- [ ] Icon source is a documented pipeline (SVG files to generated components), so adding an icon is one command

**Dependencies:** F01
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F06 Layout primitives

**User Story:** As a library consumer, I want spacing and layout primitives so that I
compose screens with consistent rhythm instead of writing ad-hoc CSS in every application.

**Serves:** The library consumer

**Acceptance Criteria:**

- [ ] `Stack` (vertical), `Inline` (horizontal with wrap), `Grid`, `Box`, `Divider` are provided
- [ ] Spacing props accept only token scale values, enforced by TypeScript union types, not arbitrary strings
- [ ] All primitives support an `as` prop for polymorphic rendering with correct TypeScript prop inference
- [ ] Primitives forward `ref` and spread remaining props to the underlying element
- [ ] Layout primitives add no wrapper element beyond the one rendered
- [ ] `Box` exposes a constrained style surface (padding, margin, background, border, radius via tokens only) and does not become a general-purpose style escape hatch

**Dependencies:** F01
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F07 Buttons and actions

**User Story:** As an end user, I want buttons whose importance and state are immediately
readable so that I know what the primary action on a screen is and whether it is available.

**Serves:** The end user, the library consumer

**Acceptance Criteria:**

- [ ] Variants: `primary`, `secondary`, `ghost`, `danger`. At most one `primary` per view is a documented guideline enforced in docs, not code
- [ ] Sizes: `sm`, `md`, `lg`, with `md` matching the density-driven control height
- [ ] States: default, hover, active, focus-visible, disabled, loading
- [ ] Loading state disables interaction, preserves button width to prevent layout shift, and announces via `aria-busy`
- [ ] Disabled buttons remain focusable-with-explanation or are paired with a documented tooltip pattern, so the reason is never invisible
- [ ] Focus ring is a 2px token-driven outline with a 2px offset, visible against every background token, and appears on `:focus-visible` only
- [ ] `IconButton` requires an `aria-label` at the type level; omitting it is a TypeScript error
- [ ] `ButtonGroup` merges adjacent borders and manages roving focus with arrow keys
- [ ] Renders as `<button>` by default and as `<a>` when `href` is supplied, with correct role semantics in both cases

**Dependencies:** F01, F03, F05
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F08 Form field framework

**User Story:** As a library consumer building ERP forms, I want label, help text, error
message, and required indication wired to every input automatically so that I never ship a
form field with broken accessibility.

**Serves:** The library consumer, the end user

This is the highest-leverage feature in Clara. ERP applications are mostly forms, and this
is where most component libraries leak accessibility bugs.

**Acceptance Criteria:**

- [ ] A `Field` component composes `Field.Label`, `Field.Control`, `Field.Description`, `Field.Error`
- [ ] `id`, `aria-describedby`, `aria-invalid`, and `aria-errormessage` are wired automatically with generated stable ids that are SSR-safe
- [ ] The label is always a real `<label>` associated with the control; there is no placeholder-as-label pattern anywhere in Clara
- [ ] Required fields are marked both visually and via the `required` attribute; the visual marker's meaning is stated once per form, not inferred from an asterisk alone
- [ ] Error state sets `aria-invalid`, links the message via `aria-errormessage`, and renders the message with `role="alert"` when it appears after user interaction
- [ ] Error messaging is never conveyed by color alone; an icon and text always accompany it
- [ ] Description and error can coexist, and both are announced
- [ ] Works uncontrolled (native form submission) and controlled, and integrates with React Hook Form via documented examples with no wrapper component required
- [ ] Field-level validation timing is the consumer's choice; Clara does not impose a validation library

**Dependencies:** F01, F04
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F09 Text inputs

**User Story:** As an end user entering data all day, I want inputs that behave
predictably, show me their state, and never lose my work.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `Input` supports: prefix and suffix slots (icon, unit, currency), `clearable`, character counter, readonly, disabled, invalid
- [ ] `Textarea` supports auto-resize with a `maxRows` cap and a manual resize handle option
- [ ] `NumberInput` supports min, max, step, precision, thousands separators, stepper buttons, and keyboard arrow adjustment; it uses `inputMode="decimal"` and does not use `type="number"` scroll-wheel behavior
- [ ] `PasswordInput` includes a reveal toggle that is keyboard operable and correctly labeled for its current state
- [ ] `SearchInput` includes a search icon, clear affordance, and documented debounce guidance
- [ ] All inputs forward `ref` to the underlying native element
- [ ] Readonly and disabled are visually distinct from each other; readonly text remains at full contrast
- [ ] Autofill styling does not break the token-driven appearance in Chrome and Safari
- [ ] Placeholder text, where present, is supplementary only and never carries required information

**Dependencies:** F08
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F10 Selection controls

**User Story:** As an end user, I want checkboxes, radios, and switches whose state is
unmistakable at a glance, including the partially-selected case in tables.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `Checkbox` supports checked, unchecked, and indeterminate, with indeterminate correctly reflected in `aria-checked="mixed"`
- [ ] `Radio` only exists inside `RadioGroup`; the group manages roving focus and arrow-key navigation per WAI-ARIA
- [ ] `Switch` uses `role="switch"` and is documented as being for immediate-effect settings only, not for form values that require submission
- [ ] Checked state is conveyed by shape and mark, not by color alone
- [ ] The full control including its label is a click target
- [ ] Hit area meets the 24x24px minimum even in compact density where the visual box is smaller
- [ ] `CheckboxGroup` and `RadioGroup` integrate with `Field` for group-level label and error via `role="group"` and `aria-describedby`

**Dependencies:** F08
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F11 Select and Combobox

**User Story:** As an end user picking from a list of two thousand customer accounts, I
want to type to filter and choose with the keyboard so that I am not scrolling through a
dropdown.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `Select` for short, known option sets; `Combobox` for filterable sets; `MultiSelect` for multiple values
- [ ] All follow the WAI-ARIA Combobox pattern: `aria-expanded`, `aria-controls`, `aria-activedescendant`, correct `role="listbox"` and `role="option"`
- [ ] Full keyboard operation: type to filter, arrow keys to move, Enter to select, Escape to close and restore, Home/End to jump, Tab to commit and move on
- [ ] Option groups with `role="group"` and accessible group labels
- [ ] Async option loading with loading, empty, and error states
- [ ] Lists over 100 options are virtualized without breaking keyboard navigation or `aria-activedescendant`
- [ ] `MultiSelect` renders selections as removable tags; each remove control is keyboard reachable and labeled with the value it removes
- [ ] Selected count is announced when it changes
- [ ] Dropdown positioning flips and shifts to stay in the viewport, and remains anchored on scroll within a scrollable container
- [ ] Works correctly inside a Modal and inside a scrollable Table without clipping

**Dependencies:** F08, F13
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F12 Date and time inputs

**User Story:** As an end user entering posting dates and reporting periods, I want to type
a date directly or pick it from a calendar, whichever is faster for me.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `DatePicker` accepts both direct text entry and calendar selection; text entry is never disabled in favor of the calendar
- [ ] Expected input format is shown in the field description, not only in the placeholder
- [ ] Calendar is fully keyboard navigable: arrows by day, PageUp/PageDown by month, Home/End to week bounds, Escape to close
- [ ] Calendar announces the focused date and the month context to screen readers
- [ ] `DateRangePicker` supports start and end selection with a documented preset pattern (this month, last quarter, year to date)
- [ ] `TimePicker` supports 12h and 24h display
- [ ] Min date, max date, and disabled-date predicates are supported and announced when a date is unavailable
- [ ] Locale and first-day-of-week are configurable; Clara depends on a documented date library rather than reimplementing calendar math
- [ ] Timezone handling behavior is explicitly documented (Clara operates on calendar dates, not instants, unless a time component is present)

**Dependencies:** F08, F13
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F13 Overlays

**User Story:** As an end user, I want dialogs and menus that trap focus correctly and
return me where I was so that keyboard navigation never strands me.

**Serves:** The end user, the library consumer

**Acceptance Criteria:**

- [ ] `Modal` traps focus, restores focus to the trigger on close, closes on Escape, and marks background content inert
- [ ] `Modal` sizes are token-driven, content scrolls internally, and the header and footer remain fixed
- [ ] `Drawer` supports left, right, and bottom placement with the same focus behavior as Modal
- [ ] `Popover` is non-modal and returns focus correctly on dismissal
- [ ] `Tooltip` appears on hover **and** on keyboard focus, is dismissible with Escape, remains visible while the pointer moves toward it, and is never the only source of essential information
- [ ] `DropdownMenu` implements the WAI-ARIA menu pattern with typeahead, submenus, and disabled item handling
- [ ] Overlays render via portal with a documented, token-driven z-index layer scale; nested overlays stack in a predictable order
- [ ] Scroll lock on Modal does not cause layout shift from scrollbar removal
- [ ] All overlays are SSR-safe and render nothing on the server

**Dependencies:** F01, F07
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F14 Feedback and status

**User Story:** As an end user, I want to know whether my action succeeded, is still
running, or failed, without hunting for the answer.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `Toast` with a provider and imperative API; toasts are announced via a live region with `polite` for success and `assertive` for error
- [ ] Toast auto-dismiss timing is configurable, pauses on hover and on focus, and error toasts do not auto-dismiss by default
- [ ] `Alert` (inline banner) with info, success, warning, danger intents, each with an intent icon so meaning survives without color
- [ ] `Badge` for counts and `Tag` for labels, both with the four intents plus neutral
- [ ] `Spinner` with an accessible label; `ProgressBar` with determinate and indeterminate modes and correct `aria-valuenow`
- [ ] `Skeleton` for loading placeholders, marked `aria-hidden` with the loading state announced once at the container level rather than per skeleton
- [ ] `EmptyState` composes an icon, message, and optional action, with documented guidance distinguishing "no data yet" from "no results for this filter"
- [ ] Status color pairs (background and foreground) meet AA contrast in both themes

**Dependencies:** F01, F05, F07
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F15 Data display

**User Story:** As an end user scanning a list of transactions, I want a table that keeps
columns aligned and headers visible so that I can read down a column without losing context.

**Serves:** The end user

Scope note: v1 delivers a well-built **basic** table. The advanced DataGrid (F24) is
deliberately deferred, because building it badly early is worse than building it properly
once a real application defines the requirements.

**Acceptance Criteria:**

- [ ] `Table` renders semantic `<table>` markup with `<caption>`, `<thead>`, `<th scope>` correctly applied
- [ ] Column alignment is configurable; numeric columns default to right-aligned with tabular numerals
- [ ] Sticky header and optional sticky first column, both working inside a scrollable container
- [ ] Sortable column headers use `aria-sort` and are keyboard operable buttons within the header cell
- [ ] Row selection via checkbox column with a header select-all supporting the indeterminate state
- [ ] Zebra striping is opt-in and off by default; row separation uses a border token by default
- [ ] Loading, empty, and error states are first-class table states, not consumer responsibility
- [ ] `Card`, `Avatar`, `Tag`, `DescriptionList` are provided with token-driven styling
- [ ] Horizontal overflow scrolls within the table container; the page body never scrolls horizontally

**Dependencies:** F01, F04, F10
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F16 Navigation

**User Story:** As an end user, I want to know where I am in the application and move
between sections without losing my place.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] `Tabs` implements the WAI-ARIA tabs pattern with arrow-key navigation and both automatic and manual activation modes
- [ ] `Tabs` supports lazy panel mounting with content state preserved between switches
- [ ] `Breadcrumb` uses `<nav aria-label>` with an ordered list and marks the current page with `aria-current="page"`
- [ ] `Pagination` exposes page size selection, total count, and jump-to-page, with each control labeled for screen readers
- [ ] `Menu` (navigation) is distinguished in docs from `DropdownMenu` (actions), with the correct role semantics for each
- [ ] Active navigation state is conveyed by more than color

**Dependencies:** F01, F07, F13
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F17 Accessibility conformance

**User Story:** As a library consumer shipping to an enterprise with procurement
requirements, I want documented WCAG conformance so that Clara is not the reason an
accessibility audit fails.

**Serves:** The library consumer, the end user

**Acceptance Criteria:**

- [ ] Target is WCAG 2.2 Level AA
- [ ] Every component has an automated axe-core assertion covering its default and error states, run in CI
- [ ] Zero axe violations at "serious" or "critical" severity across all Storybook stories; the CI job fails on any
- [ ] Every interactive component has a documented keyboard interaction table in its docs page
- [ ] Focus is visible on every interactive element against every background token, verified by a dedicated visual regression story
- [ ] No information in Clara is conveyed by color alone; a documented audit confirms this per component
- [ ] Manual screen reader verification recorded for the form components at minimum: VoiceOver on Safari, NVDA on Firefox
- [ ] Reduced motion preference (`prefers-reduced-motion`) disables non-essential animation library-wide
- [ ] An accessibility statement page in the docs site lists conformance level, known gaps, and testing method

**Dependencies:** All component features
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F18 Storybook workspace

**User Story:** As a library consumer, I want to see and interact with every component
state before I write code so that I choose the right component and props first time.

**Serves:** The library consumer, the library maintainer

**Acceptance Criteria:**

- [ ] Every exported component has stories covering: default, every variant, every size, disabled, loading, error, and empty where applicable
- [ ] Global toolbar toggles for theme (light/dark) and density (comfortable/compact)
- [ ] Autodocs generate a props table from TypeScript types, including descriptions from TSDoc comments
- [ ] The a11y addon is enabled and its violations are visible in the UI
- [ ] Storybook builds as a static site and deploys on merge to the default branch
- [ ] A CI check fails if a component is exported from `@luzentialabs/clara-react` without a corresponding story file

**Dependencies:** F20
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F19 Documentation site

**User Story:** As a library consumer and as a stakeholder evaluating Clara, I want the
design language explained, not just the components listed, so that I apply it correctly and
believe it is a real system.

**Serves:** The library consumer, the reviewing stakeholder

The docs site is Clara's own proof. It is built with Clara, so a visitor sees the system
working before reading a word about it.

**Acceptance Criteria:**

- [ ] Sections: Getting Started, Principles, Foundations (color, type, space, elevation, motion, icons), Components, Patterns, Accessibility, Changelog, Contributing
- [ ] Every component page includes: purpose, when to use and when not to use, live examples, props reference, keyboard interactions, accessibility notes, and do/don't guidance
- [ ] A Patterns section documents composite ERP patterns Clara does not ship as components: form layout, list-detail screens, bulk actions, destructive confirmation, filtering
- [ ] Token reference pages render live swatches and values, generated from the token source rather than hand-maintained
- [ ] Copyable code examples that work when pasted into a fresh project
- [ ] The site is built with Clara components and passes the same accessibility gate as the library
- [ ] Deploys automatically on merge to the default branch

**Dependencies:** F01, F17, F20
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F20 Build and publish pipeline

**User Story:** As a library consumer, I want to install Clara from npm and have it work in
my Vite or Next.js project with correct types and no configuration.

**Serves:** The library consumer

**Acceptance Criteria:**

- [ ] Packages publish as ESM and CJS with correct `exports` map, `types`, and `sideEffects` fields
- [ ] The `exports` map enumerates its subpaths explicitly (Section 4) and contains **no `./*` wildcard**; a CI check fails if a wildcard is introduced
- [ ] TypeScript declarations are generated and validated; `attw` (Are The Types Wrong) passes with no errors
- [ ] `publint` passes with no errors
- [ ] **CSS delivery model: one stylesheet per package.** `@luzentialabs/clara-react` ships a single `styles.css` containing the complete component set. There is no per-component CSS import and CSS is deliberately **not** tree-shaken - the full payload ships whatever a consumer imports. This is a permanent decision: it lives in the `exports` map and cannot change without breaking every consumer's import
- [ ] The built CSS declares `@layer clara.reset, clara.tokens, clara.components;` before any rule; a test in the Next.js verification app asserts a consumer class overrides a component style without `!important`
- [ ] React is a peer dependency, not a bundled dependency
- [ ] A verification job installs the published tarball into a fresh Vite app and a fresh Next.js App Router app and builds both successfully
- [ ] CI runs on every pull request: typecheck, lint, unit tests, a11y tests, build, and package validation
- [ ] Publishing is automated from the default branch and requires a green CI run

**Dependencies:** None (infrastructure)
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F21 Versioning and release process

**User Story:** As a library consumer with three applications on Clara, I want to know
whether an upgrade will break me before I run it.

**Serves:** The library consumer, the library maintainer

**Acceptance Criteria:**

- [ ] Semantic versioning is followed strictly; the definition of a breaking change is written down (any removal or behavior change in a public prop, exported name, or documented CSS custom property)
- [ ] Changesets are required on any pull request touching `packages/`, enforced by CI
- [ ] Changelogs are generated per package and published
- [ ] Deprecation policy: a deprecated API emits a development-mode console warning, remains functional for at least two minor versions, and is documented with its replacement
- [ ] Pre-1.0 releases are explicitly marked unstable in the README with the stability expectations stated
- [ ] Migration guides accompany every major version

**Dependencies:** F20
**Status:** Not Started
**Confidence:** [HIGH]

---

#### F22 Test infrastructure

**User Story:** As the library maintainer, I want a test harness that catches regressions
before consumers do, since a bug in Clara is a bug in every application at once.

**Serves:** The library maintainer

**Acceptance Criteria:**

- [ ] Unit and interaction tests with Vitest and React Testing Library; tests query by accessible role and name, never by class name or test id, except where no accessible query exists
- [ ] Automated axe assertions per component (see F17)
- [ ] Visual regression baselines per component covering both themes and both densities, with a review gate on diffs
- [ ] Coverage gate: 90% statements on `packages/react/src`, failing CI below the threshold
- [ ] A mutation check on the changed surface confirms the tests can actually fail
- [ ] Keyboard interaction tests for every component with a documented keyboard table
- [ ] Test suite completes in under 3 minutes locally

**Dependencies:** F20
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F23 SSR and RSC compatibility

**User Story:** As a library consumer building on Next.js App Router, I want Clara to work
without hydration warnings so that I do not have to wrap everything in a client boundary.

**Serves:** The library consumer

**Acceptance Criteria:**

- [ ] Components requiring interactivity carry the `"use client"` directive; purely presentational components do not
- [ ] Generated ids use `useId` and are stable across server and client render
- [ ] No component reads `window`, `document`, or `matchMedia` during render
- [ ] No hydration mismatch warnings in the Next.js verification app
- [ ] Theme and density resolve on the server from an explicit attribute; the documented pattern avoids a flash of incorrect theme
- [ ] The verification job (F20) asserts a clean server render for a page composing every component

**Dependencies:** F20
**Status:** Not Started
**Confidence:** [MEDIUM]

---

#### F24 DataGrid (advanced) - deferred to v1.1

**User Story:** As an end user working a list of fifty thousand records, I want to sort,
filter, resize, and edit inline without the screen becoming unusable.

**Serves:** The end user

**Acceptance Criteria:**

- [ ] Row virtualization holding 60fps scroll at 50,000 rows
- [ ] Column sort (multi-column), filter, resize, reorder, pin, and show/hide
- [ ] Inline cell editing with validation and keyboard commit/cancel
- [ ] Row selection with shift-range and select-all-across-pages semantics
- [ ] Virtualization does not break keyboard navigation or screen reader row/column announcements
- [ ] A documented decision on whether to build on a headless grid library (TanStack Table) or from scratch

**Dependencies:** F15
**Status:** Not Started
**Confidence:** [LOW] - requirements will firm up once a real application uses it

---

#### F25 Application shell - deferred to v1.1

**User Story:** As a library consumer starting a new ERP application, I want the navigation
scaffolding to already exist so that I start on feature work rather than layout.

**Acceptance Criteria:**

- [ ] `AppShell` with header, collapsible sidebar, and content region
- [ ] Sidebar navigation with nested groups, active state, and collapsed icon-only mode with accessible labels
- [ ] `PageHeader` with title, breadcrumb slot, and action slot
- [ ] Responsive behavior down to tablet width; mobile is explicitly out of scope for v1.1 and documented as such
- [ ] Skip-to-content link included by default

**Dependencies:** F16
**Status:** Not Started
**Confidence:** [LOW]

---

#### F26 Figma library - deferred to v1.1

**User Story:** As the person designing screens before building them, I want a Figma
library whose components match the code exactly so that a design handoff has no gaps.

**Acceptance Criteria:**

- [ ] Figma variables are imported from `tokens.json`, so color, spacing, and type in Figma are the same values as in code
- [ ] A published Figma library covers the v1 component set with variants matching the code props
- [ ] Light and dark modes exist as Figma variable modes
- [ ] A documented, repeatable sync procedure from token JSON to Figma variables, with a stated cadence
- [ ] A drift check identifies components that exist in one library and not the other

**Dependencies:** F01, all v1 components
**Status:** Not Started
**Confidence:** [MEDIUM] - the sync direction (code to Figma) is settled; the tooling is not

---

## 4. Functional Requirements

### Core Behaviors

1. **Token resolution.** Every rendered pixel value in a Clara component traces to a CSS
   custom property. A consumer overriding a semantic token in their own stylesheet changes
   every component that references it, with no build step and no library rebuild.

2. **Component contract.** Every component in `@luzentialabs/clara-react`:
   - forwards `ref` to its principal DOM element
   - spreads unrecognized props onto that element
   - accepts `className` and merges it after its own classes
   - accepts `style` and applies it last, so a token override on `style` wins
   - never requires a context provider except where documented (Toast, and theme-if-scoped)

3. **Controlled and uncontrolled.** Every stateful component supports both. Uncontrolled is
   the default. Supplying the value prop without the change handler produces a development
   warning, matching React's own convention.

4. **Composition over configuration.** Compound components (`Field.Label`, `Table.Row`,
   `Modal.Header`) are preferred over prop-driven slots when a consumer might need to place
   arbitrary content.

5. **Failure visibility.** Clara never fails silently. A misconfigured component logs a
   development-mode warning naming the component, the problem, and the fix. Production
   builds strip these.

### Input/Output Specifications

**Package public API surface:**

| Package | Exports |
|---------|---------|
| `@luzentialabs/clara-tokens` | `tokens.css`, `themes/dark.css`, typed token constants, `tokens.json`, `createTheme()` |
| `@luzentialabs/clara-icons` | One named React component per icon, plus an `Icon` base |
| `@luzentialabs/clara-react` | Named component exports, their prop types, hooks (`useToast`, `useDisclosure`), and the styles entry point |

**Consumer setup contract** (this must remain this short):

```tsx
// 1. styles, once, at the app root. Two files, in this order, and that is the whole
//    styling contract - there is no per-component CSS import.
import '@luzentialabs/clara-tokens/tokens.css'
import '@luzentialabs/clara-react/styles.css'

// 2. providers, once
<ClaraProvider theme="system" density="comfortable">
  <App />
</ClaraProvider>

// 3. use
import { Button, Field, Input } from '@luzentialabs/clara-react'
```

**Cascade contract.** All Clara CSS is emitted inside named layers, declared in this order:

```css
@layer clara.reset, clara.tokens, clara.components;
```

Unlayered CSS always wins over layered CSS in the cascade, regardless of specificity. Because a
consuming application's own stylesheets are unlayered by default, **any consumer rule beats any
Clara component rule without `!important` and without a specificity contest.** That is the
guarantee behind "`className` merges after its own classes" above, and it is the reason the layer
declaration cannot be added later: introducing it after v1.0 would silently change the resolved
styles of every override already shipped.

**Closed exports map.** Every reachable subpath is permanent, so the `exports` map enumerates its
subpaths explicitly and contains no `./*` wildcard:

| Package | Public subpaths |
|---------|-----------------|
| `@luzentialabs/clara-tokens` | `.`, `./tokens.css`, `./themes/dark.css`, `./tokens.json`, `./tokens.public.json`, `./package.json` |
| `@luzentialabs/clara-icons` | `.`, `./package.json` |
| `@luzentialabs/clara-react` | `.`, `./styles.css`, `./package.json` |

### Business Logic Rules

1. A component may reference tier 2 or tier 3 tokens only. Referencing a tier 1 token or a
   raw value from component CSS fails CI.
2. Every interactive component must have a documented keyboard interaction table before it
   is exported.
3. No component ships without: stories, unit tests, an axe assertion, a visual baseline, and
   a docs page. This is the definition of done for a component.
4. Color alone never carries meaning. Any status, selection, or error state pairs color with
   an icon, a mark, or text.
5. Breaking changes to a public prop, an exported name, or a documented token require a
   major version.
6. A new dependency added to `@luzentialabs/clara-react` requires a written justification recorded as a
   decision, weighed against consumer bundle cost.
7. **Primitive isolation.** No Radix type, prop name, or `data-*` attribute is re-exported,
   documented, or otherwise made part of Clara's public API. Radix is an implementation detail
   behind Clara's own surface. Concretely: `asChild`, `onOpenChange`, and `data-state` do not
   appear in Clara's published `.d.ts` files, its docs, or its examples. Clara names its own
   equivalents. The check is mechanical - the generated API report must contain no imported type
   from `@radix-ui/*`.
8. **One idiom per question.** Clara answers polymorphism and composition exactly once, everywhere:
   the `as` prop is Clara's single polymorphism idiom, on layout primitives (F06), on `Button`
   (F07, which renders `<a>` when `as="a"` with `href`), and on overlay triggers. `asChild` is not
   Clara API. Design principle 2 - "guessable by someone who has used another Clara component" - is
   enforced by this rule rather than merely asserted by it.
9. **Tier 2 tokens are public; tier 1 and tier 3 are not.** See F01's token visibility rule.
   A change to a tier 2 token *name* is breaking. Whether a change to a tier 2 token *value* is
   breaking is deferred to F21 (Tier 3 condition) and is currently unresolved.

---

## 5. Non-Functional Requirements

### Performance

| Requirement | Target | Measured by |
|-------------|--------|-------------|
| CSS payload (fixed) | The complete `styles.css` is 15KB gzipped or less for the full v1 component set | size-limit on the built CSS artifact |
| Import cost, single component (JS) | Importing `Button` alone adds 3KB gzipped of JS or less | size-limit in CI |
| Full library, tree-shaken (JS) | An app using 15 components pulls no more than 60KB gzipped of Clara JS | size-limit in CI |
| Runtime styling cost | Zero. No CSS-in-JS runtime, no style injection at render | Architectural, verified by dependency audit |
| Table render | 500 rows render in under 100ms on a mid-range laptop | Benchmark story |
| Theme switch | No layout shift, completes within one frame | Visual and manual verification |
| Storybook build | Under 3 minutes in CI | CI timing |

> **On the CSS budget.** v0.1.0 stated "Button alone adds less than 5KB gzipped **including its
> CSS**". With a single-stylesheet delivery model that number was unmeasurable, because no
> component has a separable CSS cost - the whole sheet ships either way. The budget is therefore
> split: a fixed ceiling on the complete stylesheet, and per-component budgets on JavaScript only.
> This is a smaller promise than v0.1.0 made, and it is the one that can actually be checked.

### Security

Clara handles no data and makes no network requests, which keeps the surface small. The
requirements that remain:

- [ ] No component uses `dangerouslySetInnerHTML` on consumer-supplied content anywhere
- [ ] No runtime dependency with a known high or critical CVE; `pnpm audit` gates CI
- [ ] Dependency count in `@luzentialabs/clara-react` is minimized and each is justified; supply chain risk is a real cost of a library that will sit in every application
- [ ] Published packages use npm provenance attestation
- [ ] No telemetry, no analytics, no network calls of any kind from the library

### Scalability

Scalability here means growth of the system itself, not request throughput:

- [ ] Adding a component must not require changes to existing components
- [ ] Adding a theme requires no changes to any component CSS
- [ ] Adding a density mode requires changing only token definitions
- [ ] The token architecture supports at least 5 brand themes without structural change
- [ ] The build must still complete in under 5 minutes at roughly triple the v1 component count

### Availability

- [ ] Published packages are immutable once released; a bad release is fixed forward with a patch, never unpublished
- [ ] Docs site and Storybook are statically hosted with no runtime backend
- [ ] Consumers can pin exact versions; Clara publishes no floating dependency ranges of its own

### Compatibility

| Surface | Requirement |
|---------|-------------|
| React | 18.2+ and 19.x, both supported |
| TypeScript | 5.0+, strict mode; the library ships no `any` in its public API |
| Node (build only) | 20 LTS+ |
| Browsers | Last 2 versions of Chrome, Edge, Firefox; Safari 16.4+ |
| Bundlers | Vite, Next.js (App and Pages Router), Webpack 5 |
| Rendering | Client, SSR, and React Server Components |

Internet Explorer and legacy Edge are explicitly not supported. Mobile-first layouts are
out of scope for v1; Clara targets desktop and tablet, which is where ERP work happens.

### Developer Experience

- [ ] Every public prop has a TSDoc comment that appears in editor autocomplete
- [ ] Prop types use literal unions rather than `string` wherever the value set is closed
- [ ] Common mistakes fail at the type level rather than at runtime (an `IconButton` without a label, an arbitrary spacing value)
- [ ] A new consumer can install Clara and render a working themed form in under 10 minutes using the Getting Started page alone

---

## 6. AI/ML Specifications

Not applicable. Clara contains no AI or ML components.

---

## 7. Data Architecture

Clara persists no application data. Its data model is the token schema, which is the
system's actual source of truth.

### Data Models

**Token JSON schema** (`packages/tokens/src/`):

```jsonc
// primitive/color.json - tier 1
{ "color": { "blue": { "600": { "value": "#2563EB", "type": "color" } } } }

// semantic/color.json - tier 2
{ "color": { "fg": { "default":  { "value": "{color.gray.900}", "type": "color" } },
             "bg": { "danger-subtle": { "value": "{color.red.50}", "type": "color" } } }
}

// component/button.json - tier 3
{ "button": { "primary": { "bg": { "value": "{color.bg.accent-emphasis}" } } } }
```

### Legal Color Pairings

F02 promises that "every semantic color pairing meets WCAG 2.2 AA contrast in both modes." That is a
claim quantified over a set, and v0.1.0 never enumerated the set. This is that set. A pairing not
listed here is **documented as unsupported**, which is a real answer and a testable one.

Thresholds are stated per role rather than as a blanket "AA", because AA is not one number:

| Role | Minimum ratio | Source |
|------|---------------|--------|
| Body and small text | 4.5:1 | WCAG 1.4.3 |
| Large text (>=24px, or >=18.66px bold) | 3:1 | WCAG 1.4.3 |
| Borders, icons, control boundaries, focus indicator | 3:1 | WCAG 1.4.11 |
| Disabled controls | exempt | WCAG 1.4.3 exception - but see the note below |

**Text pairings (4.5:1):**

| Foreground | Background | Note |
|------------|------------|------|
| `fg-default` | `bg-canvas`, `bg-surface`, `bg-subtle` | The primary reading pairings |
| `fg-muted` | `bg-canvas`, `bg-surface` | Secondary text |
| `fg-link` | `bg-canvas`, `bg-surface` | Plus a non-color link affordance |
| `fg-on-emphasis` | `bg-accent-emphasis` | Primary button label |
| `fg-on-emphasis` | `bg-danger-emphasis` | Destructive action label |
| `fg-on-emphasis` | `bg-success-emphasis` | |
| `fg-on-emphasis` | `bg-warning-emphasis` | **The hard case.** Amber cannot carry white text at 4.5:1 and cannot carry near-black at 4.5:1 in every ramp. This pairing is decided deliberately in F00, not discovered during component work |
| `fg-on-emphasis` | `bg-info-emphasis` | |
| `fg-{intent}` | `bg-{intent}-subtle` | For each of accent, info, success, warning, danger |
| `fg-readonly` | `bg-surface` | F09 requires readonly at full contrast, so this is a 4.5:1 pairing, not an exempt one |

**Non-text pairings (3:1):**

| Foreground | Background | Note |
|------------|------------|------|
| `border-default` | `bg-canvas`, `bg-surface` | Table rules, card edges, input boundaries |
| `border-strong` | `bg-canvas`, `bg-surface` | |
| `border-focus` | `bg-canvas`, `bg-surface`, `bg-subtle` | |
| `border-focus` | `bg-accent-emphasis`, `bg-danger-emphasis`, `bg-success-emphasis`, `bg-warning-emphasis`, `bg-info-emphasis` | The focus ring must survive **every** emphasis surface. A single ring color cannot do this, which is why F00 specifies a two-part indicator |
| `border-focus` | any dark-sidebar surface produced by F02's subtree theming | |
| `border-selected` | `bg-selected`, `bg-surface` | |
| status icon `fg-{intent}` | `bg-canvas`, `bg-surface`, `bg-{intent}-subtle` | Icons carry meaning under rule 4, so they are non-text contrast, not decorative |

**Disabled:** WCAG exempts disabled controls from contrast requirements. Clara does not take the
exemption for *text* in disabled controls, because an ERP form is frequently mostly disabled and a
user still needs to read it. `fg-disabled` on `bg-disabled` targets 3:1 as a stated Clara-specific
floor. This is a deliberate choice to exceed the standard, recorded so it is not later "fixed".

**Enforcement:**

- [ ] The full matrix is generated to `tokens.pairings.json` at build time
- [ ] F02's automated contrast test iterates that file, in both light and dark
- [ ] The test asserts its row count matches this table, so a pairing silently dropped from the
      generator fails CI rather than passing vacuously
- [ ] Any pairing used by a component but absent from this table fails CI

### Relationships and Constraints

| Constraint | Enforcement |
|------------|-------------|
| Tier 2 references only tier 1 | Build-time validation in the token pipeline |
| Tier 3 references only tier 2 | Build-time validation |
| Component CSS references only tier 2 or tier 3 | CI lint rule over `packages/react/**/*.module.css` |
| Every semantic color pair meets AA contrast | Automated contrast test over the resolved token matrix, per theme |
| No orphan tokens (defined, never referenced) | Build-time report, warning not error |
| Token names are stable | Renaming a token is a breaking change under F21 |

### Storage Mechanisms

| What | Where | Format |
|------|-------|--------|
| Token definitions | `packages/tokens/src/**/*.json` | JSON, version controlled |
| Built CSS variables | `packages/tokens/dist/tokens.css` | Generated, published |
| Built TS constants | `packages/tokens/dist/tokens.ts` | Generated, published |
| Figma variable payload | `packages/tokens/dist/tokens.json` | Generated, consumed by Figma sync |
| Consumer theme preference | Consumer's responsibility (cookie or localStorage) | Clara documents the pattern, stores nothing |

---

## 8. Integration Map

### External Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| npm registry | Package distribution | Required |
| GitHub | Source, CI, releases | Required |
| GitHub Actions | CI and publish pipeline | Required |
| Chromatic (or Percy) | Visual regression baselines and review | Should-have; the visual gate can start as local snapshots |
| Vercel / Netlify / GitHub Pages | Docs site and Storybook hosting | Required |
| Figma | Design library (F26) | Deferred to v1.1 |

### Authentication Methods

| Integration | Method |
|-------------|--------|
| npm publish | Automation token or OIDC trusted publishing, stored as a repository secret |
| Chromatic | Project token, repository secret |
| Docs hosting | Git-based deploy, no additional credentials |
| Figma sync | Personal access token, used locally only, never in CI |

### Third-Party Dependencies

**Runtime (shipped to consumers) - kept deliberately small:**

| Dependency | Purpose | Justification |
|------------|---------|---------------|
| `@radix-ui/react-*` (or Base UI) | Behavioral primitives for dialog, popover, select, tooltip, menu, tabs | Solving WAI-ARIA for these correctly is months of work; the visual layer stays 100% Clara's |
| `clsx` | Class name composition | ~200 bytes, avoids a hand-rolled equivalent |
| A date library (to be decided) | Calendar math and locale for F12 | Reimplementing date math is a known source of bugs |

React and React DOM are peer dependencies.

**Build and development only:** TypeScript, Vite/tsup, Style Dictionary, Storybook, Vitest,
React Testing Library, axe-core, Playwright, Changesets, ESLint, Stylelint, Prettier,
Turborepo, publint, attw, size-limit.

---

## 9. Configuration Reference

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NPM_TOKEN` | npm publish authentication in CI | Yes (CI only) | none |
| `CHROMATIC_PROJECT_TOKEN` | Visual regression uploads | No | none |
| `FIGMA_ACCESS_TOKEN` | Local Figma token sync (F26) | No | none |

The library itself reads no environment variables at runtime.

### Consumer Configuration

Configuration is via props and data attributes, not files:

| Surface | Values | Default |
|---------|--------|---------|
| `<ClaraProvider theme>` | `"light" \| "dark" \| "system"` | `"system"` |
| `<ClaraProvider density>` | `"comfortable" \| "compact"` | `"comfortable"` |
| `data-clara-theme` | `"light" \| "dark"` | unset, follows `prefers-color-scheme` |
| `data-clara-density` | `"comfortable" \| "compact"` | `"comfortable"` |
| CSS custom property override | Any `--clara-*` semantic token | The token's defined value |

### Feature Flags

None. Clara ships no runtime flags; behavior differences are explicit props.

---

## 10. Quality Assessment

### Tested Functionality

Nothing yet. This is a greenfield project. The intended coverage is stated as the standard
every component must meet before export (F22, and the definition of done in Section 4):

- Unit and interaction tests via accessible queries
- Automated axe assertion per component
- Visual regression baseline per component, per theme, per density
- Keyboard interaction test for every documented shortcut
- Package publish verification against real Vite and Next.js applications

### Untested Areas

Areas where automation will not be sufficient and manual verification is planned:

- Screen reader announcement quality (as distinct from correct ARIA attributes). Automated
  tools verify attributes are present; only manual testing verifies the result is
  comprehensible.
- Perceived visual quality and the "does this look enterprise-credible" judgment.
- Real-world composition. A component can pass every test in isolation and still be awkward
  inside a dense form. Building one real screen is the only test for this.

### Technical Debt

Debt accepted knowingly at the outset, recorded so it is not rediscovered later as a surprise:

| Item | Rationale | Revisit when |
|------|-----------|--------------|
| Basic Table instead of a full DataGrid in v1 | Building a grid without a real application's requirements produces the wrong grid | First application needs 10k+ rows |
| No RTL support in v1 | No current requirement; logical CSS properties are used throughout so retrofitting stays cheap | An RTL locale is required |
| No mobile-first responsive layouts | ERP work is desktop work; responsive down to tablet only | A mobile use case appears |
| Single font stack (system UI) | Avoids a webfont loading strategy in v1 | Brand typography is required |
| Radix as a runtime dependency | Accepted trade: bundle cost and external API surface, in exchange for correct accessibility | If Radix's direction diverges from Clara's needs |
| Manual Figma sync | Automated bidirectional sync is disproportionate effort for one designer | The design library has more than one maintainer |

---

## 11. Decisions and Open Questions

### Decisions closed 2026-08-21

Recorded rather than deleted, so the reasoning survives and a later reader does not reopen settled
ground. Each is also promoted into the project decisions log (`sdlc-studio/decisions.md`), which is
the canonical home and the handoff context delegated agents read; the ids below are the ones
`decisions.py` allocated.

| # | Decision | Chosen | Reasoning |
|---|----------|--------|-----------|
| D0001 | npm scope and package names | `@luzentialabs/clara-tokens`, `-icons`, `-react` | A company scope, not a common-noun one. Registry search returns zero packages and zero text matches for "luzentia", so it is very likely free; `@clara` could not be confirmed, and short common-word scopes are frequently claimed-but-empty. The CSS prefix stays `--clara-`: the scope names the publisher, the prefix names the system |
| D0002 | License | MIT | Standard for design systems (Radix, Chakra, Mantine). Maximum reuse, usable in client work, no adoption friction |
| D0003 | Primitive layer | **Radix UI** | Mature, proven, largest community. For a solo maintainer, proven-and-stable beats actively-churning. Paired with the isolation rule (Section 4 rule 7) so the choice does not leak into Clara's permanent API and stays reversible |
| D0004 | Visual identity | Time-boxed to **5 working days** as F00 | The UX seat's documented failure mode is refining foundations indefinitely, and it asked to be capped rather than trusted. Component work starts on day 6 regardless |
| D0005 | Cascade strategy | `@layer clara.reset, clara.tokens, clara.components;` | Unlayered consumer CSS beats layered Clara CSS with no specificity contest. Cannot be retrofitted: adding layers post-1.0 would silently change every consumer override already shipped |
| D0006 | CSS delivery | One stylesheet per package, deliberately not tree-shaken | Simple, robust across bundlers, and honest. Forced the v0.1.0 per-component CSS budget to be restated as a fixed stylesheet ceiling plus JS-only per-component budgets |
| D0007 | Token visibility | Tier 2 public; tiers 1 and 3 private | Otherwise the boundary is an honor system and consumers settle it by overriding tier 3. Enforced via generated `tokens.public.json` |
| D0008 | Composition idiom | `as`, everywhere | v0.1.0 carried three idioms answering one question (`asChild`, `as`, `href`), breaking design principle 2 on paper before any code existed |

### Still open

- **Q:** Which date library for F12?
  **Context:** Affects bundle size, locale handling, and timezone semantics.
  **Options:** `date-fns` (tree-shakeable, familiar) / Temporal polyfill (future-proof,
  heavier today) / `@internationalized/date` (designed for exactly this use case, pairs with
  React Aria).

- **Q:** Should the first real application be built in parallel with v1, or after it?
  **Context:** This is the highest-risk question in this document. Design systems built
  without a consuming application reliably solve the wrong problems and over-build. Building
  one real ERP screen against Clara at roughly the 40% mark would surface API problems while
  they are still cheap to fix.
  **Recommendation:** Build a thin, real "reference application" inside the monorepo -
  one list screen and one form screen - starting as soon as the form components exist. Treat
  it as a first-class deliverable, not a demo.

- **Q:** Visual regression tooling - Chromatic or self-hosted Playwright snapshots?
  **Context:** Chromatic is excellent and effectively free at this scale, but adds an
  external service dependency. Playwright snapshots are free and local but need baseline
  management and are sensitive to rendering differences across machines.
  **Options:** Start with Playwright snapshots pinned to a CI container, and adopt Chromatic
  if baseline management becomes a burden.

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-08-21 | 0.1.0 | Initial PRD created. Scope set for v1.0: token system, theming, density, and 16 component families. DataGrid, app shell, and Figma library deferred to v1.1. Architecture decisions recorded: React-only, CSS variables plus CSS Modules, Radix primitives, monorepo with split packages, Storybook plus docs site. |
| 2026-08-21 | 0.2.0 | **Tier 1 conditions applied** from the four-seat team consultation (`reviews/prd-team-consult-2026-08-21.md`). Fixes verified defect D1 (tier 3 referenced an `accent` family tier 2 never defined). Adds: four missing semantic families (accent, selected, fg-readonly, focus) plus row-surface precedence; the legal pairing table with per-role thresholds (Section 7); the cascade layer contract and closed exports map (Section 4); the token visibility rule (F01); primitive isolation and single-idiom rules (Section 4 rules 7-9); F00 foundations pass as a blocking, time-boxed feature row. Closes 8 decisions, promoted to the decisions log as D0001-D0008. Restates the CSS size budget, which was unmeasurable as written. Open questions reduced from 7 to 4. |

---

> **Confidence Markers:** [HIGH] settled decision | [MEDIUM] intended approach, some detail unresolved | [LOW] speculative, expect change
>
> **Status Values:** Complete | Partial | Stubbed | Broken | Not Started
