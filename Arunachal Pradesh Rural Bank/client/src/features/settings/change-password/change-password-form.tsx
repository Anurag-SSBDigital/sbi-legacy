import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { $api } from '@/lib/api.ts'
import { cn, toastError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

/* ------------------------------------------------------------------ */
/* 1. Validation schema                                               */
/* ------------------------------------------------------------------ */
const pwdRules = {
  length: { test: (v: string) => v.length >= 10, label: '≥ 10 characters' },
  number: { test: (v: string) => /\d/.test(v), label: 'At least one number' },
  special: {
    test: (v: string) => /[!@#$%^&*()[\]{}:;"'.,<>/?\\|`~\-+=]/.test(v),
    label: 'At least one special character',
  },
}

const changePwdSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password.'),
    newPassword: z
      .string()
      .min(10, 'Must be at least  10 characters.')
      .regex(/\d/, 'Must include at least one number.')
      .regex(
        /[!@#$%^&*()[\]{}:;"'.,<>/?\\|`~\-+=]/,
        'Must include at least one special character.'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ChangePwdValues = z.infer<typeof changePwdSchema>

/* ------------------------------------------------------------------ */
/* 2. Component                                                       */
/* ------------------------------------------------------------------ */
export function ChangePasswordForm() {
  const form = useForm<ChangePwdValues>({
    resolver: standardSchemaResolver(changePwdSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // 🔍 Watch the new password as it’s typed
  const newPwd = form.watch('newPassword', '')

  /* ----------------------------------------------------------------
     Derived helpers
  -----------------------------------------------------------------*/
  const checklist = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(pwdRules).map(([k, rule]) => [k, rule.test(newPwd)])
      ) as Record<keyof typeof pwdRules, boolean>,
    [newPwd]
  )

  const strength = useMemo(() => {
    const passed = Object.values(checklist).filter(Boolean).length
    switch (passed) {
      case 3:
        return { label: 'Strong', className: 'text-green-600' }
      case 2:
        return { label: 'Medium', className: 'text-yellow-600' }
      case 1:
        return { label: 'Weak', className: 'text-orange-600' }
      default:
        return { label: 'Very weak', className: 'text-red-600' }
    }
  }, [checklist])

  const changePasswordMutation = $api.useMutation(
    'put',
    '/user/update-password',
    {
      onSuccess() {
        toast.success('Password Changed Successfully.')
        form.reset()
      },
      onError(err) {
        toastError(err)
      },
    }
  )

  /* ----------------------------------------------------------------
     Submit handler
  -----------------------------------------------------------------*/
  function onSubmit(data: ChangePwdValues) {
    changePasswordMutation.mutate({
      params: { header: { Authorization: '' } },
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    })
  }

  /* ----------------------------------------------------------------
     Render
  -----------------------------------------------------------------*/
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='max-w-md space-y-8'
      >
        {/* Current password ------------------------------------------------ */}
        <FormField
          control={form.control}
          name='currentPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input
                  type='password'
                  autoComplete='current-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New password ---------------------------------------------------- */}
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type='password' autoComplete='new-password' {...field} />
              </FormControl>

              {/* Checklist */}
              <ul className='mt-2 space-y-1 text-sm'>
                {Object.entries(pwdRules).map(([k, rule]) => {
                  const ok = checklist[k as keyof typeof checklist]
                  const Icon = ok ? CheckCircledIcon : CrossCircledIcon
                  return (
                    <li key={k} className='flex items-center gap-2'>
                      <Icon
                        className={
                          ok ? 'text-green-600' : 'text-muted-foreground'
                        }
                      />
                      <span
                        className={
                          ok ? 'text-green-700' : 'text-muted-foreground'
                        }
                      >
                        {rule.label}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* Strength */}
              <p className={cn('mt-2 text-sm font-medium', strength.className)}>
                Strength: {strength.label}
              </p>

              <FormDescription>
                Use a strong, unique password to keep your account secure.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm password ------------------------------------------------ */}
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type='password' autoComplete='new-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className='w-full'
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? 'Changing...' : 'Change password'}
        </Button>
      </form>
    </Form>
  )
}
