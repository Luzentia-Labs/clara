/**
 * TYPE-LEVEL tests for the discriminated prop pairs.
 *
 * These are compile-time assertions, not runtime ones, and they run under `pnpm typecheck` rather
 * than under vitest: every `@ts-expect-error` below FAILS THE BUILD if the error it expects stops
 * happening. That is the whole mechanism - a discriminator that is deleted makes the line compile,
 * and an unused `@ts-expect-error` is itself an error.
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
