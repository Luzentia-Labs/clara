#!/usr/bin/env node
/**
 * Component CSS references tier 2 or tier 3 only, and contains no raw literal
 * (TRD Section 6, TRD Section 9 gate 2, AGENTS.md).
 *
 * Two rules, one reason. A component reaching past the semantic layer into a primitive is how the
 * semantic layer stops being the place a theme is changed - the output looks identical and the
 * theming quietly stops working for that component. A raw literal is the same failure without even
 * a token to grep for.
 *
 * Written as a standalone guard rather than a stylelint plugin: the rule needs the BUILD's tier
 * manifest to know which tier a token belongs to, and a lint plugin that hardcodes the tier list
 * is the name-prefix mistake this repo has already undone three times.
 *
 * Declarations come from PostCSS, not from a line regex. The first version matched
 * `^\s*([a-z-]+)\s*:\s*(.+)$` per line, which silently skipped every declaration written on the
 * same line as its selector - `.probe { margin: 12px; }` passed with a raw literal in it. That is
 * the tenth hand-rolled parser in this repo to be defeated by ordinary input; PostCSS is what Vite
 * already uses to read this exact file.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import postcss from 'postcss'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'component-css'
const root = process.cwd()
const manifestPath = join(root, 'packages/tokens/build/tier-manifest.json')
if (!existsSync(manifestPath)) fail(RULE, ['build/tier-manifest.json missing - build the tokens first'])
const tiers = JSON.parse(readFileSync(manifestPath, 'utf8'))
const tier1 = new Set(tiers.tier1.map((t) => t.name))
const allowed = new Set([...tiers.tier2, ...(tiers.tier3 ?? [])].map((t) => t.name))

/** Colour, length and radius literals. A length of 0 is unitless and carries no design decision. */
const LITERAL = /(#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)|\boklch\([^)]*\)|(?<![\w-])\d*\.?\d+(px|rem|em)\b)/g
// Properties where a literal is structural rather than a design value.
const STRUCTURAL = /^(z-index|opacity|flex|order|grid-|line-height|font-weight|content|transform|scale)/

const walk = (p) => !existsSync(p) ? []
  : statSync(p).isFile() ? [p]
    : readdirSync(p).flatMap((e) => (e === 'node_modules' || e === 'dist' ? [] : walk(join(p, e))))

const files = walk(join(root, 'packages/react/src')).filter((f) => f.endsWith('.css'))
const problems = []
let declarations = 0

for (const file of files) {
  const rel = relative(root, file)
  const root_ = postcss.parse(readFileSync(file, 'utf8'), { from: file })
  root_.walkDecls((decl) => {
    const at = `${rel}:${decl.source?.start?.line ?? '?'}`
    for (const m of decl.value.matchAll(/var\(\s*(--clara-[\w-]+)/g)) {
      const name = m[1].replace(/^--clara-/, '')
      declarations++
      if (allowed.has(name)) continue
      problems.push(tier1.has(name)
        ? `${at}: reads --clara-${name}, a tier 1 primitive - component CSS may read tier 2 or tier 3 only`
        : `${at}: reads --clara-${name}, which is not a token this build emits`)
    }
    // A custom-property DEFINITION and a structural property are not design values.
    if (decl.prop.startsWith('--') || STRUCTURAL.test(decl.prop)) return
    for (const lit of decl.value.matchAll(LITERAL)) {
      if (/^0(px|rem|em)$/.test(lit[0])) continue
      problems.push(`${at}: ${decl.prop} uses the literal ${lit[0]} - use a token`)
    }
  })
}

// A stylesheet set that reads no token has verified nothing.
if (files.length && !declarations) {
  problems.push(`${files.length} stylesheet(s) but no --clara- token reference - this gate checked nothing`)
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${files.length} component stylesheet(s), ${declarations} token reference(s), all tier 2 or 3, no literals`)
