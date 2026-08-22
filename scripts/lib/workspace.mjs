import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The workspace roots declared in pnpm-workspace.yaml, e.g. ['packages', 'apps'].
 * Falls back to the conventional pair only when the file is absent, and says so by returning it -
 * a missing workspace file is a different fact from an empty one.
 */
export function workspaceRoots (root = process.cwd()) {
  const file = join(root, 'pnpm-workspace.yaml')
  if (!existsSync(file)) return ['packages', 'apps']
  const globs = [...readFileSync(file, 'utf8').matchAll(/^\s*-\s*["']?([^"'\n]+)["']?\s*$/gm)].map((m) => m[1])
  // `packages/*` -> `packages`. A glob with no separator names the root directly.
  const roots = [...new Set(globs.map((g) => g.split('/')[0]).filter(Boolean))]
  return roots.length ? roots : ['packages', 'apps']
}

/** Every workspace manifest, as {dir, kind, manifest}. Read from disk, never assumed. */
export function readWorkspace (root = process.cwd()) {
  const out = []
  // Read the globs from pnpm-workspace.yaml rather than hardcoding them. A hardcoded
  // `['packages','apps']` made every guard blind to a new workspace root at once - including
  // check-private, which is what keeps an unintended package from being publishable
  // (CR-01M0HT8N, and round 7 raised it again as X17). Parsed with a narrow reader rather than a
  // YAML dependency: the file is a flat list of quoted globs.
  for (const kind of workspaceRoots(root)) {
    const base = join(root, kind)
    if (!existsSync(base)) continue
    for (const name of readdirSync(base).sort()) {
      const file = join(base, name, 'package.json')
      if (!existsSync(file)) continue
      out.push({ dir: `${kind}/${name}`, kind, manifest: JSON.parse(readFileSync(file, 'utf8')) })
    }
  }
  return out
}

export function fail (rule, lines) {
  console.error(`FAIL [${rule}]`)
  for (const l of lines) console.error(`  ${l}`)
  process.exit(1)
}

export function pass (rule, summary) {
  console.log(`PASS [${rule}] ${summary}`)
}
