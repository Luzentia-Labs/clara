/**
 * The Clara cascade layer contract.
 *
 * D0005 / TRD:318: all Clara CSS is emitted inside
 * `@layer clara.reset, clara.tokens, clara.components;`
 *
 * Under CSS Modules, stylesheet ORDER decides the cascade rather than attribute order (TRD:571), so
 * without this declaration whether a consumer's class beats a Clara class depends on bundler
 * ordering nobody controls - and the usual escape is `!important`. Declaring the order by contract
 * removes the question: anything a consumer writes UNLAYERED outranks every Clara layer.
 *
 * **This cannot be retrofitted.** Adding it after release silently changes the resolved style of
 * every consumer override already written against the unlayered sheet (AGENTS.md, D0005). That is
 * why it lands before the first component rather than with it.
 */
export const LAYER_NAMES = ['clara.reset', 'clara.tokens', 'clara.components']
export const LAYER_DECLARATION = `@layer ${LAYER_NAMES.join(', ')};`

/** The layer a stylesheet's own rules belong in. */
export const LAYER_FOR = { tokens: 'clara.tokens', components: 'clara.components', reset: 'clara.reset' }

/**
 * Wrap a stylesheet's rules in its layer and prepend the ordering declaration.
 * Idempotent: a sheet that already declares the order is returned unchanged, so a second pass
 * cannot produce the two-declaration case the guard rejects.
 */
export function applyCascadeLayer (css, layer) {
  if (css.includes('@layer clara.')) return css
  if (!LAYER_NAMES.includes(layer)) {
    throw new Error(`unknown Clara layer "${layer}" - expected one of ${LAYER_NAMES.join(', ')}`)
  }
  const banner = css.match(/^\s*\/\*[\s\S]*?\*\/\s*/)
  const head = banner ? banner[0].trimEnd() : ''
  const body = banner ? css.slice(banner[0].length) : css
  const indented = body.trim().split('\n').map((l) => (l.trim() ? '  ' + l : l)).join('\n')
  return `${head}\n${LAYER_DECLARATION}\n\n@layer ${layer} {\n${indented}\n}\n`.trimStart()
}
