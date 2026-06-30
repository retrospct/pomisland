// PROTOTYPE entry — MO-21 animation tuning. Throwaway.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimPrototype } from './AnimPrototype'

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <AnimPrototype />
  </StrictMode>,
)
