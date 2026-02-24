import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

type Currency = 'RON' | 'EUR' | 'GBP' | 'RUB'
type TxType = 'INCOME' | 'EXPENSE'
type KindTransfer = 'NORMAL' | 'OPENING' | 'TRANSFER' | 'ADJUSTMENT'

type Transaction = {
  id: number
  userId: number
  destWalletId: string
  sourceWalletId: string
  amountMinor: number
  wallet: { name: string }
  walletId: string
  type: TxType
  kind: KindTransfer
  currency: Currency
  description: string | null
  date: string
  createdAt: string
  updatedAt: string
}

type myTypeWallets = {
  id: number
  publicId: string
  userId: number
  name: string
  currency: Currency
  isDefault: boolean
  status: string
}
type ListResponseMyWallets ={
  data: myTypeWallets[]
}

type myTypeBudget = {
  id: number
  userId: number
  name: string
  limitAmountMinor: number
  rollover: boolean
  anchorDayOfMonth: number
  anchorWeekday: number
  period: string
  currency: Currency
}
type ListResponseMyBudgets ={
  data: myTypeBudget[]
}

type ListResponse = {
  data: Transaction[]
  page: number
  limit: number
  total: number
}


function toMinor(major: string | number) {
  const n = typeof major === 'number' ? major.toString() : major
  const cleaned = n.replace(',', '.').trim()
  const value = Math.round(parseFloat(cleaned) * 100)
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    throw new Error('INVALID SUM')
  }
  return value
}

function formatMoney(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(minor / 100)
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}



