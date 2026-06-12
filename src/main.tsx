import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { cleanUrlOnLoad } from './lib/cleanUrl'
import './index.css'
import App from './App.tsx'

cleanUrlOnLoad()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
