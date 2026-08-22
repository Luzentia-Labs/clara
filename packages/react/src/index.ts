import './styles.css'

// Box and Button only. Both are minimal, and minimal is safe here: adding props later is additive
// and therefore a minor, while renaming or removing one is permanent (AGENTS.md - publishing is a
// one-way door).
//
// Table and TableSortButton are deliberately NOT exported. They exist under src/components/Table/
// as build fixtures for the co-location case - a client component living inside a server
// component's directory, which shipped undirectived until D0047 - and they are unit-tested there.
// Exporting them would freeze a three-line placeholder as Clara's Table API, and freeze a
// component name (`TableSortButton`) that appears nowhere in the TRD.
export { Button } from './components/Button/Button'
export type { ButtonProps } from './components/Button/Button'
export { Box } from './components/Box/Box'
export type { BoxProps } from './components/Box/Box'
