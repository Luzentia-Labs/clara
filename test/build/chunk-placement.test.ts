// @vitest-environment node
//
// Node, not jsdom: this test runs a real Vite build, and esbuild's TextEncoder invariant
// fails under jsdom's globals.
import { describe, it, expect, beforeAll } from 'vitest'
import { build } from 'vite'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error - .mjs helpers, no declarations
import { manualChunks, CLIENT_CHUNK, SERVER_CHUNK, SHARED_CHUNK, isClientChunk } from '../../scripts/lib/chunk-plan.mjs'
// @ts-expect-error - .mjs helper
import { prependDirective } from '../../scripts/lib/directive.mjs'

/**
 * An END-TO-END placement test, over the shapes that actually break placement.
 *
 * The unit tests drive `chunkFor` with synthetic strings, and the guard mutations hand-edit the
 * bundle record. Neither proves the REAL build puts a real component in the right chunk - and the
 * shipping package has only two components, both written `export function`, which is the one shape
 * the old reader handled. So a broken reader and a working one produced identical green runs, and
 * two Criticals shipped that way.
 *
 * Every fixture below is a shape that defeated a previous implementation:
 *   - a default-exported arrow const, the most common React idiom
 *   - a `*Provider`, which a suffix heuristic classified as "not a component"
 *   - a client component co-located inside a server component's directory
 *   - a helper shared by both sides, which must land in a chunk NEITHER owns
 *   - a plain constant under components/, which must not be mistaken for a component
 */
const FIXTURES: Record<string, string> = {
  'src/components/Switch/Switch.tsx':
    "import { useState } from 'react'\n" +
    'const Switch = ({ on }: { on?: boolean }) => { const [v] = useState(on); return <i>{String(v)}</i> }\n' +
    'export default Switch\n',
  'src/components/Theme/ThemeProvider.tsx':
    "import { useState, type ReactNode } from 'react'\n" +
    'export function ThemeProvider ({ children }: { children?: ReactNode }) { const [t] = useState(1); return <div data-t={t}>{children}</div> }\n',
  'src/components/Table/Table.tsx':
    "import { label } from '../../lib/label'\n" +
    'export function Table () { return <table data-l={label(1)} /> }\n',
  'src/components/Table/TableSortButton.tsx':
    "import { useState } from 'react'\n" +
    "import { label } from '../../lib/label'\n" +
    "export function TableSortButton () { const [d] = useState('asc'); return <button>{label(d)}</button> }\n",
  'src/components/Button/variants.ts': "export const BUTTON_VARIANTS = ['primary', 'secondary']\n",
  'src/lib/label.ts': 'export const label = (v: unknown) => String(v)\n',
  'src/index.ts':
    "export { default as Switch } from './components/Switch/Switch'\n" +
    "export { ThemeProvider } from './components/Theme/ThemeProvider'\n" +
    "export { Table } from './components/Table/Table'\n" +
    "export { TableSortButton } from './components/Table/TableSortButton'\n" +
    "export { BUTTON_VARIANTS } from './components/Button/variants'\n",
}

const CLASSIFICATION = {
  components: [
    { name: 'Switch', boundary: 'client', status: 'built' },
    { name: 'ThemeProvider', boundary: 'client', status: 'built' },
    { name: 'Table', boundary: 'server', status: 'built' },
    { name: 'TableSortButton', boundary: 'client', status: 'built' },
  ],
}

let dist = ''
const read = (name: string) => readFileSync(join(dist, name), 'utf8')

beforeAll(async () => {
  const root = mkdtempSync(join(tmpdir(), 'clara-placement-'))
  for (const [rel, content] of Object.entries(FIXTURES)) {
    const file = join(root, rel)
    mkdirSync(join(file, '..'), { recursive: true })
    writeFileSync(file, content)
  }
  await build({
    root,
    logLevel: 'error',
    build: {
      outDir: 'dist',
      // Unminified so identifiers survive into the output and an assertion can name what it is
      // looking for. Minified, every component collapses to a single letter and a placement
      // assertion silently degrades into "the chunk exists".
      minify: false,
      lib: { entry: join(root, 'src/index.ts'), formats: ['es'] },
      rollupOptions: {
        external: [/^react($|\/)/],
        output: [{
          format: 'es',
          entryFileNames: 'index.js',
          chunkFileNames: '[name].js',
          manualChunks: manualChunks(CLASSIFICATION),
        }],
      },
    },
  })
  dist = join(root, 'dist')
  // The real pipeline stamps every client chunk after the build; mirror that here.
  for (const name of readdirSync(dist).filter(isClientChunk)) {
    writeFileSync(join(dist, name), prependDirective(readFileSync(join(dist, name), 'utf8')))
  }
}, 60_000)

describe('placement, end to end', () => {
  // D0048: each of these gets its OWN chunk, so a consumer importing one does not take the others.
  it.each([
    ['a default-exported arrow const', 'Switch'],
    ['a Provider', 'ThemeProvider'],
    ['a client component co-located under a server one', 'TableSortButton'],
  ])('gives %s its own client chunk', (_label, name) => {
    expect(existsSync(join(dist, `${CLIENT_CHUNK}-${name}.js`))).toBe(true)
    expect(read(`${CLIENT_CHUNK}-${name}.js`)).toContain(name)
  })

  it('does not put one client component inside another\'s chunk', () => {
    expect(read(`${CLIENT_CHUNK}-Switch.js`)).not.toContain('ThemeProvider')
    expect(read(`${CLIENT_CHUNK}-ThemeProvider.js`)).not.toContain('TableSortButton')
  })

  it('keeps the server component out of the client chunk', () => {
    expect(read(`${SERVER_CHUNK}.js`)).toMatch(/table/)
    expect(read(`${SERVER_CHUNK}.js`)).not.toMatch(/useState/)
  })

  it('puts the shared helper in a chunk neither side owns', () => {
    expect(existsSync(join(dist, `${SHARED_CHUNK}.js`))).toBe(true)
  })
})

describe('directives, end to end', () => {
  it('stamps every client chunk and nothing else', () => {
    const clientChunks = readdirSync(dist).filter(isClientChunk)
    expect(clientChunks.length).toBeGreaterThan(1)
    for (const chunk of clientChunks) expect(read(chunk)).toMatch(/^\s*["']use client["']/)
    for (const other of [`${SERVER_CHUNK}.js`, `${SHARED_CHUNK}.js`, 'index.js']) {
      if (existsSync(join(dist, other))) expect(read(other)).not.toMatch(/^\s*["']use client["']/)
    }
  })

  // The property the whole mechanism exists for: no undirectived chunk may contain client-only
  // React. This is checked on the emitted bytes, so it holds however placement was decided.
  it('leaves no client-only React in an undirectived chunk', async () => {
    // @ts-expect-error - .mjs helper, no declarations
    const { clientHooksUsed } = await import('../../scripts/lib/client-signals.mjs')
    for (const other of [`${SERVER_CHUNK}.js`, `${SHARED_CHUNK}.js`, 'index.js']) {
      if (!existsSync(join(dist, other))) continue
      expect({ chunk: other, hooks: clientHooksUsed(read(other)) }).toEqual({ chunk: other, hooks: [] })
    }
  })

  it('does not let a plain constant be mistaken for a component', () => {
    expect(read('index.js')).toContain('BUTTON_VARIANTS')
  })
})
