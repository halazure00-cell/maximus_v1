import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import AppLayout from './components/AppLayout'
import LoadingScreen from './components/LoadingScreen'
import { getSettings } from './lib/localStore'
import { subscribe } from './lib/events'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import Earnings from './pages/Earnings'
import Expenses from './pages/Expenses'
import Schedule from './pages/Schedule'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

const getSystemTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const getScheduleTheme = (date = new Date()) => {
  const hour = date.getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

const applyTheme = (theme) => {
  const nextTheme = theme === 'light' ? 'light' : 'dark'
  const root = document.documentElement
  root.dataset.theme = nextTheme
  root.style.colorScheme = nextTheme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', nextTheme === 'dark' ? '#0a0b10' : '#fbf6ee')
  }
}

const ThemeManager = () => {
  useEffect(() => {
    let active = true
    let media = null
    let intervalId = null

    const handleSystemChange = (event) => {
      applyTheme(event.matches ? 'dark' : 'light')
    }

    const clearWatchers = () => {
      if (media) {
        if (media.removeEventListener) {
          media.removeEventListener('change', handleSystemChange)
        } else if (media.removeListener) {
          media.removeListener(handleSystemChange)
        }
      }
      media = null
      if (intervalId) {
        clearInterval(intervalId)
      }
      intervalId = null
    }

    const applyFromSettings = (settings) => {
      const mode = settings.themeMode || 'manual'
      const manualTheme = settings.theme === 'light' ? 'light' : 'dark'
      let nextTheme = manualTheme
      if (mode === 'system') {
        nextTheme = getSystemTheme()
      }
      if (mode === 'schedule') {
        nextTheme = getScheduleTheme()
      }
      applyTheme(nextTheme)
      clearWatchers()
      if (mode === 'system' && window.matchMedia) {
        media = window.matchMedia('(prefers-color-scheme: dark)')
        if (media.addEventListener) {
          media.addEventListener('change', handleSystemChange)
        } else if (media.addListener) {
          media.addListener(handleSystemChange)
        }
      }
      if (mode === 'schedule') {
        intervalId = setInterval(() => {
          applyTheme(getScheduleTheme())
        }, 60 * 1000)
      }
    }

    const loadSettings = async () => {
      const settings = await getSettings()
      if (!active) return
      applyFromSettings(settings)
    }

    loadSettings()
    const unsubscribe = subscribe((event) => {
      if (event.storeName === 'settings') {
        loadSettings()
      }
    })

    return () => {
      active = false
      clearWatchers()
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return null
}

const App = () => (
  <>
    <ThemeManager />
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="perjalanan" element={<Trips />} />
        <Route path="pendapatan" element={<Earnings />} />
        <Route path="pengeluaran" element={<Expenses />} />
        <Route path="jadwal" element={<Schedule />} />
        <Route path="catatan" element={<Notes />} />
        <Route path="pengaturan" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
)

export default App
