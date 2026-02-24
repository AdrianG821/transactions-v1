import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'

type CurrencyType = 'RON' | 'EUR' | 'GBP' | 'RUB'
type budgetPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

type Budgets = {
    id: number
    userId: number
    name: string
    currentSpending: number
    limitAmountMinor: number
    description: string
    currency: CurrencyType
    period: budgetPeriod
    anchorWeekday: number
    anchorDayOfMonth: number
    rollover: boolean
    status: string
    createdAt: string
    updatedAt: string
}

type ListResponse = {
  data: Budgets[]
}


export default function Budgets() {

    const [budgetName, setBudgetName] = useState('')
    const [currency, setCurrency] = useState<CurrencyType>('RON')
    const [period, setPeriod] = useState<budgetPeriod | ''>('WEEKLY')
    const [limitAmountMinor, setlimitAmountMinor] = useState('')
    const [description, setDescription] = useState('')
    const [anchorWeekday, setAnchorWeekDay] = useState(0)
    const [anchorDayOfMonth, setAnchorDayOfMonth] = useState(0)
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [anchorDayDisabled, setAnchorDayDisabled] = useState<Boolean>(true)
    const [anchorWeekDisabled, setAnchorWeekDisabled] = useState<Boolean>(true)

    const [seeArchived, setSeeArchived] = useState(false)

    const [budgets, setBudgets] = useState<Budgets[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const norm = (s: string) => s.trim().toLowerCase()


    //aducem bugetele
    async function fetchList() {
        setLoading(true)
        setError(null)
        try {
        const { data } = await api.get<ListResponse>('/api/v1/budgets')
        const items = data.data

        const itemsRea = items.filter(rearranged => rearranged.status !== 'ARCHIVED')

        setBudgets(itemsRea)
        setSeeArchived(false)
        } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT LISTING')
        } finally {
        setLoading(false)
        }
    }

    async function fetchArchivedList() {
        setLoading(true)
        setError(null)
        try {
        const { data } = await api.get<ListResponse>('/api/v1/budgets')
        const items = data.data
        const itemsRea = items.filter(rearranged => rearranged.status !== 'ACTIVE')

        setBudgets(itemsRea)
        setSeeArchived(true)
        } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT LISTING')
        } finally {
        setLoading(false)
        }
    }

    async function toggleWalletView() {
      if(seeArchived) {
        fetchList()
      } else {
        fetchArchivedList()
      }
    }

    // montam bugete
    useEffect(() => {
        inputRef.current?.focus()
        fetchList()
    }, [])


    useEffect(() => {
      if(period === 'WEEKLY'){
        setAnchorWeekDisabled(false)
        setAnchorDayDisabled(true)
      } 
      if (period === 'MONTHLY') {
        setAnchorDayDisabled(false)
        setAnchorWeekDisabled(true)
      }
      if (period === '')  {
        setAnchorWeekDisabled(true)
        setAnchorDayDisabled(true)
      }
      if (period === 'YEARLY')  {
        setAnchorWeekDisabled(true)
        setAnchorDayDisabled(true)
      }
      if (period === 'QUARTERLY')  {
        setAnchorWeekDisabled(true)
        setAnchorDayDisabled(true)
      }
    }, [period])

    // archive budget

    async function archiveBudget(idB: number) {
      const answear = window.confirm('Are you sure you want to archive the budget?')

      if(answear) {
        try {
          console.log('archive')
          await api.patch(`api/v1/budgets/${idB}/archive`, {id: idB})
          await fetchList()
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Error at archiving budget')
        }
      }
    }


    //creeaza un buget
    async function handleCreatBudget(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        
        const trimmed = budgetName.trim()
        const convert = parseFloat(limitAmountMinor.replace(',', '.'))
        if(Number.isNaN(convert) || convert <0) {
          setError('Introduce a higher sum or equal of 0')
          return
        }
        
        const convertNumber = Math.round(convert * 100)

        //VALIDARI
         if (trimmed.length < 4 || trimmed.length > 25) {
        setError('The name has to be between 4 and 25 characters')
        }
        const duplicate = budgets.some(w => norm(w.name) === norm(trimmed))
        if (duplicate) {
        setError('You already have a budget with the same name.')
        }

        setSubmitting(true)

        try {
        await api.post('/api/v1/budgets', { name: trimmed, limitAmountMinor: convertNumber, description , period , anchorWeekday, anchorDayOfMonth, from , to ,currency })
        setBudgetName('')
        setCurrency('RON')
        await fetchList()
        inputRef.current?.focus()
        } catch (err: any) {
        if (err?.response?.status === 409) {
            setError('You already have a budget with the same name.')
        } else {
            setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT CREATING')
        }
        } finally {
        setSubmitting(false)
        }
    }

    return (

      <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 12px' }}>
      <h1 style={{ marginBottom: 12 }}>Budgets</h1>

      {/* Create form */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <form onSubmit={handleCreatBudget}>
          <input
            ref={inputRef}
            type="text"
            value={budgetName}
            onChange={(e) => setBudgetName(e.target.value)}
            placeholder="Name of your Budget"
            maxLength={25}
            style={{ marginRight: 8 }}
          />
          <input
            type="text"
            value={limitAmountMinor}
            onChange={(e) => setlimitAmountMinor(e.target.value)}
            placeholder="How much are you willing to spend"
            style={{ marginRight: 8 }}
          />
          
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyType)} style={{ marginRight: 8 }}>
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="RUB">RUB</option>
          </select>

          <select value={period} onChange={(e) => setPeriod(e.target.value as budgetPeriod)} style={{ marginRight: 8 }}>
            <option value="">Choose period</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="YEARLY">YEARLY</option>
          </select>
        
          <input
            type="number"
            min="1"
            max="7"
            disabled={Boolean(anchorWeekDisabled)}
            value={anchorWeekday}
            onChange={(e) => setAnchorWeekDay(Number(e.target.value))}
            placeholder="Which day of the month"
            style={{ marginRight: 8 }}
          />
          <input
            type="number"
            min="1"
            max="28"
            disabled={Boolean(anchorDayDisabled)}
            value={anchorDayOfMonth}
            onChange={(e) => setAnchorDayOfMonth(Number(e.target.value))}
            placeholder="Which day of the week"
            style={{ marginRight: 8 }}
          />


          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />

          <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your description"
              maxLength={255}
              style={{ marginRight: 8 }}
            />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </button>

          {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
        </form>
        <button onClick={() =>toggleWalletView()} style={{marginLeft: 8}}>SEE ARCHIVED WALLETS</button>
        </section>

        {/** LISTAREA */}

        <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
        {loading && <div>Reloading...</div>}

        {!loading && budgets.length === 0 && <div>NO BUDGET FOUND.</div>}

        {!loading && budgets.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {budgets.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 6 }}>{b.name}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{Number(b.limitAmountMinor)/100}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{b.currency}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{b.status}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    {new Date(b.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  {
                  <td style={{ padding: 6 }}>
                  <button type="button" onClick={() => archiveBudget(b.id)}>
                    {b.status === 'ACTIVE' && <div>Archive</div>}
                    {b.status === 'ARCHIVED' && <div>Activate</div>}
                    </button>
                  </td>
                  }
        
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      </div>


    )
}