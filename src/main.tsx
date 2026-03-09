import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { siteConfig } from './lib/site-config'
import { loadAffiliates } from './lib/affiliates'
import { loadDodoConfig } from './lib/subscription'

// Set dynamic title & meta based on site mode
document.title = `${siteConfig.name} — ${siteConfig.heroTitle}`
const metaDesc = document.querySelector('meta[name="description"]')
if (metaDesc) metaDesc.setAttribute('content', siteConfig.metaDescription)

// Load dynamic config from DB
loadAffiliates()
loadDodoConfig()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
