const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-night-950">
    <div className="flex flex-col items-center gap-3 text-white">
      <div className="h-12 w-12 animate-pulse rounded-full bg-sunrise-400" />
      <p className="text-sm uppercase tracking-[0.3em] text-white/60">Memuat</p>
    </div>
  </div>
)

export default LoadingScreen
