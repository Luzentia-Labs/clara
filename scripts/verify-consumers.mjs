#!/usr/bin/env node
/**
 * Build the published tarballs in a real consumer (TRD Section 9 gate 13, PRD F20/F23).
 *
 * The apps are copied OUT of the workspace before installing. That is the whole point: inside it,
 * pnpm resolves `@luzentialabs/*` to a workspace link, so the app would build against `src` and
 * prove nothing about what a consumer receives. Outside it, with `file:` tarballs, the install
 * exercises the exports map, the `files` list, the dependency ranges and the emitted chunks -
 * the things that only fail on someone else's machine.
 *
 * The Next.js app is the one that catches the defect this epic exists for. Its page is a SERVER
 * component rendering a client-only one; if `"use client"` did not survive bundling, `next build`
 * fails with "you're importing a component that needs useState". No browser required.
 *
 * Usage: node scripts/verify-consumers.mjs [--app verify-next] [--keep]
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, cpSync, rmSync, readdirSync, readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'

const RULE = 'consumers'
const root = process.cwd()
const args = process.argv.slice(2)
const only = args.includes('--app') ? args[args.indexOf('--app') + 1] : null
const keep = args.includes('--keep')

const run = (cmd, cmdArgs, cwd) =>
  execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, CI: '1' } })

// 1. Pack every publishable package the way the release publishes it.
const packDir = mkdtempSync(join(tmpdir(), 'clara-tarballs-'))
const tarballs = new Map()
for (const { dir, manifest } of readWorkspace(root)) {
  if (manifest.private) continue
  run('pnpm', ['pack', '--pack-destination', packDir], join(root, dir))
}
for (const file of readdirSync(packDir)) {
  if (!file.endsWith('.tgz')) continue
  const name = JSON.parse(run('tar', ['-xzOf', join(packDir, file), 'package/package.json'], packDir)).name
  tarballs.set(name, join(packDir, file))
}
if (!tarballs.size) fail(RULE, ['no tarball was packed - there is nothing to verify'])

const problems = []
const built = []
const apps = readdirSync(join(root, 'apps')).filter((a) => a.startsWith('verify-'))
for (const app of apps) {
  if (only && app !== only) continue
  const src = join(root, 'apps', app)
  if (!existsSync(join(src, 'package.json'))) continue
  const stage = mkdtempSync(join(tmpdir(), `clara-${app}-`))
  try {
    cpSync(src, stage, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('/.next') })

    // Point every Clara dependency at a tarball. `overrides` covers the TRANSITIVE ones: the
    // react package depends on tokens and icons, and those versions do not exist on any registry.
    const manifestPath = join(stage, 'package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.dependencies = manifest.dependencies ?? {}
    manifest.dependencies['@luzentialabs/clara-react'] = `file:${tarballs.get('@luzentialabs/clara-react')}`
    manifest.overrides = Object.fromEntries([...tarballs].map(([name, file]) => [name, `file:${file}`]))
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

    // npm rather than pnpm, deliberately: a consumer is far more likely to use it, and it will
    // not reach back into this workspace for a link.
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], stage)

    // BG-01M0MFMZ, closed the way D0042 decided: verify the property in a CONSUMER rather than
    // asserting over our own build output. Seven oracle rewrites failed because every one of them
    // inspected an artifact we also produced, so each fix moved the trust boundary instead of
    // closing it. Here there is no such loop - if React resolves to the consumer's own copy, the
    // property holds regardless of how our build reached that state.
    const installed = join(stage, 'node_modules/@luzentialabs/clara-react')
    if (existsSync(join(installed, 'node_modules/react'))) {
      problems.push(`${app}: clara-react installed its OWN copy of react - a peer must resolve to the consumer's`)
    }
    // realpath both sides: on macOS the temp dir is /var/... which is a symlink to /private/var,
    // so a raw string comparison reports a false mismatch.
    const real = (p) => (existsSync(p) ? realpathSync(p) : resolve(p))
    const consumerReact = real(join(stage, 'node_modules/react'))
    const resolvedFromClara = real(run('node', ['-p', `require.resolve('react', { paths: [${JSON.stringify(installed)}] })`], stage).trim())
    if (!resolvedFromClara.startsWith(consumerReact)) {
      problems.push(`${app}: react resolves from clara-react to ${resolvedFromClara}, not the consumer's copy at ${consumerReact}`)
    }
    for (const chunk of readdirSync(join(installed, 'dist')).filter((f) => f.endsWith('.js') || f.endsWith('.cjs'))) {
      const code = readFileSync(join(installed, 'dist', chunk), 'utf8')
      // A bundled React brings its own internals with it; an externalised one only names it.
      if (/__SECRET_INTERNALS|ReactCurrentDispatcher|react\.production\.min/.test(code)) {
        problems.push(`${app}: dist/${chunk} contains React itself, not a reference to it`)
      }
    }
    const out = run('npm', ['run', 'build'], stage)
    built.push(app)

    // A build that emits a hydration or boundary warning has not passed, whatever its exit code.
    for (const pattern of [/hydration/i, /did not match/i, /needs useState/i, /use client/i]) {
      if (pattern.test(out)) problems.push(`${app}: build output mentions ${pattern} - ${firstMatch(out, pattern)}`)
    }
  } catch (error) {
    const detail = String(error.stdout ?? '') + String(error.stderr ?? '')
    problems.push(`${app}: ${firstUseful(detail) || error.message.slice(0, 200)}`)
  } finally {
    if (!keep) rmSync(stage, { recursive: true, force: true })
  }
}
if (!keep) rmSync(packDir, { recursive: true, force: true })

const firstMatch = (text, re) => (text.split('\n').find((l) => re.test(l)) ?? '').trim().slice(0, 160)
function firstUseful (text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const hit = lines.find((l) => /error|failed|cannot|missing|ERR!/i.test(l) && !/^npm error code/.test(l))
  return (hit ?? lines[lines.length - 1] ?? '').slice(0, 220)
}

if (!built.length && !problems.length) problems.push('no consumer app was built - the check verified nothing')
if (problems.length) fail(RULE, problems)
pass(RULE, `${built.length} consumer app(s) installed from tarballs and built clean: ${built.join(', ')}`)
