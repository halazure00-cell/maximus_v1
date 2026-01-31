import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEntityList } from '../lib/hooks/useEntityList'
import { createRecord } from '../lib/localStore'
import { formatDateTime } from '../lib/formatters'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import { useAlert } from '../context/AlertContext'

const Schedule = () => {
  const { user } = useAuth()
  const { items } = useEntityList('schedule')
  const [form, setForm] = useState({
    title: '',
    target: '',
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
        'schedule',
        {
          title: form.title,
          target: form.target,
          date: form.date,
        },
        user.id
      )
      setForm({ title: '', target: '', date: new Date().toISOString().slice(0, 16) })
      showToast({ title: 'Jadwal tersimpan', message: 'Shift dicatat.', type: 'success' })
    } catch (error) {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Rencana Shift</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Judul Shift" value={form.title} onChange={updateField('title')} required />
          <InputField label="Target" value={form.target} onChange={updateField('target')} />
          <InputField label="Waktu" type="datetime-local" value={form.date} onChange={updateField('date')} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Jadwal Mendatang</h2>
        {items.length === 0 ? (
          <EmptyState
            title="Belum ada jadwal"
            description="Buat rencana shift dan target harian." 
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="soft-border rounded-2xl px-4 py-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/60">{formatDateTime(item.date)}</p>
                {item.target ? <p className="mt-2 text-xs text-white/50">Target: {item.target}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Schedule
