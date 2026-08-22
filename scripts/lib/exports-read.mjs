/**
 * The component names a built ESM bundle exports.
 *
 * The first version was `/^export\s*\{([^}]*)\}/gm` filtered by `/^[A-Z][A-Za-z0-9]*$/`, and the
 * review defeated it twice. `^export` under /m needs the statement at the start of a line, so a
 * minified bundle - `const Button=()=>null;export{Button,Card};` on one line - reported zero
 * exports and passed while two unclassified components shipped. This build minifies, so that is
 * the shape to expect once components exist, not a hypothetical. The name filter then rejected
 * anything containing `_` or `$`, silently DROPPING those names rather than reporting them.
 */

/** A JS identifier, including the `_` and `$` a bundler emits and a component may legitimately use. */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export function exportedNames (source) {
  const names = new Set()

  // `export { a, b as c }` anywhere in the file, minified or not.
  for (const m of source.matchAll(/\bexport\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = (part.includes(' as ') ? part.split(' as ').pop() : part).trim().replace(/^["']|["']$/g, '')
      if (IDENTIFIER.test(name)) names.add(name)
    }
  }
  // `export const Foo`, `export function Foo`, `export class Foo`.
  for (const m of source.matchAll(/\bexport\s+(?:declare\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(m[1])
  }
  // CJS: `exports.Foo = ...`.
  for (const m of source.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)) names.add(m[1])

  names.delete('default')
  // Components are the capitalised half of the surface; hooks (`useX`) and types are not what the
  // boundary gate classifies. Names are collected first and filtered here, so a name that is not a
  // component is excluded on purpose rather than lost to a pattern that never matched it.
  return new Set([...names].filter((n) => /^[A-Z]/.test(n)))
}
