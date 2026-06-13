import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { ScopeProvider } from './shared/context/ScopeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScopeProvider>
        <App />
      </ScopeProvider>
    </BrowserRouter>
  </StrictMode>,
)