# CR-01M0HTB4: Low-severity crs (consolidated)

> **Status:** inbox
> **Priority:** Low
> **Type:** Improvement
> **Date:** 2026-08-21
> **Consolidation:** low-severity-crs
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1

## Summary

A themed consolidation of Low-severity findings that individually do not warrant a standalone artefact (triage noise control, schema v3). Triage the batch, then action or reject as one.

## Impact

Each finding here is Low-severity on its own; the batch is triaged, then actioned or rejected as one. Left unconsolidated, the same findings would each mint an artefact and drown the real signal.

**Points:** 3

## Consolidated Findings

- **TRD contradicts itself on tokens.pairings.json reachability**: TRD Section 5 lists tokens.pairings.json in the published surface for clara-tokens, but the closed exports table in the same section omits it, so consumers cannot reach it. The delivered manifest correctly follows the closed table. The contrast test reads the file inside the repo, so nothing is broken today, but the TRD promises a subpath it also forbids. Found by the anton-reis seat in the US-01M0GMPJ delivery review.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Consolidation opened |
