#!/usr/bin/env node
// Pack every publishable package the way the release actually publishes it, and inspect what a
// consumer would receive.
//
// The failure this exists for is permanent. `npm pack` leaves `workspace:*` verbatim in
// dependencies; only pnpm rewrites it to a real version at pack/publish time. A tarball published
// with `"@luzentialabs/clara-tokens": "workspace:*"` fails EVERY consumer install with
// EUNSUPPORTEDPROTOCOL, and a release cannot be withdrawn - only superseded. The release path uses
// changesets (pnpm publish) so it is correct today; nothing asserted it, which is the gap.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fail, pass, readWorkspace } from './lib/workspace.mjs'
import { inspectTarball } from './lib/pack-inspect.mjs'

const RULE = 'pack'
const errors = []
const packed = []

for (const { dir, manifest } of readWorkspace()) {
  if (manifest.private) continue
  const out = mkdtempSync(join(tmpdir(), 'clara-pack-'))
  try {
    execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, stdio: 'pipe' })
    const tgz = readdirSync(out).find((f) => f.endsWith('.tgz'))
    if (!tgz) { errors.push(`${manifest.name}: pnpm pack produced no tarball`); continue }

    const listing = execFileSync('tar', ['-tzf', join(out, tgz)], { encoding: 'utf8' })
      .split('\n').filter(Boolean)
    const shipped = JSON.parse(
      execFileSync('tar', ['-xzOf', join(out, tgz), 'package/package.json'], { encoding: 'utf8' }))

    errors.push(...inspectTarball(manifest.name, shipped, listing))

    packed.push(`${manifest.name} (${listing.length} files)`)
  } catch (error) {
    errors.push(`${manifest.name}: pack failed - ${String(error.stderr ?? error.message).slice(0, 160)}`)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

if (!packed.length && !errors.length) errors.push('no publishable package was packed - the check verified nothing')
if (errors.length) fail(RULE, errors)
pass(RULE, `${packed.length} tarball(s) inspected, no workspace/link protocol, every exports target shipped: ${packed.join(', ')}`)
