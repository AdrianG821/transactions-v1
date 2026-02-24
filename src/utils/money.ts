export function toMinor(major: string | number) {
  // "12.34" -> 1234 ; tratează virgule și puncte
  const n = typeof major === 'number' ? major.toString() : major
  const cleaned = n.replace(',', '.').trim()
  const value = Math.round(parseFloat(cleaned) * 100)
  if (Number.isNaN(value)) throw new Error('Suma invalidă')
  return value
}

export function formatMoney(minor: number, currency: string) {
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency }).format(minor / 100)
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ro-RO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
