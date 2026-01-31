import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import AppLayout from './components/AppLayout'
import LoadingScreen from './components/LoadingScreen'
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

const App = () => (
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
)

export default App
