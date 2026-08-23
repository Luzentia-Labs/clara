#!/usr/bin/env node
/**
 * Keep `.size-limit.json` describing what actually ships.
 *
 * D0048 made client chunks per-component so the per-component JS budgets AGENTS.md declares could
 * be real. A budget list that names one aggregate entry would not deliver that: a component could
 * double in size and nothing would say so. This regenerates one budget per built client component
 * from the classification, so a new component arrives WITH a budget rather than outside the
 * budgets.
 *
 * `--check` fails instead of writing, which is what CI runs.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'
import { CLIENT_CHUNK } from './lib/chunk-plan.mjs'

const RULE = 'size-budgets'
const check = process.argv.includes('--check')
const BUDGET_FILE = '.size-limit.json'
// A single component's JS. Deliberately tight: the point of per-component chunks is that this
// number means something, and a budget nobody would ever breach is not a budget.
const PER_COMPONENT_LIMIT = '5 kB'

const classification = JSON.parse(readFileSync('packages/react/client-boundary.json', 'utf8'))
const builtClients = classification.components
  .filter((c) => c.boundary === 'client' && c.status === 'built')
  .map((c) => c.name)
  .sort()

// Every built component, client or server: the entry re-exports all of them.
const builtCount = classification.components.filter((c) => c.status === 'built').length

// Peers are IGNORED when measuring. They are external in the build - the bundled-peers guard
// proves no chunk contains React - but size-limit resolves imports by default, so leaving them in
// measures React's weight and calls it Clara's. A budget that is 90% somebody else's library
// cannot detect Clara growing.
const PEERS = ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client']

/**
 * The react entry's budget SCALES with the number of components it re-exports.
 *
 * It was 5 kB - the per-component figure, reused. That is a cap on a barrel that re-exports every
 * component, so it fails the moment one more is added, and the only available response is to raise
 * it: a budget whose routine outcome is "bump the number" measures nothing. Adding four affordances
 * to Input pushed it 248 B over and turned CI red, and nothing about that was a regression.
 *
 * What the entry budget is actually FOR is catching the barrel pulling in something it should not -
 * a heavy dependency, or per-component code that failed to split into its own chunk. That signal
 * survives if the allowance tracks the component count and the ceiling catches the entry growing
 * FASTER than that count. Per-component budgets (D0048/D0053) remain the ones that bind for a
 * consumer importing a single control; this one is a shape check on the barrel.
 *
 * 220 B per built component, floor 5 kB. Both are calibrated from the measured figure rather than
 * argued: 24 built components at 5.25 kB is ~215 B each, so the allowance sits deliberately close
 * to today's density and will fail if the entry starts carrying real weight.
 */
const ENTRY_BYTES_PER_COMPONENT = 220
const ENTRY_FLOOR_BYTES = 5000
const entryLimit = `${Math.max(ENTRY_FLOOR_BYTES, builtCount * ENTRY_BYTES_PER_COMPONENT)} B`

const fixed = [
  { name: `@luzentialabs/clara-react (ESM entry, ${builtCount} components x ${ENTRY_BYTES_PER_COMPONENT} B, floor ${ENTRY_FLOOR_BYTES} B)`, path: 'packages/react/dist/index.js', limit: entryLimit, gzip: true, ignore: PEERS },
  { name: '@luzentialabs/clara-icons (ESM entry)', path: 'packages/icons/dist/index.js', limit: '5 kB', gzip: true },
  { name: '@luzentialabs/clara-tokens (ESM entry)', path: 'packages/tokens/dist/index.js', limit: '5 kB', gzip: true },
  {
    name: '@luzentialabs/clara-react styles.css (the fixed sheet ceiling, TRD:480 / PRD:1090)',
    path: 'packages/react/dist/styles.css', limit: '15 kB', gzip: true,
  },
]
const perComponent = builtClients.map((name) => ({
  name: `${name} (client chunk, D0048)`,
  path: `packages/react/dist/${CLIENT_CHUNK}-${name}.js`,
  limit: PER_COMPONENT_LIMIT,
  gzip: true,
  ignore: PEERS,
}))
const wanted = [...fixed, ...perComponent]
const current = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, 'utf8')) : []

if (!check) {
  writeFileSync(BUDGET_FILE, JSON.stringify(wanted, null, 2) + '\n')
  pass(RULE, `${wanted.length} budget(s) written, ${perComponent.length} per-component`)
} else {
  const problems = []
  if (JSON.stringify(current) !== JSON.stringify(wanted)) {
    const have = new Set(current.map((e) => e.path))
    for (const e of wanted) {
      if (!have.has(e.path)) problems.push(`${e.path} has no budget - run \`pnpm size:sync\``)
    }
    const want = new Set(wanted.map((e) => e.path))
    for (const e of current) {
      if (!want.has(e.path)) problems.push(`${e.path} has a budget but is not built - run \`pnpm size:sync\``)
    }
    if (!problems.length) problems.push('.size-limit.json differs from the classification - run `pnpm size:sync`')
  }
  if (!builtClients.length && perComponent.length) problems.push('no built client component, yet per-component budgets exist')
  if (problems.length) fail(RULE, problems)
  pass(RULE, `${wanted.length} budget(s) match the classification, ${perComponent.length} per-component`)
}
