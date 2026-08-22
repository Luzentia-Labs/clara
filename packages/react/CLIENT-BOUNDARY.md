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

## Known limit: one client chunk for all client components

`"use client"` boundaries are module-granular, so a consumer importing only `Button` takes the
whole client chunk as one client reference - `Dialog`, `Combobox`, `DatePicker` and the rest come
with it. D0041 rejected `preserveModules` on pipeline grounds and this is the cost of that choice;
it runs against "per-component budgets apply to JavaScript only" (AGENTS.md).

Nothing currently surfaces the growth: `.size-limit.json` measures `dist/index.js`, which follows
the chunks today but reports one number. Recorded here rather than discovered at component 20.
Raised by review F7 against US-01M0MQYN.

## Known gap

**Closed 2026-08-22.** CR-01M0MK20 landed as US-01M0MQYN: the build is cut into a client chunk, a
server chunk and a shared chunk, and the directive is stamped on the client chunk in both formats.

The guard now checks four things, not one: the directive is on the client chunk in ESM and CJS; it
is on neither the entry, the server chunk nor the shared chunk; each built component's code is in
the chunk its boundary requires (read from the bundle record, so co-location and flat files are
both handled); and no server or shared chunk imports the client chunk, which would put
server-capable code behind the client boundary.
