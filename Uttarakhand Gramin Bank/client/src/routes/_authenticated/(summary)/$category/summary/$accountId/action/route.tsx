import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { capitalizeFirstWord } from '@/lib/utils.ts'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs.ts'

export const Route = createFileRoute(
  '/_authenticated/(summary)/$category/summary/$accountId/action'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const x = useMatches()

  const pathSegments = x[x.length - 1].fullPath.split('/')

  const action = capitalizeFirstWord(pathSegments[pathSegments.length - 1])

  const { category, accountId } = Route.useParams()

  return (
    <MainWrapper>
      <AppBreadcrumb
        crumbs={[
          Home,
          {
            label: 'Summary',
            type: 'dropdown',
            selectedIndex:
              category === 'standard' ? 0 : category === 'npa' ? 2 : 1,
            items: [
              { label: 'Standard', to: '/standard/summary' },
              { label: 'SMA', to: '/sma/summary' },
              { label: 'NPA', to: '/npa/summary' },
            ],
          },
          {
            type: 'link',
            item: { label: accountId, to: `/${category}/summary/${accountId}` },
          },
        ]}
        currentPage={{ type: 'label', label: action }}
      />
      <div className='pt-4'>
        <Outlet />
      </div>
    </MainWrapper>
  )
}
