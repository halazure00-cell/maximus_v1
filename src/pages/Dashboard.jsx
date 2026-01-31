import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useEntityList } from '../lib/hooks/useEntityList'
import { formatCurrency } from '../lib/formatters'
import StatCard from '../components/StatCard'
import SectionCard from '../components/SectionCard'
import HeatmapLayer from '../components/HeatmapLayer'

const Dashboard = () => {
  const { items: trips } = useEntityList('trips')
  const { items: earnings } = useEntityList('earnings')
  const { items: expenses } = useEntityList('expenses')
  const { items: heatmapPoints } = useEntityList('heatmap_points')

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayTrips = trips.filter((trip) => trip.date?.startsWith(today))
    const todayEarnings = earnings.filter((item) => item.date?.startsWith(today))
    const todayExpenses = expenses.filter((item) => item.date?.startsWith(today))

    const tripCount = todayTrips.length
    const totalIncome = todayEarnings.reduce((sum, item) => sum + (item.amount || 0), 0)
    const tripIncome = todayTrips.reduce((sum, item) => sum + (item.fare || 0), 0)
    const totalExpense = todayExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)

    return {
      tripCount,
      totalIncome: totalIncome + tripIncome,
      totalExpense,
      net: totalIncome + tripIncome - totalExpense,
    }
  }, [trips, earnings, expenses])

  const heatPoints = heatmapPoints
    .filter((point) => point.lat && point.lng)
    .map((point) => [point.lat, point.lng, point.intensity || 0.6])

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Aksi Cepat</h2>
          <span className="pill bg-white/10 text-[11px] text-white/70">1 Tap</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/perjalanan" className="btn-primary">
            Catat Trip
          </Link>
          <Link to="/pendapatan" className="btn-outline">
            Tambah Pendapatan
          </Link>
          <Link to="/pengeluaran" className="btn-outline">
            Tambah Pengeluaran
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Trip Hari Ini"
          value={summary.tripCount}
          caption="Jumlah perjalanan tercatat"
        />
        <StatCard
          title="Pendapatan"
          value={formatCurrency(summary.totalIncome)}
          caption="Total pemasukan hari ini"
          accent="text-sunrise-300"
        />
        <StatCard
          title="Neto"
          value={formatCurrency(summary.net)}
          caption="Setelah pengeluaran"
          accent="text-teal-200"
        />
      </div>

      <SectionCard
        title="Peta Panas Perjalanan"
        action={<span className="pill bg-white/10 text-white/70">Bandung</span>}
      >
        <div className="h-72 overflow-hidden rounded-2xl border border-white/10">
          <MapContainer
            center={[-6.9147, 107.6098]}
            zoom={12}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer points={heatPoints} />
          </MapContainer>
        </div>
        <p className="mt-3 text-xs text-white/60">
          Titik panas berasal dari lokasi trip yang kamu simpan.
        </p>
      </SectionCard>
    </div>
  )
}

export default Dashboard
