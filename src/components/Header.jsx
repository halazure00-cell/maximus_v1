import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useSync } from '../context/useSync'

const navItems = [
  { to: '/', label: 'Dasbor' },
  { to: '/perjalanan', label: 'Trip' },
  { to: '/pendapatan', label: 'Pendapatan' },
  { to: '/pengeluaran', label: 'Pengeluaran' },
]

const Header = ({ onOpenMore }) => {
  const { user } = useAuth()
  const { status } = useSync()

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Rute Cepat</p>
          <h1 className="text-lg font-semibold text-white">
            Halo, {user?.email || 'Driver'}
          </h1>
        </div>
        <div className="flex items-center justify-between gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sunrise-400/90 text-night-950'
                      : 'text-white/70 hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button type="button" className="btn-ghost" onClick={onOpenMore}>
              Lainnya
            </button>
          </nav>
          <span className="pill bg-white/10 text-[11px] text-white/70">
            {status === 'syncing' ? 'Sinkron...' : 'Siap Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Header
