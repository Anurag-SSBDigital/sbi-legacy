import { resolveApiUrl } from '@/lib/url'
interface ReportCellProps {
  url: string | undefined
}

export default function ReportCell({ url }: ReportCellProps) {
  const reportUrl = resolveApiUrl(url)
  return reportUrl ? (
    <a
      href={reportUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='text-primary underline'
    >
      View
    </a>
  ) : (
    '—'
  )
}
