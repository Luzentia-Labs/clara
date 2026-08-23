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
  for (const rel of [
    'pnpm-workspace.yaml', 'LICENSE', 'package.json', 'design/foundations.md',
    'ci-gates.json', '.github/workflows/ci.yml', '.github/workflows/release.yml',
    'apps/docs/src/content/foundations/tokens.md',
    'sdlc-studio/trd.md', 'sdlc-studio/stories/_index.md', 'CONTRIBUTING.md',
  ]) {
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
        'dist', 'build', 'src', 'vite.config.ts', 'generate-ramps.mjs', 'client-boundary.json',
        'tokens.public.lock.json', 'contrast-required.json', 'client-boundary.json',
        // The icon set's three sources - the SVGs, the catalogue and the committed list - are what
        // check-icons compares against each other.
        'svg', 'icons.json', 'ICONS.md',
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
  {
    // The classification is driven by what is EXPORTED, not by the list, so the mutation that
    // matters adds an export rather than editing the file. A guard keyed off the list would
    // report a happy 39-classified PASS while an unclassified component shipped.
    name: 'a component exported without a boundary classification',
    guard: 'check-client-boundary.mjs',
    expect: /exported but unclassified/,
    stage: (stage) => {
      const dist = join(stage, 'packages/react/dist/index.js')
      writeFileSync(dist, readFileSync(dist, 'utf8') + '\nexport { Rogue };\n')
    },
  },
  {
    // The directive branch (D0041). Vite DROPS module-level directives and only warns, so this is
    // the failure that would otherwise reach a consumer as a server-render crash.
    name: 'the directive stripped from the ESM client chunk',
    guard: 'check-client-boundary.mjs',
    expect: /carries no "use client"/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-client-Button.js')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/^["']use client["'];?\r?\n/, ''))
    },
  },
  {
    // Both formats, separately: PRD F23 requires the directive in ESM *and* CJS, and an earlier
    // build genuinely emitted one format correctly while clobbering the other.
    name: 'the directive stripped from the CJS client chunk',
    guard: 'check-client-boundary.mjs',
    expect: /carries no "use client"/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-client-Button.cjs')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/^["']use client["'];?\r?\n/, ''))
    },
  },
  {
    // The OTHER half of TRD Section 7, and the one a "is the directive present" check misses
    // entirely: marking everything client passes that test and defeats the whole feature.
    name: 'a directive added to the server chunk',
    guard: 'check-client-boundary.mjs',
    expect: /server-capable components carry none/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-server.js')
      writeFileSync(f, '"use client";\n' + readFileSync(f, 'utf8'))
    },
  },
  {
    name: 'a directive added to the entry, making the whole package client',
    guard: 'check-client-boundary.mjs',
    expect: /the entry .* carries a "use client"/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/index.js')
      writeFileSync(f, '"use client";\n' + readFileSync(f, 'utf8'))
    },
  },
  {
    name: 'the client chunk missing while a client component is built',
    guard: 'check-client-boundary.mjs',
    expect: /no chunk of its own|no client chunk exists/,
    stage: (stage) => rmSync(join(stage, 'packages/react/dist/clara-client-Button.js')),
  },
  {
    // The bundle record must not forgive anything except the directive prepend. A post-build step
    // that could re-derive hashes freely would reopen the hole the record exists to close.
    name: 'the client chunk edited beyond the permitted directive stamp',
    guard: 'check-bundled-peers.mjs',
    expect: /does not match its bundle record/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-client-Button.js')
      writeFileSync(f, readFileSync(f, 'utf8') + '\nglobalThis.__sneaky = 1;\n')
    },
  },
  {
    name: 'a classification entry with an invalid boundary',
    guard: 'check-client-boundary.mjs',
    expect: /boundary must be server\|client/,
    stage: patch('packages/react/client-boundary.json', (m) => { m.components[0].boundary = 'maybe' }),
  },
  // --- Guards the review found had NO fail-proof at all. Every one of them was broken on the
  // first attempt, which is the argument for this file: "a guard that has never been observed
  // failing is indistinguishable from a guard that cannot fail" was true of these three. ---
  {
    // C1: the substring + `.some()` defeat. `pnpm check` is the only step running nine
    // deterministic guards, including the sole enforcement point for the exports-wildcard rule.
    name: 'ci.yml drops the step running every deterministic guard',
    guard: 'check-ci-gates.mjs',
    expect: /does not run|which .* does not run/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/ci.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/ *- name: Gates 12[^\n]*\n *run: pnpm check\n/, ''))
    },
  },
  {
    // H2: three legal ways to make a gate advisory, none of which a line regex models.
    name: 'a wired gate made advisory with continue-on-error',
    guard: 'check-ci-gates.mjs',
    expect: /does not block/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/ci.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        /( *)- name: Gate 1 - typecheck\n/, '$1- name: Gate 1 - typecheck\n$1  continue-on-error: true\n'))
    },
  },
  {
    name: 'a wired gate whose exit code is discarded with || true',
    guard: 'check-ci-gates.mjs',
    expect: /does not block|exit code discarded/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/ci.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace('run: pnpm size', 'run: pnpm size || true'))
    },
  },
  {
    // H3: the omission a count cannot see.
    name: 'a TRD Section 9 gate dropped from the manifest',
    guard: 'check-ci-gates.mjs',
    expect: /is claimed by no row/,
    stage: patch('ci-gates.json', (m) => { m.gates = m.gates.filter((g) => g.trd !== 7) }),
  },
  {
    // C2: the anchored-regex defeat. Rewriting a step as a block scalar emptied BOTH command sets,
    // and with no vacuity floor the comparison passed over nothing.
    name: 'the publish path drops the full check suite',
    guard: 'check-release.mjs',
    expect: /does not run "pnpm check"/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/release.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/ *- run: pnpm check\n/, ''))
    },
  },
  {
    // C3: "main-only" held by a string, not a property.
    name: 'workflow_dispatch added so publish can run from any branch',
    guard: 'check-release.mjs',
    expect: /publish from a branch|no job-level guard/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/release.yml')
      let y = readFileSync(f, 'utf8')
      y = y.replace(/^on:\n/m, 'on:\n  workflow_dispatch:\n')
      y = y.replace(/^ *if: github\.ref == 'refs\/heads\/main'\n/m, '')
      writeFileSync(f, y)
    },
  },
  {
    // M5: the publish command lives in a `with:` key a run:-only reader never saw. Switching to
    // npm publish ships workspace:* to every consumer, permanently, with every guard green.
    name: 'publish switched to npm, which does not rewrite workspace:',
    guard: 'check-release.mjs',
    expect: /EUNSUPPORTEDPROTOCOL|Only pnpm rewrites/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/release.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace('pnpm changeset publish', 'npm publish'))
    },
  },
  {
    // D0052: `changeset publish` ships the version in the manifest. With a changeset still pending
    // those versions are un-bumped, so publishing would ship the wrong one - permanently.
    name: 'the pending-changeset guard removed from the publish step',
    guard: 'check-release.mjs',
    expect: /does not check for a pending changeset/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/release.yml')
      const y = readFileSync(f, 'utf8')
      const start = y.indexOf('        run: |\n          pending=')
      const end = y.indexOf('          pnpm changeset publish')
      writeFileSync(f, y.slice(0, start) + '        run: |\n' + y.slice(end))
    },
  },
  {
    name: 'a gate duplicated in the publish path',
    guard: 'check-release.mjs',
    expect: /times - every publish pays/,
    stage: (stage) => {
      const f = join(stage, '.github/workflows/release.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace('      - run: pnpm size\n', '      - run: pnpm size\n      - run: pnpm size\n'))
    },
  },
  {
    // M3: one `{` inside a quoted value permanently unbalanced the brace walk, making every later
    // top-level rule invisible. Routine CSS - separators, icon fonts.
    name: 'a rogue rule hidden behind a brace inside a quoted content value',
    guard: 'check-stylesheets.mjs',
    expect: /outside any @layer/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/styles.css')
      writeFileSync(f, '@layer clara.reset, clara.tokens, clara.components;\n' +
        '@layer clara.components{.a::after{content:"{"}}\n.rogue{color:red}\n')
    },
  },
  {
    // H4: `^export` under /m needs a line start, so a minified bundle reported zero exports and
    // passed while unclassified components shipped. This build minifies.
    name: 'unclassified components exported from a minified one-line bundle',
    guard: 'check-client-boundary.mjs',
    expect: /exported but unclassified/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/index.js')
      writeFileSync(f, 'const Rogue=()=>null;const Other=()=>null;export{Rogue,Other};\n')
    },
  },
  {
    // F1: the guard proved the CHUNK was directived, never that a given component's code was IN
    // it. A client component co-located under a server component chunked as the server one and
    // shipped undirectived. The classification's own `special.Table` entry describes this layout.
    name: 'a client component whose code landed in the server chunk',
    guard: 'check-client-boundary.mjs',
    expect: /was emitted into clara-server/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/build/bundle-record.json')
      const rec = JSON.parse(readFileSync(f, 'utf8'))
      for (const c of rec.chunks) {
        const i = (c.inlined ?? []).indexOf('src/components/Button/Button.tsx')
        if (i >= 0 && c.fileName.startsWith('clara-client')) {
          c.inlined.splice(i, 1)
          rec.chunks.find((x) => x.fileName.startsWith('clara-server')).inlined.push('src/components/Button/Button.tsx')
        }
      }
      writeFileSync(f, JSON.stringify(rec, null, 2))
    },
  },
  {
    // F2: a module shared by a client and a server component lands in ONE of the two by Rollup's
    // graph order. When that was the client chunk, the server chunk imported it - and under RSC
    // every export of a "use client" module is a client reference, so the server render throws.
    // Reordering two export lines was enough to flip it.
    name: 'the server chunk importing the client chunk',
    guard: 'check-client-boundary.mjs',
    expect: /putting server-capable code behind the client boundary/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/build/bundle-record.json')
      const rec = JSON.parse(readFileSync(f, 'utf8'))
      rec.chunks.find((c) => c.fileName === 'clara-server.js').external.push('clara-client-Button.js')
      writeFileSync(f, JSON.stringify(rec, null, 2))
    },
  },
  {
    // F5: the binding loop walked files on disk, so a record describing a file that is NOT there
    // was invisible - it printed "10 chunk(s) hash-matched" with dist deleted entirely.
    name: 'the bundle record describing a chunk that does not exist',
    guard: 'check-bundled-peers.mjs',
    expect: /which does not exist/,
    stage: (stage) => rmSync(join(stage, 'packages/react/dist/clara-client-Button.js')),
  },
  {
    // H3 round 2: the shared chunk was never checked for a directive while three documents said it
    // was - and a directive there makes every shared helper a client reference, so the server chunk
    // importing it sits behind the boundary. The original F2 crash, restored.
    name: 'a directive added to the shared chunk',
    guard: 'check-client-boundary.mjs',
    expect: /shared chunk .* carries a "use client"/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-shared.js')
      writeFileSync(f, '"use client";\n' + readFileSync(f, 'utf8'))
    },
  },
  {
    // The record forgiveness must cover the CLIENT chunk only. Applied to every chunk, the tamper
    // above laundered straight through the sha256 binding.
    name: 'a directive added to the shared chunk, laundering the hash',
    guard: 'check-bundled-peers.mjs',
    expect: /does not match its bundle record/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-shared.js')
      writeFileSync(f, '"use client";\n' + readFileSync(f, 'utf8'))
    },
  },
  {
    // F2 round 2: reachability, not adjacency. server -> shared -> client left every server
    // component transitively behind the boundary while the guard reported PASS.
    name: 'the server chunk reaching the client chunk through the shared chunk',
    guard: 'check-client-boundary.mjs',
    expect: /reaches a client chunk through its imports/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/build/bundle-record.json')
      const rec = JSON.parse(readFileSync(f, 'utf8'))
      rec.chunks.find((c) => c.fileName === 'clara-shared.js').external.push('clara-client-Button.js')
      rec.chunks.find((c) => c.fileName === 'clara-server.js').external.push('clara-shared.js')
      writeFileSync(f, JSON.stringify(rec, null, 2))
    },
  },
  {
    // The oracle that does NOT share the planner's reader: client-only React in an undirectived
    // chunk, however it got there.
    name: 'client-only React in an undirectived chunk',
    guard: 'check-client-boundary.mjs',
    expect: /carries no directive but uses client-only React/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/clara-server.js')
      writeFileSync(f, 'import { useState as q } from "react";\n' + readFileSync(f, 'utf8'))
    },
  },
  {
    // D0048: collapsing the per-component chunks back into one would still pass every directive
    // check - the budgets would just silently stop being per-component.
    name: 'a built client component with no chunk of its own',
    guard: 'check-client-boundary.mjs',
    expect: /no chunk of its own/,
    stage: (stage) => {
      const dist = join(stage, 'packages/react/dist')
      renameSync(join(dist, 'clara-client-Button.js'), join(dist, 'clara-client.js'))
    },
  },
  {
    // Two sources disagreeing about what is public means neither can be trusted, and the gate that
    // reads them would be deciding on the wrong set.
    name: 'the two token manifests disagreeing about what is public',
    guard: 'check-public-tokens.mjs',
    expect: /disagree about what is public/,
    stage: (stage) => {
      const f = join(stage, 'packages/tokens/dist/tokens.public.json')
      const m = JSON.parse(readFileSync(f, 'utf8'))
      delete m[Object.keys(m)[0]]
      writeFileSync(f, JSON.stringify(m, null, 2))
    },
  },
  {
    // TRD gate 2: a component reaching past the semantic layer into a primitive is how theming
    // quietly stops working for that one component - the output looks identical.
    name: 'component CSS reading a tier 1 primitive',
    guard: 'check-component-css.mjs',
    expect: /a tier 1 primitive/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe{color:var(--clara-color-neutral-600)}\n')
    },
  },
  {
    // Written on ONE line with its selector, which a per-line declaration regex skipped entirely.
    name: 'a raw literal in component CSS, on the selector line',
    guard: 'check-component-css.mjs',
    expect: /uses the literal 12px/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { margin: 12px; }\n')
    },
  },
  {
    // PRD:357 asks for an enumerated, COUNTED list precisely so this is checkable. Swapping one
    // category's icon for another's keeps the total at 48 while changing what was agreed.
    name: 'an icon moved between categories, keeping the total at 48',
    guard: 'check-icons.mjs',
    expect: /PRD:357 specifies/,
    stage: patch('packages/icons/icons.json', (m) => {
      const [name, path] = Object.entries(m.categories.navigation)[0]
      delete m.categories.navigation[name]
      m.categories.file[name] = path
    }),
  },
  {
    // PRD F17 asks for a record per component precisely so a blanket accessibility claim cannot
    // stand in for one. A new component with no record is the case that matters: the record gets
    // written for the components someone remembered.
    name: 'a built component with no verification record',
    guard: 'check-verification.mjs',
    expect: /built \(exported from Probe\/Probe\.tsx\) but has no verification\.md/,
    stage: (stage) => {
      const dir = join(stage, 'packages/react/src/components/Probe')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'Probe.tsx'), 'export function Probe () { return null }\n')
    },
  },
  {
    // Two sources of truth about which components are client is how a directive lands on the wrong
    // chunk. The record has to agree with the file the BUILD reads, not with itself.
    name: 'a verification record whose boundary contradicts client-boundary.json',
    guard: 'check-verification.mjs',
    expect: /says "server" but client-boundary\.json says "client"/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Field/verification.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace('**Boundary:** client-only', '**Boundary:** server-capable'))
    },
  },
  {
    // A record whose evidence has been renamed away reads exactly like one that still holds.
    name: 'a verification record citing a test file that no longer exists',
    guard: 'check-verification.mjs',
    expect: /cites .*, which does not exist/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Input/verification.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace('behaviour.test.tsx', 'moved-away.test.tsx'))
    },
  },
  {
    // US-01M0GM2X AC2: the docs page exists to settle that debouncing is the CALLER's decision.
    // Deleting the passage leaves a page that is still a page and no longer says the thing.
    name: 'the SearchInput docs page stripped of the debounce decision',
    guard: 'check-verification.mjs',
    expect: /does not document that Clara does not debounce/,
    stage: (stage) => {
      const f = join(stage, 'apps/docs/src/content/components/search-input.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/\*\*Clara does not debounce\.\*\*/, 'It fires on every keystroke.'))
    },
  },
  {
    // The keyword version of this check was defeated by replacing the whole Debouncing section with
    // one sentence saying the OPPOSITE - every keyword still appeared, so the guard stayed green.
    name: 'the SearchInput docs page inverted to claim Clara debounces for you',
    guard: 'check-verification.mjs',
    expect: /contains a claim that Clara debounces/,
    stage: (stage) => {
      const f = join(stage, 'apps/docs/src/content/components/search-input.md')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n\nIn practice Clara debounces for you at 300ms.\n')
    },
  },
  {
    // A component defined in index.tsx, or a second component in a directory, was invisible to the
    // filename-shape definition of "built" that this guard started with.
    name: 'a built component declared in index.tsx rather than a same-named file',
    guard: 'check-verification.mjs',
    expect: /built \(exported from .*index\.tsx\) but has no verification\.md/,
    stage: (stage) => {
      const dir = join(stage, 'packages/react/src/components/Probe')
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'index.tsx'), 'export function Probe () { return null }\n')
    },
  },
  {
    // A record citing a GATE that does not run the component's tests is the shape that let 22
    // records claim axe coverage from a gate running none of them.
    name: 'a verification record citing a gate that runs none of its component\'s tests',
    guard: 'check-verification.mjs',
    expect: /cites `check:axe` as covering Field, but that script runs none of/,
    stage: (stage) => {
      const f = join(stage, 'package.json')
      const pkg = JSON.parse(readFileSync(f, 'utf8'))
      pkg.scripts['check:axe'] = 'npx vitest run packages/react/src/components/__tests__/primitives.test.tsx -t "axe"'
      writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n')
    },
  },
  {
    // D0001 / PRD:244 "no exceptions". Proving this one matters because the check was just rewritten
    // from a substring match onto PostCSS: the regex read the SELECTOR
    // `.clara-input--search::-webkit-search-cancel-button` as a declaration of `--search` and failed
    // a clean build, so it had to be replaced - and a replaced guard that no longer catches the real
    // case is worse than the false positive it fixed.
    name: 'a custom property in component CSS without the --clara- prefix',
    guard: 'check-stylesheets.mjs',
    expect: /declares --brand, which is not --clara- prefixed/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/dist/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n@layer clara.components { .probe { --brand: red; } }\n')
    },
  },
  {
    // A review removed width, min-height and border from `.clara-input` and every test and guard
    // stayed green: jsdom computes no layout, so an input with no box is invisible to all of them.
    name: 'the input stripped of the declarations that give it a box',
    guard: 'check-component-css.mjs',
    expect: /\.clara-input declares no `min-height`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/\n\s*min-height: var\(--clara-size-control-height\);/, ''))
    },
  },
  {
    // A review replaced this section with "None. Everything about this component is fully verified."
    // and the guard passed, because it tested only that the heading string was present. A record
    // with nothing unverified is not a thorough record, it is an incurious one.
    name: 'a verification record whose stated gaps are emptied of content',
    guard: 'check-verification.mjs',
    expect: /"## Stated gaps" has 0 list item\(s\)/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Switch/verification.md')
      const text = readFileSync(f, 'utf8')
      writeFileSync(f, text.slice(0, text.indexOf('## Stated gaps')) +
        '## Stated gaps\n\nNone. Everything about this component is fully verified.\n')
    },
  },
  {
    // Same shape, the other section: all four citations deleted, prose left in their place.
    name: 'a verification record whose evidence list is replaced with a claim',
    guard: 'check-verification.mjs',
    expect: /"## What is verified automatically" has 0 list item\(s\)/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Switch/verification.md')
      const text = readFileSync(f, 'utf8')
      const head = text.indexOf('## What is verified automatically')
      const tail = text.indexOf('## Stated gaps')
      writeFileSync(f, text.slice(0, head) +
        '## What is verified automatically\n\nEverything. The Switch is exhaustively covered.\n\n' +
        text.slice(tail))
    },
  },
  {
    // The TSD's definition of done asks for a documented keyboard table per component, and the
    // definition-of-done AC in all ten stories claimed one existed when none did.
    name: 'a verification record with no keyboard table',
    guard: 'check-verification.mjs',
    expect: /has no \| Key \| Result \| table/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Checkbox/verification.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(/\n\| Key \| Result \|\n/, '\n'))
    },
  },
  {
    name: 'a component whose documented docs page does not exist',
    guard: 'check-verification.mjs',
    expect: /names docs page switch\.md, which does not exist/,
    stage: (stage) => {
      rmSync(join(stage, 'apps/docs/src/content/components/switch.md'))
    },
  },
  {
    // `check:axe` named the file holding 54 axe assertions and selected them with `-t "axe"`, which
    // matched no block in it: 86 skipped, 0 run, exit 0. Naming the file is not coverage.
    name: 'a cited gate whose test selector matches no test in the file it runs',
    guard: 'check-verification.mjs',
    expect: /matches no test name in .* - a selector that selects nothing exits 0/,
    stage: (stage) => {
      const f = join(stage, 'package.json')
      const pkg = JSON.parse(readFileSync(f, 'utf8'))
      pkg.scripts['check:axe'] = pkg.scripts['check:axe'].replace('-t "axe"', '-t "zzz-nothing-matches"')
      writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n')
    },
  },
  {
    // Three keyboard-reachable buttons shipped with no ring at all, under a comment claiming the
    // indicator covered "every other control"; and deleting the whole focus block left every gate
    // green. jsdom computes no layout, so this is the only place a missing ring can be caught.
    name: 'a focusable control with no focus-visible rule',
    guard: 'check-component-css.mjs',
    expect: /is focusable and has no `:focus-visible` rule/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace('.clara-search__clear:focus-visible,\n', ''))
    },
  },
  {
    // The decorated Input draws its whole visible box on the group, not the inner control - so the
    // group carries the same shape obligation, and did not until a review deleted it and watched
    // every gate stay green.
    name: 'the decorated input group stripped of its box',
    guard: 'check-component-css.mjs',
    expect: /\.clara-input-group declares no `border`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      const text = readFileSync(f, 'utf8')
      const at = text.indexOf('.clara-input-group {')
      const end = text.indexOf('}', at)
      writeFileSync(f, text.slice(0, at) + '.clara-input-group { display: inline-flex; }' + text.slice(end + 1))
    },
  },
  {
    // The manual pass is the one artefact automation cannot supply, and it is the one that got
    // fabricated - an identical paragraph, same date and browsers, in all 23 records including one
    // for a stub. Presence was the only requirement, so "Not done." passed too.
    name: 'a manual keyboard pass that neither records a walk nor admits it is outstanding',
    guard: 'check-verification.mjs',
    expect: /neither records a pass .* nor states that it is outstanding/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Switch/verification.md')
      const text = readFileSync(f, 'utf8')
      const at = text.indexOf('## Recorded manual keyboard pass')
      writeFileSync(f, text.slice(0, at) + '## Recorded manual keyboard pass\n\nNot done.\n')
    },
  },
  {
    // Replacing the indicator's declarations while leaving the selector list intact removed D0054's
    // two-part ring from all seven controls with every gate green: the selector was checked, the
    // declarations were not.
    name: 'a focus-visible rule that exists and draws nothing',
    guard: 'check-component-css.mjs',
    expect: /focus-visible declares no `outline`/,
    stage: (stage) => {
      // Gut the SHARED indicator block, leaving its selector list intact. Targeting one selector's
      // own rule stopped working the moment that selector joined the shared list - and a mutation
      // that no longer applies reports SURVIVED, which reads identically to a guard that broke.
      const f = join(stage, 'packages/react/src/styles.css')
      const text = readFileSync(f, 'utf8')
      const at = text.indexOf('.clara-input:focus-visible,')
      const open = text.indexOf('{', at)
      const close = text.indexOf('}', open)
      writeFileSync(f, `${text.slice(0, open)}{ color: var(--clara-color-fg-default); }${text.slice(close + 1)}`)
    },
  },
  {
    // `.clara-visually-hidden` hides both groups' legends and keeps the required marker out of the
    // layout while leaving it in the accessible name. `display: none` removes it from the tree and
    // silently reverts D0071, and no test can see it - jsdom applies no stylesheet.
    name: 'the visually-hidden class taken out of the accessibility tree',
    guard: 'check-component-css.mjs',
    expect: /removes it from the accessibility tree/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-visually-hidden { display: none; }\n')
    },
  },
  {
    // The epic's centrepiece had no shape entry: deleting the Field's grid left every gate green.
    name: 'the Field stripped of its own layout',
    guard: 'check-component-css.mjs',
    expect: /\.clara-field declares no `display`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace('.clara-field { display: grid; gap: var(--clara-space-control-gap); }', '.clara-field { color: var(--clara-color-fg-default); }'))
    },
  },
  {
    // A named colour is a literal. The first regex had no `i` flag, only px|rem|em, and no colour
    // names - five probes went straight through the guard whose whole job is catching them.
    name: 'a named colour in component CSS',
    guard: 'check-component-css.mjs',
    expect: /uses the literal rebeccapurple/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { border-color: rebeccapurple; }\n')
    },
  },
  {
    // `pnpm preflight` is the one command that answers "will this break CI?". A hand-written mirror
    // goes stale silently, which is worse than no mirror: it answers the question wrongly. CI went
    // red twice on gates that were not re-run before a push, which is why it exists at all.
    name: 'preflight drifting from the gates CI actually runs',
    guard: 'check-ci-gates.mjs',
    expect: /preflight does not run "pnpm size", which .* does/,
    stage: (stage) => {
      const f = join(stage, 'package.json')
      const pkg = JSON.parse(readFileSync(f, 'utf8'))
      pkg.scripts.preflight = pkg.scripts.preflight.replace(' && pnpm size', '')
      writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n')
    },
  },
  {
    name: 'an icon exported but absent from the committed list',
    guard: 'check-icons.mjs',
    expect: /absent from ICONS\.md|not declared/,
    stage: (stage) => {
      const f = join(stage, 'packages/icons/src/generated.ts')
      writeFileSync(f, readFileSync(f, 'utf8') + "export { GhostIcon } from './icons/GhostIcon'\n")
    },
  },
  {
    // TRD gate 8: a private token in a docs example becomes public by accident the moment someone
    // copies it, and D0007 says tiers 1 and 3 may change in a minor.
    name: 'a docs example referencing a tier 1 primitive',
    guard: 'check-public-tokens.mjs',
    expect: /tier 1 \(primitive\), not tier 2/,
    stage: (stage) => {
      const f = join(stage, 'apps/docs/src/content/foundations/tokens.md')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n`--clara-color-neutral-600`\n')
    },
  },
  {
    // A scan that matches nothing has verified nothing.
    name: 'the docs stripped of every token reference',
    guard: 'check-public-tokens.mjs',
    expect: /this gate checked nothing/,
    stage: (stage) => {
      const f = join(stage, 'apps/docs/src/content/foundations/tokens.md')
      writeFileSync(f, '# Design tokens\n\nNothing here.\n')
    },
  },
  {
    // F9: a malformed classification threw an uncaught TypeError - a crash wearing a non-zero
    // exit code, which is the distinction this whole file exists to make.
    name: 'a classification with no components array',
    guard: 'check-client-boundary.mjs',
    expect: /no `components` array/,
    stage: patch('packages/react/client-boundary.json', (m) => { delete m.components }),
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
