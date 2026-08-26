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
import { mkdtempSync, mkdirSync, copyFileSync, cpSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, renameSync } from 'node:fs'
import { statSync } from 'node:fs'
import { createHash } from 'node:crypto'
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
function stageWorkspace ({ withOutput = false, withGit = false, withStories = false } = {}) {
  const stage = mkdtempSync(join(tmpdir(), 'clara-prove-'))
  staged.add(stage)
  for (const rel of [
    'pnpm-workspace.yaml', 'LICENSE', 'package.json', 'design/foundations.md',
    'ci-gates.json', '.github/workflows/ci.yml', '.github/workflows/release.yml', '.size-limit.json',
    'apps/docs/src/content/foundations/tokens.md',
    'sdlc-studio/trd.md', 'sdlc-studio/stories/_index.md', 'CONTRIBUTING.md',
  ]) {
    if (!existsSync(join(root, rel))) continue
    mkdirSync(dirname(join(stage, rel)), { recursive: true })
    copyFileSync(join(root, rel), join(stage, rel))
  }
  // `sdlc-studio/reviews` and `scripts` are staged for EVERY mutation, not just the story ones.
  // `check-verification` resolves every path a record CITES, and a record may reasonably cite a
  // measurement under reviews/ or the script that reproduces it. Staging them only under
  // `withStories` left the check-verification entries failing on an UNMUTATED stage, which reads as
  // a broken prover rather than as a missing fixture - and the message said so, which is why this
  // took two wrong guesses before printing the guard's own stderr.
  // `e2e` joins them for the same reason, and it arrived the same way: Tooltip's record is the
  // first to cite an e2e spec (`e2e/stacking.spec.ts`, where WCAG 1.4.13's hover bridge is
  // asserted, because jsdom has no pointer and no layout to assert it with), and every
  // check-verification entry immediately began failing on an unmutated stage.
  for (const dir of ['sdlc-studio/reviews', 'scripts', 'e2e']) {
    if (!existsSync(join(root, dir))) continue
    cpSync(join(root, dir), join(stage, dir), { recursive: true })
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
  if (withStories) {
    // `check-story-verifiers.mjs` reads the story files AND the declared test names, so both have
    // to be real in the staged copy - a guard proven against an empty suite proves nothing.
    cpSync(join(root, 'sdlc-studio/stories'), join(stage, 'sdlc-studio/stories'), { recursive: true })
    for (const pkg of ['packages', 'test', 'scripts']) {
      if (existsSync(join(root, pkg))) {
        cpSync(join(root, pkg), join(stage, pkg), {
          recursive: true,
          filter: (src) => !/node_modules|[/\\]dist([/\\]|$)/.test(src),
        })
      }
    }
  }

  // Last, so every staged file is in the index and only the mutation's own file is untracked.
  if (withGit) {
    // A real git index in the staged copy. `check-tracked.mjs` asks git what is tracked, and
    // reimplementing gitignore to test it would be the eleventh hand-rolled parser here - so the
    // stage gets `.gitignore`, `git init`, and `git add -A`, which applies git's own rules.
    if (existsSync(join(root, '.gitignore'))) copyFileSync(join(root, '.gitignore'), join(stage, '.gitignore'))
    mkdirSync(join(stage, 'test'), { recursive: true })
    mkdirSync(join(stage, 'scripts'), { recursive: true })
    cpSync(join(root, 'scripts'), join(stage, 'scripts'), { recursive: true })
    writeFileSync(join(stage, 'test', 'kept.test.ts'), "import { it } from 'vitest'\nit('x', () => {})\n")
    execFileSync('git', ['init', '-q'], { cwd: stage, stdio: 'pipe' })
    execFileSync('git', ['add', '-A'], { cwd: stage, stdio: 'pipe' })
  }

  return stage
}

/**
 * Run a guard against the staged copy. Distinguishes "the guard rejected the mutation" from
 * "the guard crashed" - conflating them lets a broken guard read as a working one (N5).
 */
/**
 * `args` exists so the SCOPED path can be proven.
 *
 * 138 story `Verify:` lines call a guard with `--component`, and no mutation had ever run one that
 * way - so every hole in the scoped path shipped unnoticed, twice: the blind-spot list skipped when
 * scoped, and then attributed by filename. The path an acceptance criterion takes is the path that
 * most needs a fail-proof.
 */
/**
 * Write a throwaway component into the staged tree.
 *
 * The inline-z-index mutations used to patch a source string inside `ClaraPortal.tsx`, so any
 * unrelated edit to that component reported them as a stale mutation rather than a surviving one.
 * A file that exists only for the mutation cannot go stale.
 */
const probeComponent = (body) => (stage) => {
  writeFileSync(join(stage, 'packages/react/src/theme/__prove-zindex.tsx'),
    `export function ProveZIndex () {\n${body}\n}\n`)
}

const runGuard = (script, cwd, args = []) => {
  try {
    execFileSync('node', [join(scriptsDir, script), ...args], { cwd, stdio: 'pipe' })
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

/**
 * A content fingerprint of the staged tree, so a mutation that changed nothing can be told apart
 * from a guard that stopped working. Hashes bytes rather than comparing size or mtime, because a
 * same-length edit is the common case here.
 */
const snapshot = (dir) => {
  const parts = []
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const full = join(d, entry.name)
      if (entry.isDirectory()) { walk(full); continue }
      if (!entry.isFile()) continue
      // Every file, not a list of extensions. An extension allow-list is a category from a name,
      // and it had a miss immediately: `LICENSE` has none, so deleting it registered as "changed
      // nothing" and two perfectly good mutations were reported stale.
      const { size } = statSync(full)
      if (size > 1_000_000) { parts.push(`${full}:${size}`); continue }
      parts.push(`${full}:${createHash('sha1').update(readFileSync(full)).digest('hex')}`)
    }
  }
  walk(dir)
  return parts.sort().join('\n')
}

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
    /**
     * Snapshot the staged tree, so a mutation that no longer APPLIES is distinguishable from a
     * guard that stopped working. Both currently report SURVIVED, and they read identically - a
     * mutation targeting `.clara-link:focus-visible {` silently became a no-op when that selector
     * joined a shared list, and the resulting SURVIVED cost a debugging pass that assumed the guard
     * had broken. A mutation that changes nothing proves nothing, and should say so in its own words.
     */
    const before = snapshot(stage)
    mutate(stage)
    if (snapshot(stage) === before) {
      problems.push(
        `${name}: the mutation changed NOTHING in the staged copy - its target has moved, so it ` +
        'proves nothing. This is not a guard failure; it is a stale mutation.',
      )
      continue
    }
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
    // The guard has TWO independent portal rules, and one mutation with an alternating `expect`
    // pinned neither: deleting either branch left this prover at exit 0 (US-01M0GM61 round 7).
    // `check-stylesheets` had the identical trap, recorded thirty lines above under CR-01M0MBGN
    // AC4, and it was walked into again. So each branch gets its own mutation, chosen to trigger
    // exactly one of them, and its own non-alternating expectation.
    //
    // ONLY the Radix rule: Modal keeps rendering ClaraPortal, and a Radix portal appears beside it.
    name: 'an overlay reaching for a Radix portal alongside ClaraPortal',
    guard: 'check-overlay-contract.mjs',
    expect: /renders <\w+>, a Radix portal/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Modal/Modal.tsx')
      writeFileSync(f, `import { Portal as RadixPortal } from '@radix-ui/react-dialog'\n`
        + readFileSync(f, 'utf8')
        + `\nexport function ModalRadixProbe () { return <RadixPortal /> }\n`)
    },
  },
  {
    // VACUITY 1. A guard that enumerates nothing passes for the wrong reason, and this is the shape
    // that would do it silently: the flag disappears in a refactor and the guard reports success
    // over an empty loop for as long as the epic takes.
    name: 'the overlay flag removed from every component, so the guard enumerates nothing',
    guard: 'check-overlay-contract.mjs',
    expect: /flags no component `overlay: true`/,
    stage: patch('packages/react/client-boundary.json', (m) => {
      for (const c of m.components) delete c.overlay
    }),
  },
  {
    // VACUITY 2. Every overlay flagged but none built - true for most of this epic's life, and the
    // guard must refuse to report success rather than pass over a list it cannot check.
    name: 'every flagged overlay marked planned, so the guard checks nothing',
    guard: 'check-overlay-contract.mjs',
    expect: /no flagged overlay is built yet/,
    stage: patch('packages/react/client-boundary.json', (m) => {
      for (const c of m.components) if (c.overlay) c.status = 'planned'
    }),
  },
  {
    // A component the classification calls built with nothing on disk. The guard must say so rather
    // than skip it, because skipping is how a component ships unchecked.
    name: 'an overlay classified built with no source directory',
    guard: 'check-overlay-contract.mjs',
    expect: /classified as a built overlay but has no source directory/,
    stage: patch('packages/react/client-boundary.json', (m) => {
      // The mutation CREATES its subject rather than flipping a real component's status. The first
      // version marked Popover built, and went stale the day Popover was built - the prover caught
      // that itself ("the mutation changed NOTHING in the staged copy - its target has moved"), and
      // a mutation whose target can be built out from under it is one that silently stops testing.
      m.components.push({ name: 'NeverBuilt', boundary: 'client', status: 'built', overlay: true })
    }),
  },
  {
    // No rule of its own at all. Distinct from "declares no layer token": that one has rules and no
    // token, this one has nothing for a token to live in, and the messages differ so an author is
    // told which.
    name: 'an overlay with no stylesheet rule of its own',
    guard: 'check-overlay-contract.mjs',
    expect: /no stylesheet rule of its own/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      const css = readFileSync(f, 'utf8')
      writeFileSync(f, css.replace(/\.clara-modal[\w-]*[^{]*\{[^}]*\}/g, ''))
    },
  },
  {
    // The conditional-at-rule branch, which round 8 ADDED and round 9 deleted without a single gate
    // noticing: replacing the `unconditional` filter with `const unconditional = rules` left this
    // prover at PASS, 129 killed, zero survivors. The entry below it ("declares no layer token at
    // all") REPLACES the token rather than RELOCATING it, so it fails through the same branch with
    // or without the filter and pins nothing. Verbatim round 5's finding against AC5's fallback
    // clause, one round later, in the fix for the defect.
    name: 'an overlay whose only layer token hides inside a conditional at-rule',
    guard: 'check-overlay-contract.mjs',
    expect: /takes `z-index` from a layer token/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      let css = readFileSync(f, 'utf8')
      // EVERY rule of this component that declares the token, not just the first. Modal declares it
      // on `.clara-modal` AND `.clara-modal__scrim`, so relocating one left the other unconditional
      // and the guard passed - correctly, since the component still declared it somewhere reachable.
      // An incomplete mutation is indistinguishable from a guard that cannot fail.
      const rules = [...css.matchAll(/\.clara-modal[\w-]*\s*\{[^}]*\}/g)]
        .map((m) => m[0]).filter((r) => /z-index:\s*var\(--clara-layer-/.test(r))
      if (!rules.length) throw new Error('prove entry found no .clara-modal rule carrying a layer token')
      // RELOCATED, not removed: the token still exists, it is simply unreachable on screen.
      for (const rule of rules) css = css.replace(rule, `@media print { ${rule} }`)
      writeFileSync(f, css)
    },
  },
  {
    // The namespace arm. Both Radix entries use NAMED imports, so nothing reached the
    // `PropertyAccessExpression` branch and deleting it left the prover at exit 0 - while AC8
    // lists `<Dialog.Portal>` as an observed-failing shape (round 9).
    name: 'an overlay reaching for a Radix portal through a namespace import',
    guard: 'check-overlay-contract.mjs',
    expect: /renders <Dialog\.Portal>, a Radix portal/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Modal/Modal.tsx')
      writeFileSync(f, readFileSync(f, 'utf8')
        + `\nexport function ModalNamespaceProbe () { return <Dialog.Portal /> }\n`)
    },
  },
  {
    // The SECOND name Radix exports for the same primitive. `DialogPortal` is a first-class export
    // of @radix-ui/react-dialog and the one an editor's auto-import offers, and the match was
    // `=== 'Portal'`, so it caught half the idiom (round 8). Two entries on this branch rather than
    // one, deliberately: a single probe cannot show that BOTH names are matched, because narrowing
    // the match to either name alone still fails on a probe carrying both.
    name: 'an overlay reaching for a Radix portal under its prefixed export name',
    guard: 'check-overlay-contract.mjs',
    expect: /renders <DialogPortal>, a Radix portal/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Modal/Modal.tsx')
      writeFileSync(f, `import { DialogPortal } from '@radix-ui/react-dialog'\n`
        + readFileSync(f, 'utf8')
        + `\nexport function ModalPrefixedProbe () { return <DialogPortal /> }\n`)
    },
  },
  {
    // ONLY the ClaraPortal rule: the portal element is gone and no Radix portal replaces it. The
    // IMPORT is deliberately left in place, because an unused import satisfying the check is one
    // of the defeats the text-matching version shipped with.
    name: 'an overlay that renders no ClaraPortal, with the import still sitting there',
    guard: 'check-overlay-contract.mjs',
    expect: /renders no <ClaraPortal>/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Modal/Modal.tsx')
      writeFileSync(f, readFileSync(f, 'utf8')
        .replaceAll('<ClaraPortal', '<div').replaceAll('</ClaraPortal>', '</div>'))
    },
  },
  {
    // The stacking half. Declaring NO z-index passes the z-index rule, because that rule is a
    // denylist against hand-typed numbers rather than a requirement to use the scale.
    name: 'an overlay that declares no layer token at all, so it stacks on auto',
    guard: 'check-overlay-contract.mjs',
    expect: /takes `z-index` from a layer token/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replaceAll('z-index: var(--clara-layer-overlay);', 'top: 0;'))
    },
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
    // The shape was the only thing checked, so a reference to a token that does not exist passed
    // and emitted a var() pointing at nothing.
    name: 'a tier 2 token referencing a tier 1 token that does not exist',
    guard: 'check-token-output.mjs',
    expect: /references no tier 1 token/,
    stage: patch('packages/tokens/src/semantic/overlay.json', (m) => {
      m.color.bg.scrim.value = '{color.black-alpha.99}'
    }),
  },
  {
    // A script that EMITS CSS can name a token the build does not produce, and nothing renders an
    // error - it resolves to nothing. The manual-check fixture did exactly that and served a page
    // with no background, in a fixture whose only purpose is to have a human judge appearance.
    name: 'a CSS-emitting script referencing a token the build does not produce',
    guard: 'check-public-tokens.mjs',
    withGit: true,
    expect: /not a token this build emits/,
    stage: (stage) => {
      const f = join(stage, 'scripts/make-manual-fixture.mjs')
      writeFileSync(f, readFileSync(f, 'utf8').replace('--clara-color-bg-canvas', '--clara-color-bg-default'))
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
      // Target `.clara-input`'s OWN block. A bare `.replace(/min-height: .../)` took the first
      // occurrence in the file, which stopped being this one as rules were added above it - so the
      // mutation still changed the file (passing the no-op check) while no longer testing anything.
      // "Changed something" is not "changed the intended thing".
      const f = join(stage, 'packages/react/src/styles.css')
      const text = readFileSync(f, 'utf8')
      const at = text.indexOf('.clara-input {')
      const close = text.indexOf('}', at)
      const block = text.slice(at, close).replace(/\n\s*min-height:[^;]*;/, '')
      writeFileSync(f, text.slice(0, at) + block + text.slice(close))
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
    expect: /\.clara-input-group declares no `(border|width)`/,
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
    // Same layer, same specificity: the later rule wins and nothing here can see it. A commit adding
    // a focus ring appended a second `.clara-text--truncate` whose `display: block` overrode the
    // original `inline-block`, turning an inline truncated Text into a full-width block.
    name: 'a selector redeclared with a conflicting value',
    guard: 'check-component-css.mjs',
    expect: /declares `display` twice with different values/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-text--truncate { display: block; }\n')
    },
  },
  {
    // Comparing the selector STRING could not see a descendant selector, which removes the element
    // from the accessibility tree just as effectively - one line silently reverts D0071 everywhere.
    name: 'the visually-hidden class hidden by a descendant selector',
    guard: 'check-component-css.mjs',
    expect: /removes it from the accessibility tree/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-field .clara-visually-hidden { display: none; }\n')
    },
  },
  {
    // A record citing a test file that does not import its component: path-resolves was standing in
    // for evidence-is-there, inside the guard that enforces exactly that distinction.
    name: 'a verification record citing a test file that does not import its component',
    guard: 'check-verification.mjs',
    expect: /does not import Checkbox - the assertions are in/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/components/Checkbox/verification.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '../Field/__tests__/behaviour.test.tsx',
        '../__tests__/primitives.test.tsx',
      ))
    },
  },
  {
    // The SCOPED path, which is the one every acceptance criterion uses and which no mutation had
    // ever exercised. Two holes shipped in it unnoticed before this existed.
    name: 'a component losing its focus ring, checked the way its acceptance criterion checks it',
    guard: 'check-component-css.mjs',
    args: ['--component', 'SearchInput'],
    expect: /\.clara-search__clear is focusable and has no `:focus-visible` rule/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace('.clara-search__clear:focus-visible,\n', ''))
    },
  },
  {
    // D0087/D0088 made the layer scale binding, and the rule that binds it was proved by nothing:
    // neutering `zIndexProblems` to `return []` left check:component-css AND check:prove-guards both
    // PASS. Four entries, because two review passes defeated the first two versions with real CSS.
    name: 'a hand-typed z-index in component CSS',
    guard: 'check-component-css.mjs',
    expect: /does not resolve through exactly one layer token/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { position: fixed; z-index: 999999; }\n')
    },
  },
  {
    // CSS property names are case-insensitive; PostCSS preserves the author's case.
    name: 'a hand-typed z-index written in capitals, which a case-sensitive prop test misses',
    guard: 'check-component-css.mjs',
    expect: /does not resolve through exactly one layer token/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { position: fixed; Z-INDEX: 999999; }\n')
    },
  },
  {
    // "The value CONTAINS a layer token" was never the property. This is a hand-typed 999999.
    name: 'a hand-typed z-index smuggled past a containment test inside calc()',
    guard: 'check-component-css.mjs',
    expect: /may only add or subtract a single-digit offset/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n.probe { position: fixed; z-index: calc(999999 + 0 * var(--clara-layer-overlay)); }\n')
    },
  },
  {
    // Thirteen overlays are React components, and Radix positions them with inline styles.
    name: 'a hand-typed z-index in an inline style, where no stylesheet walk can see it',
    guard: 'check-component-css.mjs',
    expect: /inline zIndex is not a layer token/,
    stage: probeComponent('  return <div style={{ zIndex: 999999 }} />'),
  },
  {
    // One line of legal CSS put the hand-typed number back with the z-index rule fully green: a
    // component that redefines --clara-layer-overlay overrides it for its whole subtree.
    name: 'a component redefining a layer token, which makes the scale a local literal',
    guard: 'check-component-css.mjs',
    expect: /redefines --clara-layer-overlay/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n.probe { --clara-layer-overlay: 999999; position: fixed; z-index: var(--clara-layer-overlay); }\n')
    },
  },
  {
    // A position that applies only at one breakpoint does not satisfy an obligation that holds
    // always - the escape SHAPE_CONTRACT's own docblock names, at a rule written afterwards.
    name: 'a layer token whose companion position hides inside a media query',
    guard: 'check-component-css.mjs',
    expect: /no unconditional non-static/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n@media (min-width: 3000px) { .probe { position: fixed } }\n.probe { z-index: var(--clara-layer-overlay); }\n')
    },
  },
  {
    // The inline walk matched a literal property assignment only. A shorthand over a const is the
    // shortest way past it, and Radix-positioned overlays build style objects exactly like this.
    name: 'a hand-typed z-index reaching an inline style through a shorthand property',
    guard: 'check-component-css.mjs',
    expect: /inline zIndex is set from a variable/,
    stage: probeComponent('  const zIndex = 999999\n  return <div style={{ zIndex }} />'),
  },
  {
    // Setting it through the DOM rather than through JSX is invisible to a JSX-only walk.
    name: 'a hand-typed z-index written straight onto element.style',
    guard: 'check-component-css.mjs',
    expect: /assigned through element\.style/,
    stage: probeComponent('  const el = document.createElement("div")\n  el.style.zIndex = String(999999)\n  return null'),
  },
  {
    // And through the CSSOM, which is neither JSX nor a stylesheet.
    name: 'a hand-typed z-index set through style.setProperty',
    guard: 'check-component-css.mjs',
    expect: /z-index "999999" does not resolve/,
    stage: probeComponent('  const el = document.createElement("div")\n  el.style.setProperty("z-index", "999999")\n  return null'),
  },
  {
    // AC5's Then-clause enumerates five inline shapes and says the guard "is proved able to fail on
    // each of them rather than assumed to be". Three of the five had no entry here, so the claim
    // was assumed: deleting the cssText branch, the setAttribute branch and the computed-key arm of
    // the property-name resolution left this prover at exit 0 and the story's AC gate at
    // pass=5 fail=0, with three named escapes reopened (US-01M0GM61 round 5, anton-reis).
    name: 'a hand-typed z-index reaching an inline style through a computed key',
    guard: 'check-component-css.mjs',
    expect: /inline zIndex is not a layer token|does not resolve/,
    stage: probeComponent("  return <div style={{ ['zIndex']: 999999 }} />"),
  },
  {
    // A whole style attribute written as one string - neither a stylesheet nor a style OBJECT.
    name: 'a hand-typed z-index written as a whole style attribute',
    guard: 'check-component-css.mjs',
    expect: /z-index set by writing a whole style attribute/,
    stage: probeComponent('  const el = document.createElement("div")\n  el.setAttribute("style", "z-index: 999999")\n  return null'),
  },
  {
    // The CSSOM's bulk-write path, which parses CSS text nothing in this repo walks.
    name: 'a hand-typed z-index set through style.cssText',
    guard: 'check-component-css.mjs',
    expect: /z-index set through cssText/,
    stage: probeComponent('  const el = document.createElement("div")\n  el.style.cssText = "z-index: 999999"\n  return null'),
  },
  {
    // AC5 says the guard "says so in its own diagnostic rather than reporting the generic 'does not
    // resolve'". That clause had no entry, so deleting the branch left this prover at exit 0 and
    // the whole AC gate green while the shape failed with the exact message AC5 forbids - the same
    // unproven-clause defect the three entries above were added to remove, in the same criterion
    // and in the same edit (US-01M0GM61 round 6).
    name: 'a layer token given a fallback, refused without saying why',
    guard: 'check-component-css.mjs',
    expect: /supplies a FALLBACK to a layer token/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, `${readFileSync(f, 'utf8')}\n.clara-probe-fb { position: fixed; z-index: var(--clara-layer-overlay, 0); }\n`)
    },
  },
  {
    // A legal nudge, written enough times to clear a layer boundary. Every term passes on its own.
    name: 'a single-digit offset chained until it clears the layer above',
    guard: 'check-component-css.mjs',
    expect: /nudges a layer token by/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + `\n.probe { position: fixed; z-index: calc(var(--clara-layer-overlay)${' + 9'.repeat(10)}); }\n`)
    },
  },
  {
    // The tier rule was case-sensitive while CSS is not, two lines above a check this repo had
    // already made case-insensitive for the same reason.
    name: 'a tier 1 primitive read through an uppercase VAR()',
    guard: 'check-component-css.mjs',
    expect: /a tier 1 primitive/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { COLOR: VAR(--clara-color-neutral-600); }\n')
    },
  },
  {
    // SHAPE_CONTRACT checks a property is DECLARED. For a scroll container the value is the whole
    // point, and `visible` satisfied the declaration while turning off the behaviour AC5 names.
    name: 'a scroll container whose overflow value turns the scrolling off',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal__body's `overflow` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      // Scoped to the rule this entry NAMES. A bare `.replace('overflow-y: auto;', ...)` takes the
      // first occurrence in the file, so the moment Drawer's body rule landed earlier the mutation
      // silently moved to a component this entry says nothing about - and the Modal contract stayed
      // satisfied, so it SURVIVED. A position-dependent mutation is a mutation that stops testing
      // what it claims to.
      const css = readFileSync(f, 'utf8')
      const rule = css.match(/\.clara-modal__body\s*\{[^}]*\}/)
      if (!rule) throw new Error('prove entry could not find .clara-modal__body to mutate')
      writeFileSync(f, css.replace(rule[0], rule[0].replace('overflow-y: auto', 'overflow-y: visible')))
    },
  },
  {
    // A panel painted with a theme-invariant token renders a dark modal on a light ground, and the
    // theme/density matrix cannot see it - it reads attributes off the portal wrapper.
    name: 'an overlay panel painted with a token that does not resolve per theme',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `background` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '  background: var(--clara-color-bg-surface);\n  color: var(--clara-color-fg-default);',
        '  background: var(--clara-color-bg-scrim);\n  color: var(--clara-color-fg-default);'))
    },
  },
  {
    // D0094: no motion, decided rather than omitted. The stylesheet claimed the absence was
    // asserted while nothing asserted it.
    name: 'motion added to an overlay that decided not to have any',
    guard: 'check-component-css.mjs',
    expect: /has no motion by decision/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '  background: var(--clara-color-bg-scrim);',
        '  background: var(--clara-color-bg-scrim);\n  transition: opacity 120ms ease-out;'))
    },
  },
  {
    // The value contract checked one property name, so the longhand repainted the panel with the
    // scrim token in BOTH themes and every gate stayed green.
    name: 'an overlay panel repainted through the longhand the value contract did not check',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `background` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal { background-color: var(--clara-color-bg-scrim); }\n')
    },
  },
  {
    // Selector matching was string-identical, so a descendant rule turned the scroll container off.
    name: 'a value contract defeated by a descendant selector',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal__body's `overflow` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal .clara-modal__body { overflow-y: visible; }\n')
    },
  },
  {
    // `[data-state]` is what Radix stamps, so it is the selector every overlay actually writes.
    name: 'a per-role z-index reintroduced through an attribute selector',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `z-index` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n.clara-modal[data-state="open"] { z-index: calc(var(--clara-layer-overlay) + 1); }\n')
    },
  },
  {
    // Clara ships no reset, so the padding and border sat outside the width and the panel rendered
    // wider than the viewport. jsdom computes no layout; only the declaration is observable.
    name: 'a full-width overlay losing box-sizing, so its padding overflows the viewport',
    guard: 'check-component-css.mjs',
    expect: /declares no `box-sizing`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      const css = readFileSync(f, 'utf8')
      const i = css.indexOf('.clara-modal {')
      const j = css.indexOf('}', i)
      writeFileSync(f, css.slice(0, i) + css.slice(i, j).replace('  box-sizing: border-box;\n', '') + css.slice(j))
    },
  },
  {
    // A flex column shrinks its children, so a fixed-height child is squashed rather than scrolled.
    name: 'a scroll container whose children shrink instead of scrolling',
    guard: 'check-component-css.mjs',
    expect: /declares no `flex-shrink`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace('  flex-shrink: 0;', '  flex-basis: auto;'))
    },
  },
  {
    // `background` -> `background-color` -> `background-image`. Each round supplied the next name,
    // which is why the contract is now a family prefix that fails closed.
    name: 'an overlay panel repainted through a gradient, a property no list enumerated',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `background` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n.clara-modal { background-image: linear-gradient(var(--clara-color-bg-scrim), var(--clara-color-bg-scrim)); }\n')
    },
  },
  {
    // The shorthand sets what the longhand contract pinned.
    name: 'a scroll container turned off through the overflow shorthand',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal__body's `overflow` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal__body { overflow: visible; }\n')
    },
  },
  {
    // `flex: 1` resets flex-shrink to 1, so the fix that pinned flex-shrink was overridden rather
    // than deleted - and a 2000px chart rendered at 18px, worse than before the fix.
    name: 'a scroll container whose children shrink again through the flex shorthand',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal__body > \*'s `flex` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal__body > * { flex: 1; }\n')
    },
  },
  {
    // Split-and-pop selector matching walked past both of these.
    name: 'a contract defeated by a comma inside :is()',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `z-index` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n:is(.clara-modal, .clara-nothing) { z-index: calc(var(--clara-layer-overlay) + 1); }\n')
    },
  },
  {
    name: 'a contract defeated by selecting the class without a class selector',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal's `background` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n[class~="clara-modal"] { background-color: var(--clara-color-bg-scrim); }\n')
    },
  },
  {
    // A contract selector may be COMPOUND. `.clara-modal__body > *` could never match a class node
    // value, so that row was protected only by its exact-string branch and a descendant selector
    // re-entered a CRITICAL one round after it was fixed.
    name: 'a compound contract defeated by prefixing a descendant selector',
    guard: 'check-component-css.mjs',
    expect: /does not satisfy .clara-modal__body > \*'s `flex` contract/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal .clara-modal__body > * { flex: 1; }\n')
    },
  },
  {
    // NO_MOTION was left out of the parser conversion, so it stayed an exact-string match over five
    // literals - and `.clara-modal--sm` is a selector Modal already ships.
    name: 'motion added through a modifier the exact-string motion rule could not see',
    guard: 'check-component-css.mjs',
    expect: /has no motion by decision/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8')
        + '\n.clara-modal--sm { transition: opacity var(--clara-duration-fast) ease-out; }\n')
    },
  },
  {
    // A blanket reset removes the whole box with nothing left to point at.
    name: 'an overlay panel stripped by a blanket all: revert',
    guard: 'check-component-css.mjs',
    expect: /discards every declaration the contracts rely on/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.clara-modal { all: revert; }\n')
    },
  },
  {
    // Any theme that was not literally `dark` got measured against LIGHT values under its own name.
    name: 'a third theme whose scrim is measured against the wrong theme entirely',
    guard: 'check-foundations.mjs',
    expect: /^\s+hc: page text behind the scrim/m,
    stage: (stage) => {
      const alpha = join(stage, 'packages/tokens/src/primitive/alpha.json')
      const m = JSON.parse(readFileSync(alpha, 'utf8'))
      m.color['black-alpha']['95'] = { value: '#000000F2', type: 'color' }
      writeFileSync(alpha, JSON.stringify(m, null, 2) + '\n')
      const hc = JSON.parse(readFileSync(join(stage, 'packages/tokens/src/themes/dark.json'), 'utf8'))
      hc.color.bg.scrim = { value: '{color.black-alpha.95}', type: 'color' }
      writeFileSync(join(stage, 'packages/tokens/src/themes/hc.json'), JSON.stringify(hc, null, 2) + '\n')
    },
  },
  {
    // `includes` matched a package name that is a PREFIX of a real one and fabricated a budget.
    name: 'a runtime dependency matched as a substring of another package name',
    guard: 'sync-size-budgets.mjs',
    args: ['--check'],
    expect: /@radix-ui\/react-dialo is a declared runtime dependency/,
    stage: patch('packages/react/package.json', (m) => {
      m.dependencies['@radix-ui/react-dialo'] = '^1.0.0'
    }),
  },
  {
    // The dark leg resolved the LIGHT token, so a dark override making the page unreadable passed.
    name: 'a dark-theme scrim override that makes the page behind it unreadable',
    guard: 'check-foundations.mjs',
    expect: /dark: page text behind the scrim/,
    stage: (stage) => {
      const alpha = join(stage, 'packages/tokens/src/primitive/alpha.json')
      const m = JSON.parse(readFileSync(alpha, 'utf8'))
      m.color['black-alpha']['95'] = { value: '#000000F2', type: 'color' }
      writeFileSync(alpha, JSON.stringify(m, null, 2) + '\n')
      const dark = join(stage, 'packages/tokens/src/themes/dark.json')
      const d = JSON.parse(readFileSync(dark, 'utf8'))
      d.color.bg.scrim = { value: '{color.black-alpha.95}', type: 'color' }
      writeFileSync(dark, JSON.stringify(d, null, 2) + '\n')
    },
  },
  {
    // D0092 rejects 0.40-0.45; the max-of-two rule permitted the whole band.
    name: 'a scrim alpha inside the band its own decision record rejects',
    guard: 'check-foundations.mjs',
    expect: /inside the 0\.40-0\.45 band/,
    stage: patch('packages/tokens/src/primitive/alpha.json', (m) => {
      m.color['black-alpha']['50'].value = '#0000006B'
    }),
  },
  {
    // The scrim's alpha is solved against two measured bounds, and both were prose until now.
    name: 'a scrim alpha that leaves the page behind it unreadable',
    guard: 'check-foundations.mjs',
    expect: /below the 4\.5:1 reading floor/,
    stage: patch('packages/tokens/src/primitive/alpha.json', (m) => {
      m.color['black-alpha']['50'].value = '#000000A6'
    }),
  },
  {
    // A scrim built from the neutral ramp instead of true black does nothing at all in dark, and
    // the two-part boundary rule still passes it because the dark BORDER cue carries the panel.
    name: 'a scrim built from the ramp, which does not dim the dark theme at all',
    guard: 'check-foundations.mjs',
    expect: /barely dims the page/,
    stage: patch('packages/tokens/src/primitive/alpha.json', (m) => {
      m.color['black-alpha']['50'].value = '#1f1e1d80'
    }),
  },
  {
    // A z-index on a statically positioned element is ignored by the browser, and jsdom computes no
    // layout, so the surface would have no stacking at all with every gate green.
    name: 'a layer token on an element with no non-static position, where it is inert',
    guard: 'check-component-css.mjs',
    expect: /has no unconditional non-static/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8') + '\n.probe { z-index: var(--clara-layer-overlay); }\n')
    },
  },
  {
    name: 'a component losing its box, checked the way its acceptance criterion checks it',
    guard: 'check-component-css.mjs',
    args: ['--component', 'Field'],
    expect: /\.clara-field declares no `display`/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/styles.css')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '.clara-field { display: grid; gap: var(--clara-space-control-gap); }',
        '.clara-field { color: var(--clara-color-fg-default); }',
      ))
    },
  },
  {
    // The end-to-end chunk-placement build was swallowed by a bare `build/` line in .gitignore. It
    // passed on the author's machine for three epics, was cited as evidence in D0051, and CI never
    // ran it - local and CI differed by exactly its nine tests, invisible until a derived figure
    // disagreed between them.
    name: 'a test file that git ignores, so CI never runs it',
    guard: 'check-tracked.mjs',
    withGit: true,
    expect: /is loaded by a gate but is NOT tracked by git/,
    stage: (stage) => {
      // Written AFTER `git add -A`, so it is untracked exactly as an ignored file would be.
      writeFileSync(join(stage, 'test', 'ghost.test.ts'), "import { it } from 'vitest'\nit('x', () => {})\n")
    },
  },
  {
    // `vitest -t` exits 0 when its pattern matches nothing, so a renamed describe turns a
    // `Verified: yes` criterion into a green check that ran no test. Raised by a review seat that
    // proved the vacuity by hand.
    name: 'a verified criterion whose test selector matches no test in the suite',
    guard: 'check-story-verifiers.mjs',
    withStories: true,
    expect: /matches no test name in the suite/,
    stage: (stage) => {
      const f = join(stage, 'sdlc-studio/stories/US-01M0GM9E-switch.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace('vitest "Switch uses role switch"', 'vitest "Switch uses a role that no test declares"'))
    },
  },
  {
    // CR-01M0SKZ6, case A: the verifier selects tests that cannot see the code its own mutant
    // changes. US-01M0GM61 AC3 shipped exactly like this - the DOM-order tests were renamed out
    // from under the selector and the criterion stayed green on three token comparisons.
    name: 'a verified criterion whose verifier cannot reach the file its mutant changes',
    guard: 'check-story-verifiers.mjs',
    withStories: true,
    expect: /none of which import/,
    stage: (stage) => {
      const f = join(stage, 'packages/react/src/theme/__tests__/theming.test.tsx')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        "describe('the overlay stacking order in the DOM'", "describe('portals stack by open order'"))
    },
  },
  {
    // Case B: a vitest-only verifier over a stylesheet mutant. jsdom computes no layout, so the
    // criterion is green by construction - which is how Modal AC5 certified a modal whose body
    // did not scroll.
    name: 'a vitest-only verifier over a mutant in an asset no test can load',
    guard: 'check-story-verifiers.mjs',
    withStories: true,
    expect: /which no test imports or reads, but the verifier is vitest only/,
    stage: (stage) => {
      const f = join(stage, 'sdlc-studio/stories/US-01M0GM48-modal.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '- **Verify:** shell npx vitest run -t "Modal body scrolls internally" && node scripts/check-component-css.mjs --component Modal',
        '- **Verify:** vitest "Modal body scrolls internally"'))
    },
  },
  {
    // A Touches entry that names nothing real is a row that looks checked and is not.
    name: 'a Test Plan row naming a file that does not exist',
    guard: 'check-story-verifiers.mjs',
    withStories: true,
    expect: /which does not exist/,
    stage: (stage) => {
      const f = join(stage, 'sdlc-studio/stories/US-01M0GM48-modal.md')
      writeFileSync(f, readFileSync(f, 'utf8').replace(
        '| AC1 | packages/react/src/components/Modal/Modal.tsx |',
        '| AC1 | packages/react/src/components/Modal/Gone.tsx |'))
    },
  },
  {
    // Two criteria were added and their rows were not, so the last row carried the NEXT criterion's
    // mutant and every row after the gap named the wrong one.
    name: 'a criterion added without its Test Plan row',
    guard: 'check-story-verifiers.mjs',
    withStories: true,
    expect: /criteria but \d+ Test Plan row\(s\)/,
    stage: (stage) => {
      const f = join(stage, 'sdlc-studio/stories/US-01M0GM9E-switch.md')
      const text = readFileSync(f, 'utf8')
      const at = text.indexOf('## Test Plan')
      const firstRow = text.indexOf('| AC1 |', at)
      const eol = text.indexOf('\n', firstRow)
      writeFileSync(f, text.slice(0, firstRow) + text.slice(eol + 1))
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
    // Every SCANNED source, not just the docs page. The vacuity check asks whether the scan found
    // any reference at all, so stripping one source while another still supplies them does not
    // reach it - which is exactly what happened when the fixture generator joined the scan.
    name: 'every scanned source stripped of its token references',
    guard: 'check-public-tokens.mjs',
    expect: /this gate checked nothing/,
    stage: (stage) => {
      writeFileSync(join(stage, 'apps/docs/src/content/foundations/tokens.md'), '# Design tokens\n\nNothing here.\n')
      const fixture = join(stage, 'scripts/make-manual-fixture.mjs')
      if (existsSync(fixture)) {
        writeFileSync(fixture, readFileSync(fixture, 'utf8').replace(/--clara-[\w-]+/g, 'REMOVED'))
      }
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

for (const { name, guard, stage: corrupt, expect, args = [], withGit = false, withStories = false } of OUTPUT_CASES) {
  const stage = stageWorkspace({ withOutput: true, withGit, withStories })
  try {
    const clean = runGuard(guard, stage, args)
    if (clean.code !== 0) {
      problems.push(`${name}: ${guard} already fails on an unmutated copy (exit ${clean.code})`)
      continue
    }
    // The no-op check belongs HERE most of all. These 70 mutations are the fragile ones - string
    // replacements against styles.css, verification.md and ci.yml - and the case that motivated the
    // check (`.clara-link:focus-visible {` becoming a no-op) is one of them. It was installed only
    // on the other loop, whose seven JSON patches can barely no-op at all.
    const before = snapshot(stage)
    corrupt(stage)
    if (snapshot(stage) === before) {
      problems.push(
        `${name}: the mutation changed NOTHING in the staged copy - its target has moved, so it ` +
        'proves nothing. This is not a guard failure; it is a stale mutation.',
      )
      continue
    }
    const result = runGuard(guard, stage, args)
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
