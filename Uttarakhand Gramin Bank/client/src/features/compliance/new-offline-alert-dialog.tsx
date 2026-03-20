/* ------------------------------------------------------------------ */
/* components/offline-alert/new-offline-alert-dialog.tsx              */
/* ------------------------------------------------------------------ */
// Icons from lucide-react
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
// Assuming this is your API client
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

/* --------------------------- props -------------------------------- */
interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  accountId: string
}

/* ------------------------ question list --------------------------- */
const QUESTIONS = [
  // ... (question list remains unchanged)
  'Raid by Income tax/sales tax/central excise duty officials',
  'Frequent change in the scope of the project to be undertaken by the borrower',
  'Underinsured or overinsured inventory',
  'Invoices devoid of TAN and other details',
  'Dispute on the title of the collateral securities',
  'Costing of the project which is in wide variance with the standard cost of installation of the project',
  'Foreign bills remaining outstanding for a long time and tendency for bills to remain overdue',
  'Onerous clauses in the issue of BG/LC/standby letters of credit',
  'In merchanting trade, import leg not revealed to the bank',
  'Request received from the borrower to postpone the inspection of the godown for flimsy reasons',
  'Claims not acknowledged as debt high',
  'Same collateral charged to a number of lenders',
  'Concealment of certain vital documents like master agreement, insurance coverage',
  'Floating front/associate companies by investing borrowed money',
  'Reduction in the stake of promoter/director',
  'Resignation of key personnel and frequent changes in the management',
  'Substantial increase in unbilled revenue year after year',
  'Significant movements in inventory, disproportionately higher than the growth in turnover',
  'Significant movements in receivables, disproportionately higher than the growth in turnover and/or increase in ageing of the receivables',
  'Disproportionate increase in other current assets',
  'Critical issues highlighted in the stock audit report',
  'Movement of an account from one bank to another',
  'Increase in Fixed Assets, without corresponding increase in turnover (when the project is implemented)',
  'Liabilities appearing in ROC search report, not reported by the borrower in its annual report',
  'Material discrepancies in the annual report',
  'Significant inconsistencies within the annual report (between various sections)',
  'Poor disclosure of materially adverse information and no qualification by the statutory auditors',
  'Frequent change in accounting period and/or accounting policies',
  'Frequent ad hoc sanctions',
  'Non-submission of original bills',
  'Presence of other unrelated bank’s name board',
  'Non-cooperative attitude towards stock audit',
  'Request received from the borrower to postpone the stock audit',
  'Undue delay in submissions of financial statement for renewal of limits (delay > 3 months)',
  'Undue delay in implementation of the project',
].map((q, i) => ({ pointNo: i + 1, point: q }))

