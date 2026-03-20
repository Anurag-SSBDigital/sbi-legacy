import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { paths } from '@/types/api/v1'
import { Eye } from 'lucide-react'
import LoadingBar from 'react-top-loading-bar'
import { $api } from '@/lib/api.ts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import MainWrapper from '@/components/ui/main-wrapper.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import PaginatedTable, {
  PaginatedTableColumn,
} from '@/components/paginated-table.tsx'

export const Route = createFileRoute('/_authenticated/alerts/dmr')({
  component: RouteComponent,
})

type Accounts = paths['/pacs/all']['get']['responses']['200']['content']['*/*']

function RouteComponent() {
  const [filteredAccounts, setFilteredAccounts] = useState<Accounts>([])
  const [pacsName, setPacsName] = useState<string | null>(null)

  const [selectedAccount, setSelectedAccount] = useState<Accounts[0] | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState('')

  const { data: accounts = [], isLoading: loadingAccounts } = $api.useQuery(
    'get',
    '/pacs/all',
    {}
  )
  const isLoading = loadingAccounts
  const accountNames = Array.from(new Set(accounts.map((acc) => acc.pacsName)))

  // const formatCurrency = (amount: string | undefined) => {
  //   const num = parseFloat(amount || "0");
  //   return new Intl.NumberFormat("en-IN", {
  //     style: "currency",
  //     currency: "INR",
  //   }).format(num);
  // };
  const accountsColumns: PaginatedTableColumn<Accounts[0]>[] = [
    { key: 'memberAccountName', label: 'Member Name' },
    { key: 'memberAccountNo', label: 'Account Number' },
    { key: 'memberOutstanding', label: 'Outstanding' },
    { key: 'memberDueDate', label: 'Due Date' },
    {
      key: 'memberAccountName',
      label: 'Action',
      render: (_, row) => (
        <>
          <Button
            variant='link'
            onClick={() => {
              setSelectedAccount(row ?? null)
              setDialogOpen('view')
            }}
          >
            <Eye size={18} aria-hidden='true' />
          </Button>
          <Button
            variant='link'
            onClick={() => {
              setSelectedAccount(row ?? null)
              setDialogOpen('inspection')
            }}
          >
            Inspection
          </Button>
        </>
      ),
    },
  ]

  const handlePacsClick = (value: string) => {
    setPacsName(value)
    if (value) {
      const filtered = accounts.filter((acc) => acc.pacsName === value)

      setFilteredAccounts(filtered)

      // const alertsGenerated = generateAlerts(filtered)
      // setAlerts(alertsGenerated)
    } else {
      setFilteredAccounts([])
      // setAlerts([])
    }
  }

  return (
    <MainWrapper>
      {isLoading && (
        <LoadingBar progress={70} className='h-1' color='#2563eb' />
      )}

      <div className='mb-6'>
        <h1 className='text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>
          DMR Accounts
        </h1>
        {/* <h1 className='text-lg text-gray-600 dark:text-gray-400'>
          Monitor and manage mule accounts effectively.
        </h1> */}
      </div>

      <Select onValueChange={handlePacsClick}>
        <SelectTrigger className='my-4 w-full max-w-xl'>
          <SelectValue placeholder='Select PACS Name' />
        </SelectTrigger>
        <SelectContent>
          {accountNames
            .filter((name) => name != undefined)
            .map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {pacsName && (
        <div className='mb-4'>
          <h2 className='my-4 text-lg font-semibold'>
            Accounts for PACS: {pacsName}
          </h2>
          <PaginatedTable
            data={filteredAccounts}
            columns={accountsColumns}
            emptyMessage='No mule scores to display at the moment.'
          />
        </div>
      )}
      <Dialog
        open={dialogOpen === 'view'}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null)
          setDialogOpen(open ? 'view' : '')
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Details for Account: {selectedAccount?.memberAccountName || ''}
            </DialogTitle>
          </DialogHeader>
          <div className='grid grid-cols-1 gap-4 border-t border-gray-200 p-2 text-sm text-gray-700 md:grid-cols-2'>
            {Object.entries(selectedAccount || {}).map(([key, value]) => (
              <p key={key} className='break-words'>
                <strong className='text-gray-900'>
                  {key
                    .replace(/([A-Z])/g, ' $1') // add space before capital letters
                    .replace(/^./, (str) => str.toUpperCase())}
                  :
                </strong>{' '}
                {value || '-'}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialogOpen === 'inspection'}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null)
          setDialogOpen(open ? 'inspection' : '')
        }}
      >
        <DialogContent className='max-h-[90vh] max-w-4xl min-w-[75vw] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Inspection for {selectedAccount?.memberAccountName || ''}
            </DialogTitle>
          </DialogHeader>

          <div className='mt-6'>
            <Textarea
              placeholder='Enter inspection notes here...'
              className='w-full'
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen('')
                alert(
                  'Inspection submitted successfully for ' +
                    selectedAccount?.memberAccountName
                )
              }}
            >
              Submit Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainWrapper>
  )
}
