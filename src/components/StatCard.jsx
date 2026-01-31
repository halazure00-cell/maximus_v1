const StatCard = ({ title, value, caption, accent }) => (
  <div className="glass rounded-2xl p-4 shadow-glow">
    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{title}</p>
    <p className={`mt-2 text-2xl font-semibold ${accent || 'text-white'}`}>{value}</p>
    <p className="mt-1 text-xs text-white/60">{caption}</p>
  </div>
)

export default StatCard
