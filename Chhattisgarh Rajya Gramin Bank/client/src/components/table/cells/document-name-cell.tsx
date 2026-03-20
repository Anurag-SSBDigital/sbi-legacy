interface DocumentNameCellProps {
  docs: unknown
}

export default function DocumentNameCell({ docs }: DocumentNameCellProps) {
  return Array.isArray(docs) && docs.length
    ? docs.map((d, i) => (
        <span key={i} className='block truncate'>
          {d}
        </span>
      ))
    : '—'
}
