# US-01M0NJZN: One chunk per client component so budgets are real

> **Status:** Draft
> **Created:** 2026-08-23
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/lib/chunk-plan.mjs, scripts/check-client-boundary.mjs, scripts/lib/finalize-dual.mjs, .size-limit.json
> **Epic:** EP-01M0GKNH
> **Points:** 5
> **Persona:** Sofia Marchetti

## User Story

**As a** Sofia Marchetti
**I want** to take only the client components I actually import
**So that** using one Clara button does not put every dialog, combobox and date picker into my client bundle

## Acceptance Criteria

- **AC1:** ### AC1: One chunk per built client component

- **Given** two or more built client components
- **When** the package builds
- **Then** each has its own chunk, named after it, carrying `"use client"` in both formats
- **Verify:** shell node scripts/check-client-boundary.mjs
- **Verification target:** functional

### AC2: A consumer takes only what it imports

- **Given** the built ESM output
- **When** a consumer imports one client component
- **Then** no other client component's code is reachable from that import
- **Verify:** vitest "per-component client chunks"
- **Verification target:** functional

### AC3: The budgets become per-component and real

- **Given** .size-limit.json
- **When** the budgets run
- **Then** each client component has its own JS budget, as AGENTS.md has always claimed
- **Verify:** shell pnpm size
- **Verification target:** functional

### AC4: The guard layer holds under the new shape

- **Given** many chunks rather than three
- **When** the full gate set runs
- **Then** pnpm check passes, every chunk is hash-matched, and no server or shared chunk imports any client chunk
- **Verify:** shell pnpm check
- **Verification target:** functional

## Summary

Give each client component its own chunk so a consumer importing Button does not take every other client component into their client bundle. Implements D0048, raised as F7 by the adversarial review of US-01M0MQYN. Server-capable components keep sharing clara-server (no directive, nothing to cross); cross-cutting modules keep sharing clara-shared. The placement guard, the bundle record and the size budgets all address chunks by name today, so each grows a per-component dimension.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-23 | sdlc-studio | Created via `new` (deterministic) |
