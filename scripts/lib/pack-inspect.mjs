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
