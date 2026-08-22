/**
 * The gate manifest is honest.
 *
 * TRD Section 9 names fourteen blocking gates. Seven have no runnable command yet, and the TSD is
 * explicit that it "defines no gate without an enforcement point" - so leaving them out of CI would
 * make a fourteen-gate contract read as an eight-gate one, and listing them without a mechanism
 * would be the reports-without-blocking antipattern the same document forbids.
 *
 * D0038: this IS the enforcement point for the gap. A pending gate must name an OPEN story, so it
 * cannot be quietly forgotten; a wired gate must actually appear in the workflow, so the manifest
 * cannot drift from what CI runs. Same construction as the 27 waived contrast pairings: enumerate
 * the gap, bind it to the story that closes it, and let the count only shrink.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fail, pass } from './lib/workspace.mjs'

const TERMINAL = new Set(['Done', "Won't Implement", 'Rejected', 'Superseded', 'Complete'])
const manifest = JSON.parse(readFileSync('ci-gates.json', 'utf8'))
const workflow = existsSync('.github/workflows/ci.yml') ? readFileSync('.github/workflows/ci.yml', 'utf8') : null
const problems = []

if (workflow === null) problems.push('.github/workflows/ci.yml does not exist - no gate runs anywhere')

const storyFiles = existsSync('sdlc-studio/stories') ? readdirSync('sdlc-studio/stories') : []
const statusOf = (id) => {
  const file = storyFiles.find((f) => f.startsWith(id))
  if (!file) return null
  const m = readFileSync(`sdlc-studio/stories/${file}`, 'utf8').match(/^> \*\*Status:\*\* (.+)$/m)
  return m ? m[1].trim() : null
}

const all = [...manifest.gates, ...(manifest.plus ?? [])]
for (const g of all) {
  const label = g.n ? `gate ${g.n}` : `"${g.gate}"`
  if (g.status === 'wired') {
    if (!g.run) problems.push(`${label} is marked wired but names no command`)
    else if (workflow && !g.run.split('&&').some((cmd) => workflow.includes(cmd.trim()))) {
      problems.push(`${label} is marked wired ("${g.run}") but that command appears nowhere in ci.yml`)
    }
  } else if (g.status === 'pending') {
    if (!g.story) {
      problems.push(`${label} is pending but names no story - a gate nobody owns is a gate nobody lands`)
      continue
    }
    const status = statusOf(g.story)
    if (status === null) problems.push(`${label} names ${g.story}, which does not exist`)
    else if (TERMINAL.has(status)) {
      problems.push(
        `${label} is still pending but ${g.story} is ${status} - the story that was to land it is ` +
          'closed, so either the gate was missed or the manifest is stale',
      )
    }
  } else {
    problems.push(`${label} has status "${g.status}" - expected wired or pending`)
  }
}

// The workflow must not weaken a gate it does run.
if (workflow && /continue-on-error:\s*true/.test(workflow)) {
  problems.push('ci.yml sets continue-on-error: true - a gate that reports without blocking is not a gate')
}

if (problems.length) fail('ci-gates', problems)
const wired = all.filter((g) => g.status === 'wired').length
const pending = all.filter((g) => g.status === 'pending')
pass(
  'ci-gates',
  `${all.length} gate(s) enumerated: ${wired} wired and running, ${pending.length} pending and each ` +
    `bound to an open story [${pending.map((g) => g.story).join(', ')}]`,
)
