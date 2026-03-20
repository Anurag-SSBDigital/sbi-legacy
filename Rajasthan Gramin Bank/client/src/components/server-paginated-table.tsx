import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
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

export interface PaginatedTableColumns<T extends object> {
  key: keyof T
  label: string
  sortable?: boolean
  /** If server field for sort differs from key */
  sortKey?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export type ServerTableQuery = {
  page: number
  pageSize: number
  q?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface ServerPaginatedTableProps<T extends object> {
  /** Rendered rows from the server (React Query result) */
  rows: T[]
  /** Total rows available on the server */
  total: number
  /** UI schema */
  readonly columns: PaginatedTableColumns<T>[]
  /** Loading & error from React Query */
  loading?: boolean
  error?: string | null

  /** Initial UI state */
  initialRowsPerPage?: number
  emptyMessage?: string
  renderActions?: (row: T) => React.ReactNode
  tableTitle?: string
  showSearch?: boolean
  frameless?: boolean
  tableActions?: React.ReactNode | (() => React.ReactNode)
  extraHeaderRows?: React.ReactNode[] // New prop for extra header rows

  /**
   * Called whenever UI state that affects the query changes.
   * You’ll use this to set React Query params.
   */
  onQueryChange?: (q: ServerTableQuery) => void

  /** Optional externally-controlled query (to keep table fully controlled) */
  controlledQuery?: Partial<ServerTableQuery>
  /** Debounce search text (ms). Set 0 to disable. */
  searchDebounceMs?: number
}

// ---- tiny debounce helper
function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    if (!delay) {
      setDebounced(value)
      return
    }
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function shallowEqual(
  a?: Record<string, unknown>,
  b?: Record<string, unknown>
) {
  if (a === b) return true
  if (!a || !b) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (a[k] !== b[k]) return false
  }
  return true
}

// --- animation settings (same “feel” you had)
const ROW_FADE_DURATION = 0.2
const ICON_FADE_DURATION = 0.15
const rowVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: ROW_FADE_DURATION, ease: 'easeOut' },
  },
  exit: { opacity: 0 },
} as const
const iconFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: ICON_FADE_DURATION } },
  exit: { opacity: 0, transition: { duration: ICON_FADE_DURATION } },
} as const

