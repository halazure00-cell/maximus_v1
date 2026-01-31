import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEntityList } from '../lib/hooks/useEntityList'
import { createRecord } from '../lib/localStore'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { toNumber } from '../lib/utils'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import { useAlert } from '../context/AlertContext'

const Earnings = () => {
  const { user } = useAuth()
  const { items } = useEntityList('earnings')
  const [form, setForm] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().slice(0, 16),
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useAlert()

  const updateField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      await createRecord(
        'earnings',
        {
          source: form.source,
          amount: toNumber(form.amount),
          date: form.date,
        },
        user.id
      )
      setForm({ source: '', amount: '', date: new Date().toISOString().slice(0, 16) })
      showToast({ title: 'Pendapatan tersimpan', message: 'Data pemasukan dicatat.', type: 'success' })
    } catch (error) {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <h2 className="section-title">Total Pendapatan Tambahan</h2>
        <p className="mt-2 text-2xl font-semibold text-sunrise-300">
          {formatCurrency(total)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Catat Pendapatan</h2>
          <span className="pill bg-white/10 text-[11px] text-white/70">Cepat</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Sumber" value={form.source} onChange={updateField('source')} required />
          <InputField
            label="Jumlah (Rp)"
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={updateField('amount')}
            required
          />
          <InputField label="Waktu" type="datetime-local" value={form.date} onChange={updateField('date')} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Pendapatan'}
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Riwayat Pendapatan</h2>
        {items.length === 0 ? (
          <EmptyState
            title="Belum ada data"
            description="Catat bonus, tip, atau pemasukan lainnya."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="soft-border rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.source}</p>
                    <p className="text-xs text-white/60">{formatDateTime(item.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-sunrise-300">
                    {formatCurrency(item.amount || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Earnings
