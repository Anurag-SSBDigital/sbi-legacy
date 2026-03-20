import React, { useMemo, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Rows as RowsIcon,
  Search as SearchIcon,
} from 'lucide-react'
import { Input } from './ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export type PaginatedTableColumn<T extends object> = {
  [K in keyof T]: {
    key: K
    label: string
    sortable?: boolean
    render?: (value: T[K], row: T) => React.ReactNode
  }
}[keyof T]

export interface PaginatedTableProps<T extends object> {
  data: T[]
  readonly columns: PaginatedTableColumn<T>[]
  initialRowsPerPage?: number
  emptyMessage?: string
  renderActions?: (row: T) => React.ReactNode
  tableTitle?: string
  showSearch?: boolean
  frameless?: boolean
  tableActions?: React.ReactNode | (() => React.ReactNode)
}

// --- Animation settings ----------------------------------------------------
// A single place to tweak fade‑in/out timings so you can dial in the "feel"
// for different UIs.
const ROW_FADE_DURATION = 0.2
const ICON_FADE_DURATION = 0.15

const rowVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: ROW_FADE_DURATION, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: ROW_FADE_DURATION * 0.75, ease: 'easeIn' },
  },
} as const

const iconFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: ICON_FADE_DURATION } },
  exit: { opacity: 0, transition: { duration: ICON_FADE_DURATION } },
} as const

// ---------------------------------------------------------------------------

export default function PaginatedTable<T extends object>({
  data,
  columns,
  initialRowsPerPage = 10,
  emptyMessage = 'No data available.',
  renderActions,
  tableTitle,
  showSearch = true,
  frameless = false,
  tableActions,
}: PaginatedTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pageSize, setPageSize] = useState(initialRowsPerPage)

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map<ColumnDef<T>>((col) => ({
        accessorKey: col.key as string,
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <div className='flex items-center space-x-1'>
              <span className='truncate font-medium tracking-wide'>
                {col.label}
              </span>
              {col.sortable !== false && (
                <AnimatePresence mode='wait' initial={false}>
                  {isSorted ? (
                    <motion.span key={String(isSorted)} variants={iconFade}>
                      {isSorted === 'asc' ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </motion.span>
                  ) : (
                    <motion.span key='unsorted' variants={iconFade}>
                      <ChevronsUpDown className='text-muted-foreground/50 h-3 w-3' />
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </div>
          )
        },
        cell: ({ getValue, row }) =>
          col.render ? (
            (col.render as (value: unknown, row: T) => React.ReactNode)(
              getValue(),
              row.original
            )
          ) : (
            <span className='truncate'>
              {String(getValue() ?? '') || (
                <span className='text-muted-foreground italic'>—</span>
              )}
            </span>
          ),
        enableSorting: col.sortable !== false,
      })),
    [columns]
  )

  const table = useReactTable<T>({
    data,
    columns: columnDefs,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) =>
      JSON.stringify(row.original)
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <section
      className={
        frameless
          ? ''
          : 'bg-card space-y-6 rounded-xl border px-4 pt-5 pb-6 shadow-lg sm:px-6'
      }
    >
      {(tableTitle || showSearch || tableActions) && (
        <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          {tableTitle && (
            <div className='text-xl leading-tight font-semibold sm:text-lg'>
              {tableTitle}
            </div>
          )}
          <div className='flex w-full items-center justify-end gap-3 sm:w-auto'>
            {tableActions && (
              <div className='flex items-center gap-2'>
                {typeof tableActions === 'function'
                  ? tableActions()
                  : tableActions}
              </div>
            )}
            {showSearch && (
              <div
                className={`relative w-full sm:w-72 ${frameless ? 'pb-2' : ''}`}
              >
                <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  aria-label='Search table'
                  placeholder='Search…'
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className='focus-within:ring-primary/40 pl-9 transition-shadow focus-within:ring-2'
                />
              </div>
            )}
          </div>
        </header>
      )}

      <div className='scrollbar-thin scrollbar-thumb-muted-foreground/30 ring-border ring-opacity-5 overflow-auto rounded-lg ring-1'>
        <Table className='min-w-full text-sm'>
          <TableHeader className='bg-muted/60 supports-[backdrop-filter]:bg-muted/40 sticky top-0 z-10 backdrop-blur'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className='*[&:nth-child(even)]:bg-muted/20 select-none'
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={`px-4 py-3 font-semibold whitespace-nowrap transition-colors ${
                      header.column.getCanSort()
                        ? 'hover:bg-muted cursor-pointer'
                        : ''
                    }`}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead className='px-4 py-3 text-right'>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    variants={rowVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    layout
                    className='even:bg-muted/10 hover:bg-muted/20 [&>td]:px-4 [&>td]:py-2.5'
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className='align-middle'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell className='px-4 py-2.5 text-right align-middle'>
                        {renderActions(row.original)}
                      </TableCell>
                    )}
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  key='empty'
                  variants={rowVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                >
                  <TableCell
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className='text-muted-foreground h-32 text-center text-base'
                  >
                    {emptyMessage}
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {pageCount > 0 && (
        <footer className='flex flex-col items-center justify-between gap-4 border-t pt-4 text-sm sm:flex-row'>
          <div className='text-muted-foreground flex items-center gap-2'>
            <RowsIcon className='h-4 w-4' />
            <span>Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                table.setPageSize(Number(v))
              }}
            >
              <SelectTrigger className='h-8 w-20'>
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pageCount > 1 && (
            <Pagination>
              <PaginationContent className='gap-1'>
                <PaginationItem>
                  <PaginationPrevious
                    aria-label='Previous page'
                    onClick={() => table.previousPage()}
                    className={
                      !table.getCanPreviousPage()
                        ? 'pointer-events-none opacity-50'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  />
                </PaginationItem>
                {getPaginationRange(currentPage + 1, pageCount).map(
                  (item, i) => (
                    <PaginationItem key={i}>
                      {item === 'dots' ? (
                        <span className='px-2'>…</span>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          aria-current={
                            item - 1 === currentPage ? 'page' : undefined
                          }
                          onClick={() => table.setPageIndex(item - 1)}
                          className={`rounded-md px-3 py-1 font-medium transition-colors ${
                            item - 1 === currentPage
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {item}
                        </motion.button>
                      )}
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    aria-label='Next page'
                    onClick={() => table.nextPage()}
                    className={
                      !table.getCanNextPage()
                        ? 'pointer-events-none opacity-50'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </footer>
      )}
    </section>
  )
}

function getPaginationRange(
  current: number,
  total: number,
  siblings = 1
): (number | 'dots')[] {
  const range: (number | 'dots')[] = []
  const totalNumbers = siblings * 2 + 3
  const totalBlocks = totalNumbers + 2

  if (total <= totalBlocks) {
    for (let i = 1; i <= total; i++) range.push(i)
    return range
  }

  const leftSibling = Math.max(current - siblings, 1)
  const rightSibling = Math.min(current + siblings, total)
  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < total - 1

  range.push(1)
  if (showLeftDots) range.push('dots')
  for (let i = leftSibling; i <= rightSibling; i++) range.push(i)
  if (showRightDots) range.push('dots')
  if (range[range.length - 1] !== total) range.push(total)

  return [...new Set(range)]
}
