/**
 * Read a GitHub workflow with a real YAML parser.
 *
 * Every guard that read these files with regexes was defeated, and the review found four at once:
 * a substring test that let `pnpm check:contrast` satisfy a requirement for `pnpm check`; a
 * `^\s*run:` anchor that returned NOTHING the moment a step used a `run: |` block scalar, emptying
 * the comparison instead of failing it; "publish is main-only" satisfied by the string `branches:
 * [main]` appearing anywhere while `workflow_dispatch` published from any branch; and three legal
 * ways to make a gate advisory (`if: false`, `continue-on-error`, `|| true`) that no line regex
 * modelled. This is the seventh hand-rolled parser in this repo to be broken by input it did not
 * anticipate. It is the last: the structure comes from the parser, and only the shell command
 * strings are split here.
 */
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

/** Every step of every job, with the properties a gate check needs to ask about. */
export function readWorkflow (file) {
  const doc = parse(readFileSync(file, 'utf8')) ?? {}
  // `on:` is YAML 1.1 truthy - a compliant parser gives us the boolean `true` as the key.
  const triggers = doc.on ?? doc[true] ?? {}
  const steps = []
  for (const [jobId, job] of Object.entries(doc.jobs ?? {})) {
    for (const step of job?.steps ?? []) {
      steps.push({
        jobId,
        jobIf: job?.if,
        name: step.name,
        run: typeof step.run === 'string' ? step.run : null,
        uses: step.uses,
        with: step.with ?? {},
        if: step.if,
        continueOnError: step['continue-on-error'],
      })
    }
  }
  return { doc, triggers, jobs: doc.jobs ?? {}, steps, permissions: doc.permissions ?? {} }
}

/**
 * The shell commands a `run:` block actually executes, as whole commands.
 *
 * Splits on the separators a shell treats as a command boundary, then trims. A `run: |` block
 * carries one command per line, which is exactly why the old anchored regex saw none of them.
 */
export function commandsIn (run) {
  if (!run) return []
  return run
    .split('\n')
    .flatMap((line) => line.split(/&&|\|\||;/))
    .map((c) => c.trim())
    .filter((c) => c && !c.startsWith('#'))
}

/** Every command the workflow runs, as a Set of exact command strings. */
export function commandSet (workflow) {
  return new Set(workflow.steps.flatMap((s) => commandsIn(s.run)))
}

/**
 * Why a step would not block a merge. Returns [] when the step genuinely gates.
 *
 * `if:` is deliberately treated as disqualifying whatever its value: a condition that has to be
 * evaluated by GitHub is not something this guard can prove blocks, and a gate that might not run
 * is not a gate.
 */
export function advisoryReasons (step) {
  const reasons = []
  if (step.continueOnError !== undefined && step.continueOnError !== false) {
    reasons.push(`continue-on-error: ${step.continueOnError}`)
  }
  if (step.if !== undefined) reasons.push(`if: ${step.if}`)
  if (step.jobIf !== undefined) reasons.push(`the job is conditional on if: ${step.jobIf}`)
  // `cmd || true` and `cmd || :` discard the exit code the gate depends on.
  for (const m of String(step.run ?? '').matchAll(/\|\|\s*(true|:)\s*(?:$|\n)/gm)) {
    reasons.push(`exit code discarded by "|| ${m[1]}"`)
  }
  return reasons
}

/** The step that runs a given exact command, if any. */
export function stepRunning (workflow, command) {
  return workflow.steps.find((s) => commandsIn(s.run).includes(command))
}
