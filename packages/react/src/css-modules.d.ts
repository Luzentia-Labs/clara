/** Vite compiles `*.module.css` to an object of hashed class names. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
