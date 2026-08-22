# CR-01M0HWDQ: The CSS Modules half of the build pipeline is not yet proven end to end

> **Status:** Approved
> **Triaged-by:** Richard Dale Umayan; human; v1
> **Priority:** Medium
> **Type:** Improvement
> **Size:** S
> **Affects:** packages/react/src/styles.css, packages/react/vite.config.ts, packages/react/src/css-modules.d.ts
> **Date:** 2026-08-21
> **Created-by:** sdlc-studio file
> **Raised-by:** sdlc-studio; agent; v1
> **Raised-in-batch:** none open - raised outside a delivery batch

## Summary

US-01M0GM9N AC1 reads 'ESM, CJS, and .d.ts are emitted with CSS Modules compiled to one stylesheet'. The build emits one stylesheet and the AC verifier passes, but the stylesheet is produced from a PLAIN CSS file, not a CSS Module. Vite compiles a CSS Module to a JS module whose default export is the class map, so a CSS Module imported only for its side effect is removed by the bundler and emits nothing - confirmed empirically during implementation, three ways (side-effect import, value import bound to an unused const, and treeshake.moduleSideEffects: true). A CSS Module needs a consuming component to survive, and US-01M0GM9N owns the pipeline, not components. The ambient declaration for '*.module.css' is in place at packages/react/src/css-modules.d.ts, so the type side is ready; only the build-output side is unproven. This is a coverage gap, not a defect: nothing is broken today.

## Impact

Low today, and it closes naturally. The first component story replaces the seed stylesheet with a real CSS Module. What must not happen is that story assuming this one already proved the path: if the CSS Module pipeline is misconfigured, the failure appears as missing styles in a shipped package rather than as a build error. The first component story should assert dist/styles.css contains its hashed class name.

## Acceptance Criteria

- [ ] The first component's CSS Module is compiled into packages/react/dist/styles.css, asserted by grepping the emitted stylesheet for that component's hashed class name rather than for the file's existence.
- [ ] The seed rule --clara-stylesheet-present is gone from dist/styles.css, because a real component stylesheet has replaced it.
- [ ] A CSS Module that no surviving module consumes fails the build loudly rather than emitting nothing, so the tree-shaking trap cannot recur silently.

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-21 | sdlc-studio | Raised |
