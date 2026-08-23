import './styles.css'

// Server-capable primitives - no function props, no state, no browser APIs, so they carry no
// directive and a consumer rendering them never crosses a client boundary.
export { Box } from './components/Box/Box'
export type { BoxProps, BoxOwnProps } from './components/Box/Box'
export { Stack } from './components/Stack/Stack'
export type { StackProps, StackOwnProps } from './components/Stack/Stack'
export { Inline } from './components/Inline/Inline'
export type { InlineProps, InlineOwnProps } from './components/Inline/Inline'
export { Grid } from './components/Grid/Grid'
export type { GridProps, GridOwnProps } from './components/Grid/Grid'
export { Divider } from './components/Divider/Divider'
export type { DividerProps } from './components/Divider/Divider'
export { Heading } from './components/Heading/Heading'
export type { HeadingProps } from './components/Heading/Heading'
export { Text } from './components/Text/Text'
export type { TextProps } from './components/Text/Text'
export { Link } from './components/Link/Link'
export type { LinkProps } from './components/Link/Link'
export { ButtonGroup } from './components/ButtonGroup/ButtonGroup'
export type { ButtonGroupProps } from './components/ButtonGroup/ButtonGroup'

// Client-only.
export { Button } from './components/Button/Button'
export type { ButtonProps, ButtonOwnProps } from './components/Button/Button'
export { IconButton } from './components/IconButton/IconButton'
export type { IconButtonProps } from './components/IconButton/IconButton'

// `as` is Clara's single polymorphism idiom (D0008).
export type { PolymorphicProps, PolymorphicPropsWithRef, PolymorphicRef, AsProp } from './lib/polymorphic'

// Theming and density travel by React context (TRD ADR-006).
export { ClaraProvider } from './theme/ClaraProvider'
export type { ClaraProviderProps } from './theme/ClaraProvider'
export { ClaraScope } from './theme/ClaraScope'
export type { ClaraScopeProps } from './theme/ClaraScope'
export { ClaraPortal } from './theme/ClaraPortal'
export type { ClaraPortalProps } from './theme/ClaraPortal'
export { useClaraSettings } from './theme/context'
