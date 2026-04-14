/**
 * PO # = 3 letters (company) + batch 01–99 + MM + YY + 4-digit line index
 * Example: XYZ0104260001
 */
export function companyPrefixLetters(companyName: string): string {
  const decomposed = companyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const lettersOnly = decomposed.replace(/[^a-zA-Z]/g, '').toUpperCase()
  const padded = (lettersOnly + 'XXX').slice(0, 3)
  return padded
}

export function randomPurchaseBatch(): string {
  const n = Math.floor(Math.random() * 99) + 1
  return String(n).padStart(2, '0')
}

export function buildPoNumber(
  companyPrefix: string,
  batch: string,
  purchaseDate: Date,
  lineIndex: number
): string {
  const mm = String(purchaseDate.getMonth() + 1).padStart(2, '0')
  const yy = String(purchaseDate.getFullYear()).slice(-2)
  const seq = String(lineIndex).padStart(4, '0')
  return `${companyPrefix}${batch}${mm}${yy}${seq}`
}
