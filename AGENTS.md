# clara - Agent Instructions

Clara is a design system and React component library for enterprise ERP web applications, published to npm as `@luzentialabs/clara-*`. This file is read at the start of
every session by your coding agent. It is the project's single source of truth for
how to work here; tool-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`)
should point to it rather than duplicate it.

## Operating doctrine

This project runs on the **sdlc-studio** skill. Before substantive work:

1. Read `.claude/skills/sdlc-studio/reference-doctrine.md` - the project-agnostic
   operating rules (the SDLC is the operating system; files are truth, indexes are
   derived; reconcile cadence; TDD by default).
2. Read `sdlc-studio/reviews/LATEST.md` for current orientation.
3. Run `/sdlc-studio status` then `/sdlc-studio hint` for the next concrete step.
   (`status`/`hint` also surface a one-line notice if a newer SDLC Studio release
   exists - run `/sdlc-studio skill-update` to take it, or it stays quiet until the
   next release. Opt out with `version_check.enabled: false` in `.config.yaml`.)
4. Recall relevant cross-project lessons (`/sdlc-studio lessons recall`).

**After any context compaction or reset** (a `/compact`, `/clear`,
auto-summarisation, or a fresh session), re-read `sdlc-studio/reviews/LATEST.md`
and run `/sdlc-studio status` before continuing. That file is a state snapshot,
not a transcript, so it survives compaction and re-orients you in one read - in
any agent (Claude Code, Codex, Copilot, opencode).

Do not restate the doctrine here. Capture below only what an agent cannot infer
from the code or the doctrine: this project's specifics.

## Non-negotiable gates

**IMPORTANT - never release to production until the full pre-release gate is green.**
In order, before tagging any release:

1. `/sdlc-studio reconcile --verify` - the executable AC gate. It runs every story's
   `Verify:` expression and fails on any `no` or `stale`. This is what makes "Done"
   mean done.
2. `/sdlc-studio review` - the full review set, **all five legs: PRD - TRD - TSD -
   Persona - CODE** (plus a **PVD** leg when the product spans repos and a
   `sdlc-studio/product/pvd.md` exists). The CODE leg is not optional; doc-only review
   never finds a crash bug, a deploy gap, or an untested hot path. The review confirms
   the **PRD requirements are met** (the Product Owner's sign-off) - and, where a PVD
   exists, the **PVD requirements are met** (the Product Manager's sign-off).

Triage and **fix** the findings before tagging. No exceptions - even a genuine
production hotfix files a `bug` (rationale + `Verify:` expression + audit pin).

**Review is independent of the author.** Whoever wrote the change never records its
sign-off. Two roles, never merged: an **adversarial reviewer** (a fresh context that
did not write the code) files findings as evidence, and a **reviewer of record** - the
operator, or a named delegate in a separate trust boundary - approves. With
`review.two_role_after` set in `.config.yaml`, a unit holds at Review until that
sign-off lands.

**Index & verification conventions.** Keep **one canonical status summary** per `_index.md` - the
`| Status | Count |` table with a `**Total**` row, which `reconcile` maintains. Per-section / per-epic
count tables are author-maintained; do not give them a `Total` row (reconcile would treat them as the
global summary). For a human-checked AC, write `Verify: manual <what to check>` so it is counted
*manual*, never shelled out - and never hand-stamp `Verified:` for an AC a machine did not check.

Every substantive change flows through the skill:
**CR / RFC -> Epic -> Story -> code plan -> code implement -> code verify ->
reconcile -> review.** No ad-hoc coding. Default to TDD: author the `Verify:`
expression or failing test first, then make it pass.

**The engagement floor (hard rule, not judgement):** when a change touches more than
one source file in this repo, derive the specification delta FIRST - name every
existing requirement the change interacts with and how each interaction is resolved -
and write acceptance criteria (one per interaction) before any code. Scale-to-size
judgement applies only above this floor. Why a rule: measured on the base models most
teams run, judgement-gated engagement produced the same defect rate as no process,
while the mandated pass cut it 4-5x for ~10-20% more tokens (see the skill's
benchmarks). Operators may opt out with `engagement_floor: judgement` in
`sdlc-studio/.config.yaml`; the default is the floor.

## How to work

1. **Think before coding.** State assumptions explicitly. If multiple readings exist,
   surface them rather than picking silently. If a simpler approach exists, say so.
2. **Simplicity first.** The minimum code that satisfies the story's acceptance
   criteria. Nothing speculative - no abstraction for single-use code, no
   configurability that was not asked for.
3. **Surgical changes.** Touch only what the story requires. Match the existing style.
   Ship the paperwork (PRD / TRD / capability tables) in the same commit as the code.
4. **Goal-driven autonomous execution.** Set the goal to complete every task in the
   approved plan or wave **autonomously, without human intervention**. The SDLC's own
   gates (consult, verify, test, check, reconcile) ARE the review - run each wave
   through to ship plus reconcile. Do not stop mid-execution. Stop only for: a genuine
   technical blocker the SDLC cannot resolve, an explicit operator pause, or a
   destructive / hard-to-reverse action (force-push, branch or table deletion, sending
   an external message).
   - **When you need another opinion, consult personas instead of stopping.**
     `/sdlc-studio consult team` (Three Amigos: Product Owner, Engineering, QA) on any epic or
     story design. `/sdlc-studio consult stakeholders` when the change touches the
     running system. Concerns are advisory - record them and proceed unless one is a
     hard technical blocker.
5. **Use the deterministic tooling - never hand-roll what it wires.**
   - **Bootstrap with `init`** (it creates the directory tree, the per-type `_index.md`
     files, config, and the agent-instructions). After `init` the first `new` of any type is
     indexed - a bare `indexed=false` means "no index yet", not "the tool does not index".
   - **Create every artifact with the non-interactive script - it is the canonical path:**
     `python3 <skill>/scripts/artifact.py new --type bug --title "..."
     --affects "a.py, b.py" --points 3` (same for cr / story / epic / rfc; a finding with
     repro + fix travels better through `scripts/file_finding.py file`). A bug or a CR must
     name the files it touches and its size - both creators refuse one that cannot be
     planned. It allocates a collision-free id, writes the file,
     appends the index row, and wires a story into its parent epic. The interactive
     `/sdlc-studio bug create` is a convenience wrapper that delegates to the same
     allocation - headless agents call the script. **Never hand-allocate ids or hand-author
     `_index.md`** - the file is truth, the index is derived. For many at once use
     `artifact.py batch` (one atomic pass).
   - **Pass prose as a document, not as a shell argument:** every writer that takes free
     text takes `--fields-file FIELDS.json` (or `-` to read it from stdin), because a
     backtick in a flag value is run by the shell rather than stored - see the script
     contract in `reference-scripts.md` for which writers and what the flag path still does.
   - **Fan out only over pre-wired scaffolds.** Delegated sub-agents fill **content**; the
     tool owns structure (ids, slugs, filenames, links, index).
   - **The index is derived:** run `reconcile` / `reconcile fields` / `validate` to sync;
     never hand-copy file-owned cells (story points, titles).
   - **A story reaches Done only when its executable ACs pass.** Author `Verify:` lines in the
     DSL (`jest`/`pytest`/`http`/`manual`) against the real runner; `transition -> Done` is
     gated on the verify result. Record load-bearing decisions in `decisions.md`, not scattered.
   - **Foundation first, then sprint.** Build the foundation epic by hand to a green gate
     (it sets conventions every later story inherits); sprint needs a runnable gate, so
     hand subsequent epics to `sprint --epic EPxx --goal done` once it is green.

## Project specifics

Fill these in. This is the part an agent cannot infer.

- **Stack:** TypeScript (strict), React 18 and 19, CSS custom properties + CSS Modules,
  Radix UI primitives, Style Dictionary, pnpm workspaces + Turborepo, Vitest + React Testing
  Library, Playwright, Storybook, Changesets. Node 20 LTS+ for builds. **No code exists yet** -
  the repo is currently specifications only.
- **Run / build / test:** not yet established. The toolchain lands with the foundation epic.
  Until then there is no build or test command to run, and any claim that one passes is false.
- **Deploy & CI:** publish to public npm under the `@luzentialabs` scope, automated from the
  default branch, gated on green CI. Releases are **immutable** - a bad release is fixed forward
  with a patch, never unpublished.
- **Config & secrets:** the library reads no environment variables at runtime. CI secrets only:
  `NPM_TOKEN`, optionally `CHROMATIC_PROJECT_TOKEN`, `FIGMA_ACCESS_TOKEN` (local use only, never
  in CI). Never commit any of them.
- **Code style:** American English. No em-dashes in prose. No `any` in a public API. Prop types
  use literal unions, never bare `string`, wherever the value set is closed. Component CSS may
  reference tier 2 and tier 3 tokens only - a tier 1 reference or a raw literal fails CI.
- **Architecture & services:** layered token-first monorepo. `@luzentialabs/clara-react` depends
  on `-icons` depends on `-tokens` depends on `tokens/*.json`. No service topology; this is a
  library with no backend and no network calls. See PRD §1.
- **Gotchas (all of these are permanent-if-wrong):**
  - **Publishing is a one-way door.** A renamed prop, exported name, or tier 2 token breaks
    consumers already shipped. Check the public surface diff before the implementation.
  - **Cascade layers are load-bearing.** All Clara CSS emits inside
    `@layer clara.reset, clara.tokens, clara.components;`. This cannot be retrofitted - adding
    it later silently changes specificity for every consumer override in existence.
  - **Radix must not leak.** `asChild`, `onOpenChange`, and `data-state` are never Clara API.
    `as` is Clara's single polymorphism idiom (Section 4 rules 7-8).
  - **Tier 2 tokens are public API; tiers 1 and 3 are not.** See PRD F01.
  - **CSS is deliberately not tree-shaken.** One `styles.css` per package. Per-component budgets
    apply to JavaScript only.
  - **Accessibility is split across two seats on purpose.** Idris (ux) decides inclusive design;
    Mira (qa) proves it. Neither may assume the other covered it.

## Current state (2026-08-21)

Specifications only - no code, no toolchain, no tests. PRD is at v0.2.0 with Tier 1 review
conditions applied. Four working seats are accepted in `sdlc-studio/personas/seats/`.
**F00 (the 5-working-day foundations pass) blocks F01 and therefore blocks every component.**
Outstanding from the team consultation: Tier 2 (9 conditions), Tier 3 (12), operator calls (6),
open questions (3). See `sdlc-studio/reviews/prd-team-consult-2026-08-21.md`.

## Don't

- Don't grow this file with per-ship narrative - that is what `git log`, spec detail
  blocks, and `sdlc-studio/reviews/LATEST.md` are for.
- Don't use a library from memory - query current API docs first; training data is stale.
- Don't mark a generated spec Done without tests. Generated specs are migration
  blueprints, not documentation, and never auto-promote to Done.
- Don't write a temp file to a shared, generically-named path when other agents may be
  running - a commit message, a fields-file, a worklist. Namespace it per agent or per run,
  or keep it inside your own worktree. A worktree isolates the tree, not `/tmp`: this has
  landed a commit carrying another agent's subject, in two consecutive sprints.
