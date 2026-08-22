/**
 * Inspect what a consumer would receive from a tarball. Pure so it can be driven with crafted
 * manifests - packing a deliberately-broken package needs a broken workspace, which is why the
 * rules live here rather than inline in the guard.
 */

/** Ranges a consumer's registry install cannot resolve. */
const UNRESOLVABLE = ['workspace:', 'link:', 'file:']

export function inspectTarball (name, shipped, listing) {
  const errors = []

  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dep, range] of Object.entries(shipped[field] ?? {})) {
      const bad = UNRESOLVABLE.find((p) => String(range).startsWith(p))
      if (!bad) continue
      errors.push(`${name}: ships ${field}.${dep} = "${range}"`)
      errors.push(bad === 'workspace:'
        ? '  every consumer install fails with EUNSUPPORTEDPROTOCOL, and a release cannot be withdrawn'
        : '  that is a local path the consumer does not have')
    }
  }

  // D0049: an internal dependency ships as a caret, never an exact pin. `workspace:*` rewrites to
  // the exact version, so every published clara-react would hard-pin ONE build of clara-tokens and
  // a consumer on a later patch installs both copies - duplicate custom properties, duplicate
  // stylesheet, and size budgets that no longer describe what ships. Checked on the SHIPPED range,
  // because the on-disk `workspace:` protocol is not what a consumer resolves.
  for (const [dep, range] of Object.entries(shipped.dependencies ?? {})) {
    if (!dep.startsWith('@luzentialabs/')) continue
    // "Exact" means a bare semver and nothing else. `1.x`, `~1.2.0` and `>=1.0.0 <2.0.0` all let a
    // consumer dedupe, so only a fully-pinned version is a problem.
    if (/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(range).trim())) {
      errors.push(`${name}: ships dependencies.${dep} = "${range}", an exact pin`)
      errors.push('  declare it `workspace:^` so a consumer can dedupe within the major (D0049)')
    }
  }

  const inTarball = new Set(listing.map((f) => f.replace(/^package\//, '')))
  for (const target of new Set(exportTargets(shipped.exports))) {
    const rel = target.replace(/^\.\//, '')
    if (rel === 'package.json') continue
    if (!inTarball.has(rel)) errors.push(`${name}: exports "${target}" but the tarball has no ${rel}`)
  }

  return errors
}

/** Every string leaf of an exports map, however deeply conditioned. */
export function exportTargets (node, out = []) {
  if (typeof node === 'string') out.push(node)
  else if (node && typeof node === 'object') for (const v of Object.values(node)) exportTargets(v, out)
  return out
}
