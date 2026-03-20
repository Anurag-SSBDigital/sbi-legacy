/* src/features/security/SecurityDetailsSection.tsx */

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { $api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PaginatedTable from '@/components/paginated-table'

import {
    SecurityDetail,
    SecurityRow,
    extractArray,
    inList,
    isRecord,
    toSecurityRows,
} from './security-helpers'

type Props = {
    accountNo: string
    title?: string
    onChanged?: () => void
}

const DEFAULT_SECURITY_VALUES: SecurityDetail = {
    collateralNumber: '',
    addressDetailsOfSecurity: '',
    securityType: '',
    customSecurityType: '',

    collateralDescription: '',
    marketValue: 0,
    realizableValue: 0,
    valuationDate: '',
}

function toNum(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
        const n = Number(v)
        return Number.isFinite(n) ? n : 0
    }
    return 0
}

export default function SecurityDetailsSection({
    accountNo,
    title = 'Security Details',
    onChanged,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isEditSecurity, setIsEditSecurity] = useState(false)
    const [editSecurityId, setEditSecurityId] = useState<string | null>(null)

    const form = useForm<SecurityDetail>({
        defaultValues: DEFAULT_SECURITY_VALUES,
    })

    /* ---------------- Fetch Security details (table) ---------------- */
    const { data, refetch } = $api.useQuery(
        'get',
        '/legal/security-details/account/{accountNo}',
        { params: { path: { accountNo } } }
    )

    const transformedData: SecurityRow[] = useMemo(() => toSecurityRows(data), [data])

    /* ---------------- Security Types lookup ---------------- */
    const { data: securityTypeResp, isLoading: isSecurityTypeLoading } =
        $api.useQuery('get', '/legal-securityType/all', {})

    const securityTypeOptions = useMemo<string[]>(() => {
        return extractArray(securityTypeResp)
            .map((x) => (isRecord(x) && typeof x.securityType === 'string' ? x.securityType : null))
            .filter((x): x is string => !!x)
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    }, [securityTypeResp])

    /* ---------------- Mutations ---------------- */
    const createSecurityMutation = $api.useMutation('post', '/legal/security-details/create', {
        onSuccess: () => {
            toast.success('Security detail added.')
            setDialogOpen(false)
            setIsEditSecurity(false)
            setEditSecurityId(null)
            form.reset(DEFAULT_SECURITY_VALUES)
            refetch()
            onChanged?.()
        },
        onError: () => toast.error('Failed to create security detail.'),
    })

    const updateSecurityMutation = $api.useMutation('put', '/legal/security-details/update/{id}', {
        onSuccess: () => {
            toast.success('Security detail updated.')
            setDialogOpen(false)
            setIsEditSecurity(false)
            setEditSecurityId(null)
            form.reset(DEFAULT_SECURITY_VALUES)
            refetch()
            onChanged?.()
        },
        onError: () => toast.error('Failed to update security detail.'),
    })

    const onSubmitSecurity = (values: SecurityDetail) => {
        const token = sessionStorage.getItem('token') || ''

        const finalSecurityType =
            values.securityType === 'Other' && values.customSecurityType
                ? values.customSecurityType.trim()
                : values.securityType

        // ✅ only send what you asked (no ownerName, no lastTitleInvestigationDate)
        const payload = {
            collateralNumber: values.collateralNumber,
            addressDetailsOfSecurity: values.addressDetailsOfSecurity,
            securityType: finalSecurityType,
            accountNo,
            lastTitleInvestigationDate: '',
            ownerName: '',
            collateralDescription: values.collateralDescription,
            marketValue: values.marketValue,
            realizableValue: values.realizableValue,
            valuationDate: values.valuationDate,
        }

        if (isEditSecurity && editSecurityId) {
            updateSecurityMutation.mutate({
                body: payload,
                params: {
                    path: { id: Number(editSecurityId) },
                    header: { Authorization: `Bearer ${token}` },
                },
            })
        } else {
            createSecurityMutation.mutate({
                body: payload,
                params: { header: { Authorization: `Bearer ${token}` } },
            })
        }
    }

    /* ---------------- Edit handler ---------------- */
    const handleEditSecurity = (row: SecurityRow) => {
        if (typeof row?.id !== 'number') return

        const apiVal = row.securityType ?? ''
        const isKnown = inList(apiVal, securityTypeOptions)

        form.reset(
            {
                ...DEFAULT_SECURITY_VALUES,
                collateralNumber: row.collateralNo ?? '',
                addressDetailsOfSecurity: row.address ?? '',
                securityType: isKnown ? apiVal : 'Other',
                customSecurityType: isKnown ? '' : apiVal,
                collateralDescription: row.collateralDescription ?? '',
                marketValue: Number.isFinite(row.marketValue) ? row.marketValue : 0,
                realizableValue: Number.isFinite(row.realizableValue) ? row.realizableValue : 0,
                valuationDate: row.valuationDate ?? '',
            },
            { keepDefaultValues: true }
        )

        setIsEditSecurity(true)
        setEditSecurityId(String(row.id))
        setDialogOpen(true)
    }

    const resetForAdd = () => {
        setIsEditSecurity(false)
        setEditSecurityId(null)
        form.reset(DEFAULT_SECURITY_VALUES)
    }

    /* ---------------- default security type once options arrive ---------------- */
    useEffect(() => {
        const current = form.getValues('securityType')
        if (!current && securityTypeOptions.length) {
            form.setValue('securityType', securityTypeOptions[0])
        }
    }, [securityTypeOptions, form])

    return (
        <>
            <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-2xl font-bold tracking-tight text-primary dark:text-gray-100'>
                    {title}
                </h2>

                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open)

                        // ✅ when closing, clear edit state + reset
                        if (!open) {
                            setIsEditSecurity(false)
                            setEditSecurityId(null)
                            form.reset(DEFAULT_SECURITY_VALUES)
                        }
                    }}
                >
                    <DialogTrigger asChild>
                        <Button onClick={resetForAdd}>Add Security</Button>
                    </DialogTrigger>

                    {/* ✅ Scrollable dialog */}
                    <DialogContent className='p-0 w-[calc(100vw-1.5rem)] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden'>
                        <div className='flex max-h-[90vh] flex-col'>
                            {/* Header */}
                            <div className='relative border-b bg-gradient-to-br from-background via-muted/30 to-background px-6 py-4'>
                                <div className='pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl' />
                                <DialogHeader className='relative space-y-1'>
                                    <DialogTitle className='text-xl font-semibold tracking-tight'>
                                        {isEditSecurity ? 'Edit Security Detail' : 'Add Security Detail'}
                                    </DialogTitle>
                                    <p className='text-xs text-muted-foreground'>
                                        Fill security details manually and save.
                                    </p>
                                </DialogHeader>
                            </div>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmitSecurity)}
                                    className='flex min-h-0 flex-1 flex-col'
                                >
                                    {/* Body (scrollable) */}
                                    <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
                                        {/* ✅ Everything 2-column grid */}
                                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                            {/* Collateral Number */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='collateralNumber'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Collateral No <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input {...field} placeholder='e.g. 12' required />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Valuation Date */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='valuationDate'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Valuation Date <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input {...field} type='date' required />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='addressDetailsOfSecurity'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Address <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input {...field} placeholder='Full address' required />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Collateral Description (full width) */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='collateralDescription'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Collateral Description <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input {...field} placeholder='e.g. Land + building details' required />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Security Type */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='securityType'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Security Type <span className='text-destructive'>*</span>
                                                            </label>

                                                            <FormControl>
                                                                <div className='space-y-3'>
                                                                    <Select
                                                                        onValueChange={(v) => {
                                                                            field.onChange(v)
                                                                            if (v !== 'Other') form.setValue('customSecurityType', '')
                                                                        }}
                                                                        value={String(field.value ?? '')}
                                                                        disabled={isSecurityTypeLoading}
                                                                    >
                                                                        <SelectTrigger className='w-full'>
                                                                            <SelectValue
                                                                                placeholder={isSecurityTypeLoading ? 'Loading…' : 'Select type'}
                                                                            />
                                                                        </SelectTrigger>
                                                                        <SelectContent className='max-h-72'>
                                                                            {securityTypeOptions.map((opt) => (
                                                                                <SelectItem key={opt} value={opt}>
                                                                                    {opt}
                                                                                </SelectItem>
                                                                            ))}
                                                                            <SelectItem value='Other'>Other</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {field.value === 'Other' && (
                                                                        <FormField
                                                                            control={form.control}
                                                                            name='customSecurityType'
                                                                            render={({ field: customField }) => (
                                                                                <Input {...customField} placeholder='Type security type' />
                                                                            )}
                                                                        />
                                                                    )}

                                                                    <div className='rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
                                                                        Tip: Choose “Other” only if the type is not available in the list.
                                                                    </div>
                                                                </div>
                                                            </FormControl>

                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Market Value */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='marketValue'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Market Value <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input
                                                                    type='number'
                                                                    inputMode='numeric'
                                                                    value={String(field.value ?? 0)}
                                                                    onChange={(e) => field.onChange(toNum(e.target.value))}
                                                                    required
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Realizable Value */}
                                            <div className='rounded-xl border bg-card p-4 shadow-sm'>
                                                <FormField
                                                    control={form.control}
                                                    name='realizableValue'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <label className='text-sm font-medium text-foreground'>
                                                                Realizable Value <span className='text-destructive'>*</span>
                                                            </label>
                                                            <FormControl>
                                                                <Input
                                                                    type='number'
                                                                    inputMode='numeric'
                                                                    value={String(field.value ?? 0)}
                                                                    onChange={(e) => field.onChange(toNum(e.target.value))}
                                                                    required
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className='shrink-0 border-t bg-background/80 px-6 py-4 backdrop-blur'>
                                        <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
                                            <Button
                                                type='button'
                                                variant='outline'
                                                onClick={() => setDialogOpen(false)}
                                                className='sm:min-w-[110px]'
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                type='submit'
                                                className='sm:min-w-[160px] shadow-sm'
                                                disabled={createSecurityMutation.isPending || updateSecurityMutation.isPending}
                                            >
                                                {isEditSecurity ? 'Update Security' : 'Save Security'}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <PaginatedTable
                data={transformedData}
                columns={[
                    { key: 'collateralNo', label: 'Collateral No' },
                    { key: 'securityType', label: 'Security Type' },
                    { key: 'valuationDate', label: 'Valuation Date' },
                    { key: 'marketValue', label: 'Market Value' },
                    { key: 'realizableValue', label: 'Realizable Value' },
                    {
                        key: 'collateralNo',
                        label: 'Actions',
                        render: (_, row) => (
                            <Button size='sm' variant='outline' onClick={() => handleEditSecurity(row as SecurityRow)}>
                                Edit
                            </Button>
                        ),
                    },
                ]}
                emptyMessage='No security details available.'
            />
        </>
    )
}