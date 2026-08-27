/**
 * TYPE-LEVEL tests for the discriminated prop pairs.
 *
 * These are compile-time assertions, not runtime ones, and they run under `pnpm typecheck` rather
 * than under vitest: every `@ts-expect-error` below FAILS THE BUILD if the error it expects stops
 * happening. That is the whole mechanism - a discriminator that is deleted makes the line compile,
 * and an unused `@ts-expect-error` is itself an error.
 *
 * They come in TWO forms, and the second is not decoration. The JSX assertions below were written
 * first and a confirmation seat proved them insufficient on their own: JSX applies its own
 * excess-children check, so deleting `children?: never` from `BadgeCountProps` left `pnpm typecheck`
 * at exit 0. Sweeping all seven discriminators one at a time, five were caught through JSX and two
 * were not. The non-JSX assignability block at the bottom of this file covers every member, and all
 * seven now redden when deleted.
 *
 * They exist because a review measured the gap. All four guarantees held, and NOTHING held them:
 * deleting `dismissLabel?: never` from `AlertStaticProps` left `pnpm typecheck` Done, 1200 tests
 * passing and the API report at exit 0. The variant interfaces were not exported from the entry
 * point, so they appeared in `clara-react.api.md` only inside `(ae-forgotten-export)` warnings and
 * never as declarations - meaning a breaking change to `BadgeCountProps.countLabel` or
 * `TagRemovableProps.children` would not have shown in the public surface diff at all, on a project
 * whose first stated gotcha is that publishing is a one-way door. They are exported now, and these
 * assertions are the other half.
 *
 * `.test-d.tsx` rather than `.test.tsx`: there is nothing here for a runtime runner to execute.
 */
import { Alert, Badge, Tag } from '../../index'

export function alertShapes () {
  return (
    <>
      <Alert intent="info">Body</Alert>
      <Alert intent="danger" onDismiss={() => {}} dismissLabel="Dismiss">Body</Alert>
      {/* @ts-expect-error `dismissLabel` without `onDismiss` - a label for a control that does not exist */}
      <Alert intent="info" dismissLabel="Close">Body</Alert>
      {/* @ts-expect-error `intent` is required, and there is no sensible default for one */}
      <Alert>Body</Alert>
      {/* @ts-expect-error `intent` is a closed union, never a bare string */}
      <Alert intent="critical">Body</Alert>
    </>
  )
}

export function badgeShapes () {
  return (
    <>
      <Badge intent="danger">Overdue</Badge>
      <Badge intent="danger" count={3} countLabel="overdue invoices" />
      {/* @ts-expect-error a count with no `countLabel` - the unannounced-number shape AC2 forbids */}
      <Badge count={3} />
      {/* @ts-expect-error `count` and `children` are mutually exclusive */}
      <Badge count={3} countLabel="overdue invoices">Overdue</Badge>
      {/* @ts-expect-error `intent` is a closed union */}
      <Badge intent="urgent">Overdue</Badge>
    </>
  )
}

export function tagShapes () {
  return (
    <>
      <Tag>Draft</Tag>
      <Tag intent="info"><b>rich</b> content</Tag>
      <Tag intent="danger" onRemove={() => {}}>Overdue</Tag>
      {/* @ts-expect-error a REMOVABLE tag narrows `children` to string: `Remove <node>` is not a name */}
      <Tag onRemove={() => {}}><b>rich</b></Tag>
      {/* @ts-expect-error `removeLabel` without `onRemove` - a label for a control that does not exist */}
      <Tag removeLabel="Remove this">Draft</Tag>
    </>
  )
}

