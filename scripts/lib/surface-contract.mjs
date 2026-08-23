/**
 * The rules a published API surface must satisfy (AGENTS.md, D0003, D0018, TRD ADR-004).
 *
 * Pure, so the rules can be driven with a crafted report. Inline in the guard they could only be
 * exercised by editing a real `.api.md` - which api-extractor's own drift check rejects first, so
 * the rules themselves were never actually proven to fire.
 */

/** Props that are somebody else's API, never Clara's. */
const FORBIDDEN_PROPS = ['asChild', 'onOpenChange', 'data-state', 'portalContainer']
/** Props whose value set is closed, so a bare `string` throws the type information away. */
const CLOSED_SET_PROPS = /\b(variant|size|tone|intent|density|align|justify|direction|status|placement)\??:\s*string\b/
/** Taking `theme` or `density` is these components' entire job; they are not overlays. */
const THEMING_PROVIDERS = /Clara(Provider|Scope)Props/

export function checkSurface (pkgName, report) {
  const problems = []
  // Comments carry prose that would false-positive on every rule below.
  const surface = report.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')

  if (/@radix-ui/.test(surface)) {
    const lines = surface.split('\n').filter((l) => l.includes('@radix-ui')).slice(0, 3)
    problems.push(
      `${pkgName}: a Radix type reaches the public surface (D0003, TRD ADR-004): ${lines.join(' | ')}. ` +
        "Radix is an implementation detail; `as` is Clara's single polymorphism idiom.",
    )
  }

  for (const prop of FORBIDDEN_PROPS) {
    const hit = surface.split('\n').find((l) => new RegExp(`\\b${prop.replace('-', '\\-')}\\b`).test(l))
    if (hit) {
      problems.push(
        `${pkgName}: \`${prop}\` is in the public surface - it is not Clara's API ` +
          `(AGENTS.md, Section 4 rules 7-8): ${hit.trim().slice(0, 100)}`,
      )
    }
  }

  // theme / density on anything that is not a theming provider. Solving subtree theming with props
  // would mean the same props on nine overlays, permanently; it is solved once, in the architecture.
  for (const block of surface.split(/(?=export declare interface )/)) {
    const name = block.match(/export declare interface (\w+)/)?.[1]
    if (!name || THEMING_PROVIDERS.test(name)) continue
    const hit = block.split('\n').find((l) => /^\s+(theme|density)\??:/.test(l))
    if (hit) {
      problems.push(
        `${pkgName}: ${name} takes \`${hit.trim().split(/[?:]/)[0]}\` - theme and density propagate ` +
          'through context, never as props (TRD Section 4 rule 2, D0018)',
      )
    }
  }

  // `tsc --noEmit` cannot flag an explicit `any`, so gate 1's stated contract needs this.
  for (const line of surface.split('\n')) {
    if (/(?::|<|,|\()\s*any\b/.test(line) && !/\bas any\b/.test(line)) {
      problems.push(`${pkgName}: \`any\` in a public signature (AGENTS.md): ${line.trim().slice(0, 100)}`)
      break
    }
  }

  for (const line of surface.split('\n')) {
    if (CLOSED_SET_PROPS.test(line)) {
      problems.push(
        `${pkgName}: a closed-set prop is typed as bare \`string\` (AGENTS.md): ${line.trim().slice(0, 100)} ` +
          '- use a literal union; widening later is fine, narrowing is breaking.',
      )
    }
  }

  return problems
}

export { FORBIDDEN_PROPS }
