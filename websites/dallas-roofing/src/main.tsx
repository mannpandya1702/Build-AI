import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled, self-hosted fonts (no external CDN request, works offline, no
// console errors). Inter for body/UI, Dancing Script for the accent word.
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource-variable/dancing-script/index.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