/*
 * The same guarantees again, WITHOUT JSX.
 *
 * A confirmation seat proved the JSX assertions above are not sufficient on their own. Deleting
 * `children?: never` from `BadgeCountProps` left `pnpm typecheck` at exit 0, because JSX applies its
 * own excess-children check: `<Badge count={3} countLabel="x">Overdue</Badge>` is rejected whether or
 * not the discriminator exists, so the discriminator's loss is invisible through that route. Sweeping
 * all seven `?: never` members one at a time, five were caught by the JSX assertions and two were
 * not - `BadgeCountProps.children` and `BadgeLabelProps.countLabel`.
 *
 * Assigning a NON-LITERAL object gets past excess-property checking and exercises the union member
 * directly, which is what makes the discriminator the only thing standing between these values and
 * the type. Written for every member rather than the two survivors, so the coverage does not depend
 * on which shapes JSX happens to mask today.
 */
import type { AlertProps, BadgeProps, TagProps } from '../../index'

export function alertShapesWithoutJsx () {
  const withLabelButNoHandler = { intent: 'info' as const, children: 'Body', dismissLabel: 'Close' }
  // @ts-expect-error `dismissLabel` on the static variant - a label for a control that does not exist
  const a: AlertProps = withLabelButNoHandler
  const withHandlerButStatic = { intent: 'info' as const, children: 'Body', onDismiss: () => {} }
  const b: AlertProps = withHandlerButStatic
  return [a, b]
}

export function badgeShapesWithoutJsx () {
  const countWithChildren = { count: 3, countLabel: 'overdue invoices', children: 'Overdue' }
  // @ts-expect-error a count badge cannot also take children - the two variants are exclusive
  const a: BadgeProps = countWithChildren
  const labelWithCountLabel = { children: 'Overdue', countLabel: 'overdue invoices' }
  // @ts-expect-error `countLabel` naming a count that does not exist
  const b: BadgeProps = labelWithCountLabel
  const countWithoutLabel = { count: 3 }
  // @ts-expect-error a count with no `countLabel` is the unannounced-number shape AC2 forbids
  const c: BadgeProps = countWithoutLabel
  return [a, b, c]
}

export function tagShapesWithoutJsx () {
  const staticWithHandler = { children: 'Draft', removeLabel: 'Remove this' }
  // @ts-expect-error `removeLabel` on the static variant - a label for a control that does not exist
  const a: TagProps = staticWithHandler
  const removableWithNode = { children: 42, onRemove: () => {} }
  // @ts-expect-error a removable tag narrows `children` to string, because the name interpolates it
  const b: TagProps = removableWithNode
  return [a, b]
}

/*
 * NARROWING, which is what two of the seven discriminators actually buy.
 *
 * A confirmation seat measured that deleting `AlertStaticProps.onDismiss` or `BadgeLabelProps.count`
 * reddens only the COMPONENT files - `Property 'onDismiss' does not exist on type 'AlertProps'` at
 * Alert.tsx:78 - and no line in this file. So those two are held by the implementation happening to
 * read those props, and a refactor that stopped reading them would silently unguard both, by exactly
 * the mechanism JSX masked the first two.
 *
 * What those members buy is a DISCRIMINATED union: without them the variants overlap, and TypeScript
 * cannot narrow `AlertProps` by testing one field. These assertions exercise the narrowing directly,
 * so the guarantee is held here rather than incidentally.
 */
export function narrowingHolds (alert: AlertProps, badge: BadgeProps, tag: TagProps) {
  // Reading the discriminator narrows to the variant that declares it.
  const dismiss = alert.onDismiss === undefined ? 'static' : alert.onDismiss
  const count = badge.count === undefined ? 'label' : badge.count
  const remove = tag.onRemove === undefined ? 'static' : tag.onRemove

  // And the NARROWED branch exposes the rest of its own variant. If the union stops being
  // discriminated these stop compiling, which is the point.
  let label = ''
  if (badge.count !== undefined) label = badge.countLabel
  if (tag.onRemove !== undefined) label = tag.children
  if (alert.onDismiss !== undefined) label = alert.dismissLabel ?? ''

  return { dismiss, count, remove, label }
}
