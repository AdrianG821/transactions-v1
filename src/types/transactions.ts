export type Currency = 'RON' | 'EUR' | 'GBP' | 'RUB'
export type TxType = 'INCOME' | 'EXPENSE' | 'DEDUCTABLE'

export type Transaction = {
  id: number
  userId: number
  walletId: number
  amountMinor: number
  currency: Currency
  type: TxType
  description: string | null
  date: string             // vine ISO din backend
  createdAt: string
  updatedAt: string
}

export type TransactionsList = {
  data: Transaction[]
  page: number
  limit: number
  total: number
}
