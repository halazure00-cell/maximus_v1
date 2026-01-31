import { NavLink } from 'react-router-dom'

const moreItems = [
  { to: '/pengaturan', label: 'Pengaturan' },
]

const MoreSheet = ({ open, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Tutup menu lainnya"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-night-950/95 px-5 pb-8 pt-4 md:left-1/2 md:right-auto md:top-20 md:bottom-auto md:w-[360px] md:-translate-x-1/2 md:rounded-3xl md:border md:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Menu Lainnya</p>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
        <div className="grid gap-3">
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-sunrise-300/60 bg-sunrise-400/10 text-sunrise-200'
                    : 'border-white/10 bg-night-900/80 text-white/80 hover:border-white/20'
                }`
              }
            >
              <span>{item.label}</span>
              <span className="text-xs text-white/50">›</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MoreSheet
