/**
 * Public entry for @luzentialabs/clara-icons.
 *
 * Every named export here is permanent (AGENTS.md - publishing is a one-way door), which is why
 * the set is an enumerated, counted list in ICONS.md rather than "the icons we need so far".
 * `check-icons.mjs` fails if this file and that list disagree in either direction.
 */
export { Icon } from './Icon'
export type { IconProps } from './Icon'
export * from './generated'
