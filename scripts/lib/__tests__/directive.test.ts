import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { prependDirective, USE_CLIENT } from '../directive.mjs'

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
