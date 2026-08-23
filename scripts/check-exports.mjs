#!/usr/bin/env node
// Every reachable subpath is a permanent promise (TRD Section 5). A `./*` wildcard publishes
// the entire dist tree as API by accident, and a published subpath cannot be withdrawn without
// a major. TRD:206 requires CI to fail on a wildcard; this is that check.
import { readWorkspace, fail, pass } from './lib/workspace.mjs'

// The closed maps from TRD Section 5. A subpath absent here is not merely undeclared - it is
// a promise nobody decided to make.
const ALLOWED = {
  // Hardcoded ON PURPOSE, unlike the stylesheet budget that is derived from this map. A subpath is
  // permanent once published, so adding one has to be a deliberate edit HERE, in the independent
  // witness - not a consequence of the build happening to emit another file.
  '@luzentialabs/clara-tokens': ['.', './tokens.css', './themes/dark.css', './themes/compact.css',
    './tokens.json', './tokens.public.json', './package.json'],
  '@luzentialabs/clara-icons': ['.', './package.json'],
  '@luzentialabs/clara-react': ['.', './styles.css', './package.json'],
}

const pkgs = readWorkspace().filter(p => p.kind === 'packages')
const problems = []

for (const { dir, manifest } of pkgs) {
  const name = manifest.name
  const exp = manifest.exports
  if (!exp) { problems.push(`${dir}: no "exports" map - the public surface is undeclared`); continue }

  const subpaths = Object.keys(exp)
  for (const sp of subpaths) {
    if (sp.includes('*')) {
      problems.push(`${dir}: exports subpath "${sp}" contains a wildcard - every path it matches becomes permanent public API`)
    }
  }
  const allowed = ALLOWED[name]
  if (!allowed) { problems.push(`${dir}: "${name}" has no declared exports contract in this check`); continue }
  for (const sp of subpaths) {
    if (!allowed.includes(sp)) {
      problems.push(`${dir}: exports subpath "${sp}" is not in the closed map for ${name} (TRD Section 5)`)
    }
  }
  for (const sp of allowed) {
    if (!subpaths.includes(sp)) {
      problems.push(`${dir}: exports subpath "${sp}" is promised by TRD Section 5 but missing`)
    }
  }
}

if (problems.length) fail('exports', problems)
pass('exports', `${pkgs.length} package(s), maps closed, no wildcard`)
