# BG-01M0HTRM: Published packages declare one .d.ts for both import and require (attw FalseCJS)

> **Status:** inbox
> **Severity:** Medium
> **Points:** 2
> **Affects:** packages/tokens/package.json, packages/icons/package.json, packages/react/package.json
> **Created:** 2026-08-21
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

All three package manifests set the '.' export to types ./dist/index.d.ts with import ./dist/index.js and require ./dist/index.cjs, under "type": "module". A require consumer therefore receives ESM-shaped declarations - the attw FalseCJS case. TRD Section 9 CI gate 10 runs attw and fails on any error, so this fails the gate the moment a real build exists. Found by the anton-reis seat in the US-01M0GMPJ delivery review.

## Steps to Reproduce

1. Build any package so dist exists. 2. Run attw over the packed tarball. 3. Observe the FalseCJS diagnostic for the require condition.

## Proposed Fix

Emit a .d.cts alongside .d.ts and reference it under the require condition of the '.' export. Additive and cheap now; still cheap later, but the wrong shape is planted today.

## Acceptance Criteria

- [ ] **AC1** The behaviour described is corrected: All three package manifests set the '.' export to types ./dist/index.d.ts with import ./dist/index.js and require ./dist/index.cjs, under "type": "module".
- [ ] **AC2** The proposed fix lands, pinned by a test: Emit a .d.cts alongside .d.ts and reference it under the require condition of the '.' export.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Filed |