export default function ServerPaginatedTable<T extends object>({
  rows,
  total,
  columns,
  loading,
  error,
  initialRowsPerPage = 10,
  emptyMessage = 'No data available.',
  renderActions,
  tableTitle,
  showSearch = true,
  frameless = false,
  tableActions,
  onQueryChange,
  controlledQuery,
  extraHeaderRows,
  searchDebounceMs = 400,
}: ServerPaginatedTableProps<T>) {
  // Local UI state (can be overridden by controlledQuery)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pageSize, setPageSize] = useState(initialRowsPerPage)
  const [pageIndex, setPageIndex] = useState(0)

  // Controlled overrides (optional)
  useEffect(() => {
    if (!controlledQuery) return
    if (controlledQuery.pageSize && controlledQuery.pageSize !== pageSize) {
      setPageSize(controlledQuery.pageSize)
    }
    if (
      typeof controlledQuery.page === 'number' &&
      controlledQuery.page - 1 !== pageIndex
    ) {
      setPageIndex(Math.max(0, (controlledQuery.page ?? 1) - 1))
    }
    if (
      typeof controlledQuery.q === 'string' &&
      controlledQuery.q !== globalFilter
    ) {
      setGlobalFilter(controlledQuery.q)
    }
    if (controlledQuery.sortBy) {
      const dir = controlledQuery.sortDir ?? 'asc'
      setSorting([{ id: controlledQuery.sortBy, desc: dir === 'desc' }])
    }
  }, [controlledQuery])

  const debouncedFilter = useDebounced(globalFilter, searchDebounceMs)

  const lastEmittedRef = useRef<ServerTableQuery | undefined>(undefined)

  // Emit changes to parent (React Query params)
  useEffect(() => {
    const activeSort = sorting[0]
    const sortId = activeSort?.id
    const mappedSortKey = sortId
      ? columns.find((c) => String(c.key) === sortId)?.sortKey || sortId
      : undefined

    const next: ServerTableQuery = {
      page: pageIndex + 1,
      pageSize,
      q: debouncedFilter?.trim() || undefined,
      sortBy: mappedSortKey,
      sortDir: activeSort?.desc ? 'desc' : 'asc',
    }

    if (!shallowEqual(lastEmittedRef.current, next)) {
      lastEmittedRef.current = next
      onQueryChange?.(next)
    }
  }, [pageIndex, pageSize, debouncedFilter, sorting, columns, onQueryChange])

  const columnDefs = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map<ColumnDef<T>>((col) => ({
        accessorKey: col.key as string,
        id: col.key as string,
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
            col.render(getValue() as T[keyof T], row.original)
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

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const table = useReactTable<T>({
    data: rows,
    columns: columnDefs,
    state: { sorting, globalFilter, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    onGlobalFilterChange: (v) => {
      setPageIndex(0) // reset to first page when search changes
      setGlobalFilter(String(v))
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  })

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
                  onChange={(e) => table.setGlobalFilter(e.target.value)}
                  className='focus-within:ring-primary/40 pl-9 transition-shadow focus-within:ring-2'
                />
              </div>
            )}
          </div>
        </header>
      )}

      <div className='scrollbar-thin scrollbar-thumb-muted-foreground/30 ring-border ring-opacity-5 overflow-auto rounded-lg ring-1'>
        <Table className='min-w-full text-sm' aria-busy={loading}>
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
                    className={`px-4 py-3 font-semibold whitespace-nowrap transition-colors ${header.column.getCanSort() ? 'hover:bg-muted cursor-pointer' : ''}`}
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
            {extraHeaderRows && extraHeaderRows.length > 0 && (
              <TableRow>
                {extraHeaderRows.map((row, index) => (
                  <TableHead
                    key={index}
                    className='text-muted-foreground text-sm'
                  >
                    {row}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>

          <TableBody>
            <AnimatePresence initial={false}>
              {error ? (
                <motion.tr
                  key='error'
                  variants={rowVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                >
                  <TableCell
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className='h-32 text-center text-red-600'
                  >
                    {error}
                  </TableCell>
                </motion.tr>
              ) : loading && rows.length === 0 ? (
                Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
                  <motion.tr
                    key={`sk-${i}`}
                    variants={rowVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    className='even:bg-muted/10 [&>td]:px-4 [&>td]:py-2.5'
                  >
                    <TableCell
                      colSpan={columns.length + (renderActions ? 1 : 0)}
                    >
                      <div className='bg-muted h-4 w-1/2 animate-pulse rounded' />
                    </TableCell>
                  </motion.tr>
                ))
              ) : rows.length ? (
                rows.map((row, idx) => (
                  <motion.tr
                    key={idx}
                    variants={rowVariants}
                    initial='initial'
                    animate='animate'
                    exit='exit'
                    layout
                    className='even:bg-muted/10 hover:bg-muted/20 [&>td]:px-4 [&>td]:py-2.5'
                  >
                    {table
                      .getAllColumns()
                      .filter((c) => c.getIsVisible())
                      .map((col) => {
                        const accessor = col.id as keyof T
                        const value = row[accessor]
                        const cfg = columns.find((c) => c.key === accessor)!
                        return (
                          <TableCell
                            key={String(accessor)}
                            className='align-middle'
                          >
                            {cfg.render ? (
                              cfg.render(value, row)
                            ) : (
                              <span className='truncate'>
                                {String(value ?? '') || (
                                  <span className='text-muted-foreground italic'>
                                    —
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        )
                      })}
                    {renderActions && (
                      <TableCell className='px-4 py-2.5 text-right align-middle'>
                        {renderActions(row)}
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
                const size = Number(v)
                setPageIndex(0)
                // Update both local and table state
                setPageSize(size)
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
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    className={
                      pageIndex <= 0
                        ? 'pointer-events-none opacity-50'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  />
                </PaginationItem>

                {getPaginationRange(pageIndex + 1, pageCount).map((item, i) => (
                  <PaginationItem key={i}>
                    {item === 'dots' ? (
                      <span className='px-2'>…</span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        aria-current={
                          item - 1 === pageIndex ? 'page' : undefined
                        }
                        onClick={() => setPageIndex(item - 1)}
                        className={`rounded-md px-3 py-1 font-medium transition-colors ${
                          item - 1 === pageIndex
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {item}
                      </motion.button>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    aria-label='Next page'
                    onClick={() =>
                      setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                    }
                    className={
                      pageIndex >= pageCount - 1
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