export default function Transactions() {
  // listare
  const [items, setItems] = useState<Transaction[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // filtre
  const [type, setType] = useState<TxType | ''>('EXPENSE')
  const [walletId, setWalletId] = useState<number | ''>('')
  const [myWallets, setMyWallets] = useState<myTypeWallets[]>([])

  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('') // yyyy-mm-dd
  const [to, setTo] = useState('')     // yyyy-mm-dd
  const [kindTrans, setKindTrans] = useState<KindTransfer>('TRANSFER')

  // create form
  const [cAmountMajor, setCAmountMajor] = useState('')
  const [currencyWallet, setCurrencyWallet] = useState<Currency>('RON')        
  const [destWalletId, setDestWalletId] = useState('')
  const [sourceWalletId, setSourceWalletId] = useState('')
  const [cDescription, setCDescription] = useState('')
  const [cDate, setCDate] = useState('') 

  const [budget, setBudget] = useState<myTypeBudget[]>([])
  const [sourceBudget, setSourceBudget] = useState<Number>()

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [total, limit])


  
  async function fetchList() {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, limit }
      if (type) params.type = type
      if (walletId) params.walletId = walletId
      if (search.trim()) params.search = search.trim()
      if (from) params.from = from
      if (to) params.to = to

      const { data } = await api.get<ListResponse>('/api/v1/transactions', { params })
      setItems(data.data)
      setTotal(data.total)
      await fetchMyWallets()
      await fetchMyBudgets()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la listare')
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyWallets() {
    setLoading(true)
    setError(null) 

    try{
      const { data } = await api.get<ListResponseMyWallets>('/api/v1/transactions/wallets')
      const items = data.data

      const defaultWallet = items.find((t) => t.isDefault === true)
      
      if(defaultWallet) {
        setSourceWalletId(defaultWallet.publicId)
      }

      const others = items.filter( w => w.isDefault !== true)
      const rearranged = defaultWallet ? [defaultWallet, ...others] : items
      
      setMyWallets(rearranged)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la Listare')
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyBudgets() {
    setLoading(true)
    setError(null) 

    try{
      const { data } = await api.get<ListResponseMyBudgets>('/api/v1/transactions/budgets')
      const items = data.data
       
      setBudget(items)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la Listare')
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    fetchList()
  }, [page, limit, type, walletId])



  function resetFilters() {
    setType('')
    setWalletId('')
    setSearch('')
    setFrom('')
    setTo('')
    setPage(1)
    // reîncărcăm explicit
    fetchList()
  }



  async function applyFilters(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    await fetchList()
  }


  async function findCurrency(publicId: string) {
    return myWallets.find(w => w.publicId === publicId)
  }



  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const wallet = findCurrency(sourceWalletId)
    if(!wallet) return setError("Wallet not found")
      
    setSubmitting(true)
      try {
        if (!sourceWalletId) throw new Error('Choose a valid wallet')
        const amountMinor = toMinor(cAmountMajor)
        const payload: any = {
          sourceWalletId: sourceWalletId,
          destWalletId: destWalletId,
          kind: kindTrans,
          currency: currencyWallet,
          budget: sourceBudget ?? null,
          amountMinor,  
      }

      if (cDescription.trim()) payload.description = cDescription.trim()
      if (cDate) payload.date = cDate

      await api.post<Transaction>('/api/v1/transactions', payload)

      setCAmountMajor('')
      setCDescription('')
      setCDate('')

      await fetchList()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la creare')
    } finally {
      setSubmitting(false)
    }
  }





  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 12px' }}>
      <h1 style={{ marginBottom: 12 }}>Transactions</h1>

      {/* adauga tranzactie */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>Add transaction</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <input
            type="text"
            min={1}
            value={destWalletId === '' ? '' : destWalletId}
            onChange={(e) => setDestWalletId(e.target.value)}
            placeholder="Destinatar"
          />

          {/* <input
            type="text"
            min={1}
            value={sourceWalletId === '' ? '' : sourceWalletId}
            onChange={(e) => setSourceWalletId(e.target.value)}
            placeholder="Portofelul tau"
          /> */}
          
          {
            <select onChange={(e) => setSourceWalletId(e.target.value)}>
            {myWallets.map(w => (         
                <option value={w.publicId}>{w.name}  ({w.currency})</option>     
            ))}
            </select>
          }

            {/**BUDGETS transaction */}
          {
            <select onChange={(e) => setSourceBudget(Number(e.target.value))}>
              <option>Choose a budget</option>  
            {budget.map(b => (                      
                <option value={b.id}>{b.name}  ({b.currency})</option>     
            ))}
            </select>
          }
          
          <input
            value={cAmountMajor}
            onChange={(e) => setCAmountMajor(e.target.value)}
            placeholder="Amount (ex. 123.45)"
          />
          
          <select value={kindTrans} onChange={(e) => setKindTrans(e.target.value as KindTransfer)}>
            <option value="NORMAL">NORMAL</option>
            <option value="OPENING">OPENING</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>


          {/* <select value={currencyWallet} onChange={(e) => setCurrencyWallet(e.target.value as Currency)}>
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="RUB">RUB</option>
          </select> */}

          <input
            value={cDescription}
            onChange={(e) => setCDescription(e.target.value)}
            placeholder="Description (optional)"
          />         
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      </section>



      {/* filtre*/}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>Filters</h2>
        <form onSubmit={applyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <select value={type} onChange={(e) => setType(e.target.value as TxType | 'EXPENSE')}>
            <option value="">All types</option>
            <option value="EXPENSE">EXPENSE</option>
            <option value="INCOME">INCOME</option>
          </select>
          <input
            type="number"
            min={1}
            value={walletId === '' ? '' : walletId}
            onChange={(e) => setWalletId(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Wallet ID"
          />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search in description…" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Apply</button>
            <button type="button" onClick={resetFilters}>Reset</button>
          </div>
        </form>
      </section>



      {/* listare */}


      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
        

        {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
        {loading ? (
          <div>Se încarcă…</div>
        ) : items.length === 0 ? (
          <div>NO TRANSACTION FOUND.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: 6 }}>Date of transaction</th>
                <th style={{ padding: 6 }}>Type</th>
                <th style={{ padding: 6 }}>Wallet</th>
                <th style={{ padding: 6, textAlign: 'right' }}>Amount</th>
                <th style={{ padding: 6 }}>Description</th>
              </tr>
            </thead>


            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: 6 }}>{formatDate(tx.date)}</td>
                  <td style={{ padding: 6 }}>{tx.type}</td>
                  <td style={{ padding: 6 }}>{tx.wallet.name}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{formatMoney(tx.amountMinor, tx.currency)}</td>      
                  <td style={{ padding: 6 }}>{tx.description ?? ''}</td>         
                </tr>
              ))}
            </tbody>


          </table>
        )}

        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong>Total:</strong> {items.length}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>Per page</span>
            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ◀ Prev
            </button>
            <span>Page {page} / {maxPage}</span>
            <button disabled={page >= maxPage || loading} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
              Next ▶
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
