import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useAlert } from '../context/useAlert'
import { useEntityList } from '../lib/hooks/useEntityList'
import { createRecord } from '../lib/localStore'
import { formatCurrency, formatDateTime } from '../lib/formatters'
import { toNumber } from '../lib/utils'
import InputField from '../components/InputField'
import EmptyState from '../components/EmptyState'
import SegmentedControl from '../components/SegmentedControl'

const tabOptions = [
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
]

const incomePresets = ['Bonus', 'Tip', 'Insentif', 'Lainnya']
const expensePresets = ['Bensin', 'Tol', 'Parkir', 'Lainnya']

const getTabFromSearch = (search) => {
  const params = new URLSearchParams(search)
  const tab = params.get('tab')
  return tab === 'expense' ? 'expense' : 'income'
}

const Finance = () => {
  const { user } = useAuth()
  const { showToast } = useAlert()
  const location = useLocation()
  const { items: earnings } = useEntityList('earnings')
  const { items: expenses } = useEntityList('expenses')
  const [activeTab, setActiveTab] = useState('income')
  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().slice(0, 16),
  })
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    note: '',
    date: new Date().toISOString().slice(0, 16),
  })
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [incomePreset, setIncomePreset] = useState('')
  const [expensePreset, setExpensePreset] = useState('')

  useEffect(() => {
    setActiveTab(getTabFromSearch(location.search))
  }, [location.search])

  const activeForm = activeTab === 'income' ? incomeForm : expenseForm
  const amountValue = toNumber(activeForm.amount)
  const isValid = amountValue > 0

  const updateIncomeField = (key) => (event) => {
    const value = event.target.value
    setIncomeForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'source') {
      setIncomePreset('')
    }
  }

  const updateExpenseField = (key) => (event) => {
    const value = event.target.value
    setExpenseForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'category') {
      setExpensePreset('')
    }
  }

  const handleSelectIncomePreset = (preset) => {
    setIncomePreset(preset)
    setIncomeForm((prev) => ({ ...prev, source: preset === 'Lainnya' ? '' : preset }))
  }

  const handleSelectExpensePreset = (preset) => {
    setExpensePreset(preset)
    setExpenseForm((prev) => ({ ...prev, category: preset === 'Lainnya' ? '' : preset }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!user || !isValid) return
    setLoading(true)
    try {
      if (activeTab === 'income') {
        await createRecord(
          'earnings',
          {
            source: incomeForm.source,
            amount: amountValue,
            date: incomeForm.date,
          },
          user.id
        )
        setIncomeForm({ source: '', amount: '', date: new Date().toISOString().slice(0, 16) })
        setIncomePreset('')
        showToast({ title: 'Pemasukan tersimpan', message: 'Data berhasil dicatat.', type: 'success' })
      } else {
        await createRecord(
          'expenses',
          {
            category: expenseForm.category,
            amount: amountValue,
            note: expenseForm.note,
            date: expenseForm.date,
          },
          user.id
        )
        setExpenseForm({ category: '', amount: '', note: '', date: new Date().toISOString().slice(0, 16) })
        setExpensePreset('')
        showToast({ title: 'Pengeluaran tersimpan', message: 'Data berhasil dicatat.', type: 'success' })
      }
    } catch {
      showToast({ title: 'Gagal menyimpan', message: 'Coba lagi dalam beberapa saat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const historyItems = useMemo(() => (activeTab === 'income' ? earnings : expenses), [activeTab, earnings, expenses])
  const total = useMemo(() => historyItems.reduce((sum, item) => sum + (item.amount || 0), 0), [historyItems])

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Catat Cepat</p>
            <h2 className="section-title">{activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'}</h2>
          </div>
          <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} size="sm" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-sunrise-300">
          {formatCurrency(total)}
        </p>
        <p className="text-xs text-white/60">Total {activeTab === 'income' ? 'pemasukan' : 'pengeluaran'} tercatat</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Input Ringkas</h3>
          <button type="button" className="btn-ghost" onClick={() => setDetailsOpen((prev) => !prev)}>
            {detailsOpen ? 'Tutup Detail' : 'Detail'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Nominal (Rp)"
            type="number"
            inputMode="numeric"
            value={activeForm.amount}
            onChange={activeTab === 'income' ? updateIncomeField('amount') : updateExpenseField('amount')}
            required
          />
          {activeTab === 'income' ? (
            <InputField
              label="Sumber (opsional)"
              value={incomeForm.source}
              onChange={updateIncomeField('source')}
              placeholder="Bonus, tip, insentif"
            />
          ) : (
            <InputField
              label="Kategori (opsional)"
              value={expenseForm.category}
              onChange={updateExpenseField('category')}
              placeholder="Bensin, tol, parkir"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(activeTab === 'income' ? incomePresets : expensePresets).map((preset) => {
            const activePreset = activeTab === 'income' ? incomePreset : expensePreset
            const handleSelect = activeTab === 'income' ? handleSelectIncomePreset : handleSelectExpensePreset
            const isActive = preset === activePreset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelect(preset)}
                className={`pill ${isActive ? 'bg-sunrise-300/20 text-sunrise-100' : 'bg-white/10 text-white/70'}`}
              >
                {preset}
              </button>
            )
          })}
        </div>

        {detailsOpen ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Waktu"
              type="datetime-local"
              value={activeTab === 'income' ? incomeForm.date : expenseForm.date}
              onChange={activeTab === 'income' ? updateIncomeField('date') : updateExpenseField('date')}
            />
            {activeTab === 'expense' ? (
              <InputField
                label="Catatan (opsional)"
                value={expenseForm.note}
                onChange={updateExpenseField('note')}
                placeholder="Isi catatan singkat"
              />
            ) : null}
          </div>
        ) : null}

        {!isValid ? <p className="text-xs text-sunrise-300">Nominal wajib diisi.</p> : null}

        <button type="submit" className="btn-primary" disabled={!isValid || loading}>
          {loading ? 'Menyimpan...' : activeTab === 'income' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran'}
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-4">
        <h2 className="section-title">Riwayat Terbaru</h2>
        {historyItems.length === 0 ? (
          <EmptyState
            title="Belum ada data"
            description={activeTab === 'income'
              ? 'Catat bonus, tip, atau pemasukan lainnya.'
              : 'Catat biaya bensin, tol, parkir, atau lainnya.'}
          />
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="soft-border rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {activeTab === 'income' ? item.source || 'Tanpa sumber' : item.category || 'Tanpa kategori'}
                    </p>
                    <p className="text-xs text-white/60">{formatDateTime(item.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-sunrise-300">
                    {formatCurrency(item.amount || 0)}
                  </p>
                </div>
                {activeTab === 'expense' && item.note ? (
                  <p className="mt-2 text-xs text-white/50">{item.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Finance
