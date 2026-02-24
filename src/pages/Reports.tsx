
import { useState, useEffect, useMemo } from "react"
import  api  from '../api/axios'

type Currency = 'RON' | 'EUR' | 'GBP' | 'RUB'
type TxType = 'INCOME' | 'EXPENSE' | 'DEDUCTABLE'
type KindTransfer = 'NORMAL' | 'OPENING' | 'TRANSFER' | 'ADJUSTMENT'

type Transaction = {
  id: number
  userId: number
  wallet: string
  destWalletId: string
  sourceWalletId: string
  amountMinor: number
  walletId: string
  type: TxType
  kind: KindTransfer
  currency: Currency
  description: string | null
  date: string
  createdAt: string
  updatedAt: string
}

type ListResponse = {
  data: Transaction[]
  page: number
  limit: number
  total: number
  tamount: number
  reports: ReportsType[]
}

type ReportsType = {
  incomeReports: string
  total: number
  totalT: number
}


type groupedWallets = { 
  walletId: number,
  totalAmount: number,
  wallet: { id: number; name: string; currency: Currency; status: string } | null
}

type WalletResponse = {
  incomeAndExpense: [{tamount:  number, total: number}]
  expenseTransactions: [{ type: string , tamount: number , total: number}]
  incomeTransactions: [{ type: string , tamount: number , total: number }]
  groupedWallets: groupedWallets[]
}

function formatMoney(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(minor / 100)
  } catch {
    // fallback simplu
    return `${(minor / 100).toFixed(2)} ${currency}`
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function Reports() {

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [items, setItems] = useState<groupedWallets[]>([])

    
    //toate tranzactiile
    const [totalAmount, setTotalAmount] = useState<number>(0)
    const [total, setTotal] = useState(0)

    //tranzactiile income
    const [incomeTotalAmount, setIncomeTotalAmount] = useState<number>(0)
    const [incomeTotal, setIncomeTotal] = useState(0)

    //tranzactiile expense
    const [expenseTotalAmount, setExpenseTotalAmount] = useState<number>(0)
    const [expenseTotal, setExpenseTotal] = useState(0)

    // //tranzactiile wallet 
    const [walletTotalAmount, setWalletTotalAmount] = useState<number>(0)
    const [walletTotal, setWalletTotal] = useState(0)

    //     //tranzactiile expense unde 
    // const [expenseTotalAmount, setExpenseTotalAmount] = useState<number>(0)
    // const [expenseTotal, setExpenseTotal] = useState(0)

  //aducem toate tranzactiile / totalul
    async function fetchList() {
        setLoading(true)
        setError(null)
        try {
        const { data } = await api.get<WalletResponse>('/api/v1/reports')
        const totalRolled = data.incomeAndExpense
        const itemsIncome = data.incomeTransactions
        const itemsExpense = data.expenseTransactions



        setTotalAmount(totalRolled[0].tamount)
        setTotal(totalRolled[0].total)

        setIncomeTotalAmount(itemsIncome[0].tamount)
        setIncomeTotal(itemsIncome[0].total)

        setExpenseTotalAmount(itemsExpense[0].tamount)
        setExpenseTotal(itemsExpense[0].total)
        
        const groWallets = data.groupedWallets

        setItems(data.groupedWallets)
        console.log(data.groupedWallets)
        // console.log(itemsExpense)
        } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Eroare la listare')
        } finally {
        setLoading(false)
        }
    }


    useEffect(() => {
        fetchList()
    },[])  


    return (


        <div>
            <h1>Total: TOTAL {totalAmount ? (totalAmount/100).toFixed(2) : '0.00'}    Total transactions:{total}</h1>
            <h1>Total: TOTAL INCOME {incomeTotalAmount ? (incomeTotalAmount/100).toFixed(2) : '0.00'}    Total transactions: {incomeTotal}</h1>
            <h1>Total: TOTAL EXPENSE {expenseTotalAmount ? (expenseTotalAmount/100).toFixed(2) : '0.00'}    Total transactions: {expenseTotal}</h1>
            {loading ? (
              <div>Reloading</div>
            ) : items.length === 0 ? (
            <div>No reports on the wallets</div>
          ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                {items.map((tx) => (
                  <tr key={12} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: 6 }}>{tx.walletId}</td>
                  <td style={{ padding: 6 }}>{tx.wallet?.name}</td>
                  <td style={{ padding: 6 }}>{tx.wallet?.status}</td>
                  <td style={{ padding: 6 }}>{(tx.totalAmount/100).toFixed(2)}</td>
                  <td style={{ padding: 6 }}>{tx.wallet?.currency}</td>
                  </tr>
                ))}
                 </tbody>
              </table>
            )}
        <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
                

                {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
                
            </section>
            </div>
    )
}