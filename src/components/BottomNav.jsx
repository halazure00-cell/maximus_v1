import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    label: 'Dasbor',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 11.5 12 3l9 8.5V21a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z"
        />
      </svg>
    ),
  },
  {
    to: '/perjalanan',
    label: 'Trip',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 5h7a3 3 0 0 1 0 6H8a2 2 0 0 0 0 4h8a3 3 0 0 1 0 6H4v-2h12a1 1 0 0 0 0-2H8a4 4 0 1 1 0-8h3a1 1 0 0 0 0-2H4V5Z"
        />
      </svg>
    ),
  },
  {
    to: '/pendapatan',
    label: 'Masuk',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v1.1c1.8.3 3 1.5 3 3.2h-2c0-.8-.6-1.4-1.7-1.4-1 0-1.6.5-1.6 1.1 0 .7.7 1 2 1.3 2 .4 3.5 1.2 3.5 3.2 0 1.8-1.2 3.1-3.2 3.5V19h-2v-1.1c-1.9-.3-3.2-1.6-3.3-3.6h2c.1.9.8 1.7 2 1.7 1.1 0 1.7-.5 1.7-1.2 0-.7-.5-1.1-2-1.4-2-.4-3.5-1.1-3.5-3.2 0-1.8 1.3-3 3.1-3.3V7h2Z"
        />
      </svg>
    ),
  },
  {
    to: '/pengeluaran',
    label: 'Keluar',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a3 3 0 0 1 0-12Zm0 2a1 1 0 0 0 0 2h11V8H7Zm11 6H7a1 1 0 0 0 0 2h11v-2Z"
        />
      </svg>
    ),
  },
]

const BottomNav = ({ onOpenMore }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-night-950/95 backdrop-blur md:hidden">
    <div className="grid grid-cols-5 gap-2 px-2 py-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
              isActive
                ? 'bg-sunrise-400/90 text-night-950'
                : 'text-white/70 hover:bg-white/10'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-white/70 transition hover:bg-white/10"
        aria-label="Buka menu lainnya"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M5 10h14a2 2 0 1 1 0 4H5a2 2 0 0 1 0-4Zm0-6h8a2 2 0 0 1 0 4H5a2 2 0 0 1 0-4Zm0 12h8a2 2 0 0 1 0 4H5a2 2 0 0 1 0-4Z"
          />
        </svg>
        Lainnya
      </button>
    </div>
  </nav>
)

export default BottomNav
