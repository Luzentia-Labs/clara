import { Box, Button } from '@luzentialabs/clara-react'

/**
 * A SERVER component - no directive, by design. That is what makes this page a real test.
 *
 * It renders a server-capable component (Box) and a client-only one (Button). If Button's chunk
 * reaches the consumer without `"use client"`, Next fails this build with "You're importing a
 * component that needs useState. It only works in a Client Component" - the exact defect this
 * epic exists to prevent, caught at build time with no browser needed.
 *
 * If Clara were marked client wholesale instead, this page would still build - which is why the
 * boundary guard also asserts the entry and the server chunk carry NO directive.
 */
export default function Page () {
  return (
    <Box padding="md">
      <Button variant="primary">ok</Button>
    </Box>
  )
}
