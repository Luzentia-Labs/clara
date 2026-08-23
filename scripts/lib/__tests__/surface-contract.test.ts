import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { checkSurface } from '../surface-contract.mjs'

const iface = (name: string, body: string) => `// @public\nexport declare interface ${name} {\n${body}\n}\n`

describe('checkSurface', () => {
  it('passes a surface that keeps every rule', () => {
    expect(checkSurface('p', iface('ButtonProps', "    variant?: 'primary' | 'secondary';"))).toEqual([])
  })

  it.each(['asChild', 'onOpenChange', 'data-state', 'portalContainer'])('rejects %s', (prop) => {
    const out = checkSurface('p', iface('DialogProps', `    ${prop}?: boolean;`))
    expect(out.join(' ')).toContain(prop)
  })

  // Solving subtree theming with props would mean the same props on nine overlays, permanently.
  it.each(['theme', 'density'])('rejects %s on a component that is not a theming provider', (prop) => {
    const out = checkSurface('p', iface('DialogProps', `    ${prop}?: 'light' | 'dark';`))
    expect(out.join(' ')).toContain('propagate')
  })

  it.each(['ClaraProviderProps', 'ClaraScopeProps'])('allows theme and density on %s', (name) => {
    expect(checkSurface('p', iface(name, "    theme?: 'light' | 'dark';\n    density?: 'compact';"))).toEqual([])
  })

  it('rejects a Radix type in the surface', () => {
    expect(checkSurface('p', "import { Root } from '@radix-ui/react-dialog';").join(' ')).toContain('Radix')
  })

  it('rejects an explicit any, which tsc cannot flag', () => {
    expect(checkSurface('p', iface('BoxProps', '    sneaky: any;')).join(' ')).toContain('`any`')
  })

  it('allows an `as any` cast, which is not a public signature', () => {
    expect(checkSurface('p', iface('BoxProps', '    a: string;')).concat(checkSurface('p', 'const x = y as any'))).toEqual([])
  })

  it('rejects a closed-set prop typed as bare string', () => {
    expect(checkSurface('p', iface('ButtonProps', '    variant?: string;')).join(' ')).toContain('literal union')
  })

  it('ignores rule text that appears only in a comment', () => {
    expect(checkSurface('p', '// asChild is never Clara API\n// theme?: never\n')).toEqual([])
  })
})
