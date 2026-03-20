/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Link2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { toastError } from '@/lib/utils'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  createEwsV2QuestionMaster,
  deleteEwsV2QuestionMaster,
  listEwsV2QuestionMasters,
  updateEwsV2QuestionMaster,
  type EwsV2QuestionMaster,
  type EwsV2QuestionMasterRequest,
  type EwsV2QuestionMasterSource,
} from '@/features/alerts-v2/ews-v2-rule-api'

export const Route = createFileRoute(
  '/_authenticated/admin/alerts-v2-question-masters'
)({
  component: RouteComponent,
})

const SOURCE_OPTIONS: Array<{
  value: EwsV2QuestionMasterSource
  label: string
}> = [
  { value: 'STOCK_AUDIT', label: 'Stock Audit Questions' },
  { value: 'MSME_INSPECTION', label: 'MSME Inspection Questions' },
]

type QuestionFormState = {
  questionNo: string
  questionText: string
  active: boolean
  ewsAlert: string
}

const emptyForm = (): QuestionFormState => ({
  questionNo: '',
  questionText: '',
  active: true,
  ewsAlert: '',
})

const parsePositiveInt = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }
  return Math.trunc(parsed)
}

const formFromRow = (row: EwsV2QuestionMaster): QuestionFormState => ({
  questionNo: String(row.questionNo ?? ''),
  questionText: row.questionText ?? '',
  active: Boolean(row.active),
  ewsAlert: row.ewsAlert ?? '',
})

