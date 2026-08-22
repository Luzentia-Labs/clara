import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error - plain .mjs helper
import { workspaceRoots, readWorkspace } from '../workspace.mjs'

/**
 * US-01M0GMKD AC5 / CR-01M0HT8N. A hardcoded root list made every guard blind to a new workspace
 * glob at once - including check-private, which is what keeps an unintended package from being
 * publishable. Asserted by BEHAVIOUR: add a glob, the guards must see what is under it.
 */
describe('workspace roots come from pnpm-workspace.yaml', () => {
  const stage = (yaml: string | null, dirs: string[] = []) => {
    const root = mkdtempSync(join(tmpdir(), 'clara-roots-'))
    if (yaml !== null) writeFileSync(join(root, 'pnpm-workspace.yaml'), yaml)
    for (const d of dirs) {
      mkdirSync(join(root, d), { recursive: true })
      writeFileSync(join(root, d, 'package.json'), JSON.stringify({ name: d.replace('/', '-') }))
    }
    return root
  }

  it('reads the declared globs', () => {
    const root = stage('packages:\n  - "packages/*"\n  - "apps/*"\n')
    try {
      expect(workspaceRoots(root)).toEqual(['packages', 'apps'])
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  it('sees a THIRD glob, which a hardcoded list could not', () => {
    const root = stage('packages:\n  - "packages/*"\n  - "apps/*"\n  - "tools/*"\n', ['tools/rogue'])
    try {
      expect(workspaceRoots(root)).toContain('tools')
      expect(readWorkspace(root).map((p: { manifest: { name: string } }) => p.manifest.name)).toContain('tools-rogue')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  it('honours a glob the conventional pair does not include, and DROPS one it removes', () => {
    const root = stage('packages:\n  - "libs/*"\n', ['libs/one', 'packages/ignored'])
    try {
      expect(workspaceRoots(root)).toEqual(['libs'])
      const names = readWorkspace(root).map((p: { manifest: { name: string } }) => p.manifest.name)
      expect(names).toContain('libs-one')
      expect(names).not.toContain('packages-ignored')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  it('falls back to the conventional pair only when the file is absent', () => {
    const root = stage(null)
    try {
      expect(workspaceRoots(root)).toEqual(['packages', 'apps'])
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
})
