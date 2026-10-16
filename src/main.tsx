import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import './index.css'

try {
  if (localStorage.getItem('aia-members-hub:theme') === 'dark') document.documentElement.dataset.theme = 'dark'
} catch {
  /* تجاهل */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/site/members">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