/* ------------------------- component ------------------------------ */
const NewOfflineAlertDialog: React.FC<Props> = ({
  open,
  setOpen,
  accountId,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      decisions: QUESTIONS.map(() => 'no' as 'yes' | 'no'),
      descriptions: QUESTIONS.map(() => ''),
    },
  })

  const uploadMutation = $api.useMutation(
    'post',
    '/AlertOffline/{accountNumber}/{pointNo}/upload'
  )

  const createMutation = $api.useMutation(
    'post',
    '/AlertOffline/{accountNumber}/create'
  )

  const decisions = watch('decisions')
  const [fileNames, setFileNames] = useState<Record<number, string[]>>({})
  const [uploadingPoint, setUploadingPoint] = useState<number | null>(null)

  const handleUpload = async (pointNo: number, files: FileList | null) => {
    if (!files?.length) return
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))

    setUploadingPoint(pointNo)
    try {
      await uploadMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: {
          path: { pointNo, accountNumber: accountId },
          query: undefined as unknown as { files: string[] },
        },
      })
      setFileNames((prev) => ({
        ...prev,
        [pointNo]: [
          ...(prev[pointNo] ?? []),
          ...Array.from(files).map((f) => f.name),
        ],
      }))
      toast.success(
        <div className='flex items-center gap-2'>
          <Check size={18} />
          <span className='text-xs'>{`Uploaded ${files.length} file(s) for point ${pointNo}`}</span>
        </div>
      )
    } catch {
      toast.error(
        <div className='flex items-center gap-2'>
          <AlertTriangle size={18} />
          <span className='text-xs'>{`Upload failed for point ${pointNo}`}</span>
        </div>
      )
    } finally {
      setUploadingPoint(null)
    }
  }

  const onSubmitLogic = async (values: {
    decisions: ('yes' | 'no')[]
    descriptions: string[]
  }) => {
    // Renamed to avoid conflict with form's onSubmit prop
    const payload = QUESTIONS.flatMap(({ pointNo, point }, idx) => {
      const decision = values.decisions[idx]
      if (decision !== 'yes') return []
      return [
        {
          pointNo,
          point,
          decision,
          description: values.descriptions[idx],
          documentNames: fileNames[pointNo] ?? [],
        },
      ]
    })

    if (!payload.length) {
      toast.warning(
        <div className='flex items-center gap-2'>
          <AlertTriangle size={18} />
          <span className='text-xs'>
            No questions marked Yes. Please select at least one.
          </span>
        </div>
      )
      return
    }

    try {
      await createMutation.mutateAsync({
        body: payload,
        params: { path: { accountNumber: accountId } },
      })
      toast.success(
        <div className='flex items-center gap-2'>
          <CheckCircle2 size={18} />
          <span className='text-xs'>Offline alert(s) saved successfully!</span>
        </div>
      )
      setOpen(false)
    } catch {
      toast.error(
        <div className='flex items-center gap-2'>
          <AlertTriangle size={18} />
          <span className='text-xs'>
            Could not save alerts. Please try again.
          </span>
        </div>
      )
    }
  }

  useEffect(() => {
    if (!open) {
      reset({
        decisions: QUESTIONS.map(() => 'no' as 'yes' | 'no'),
        descriptions: QUESTIONS.map(() => ''),
      })
      setFileNames({})
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Adjusted DialogContent: wider, p-0 to manage padding internally */}
      <DialogContent className='flex h-[90vh] w-full max-w-6xl min-w-[80vw] flex-col p-0 sm:h-[95vh]'>
        {/* Added padding, border to DialogHeader */}
        <DialogHeader className='flex-shrink-0 border-b px-6 pt-6 pb-4'>
          <DialogTitle className='text-xl'>New Offline Alert</DialogTitle>
          <DialogDescription className='text-sm'>
            Review each point below. Mark “Yes” if the alert applies, provide a
            description, and upload supporting evidence.
          </DialogDescription>
        </DialogHeader>

        {/* Form now wraps ScrollArea and DialogFooter, handles flex distribution */}
        <form
          onSubmit={handleSubmit(onSubmitLogic)} // Use handleSubmit here
          className='flex flex-1 flex-col overflow-y-auto' // flex-1 ensures it takes available space
        >
          <ScrollArea className='flex-1'>
            {' '}
            {/* ScrollArea takes space within the form */}
            {/* Added padding to the content wrapper inside ScrollArea */}
            <div className='space-y-6 px-6 py-4'>
              {QUESTIONS.map(({ pointNo, point }, idx) => (
                <div
                  key={pointNo}
                  className={`space-y-3 rounded-lg border p-4 transition-all duration-300 ease-in-out ${decisions[idx] === 'yes' ? 'border-primary bg-primary/5 shadow-lg' : 'border-border hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <Controller
                    name={`decisions.${idx}` as const}
                    control={control}
                    render={({ field }) => (
                      <fieldset className='space-y-2'>
                        <legend className='text-sm leading-relaxed font-semibold text-slate-800 dark:text-slate-200'>
                          <span className='text-primary font-bold'>
                            {pointNo}.{' '}
                          </span>
                          {point}
                        </legend>
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
                          <label
                            className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-1.5 text-xs transition-colors ${field.value === 'yes' ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          >
                            <input
                              type='radio'
                              className='sr-only'
                              value='yes'
                              checked={field.value === 'yes'}
                              onChange={() => field.onChange('yes')}
                            />
                            <CheckCircle2
                              size={16}
                              className={
                                field.value === 'yes'
                                  ? 'text-green-500'
                                  : 'text-slate-400'
                              }
                            />
                            Yes
                          </label>
                          <label
                            className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-1.5 text-xs transition-colors ${field.value === 'no' ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          >
                            <input
                              type='radio'
                              className='sr-only'
                              value='no'
                              checked={field.value === 'no'}
                              onChange={() => field.onChange('no')}
                            />
                            <XCircle
                              size={16}
                              className={
                                field.value === 'no'
                                  ? 'text-red-500'
                                  : 'text-slate-400'
                              }
                            />
                            No
                          </label>
                        </div>
                      </fieldset>
                    )}
                  />

                  {decisions[idx] === 'yes' && (
                    <div className='animate-fadeIn mt-3 space-y-4 border-t border-dashed pt-3'>
                      <Controller
                        name={`descriptions.${idx}` as const}
                        control={control}
                        rules={{
                          required:
                            decisions[idx] === 'yes'
                              ? "Description is required when 'Yes' is selected."
                              : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div className='space-y-1'>
                            <label
                              htmlFor={`description-${pointNo}`}
                              className='text-xs font-medium text-slate-700 dark:text-slate-300'
                            >
                              Detailed Description{' '}
                              <span className='text-red-500'>*</span>
                            </label>
                            <Textarea
                              id={`description-${pointNo}`}
                              rows={3} // Reduced rows slightly for more compactness if many items are open
                              placeholder='Provide a comprehensive description of the issue, circumstances, and any observations...'
                              className='resize-y bg-white text-xs dark:bg-slate-900' // Smaller text
                              {...field}
                            />
                            {fieldState.error && (
                              <p className='text-xs text-red-500'>
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />

                      <div className='space-y-2'>
                        <label className='flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300'>
                          <UploadCloud size={16} className='text-primary' />
                          Upload Supporting Evidence (Optional)
                        </label>
                        <div className='flex items-center gap-2'>
                          <Input
                            type='file'
                            multiple
                            className='file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:file:text-primary dark:hover:file:bg-primary/30 flex-grow cursor-pointer file:mr-2 file:rounded-full file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-semibold'
                            onChange={(e) =>
                              handleUpload(pointNo, e.target.files)
                            }
                            disabled={uploadingPoint === pointNo}
                          />
                          {uploadingPoint === pointNo && (
                            <Loader2
                              size={16}
                              className='text-primary animate-spin'
                            />
                          )}
                        </div>
                        {(fileNames[pointNo] ?? []).length > 0 && (
                          <div className='mt-2 space-y-1'>
                            <p className='text-xs font-medium text-slate-600 dark:text-slate-400'>
                              Uploaded files:
                            </p>
                            <ul className='flex flex-wrap gap-1.5'>
                              {fileNames[pointNo].map((n, i) => (
                                <li key={i}>
                                  <Badge
                                    variant='secondary'
                                    className='flex items-center gap-1 px-2 py-0.5 text-xs'
                                  >
                                    <FileText size={12} />
                                    {n}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Added padding, border to DialogFooter. It's now part of the form. */}
          <DialogFooter className='bg-background flex-shrink-0 border-t px-6 py-4'>
            {' '}
            {/* Ensure footer has background */}
            <DialogClose asChild>
              <Button type='button' variant='outline' className='text-sm'>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type='submit' // This button now submits the form
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                uploadMutation.isPending
              }
              className='min-w-[150px] text-sm' // Slightly wider button
            >
              {isSubmitting || createMutation.isPending ? (
                <Loader2 size={16} className='mr-2 animate-spin' />
              ) : (
                <Send size={16} className='mr-2' />
              )}
              {isSubmitting || createMutation.isPending
                ? 'Saving Alerts…'
                : 'Submit Alerts'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewOfflineAlertDialog
