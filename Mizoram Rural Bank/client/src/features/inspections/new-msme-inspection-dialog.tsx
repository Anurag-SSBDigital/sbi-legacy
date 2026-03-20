import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
// <-- Added for the alert icon

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
// <-- Added Alert components
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

/* ----------------------- props & types ---------------------------- */
interface Props {
  open: boolean
  setOpen: (o: boolean) => void
  accountId: string
  onSuccess: () => void
}

// Interface for a single questionnaire question from the API
interface QuestionnaireItem {
  id: string
  questionNo: number
  questionText: string
  ewsAlert: string
}

interface FormValues {
  dateOfVisit: string
  purposeOfVisit: string
  nameOfPersonInterviewed: string
  commentOnActivityOfFirm: string
  commentsAboutGeneralWorkingCompany: string
  dataCollectionDone: string
  inspectionConductedBy: string
  questionResponses: Array<{
    questionNo: number | undefined
    answer: string
    remarks: string
  }>
  images: FileList | null // <-- Changed to FileList for better type handling
  inspectorEmployeeId: string
}

/* ---------------------- component -------------------------------- */
const NewMsmeDialog: React.FC<Props> = ({
  open,
  setOpen,
  accountId,
  onSuccess,
}) => {
  /* ------------------------- form -------------------------------- */
  const {
    data: accountName,
    isSuccess: accountNameSuccess,
    isPending: accountNamePending,
    isError: accountNameError,
  } = $api.useQuery('get', '/account/getName', {
    params: { query: { acctNo: accountId } },
  })

  const { data: questionnaireRes } = $api.useQuery(
    'get',
    '/Msme_inspections/questionnaire'
  )

  const questionnaire: QuestionnaireItem[] | undefined = questionnaireRes?.data

  const form = useForm<FormValues>({
    defaultValues: {
      dateOfVisit: new Date().toISOString().slice(0, 16),
      questionResponses: [],
      images: null,
    },
  })

  const {
    setValue,
    control,
    handleSubmit,
    clearErrors,
    setError,
    trigger,
    formState: { isSubmitting, errors },
  } = form

  useEffect(() => {
    if (
      !accountNamePending &&
      !accountNameError &&
      accountNameSuccess &&
      accountName?.data
    ) {
      setValue('nameOfPersonInterviewed', accountName.data)
    }
  }, [
    setValue,
    accountName,
    accountNamePending,
    accountNameError,
    accountNameSuccess,
  ])

  useEffect(() => {
    if (questionnaire) {
      const initialResponses = (questionnaire as QuestionnaireItem[]).map(
        (q) => ({
          questionNo: q.questionNo,
          answer: '',
          remarks: '',
        })
      )
      setValue('questionResponses', initialResponses)
    }
  }, [questionnaire, setValue])

  /* -------------------------- images ----------------------------- */
  const [uploadedNames, setUploadedNames] = useState<string[]>([])
  const imagesRef = useRef<HTMLDivElement>(null)

  const uploadMutation = $api.useMutation(
    'post',
    '/Msme_inspections/uploadImages'
  )

  // 2) Update handleFileSelect to set the form value first, then upload
  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return

    // set form value immediately so validation passes
    setValue('images', files, { shouldValidate: true, shouldDirty: true })
    clearErrors('images')

    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('files', f))

    try {
      await uploadMutation.mutateAsync({
        body: fd as unknown as undefined,
        params: { query: undefined as unknown as { files: string[] } },
      })
      const newFileNames = Array.from(files).map((f) => f.name)
      setUploadedNames((prev) => [...prev, ...newFileNames])
      toast.success(`${files.length} image(s) uploaded successfully.`)
    } catch {
      // revert and show field error if upload fails
      setValue('images', null, { shouldValidate: true, shouldDirty: true })
      setError('images', {
        type: 'manual',
        message: 'Could not upload images. Please try again.',
      })
      toast.error('Could not upload images. Please try again.')
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    const newUploadedNames = uploadedNames.filter(
      (_, idx) => idx !== indexToRemove
    )
    setUploadedNames(newUploadedNames)
    if (newUploadedNames.length === 0) {
      setValue('images', null, { shouldValidate: true, shouldDirty: true })
      trigger('images')
    }
  }

  useEffect(() => {
    // Reset image state when dialog closes
    if (!open) {
      setUploadedNames([])
      setValue('images', null)
    }
  }, [open, setValue])

  /* -------------------- create mutation -------------------------- */
  const createMutation = $api.useMutation('post', '/Msme_inspections/create', {
    onSuccess: () => {
      onSuccess()
      toast.success('MSME inspection created')
      setOpen(false)
      form.reset()
    },
    onError: () => toast.error('Could not create inspection'),
  })

  /* ------------------------- submit ------------------------------ */
  const onSubmit = handleSubmit(async (values) => {
    // We only need uploadedNames, the 'images' field was for validation
    const { questionResponses, images, ...inspectionValues } = values
    await createMutation.mutateAsync({
      body: {
        msmeInspection: {
          ...inspectionValues,
          inspectionImages: uploadedNames,
          accountNumber: accountId,
        },
        questionResponses,
      },
      params: { header: { Authorization: '' } },
    })
  })

  /* ------------------------- scroll to error --------------------- */
  useEffect(() => {
    if (isSubmitting && Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0] as keyof FormValues

      if (firstErrorKey === 'images' && imagesRef.current) {
        imagesRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        return
      }

      // For nested question responses
      if (firstErrorKey === 'questionResponses') {
        const questionError = document.querySelector(
          `[data-field-name^="questionResponses"]`
        )
        questionError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      const errorField = document.querySelector(`[name="${firstErrorKey}"]`)
      errorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isSubmitting, errors])

  /* --------------------------- ui -------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-h-[90vh] max-w-5xl overflow-y-auto'>
        <Form {...form}>
          <form onSubmit={onSubmit} className='space-y-6'>
            <DialogHeader>
              <DialogTitle>New MSME Inspection</DialogTitle>
              <DialogDescription>
                Enter inspection details, complete the questionnaire, and upload
                any images, then submit.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue='details' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='details'>Details & Images</TabsTrigger>
                <TabsTrigger value='questionnaire'>Questionnaire</TabsTrigger>
              </TabsList>

              {/* -------------------- Details Tab ------------------- */}
              <TabsContent value='details' className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <FormField
                    control={control}
                    name='dateOfVisit'
                    rules={{ required: 'Date of visit is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time of Visit</FormLabel>
                        <FormControl>
                          <Input type='datetime-local' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='purposeOfVisit'
                    rules={{ required: 'Purpose of visit is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Visit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Routine Check, Loan Application'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='nameOfPersonInterviewed'
                    rules={{
                      required: 'Name of person interviewed is required',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of Person Interviewed</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Name'
                            {...field}
                            readOnly={accountName?.data !== undefined}
                            className={
                              accountName?.data ? 'bg-muted cursor-default' : ''
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name='inspectionConductedBy'
                    rules={{ required: 'Inspector name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspection Conducted By</FormLabel>
                        <FormControl>
                          <Input placeholder='Officer name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='md:col-span-2'>
                    <FormField
                      control={control}
                      name='commentOnActivityOfFirm'
                      rules={{
                        required: 'Comment on activity of firm is required',
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment on Activity of Firm</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Describe the primary business activities observed...'
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <FormField
                      control={control}
                      name='commentsAboutGeneralWorkingCompany'
                      rules={{
                        required: 'Comments about general working are required',
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments about General Working</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='General observations about the company environment...'
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <FormField
                      control={control}
                      name='dataCollectionDone'
                      rules={{
                        required: 'Data collection details are required',
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Collection Done</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., Financial documents reviewed, stock checked'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div
                  ref={imagesRef}
                  className='space-y-4 rounded-lg border p-4'
                >
                  {/* 3) Wire the file input to RHF and validate using the field value */}
                  <FormField
                    control={control}
                    name='images'
                    rules={{
                      validate: (v) =>
                        (v && v.length > 0) ||
                        'At least one image is required.',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspection Images</FormLabel>
                        <FormControl>
                          <Input
                            type='file'
                            multiple
                            accept='image/*'
                            onChange={(e) => {
                              const files = e.target.files
                              field.onChange(files) // <-- tell RHF about the change
                              void handleFileSelect(files) // <-- start upload
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {uploadedNames.length > 0 && (
                    <div className='space-y-2 pt-2'>
                      <Label>Uploaded Files:</Label>
                      <ul className='space-y-2'>
                        {uploadedNames.map((name, index) => (
                          <li
                            key={index}
                            className='bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm'
                          >
                            <span className='truncate pr-2'>{name}</span>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              className='h-6 w-6 shrink-0'
                              onClick={() => handleRemoveImage(index)}
                            >
                              <span className='sr-only'>Remove {name}</span>✕
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <FormField
                  control={control}
                  name='inspectorEmployeeId'
                  rules={{ required: 'Inspector employee ID is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspector Employee ID</FormLabel>
                      <FormControl>
                        <Input placeholder='Inspector Employee ID' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* -------------------- Questionnaire Tab ------------------- */}
              <TabsContent value='questionnaire' className='space-y-4'>
                {questionnaire ? (
                  <div className='space-y-6'>
                    {(questionnaire as QuestionnaireItem[]).map(
                      (q: QuestionnaireItem, index) => {
                        const answerPath =
                          `questionResponses.${index}.answer` as const
                        const remarksPath =
                          `questionResponses.${index}.remarks` as const
                        const currentAnswer = form.watch(answerPath) // for UI hint/disable

                        return (
                          <div
                            key={q.id}
                            className='bg-card rounded-xl border p-6 shadow'
                            data-field-name={`questionResponses.${index}`}
                          >
                            <div className='flex items-start gap-4'>
                              <div className='bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold'>
                                {index + 1}
                              </div>
                              <div className='flex-grow space-y-4'>
                                <p className='text-base leading-relaxed font-semibold'>
                                  {q.questionText}
                                </p>

                                <Alert variant='destructive'>
                                  <AlertTriangle className='h-4 w-4' />
                                  <AlertTitle>Alert</AlertTitle>
                                  <AlertDescription>
                                    {q.ewsAlert}
                                  </AlertDescription>
                                </Alert>

                                <div className='space-y-4'>
                                  <FormField
                                    control={control}
                                    name={answerPath}
                                    rules={{
                                      required: 'Please select an answer.',
                                    }}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className='font-medium'>
                                          Response
                                        </FormLabel>
                                        <FormControl>
                                          <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className='flex space-x-6'
                                          >
                                            {['Yes', 'No', 'NA'].map((opt) => (
                                              <FormItem
                                                key={opt}
                                                className='flex items-center space-x-2'
                                              >
                                                <FormControl>
                                                  <RadioGroupItem
                                                    value={opt}
                                                    id={`q-${index}-${opt}`}
                                                  />
                                                </FormControl>
                                                <Label
                                                  htmlFor={`q-${index}-${opt}`}
                                                >
                                                  {opt}
                                                </Label>
                                              </FormItem>
                                            ))}
                                          </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  {/* Remarks: required unless answer is NA */}
                                  <FormField
                                    control={control}
                                    name={remarksPath}
                                    rules={{
                                      validate: (val) => {
                                        const ans = form.getValues(answerPath)
                                        // Optional when NA or when no answer yet (so only the "answer" field errors)
                                        if (!ans || ans === 'NA') return true
                                        return (
                                          (val && val.trim().length > 0) ||
                                          'Remarks are required when answer is Yes or No.'
                                        )
                                      },
                                    }}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className='font-medium'>
                                          Remarks{' '}
                                          {currentAnswer === 'NA' && (
                                            <span className='text-muted-foreground'>
                                              (optional)
                                            </span>
                                          )}
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea
                                            rows={2}
                                            placeholder='Provide details or justification...'
                                            {...field}
                                            // Optional: disable input when NA to reflect optionality in UI
                                            disabled={currentAnswer === 'NA'}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                ) : (
                  <div className='flex items-center justify-center p-8'>
                    <p>Loading questionnaire…</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* This hidden field is no longer needed as the FormField for images handles validation */}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || uploadMutation.isPending}
              >
                {isSubmitting ? 'Submitting…' : 'Create Inspection'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewMsmeDialog
