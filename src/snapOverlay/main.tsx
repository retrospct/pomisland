import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SnapOverlayApp } from './SnapOverlayApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SnapOverlayApp />
  </StrictMode>,
)
