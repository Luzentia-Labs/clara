# CR-01M0HT8N: Low-severity bugs (consolidated)

> **Status:** inbox
> **Priority:** Low
> **Type:** Improvement
> **Date:** 2026-08-21
> **Consolidation:** low-severity-bugs
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1

## Summary

A themed consolidation of Low-severity findings that individually do not warrant a standalone artefact (triage noise control, schema v3). Triage the batch, then action or reject as one.

## Impact

Each finding here is Low-severity on its own; the batch is triaged, then actioned or rejected as one. Left unconsolidated, the same findings would each mint an artefact and drown the real signal.

**Points:** 3

## Consolidated Findings

- **Published tarballs will ship without a LICENSE file**: All three packages declare license MIT and files [dist]. npm auto-includes README and LICENSE only from the package directory, and LICENSE exists at the repo root only. Every published tarball would claim MIT while carrying no licence text. For a public library that is a real defect, not cosmetic. Found by the anton-reis seat in the US-01M0GMPJ delivery review.
- **Guard scripts read a hardcoded workspace layout instead of pnpm-workspace.yaml**: scripts/lib/workspace.mjs hardcodes the list of workspace roots rather than reading the globs from pnpm-workspace.yaml. Adding a tools or examples workspace entry makes all four guards blind to it at once, including check-private - so a publishable non-private manifest could live there undetected. Not fixed during the review pass: the layer-order and cycle blindness was fixed because a cycle silently corrupts, whereas this needs a new workspace glob to exist first. Found by the anton-reis seat in the US-01M0GMPJ delivery review.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Consolidation opened |
