import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// @ts-expect-error - .mjs sibling
import { readWorkflow, commandsIn, commandSet, advisoryReasons, stepRunning } from '../workflow.mjs'

const write = (yaml: string) => {
  const f = join(mkdtempSync(join(tmpdir(), 'wf-')), 'w.yml')
  writeFileSync(f, yaml)
  return f
}

describe('commandsIn', () => {
  it('returns nothing for a step with no run block', () => {
    expect(commandsIn(null)).toEqual([])
  })

  it('splits a chain into whole commands', () => {
    expect(commandsIn('pnpm check:publint && pnpm check:attw')).toEqual(['pnpm check:publint', 'pnpm check:attw'])
  })

  // The defeat that emptied the whole comparison: an anchored `run:` regex saw none of these.
  it('reads every line of a block scalar', () => {
    expect(commandsIn('pnpm build\npnpm test\npnpm size')).toEqual(['pnpm build', 'pnpm test', 'pnpm size'])
  })

  it('splits on || and ; too, and drops comments', () => {
    expect(commandsIn('pnpm a || pnpm b; pnpm c\n# a comment')).toEqual(['pnpm a', 'pnpm b', 'pnpm c'])
  })
})

describe('readWorkflow', () => {
  it('finds triggers even though YAML reads `on:` as the boolean true', () => {
    const w = readWorkflow(write('on:\n  push:\n    branches: [main]\njobs: {}\n'))
    expect(Object.keys(w.triggers)).toEqual(['push'])
    expect(w.triggers.push.branches).toEqual(['main'])
  })

  it('flattens steps across jobs and carries the job condition down', () => {
    const w = readWorkflow(write(
      'on: {push: {}}\njobs:\n  a:\n    if: github.ref == \'refs/heads/main\'\n    steps:\n      - run: pnpm x\n'))
    expect(w.steps).toHaveLength(1)
    expect(w.steps[0].jobIf).toBe("github.ref == 'refs/heads/main'")
  })

  it('exposes with: keys, where the publish command lives', () => {
    const w = readWorkflow(write('on: {push: {}}\njobs:\n  a:\n    steps:\n      - uses: changesets/action@v1\n        with:\n          publish: pnpm changeset publish\n'))
    expect(w.steps[0].with.publish).toBe('pnpm changeset publish')
  })

  it('tolerates a workflow with no jobs', () => {
    expect(readWorkflow(write('on: {push: {}}\n')).steps).toEqual([])
  })
})

describe('commandSet / stepRunning', () => {
  const w = readWorkflow(write('on: {push: {}}\njobs:\n  a:\n    steps:\n      - run: pnpm check\n      - run: pnpm check:contrast\n'))

  it('collects exact commands, so a prefix is not a match', () => {
    const set = commandSet(w)
    expect(set.has('pnpm check')).toBe(true)
    expect(set.has('pnpm chec')).toBe(false)
  })

  it('locates the step running an exact command', () => {
    expect(stepRunning(w, 'pnpm check:contrast')).toBeDefined()
    expect(stepRunning(w, 'pnpm nope')).toBeUndefined()
  })
})

describe('advisoryReasons', () => {
  it('says nothing about a step that genuinely blocks', () => {
    expect(advisoryReasons({ run: 'pnpm test' })).toEqual([])
  })

  it.each([
    ['continue-on-error', { run: 'pnpm test', continueOnError: true }, /continue-on-error/],
    ['a step condition', { run: 'pnpm test', if: 'false' }, /if: false/],
    ['a job condition', { run: 'pnpm test', jobIf: 'github.event_name == \'push\'' }, /job is conditional/],
    ['a discarded exit code', { run: 'pnpm size || true' }, /exit code discarded/],
    ['|| : as the discard', { run: 'pnpm size || :' }, /exit code discarded/],
  ])('flags %s', (_label, step, pattern) => {
    expect(advisoryReasons(step).join(' ')).toMatch(pattern)
  })

  it('does not treat continue-on-error: false as advisory', () => {
    expect(advisoryReasons({ run: 'pnpm test', continueOnError: false })).toEqual([])
  })
})
