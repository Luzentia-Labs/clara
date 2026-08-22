import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error - plain .mjs helper, no declarations
import { readWorkspace } from '../workspace.mjs'

/**
 * `readWorkspace` decides WHICH packages every guard inspects. A package it silently omits is a
 * package no guard checks - a reviewer showed a stray `private: true` dropping a package out of
 * three guards at once with the suite green. So its skipping behaviour is pinned here.
 */
const stage = (layout: Record<string, unknown>) => {
  const root = mkdtempSync(join(tmpdir(), 'clara-ws-test-'))
  for (const [dir, manifest] of Object.entries(layout)) {
    mkdirSync(join(root, dir), { recursive: true })
    writeFileSync(join(root, dir, 'package.json'), JSON.stringify(manifest))
  }
  return root
}

describe('readWorkspace', () => {
  it('finds packages and apps, and labels each with its kind', () => {
    const root = stage({
      'packages/alpha': { name: 'alpha' },
      'packages/beta': { name: 'beta' },
      'apps/docs': { name: 'docs', private: true },
    })
    try {
      const found = readWorkspace(root)
      expect(found).toHaveLength(3)
      expect(found.filter((p: { kind: string }) => p.kind === 'packages')).toHaveLength(2)
      expect(found.filter((p: { kind: string }) => p.kind === 'apps')).toHaveLength(1)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns entries sorted, so guard output is stable across machines', () => {
    const root = stage({ 'packages/zeta': { name: 'z' }, 'packages/alpha': { name: 'a' } })
    try {
      const dirs = readWorkspace(root).map((p: { dir: string }) => p.dir)
      expect(dirs).toEqual([...dirs].sort())
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('skips a directory with no package.json rather than throwing', () => {
    const root = stage({ 'packages/real': { name: 'real' } })
    mkdirSync(join(root, 'packages/not-a-package'), { recursive: true })
    try {
      expect(readWorkspace(root)).toHaveLength(1)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns an empty list for a root with neither packages/ nor apps/', () => {
    const root = mkdtempSync(join(tmpdir(), 'clara-ws-empty-'))
    try {
      expect(readWorkspace(root)).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reads the manifest through, so guards see private and the declared name', () => {
    const root = stage({ 'packages/one': { name: '@scope/one', private: true, version: '1.2.3' } })
    try {
      const [pkg] = readWorkspace(root)
      expect(pkg.manifest.name).toBe('@scope/one')
      expect(pkg.manifest.private).toBe(true)
      expect(pkg.manifest.version).toBe('1.2.3')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
