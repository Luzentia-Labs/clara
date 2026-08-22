/**
 * Prove the packaging guards can FAIL.
 *
 * A guard that has never been observed failing is indistinguishable from a guard that cannot fail.
 * A reviewer replaced `check-exports.mjs` with a script that printed only its PASS banner and
 * watched the AC that pins it report pass=6 fail=0 (F2).
 *
 * THIS SCRIPT NEVER WRITES TO THE WORKING TREE.
 *
 * An earlier version mutated the real manifests and restored them in a `finally`. A reviewer
 * showed that was indefensible (N5): SIGINT during the window left `"./*": "./dist/*"` on disk -
 * in the manifest of the story whose whole thesis is that no subpath becomes public API by
 * accident - concurrent runs produced false "FAILED TO RESTORE" reports, and the natural recovery
 * (`git checkout <file>`) destroyed uncommitted work. It ran inside `pnpm check`, which developers
 * run constantly.
 *
 * The workspace's manifest skeleton is copied to a temp directory and the guards run there with
 * `cwd` set to the copy. The real tree is only ever read.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, cpSync, writeFileSync, readFileSync, rmSync, existsSync, renameSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const root = process.cwd()

// `finally` does not run on a signal, so an interrupted run leaked its staged directory (R9).
const staged = new Set()
const sweep = () => { for (const d of staged) rmSync(d, { recursive: true, force: true }) }
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { sweep(); process.exit(130) })
}
process.on('exit', sweep)

/** A throwaway workspace holding only what the guards read: manifests, the workspace file, LICENSE. */
function stageWorkspace ({ withOutput = false } = {}) {
  const stage = mkdtempSync(join(tmpdir(), 'clara-prove-'))
  staged.add(stage)
  for (const rel of ['pnpm-workspace.yaml', 'LICENSE', 'package.json', 'design/foundations.md']) {
    if (!existsSync(join(root, rel))) continue
    mkdirSync(dirname(join(stage, rel)), { recursive: true })
    copyFileSync(join(root, rel), join(stage, rel))
  }
  for (const { dir } of readWorkspace(root)) {
    mkdirSync(join(stage, dir), { recursive: true })
    copyFileSync(join(root, dir, 'package.json'), join(stage, dir, 'package.json'))
    for (const extra of ['LICENSE']) {
      const from = join(root, dir, extra)
      if (existsSync(from)) copyFileSync(from, join(stage, dir, extra))
    }
    // The output guards read dist/ and build/ rather than manifests, so proving they can fail
    // means staging real build artifacts and corrupting the copy (R8).
    if (withOutput) {
      // `src` and the generator are staged too. Without them `check-token-output`'s "tier 2
      // references only tier 1 / no raw literals" section walked an EMPTY tree and checked zero
      // files on every prover run - and a guard that checks nothing also exits 0, so the clean-run
      // precondition could not see it (review X14).
      for (const sub of [
        'dist', 'build', 'src', 'vite.config.ts', 'generate-ramps.mjs',
        'tokens.public.lock.json', 'contrast-required.json',
      ]) {
        const from = join(root, dir, sub)
        if (existsSync(from)) cpSync(from, join(stage, dir, sub), { recursive: true })
      }
    }
  }
  return stage
}

/**
 * Run a guard against the staged copy. Distinguishes "the guard rejected the mutation" from
 * "the guard crashed" - conflating them lets a broken guard read as a working one (N5).
 */
