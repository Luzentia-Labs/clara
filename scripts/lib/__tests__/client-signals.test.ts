import { describe, it, expect } from 'vitest'
// @ts-expect-error - .mjs sibling
import { clientHooksUsed, CLIENT_ONLY_HOOKS } from '../client-signals.mjs'

/**
 * The oracle that does not share the planner's reader. It works on EMITTED bytes, so it must cope
 * with minified output in both formats.
 */
describe('clientHooksUsed', () => {
  it.each([
    ['a minified ESM import', 'import{useState as a,jsx as b}from"react";const c=()=>a(!1);', ['useState']],
    ['a multi-hook ESM import', 'import { useEffect, useRef, useReducer } from "react"', ['useEffect', 'useReducer']],
    ['a CJS property access', 'const r=require("react");function x(){const[a,b]=r.useState(0)}', ['useState']],
    ['a direct call', 'const [a] = useLayoutEffect(() => {})', ['useLayoutEffect']],
  ])('detects %s', (_label, code, expected) => {
    expect(clientHooksUsed(code)).toEqual(expected)
  })

  it.each([
    ['a server-safe chunk', 'import{jsx as a}from"react/jsx-runtime";function B(){return a("div")}'],
    ['useMemo and useCallback, which are not evidence on their own', 'import { useMemo, useCallback } from "react"'],
    ['useId, which is stable across server and client', 'import { useId } from "react"'],
    ['an empty chunk', ''],
    ['a hook name inside an unrelated word', 'const notUseStateReally = 1'],
  ])('does not flag %s', (_label, code) => {
    expect(clientHooksUsed(code)).toEqual([])
  })

  it('returns a sorted, de-duplicated list', () => {
    const out = clientHooksUsed('import { useState, useEffect } from "react"\nuseState(); useEffect();')
    expect(out).toEqual(['useEffect', 'useState'])
  })

  it('names the hooks that make a component client-only', () => {
    expect(CLIENT_ONLY_HOOKS).toContain('useState')
    expect(CLIENT_ONLY_HOOKS).toContain('useSyncExternalStore')
    expect(CLIENT_ONLY_HOOKS).not.toContain('useId')
  })
})
