import { createRoot } from 'react-dom/client'
import { Box, Button } from '@luzentialabs/clara-react'
import '@luzentialabs/clara-react/styles.css'

// Imports both a server-capable and a client-only component, and the stylesheet subpath the
// closed exports map promises. If any of those three is unreachable from the published tarball,
// this build fails - which is the point: the package is only really tested by a consumer.
createRoot(document.getElementById('root')!).render(
  <Box padding="md">
    <Button variant="secondary" onClick={() => undefined}>ok</Button>
  </Box>,
)
