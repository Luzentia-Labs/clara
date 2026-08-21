import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** Every workspace manifest, as {dir, kind, manifest}. Read from disk, never assumed. */
export function readWorkspace (root = process.cwd()) {
  const out = []
  for (const kind of ['packages', 'apps']) {
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
