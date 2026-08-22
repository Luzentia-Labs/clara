# Server and client boundaries

Generated from `client-boundary.json`. **Edit the JSON, not this file** - the JSON is build input,
and `check-client-boundary.mjs` reads it. This page is for humans.

## The rule (TRD Section 7)

A component is **client-only** if its public props include a function, or if it uses state,
effects, refs, or browser APIs internally. Everything else is **server-capable and carries no
directive**.

That second half is the part that is easy to lose. Marking the whole package `"use client"` would
make this file pass trivially and would also force every consumer into a client boundary - the
exact outcome PRD F23 exists to prevent.

## Classification

14 server-capable, 25 client-only, 0 built so far.

| Server-capable (no directive) | Client (`"use client"`) |
| --- | --- |
| Avatar | Button |
| Badge | ButtonGroup |
| Box | Checkbox |
| Card | Combobox |
| DescriptionList | DatePicker |
| Divider | DateRangePicker |
| EmptyState | Dialog |
| Grid | Drawer |
| Heading | DropdownMenu |
| Inline | Field |
| Skeleton | IconButton |
| Stack | Input |
| Tag | Menu |
| Text | MultiSelect |
|  | Pagination |
|  | Popover |
|  | Radio |
|  | RadioGroup |
|  | Select |
|  | Switch |
|  | Tabs |
|  | Textarea |
|  | TimePicker |
|  | Toast |
|  | Tooltip |

### Components that split

| Component | Boundary |
| --- | --- |
| `Table` | Static parts are server-capable; interactive parts (sort, select, resize) are client. |
| `Alert` | Non-dismissible is server-capable; a dismissible Alert takes onDismiss and is therefore client. |

## How this is enforced

`check-client-boundary.mjs` runs in `pnpm check` and CI. It is driven by **what the package
exports**, not by the list below - a guard keyed off the list would report a healthy count while an
unclassified component shipped beside it. It fails when:

- a component is exported but absent from `client-boundary.json`
- a component is exported while still marked `planned`
- a component marked `built` + `client` ships without `"use client"` in **both** ESM and CJS

## Known gap

The third rule cannot yet be satisfied. Vite's library build **drops module-level directives** and
downgrades it to a warning, and a single bundled chunk has one top - so the directive is either on
everything or on nothing, and neither matches the rule above. Tracked as **CR-01M0MK20**, which
must land before the first client component is published. The guard is already wired, so that
component cannot ship unmarked in the meantime.