function RouteComponent() {
  const canView = useCanAccess('ews_alert', 'view')
  const canCreate = useCanAccess('ews_alert', 'create')
  const canUpdate = useCanAccess('ews_alert', 'update')

  const [source, setSource] = useState<EwsV2QuestionMasterSource>('STOCK_AUDIT')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [search, setSearch] = useState('')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [editingQuestion, setEditingQuestion] =
    useState<EwsV2QuestionMaster | null>(null)
  const [form, setForm] = useState<QuestionFormState>(emptyForm())

  const [linksOpen, setLinksOpen] = useState(false)
  const [linksQuestion, setLinksQuestion] =
    useState<EwsV2QuestionMaster | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<EwsV2QuestionMaster | null>(
    null
  )
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const questionsQuery = useQuery({
    queryKey: ['ews-v2-question-masters', source, includeInactive],
    queryFn: () => listEwsV2QuestionMasters(source, includeInactive),
    enabled: canView,
  })

  const filteredRows = useMemo(() => {
    const rows = questionsQuery.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) => {
      const linkText = (row.linkedAlerts ?? [])
        .map((item) => `${item.label ?? ''} ${item.description ?? ''}`)
        .join(' ')
      const haystack = [
        row.questionNo,
        row.questionText,
        row.ewsAlert,
        linkText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [questionsQuery.data, search])

  const openCreateDialog = () => {
    setEditorMode('create')
    setEditingQuestion(null)
    setForm(emptyForm())
    setEditorOpen(true)
  }

  const openEditDialog = (row: EwsV2QuestionMaster) => {
    setEditorMode('edit')
    setEditingQuestion(row)
    setForm(formFromRow(row))
    setEditorOpen(true)
  }

  const buildPayload = (): EwsV2QuestionMasterRequest => {
    const payload: EwsV2QuestionMasterRequest = {
      source,
      active: form.active,
      questionText: form.questionText.trim(),
    }
    const questionNo = parsePositiveInt(form.questionNo)
    if (questionNo) {
      payload.questionNo = questionNo
    }
    if (source === 'MSME_INSPECTION') {
      payload.ewsAlert = form.ewsAlert.trim() || undefined
    }
    return payload
  }

  const createMutation = useMutation({
    mutationFn: async () => createEwsV2QuestionMaster(buildPayload()),
    onSuccess: async () => {
      toast.success('Question created.')
      setEditorOpen(false)
      setForm(emptyForm())
      await questionsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not create question.'),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuestion) throw new Error('Select a question first.')
      return updateEwsV2QuestionMaster(
        source,
        editingQuestion.id,
        buildPayload()
      )
    },
    onSuccess: async () => {
      toast.success('Question updated.')
      setEditorOpen(false)
      await questionsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not update question.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) throw new Error('Select a question first.')
      return deleteEwsV2QuestionMaster(source, deleteTarget.id)
    },
    onSuccess: async () => {
      toast.success('Question deleted.')
      setDeleteTarget(null)
      setDeleteConfirmText('')
      await questionsQuery.refetch()
    },
    onError: (error) => toastError(error, 'Could not delete question.'),
  })

  if (!canView) {
    return (
      <div className='container mx-auto space-y-4 p-4 md:p-6'>
        <Card>
          <CardHeader>
            <CardTitle>Question Masters</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto space-y-4 p-4 md:p-6'>
      <Card>
        <CardHeader className='space-y-3'>
          <CardTitle>Question Masters</CardTitle>
          <CardDescription>
            Manage source questionnaires and see exactly which V2 rules use each
            question. Linked questions cannot be deleted.
          </CardDescription>
          <div className='grid gap-3 md:grid-cols-4'>
            <div className='space-y-1'>
              <Label>Source</Label>
              <Select
                value={source}
                onValueChange={(value) =>
                  setSource(value as EwsV2QuestionMasterSource)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Search</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Question number, text, or linked alert'
              />
            </div>
            <div className='flex items-end gap-2'>
              <Switch
                id='include-inactive'
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <Label htmlFor='include-inactive'>Include inactive</Label>
            </div>
            <div className='flex items-end justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => questionsQuery.refetch()}
                disabled={questionsQuery.isFetching}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
              {canCreate ? (
                <Button onClick={openCreateDialog}>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Question
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className='pt-6'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question No</TableHead>
                <TableHead>Question</TableHead>
                {source === 'MSME_INSPECTION' ? (
                  <TableHead>Note</TableHead>
                ) : null}
                <TableHead>Status</TableHead>
                <TableHead>Linked</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={source === 'MSME_INSPECTION' ? 6 : 5}>
                    Loading questions...
                  </TableCell>
                </TableRow>
              ) : null}

              {!questionsQuery.isLoading && filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={source === 'MSME_INSPECTION' ? 6 : 5}>
                    No questions found.
                  </TableCell>
                </TableRow>
              ) : null}

              {filteredRows.map((row) => {
                const links = row.linkedAlerts ?? []
                const isLinked = Boolean(row.linked) || links.length > 0
                return (
                  <TableRow key={`${row.source}-${row.id}`}>
                    <TableCell>Q{row.questionNo}</TableCell>
                    <TableCell className='max-w-[36rem] break-words whitespace-normal'>
                      {row.questionText}
                    </TableCell>
                    {source === 'MSME_INSPECTION' ? (
                      <TableCell className='max-w-[20rem] break-words whitespace-normal'>
                        {row.ewsAlert ? (
                          <div className='text-muted-foreground text-xs'>
                            {row.ewsAlert}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>No note</span>
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      {row.active ? (
                        <Badge variant='default'>Active</Badge>
                      ) : (
                        <Badge variant='secondary'>Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isLinked ? (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => {
                            setLinksQuestion(row)
                            setLinksOpen(true)
                          }}
                        >
                          <Link2 className='mr-2 h-4 w-4' />
                          {links.length} link{links.length === 1 ? '' : 's'}
                        </Button>
                      ) : (
                        <Badge variant='secondary'>No links</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='inline-flex items-center gap-2'>
                        {canUpdate ? (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => openEditDialog(row)}
                          >
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit
                          </Button>
                        ) : null}
                        {canUpdate ? (
                          <Button
                            size='sm'
                            variant='destructive'
                            disabled={isLinked}
                            onClick={() => {
                              setDeleteTarget(row)
                              setDeleteConfirmText('')
                            }}
                            title={
                              isLinked
                                ? 'Delete is blocked while question is linked.'
                                : undefined
                            }
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editorMode === 'create' ? 'Create Question' : 'Edit Question'}
            </DialogTitle>
            <DialogDescription>
              {source === 'STOCK_AUDIT'
                ? 'Manage stock audit questionnaire entries.'
                : 'Manage MSME inspection questionnaire entries.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-1'>
            <div className='grid gap-2 md:grid-cols-2'>
              <div className='space-y-1'>
                <Label>Question Number</Label>
                <Input
                  type='number'
                  min={1}
                  value={form.questionNo}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      questionNo: event.target.value,
                    }))
                  }
                  placeholder='e.g. 12'
                />
              </div>
              <div className='space-y-1'>
                <Label>Active</Label>
                <div className='flex h-10 items-center gap-3 rounded-md border px-3'>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, active: checked }))
                    }
                  />
                  <span className='text-sm'>{form.active ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Question Text</Label>
              <Textarea
                value={form.questionText}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    questionText: event.target.value,
                  }))
                }
                placeholder='Write the full question text'
                rows={4}
              />
            </div>
            {source === 'MSME_INSPECTION' ? (
              <div className='space-y-1'>
                <Label>Note</Label>
                <Input
                  value={form.ewsAlert}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ewsAlert: event.target.value,
                    }))
                  }
                  placeholder='Optional internal note'
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditorOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editorMode === 'create'
                  ? createMutation.mutate()
                  : updateMutation.mutate()
              }
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editorMode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linksOpen} onOpenChange={setLinksOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              Links for Q{linksQuestion?.questionNo ?? ''}
            </DialogTitle>
            <DialogDescription>
              These links block delete until removed.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='max-h-[60vh] rounded-md border'>
            <div className='space-y-3 p-3'>
              {(linksQuestion?.linkedAlerts ?? []).length === 0 ? (
                <p className='text-muted-foreground text-sm'>No links found.</p>
              ) : (
                (linksQuestion?.linkedAlerts ?? []).map((link, index) => (
                  <div
                    key={`${link.linkType ?? 'link'}-${link.referenceId ?? index}`}
                    className='rounded-md border p-3'
                  >
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant='outline'>{link.linkType || 'LINK'}</Badge>
                      {link.active === false ? (
                        <Badge variant='secondary'>Inactive</Badge>
                      ) : null}
                    </div>
                    <div className='mt-2 text-sm font-medium'>
                      {link.label || link.referenceId || '-'}
                    </div>
                    {link.description ? (
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {link.description}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteConfirmText('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Type{' '}
              <b>
                {deleteTarget
                  ? `Q${deleteTarget.questionNo}`
                  : 'question number'}
              </b>{' '}
              to confirm delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            placeholder={
              deleteTarget ? `Q${deleteTarget.questionNo}` : 'Q<number>'
            }
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteMutation.isPending ||
                deleteConfirmText.trim().toUpperCase() !==
                  (deleteTarget ? `Q${deleteTarget.questionNo}` : '')
              }
              onClick={(event) => {
                event.preventDefault()
                deleteMutation.mutate()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
