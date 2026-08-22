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

/**
 * Point every RELATIVE require at the renamed file.
 *
 * Deliberately scoped to the inside of a `require(...)` call rather than replacing `.js` in the
 * text: a `.js` inside an ordinary string is not a specifier, and rewriting it would corrupt data.
 * Bare specifiers are package names and must never be touched.
 */
export function rewriteCjsSpecifiers (source) {
  return source.replace(
    /(require\(\s*)(['"])(\.\.?\/[^'"]+?)\.js\2(\s*\))/g,
    (_m, open, quote, path, close) => `${open}${quote}${path}.cjs${quote}${close}`,
  )
}
