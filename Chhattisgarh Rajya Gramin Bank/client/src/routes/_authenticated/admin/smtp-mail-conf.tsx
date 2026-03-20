// src/routes/_authenticated/admin/smtp-mail-conf.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createFileRoute } from '@tanstack/react-router'
import {
  IconMessage,
  IconMail,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react'
import LoadingBar from 'react-top-loading-bar'
import { toast } from 'sonner'
import { $api } from '@/lib/api'
import { useCanAccess } from '@/hooks/use-can-access.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/_authenticated/admin/smtp-mail-conf')({
  component: RouteComponent,
})

type MailConfig = {
  id?: number
  fromMailId: string
  appPassword?: string
  password?: string
  mailProvider: string
  smtpHost: string
  smtpPort: number
  isActive?: boolean
}

type MailConfigForm = {
  id?: number
  fromMailId: string
  appPassword: string
  password?: string
  mailProvider: string
  smtpHost: string
  smtpPort: string | number
}

/* ---------------- safe helpers ---------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function extractList(payload: unknown): MailConfig[] {
  // supports: MailConfig[] OR {data: MailConfig[]} OR {data:{content:MailConfig[]}}
  if (Array.isArray(payload)) return payload as MailConfig[]
  if (isRecord(payload)) {
    const d = payload.data
    if (Array.isArray(d)) return d as MailConfig[]
    if (isRecord(d) && Array.isArray(d.content))
      return d.content as MailConfig[]
  }
  return []
}

/**
 * ✅ Shallow wrappers: still calling $api.useQuery/$api.useMutation,
 * but prevents OpenAPI type explosion & route mismatch errors.
 * No `any` used; only `unknown`.
 */
type ShallowQueryResult = {
  data?: unknown
  isLoading?: boolean
  error?: unknown
  refetch?: () => Promise<unknown>
}
type ShallowMutationResult = {
  mutate: (input: unknown) => void
  mutateAsync: (input: unknown) => Promise<unknown>
  isPending?: boolean
}

const useQueryShallow = $api.useQuery as unknown as (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  args?: unknown,
  opts?: unknown
) => ShallowQueryResult

const useMutationShallow = $api.useMutation as unknown as (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  opts?: unknown
) => ShallowMutationResult

