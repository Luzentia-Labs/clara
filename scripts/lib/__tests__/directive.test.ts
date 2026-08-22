import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { prependDirective, rewriteCjsSpecifiers, USE_CLIENT } from '../directive.mjs'

describe('prependDirective', () => {
  it('puts the directive first, before any import', () => {
    const out = prependDirective('import { x } from "./y.js";\nexport const a = 1;\n')
    expect(out.split('\n')[0]).toBe(USE_CLIENT)
  })

  // A directive is only a directive at the top. Anywhere else it is a string expression, which is
  // exactly how bundlers lose it.
  it('is idempotent - a second pass does not stack a second copy', () => {
    const once = prependDirective('export const a = 1;\n')
    expect(prependDirective(once)).toBe(once)
  })

  it.each(['"use client"', "'use client'", '"use client";'])('recognises the existing form %s', (form) => {
    const src = `${form}\nexport const a = 1;\n`
    expect(prependDirective(src)).toBe(src)
  })

  it('goes above a leading license comment, which must not displace it', () => {
    const out = prependDirective('/*! @license MIT */\nexport const a = 1;\n')
    expect(out.split('\n')[0]).toBe(USE_CLIENT)
  })

  it('preserves a shebang as the very first line', () => {
    const out = prependDirective('#!/usr/bin/env node\nexport const a = 1;\n')
    expect(out.split('\n')[0]).toBe('#!/usr/bin/env node')
    expect(out.split('\n')[1]).toBe(USE_CLIENT)
  })
})

describe('rewriteCjsSpecifiers', () => {
  // The interaction that makes chunking non-trivial: finalize-dual renames .js -> .cjs, so a
  // require() naming the old extension resolves to a file that no longer exists.
  it('rewrites a relative require to the renamed extension', () => {
    expect(rewriteCjsSpecifiers('require("./clara-client.js")'))
      .toBe('require("./clara-client.cjs")')
  })

  it.each(["require('./a.js')", 'require( "./a.js" )', 'require("../lib/a.js")'])(
    'handles the form %s', (src) => {
      expect(rewriteCjsSpecifiers(src)).toContain('.cjs')
    })

  // A bare specifier is a package name; rewriting it would break the import entirely.
  it.each(['require("react")', 'require("@luzentialabs/clara-tokens")', 'require("node:fs")'])(
    'leaves the bare specifier %s alone', (src) => {
      expect(rewriteCjsSpecifiers(src)).toBe(src)
    })

  it('does not touch a relative require that is already .cjs', () => {
    expect(rewriteCjsSpecifiers('require("./a.cjs")')).toBe('require("./a.cjs")')
  })

  it('does not rewrite a .js mentioned in a string that is not a require', () => {
    const src = 'const msg = "see ./index.js for details"'
    expect(rewriteCjsSpecifiers(src)).toBe(src)
  })

  it('rewrites every occurrence, not just the first', () => {
    const out = rewriteCjsSpecifiers('require("./a.js");require("./b.js")')
    expect(out).toBe('require("./a.cjs");require("./b.cjs")')
  })
})
