import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'

type CurrencyType = 'RON' | 'EUR' | 'GBP' | 'RUB'

type Wallet = {
  id: number
  userId: number
  name: string
  balanceMinor: number
  currency: CurrencyType
  isDefault: boolean
  status: string
  archivedAt: string
  createdAt: string
  updatedAt: string
}

type ListResponse = {
  data: Wallet[]
}

export default function WalletsPage() {
  const [walletName, setWalletName] = useState('')
  const [balanceMinor, setbalanceMinor] = useState('')
  const [currency, setCurrency] = useState<CurrencyType>('RON')

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const [seeArchived, setSeeArchived] = useState(false)

  const norm = (s: string) => s.trim().toLowerCase()
  



  async function fetchList() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<ListResponse>('/api/v1/wallets')
      const items = data.data
      const itemsRea = items.filter(rearranged => rearranged.status !== 'ARCHIVED')

      const defaultWallet = itemsRea.find((t) => t.isDefault === true)
      const others = itemsRea.filter( w => w.isDefault !== true)

      const rearranged = defaultWallet ? [defaultWallet, ...others] : itemsRea
      
      setWallets( rearranged )
      setSeeArchived(false)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la listare')
    } finally {
      setLoading(false)
    }
  }

  


  useEffect(() => {
    inputRef.current?.focus()
    fetchList()
  }, [])


  async function fetchArchivedList() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<ListResponse>('/api/v1/wallets')
      const items = data.data
      const itemsRea = items.filter(rearranged => rearranged.status !== 'ACTIVE')
      
      setWallets( itemsRea )
      setSeeArchived(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la listare')
    } finally {
      setLoading(false)
    }
  } 

  async function toggleWalletView() {
    if (seeArchived) {
      await fetchList()
    } else {
      await fetchArchivedList()
    }
  }



  // CREATE WALLET
  async function handleCreateWallet(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = walletName.trim()
    //dam replace daca avem , plus verificam daca este number
    const major = parseFloat(balanceMinor.replace(',', '.'))
    if(Number.isNaN(major) || major <0) {
      setError('Va rog introduceti o suma valida(mai mare sau egal cu 0)')
      return
    }

    const balanceMinorInt = Math.round(major * 100)

    //validari
    if (trimmed.length < 4 || trimmed.length > 25) {
      setError('Numele trebuie să aibă între 4 și 25 de caractere.')
      return
    }
    const duplicate = wallets.some(w => norm(w.name) === norm(trimmed))
    if (duplicate) {
      setError('Ai deja un portofel cu acest nume.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/api/v1/wallets', { name: trimmed, balanceMinor: balanceMinorInt ,currency , status: 'ACTIVE' })
      setWalletName('')
      setbalanceMinor('')
      setCurrency('RON')
      await fetchList()
      inputRef.current?.focus()
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError('Ai deja un portofel cu acest nume.')
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la creare')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // functia set archive

  async function archiveWallet(id: number) {

  const arch = wallets.filter(r => r.id === id)
  const archW = arch[0]
  
  if(archW.status ==='ACTIVE') {
    try {
      console.log('ACTIV')
      await api.patch(`/api/v1/wallets/${id}/archive`,{id: archW.id , status: archW.status})
      await fetchList()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT ARCHIVING WALLET')
    }
  } else {
    unArchiveWallet(id)
  }}

  
  async function unArchiveWallet(id: number) {

    const arch = wallets.filter(r => r.id === id)
    const archW = arch[0]
    
    if (archW.status === 'ARCHIVED') {
      try {
        console.log('ARHIVAT')
        await api.patch(`/api/v1/wallets/${id}/unarchive`,{id: archW.id , status: archW.status})
        await fetchList()
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT ARCHIVING WALLET')
      }
    }   
  }

  // fuctia make default wallet

  async function makeDefaultWallet(id: number){

  const arch = wallets.filter(r => r.id === id)
  const checkDefault = wallets.filter(r => r.isDefault === true)
  const checkDefaultW = checkDefault[0]
  const archW = arch[0]
  
  console.log(archW)

    try {
      console.log('default')
      await api.patch(`/api/v1/wallets/${id}/default`,{id: archW.id})
      await fetchList()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'ERROR AT DEFAULTING WALLET')
    }
  }







  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 12px' }}>
      <h1 style={{ marginBottom: 12 }}>Wallets</h1>

      {/* === Create form === */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px' }}>Add wallet</h2>

        <button type="button" onClick={() => inputRef.current?.focus()} style={{ marginBottom: 8 }}>
          Add a wallet
        </button>

        <form onSubmit={handleCreateWallet}>
          <input
            ref={inputRef}
            type="text"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="Name of your wallet"
            maxLength={25}
            style={{ marginRight: 8 }}
          />
          <input
            type="text"
            value={balanceMinor}
            onChange={(e) => setbalanceMinor(e.target.value)}
            placeholder="Sum"
            style={{ marginRight: 8 }}
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyType)} style={{ marginRight: 8 }}>
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="RUB">RUB</option>
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>

        <button onClick={() =>toggleWalletView()} style={{marginRight: 8}}>SEE ARCHIVED WALLETS</button>

        {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      </section>

      {/* === List === */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
        {loading && <div>Se încarcă…</div>}

        {!loading && wallets.length === 0 && <div>NO WALLET FOUND.</div>}

        {!loading && wallets.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: 6 }}>WALLET_NAME</th>
                <th style={{ padding: 6, textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: 6, textAlign: 'right' }}>CURRENCY</th>
                <th style={{ padding: 6, textAlign: 'right' }}>DEFAULT</th>
                <th style={{ padding: 6, textAlign: 'right' }}>STATUS</th>
                <th style={{ padding: 6, textAlign: 'right' }}>archivedAt</th>
                <th style={{ padding: 6, textAlign: 'right' }}>CREATED_AT</th>
                <th style={{ padding: 6 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 6 }}>{w.name}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{Number(w.balanceMinor)/100}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{w.currency}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    <input type="checkbox" checked={w.isDefault} />
                    </td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{w.status}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    {new Date(w.archivedAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    {new Date(w.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  {
                  <td style={{ padding: 6 }}>
                  <button type="button" onClick={() => archiveWallet(w.id)}>
                    {w.status === 'ACTIVE' && <div>Archive</div>}
                    {w.status === 'ARCHIVED' && <div>Activate</div>}
                    </button>
                  </td>
                  }
                  {
                  w.status === 'ACTIVE' && <td style={{ padding: 6 }}>
                  <button type="button" onClick={() => makeDefaultWallet(w.id)}>
                    Make default
                  </button>
                  </td>      
                  }

                  {/*<td style={{ padding: 6 }}>
                    <button type="button" onClick={() => deleteWallet(w.id)}>Delete</button>
                  </td>*/}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
