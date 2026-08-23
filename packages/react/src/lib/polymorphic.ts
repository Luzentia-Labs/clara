import { forwardRef } from 'react'
import type {
  ComponentPropsWithoutRef, ComponentPropsWithRef, ElementType, ForwardRefRenderFunction, ReactElement,
} from 'react'

/**
 * `as` is Clara's single polymorphism idiom (D0008, TRD Section 4 rule 8, ADR-005).
 *
 * Radix's `asChild` is deliberately not re-exported. v0.1.0 carried three idioms answering one
 * question - `asChild` for overlay triggers, `as` for layout, `href` for Button - which broke the
 * PRD's second design principle ("guessable by someone who has used another Clara component")
 * before any code existed.
 *
 * The types matter more than the runtime here. A loose polymorphic type that accepts anything is
 * WORSE than none: it type-checks and then breaks at runtime, which is the failure a consumer
 * cannot see coming. These infer the target element's own props, so `<Box as="a" href="/x" />`
 * compiles and `<Box as="div" href="/x" />` does not.
 */

/** The `as` prop itself. */
export interface AsProp<C extends ElementType> { as?: C }

/** Keys the component owns, which must not be taken from the element's own props. */
type OwnKeys<C extends ElementType, Props> = keyof (AsProp<C> & Props)

/**
 * A component's own props, plus every attribute valid on the element `as` names.
 *
 * The `Omit` is what stops a component's own prop from being shadowed by a same-named DOM
 * attribute - `size` on a Button versus `size` on an `<input>` - which would otherwise resolve to
 * whichever the compiler saw last.
 */
export type PolymorphicProps<C extends ElementType, Props = Record<never, never>> =
  Props & AsProp<C> & Omit<ComponentPropsWithoutRef<C>, OwnKeys<C, Props>>

/** The ref type of whatever element `as` names - `HTMLAnchorElement` for `as="a"`. */
export type PolymorphicRef<C extends ElementType> = ComponentPropsWithRef<C>['ref']

/** Props plus the correctly-typed ref. */
export type PolymorphicPropsWithRef<C extends ElementType, Props = Record<never, never>> =
  PolymorphicProps<C, Props> & { ref?: PolymorphicRef<C> }

/**
 * `forwardRef` for a polymorphic component.
 *
 * React's own `forwardRef` types cannot express a GENERIC render function - the returned component
 * would collapse `C` to `ElementType` and every `as` target would infer the same loose props. The
 * cast is unavoidable, so it lives here once, with its reason, rather than being repeated (and
 * subtly varied) in every primitive.
 *
 * Deliberately not `any`: the input is narrowed to a render function and the output is a precisely
 * typed generic component, so the looseness is confined to this one line.
 */
export function polymorphicForwardRef<
  Props,
  Default extends ElementType,
> (render: (props: never, ref: never) => ReactElement | null) {
  return forwardRef(render as ForwardRefRenderFunction<unknown, Record<string, unknown>>) as
    <C extends ElementType = Default>(props: PolymorphicPropsWithRef<C, Props>) => ReactElement | null
}
