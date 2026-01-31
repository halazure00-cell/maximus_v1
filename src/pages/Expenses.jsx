import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useEntityList } from '../lib/hooks/useEntityList'
import { createRecord } from '../lib/localStore'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { toNumber } from '../lib/utils'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import { useAlert } from '../context/useAlert'

const Expenses = () => {
  const { user } = useAuth()
  const { items } = useEntityList('expenses')
  const [form, setForm] = useState({
    category: '',
    amount: '',
    note: '',
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
        'expenses',
        {
          category: form.category,
          amount: toNumber(form.amount),
          note: form.note,
          date: form.date,
        },
        user.id
      )
      setForm({ category: '', amount: '', note: '', date: new Date().toISOString().slice(0, 16) })
      showToast({ title: 'Pengeluaran tersimpan', message: 'Biaya tercatat.', type: 'success' })
    } catch {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <h2 className="section-title">Total Pengeluaran</h2>
        <p className="mt-2 text-2xl font-semibold text-sunrise-300">
          {formatCurrency(total)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Catat Pengeluaran</h2>
          <span className="pill bg-white/10 text-[11px] text-white/70">Cepat</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Kategori" value={form.category} onChange={updateField('category')} required />
          <InputField
            label="Jumlah (Rp)"
            type="number"
            inputMode="numeric"
            value={form.amount}
            onChange={updateField('amount')}
            required
          />
          <InputField label="Catatan" value={form.note} onChange={updateField('note')} />
          <InputField label="Waktu" type="datetime-local" value={form.date} onChange={updateField('date')} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Riwayat Pengeluaran</h2>
        {items.length === 0 ? (
          <EmptyState
            title="Belum ada data"
            description="Catat biaya bensin, tol, parkir, atau lainnya."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="soft-border rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.category}</p>
                    <p className="text-xs text-white/60">{formatDateTime(item.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-sunrise-300">
                    {formatCurrency(item.amount || 0)}
                  </p>
                </div>
                {item.note ? <p className="mt-2 text-xs text-white/50">{item.note}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Expenses
