'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

/**
 * One shared toast stack, for the whole document (BG-01M0Y2H2).
 *
 * ## The defect this exists to remove
 *
 * Every `<Toast>` used to render its own Radix `Provider` and `Viewport`, self-contained, the same
 * shape `Tooltip` uses. That is right for a tooltip, where each is independent. It is wrong for a
 * toast, where the whole point is a shared STACK: two `<Toast open>` siblings produced two
 * viewports, both `position: fixed` to the same corner, at the identical rect.
 *
 * A review measured the consequence and it is worse than "they overlap". `elementFromPoint` at the
 * centre of the first toast's close button returned the SECOND toast's close button - the covered
 * toast's controls are unreachable, not merely hidden. And because `danger` carries
 * `duration: Infinity`, a covered error toast persists forever: invisible, unactionable, and never
 * dismissed.
 *
 * ## Why a store rather than a provider component
 *
 * The obvious repair is to export a `<ToastProvider>` a consumer mounts once. That is public API,
 * and under this project's publishing rules public API is a one-way door - so it would have to be
 * right first time, and it moves work onto every consumer for a problem they did not create.
 *
 * Routing every toast into one module-level stack keeps `<Toast>`'s surface byte-identical.
 * A consumer writes exactly what they wrote before.
 *
 * ## Ownership
 *
 * The shared host has to be rendered exactly once, by somebody. The FIRST toast to mount claims it;
 * when that toast unmounts, ownership passes to whichever is still mounted. Ownership is held in
 * this module rather than in a React context, because a context would need a provider - which is
 * the thing being avoided.
 */
export interface ToastEntry {
  id: number
  node: ReactNode
  /** Whether this toast's own `open` is true, which is what decides if the host is needed at all. */
  isOpen: boolean
}

let nextId = 1
const entries: ToastEntry[] = []
const listeners = new Set<() => void>()

/**
 * Recomputed on every change, never mutated in place.
 *
 * `useSyncExternalStore` compares snapshots by identity and calls `getSnapshot` during render; a
 * getter that built a fresh array each call would return a new identity every time and loop
 * forever. The cached snapshot is the documented shape for exactly this.
 */
let snapshot: ToastEntry[] = []
let owner: number | null = null

function emit () {
  snapshot = [...entries]
  owner = entries.length ? entries[0]!.id : null
  for (const listener of listeners) listener()
}

function subscribe (listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** A stable id for one `<Toast>` instance, for as long as it is mounted. */
export function claimToastId () {
  return nextId++
}

/**
 * Publish (or update) this toast's rendered node.
 *
 * Called on every render, so the node the host renders is always the current one - it closes over
 * this render's props, and a stale closure would freeze a toast's title at its first value.
 */
export function publishToast (id: number, node: ReactNode, isOpen: boolean) {
  const existing = entries.findIndex((e) => e.id === id)
  const entry = { id, node, isOpen }
  // Order is REGISTRATION order, and it is preserved on update rather than moved to the end: the
  // stack should not reshuffle because a toast's title changed.
  if (existing === -1) entries.push(entry)
  else entries[existing] = entry
  emit()
}

export function retractToast (id: number) {
  const at = entries.findIndex((e) => e.id === id)
  if (at !== -1) entries.splice(at, 1)
  emit()
}

/** Every live toast, in registration order. */
export function useToastEntries (): ToastEntry[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

/** Whether THIS toast is the one that renders the shared provider and viewport. */
export function useIsToastHost (id: number): boolean {
  return useSyncExternalStore(subscribe, () => owner === id, () => false)
}

/**
 * Test-only: forget every registered toast.
 *
 * The store is module state, so it outlives a `render()` - and a test whose toasts are not retracted
 * before the next one leaves entries behind, which surfaces as `getMultipleElementsFoundError` in
 * whichever test runs next. Two separate review seats hit that as an order-dependent flake, and a
 * flaky gate weakens every verdict that leans on it.
 *
 * The same shape as `resetDevWarnings`, and for the same reason: module state that persists by
 * design needs a documented way to be cleared by design.
 */
export function resetToastStore (): void {
  entries.length = 0
  listeners.clear()
  snapshot = []
  owner = null
}
