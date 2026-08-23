/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PolymorphicProps, PolymorphicRef } from './polymorphic'

/**
 * COMPILE-TIME assertions. This file is never imported and never runs.
 *
 * `as` is a type-level feature, so a runtime test cannot check it - rendering proves the element
 * changed, not that an invalid attribute was rejected. Every `@ts-expect-error` below is an
 * assertion in the strongest available form: if the type system stops rejecting that line, the
 * unused directive itself becomes an error and `pnpm typecheck` fails.
 *
 * That is why the negative cases are here rather than in a `.test.tsx`.
 */
interface BoxOwn { padding?: 'sm' | 'md' }

type DivProps = PolymorphicProps<'div', BoxOwn>
type AnchorProps = PolymorphicProps<'a', BoxOwn>

// The element's own attributes are inferred from `as`.
const anchorWithHref: AnchorProps = { as: 'a', href: '/somewhere' }
const divWithTitle: DivProps = { as: 'div', title: 'ok' }

// @ts-expect-error - `href` is not valid on a div, and the type must say so.
const divWithHref: DivProps = { as: 'div', href: '/nope' }

// @ts-expect-error - `padding` is a closed set; an arbitrary string is not a member.
const badPadding: DivProps = { as: 'div', padding: 'enormous' }

// @ts-expect-error - `asChild` is Radix's idiom and is never Clara's (D0008).
const withAsChild: DivProps = { as: 'div', asChild: true }

// The component's own prop survives alongside the element's.
const bothKinds: AnchorProps = { as: 'a', href: '/x', padding: 'sm' }

// The ref follows the element, not a generic HTMLElement.
const anchorRef: PolymorphicRef<'a'> = null as unknown as React.Ref<HTMLAnchorElement>
// @ts-expect-error - a button ref is not an anchor ref.
const wrongRef: PolymorphicRef<'a'> = null as unknown as React.Ref<HTMLButtonElement>

export type { DivProps, AnchorProps }
