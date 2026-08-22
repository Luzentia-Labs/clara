/**
 * The `"use client"` directive, and the CJS rename it has to survive.
 *
 * Two operations that only exist because of how the chunked build is finalized:
 *
 *   1. A directive is only a directive when it is the FIRST statement. Anywhere else it is an
 *      ordinary string expression - which is precisely how bundlers lose it, silently.
 *   2. `finalize-dual` renames the CJS pass's `.js` files to `.cjs`. With one flat file that was
 *      harmless. With chunks it is not: `index.cjs` requires `./clara-client.js`, which no longer
 *      exists after the rename, so the built package throws MODULE_NOT_FOUND on first require.
 */

export const USE_CLIENT = '"use client";'

const HAS_DIRECTIVE = /^\s*(?:#![^\n]*\n\s*)?['"]use client['"]/

/** Put the directive first, above everything except a shebang. Idempotent. */
export function prependDirective (source) {
  if (HAS_DIRECTIVE.test(source)) return source
  // A shebang must stay on line 1 or the file stops being executable; the directive goes under it.
  const shebang = source.match(/^#![^\n]*\n/)
  return shebang
    ? shebang[0] + USE_CLIENT + '\n' + source.slice(shebang[0].length)
    : USE_CLIENT + '\n' + source
}

// `rewriteCjsSpecifiers` used to live here. It is deleted rather than fixed.
//
// D0045 made it dead: each format now names its chunks with its own extension, so Rollup emits
// requires that already resolve and there is nothing to rewrite. Its only remaining reachable
// behaviour was corruption - it matched `require("./x.js")` anywhere in the text, including inside
// a string literal and inside a comment, so a component rendering that text as data produced
// DIFFERENT DOM in the ESM and CJS builds (a hydration mismatch, in the change whose purpose is
// preventing them) and then wedged the build with "the record is stale or fabricated", which no
// rebuild could clear. A regex that edits JavaScript source it did not parse was the eighth
// instance of that mistake in this repo.
