export type CatergoryType = 'standard' | 'sma' | 'npa'

export const iracToCategory = (irca: number): CatergoryType => {
  if (irca === 0) return 'standard'
  if (irca > 0 && irca <= 3) return 'sma'
  return 'npa'
}
