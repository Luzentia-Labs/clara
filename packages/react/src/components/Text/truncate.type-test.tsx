import { Text } from './Text'
// @ts-expect-error - truncate without fullValue must not compile: it produces a focusable element
// with no accessible name, which is the defect the prop pair exists to prevent.
export const bad = <Text truncate>abbreviated…</Text>
export const good = <Text truncate fullValue="The whole value">abbreviated…</Text>
export const plain = <Text>ordinary</Text>
