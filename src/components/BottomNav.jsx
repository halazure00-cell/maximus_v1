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
    to: '/catat',
    label: 'Catat',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M5 4h8l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm8 1.5V10h4.5L13 5.5ZM7 12h10v2H7v-2Zm0 4h10v2H7v-2Z"
        />
      </svg>
    ),
  },
]

const BottomNav = ({ onOpenMore }) => (
  <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-night-950/95 backdrop-blur md:hidden">
    <div className="grid grid-cols-3 gap-2 px-2 py-3">
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
