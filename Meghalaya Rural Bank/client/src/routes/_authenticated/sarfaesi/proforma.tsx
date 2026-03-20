import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import SarfaesiProformaForm from '@/features/sarfaesi/SarfaesiProforma.tsx'

export const Route = createFileRoute('/_authenticated/sarfaesi/proforma')({
  component: RouteComponent,
  validateSearch: z.object({ acctNo: z.string() }).parse,
})

function RouteComponent() {
  const { acctNo } = Route.useSearch()

  return (
    <MainWrapper>
      <SarfaesiProformaForm acctNo={acctNo} />
    </MainWrapper>
  )
}
