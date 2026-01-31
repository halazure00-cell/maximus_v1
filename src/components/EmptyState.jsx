const EmptyState = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-white/20 bg-night-900/60 px-6 py-10 text-center">
    <p className="text-sm font-semibold text-white">{title}</p>
    <p className="mt-2 text-xs text-white/60">{description}</p>
  </div>
)

export default EmptyState
