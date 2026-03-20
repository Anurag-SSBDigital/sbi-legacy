import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Crumb, CurrentPage } from './types.ts'

type BreadcrumbProps = React.ComponentProps<typeof Breadcrumb>

export interface AppBreadcrumbProps extends BreadcrumbProps {
  crumbs: Crumb[]
  currentPage: CurrentPage
}

export function AppBreadcrumb({
  crumbs,
  currentPage,
  ...props
}: AppBreadcrumbProps) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {crumb.type === 'link' ? (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    from={(crumb.item.from as '/') ?? ''}
                    to={crumb.item.to}
                    className='hover:underline'
                  >
                    {crumb.item.label}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className='flex items-center gap-1 focus:outline-none'
                    aria-label={`Expand ${crumb.label} options`}
                  >
                    {crumb.label}
                    <ChevronDownIcon className='h-4 w-4' />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    {crumb.items.map((item, itemIndex) => (
                      <DropdownMenuItem key={itemIndex} asChild>
                        <Link
                          from={(item.from as '/') ?? ''}
                          to={item.to}
                          className={`w-full ${crumb.selectedIndex === itemIndex ? 'font-bold' : ''}`}
                        >
                          {item.label}
                          {crumb.selectedIndex === itemIndex && (
                            <span className='ml-2'>✓</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            )}
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        {currentPage.type === 'label' ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage.label}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className='flex items-center gap-1 focus:outline-none'
                aria-label='Expand current page options'
              >
                {currentPage.items[currentPage.selectedIndex].label}
                <ChevronDownIcon className='h-4 w-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                {currentPage.items.map((item, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link
                      from={(item.from as '/') ?? ''}
                      to={item.to}
                      className={`w-full ${currentPage.selectedIndex === index ? 'font-bold' : ''}`}
                    >
                      {item.label}
                      {currentPage.selectedIndex === index && (
                        <span className='ml-2'>✓</span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
