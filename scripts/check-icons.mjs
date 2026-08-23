#!/usr/bin/env node
/**
 * The icon set, its exports and its committed list all describe the same thing (PRD:357).
 *
 * Three sources can disagree: the SVG files, the generated exports, and ICONS.md. The PRD asks for
 * an "enumerated, counted list committed before implementation, not 'at minimum the icons we
 * need'" - the point being that a list nobody can count is one CI cannot check. So the counts are
 * asserted per category, not just in total: swapping a navigation icon for a file icon keeps the
 * total at 48 while changing what was agreed.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fail, pass } from './lib/workspace.mjs'

const RULE = 'icons'
const pkg = 'packages/icons'
const problems = []

for (const rel of ['icons.json', 'ICONS.md', 'src/generated.ts']) {
  if (!existsSync(join(pkg, rel))) fail(RULE, [`${pkg}/${rel} is missing`])
}
const catalogue = JSON.parse(readFileSync(join(pkg, 'icons.json'), 'utf8')).categories
const listed = readFileSync(join(pkg, 'ICONS.md'), 'utf8')
const generated = readFileSync(join(pkg, 'src/generated.ts'), 'utf8')
const pascal = (n) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')

const declared = []
for (const [category, icons] of Object.entries(catalogue)) {
  for (const name of Object.keys(icons)) declared.push({ name, category, component: `${pascal(name)}Icon` })
}
if (!declared.length) problems.push('icons.json declares no icons - this gate would verify nothing')

// Every declared icon has a source file, a component, and a line in the list.
for (const { name, component } of declared) {
  if (!existsSync(join(pkg, 'svg', `${name}.svg`))) problems.push(`${name}: declared but svg/${name}.svg is missing`)
  if (!generated.includes(`${component} }`)) problems.push(`${component}: declared but not exported`)
  if (!listed.includes(`\`${component}\``)) problems.push(`${component}: exported but absent from ICONS.md`)
}

// And nothing is exported that was never declared.
const declaredComponents = new Set(declared.map((d) => d.component))
for (const m of generated.matchAll(/export \{ (\w+) \}/g)) {
  if (!declaredComponents.has(m[1])) problems.push(`${m[1]}: exported but not declared in icons.json`)
}
// An orphan SVG is a drawing nobody ships, which is how a set silently grows.
const declaredFiles = new Set(declared.map((d) => `${d.name}.svg`))
for (const file of existsSync(join(pkg, 'svg')) ? readdirSync(join(pkg, 'svg')) : []) {
  if (file.endsWith('.svg') && !declaredFiles.has(file)) problems.push(`svg/${file}: present but not declared`)
}

// The per-category counts, which is what makes the list an agreement rather than an inventory.
const EXPECTED = {
  navigation: 12, 'status-and-intent': 8, 'crud-and-actions': 10,
  'sort-and-filter': 6, file: 4, calendar: 3, 'user-and-settings': 5,
}
for (const [category, expected] of Object.entries(EXPECTED)) {
  const actual = Object.keys(catalogue[category] ?? {}).length
  if (actual !== expected) problems.push(`category ${category}: ${actual} icon(s), PRD:357 specifies ${expected}`)
}
for (const category of Object.keys(catalogue)) {
  if (!(category in EXPECTED)) problems.push(`category ${category} is not one PRD:357 enumerates`)
}
const total = declared.length
if (total !== 48) problems.push(`${total} icons declared; PRD:357 specifies 48`)
if (!listed.includes(`**${total} icons.**`)) problems.push(`ICONS.md does not state the count ${total}`)

if (problems.length) fail(RULE, problems)
pass(RULE, `${total} icon(s) across ${Object.keys(catalogue).length} categories: sources, exports and ICONS.md agree`)