function RouteComponent() {
  const token = sessionStorage.getItem('token') || ''
  const canCreate = useCanAccess('smtp_mail_conf', 'create')
  const canUpdate = useCanAccess('smtp_mail_conf', 'update')
  const canDelete = useCanAccess('smtp_mail_conf', 'delete')
  const canActivate = useCanAccess('smtp_mail_conf', 'activate')

  const [progress, setProgress] = useState(0)
  const [config, setConfig] = useState<MailConfig | null>(null)

  const [isFormOpen, setFormOpen] = useState(false)
  const [formDefaultValues, setFormDefaultValues] = useState<
    MailConfigForm | undefined
  >(undefined)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MailConfig | null>(null)

  const startLoading = () => setProgress(35)
  const finishLoading = () => {
    setProgress(100)
    setTimeout(() => setProgress(0), 350)
  }

  /* =========================
     GET ALL: /mail/all
     ========================= */
  const {
    data: configsRaw,
    isLoading: configsLoading,
    error: configsError,
    refetch,
  } = useQueryShallow(
    'get',
    '/mail/all',
    {
      params: {
        header: {
          Accept: '*/*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    },
    { enabled: true }
  )

  const configList = useMemo(() => extractList(configsRaw), [configsRaw])

  useEffect(() => {
    if (configsLoading) startLoading()
    else finishLoading()
  }, [configsLoading])

  useEffect(() => {
    if (configsError) toast.error('Failed to load configurations')
  }, [configsError])

  // keep selected config stable
  useEffect(() => {
    if (!configList.length) {
      setConfig(null)
      return
    }
    setConfig((prev) => {
      if (prev?.id && configList.some((c) => c.id === prev.id)) return prev
      return configList.find((c) => c.isActive) ?? configList[0] ?? null
    })
  }, [configList])

  const safeRefetch = useCallback(async () => {
    try {
      startLoading()
      await refetch?.()
    } finally {
      finishLoading()
    }
  }, [refetch])

  /* =========================
     DELETE: /mail/configuration/{id}
     ========================= */
  const deleteMutation = useMutationShallow(
    'delete',
    '/mail/configuration/{id}'
  )

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete configurations.')
      return
    }

    if (!deleteTarget?.id) {
      toast.error('No configuration selected to delete')
      return
    }
    try {
      startLoading()
      const res = await deleteMutation.mutateAsync({
        params: {
          path: { id: deleteTarget.id },
          header: {
            Accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      })

      // accept SUCCESS envelope OR silent success
      if (
        isRecord(res) &&
        typeof res.status === 'string' &&
        res.status !== 'SUCCESS'
      ) {
        throw new Error(
          typeof res.message === 'string' ? res.message : 'Failed to delete'
        )
      }

      toast.success(
        isRecord(res) && typeof res.message === 'string'
          ? res.message
          : 'Mail configuration deleted'
      )

      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      setConfig((prev) => (prev?.id === deleteTarget.id ? null : prev))

      await safeRefetch()
    } catch (e) {
      toast.error((e as Error).message || 'Unable to delete configuration')
    } finally {
      finishLoading()
    }
  }

  /* =========================
     SET ACTIVE: /mail/update-status/{id}?isActive=true
     ========================= */
  const setActiveMutation = useMutationShallow(
    'patch',
    '/mail/update-status/{id}'
  )

  const handleSetActive = async (cfg: MailConfig) => {
    if (!canActivate) {
      toast.error('You do not have permission to activate configurations.')
      return
    }

    if (!cfg.id) return
    try {
      startLoading()
      const res = await setActiveMutation.mutateAsync({
        params: {
          path: { id: cfg.id },
          query: { isActive: true },
          header: {
            Accept: '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      })

      if (
        isRecord(res) &&
        typeof res.status === 'string' &&
        res.status !== 'SUCCESS'
      ) {
        throw new Error(
          typeof res.message === 'string'
            ? res.message
            : 'Failed to update status'
        )
      }

      toast.success(
        isRecord(res) && typeof res.message === 'string'
          ? res.message
          : 'Configuration marked as active'
      )

      await safeRefetch()
    } catch (e) {
      toast.error((e as Error).message || 'Unable to update status')
    } finally {
      finishLoading()
    }
  }

  /* =========================
     open create/edit
     ========================= */
  const openCreate = () => {
    if (!canCreate) {
      toast.error('You do not have permission to create configurations.')
      return
    }

    setFormDefaultValues(undefined)
    setFormOpen(true)
  }

  const openEdit = (cfg?: MailConfig | null) => {
    if (!canUpdate) {
      toast.error('You do not have permission to edit configurations.')
      return
    }

    const base = cfg ?? config
    if (!base) {
      toast.error('No configuration to edit')
      return
    }
    setFormDefaultValues({
      id: base.id,
      fromMailId: base.fromMailId,
      appPassword: base.appPassword ?? '',
      password: base.password ?? '',
      mailProvider: base.mailProvider,
      smtpHost: base.smtpHost,
      smtpPort: base.smtpPort,
    })
    setFormOpen(true)
  }

  const handleFormSuccess = async (saved: MailConfig) => {
    setFormOpen(false)
    setConfig(saved)
    await safeRefetch()
  }

  const busy =
    !!configsLoading ||
    !!deleteMutation.isPending ||
    !!setActiveMutation.isPending

  return (
    <>
      <LoadingBar
        progress={progress}
        className='h-1'
        color='#2563eb'
        onLoaderFinished={() => setProgress(0)}
      />

      <div className='mx-auto flex flex-col gap-6 p-4 md:p-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
              SMTP Mail Configuration
            </h1>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              Manage all SMTP profiles used for system notifications, OTPs, and
              alerts.
            </p>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={openCreate}
            className='h-9 rounded-full border-sky-500/70 px-4 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50 dark:border-sky-400/70 dark:text-sky-200 dark:hover:bg-sky-900/60'
            disabled={busy || !canCreate}
          >
            New Configuration
          </Button>
        </div>

        {/* list */}
        <div className='rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div>
              <h2 className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                All SMTP Configurations
              </h2>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Click a profile to view details, set it active, or edit.
              </p>
            </div>
            <span className='text-[11px] text-slate-500 dark:text-slate-400'>
              Total: <span className='font-semibold'>{configList.length}</span>
            </span>
          </div>

          {configList.length === 0 ? (
            <div className='mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900'>
              No configurations found. Create a new SMTP profile to start
              sending emails.
            </div>
          ) : (
            <div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {configList.map((cfg) => {
                const isSelected = cfg.id && cfg.id === config?.id
                const isActive = !!cfg.isActive

                return (
                  <button
                    key={
                      cfg.id ??
                      `${cfg.fromMailId}-${cfg.smtpHost}-${cfg.smtpPort}`
                    }
                    type='button'
                    onClick={() => setConfig(cfg)}
                    className={[
                      'group flex flex-col items-stretch rounded-xl border px-3 py-3 text-left text-xs shadow-sm transition-all',
                      'hover:border-sky-400 hover:bg-sky-50/70 dark:hover:border-sky-500 dark:hover:bg-slate-800/80',
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:border-sky-400 dark:bg-slate-800'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70',
                    ].join(' ')}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
                          <IconMail className='h-3.5 w-3.5' />
                        </span>
                        <div className='flex flex-col'>
                          <span className='line-clamp-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100'>
                            {cfg.fromMailId}
                          </span>
                          <span className='text-[10px] tracking-wide text-slate-500 uppercase dark:text-slate-400'>
                            {cfg.mailProvider || '—'}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/20 dark:text-emerald-200'>
                          <IconStarFilled className='h-3 w-3' /> Active
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                          <IconStar className='h-3 w-3' /> Inactive
                        </span>
                      )}
                    </div>

                    <div className='mt-2 text-[10px] text-slate-500 dark:text-slate-400'>
                      Host:{' '}
                      <code className='rounded bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-800'>
                        {cfg.smtpHost}:{cfg.smtpPort}
                      </code>
                    </div>

                    <div className='mt-3 flex items-center justify-between gap-2'>
                      <div className='flex gap-1'>
                        {!isActive && cfg.id && canActivate && (
                          <Button
                            type='button'
                            variant='outline'
                            className='h-6 rounded-full px-2 text-[10px]'
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleSetActive(cfg)
                            }}
                            disabled={busy}
                          >
                            Make Active
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            type='button'
                            variant='outline'
                            className='h-6 rounded-full px-2 text-[10px]'
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cfg)
                            }}
                            disabled={busy}
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      {cfg.id && canDelete && (
                        <Button
                          type='button'
                          variant='ghost'
                          className='h-6 px-2 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950'
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(cfg)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={busy}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* selected */}
        <div className='overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-900'>
          <div className='flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80'>
            <div className='flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-full shadow-md'>
                <IconMessage className='h-6 w-6' />
              </div>
              <div>
                <h2 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
                  Selected SMTP Profile
                </h2>
                <p className='text-[11px] text-slate-500 dark:text-slate-400'>
                  {config
                    ? 'Selected profile details.'
                    : 'Select a configuration above.'}
                </p>
              </div>
            </div>

            <Badge
              variant={config ? 'default' : 'outline'}
              className={
                config
                  ? 'rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'rounded-full border-slate-400 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300'
              }
            >
              {config
                ? config.isActive
                  ? 'Active Profile'
                  : 'Configured'
                : 'Not Configured'}
            </Badge>
          </div>

          {config ? (
            <>
              <div className='grid gap-6 border-b border-slate-200 px-6 py-5 text-sm md:grid-cols-2 dark:border-slate-800'>
                <div className='space-y-4'>
                  <ConfigRow label='From Email'>
                    <span className='font-medium text-sky-700 dark:text-sky-300'>
                      {config.fromMailId}
                    </span>
                  </ConfigRow>
                  <ConfigRow label='Mail Provider'>
                    <span className='inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-200'>
                      {config.mailProvider || '—'}
                    </span>
                  </ConfigRow>
                  <ConfigRow label='SMTP Host'>
                    <code className='rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100'>
                      {config.smtpHost}
                    </code>
                  </ConfigRow>
                  <ConfigRow label='SMTP Port'>
                    <span>{config.smtpPort}</span>
                  </ConfigRow>
                </div>

                <div className='space-y-4'>
                  <ConfigRow label='Authentication'>
                    <span className='text-xs text-slate-500 dark:text-slate-400'>
                      Using App Password
                    </span>
                  </ConfigRow>
                  <ConfigRow label='App Password'>
                    <span className='text-xs tracking-[0.2em] text-slate-500 dark:text-slate-400'>
                      ●●●● ●●●● ●●●● ●●●●
                    </span>
                  </ConfigRow>
                  {config.id && (
                    <ConfigRow label='Configuration ID'>
                      <span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                        #{config.id}
                      </span>
                    </ConfigRow>
                  )}
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 px-6 py-4'>
                <div className='flex gap-2'>
                  {config.id && canDelete && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setDeleteTarget(config)
                        setDeleteDialogOpen(true)
                      }}
                      className='h-8 rounded-full px-3 text-xs'
                      disabled={busy}
                    >
                      Delete
                    </Button>
                  )}
                  {canUpdate && (
                    <Button
                      size='sm'
                      onClick={() => openEdit(config)}
                      className='h-8 rounded-full px-4 text-xs font-medium text-white'
                      disabled={busy}
                    >
                      Edit Configuration
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400'>
              <p className='text-base font-medium text-slate-900 dark:text-slate-100'>
                No SMTP configuration selected.
              </p>
              <Button
                className='mt-4 h-9 rounded-full px-4 text-xs font-medium text-white'
                size='sm'
                onClick={openCreate}
                disabled={busy || !canCreate}
              >
                Create Configuration
              </Button>
            </div>
          )}
        </div>
      </div>

      <MailConfigFormDialog
        open={isFormOpen}
        onOpenChange={setFormOpen}
        defaultValues={formDefaultValues}
        onSuccess={handleFormSuccess}
        token={token}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!canDelete && open) return
          setDeleteDialogOpen(open)
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Mail Configuration</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The system may not be able to send
              emails using this profile once deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => void handleDelete()}
              disabled={busy}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ConfigRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400'>
        {label}
      </span>
      <div className='text-sm text-gray-900 dark:text-gray-100'>{children}</div>
    </div>
  )
}

/* =============================
   MailConfigFormDialog (NO fetch)
============================= */

interface MailConfigFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (saved: MailConfig) => void
  defaultValues?: MailConfigForm
  token: string
  canCreate: boolean
  canUpdate: boolean
}

function MailConfigFormDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
  token,
  canCreate,
  canUpdate,
}: MailConfigFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MailConfigForm>({
    defaultValues: defaultValues ?? {
      fromMailId: '',
      appPassword: '',
      password: '',
      mailProvider: 'gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      defaultValues ?? {
        fromMailId: '',
        appPassword: '',
        password: '',
        mailProvider: 'gmail',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
      }
    )
  }, [open, defaultValues, reset])

  const createMutation = useMutationShallow('post', '/mail/configure')
  const updateMutation = useMutationShallow('put', '/mail/update/{id}')

  const onSubmit = handleSubmit(async (values) => {
    if (values.id && !canUpdate) {
      toast.error('You do not have permission to edit configurations.')
      return
    }

    if (!values.id && !canCreate) {
      toast.error('You do not have permission to create configurations.')
      return
    }

    const body: MailConfig = {
      fromMailId: values.fromMailId.trim(),
      appPassword: (values.appPassword ?? '').trim(),
      password: (values.password || '').trim(),
      mailProvider: values.mailProvider,
      smtpHost: values.smtpHost.trim(),
      smtpPort: Number(values.smtpPort),
    }

    try {
      if (values.id) {
        const res = await updateMutation.mutateAsync({
          params: {
            path: { id: values.id },
            header: {
              Accept: '*/*',
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
          body,
        })

        if (
          isRecord(res) &&
          typeof res.status === 'string' &&
          res.status !== 'SUCCESS'
        ) {
          throw new Error(
            typeof res.message === 'string' ? res.message : 'Failed to update'
          )
        }

        const saved =
          isRecord(res) && isRecord(res.data)
            ? (res.data as MailConfig)
            : (res as MailConfig)

        toast.success('Configuration updated successfully')
        onSuccess({ ...saved, id: values.id })
        onOpenChange(false)
      } else {
        const res = await createMutation.mutateAsync({
          params: {
            header: {
              Accept: '*/*',
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
          body,
        })

        if (
          isRecord(res) &&
          typeof res.status === 'string' &&
          res.status !== 'SUCCESS'
        ) {
          throw new Error(
            typeof res.message === 'string' ? res.message : 'Failed to create'
          )
        }

        const saved =
          isRecord(res) && isRecord(res.data)
            ? (res.data as MailConfig)
            : (res as MailConfig)

        toast.success('Configuration created successfully')
        onSuccess(saved)
        onOpenChange(false)
      }
    } catch (e) {
      toast.error((e as Error).message || 'Unable to save configuration')
    }
  })

  const title = defaultValues?.id
    ? 'Edit SMTP Mail Configuration'
    : 'New SMTP Mail Configuration'

  const busy =
    isSubmitting || !!createMutation.isPending || !!updateMutation.isPending
  const canSubmit = defaultValues?.id ? canUpdate : canCreate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/70 p-0 shadow-2xl sm:max-w-xl dark:border-slate-800 dark:bg-slate-950'>
        <DialogHeader className='relative overflow-hidden border-b border-slate-200/60 px-6 py-5 dark:border-slate-800'>
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15 dark:from-sky-500/25 dark:via-indigo-500/20 dark:to-fuchsia-500/25' />
          <div className='relative flex flex-col gap-1.5'>
            <DialogTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
              {title}
            </DialogTitle>
            <DialogDescription className='text-[11px] text-slate-600 dark:text-slate-300'>
              Enter the SMTP settings of the email account that will send system
              mails. For Gmail, enable 2FA and use an app password.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          id='mail-config-form'
          onSubmit={onSubmit}
          className='max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5'
        >
          {/* Sender */}
          <div className='space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60'>
            <div className='grid gap-1.5'>
              <Label htmlFor='fromMailId' className='text-xs font-medium'>
                From Email ID <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='fromMailId'
                type='email'
                placeholder='you@example.com'
                {...register('fromMailId', {
                  required: 'From Email is required.',
                })}
                className={`h-9 text-sm ${
                  errors.fromMailId
                    ? 'border-red-500 focus-visible:ring-red-500/40'
                    : ''
                }`}
              />
              {errors.fromMailId && (
                <p className='text-[11px] text-red-500'>
                  {String(errors.fromMailId.message)}
                </p>
              )}
            </div>
          </div>

          {/* Server */}
          <div className='space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50'>
            <div className='grid gap-4 pt-2 md:grid-cols-2'>
              <div className='grid gap-1.5'>
                <Label htmlFor='mailProvider' className='text-xs font-medium'>
                  Mail Provider <span className='text-red-500'>*</span>
                </Label>
                <Controller
                  name='mailProvider'
                  control={control}
                  rules={{ required: 'Mail Provider is required.' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id='mailProvider' className='h-9 text-xs'>
                        <SelectValue placeholder='Select provider' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='gmail'>Gmail</SelectItem>
                        <SelectItem value='outlook'>
                          Outlook / Office 365
                        </SelectItem>
                        <SelectItem value='yahoo'>Yahoo</SelectItem>
                        <SelectItem value='custom'>Custom / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className='grid gap-1.5'>
                <Label htmlFor='smtpHost' className='text-xs font-medium'>
                  SMTP Host <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='smtpHost'
                  placeholder='smtp.gmail.com'
                  {...register('smtpHost', {
                    required: 'SMTP Host is required.',
                  })}
                  className='h-9 text-sm'
                />
              </div>
            </div>

            <div className='grid gap-1.5 pt-2 md:max-w-xs'>
              <Label htmlFor='smtpPort' className='text-xs font-medium'>
                SMTP Port <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='smtpPort'
                type='number'
                placeholder='587'
                {...register('smtpPort', {
                  required: 'SMTP Port is required.',
                })}
                className='h-9 text-sm'
              />
            </div>
          </div>

          {/* Auth */}
          <div className='space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50'>
            <div className='grid gap-4 pt-2 md:grid-cols-2'>
              <div className='grid gap-1.5'>
                <Label htmlFor='appPassword' className='text-xs font-medium'>
                  App Password <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='appPassword'
                  type='password'
                  {...register('appPassword', {
                    required: 'App Password is required.',
                  })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='grid gap-1.5'>
                <Label htmlFor='password' className='text-xs font-medium'>
                  Account Password (optional)
                </Label>
                <Input
                  id='password'
                  type='password'
                  {...register('password')}
                  className='h-9 text-sm'
                />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className='rounded-b-2xl border-t border-slate-200/70 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex w-full items-center justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form='mail-config-form'
              disabled={busy || !canSubmit}
              className='text-white'
            >
              {defaultValues?.id
                ? 'Update Configuration'
                : 'Save Configuration'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// // src/routes/_authenticated/admin/smtp-mail-conf.tsx
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // @ts-nocheck
// import { useEffect, useState, useCallback } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import {
//   IconMessage,
//   IconMail,
//   IconStar,
//   IconStarFilled,
// } from '@tabler/icons-react'

// import { Badge } from '@/components/ui/badge.tsx'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select.tsx'

// const backendUrl = import.meta.env.VITE_APP_API_URL

// export const Route = createFileRoute('/_authenticated/admin/smtp-mail-conf')({
//   component: RouteComponent,
// })

// type MailConfig = {
//   id?: number
//   fromMailId: string
//   appPassword: string
//   password?: string
//   mailProvider: string
//   smtpHost: string
//   smtpPort: number
//   isActive?: boolean
// }

// type MailConfigForm = {
//   id?: number
//   fromMailId: string
//   appPassword: string
//   password?: string
//   mailProvider: string
//   smtpHost: string
//   smtpPort: string | number
// }

// type ApiResponse<T> = {
//   status?: string
//   message?: string
//   data?: T
// }

// function RouteComponent() {
//   const [progress, setProgress] = useState(0)
//   const [loading, setLoading] = useState(false)

//   const [configList, setConfigList] = useState<MailConfig[]>([])
//   const [config, setConfig] = useState<MailConfig | null>(null)

//   const [isFormOpen, setFormOpen] = useState(false)
//   const [formDefaultValues, setFormDefaultValues] =
//     useState<MailConfigForm | undefined>(undefined)

//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [deleteTarget, setDeleteTarget] = useState<MailConfig | null>(null)

//   const token = sessionStorage.getItem('token') || ''

//   // ======== Helpers for progress bar ========
//   const startLoading = () => {
//     setLoading(true)
//     setProgress(35)
//   }
//   const finishLoading = () => {
//     setProgress(100)
//     setTimeout(() => {
//       setProgress(0)
//       setLoading(false)
//     }, 400)
//   }

//   // ======== Fetch all configurations ========
//   // cURL:
//   // curl -X 'GET' 'http://localhost:8087/mail/all' -H 'accept: */*'
//   const fetchAllConfigs = useCallback(async () => {
//     try {
//       startLoading()
//       const res = await fetch(`${backendUrl}/mail/all`, {
//         headers: {
//           Accept: '*/*',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       })

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<MailConfig[]>
//         | MailConfig[]
//         | null

//       if (!res.ok) {
//         const message =
//           (json as ApiResponse<MailConfig[]>)?.message ||
//           'Failed to load configurations'
//         toast.error(message)
//         setConfigList([])
//         setConfig(null)
//         return
//       }

//       let list: MailConfig[] = []

//       if (json && Array.isArray(json)) {
//         list = json
//       } else if (json && 'data' in json && Array.isArray(json.data)) {
//         list = json.data
//       }

//       if (!list.length) {
//         setConfigList([])
//         setConfig(null)
//         return
//       }

//       setConfigList(list)
//       const active = list.find((c) => c.isActive) ?? list[0] ?? null
//       setConfig(active)
//     } catch (e) {
//       toast.error(
//         (e as Error).message || 'Unable to load mail configurations'
//       )
//       setConfigList([])
//       setConfig(null)
//     } finally {
//       finishLoading()
//     }
//   }, [token])

//   useEffect(() => {
//     void fetchAllConfigs()
//   }, [fetchAllConfigs])

//   // ======== Delete configuration (DELETE) ========
//   // cURL:
//   // curl -X 'DELETE' 'http://localhost:8087/mail/configuration/4'
//   //   -H 'accept: */*'
//   //   -H 'Authorization: Bearer <token>'
//   const handleDelete = async () => {
//     if (!deleteTarget?.id) {
//       toast.error('No configuration selected to delete')
//       return
//     }
//     try {
//       startLoading()
//       const res = await fetch(
//         `${backendUrl}/mail/configuration/${deleteTarget.id}`,
//         {
//           method: 'DELETE',
//           headers: {
//             Accept: '*/*',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//         }
//       )

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<unknown>
//         | null

//       if (!res.ok || (json?.status && json.status !== 'SUCCESS')) {
//         const message = json?.message || 'Failed to delete configuration'
//         throw new Error(message)
//       }

//       toast.success(json?.message || 'Mail configuration deleted')
//       // 🔄 Full page reload after DELETE
//       window.location.reload()

//       setDeleteDialogOpen(false)
//       setDeleteTarget(null)

//       setConfig((prev) =>
//         prev?.id === deleteTarget.id ? null : prev
//       )

//       void fetchAllConfigs()
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to delete configuration')
//     } finally {
//       finishLoading()
//     }
//   }

//   // ======== Status change (Set Active) (PATCH) ========
//   // cURL:
//   // curl -X 'PATCH' 'http://localhost:8087/mail/update-status/3?isActive=true'
//   //   -H 'accept: */*'
//   //   -H 'Authorization: Bearer <token>'
//   const handleSetActive = async (cfg: MailConfig) => {
//     if (!cfg.id) return
//     try {
//       startLoading()
//       const res = await fetch(
//         `${backendUrl}/mail/update-status/${cfg.id}?isActive=true`,
//         {
//           method: 'PATCH',
//           headers: {
//             Accept: '*/*',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//         }
//       )

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<MailConfig>
//         | null

//       if (!res.ok || (json?.status && json.status !== 'SUCCESS')) {
//         const message = json?.message || 'Failed to update active status'
//         throw new Error(message)
//       }

//       toast.success(json?.message || 'Configuration marked as active')
//       // 🔄 Full page reload after PATCH
//       window.location.reload()

//       void fetchAllConfigs()
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to update status')
//     } finally {
//       finishLoading()
//     }
//   }

//   // ======== open Form in create / edit mode ========
//   const openCreate = () => {
//     setFormDefaultValues(undefined)
//     setFormOpen(true)
//   }

//   const openEdit = (cfg?: MailConfig | null) => {
//     const base = cfg ?? config
//     if (!base) {
//       toast.error('No configuration to edit')
//       return
//     }
//     setFormDefaultValues({
//       id: base.id,
//       fromMailId: base.fromMailId,
//       appPassword: base.appPassword,
//       password: base.password ?? '',
//       mailProvider: base.mailProvider,
//       smtpHost: base.smtpHost,
//       smtpPort: base.smtpPort,
//     })
//     setFormOpen(true)
//   }

//   // When form successfully saves (used by dialog)
//   const handleFormSuccess = (saved: MailConfig) => {
//     // No toast or refetch here; dialog handles toast + reload
//     setFormOpen(false)
//     setConfig(saved)
//   }

//   return (
//     <>
//       <LoadingBar
//         progress={progress}
//         className="h-1"
//         color="#2563eb"
//         onLoaderFinished={() => setProgress(0)}
//       />

//       <div className="mx-auto flex flex-col gap-6 p-4 md:p-6">
//         {/* Header */}
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
//               SMTP Mail Configuration
//             </h1>
//             <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
//               Manage all SMTP profiles used for system notifications, OTPs, and alerts.
//             </p>
//           </div>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={openCreate}
//             className="h-9 rounded-full border-sky-500/70 px-4 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50 dark:border-sky-400/70 dark:text-sky-200 dark:hover:bg-sky-900/60"
//           >
//             New Configuration
//           </Button>
//         </div>

//         {/* All configurations list */}
//         <div className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <div>
//               <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
//                 All SMTP Configurations
//               </h2>
//               <p className="text-xs text-slate-500 dark:text-slate-400">
//                 Click a profile to view details, set it active, or edit.
//               </p>
//             </div>
//             <span className="text-[11px] text-slate-500 dark:text-slate-400">
//               Total: <span className="font-semibold">{configList.length}</span>
//             </span>
//           </div>

//           {configList.length === 0 ? (
//             <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
//               No configurations found. Create a new SMTP profile to start sending emails.
//             </div>
//           ) : (
//             <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//               {configList.map((cfg) => {
//                 const isSelected = cfg.id && cfg.id === config?.id
//                 const isActive = cfg.isActive

//                 return (
//                   <button
//                     key={cfg.id}
//                     type="button"
//                     onClick={() => setConfig(cfg)}
//                     className={[
//                       'group flex flex-col items-stretch rounded-xl border px-3 py-3 text-left text-xs shadow-sm transition-all',
//                       'hover:border-sky-400 hover:bg-sky-50/70 dark:hover:border-sky-500 dark:hover:bg-slate-800/80',
//                       isSelected
//                         ? 'border-sky-500 bg-sky-50/70 dark:border-sky-400 dark:bg-slate-800'
//                         : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70',
//                     ].join(' ')}
//                   >
//                     <div className="flex items-start justify-between gap-2">
//                       <div className="flex items-center gap-2">
//                         <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
//                           <IconMail className="h-3.5 w-3.5" />
//                         </span>
//                         <div className="flex flex-col">
//                           <span className="line-clamp-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
//                             {cfg.fromMailId}
//                           </span>
//                           <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                             {cfg.mailProvider || '—'}
//                           </span>
//                         </div>
//                       </div>
//                       {isActive ? (
//                         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
//                           <IconStarFilled className="h-3 w-3" /> Active
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
//                           <IconStar className="h-3 w-3" /> Inactive
//                         </span>
//                       )}
//                     </div>

//                     <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
//                       <span className="line-clamp-1">
//                         Host:{' '}
//                         <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-800">
//                           {cfg.smtpHost}:{cfg.smtpPort}
//                         </code>
//                       </span>
//                     </div>

//                     <div className="mt-3 flex items-center justify-between gap-2">
//                       <div className="flex gap-1">
//                         {!isActive && cfg.id && (
//                           <Button
//                             type="button"
//                             size="xs"
//                             variant="outline"
//                             className="h-6 rounded-full px-2 text-[10px]"
//                             onClick={(e) => {
//                               e.stopPropagation()
//                               void handleSetActive(cfg)
//                             }}
//                             disabled={loading}
//                           >
//                             Make Active
//                           </Button>
//                         )}
//                         <Button
//                           type="button"
//                           size="xs"
//                           variant="outline"
//                           className="h-6 rounded-full px-2 text-[10px]"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             openEdit(cfg)
//                           }}
//                         >
//                           Edit
//                         </Button>
//                       </div>
//                       {cfg.id && (
//                         <Button
//                           type="button"
//                           size="xs"
//                           variant="ghost"
//                           className="h-6 px-2 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             setDeleteTarget(cfg)
//                             setDeleteDialogOpen(true)
//                           }}
//                         >
//                           Delete
//                         </Button>
//                       )}
//                     </div>
//                   </button>
//                 )
//               })}
//             </div>
//           )}
//         </div>

//         {/* Main selected config card */}
//         <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
//           {/* Card header */}
//           <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
//             <div className="flex items-center gap-3">
//               <div className="flex h-11 w-11 items-center justify-center rounded-full shadow-md">
//                 <IconMessage className="h-6 w-6" />
//               </div>
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
//                   Selected SMTP Profile
//                 </h2>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   {config
//                     ? 'This configuration is currently selected for viewing and editing.'
//                     : 'Select a configuration above or create a new one.'}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <Badge
//                 variant={config ? 'default' : 'outline'}
//                 className={
//                   config
//                     ? 'rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
//                     : 'rounded-full border-slate-400 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300'
//                 }
//               >
//                 {config
//                   ? config.isActive
//                     ? 'Active Profile'
//                     : 'Configured'
//                   : 'Not Configured'}
//               </Badge>
//             </div>
//           </div>

//           {config ? (
//             <>
//               {/* Details */}
//               <div className="grid gap-6 border-b border-slate-200 px-6 py-5 text-sm dark:border-slate-800 md:grid-cols-2">
//                 <div className="space-y-4">
//                   <ConfigRow label="From Email">
//                     <span className="font-medium text-sky-700 dark:text-sky-300">
//                       {config.fromMailId}
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="Mail Provider">
//                     <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
//                       {config.mailProvider || '—'}
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="SMTP Host">
//                     <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
//                       {config.smtpHost}
//                     </code>
//                   </ConfigRow>
//                   <ConfigRow label="SMTP Port">
//                     <span>{config.smtpPort}</span>
//                   </ConfigRow>
//                 </div>

//                 <div className="space-y-4">
//                   <ConfigRow label="Authentication">
//                     <span className="text-xs text-slate-500 dark:text-slate-400">
//                       Using App Password
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="App Password">
//                     <span className="text-xs tracking-[0.2em] text-slate-500 dark:text-slate-400">
//                       ●●●● ●●●● ●●●● ●●●●
//                     </span>
//                   </ConfigRow>
//                   {config.id && (
//                     <ConfigRow label="Configuration ID">
//                       <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
//                         #{config.id}
//                       </span>
//                     </ConfigRow>
//                   )}
//                 </div>
//               </div>

//               {/* Actions / helper */}
//               <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
//                 <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
//                   <span>
//                     Tip: For Gmail use{' '}
//                     <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
//                       smtp.gmail.com : 587
//                     </code>{' '}
//                     with TLS and a Google app password.
//                   </span>
//                   <span className="hidden sm:inline">
//                     After editing, send a test email from your application to verify connectivity.
//                   </span>
//                 </div>
//                 <div className="flex gap-2">
//                   {config.id && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setDeleteTarget(config)
//                         setDeleteDialogOpen(true)
//                       }}
//                       className="h-8 rounded-full px-3 text-xs"
//                     >
//                       Delete
//                     </Button>
//                   )}
//                   <Button
//                     size="sm"
//                     onClick={() => openEdit(config)}
//                     className="h-8 rounded-full px-4 text-xs font-medium text-white"
//                   >
//                     Edit Configuration
//                   </Button>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
//               <p className="text-base font-medium text-slate-900 dark:text-slate-100">
//                 No SMTP configuration selected.
//               </p>
//               <p className="mt-1 max-w-md text-[11px]">
//                 Select an existing profile from the list above or create a new configuration with your
//                 email provider&apos;s SMTP details.
//               </p>
//               <Button
//                 className="mt-4 h-9 rounded-full px-4 text-xs font-medium text-white"
//                 size="sm"
//                 onClick={openCreate}
//               >
//                 Create Configuration
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Create / Edit dialog */}
//       <MailConfigFormDialog
//         open={isFormOpen}
//         onOpenChange={setFormOpen}
//         defaultValues={formDefaultValues}
//         onSuccess={handleFormSuccess}
//       />

//       {/* Delete confirm dialog */}
//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Delete Mail Configuration</DialogTitle>
//             <DialogDescription>
//               This action cannot be undone. The system may not be able to send emails using this
//               profile once deleted.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="mt-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setDeleteDialogOpen(false)
//                 setDeleteTarget(null)
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={() => void handleDelete()}
//             >
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }

// function ConfigRow({
//   label,
//   children,
// }: {
//   label: string
//   children: React.ReactNode
// }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
//         {label}
//       </span>
//       <div className="text-sm text-gray-900 dark:text-gray-100">{children}</div>
//     </div>
//   )
// }

// /* =============================
//    MailConfigFormDialog
// ============================= */

// interface MailConfigFormDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: (saved: MailConfig) => void
//   defaultValues?: MailConfigForm
// }

// function MailConfigFormDialog({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: MailConfigFormDialogProps) {
//   const token = sessionStorage.getItem('token') || ''

//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<MailConfigForm>({
//     defaultValues: defaultValues ?? {
//       fromMailId: '',
//       appPassword: '',
//       password: '',
//       mailProvider: 'gmail',
//       smtpHost: 'smtp.gmail.com',
//       smtpPort: 587,
//     },
//   })

//   useEffect(() => {
//     if (open) {
//       reset(
//         defaultValues ?? {
//           fromMailId: '',
//           appPassword: '',
//           password: '',
//           mailProvider: 'gmail',
//           smtpHost: 'smtp.gmail.com',
//           smtpPort: 587,
//         }
//       )
//     }
//   }, [open, defaultValues, reset])

//   const onSubmit = handleSubmit(async (values) => {
//     const body: MailConfig = {
//       fromMailId: values.fromMailId.trim(),
//       appPassword: values.appPassword.trim(),
//       password: (values.password || '').trim(),
//       mailProvider: values.mailProvider,
//       smtpHost: values.smtpHost.trim(),
//       smtpPort: Number(values.smtpPort),
//     }

//     try {
//       if (values.id) {
//         // ===== UPDATE (PUT) =====
//         const res = await fetch(`${backendUrl}/mail/update/${values.id}`, {
//           method: 'PUT',
//           headers: {
//             Accept: '*/*',
//             'Content-Type': 'application/json',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify(body),
//         })

//         const json = (await res.json().catch(() => null)) as
//           | ApiResponse<MailConfig>
//           | MailConfig
//           | null

//         if (!res.ok) {
//           const message =
//             (json as ApiResponse<MailConfig>)?.message ||
//             'Failed to update configuration'
//           throw new Error(message)
//         }

//         const saved: MailConfig =
//           json && 'data' in (json as ApiResponse<MailConfig>)
//             ? (json as ApiResponse<MailConfig>).data!
//             : (json as MailConfig)

//         onSuccess({ ...saved, id: values.id })
//         toast.success('Configuration updated successfully')
//         // 🔄 Full page reload after PUT
//         window.location.reload()
//       } else {
//         // ===== CREATE (POST) =====
//         const res = await fetch(`${backendUrl}/mail/configure`, {
//           method: 'POST',
//           headers: {
//             Accept: '*/*',
//             'Content-Type': 'application/json',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify(body),
//         })

//         const json = (await res.json().catch(() => null)) as
//           | ApiResponse<MailConfig>
//           | MailConfig
//           | null

//         if (
//           !res.ok ||
//           ((json as ApiResponse<MailConfig>)?.status &&
//             (json as ApiResponse<MailConfig>).status !== 'SUCCESS')
//         ) {
//           const message =
//             (json as ApiResponse<MailConfig>)?.message ||
//             'Failed to create configuration'
//           throw new Error(message)
//         }

//         const saved: MailConfig =
//           json && 'data' in (json as ApiResponse<MailConfig>)
//             ? (json as ApiResponse<MailConfig>).data!
//             : (json as MailConfig)

//         onSuccess(saved)
//         toast.success('Configuration created successfully')
//         // 🔄 Full page reload after POST
//         window.location.reload()
//       }
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to save configuration')
//     }
//   })

//   const title = defaultValues?.id
//     ? 'Edit SMTP Mail Configuration'
//     : 'New SMTP Mail Configuration'

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/70 bg-background p-0 shadow-2xl sm:max-w-xl dark:border-slate-800 dark:bg-slate-950">
//         {/* Gradient header */}
//         <DialogHeader className="relative overflow-hidden border-b border-slate-200/60 px-6 py-5 dark:border-slate-800">
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15 dark:from-sky-500/25 dark:via-indigo-500/20 dark:to-fuchsia-500/25" />
//           <div className="relative flex flex-col gap-1.5">
//             <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
//               {title}
//             </DialogTitle>
//             <DialogDescription className="text-[11px] text-slate-600 dark:text-slate-300">
//               Enter the SMTP settings of the email account that will send system mails.
//               For Gmail, enable 2FA and use an app password.
//             </DialogDescription>
//           </div>
//         </DialogHeader>

//         {/* Scrollable content */}
//         <form
//           id="mail-config-form"
//           onSubmit={onSubmit}
//           className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5"
//         >
//           {/* Sender section */}
//           <div className="mt-1 space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
//             <div className="flex items-center justify-between gap-2">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                   Sender Identity
//                 </p>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   This address will appear in the{' '}
//                   <span className="font-medium">From</span> field of outgoing emails.
//                 </p>
//               </div>
//             </div>

//             <div className="mt-3 grid gap-1.5">
//               <Label
//                 htmlFor="fromMailId"
//                 className="text-xs font-medium text-slate-700 dark:text-slate-200"
//               >
//                 From Email ID <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="fromMailId"
//                 type="email"
//                 placeholder="you@example.com"
//                 {...register('fromMailId', {
//                   required: 'From Email is required.',
//                 })}
//                 className={`h-9 text-sm ${errors.fromMailId
//                   ? 'border-red-500 focus-visible:ring-red-500/40'
//                   : ''
//                   }`}
//               />
//               {errors.fromMailId && (
//                 <p className="text-[11px] text-red-500">
//                   {String(errors.fromMailId.message)}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Server section */}
//           <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
//             <div className="flex items-center justify-between gap-2">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                   Server Details
//                 </p>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   Choose your provider and specify the SMTP host and port.
//                 </p>
//               </div>
//             </div>

//             <div className="grid gap-4 pt-2 md:grid-cols-2">
//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="mailProvider"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   Mail Provider <span className="text-red-500">*</span>
//                 </Label>
//                 <Controller
//                   name="mailProvider"
//                   control={control}
//                   rules={{ required: 'Mail Provider is required.' }}
//                   render={({ field }) => (
//                     <Select value={field.value} onValueChange={field.onChange}>
//                       <SelectTrigger
//                         id="mailProvider"
//                         className={`h-9 text-xs ${errors.mailProvider
//                           ? 'border-red-500 focus-visible:ring-red-500/40'
//                           : ''
//                           }`}
//                       >
//                         <SelectValue placeholder="Select provider" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="gmail">Gmail</SelectItem>
//                         <SelectItem value="outlook">
//                           Outlook / Office 365
//                         </SelectItem>
//                         <SelectItem value="yahoo">Yahoo</SelectItem>
//                         <SelectItem value="custom">Custom / Other</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   )}
//                 />
//                 {errors.mailProvider && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.mailProvider.message)}
//                   </p>
//                 )}
//               </div>

//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="smtpHost"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   SMTP Host <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="smtpHost"
//                   placeholder="smtp.gmail.com"
//                   {...register('smtpHost', {
//                     required: 'SMTP Host is required.',
//                   })}
//                   className={`h-9 text-sm ${errors.smtpHost
//                     ? 'border-red-500 focus-visible:ring-red-500/40'
//                     : ''
//                     }`}
//                 />
//                 {errors.smtpHost && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.smtpHost.message)}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="grid gap-1.5 pt-2 md:max-w-xs">
//               <Label
//                 htmlFor="smtpPort"
//                 className="text-xs font-medium text-slate-700 dark:text-slate-200"
//               >
//                 SMTP Port <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="smtpPort"
//                 type="number"
//                 placeholder="587"
//                 {...register('smtpPort', {
//                   required: 'SMTP Port is required.',
//                 })}
//                 className={`h-9 text-sm ${errors.smtpPort
//                   ? 'border-red-500 focus-visible:ring-red-500/40'
//                   : ''
//                   }`}
//               />
//               {errors.smtpPort && (
//                 <p className="text-[11px] text-red-500">
//                   {String(errors.smtpPort.message)}
//                 </p>
//               )}
//               <p className="text-[10px] text-slate-500 dark:text-slate-400">
//                 Common ports: <strong>587</strong> (TLS), <strong>465</strong>{' '}
//                 (SSL), <strong>25</strong> (Plain / Relay).
//               </p>
//             </div>
//           </div>

//           {/* Security section */}
//           <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                 Authentication &amp; Security
//               </p>
//               <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                 Use an app password wherever possible. Avoid storing real
//                 account passwords.
//               </p>
//             </div>

//             <div className="grid gap-4 pt-2 md:grid-cols-2">
//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="appPassword"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   App Password <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="appPassword"
//                   type="password"
//                   placeholder="•••• •••• •••• ••••"
//                   {...register('appPassword', {
//                     required: 'App Password is required.',
//                   })}
//                   className={`h-9 text-sm ${errors.appPassword
//                     ? 'border-red-500 focus-visible:ring-red-500/40'
//                     : ''
//                     }`}
//                 />
//                 {errors.appPassword && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.appPassword.message)}
//                   </p>
//                 )}
//               </div>

//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="password"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   Account Password (optional / legacy)
//                 </Label>
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Leave blank if using app password only"
//                   {...register('password')}
//                   className="h-9 text-sm"
//                 />
//                 <p className="text-[10px] text-slate-500 dark:text-slate-400">
//                   For security, prefer app passwords instead of account
//                   passwords.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </form>

//         {/* Footer */}
//         <DialogFooter className="rounded-b-2xl border-t border-slate-200/70 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
//           <div className="flex w-full items-center justify-between gap-3">
//             <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
//               Changes apply to all outgoing system emails once saved.
//             </p>
//             <div className="flex gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 disabled={isSubmitting}
//                 className="h-8 px-3 text-xs"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 form="mail-config-form"
//                 disabled={isSubmitting}
//                 className="h-8 px-4 text-xs text-white"
//               >
//                 {defaultValues?.id
//                   ? 'Update Configuration'
//                   : 'Save Configuration'}
//               </Button>
//             </div>
//           </div>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // src/routes/_authenticated/admin/smtp-mail-conf.tsx
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// // @ts-nocheck
// import { useEffect, useState, useCallback } from 'react'
// import { Controller, useForm } from 'react-hook-form'
// import { createFileRoute } from '@tanstack/react-router'
// import LoadingBar from 'react-top-loading-bar'
// import { toast } from 'sonner'
// import { IconMessage, IconMail, IconStar, IconStarFilled } from '@tabler/icons-react'

// import { Badge } from '@/components/ui/badge.tsx'
// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select.tsx'

// const backendUrl = import.meta.env.VITE_APP_API_URL

// export const Route = createFileRoute('/_authenticated/admin/smtp-mail-conf')({
//   component: RouteComponent,
// })

// type MailConfig = {
//   id?: number
//   fromMailId: string
//   appPassword: string
//   password?: string
//   mailProvider: string
//   smtpHost: string
//   smtpPort: number
//   isActive?: boolean
// }

// type MailConfigForm = {
//   id?: number
//   fromMailId: string
//   appPassword: string
//   password?: string
//   mailProvider: string
//   smtpHost: string
//   smtpPort: string | number
// }

// type ApiResponse<T> = {
//   status?: string
//   message?: string
//   data?: T
// }

// function RouteComponent() {
//   const [progress, setProgress] = useState(0)
//   const [loading, setLoading] = useState(false)

//   const [configList, setConfigList] = useState<MailConfig[]>([])
//   const [config, setConfig] = useState<MailConfig | null>(null)

//   const [isFormOpen, setFormOpen] = useState(false)
//   const [formDefaultValues, setFormDefaultValues] =
//     useState<MailConfigForm | undefined>(undefined)

//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [deleteTarget, setDeleteTarget] = useState<MailConfig | null>(null)

//   const token = sessionStorage.getItem('token') || ''

//   // ======== Helpers for progress bar ========
//   const startLoading = () => {
//     setLoading(true)
//     setProgress(35)
//   }
//   const finishLoading = () => {
//     setProgress(100)
//     setTimeout(() => {
//       setProgress(0)
//       setLoading(false)
//     }, 400)
//   }

//   // ======== Fetch all configurations ========
//   // cURL:
//   // curl -X 'GET' 'http://localhost:8087/mail/all' -H 'accept: */*'
//   const fetchAllConfigs = useCallback(async () => {
//     try {
//       startLoading()
//       const res = await fetch(`${backendUrl}/mail/all`, {
//         headers: {
//           Accept: '*/*',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       })

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<MailConfig[]>
//         | MailConfig[]
//         | null

//       if (!res.ok) {
//         const message =
//           (json as ApiResponse<MailConfig[]>)?.message ||
//           'Failed to load configurations'
//         toast.error(message)
//         setConfigList([])
//         setConfig(null)
//         return
//       }

//       let list: MailConfig[] = []

//       if (json && Array.isArray(json)) {
//         list = json
//       } else if (json && 'data' in json && Array.isArray(json.data)) {
//         list = json.data
//       }

//       if (!list.length) {
//         setConfigList([])
//         setConfig(null)
//         return
//       }

//       setConfigList(list)
//       const active =
//         list.find((c) => c.isActive) ??
//         list[0] ??
//         null
//       setConfig(active)
//     } catch (e) {
//       toast.error(
//         (e as Error).message || 'Unable to load mail configurations'
//       )
//       setConfigList([])
//       setConfig(null)
//     } finally {
//       finishLoading()
//     }
//   }, [token])

//   useEffect(() => {
//     void fetchAllConfigs()
//   }, [fetchAllConfigs])

//   // ======== Delete configuration ========
//   // cURL:
//   // curl -X 'DELETE' 'http://localhost:8087/mail/configuration/4'
//   //   -H 'accept: */*'
//   //   -H 'Authorization: Bearer <token>'
//   const handleDelete = async () => {
//     if (!deleteTarget?.id) {
//       toast.error('No configuration selected to delete')
//       return
//     }
//     try {
//       startLoading()
//       const res = await fetch(
//         `${backendUrl}/mail/configuration/${deleteTarget.id}`,
//         {
//           method: 'DELETE',
//           headers: {
//             Accept: '*/*',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//         }
//       )

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<unknown>
//         | null

//       if (!res.ok || (json?.status && json.status !== 'SUCCESS')) {
//         const message =
//           json?.message || 'Failed to delete configuration'
//         throw new Error(message)
//       }

//       toast.success(json?.message || 'Mail configuration deleted')
//       setDeleteDialogOpen(false)
//       setDeleteTarget(null)

//       // If the deleted one was currently visible, clear / switch
//       setConfig((prev) =>
//         prev?.id === deleteTarget.id ? null : prev
//       )

//       void fetchAllConfigs()
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to delete configuration')
//     } finally {
//       finishLoading()
//     }
//   }

//   // ======== Status change (Set Active) ========
//   // cURL:
//   // curl -X 'PATCH' 'http://localhost:8087/mail/update-status/3?isActive=true'
//   //   -H 'accept: */*'
//   //   -H 'Authorization: Bearer <token>'
//   const handleSetActive = async (cfg: MailConfig) => {
//     if (!cfg.id) return
//     try {
//       startLoading()
//       const res = await fetch(
//         `${backendUrl}/mail/update-status/${cfg.id}?isActive=true`,
//         {
//           method: 'PATCH',
//           headers: {
//             Accept: '*/*',
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//         }
//       )

//       const json = (await res.json().catch(() => null)) as
//         | ApiResponse<MailConfig>
//         | null

//       if (!res.ok || (json?.status && json.status !== 'SUCCESS')) {
//         const message =
//           json?.message || 'Failed to update active status'
//         throw new Error(message)
//       }

//       toast.success(json?.message || 'Configuration marked as active')

//       void fetchAllConfigs()
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to update status')
//     } finally {
//       finishLoading()
//     }
//   }

//   // ======== open Form in create / edit mode ========
//   const openCreate = () => {
//     setFormDefaultValues(undefined)
//     setFormOpen(true)
//   }

//   const openEdit = (cfg?: MailConfig | null) => {
//     const base = cfg ?? config
//     if (!base) {
//       toast.error('No configuration to edit')
//       return
//     }
//     setFormDefaultValues({
//       id: base.id,
//       fromMailId: base.fromMailId,
//       appPassword: base.appPassword,
//       password: base.password ?? '',
//       mailProvider: base.mailProvider,
//       smtpHost: base.smtpHost,
//       smtpPort: base.smtpPort,
//     })
//     setFormOpen(true)
//   }

//   // When form successfully saves
//   const handleFormSuccess = (saved: MailConfig) => {
//     setFormOpen(false)
//     setConfig(saved)
//     void fetchAllConfigs()
//     toast.success('Configuration saved')
//   }

//   return (
//     <>
//       <LoadingBar
//         progress={progress}
//         className="h-1"
//         color="#2563eb"
//         onLoaderFinished={() => setProgress(0)}
//       />

//       <div className="mx-auto flex flex-col gap-6 p-4 md:p-6">
//         {/* Header */}
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
//               SMTP Mail Configuration
//             </h1>
//             <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
//               Manage all SMTP profiles used for system notifications, OTPs, and alerts.
//             </p>
//           </div>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={openCreate}
//             className="h-9 rounded-full border-sky-500/70 px-4 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50 dark:border-sky-400/70 dark:text-sky-200 dark:hover:bg-sky-900/60"
//           >
//             New Configuration
//           </Button>
//         </div>

//         {/* All configurations list */}
//         <div className="rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <div>
//               <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
//                 All SMTP Configurations
//               </h2>
//               <p className="text-xs text-slate-500 dark:text-slate-400">
//                 Click a profile to view details, set it active, or edit.
//               </p>
//             </div>
//             <span className="text-[11px] text-slate-500 dark:text-slate-400">
//               Total: <span className="font-semibold">{configList.length}</span>
//             </span>
//           </div>

//           {configList.length === 0 ? (
//             <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
//               No configurations found. Create a new SMTP profile to start sending emails.
//             </div>
//           ) : (
//             <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//               {configList.map((cfg) => {
//                 const isSelected = cfg.id && cfg.id === config?.id
//                 const isActive = cfg.isActive

//                 return (
//                   <button
//                     key={cfg.id}
//                     type="button"
//                     onClick={() => setConfig(cfg)}
//                     className={[
//                       'group flex flex-col items-stretch rounded-xl border px-3 py-3 text-left text-xs shadow-sm transition-all',
//                       'hover:border-sky-400 hover:bg-sky-50/70 dark:hover:border-sky-500 dark:hover:bg-slate-800/80',
//                       isSelected
//                         ? 'border-sky-500 bg-sky-50/70 dark:border-sky-400 dark:bg-slate-800'
//                         : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70',
//                     ].join(' ')}
//                   >
//                     <div className="flex items-start justify-between gap-2">
//                       <div className="flex items-center gap-2">
//                         <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
//                           <IconMail className="h-3.5 w-3.5" />
//                         </span>
//                         <div className="flex flex-col">
//                           <span className="line-clamp-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
//                             {cfg.fromMailId}
//                           </span>
//                           <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                             {cfg.mailProvider || '—'}
//                           </span>
//                         </div>
//                       </div>
//                       {isActive ? (
//                         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
//                           <IconStarFilled className="h-3 w-3" /> Active
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
//                           <IconStar className="h-3 w-3" /> Inactive
//                         </span>
//                       )}
//                     </div>

//                     <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
//                       <span className="line-clamp-1">
//                         Host:{' '}
//                         <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-800">
//                           {cfg.smtpHost}:{cfg.smtpPort}
//                         </code>
//                       </span>
//                     </div>

//                     <div className="mt-3 flex items-center justify-between gap-2">
//                       <div className="flex gap-1">
//                         {!isActive && cfg.id && (
//                           <Button
//                             type="button"
//                             size="xs"
//                             variant="outline"
//                             className="h-6 rounded-full px-2 text-[10px]"
//                             onClick={(e) => {
//                               e.stopPropagation()
//                               void handleSetActive(cfg)
//                             }}
//                             disabled={loading}
//                           >
//                             Make Active
//                           </Button>
//                         )}
//                         <Button
//                           type="button"
//                           size="xs"
//                           variant="outline"
//                           className="h-6 rounded-full px-2 text-[10px]"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             openEdit(cfg)
//                           }}
//                         >
//                           Edit
//                         </Button>
//                       </div>
//                       {cfg.id && (
//                         <Button
//                           type="button"
//                           size="xs"
//                           variant="ghost"
//                           className="h-6 px-2 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             setDeleteTarget(cfg)
//                             setDeleteDialogOpen(true)
//                           }}
//                         >
//                           Delete
//                         </Button>
//                       )}
//                     </div>
//                   </button>
//                 )
//               })}
//             </div>
//           )}
//         </div>

//         {/* Main selected config card */}
//         <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
//           {/* Card header */}
//           <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
//             <div className="flex items-center gap-3">
//               <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 text-white shadow-md">
//                 <IconMessage className="h-6 w-6" />
//               </div>
//               <div>
//                 <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
//                   Selected SMTP Profile
//                 </h2>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   {config
//                     ? 'This configuration is currently selected for viewing and editing.'
//                     : 'Select a configuration above or create a new one.'}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <Badge
//                 variant={config ? 'default' : 'outline'}
//                 className={
//                   config
//                     ? 'rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
//                     : 'rounded-full border-slate-400 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300'
//                 }
//               >
//                 {config ? (config.isActive ? 'Active Profile' : 'Configured') : 'Not Configured'}
//               </Badge>
//             </div>
//           </div>

//           {config ? (
//             <>
//               {/* Details */}
//               <div className="grid gap-6 border-b border-slate-200 px-6 py-5 text-sm dark:border-slate-800 md:grid-cols-2">
//                 <div className="space-y-4">
//                   <ConfigRow label="From Email">
//                     <span className="font-medium text-sky-700 dark:text-sky-300">
//                       {config.fromMailId}
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="Mail Provider">
//                     <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
//                       {config.mailProvider || '—'}
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="SMTP Host">
//                     <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
//                       {config.smtpHost}
//                     </code>
//                   </ConfigRow>
//                   <ConfigRow label="SMTP Port">
//                     <span>{config.smtpPort}</span>
//                   </ConfigRow>
//                 </div>

//                 <div className="space-y-4">
//                   <ConfigRow label="Authentication">
//                     <span className="text-xs text-slate-500 dark:text-slate-400">
//                       Using App Password
//                     </span>
//                   </ConfigRow>
//                   <ConfigRow label="App Password">
//                     <span className="text-xs tracking-[0.2em] text-slate-500 dark:text-slate-400">
//                       ●●●● ●●●● ●●●● ●●●●
//                     </span>
//                   </ConfigRow>
//                   {config.id && (
//                     <ConfigRow label="Configuration ID">
//                       <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
//                         #{config.id}
//                       </span>
//                     </ConfigRow>
//                   )}
//                 </div>
//               </div>

//               {/* Actions / helper */}
//               <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
//                 <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
//                   <span>
//                     Tip: For Gmail use{' '}
//                     <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
//                       smtp.gmail.com : 587
//                     </code>{' '}
//                     with TLS and a Google app password.
//                   </span>
//                   <span className="hidden sm:inline">
//                     After editing, send a test email from your application to verify connectivity.
//                   </span>
//                 </div>
//                 <div className="flex gap-2">
//                   {config.id && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setDeleteTarget(config)
//                         setDeleteDialogOpen(true)
//                       }}
//                       className="h-8 rounded-full px-3 text-xs"
//                     >
//                       Delete
//                     </Button>
//                   )}
//                   <Button
//                     size="sm"
//                     onClick={() => openEdit(config)}
//                     className="h-8 rounded-full px-4 text-xs font-medium text-white"
//                   >
//                     Edit Configuration
//                   </Button>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
//               <p className="text-base font-medium text-slate-900 dark:text-slate-100">
//                 No SMTP configuration selected.
//               </p>
//               <p className="mt-1 max-w-md text-[11px]">
//                 Select an existing profile from the list above or create a new configuration with your
//                 email provider&apos;s SMTP details.
//               </p>
//               <Button
//                 className="mt-4 h-9 rounded-full px-4 text-xs font-medium text-white"
//                 size="sm"
//                 onClick={openCreate}
//               >
//                 Create Configuration
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Create / Edit dialog */}
//       <MailConfigFormDialog
//         open={isFormOpen}
//         onOpenChange={setFormOpen}
//         defaultValues={formDefaultValues}
//         onSuccess={handleFormSuccess}
//       />

//       {/* Delete confirm dialog */}
//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Delete Mail Configuration</DialogTitle>
//             <DialogDescription>
//               This action cannot be undone. The system may not be able to send emails using this
//               profile once deleted.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="mt-4">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setDeleteDialogOpen(false)
//                 setDeleteTarget(null)
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={() => void handleDelete()}
//             >
//               Delete
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }

// function ConfigRow({
//   label,
//   children,
// }: {
//   label: string
//   children: React.ReactNode
// }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
//         {label}
//       </span>
//       <div className="text-sm text-gray-900 dark:text-gray-100">{children}</div>
//     </div>
//   )
// }

// /* =============================
//    MailConfigFormDialog
// ============================= */

// interface MailConfigFormDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSuccess: (saved: MailConfig) => void
//   defaultValues?: MailConfigForm
// }

// function MailConfigFormDialog({
//   open,
//   onOpenChange,
//   onSuccess,
//   defaultValues,
// }: MailConfigFormDialogProps) {
//   const token = sessionStorage.getItem('token') || ''

//   const {
//     register,
//     handleSubmit,
//     control,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<MailConfigForm>({
//     defaultValues: defaultValues ?? {
//       fromMailId: '',
//       appPassword: '',
//       password: '',
//       mailProvider: 'gmail',
//       smtpHost: 'smtp.gmail.com',
//       smtpPort: 587,
//     },
//   })

//   useEffect(() => {
//     if (open) {
//       reset(
//         defaultValues ?? {
//           fromMailId: '',
//           appPassword: '',
//           password: '',
//           mailProvider: 'gmail',
//           smtpHost: 'smtp.gmail.com',
//           smtpPort: 587,
//         }
//       )
//     }
//   }, [open, defaultValues, reset])

//   const onSubmit = handleSubmit(async (values) => {
//     // payload restricted exactly to:
//     // fromMailId, appPassword, password, mailProvider, smtpHost, smtpPort
//     const body: MailConfig = {
//       fromMailId: values.fromMailId.trim(),
//       appPassword: values.appPassword.trim(),
//       password: (values.password || '').trim(),
//       mailProvider: values.mailProvider,
//       smtpHost: values.smtpHost.trim(),
//       smtpPort: Number(values.smtpPort),
//     }

//     try {
//       if (values.id) {
//         // UPDATE
//         // cURL:
//         // curl -X 'PUT' 'http://localhost:8087/mail/update/1'
//         const res = await fetch(`${backendUrl}/mail/update/${values.id}`, {
//           method: 'PUT',
//           headers: {
//             Accept: '*/*',
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(body),
//         })

//         const json = (await res.json().catch(() => null)) as
//           | ApiResponse<MailConfig>
//           | MailConfig
//           | null

//         if (!res.ok) {
//           const message =
//             (json as ApiResponse<MailConfig>)?.message ||
//             'Failed to update configuration'
//           throw new Error(message)
//         }

//         const saved: MailConfig =
//           json && 'data' in (json as ApiResponse<MailConfig>)
//             ? (json as ApiResponse<MailConfig>).data!
//             : (json as MailConfig)

//         onSuccess({ ...saved, id: values.id })
//       } else {
//         // CREATE
//         // cURL:
//         // curl --location 'http://localhost:8087/mail-configuration/configure'
//         const res = await fetch(
//           `${backendUrl}/mail/configure`,
//           {
//             method: 'POST',
//             headers: {
//               Accept: '*/*',
//               'Content-Type': 'application/json',
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             body: JSON.stringify(body),
//           }
//         )

//         const json = (await res.json().catch(() => null)) as
//           | ApiResponse<MailConfig>
//           | MailConfig
//           | null

//         if (!res.ok || ((json as ApiResponse<MailConfig>)?.status && (json as ApiResponse<MailConfig>).status !== 'SUCCESS')) {
//           const message =
//             (json as ApiResponse<MailConfig>)?.message ||
//             'Failed to create configuration'
//           throw new Error(message)
//         }

//         const saved: MailConfig =
//           json && 'data' in (json as ApiResponse<MailConfig>)
//             ? (json as ApiResponse<MailConfig>).data!
//             : (json as MailConfig)

//         onSuccess(saved)
//       }
//     } catch (e) {
//       toast.error((e as Error).message || 'Unable to save configuration')
//     }
//   })

//   const title = defaultValues?.id
//     ? 'Edit SMTP Mail Configuration'
//     : 'New SMTP Mail Configuration'

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/70 bg-background p-0 shadow-2xl sm:max-w-xl dark:border-slate-800 dark:bg-slate-950">
//         {/* Gradient header */}
//         <DialogHeader className="relative overflow-hidden border-b border-slate-200/60 px-6 py-5 dark:border-slate-800">
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-fuchsia-500/15 dark:from-sky-500/25 dark:via-indigo-500/20 dark:to-fuchsia-500/25" />
//           <div className="relative flex flex-col gap-1.5">
//             <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
//               {title}
//             </DialogTitle>
//             <DialogDescription className="text-[11px] text-slate-600 dark:text-slate-300">
//               Enter the SMTP settings of the email account that will send system mails.
//               For Gmail, enable 2FA and use an app password.
//             </DialogDescription>
//           </div>
//         </DialogHeader>

//         {/* Scrollable content */}
//         <form
//           id="mail-config-form"
//           onSubmit={onSubmit}
//           className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5"
//         >
//           {/* Sender section */}
//           <div className="mt-1 space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
//             <div className="flex items-center justify-between gap-2">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                   Sender Identity
//                 </p>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   This address will appear in the{' '}
//                   <span className="font-medium">From</span> field of outgoing emails.
//                 </p>
//               </div>
//             </div>

//             <div className="mt-3 grid gap-1.5">
//               <Label
//                 htmlFor="fromMailId"
//                 className="text-xs font-medium text-slate-700 dark:text-slate-200"
//               >
//                 From Email ID <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="fromMailId"
//                 type="email"
//                 placeholder="you@example.com"
//                 {...register('fromMailId', {
//                   required: 'From Email is required.',
//                 })}
//                 className={`h-9 text-sm ${
//                   errors.fromMailId
//                     ? 'border-red-500 focus-visible:ring-red-500/40'
//                     : ''
//                 }`}
//               />
//               {errors.fromMailId && (
//                 <p className="text-[11px] text-red-500">
//                   {String(errors.fromMailId.message)}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Server section */}
//           <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
//             <div className="flex items-center justify-between gap-2">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                   Server Details
//                 </p>
//                 <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                   Choose your provider and specify the SMTP host and port.
//                 </p>
//               </div>
//             </div>

//             <div className="grid gap-4 pt-2 md:grid-cols-2">
//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="mailProvider"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   Mail Provider <span className="text-red-500">*</span>
//                 </Label>
//                 <Controller
//                   name="mailProvider"
//                   control={control}
//                   rules={{ required: 'Mail Provider is required.' }}
//                   render={({ field }) => (
//                     <Select value={field.value} onValueChange={field.onChange}>
//                       <SelectTrigger
//                         id="mailProvider"
//                         className={`h-9 text-xs ${
//                           errors.mailProvider
//                             ? 'border-red-500 focus-visible:ring-red-500/40'
//                             : ''
//                         }`}
//                       >
//                         <SelectValue placeholder="Select provider" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="gmail">Gmail</SelectItem>
//                         <SelectItem value="outlook">
//                           Outlook / Office 365
//                         </SelectItem>
//                         <SelectItem value="yahoo">Yahoo</SelectItem>
//                         <SelectItem value="custom">Custom / Other</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   )}
//                 />
//                 {errors.mailProvider && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.mailProvider.message)}
//                   </p>
//                 )}
//               </div>

//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="smtpHost"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   SMTP Host <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="smtpHost"
//                   placeholder="smtp.gmail.com"
//                   {...register('smtpHost', {
//                     required: 'SMTP Host is required.',
//                   })}
//                   className={`h-9 text-sm ${
//                     errors.smtpHost
//                       ? 'border-red-500 focus-visible:ring-red-500/40'
//                       : ''
//                   }`}
//                 />
//                 {errors.smtpHost && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.smtpHost.message)}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="grid gap-1.5 pt-2 md:max-w-xs">
//               <Label
//                 htmlFor="smtpPort"
//                 className="text-xs font-medium text-slate-700 dark:text-slate-200"
//               >
//                 SMTP Port <span className="text-red-500">*</span>
//               </Label>
//               <Input
//                 id="smtpPort"
//                 type="number"
//                 placeholder="587"
//                 {...register('smtpPort', {
//                   required: 'SMTP Port is required.',
//                 })}
//                 className={`h-9 text-sm ${
//                   errors.smtpPort
//                     ? 'border-red-500 focus-visible:ring-red-500/40'
//                     : ''
//                 }`}
//               />
//               {errors.smtpPort && (
//                 <p className="text-[11px] text-red-500">
//                   {String(errors.smtpPort.message)}
//                 </p>
//               )}
//               <p className="text-[10px] text-slate-500 dark:text-slate-400">
//                 Common ports: <strong>587</strong> (TLS), <strong>465</strong>{' '}
//                 (SSL), <strong>25</strong> (Plain / Relay).
//               </p>
//             </div>
//           </div>

//           {/* Security section */}
//           <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
//                 Authentication &amp; Security
//               </p>
//               <p className="text-[11px] text-slate-500 dark:text-slate-400">
//                 Use an app password wherever possible. Avoid storing real
//                 account passwords.
//               </p>
//             </div>

//             <div className="grid gap-4 pt-2 md:grid-cols-2">
//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="appPassword"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   App Password <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="appPassword"
//                   type="password"
//                   placeholder="•••• •••• •••• ••••"
//                   {...register('appPassword', {
//                     required: 'App Password is required.',
//                   })}
//                   className={`h-9 text-sm ${
//                     errors.appPassword
//                       ? 'border-red-500 focus-visible:ring-red-500/40'
//                       : ''
//                   }`}
//                 />
//                 {errors.appPassword && (
//                   <p className="text-[11px] text-red-500">
//                     {String(errors.appPassword.message)}
//                   </p>
//                 )}
//               </div>

//               <div className="grid gap-1.5">
//                 <Label
//                   htmlFor="password"
//                   className="text-xs font-medium text-slate-700 dark:text-slate-200"
//                 >
//                   Account Password (optional / legacy)
//                 </Label>
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Leave blank if using app password only"
//                   {...register('password')}
//                   className="h-9 text-sm"
//                 />
//                 <p className="text-[10px] text-slate-500 dark:text-slate-400">
//                   For security, prefer app passwords instead of account
//                   passwords.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </form>

//         {/* Footer */}
//         <DialogFooter className="rounded-b-2xl border-t border-slate-200/70 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
//           <div className="flex w-full items-center justify-between gap-3">
//             <p className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">
//               Changes apply to all outgoing system emails once saved.
//             </p>
//             <div className="flex gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 disabled={isSubmitting}
//                 className="h-8 px-3 text-xs"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 form="mail-config-form"
//                 disabled={isSubmitting}
//                 className="h-8 px-4 text-xs text-white"
//               >
//                 {defaultValues?.id
//                   ? 'Update Configuration'
//                   : 'Save Configuration'}
//               </Button>
//             </div>
//           </div>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
