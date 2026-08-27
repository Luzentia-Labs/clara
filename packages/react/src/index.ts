import './styles.css'

// Layout and typography primitives. MOST are server-capable - no function props, no state, no
// browser APIs - so they carry no directive and a consumer rendering them never crosses a client
// boundary. Not all: ButtonGroup uses state and a DOM effect for its roving tabindex and is
// classified client. `client-boundary.json` is the authority here, not this comment.
export { Box } from './components/Box/Box'
export type { BoxProps, BoxOwnProps } from './components/Box/Box'
export { Stack } from './components/Stack/Stack'
export type { StackProps, StackOwnProps } from './components/Stack/Stack'
export { Inline } from './components/Inline/Inline'
export type { InlineProps, InlineOwnProps } from './components/Inline/Inline'
export { Grid } from './components/Grid/Grid'
export type { GridProps, GridOwnProps } from './components/Grid/Grid'
export { Popover } from './components/Popover/Popover'
export type { PopoverProps, PopoverPlacement } from './components/Popover/Popover'
export { Tooltip } from './components/Tooltip/Tooltip'
export type { TooltipProps, TooltipPlacement } from './components/Tooltip/Tooltip'
export { Toast } from './components/Toast/Toast'
export type { ToastProps, ToastIntent } from './components/Toast/Toast'
export { DropdownMenu } from './components/DropdownMenu/DropdownMenu'
export type {
  DropdownMenuProps, DropdownMenuPlacement, DropdownMenuEntry,
  DropdownMenuAction, DropdownMenuSubmenu, DropdownMenuSeparator,
} from './components/DropdownMenu/DropdownMenu'
export { Drawer } from './components/Drawer/Drawer'
export type { DrawerProps, DrawerPlacement } from './components/Drawer/Drawer'
export { EmptyState } from './components/EmptyState/EmptyState'
export type { EmptyStateProps, EmptyStateReason } from './components/EmptyState/EmptyState'
export { ProgressBar } from './components/ProgressBar/ProgressBar'
export type { ProgressBarProps } from './components/ProgressBar/ProgressBar'
export { Skeleton, SkeletonGroup } from './components/Skeleton/Skeleton'
export type { SkeletonProps, SkeletonGroupProps, SkeletonWidth } from './components/Skeleton/Skeleton'
export { Spinner } from './components/Spinner/Spinner'
export type { SpinnerProps } from './components/Spinner/Spinner'
// The shared option shape. Exported under its own name because Select, Combobox and MultiSelect
// all take it (D0105) - and because leaving it a forgotten export put `SelectOption` in the API
// report as an alias whose MEMBERS were invisible, so a breaking change to `label` or `disabled`
// would not have shown in the public surface diff. That is the defect just fixed on Badge and
// Tag's variant interfaces, and this is the same mechanism.
export type { ListboxOption } from './lib/listbox'
export { Combobox } from './components/Combobox/Combobox'
export type { ComboboxProps, ComboboxOption, ComboboxStatus } from './components/Combobox/Combobox'
export { Select } from './components/Select/Select'
export type { SelectProps, SelectOption } from './components/Select/Select'
export { Alert } from './components/Alert/Alert'
// The VARIANT interfaces are exported too, not only the union. They are already public in
// substance - they are the shapes a consumer writes - and api-extractor reported them only as
// `(ae-forgotten-export)` warnings, never as declarations. So a breaking change to
// `BadgeCountProps.countLabel` or `TagRemovableProps.children` did not appear in the public
// surface diff at all, on a project whose first stated gotcha is that publishing is a one-way
// door. Exporting them puts the discriminated pairs under `check:api-report`.
export type { AlertProps, AlertIntent, AlertStaticProps, AlertDismissibleProps } from './components/Alert/Alert'
export { Badge } from './components/Badge/Badge'
export type { BadgeProps, BadgeIntent, BadgeLabelProps, BadgeCountProps } from './components/Badge/Badge'
export { Tag } from './components/Tag/Tag'
export type { TagProps, TagIntent, TagStaticProps, TagRemovableProps } from './components/Tag/Tag'
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

// Form framework and controls. Every control reads its label, description, error and required
// state from the Field it sits inside - the association is done once rather than on each control.
export { Field } from './components/Field/Field'
export type { FieldProps } from './components/Field/Field'
export { useFieldWiring } from './lib/field-context'
export type { FieldWiring } from './lib/field-context'
export { Input } from './components/Input/Input'
export type { InputProps } from './components/Input/Input'
export { Textarea } from './components/Textarea/Textarea'
export type { TextareaProps } from './components/Textarea/Textarea'
export { NumberInput } from './components/NumberInput/NumberInput'
export type { NumberInputProps } from './components/NumberInput/NumberInput'
export { PasswordInput } from './components/PasswordInput/PasswordInput'
export type { PasswordInputProps } from './components/PasswordInput/PasswordInput'
export { SearchInput } from './components/SearchInput/SearchInput'
export type { SearchInputProps } from './components/SearchInput/SearchInput'
export { Checkbox } from './components/Checkbox/Checkbox'
export type { CheckboxProps } from './components/Checkbox/Checkbox'
export { Switch } from './components/Switch/Switch'
export type { SwitchProps } from './components/Switch/Switch'
export { RadioGroup } from './components/RadioGroup/RadioGroup'
export type { RadioGroupProps, RadioOption } from './components/RadioGroup/RadioGroup'
export { CheckboxGroup } from './components/CheckboxGroup/CheckboxGroup'
export type { CheckboxGroupProps, CheckboxOption } from './components/CheckboxGroup/CheckboxGroup'

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
export { Modal } from './components/Modal'
export type { ModalProps } from './components/Modal'
export { ClaraPortal } from './theme/ClaraPortal'
export type { ClaraPortalProps } from './theme/ClaraPortal'
export { useClaraSettings } from './theme/context'