const runGuard = (script, cwd) => {
  try {
    execFileSync('node', [join(scriptsDir, script)], { cwd, stdio: 'pipe' })
    return { code: 0, crashed: false, stderr: '' }
  } catch (error) {
    const code = error.status ?? null
    const stderr = String(error.stderr ?? '')
    // A guard signals rejection with process.exit(1) after printing its FAIL banner. Anything
    // else - a throw, a module error, a signal - is a crash wearing a non-zero exit code.
    const crashed = code === null || !/^FAIL \[/m.test(stderr)
    return { code: code ?? 1, crashed, stderr }
  }
}

const patch = (file, fn) => (stage) => {
  const path = join(stage, file)
  const m = JSON.parse(readFileSync(path, 'utf8'))
  fn(m)
  writeFileSync(path, JSON.stringify(m, null, 2) + '\n')
}

const CASES = [
  { name: 'exports wildcard',
    expect: /wildcard/i, guard: 'check-exports.mjs',
    mutate: patch('packages/react/package.json', (m) => { m.exports['./*'] = './dist/*' }) },
  { name: 'undeclared exports subpath',
    expect: /not in the closed map/i, guard: 'check-exports.mjs',
    mutate: patch('packages/react/package.json', (m) => { m.exports['./internals'] = './dist/internals.js' }) },
  { name: 'peer moved to a hard dependency',
    expect: /peer/i, guard: 'check-peers.mjs',
    mutate: patch('packages/react/package.json', (m) => { m.dependencies = { ...m.dependencies, react: '^18.2.0' } }) },
  { name: 'peer range narrowed to drop React 19',
    expect: /19|range|cover/i, guard: 'check-peers.mjs',
    mutate: patch('packages/react/package.json', (m) => { m.peerDependencies.react = '^18.2.0' }) },
  { name: 'app made publishable',
    expect: /private/i, guard: 'check-private.mjs',
    mutate: patch('apps/docs/package.json', (m) => { delete m.private }) },
  { name: 'licence deleted',
    expect: /licence file|license file/i, guard: 'check-license.mjs',
    mutate: (stage) => rmSync(join(stage, 'packages/react/LICENSE'), { force: true }) },
  { name: 'licence drifted by one byte',
    expect: /drifted/i, guard: 'check-license.mjs',
    mutate: (stage) => {
      const p = join(stage, 'packages/icons/LICENSE')
      writeFileSync(p, readFileSync(p, 'utf8') + ' ')
    } },
]

const problems = []
const killed = []

for (const { name, guard, mutate, expect } of CASES) {
  const stage = stageWorkspace()
  try {
    const clean = runGuard(guard, stage)
    if (clean.code !== 0) {
      problems.push(`${name}: ${guard} already fails on an unmutated copy (exit ${clean.code})`)
      continue
    }
    mutate(stage)
    const result = runGuard(guard, stage)
    if (result.code === 0) {
      problems.push(`${name}: SURVIVED - ${guard} exited 0 with the mutation applied`)
    } else if (expect && !expect.test(result.stderr)) {
      // CR-01M0MBGN AC3: asserting only the exit code let a guard fail through a DIFFERENT branch
      // and still count as killed - three of sixteen cases did exactly that, so deleting the rule
      // under test changed nothing. The diagnostic is what pins the rule.
      problems.push(
        `${name}: killed for the WRONG REASON - ${guard} failed, but not with the expected ` +
          `diagnostic (/${expect.source}/). Got: ${result.stderr.split('\n').filter(Boolean).slice(1, 2).join(' ').slice(0, 140)}`,
      )
    } else if (result.crashed) {
      problems.push(
        `${name}: ${guard} exited ${result.code} WITHOUT a FAIL banner - it crashed rather than ` +
          `rejecting the mutation, so it is not actually guarding. ${result.stderr.split('\n')[0]}`,
      )
    } else {
      killed.push(name)
    }
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

// The three rewritten guards had no fail-proof at all, and both round-3 Criticals lived in one of
// them (R8). These operate on build OUTPUT rather than manifests, so each is proven by staging a
// copy of the real dist/build artifacts and corrupting the copy.
const OUTPUT_CASES = [
  {
    name: 'a peer inlined into a chunk',
    expect: /INLINED/,
    guard: 'check-bundled-peers.mjs',
    stage: (stage) => {
      const rec = join(stage, 'packages/react/build/bundle-record.json')
      const d = JSON.parse(readFileSync(rec, 'utf8'))
      d.chunks[0].inlined.push('/repo/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js')
      writeFileSync(rec, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    name: 'bundle record missing entirely',
    expect: /bundle-record\.json missing/,
    guard: 'check-bundled-peers.mjs',
    stage: (stage) => rmSync(join(stage, 'packages/react/build/bundle-record.json'), { force: true }),
  },
  {
    // Round 5, C1: a record FABRICATED by something that never ran a bundler. The guard covered
    // "missing" and "honest"; both Criticals lived in the space between them.
    name: 'bundle record fabricated (no hashes)',
    expect: /carries no sha256/,
    guard: 'check-bundled-peers.mjs',
    stage: (stage) => {
      const rec = join(stage, 'packages/react/build/bundle-record.json')
      const d = JSON.parse(readFileSync(rec, 'utf8'))
      for (const c of d.chunks) delete c.sha256
      writeFileSync(rec, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    // Round 5, C2: a record that was honest for a PREVIOUS build and no longer matches dist/.
    name: 'bundle record stale relative to dist',
    expect: /does not match its bundle record/,
    guard: 'check-bundled-peers.mjs',
    stage: (stage) => {
      const rec = join(stage, 'packages/react/build/bundle-record.json')
      const d = JSON.parse(readFileSync(rec, 'utf8'))
      for (const c of d.chunks) c.sha256 = '0'.repeat(64)
      writeFileSync(rec, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    name: 'a public token removed',
    expect: /was REMOVED from tokens\.public\.json/,
    guard: 'check-token-output.mjs',
    stage: (stage) => {
      const f = join(stage, 'packages/tokens/dist/tokens.public.json')
      const d = JSON.parse(readFileSync(f, 'utf8'))
      delete d[Object.keys(d)[0]]
      writeFileSync(f, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    // D0035 clause 2 makes this load-bearing: a failing pairing means F00 cannot close.
    name: 'a pairing below its contrast threshold',
    expect: /needs 4\.5:1|needs 3:1/,
    guard: 'check-contrast.mjs',
    stage: (stage) => {
      const f = join(stage, 'packages/tokens/build/tokens.pairings.json')
      const d = JSON.parse(readFileSync(f, 'utf8'))
      d.pairings[0].foreground.value = '#e8eaed'   // near-white on white
      writeFileSync(f, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    name: 'a declared pairing deleted to green a red gate',
    expect: /has been REMOVED/,
    guard: 'check-contrast.mjs',
    stage: (stage) => {
      const f = join(stage, 'packages/tokens/build/tokens.pairings.json')
      const d = JSON.parse(readFileSync(f, 'utf8'))
      d.pairings = d.pairings.slice(0, 1)
      writeFileSync(f, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    name: 'a provisional value with no revisit condition',
    expect: /revisit condition/,
    guard: 'check-foundations.mjs',
    stage: (stage) => {
      const f = join(stage, 'design/foundations.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/[Rr]evisit/g, 'someday'))
    },
  },
  {
    // CR-01M0MBGN AC4: `check-stylesheets` has TWO independent rules and one mutation pinned both,
    // so deleting the reachability rule still reported killed - the count rule fired instead. This
    // case RENAMES the single sheet so it is unreachable WITHOUT changing the count, isolating the
    // branch. It matters concretely: clara-tokens is allowed 2 sheets, so the count rule cannot
    // cover reachability there at all.
    name: 'the only stylesheet made unreachable (count unchanged)',
    guard: 'check-stylesheets.mjs',
    expect: /no exports subpath reaches it/,
    stage: (stage) => {
      const dist = join(stage, 'packages/react/dist')
      renameSync(join(dist, 'styles.css'), join(dist, 'orphan.css'))
    },
  },
  {
    name: 'an unreachable stylesheet in dist',
    expect: /no exports subpath reaches it/,
    guard: 'check-stylesheets.mjs',
    stage: (stage) => writeFileSync(join(stage, 'packages/react/dist/rogue.css'), '.x{color:red}\n'),
  },
]

for (const { name, guard, stage: corrupt, expect } of OUTPUT_CASES) {
  const stage = stageWorkspace({ withOutput: true })
  try {
    const clean = runGuard(guard, stage)
    if (clean.code !== 0) {
      problems.push(`${name}: ${guard} already fails on an unmutated copy (exit ${clean.code})`)
      continue
    }
    corrupt(stage)
    const result = runGuard(guard, stage)
    if (result.code === 0) problems.push(`${name}: SURVIVED - ${guard} exited 0 with the mutation applied`)
    else if (expect && !expect.test(result.stderr)) {
      problems.push(
        `${name}: killed for the WRONG REASON - expected /${expect.source}/, got: ` +
          result.stderr.split('\n').filter(Boolean).slice(1, 2).join(' ').slice(0, 140),
      )
    } else if (result.crashed) problems.push(`${name}: ${guard} exited ${result.code} WITHOUT a FAIL banner`)
    else killed.push(name)
  } finally {
    rmSync(stage, { recursive: true, force: true })
    staged.delete(stage)
  }
}

if (problems.length) fail('prove-guards', problems)
pass('prove-guards', `${killed.length} mutation(s) killed on a staged copy: ${killed.join('; ')}`)
