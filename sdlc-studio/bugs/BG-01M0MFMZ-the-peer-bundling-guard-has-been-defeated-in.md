# BG-01M0MFMZ: The peer-bundling guard has been defeated in seven consecutive review rounds and needs a structural change, not another oracle

> **Status:** Fixed
> **Triaged-by:** Richard Dale Umayan; human; v1
> **Created:** 2026-08-22
> **Created-by:** sdlc-studio new
> **Raised-by:** sdlc-studio; agent; v1
> **Affects:** scripts/lib/bundle-record.mjs, scripts/check-bundled-peers.mjs, packages/tokens/record.config.mjs
> **Severity:** Critical
> **Points:** 8

## Summary

Seven independent adversarial reviews, seven defeats, each by a different root cause: React 18 marker strings (round 2, beaten by React 19 + minification); a regex for a bare `react` specifier in output (round 3, beaten by a @license comment containing `from "react"`); grepping source for `react` (round 3, beaten by `jsx: react-jsx` so no component names React); reading the bundler's record (round 4, beaten by a FILENAME deciding whether to read it); deleting that filename test (round 5, beaten because the fix relocated it into a writer that FABRICATED records); binding record to bytes with sha256 (round 6, beaten because the `inlined` list was still derived rather than observed); and now `describeArtifacts` (round 7, beaten two independent ways). Round 7's reproduction: three small edits give a 77,222-byte React-bearing `dist/index.js` with sha256-correct records, and `pnpm check` reports 13/13 PASS plus clean publint, attw and size-limit. A second kill needs no bundler at all - a 10-line script writing correct hashes passes, while `check-bundled-peers.mjs:96` tells the reader 'Only scripts/lib/bundle-record.mjs may write a record', an invariant nothing enforces.

## Steps to Reproduce

1. packages/react/vite.config.ts: remove bundleRecord() from plugins and remove rollupOptions.external. 2. Add packages/react/record.config.mjs copying the tokens pattern - entry src/index.ts, write:false, describeArtifacts:['dist/index.js','dist/index.cjs'], external still set. 3. Append `vite build --config record.config.mjs` to the build script. 4. pnpm build && pnpm check -> 13/13 PASS with React inlined.

## Proposed Fix

The reviewer's own conclusion after seven rounds: 'another oracle rewrite will not close this - six of seven defeats were the oracle was right and something upstream chose what it looked at.' Two structural options, both bigger than a patch. (a) Delete describeArtifacts and require every published package's shipped bytes to BE the output of the bundler run that wrote the record - which means clara-tokens moves to a Vite build, contradicting D0028, or runs its record pass over dist. (b) Stop trusting a committed file: have the guard re-run the bundler itself, or sign the record with something only the plugin holds. Note that deriving the graph from the shipped artifact's own bytes does NOT work: inlining destroys the module boundary, so Rollup parsing a React-inlined dist/index.js reports zero external imports and one module. Whichever is chosen, the current message at check-bundled-peers.mjs:96 must stop asserting an invariant nothing enforces.

## Acceptance Criteria

**Rewritten 2026-08-23.** The criteria below replace four that all asked for a better oracle over
our own build output. D0042 abandoned that approach after seven defeats: every oracle inspected an
artifact we also produce, so each fix moved the trust boundary instead of closing it. These ask the
question in a consumer, where there is no such loop.

- [x] React resolves, from the installed `clara-react`, to the CONSUMER's own copy - checked in an app that installed the published tarball outside this workspace.
- [x] No nested `react` is installed beside `clara-react` in a consumer.
- [x] No shipped chunk contains React itself rather than a reference to it.
- [x] The check runs as a blocking CI gate and on the publish path, not as a local convenience.

**Verification depth:** functional

- **Verify:** shell node scripts/verify-consumers.mjs --app verify-vite
- **Verified:** yes (2026-08-23, US-01M0GMDV)

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-08-22 | sdlc-studio | Created via `new` (deterministic) |

## Resolution (2026-08-23)

Closed by **US-01M0GMDV**, per **D0042** - not by an eighth oracle rewrite.

The pattern across all seven defeats was the same: every oracle inspected an artifact we also
produce, so each fix moved the trust boundary rather than closing it. Marker strings, an output
regex, a source grep, a filename gate, a relocated test that fabricated records, a derived
`inlined` field, and `describeArtifacts` letting a caller name the files to hash - seven different
root causes, one shape.

`scripts/verify-consumers.mjs` asks the question where it cannot be gamed: in a consumer that
installed the published tarball, outside this workspace, with npm. It asserts that React resolves
from `clara-react` to the CONSUMER's copy, that no nested `react` was installed beside it, and that
no shipped chunk contains React itself rather than a reference to it. If those hold, the property
holds regardless of how our build reached that state.

Wired as CI gate 14 and into the publish path.
