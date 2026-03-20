import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { usePageBuilderStore, PageConfig } from '@/stores/pageBuilderStore.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'

export const Route = createFileRoute('/_authenticated/admin/page-builder')({
  component: PageBuilderForm,
})

function PageBuilderForm() {
  const deployPage = usePageBuilderStore((state) => state.deployPage)

  // Local state for the form draft
  const [draft, setDraft] = useState<PageConfig>({
    processCode: '',
    title: '',
    apiPath: '',
    identifierKey: 'acctNo',
    statsKey: 'outstand',
    columns: [{ key: '', label: '', type: 'text' }],
    dialogFields: [{ key: '', label: '' }],
  })

  const handleDeploy = () => {
    if (!draft.processCode || !draft.title || !draft.apiPath) {
      toast.error('Please fill out the basic details')
      return
    }
    deployPage(draft)
    toast.success(`${draft.title} deployed successfully!`)
    // Optionally reset form here
  }

  return (
    <div className='mx-auto max-w-3xl space-y-6 p-6'>
      <h1 className='text-3xl font-bold'>New Workflow Page Builder</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Page Basics</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-4'>
          <Input
            placeholder='Process Code (e.g., SMA)'
            value={draft.processCode}
            onChange={(e) =>
              setDraft({ ...draft, processCode: e.target.value })
            }
          />
          <Input
            placeholder='Page Title (e.g., SMA Accounts)'
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <Input
            placeholder='API Endpoint (e.g., /sma/accountlist)'
            value={draft.apiPath}
            onChange={(e) => setDraft({ ...draft, apiPath: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Table Columns</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {draft.columns.map((col, index) => (
            <div key={index} className='flex gap-2'>
              <Input
                placeholder='Data Key (e.g., custName)'
                value={col.key}
                onChange={(e) => {
                  const newCols = [...draft.columns]
                  newCols[index].key = e.target.value
                  setDraft({ ...draft, columns: newCols })
                }}
              />
              <Input
                placeholder='Column Label (e.g., Customer Name)'
                value={col.label}
                onChange={(e) => {
                  const newCols = [...draft.columns]
                  newCols[index].label = e.target.value
                  setDraft({ ...draft, columns: newCols })
                }}
              />
            </div>
          ))}
          <Button
            variant='outline'
            onClick={() =>
              setDraft({
                ...draft,
                columns: [
                  ...draft.columns,
                  { key: '', label: '', type: 'text' },
                ],
              })
            }
          >
            + Add Column
          </Button>
        </CardContent>
      </Card>

      <Button size='lg' className='w-full' onClick={handleDeploy}>
        🚀 Deploy Page
      </Button>
    </div>
  )
}
