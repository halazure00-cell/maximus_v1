import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SyncProvider } from './context/SyncContext'
import { AlertProvider } from './context/AlertContext'

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <AlertProvider>
            <App />
          </AlertProvider>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
