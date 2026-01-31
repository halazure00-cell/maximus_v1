import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEntityList } from '../lib/hooks/useEntityList'
import { createRecord } from '../lib/localStore'
import { formatDateTime } from '../lib/formatters'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import { useAlert } from '../context/AlertContext'

const Notes = () => {
  const { user } = useAuth()
  const { items } = useEntityList('notes')
  const [form, setForm] = useState({
    title: '',
    note: '',
    reminder: '',
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
        'notes',
        {
          title: form.title,
          note: form.note,
          reminder: form.reminder,
        },
        user.id
      )
      setForm({ title: '', note: '', reminder: '' })
      showToast({ title: 'Catatan tersimpan', message: 'Catatan berhasil dicatat.', type: 'success' })
    } catch (error) {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Catatan Cepat</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Judul" value={form.title} onChange={updateField('title')} required />
          <InputField label="Pengingat" type="datetime-local" value={form.reminder} onChange={updateField('reminder')} />
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          <span>Isi Catatan</span>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-white/15 bg-night-900/80 px-4 py-3 text-sm text-white"
            value={form.note}
            onChange={updateField('note')}
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Catatan Terakhir</h2>
        {items.length === 0 ? (
          <EmptyState
            title="Belum ada catatan"
            description="Simpan tips, lokasi ramai, atau reminder penting."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="soft-border rounded-2xl px-4 py-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/60">{item.note}</p>
                {item.reminder ? (
                  <p className="mt-2 text-xs text-teal-200">
                    Pengingat: {formatDateTime(item.reminder)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes
