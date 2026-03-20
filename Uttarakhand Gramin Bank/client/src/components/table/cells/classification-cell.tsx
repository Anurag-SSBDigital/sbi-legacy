interface ClassificationCellProps {
  npaCd: number | undefined
}

export default function ClassificationCell({ npaCd }: ClassificationCellProps) {
  if (npaCd === 1 || npaCd === 2 || npaCd === 3) return 'SMA'
  if (npaCd && npaCd >= 4) return 'NPA'
  return '—'
}
