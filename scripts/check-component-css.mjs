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

/**
 * The shape contract: declarations a component's CSS must actually make.
 *
 * An adversarial review removed `width`, `min-height` and `border` from `.clara-input` and the
 * ENTIRE suite stayed green - every test, every guard, axe and the geometry gate included. jsdom
 * computes no layout, so nothing running there can see an input with no box, and the token gate
 * measures tokens rather than the rules consuming them. This is the cheapest check that can see it:
 * the declarations must exist. They are already forced through tier 2 by the loop above.
 *
 * It is NOT a substitute for visual regression (gate 7, US-01M0GMZW). It cannot see what a control
 * looks like - only that the rules giving it a shape are present.
 */
const SHAPE_CONTRACT = [
  ['.clara-input', ['width', 'min-height', 'border', 'background', 'color', 'padding']],
  // The decorated Input strips the inner control's box and draws it on the group instead, so the
  // group carries the same obligation - without this entry a decorated Input could lose its entire
  // visible boundary with every gate green.
  ['.clara-input-group', ['width', 'min-height', 'border', 'background', 'color', 'padding']],
  ['.clara-checkbox', ['appearance']],
  ['.clara-switch', ['appearance']],
]

/**
 * Every focusable thing this stylesheet renders must have a `:focus-visible` rule.
 *
 * A review deleted the whole `.clara-input:focus-visible` block and every gate stayed green - and
 * separately found three keyboard-reachable buttons that had never had a ring, under a comment
 * claiming the indicator applied to "every other control". A control that can be tabbed to and
 * cannot be seen when focused is unusable by exactly the people the tab stop was kept for (D0058),
 * and jsdom cannot see it, so this is the only place it can be caught.
 */
const FOCUSABLE = [
  '.clara-input', '.clara-checkbox', '.clara-radio', '.clara-switch',
  '.clara-search__clear', '.clara-input-group__clear', '.clara-password__toggle',
]

const focusRings = new Set()
for (const file of files) {
  postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
    for (const sel of rule.selectors ?? []) {
      if (sel.endsWith(':focus-visible')) focusRings.add(sel.slice(0, -':focus-visible'.length))
    }
  })
}
for (const selector of FOCUSABLE) {
  if (!focusRings.has(selector)) {
    problems.push(`${selector} is focusable and has no \`:focus-visible\` rule - a control that can be tabbed to and not seen is unusable`)
  }
}

for (const [selector, required] of SHAPE_CONTRACT) {
  const declared = new Set()
  for (const file of files) {
    postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
      if (!(rule.selectors ?? []).includes(selector)) return
      rule.walkDecls((decl) => declared.add(decl.prop))
    })
  }
  if (!declared.size) {
    problems.push(`${selector} has no rule of its own - the shape contract cannot be checked, so it is not checked`)
    continue
  }
  for (const prop of required) {
    if (!declared.has(prop)) {
      problems.push(`${selector} declares no \`${prop}\`: a control with no ${prop} is invisible to every test that runs in jsdom`)
    }
  }
}

if (problems.length) fail(RULE, problems)
pass(RULE, `${files.length} component stylesheet(s), ${declarations} token reference(s), all tier 2 or 3, no literals`)
