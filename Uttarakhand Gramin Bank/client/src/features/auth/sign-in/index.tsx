import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import ViteLogo from '@/assets/logo.png'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import { neverToError } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

/* -------------------- Validation -------------------- */
const formSchema = z.object({
  username: z.string().min(1, { message: 'Please enter your username' }),
  password: z
    .string()
    .min(1, { message: 'Please enter your password' })
    .min(4, { message: 'Password must be at least 4 characters long' }),
})
type formSchemaType = z.infer<typeof formSchema>

/* -------------------- Page -------------------- */
export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const setAccessToken = useAuthStore((s) => s.auth.setAccessToken)
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/sign-in' })

  const loginMutation = $api.useMutation('post', '/user/authenticate', {
    onSuccess: (res) => {
      if (res.data) setUser(res.data)
      setAccessToken(res.data?.token ?? '')
      if (search.redirect?.startsWith('/')) {
        navigate({ to: search.redirect })
      } else {
        location.href = search.redirect
      }
    },
    onError: (error) => {
      if ((error as Error).message) toast.error((error as Error).message)
      else toast.error(neverToError(error))
    },
  })

  const form = useForm<formSchemaType>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(data: { username: string; password: string }) {
    setIsLoading(true)
    try {
      await loginMutation.mutateAsync({ body: data })
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <main className='relative flex min-h-screen w-full items-center justify-center overflow-hidden'>
      {/* Background (light/dark aware) */}
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-[radial-gradient(1200px_800px_at_10%_-10%,_rgba(0,147,221,0.08),transparent),radial-gradient(1000px_600px_at_110%_10%,_rgba(125,215,249,0.10),transparent)] dark:bg-[radial-gradient(1200px_800px_at_-10%_-10%,_rgba(64,189,242,0.12),transparent),radial-gradient(1000px_600px_at_110%_10%,_rgba(0,147,221,0.10),transparent)]' />
        {/* Ambient blobs */}
        <div
          aria-hidden
          className='absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-40 blur-3xl md:opacity-40'
          style={{
            background:
              'radial-gradient(closest-side, var(--primary) 40%, transparent)',
          }}
        />
        <div
          aria-hidden
          className='absolute -right-28 -bottom-28 h-80 w-80 rounded-full opacity-25 blur-3xl md:opacity-35'
          style={{
            background:
              'radial-gradient(closest-side, color-mix(in oklab, var(--primary) 65%, white 35%) 30%, transparent)',
          }}
        />
        {/* Subtle doodles */}
        <svg
          aria-hidden
          className='absolute inset-0 h-full w-full opacity-30 motion-reduce:hidden dark:opacity-20'
          viewBox='0 0 1440 900'
          preserveAspectRatio='none'
        >
          <g
            fill='none'
            stroke='currentColor'
            strokeWidth='2.25'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-slate-700/40 dark:text-slate-200/30'
          >
            <path
              d='M40 70 C 120 30, 200 120, 280 80'
              strokeDasharray='420'
              strokeDashoffset='420'
            >
              <animate
                attributeName='stroke-dashoffset'
                from='420'
                to='0'
                dur='2.2s'
                fill='freeze'
              />
            </path>
            <path
              d='M55 120 C 140 170, 220 110, 300 160'
              strokeDasharray='420'
              strokeDashoffset='420'
            >
              <animate
                attributeName='stroke-dashoffset'
                from='420'
                to='0'
                dur='2.4s'
                fill='freeze'
              />
            </path>
            <path
              d='M0 820 C 120 790, 240 860, 360 830 S 600 800, 720 835 960 875, 1080 835 1320 790, 1440 820'
              strokeDasharray='1600'
              strokeDashoffset='1600'
            >
              <animate
                attributeName='stroke-dashoffset'
                from='1600'
                to='0'
                dur='2.6s'
                fill='freeze'
              />
            </path>
          </g>
        </svg>
      </div>

      {/* Content column (centered) */}
      <div className='z-10 flex w-full max-w-md flex-col items-center px-6 py-10 text-center sm:py-14'>
        <img
          src={ViteLogo}
          alt='SSBD Logo'
          className='h-20 w-auto rounded-xl border border-4 border-primary/70 bg-white/90 p-2 shadow-lg shadow-sky-300/30 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[0_0_36px_rgba(56,189,248,0.45)]'
        />
        <h1 className='mt-2 bg-[linear-gradient(90deg,var(--primary),color-mix(in_oklab,var(--primary)_80%,white_15%))] bg-clip-text text-5xl font-extrabold leading-tight tracking-tight text-transparent md:text-6xl'>
          EWS-CMS
        </h1>
        <p className='mt-2 mb-6 text-sm font-medium text-slate-600 dark:text-slate-300'>
          Early Warning System · Credit Monitoring System
        </p>

        {/* Card */}
        <section className='w-full rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.9)] backdrop-blur-2xl transition-transform duration-300 hover:scale-[1.01] dark:border-white/10 dark:bg-slate-900/85 sm:p-7'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[13px] font-semibold text-slate-800 dark:text-slate-200'>
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='name@example.com'
                        {...field}
                        className='h-11 rounded-xl border-slate-300/80 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-[color:var(--ring)] dark:border-white/15 dark:bg-slate-800/85 dark:text-white'
                        autoComplete='username'
                        aria-label='Username'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[13px] font-semibold text-slate-800 dark:text-slate-200'>
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='••••••••'
                        {...field}
                        className='h-11 rounded-xl border-slate-300/80 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-[color:var(--ring)] dark:border-white/15 dark:bg-slate-800/85 dark:text-white'
                        autoComplete='current-password'
                        aria-label='Password'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type='submit'
                disabled={isLoading}
                className='relative mt-1 h-11 w-full rounded-xl bg-[linear-gradient(90deg,var(--primary),color-mix(in_oklab,var(--primary)_72%,white_28%))] text-[15px] font-bold text-white shadow-lg shadow-[rgba(0,147,221,0.30)] ring-offset-2 transition-all hover:brightness-[1.07] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70'
              >
                <span className='relative z-10'>
                  {isLoading ? 'Logging in…' : 'Login'}
                </span>
                <span className='pointer-events-none absolute inset-0 rounded-xl opacity-0 [animation:shine_2.4s_infinite] [background-size:200%_100%] [background:linear-gradient(110deg,transparent,rgba(255,255,255,.55),transparent)] motion-reduce:hidden' />
              </Button>
            </form>
          </Form>
        </section>
      </div>

      {/* Bottom accent */}
      <svg
        aria-hidden
        className='pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 opacity-40 motion-reduce:hidden dark:opacity-30'
        width='280'
        height='60'
        viewBox='0 0 280 60'
      >
        <path
          d='M5 30 Q 40 5, 75 30 T 145 30 T 215 30 T 275 30'
          fill='none'
          stroke='currentColor'
          className='text-slate-700/60 dark:text-white/50'
          strokeWidth='2'
          strokeDasharray='600'
          strokeDashoffset='600'
        >
          <animate
            attributeName='stroke-dashoffset'
            from='600'
            to='0'
            dur='1.6s'
            begin='0.2s'
            fill='freeze'
          />
        </path>
      </svg>

      {/* Local keyframes + reduced motion support */}
      <style>{`
        @keyframes shine {
          0% { background-position-x: 200%; opacity: 0 }
          10% { opacity: .6 }
          100% { background-position-x: -200%; opacity: 0 }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-reduce\\:hidden { display: none !important; }
        }
      `}</style>
    </main>
  )
}
