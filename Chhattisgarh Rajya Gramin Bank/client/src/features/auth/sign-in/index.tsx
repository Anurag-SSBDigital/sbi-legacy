// import { useState } from 'react'
// import { z } from 'zod'
// import { useForm } from 'react-hook-form'
// import { useNavigate, useSearch } from '@tanstack/react-router'
// import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
// import { toast } from 'sonner'
// import ViteLogo from '@/assets/logo copy.png'
// import { useAuthStore } from '@/stores/authStore.ts'
// import { $api } from '@/lib/api.ts'
// import { neverToError } from '@/lib/utils.ts'
// import { Button } from '@/components/ui/button'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { PasswordInput } from '@/components/password-input'
// const formSchema = z.object({
//   username: z.string().min(1, { message: 'Please enter your username' }),
//   password: z
//     .string()
//     .min(1, {
//       message: 'Please enter your password',
//     })
//     .min(4, {
//       message: 'Password must be at least 4 characters long',
//     }),
// })
// type formSchemaType = z.infer<typeof formSchema>
// export default function SignInPage() {
//   const [isLoading, setIsLoading] = useState(false)
//   const setUser = useAuthStore((s) => s.auth.setUser)
//   const setAccessToken = useAuthStore((s) => s.auth.setAccessToken)
//   const navigate = useNavigate()
//   const search = useSearch({ from: '/(auth)/sign-in' })
//   const loginMutation = $api.useMutation('post', '/user/authenticate', {
//     onSuccess: (res) => {
//       if (res.data) {
//         setUser(res.data)
//       }
//       setAccessToken(res.data?.token ?? '')
//       if (search.redirect?.startsWith('/')) {
//         navigate({ to: search.redirect })
//       } else {
//         location.href = search.redirect
//       }
//     },
//     onError: (error) => {
//       if ((error as Error).message) {
//         toast.error((error as Error).message)
//       } else {
//         toast.error(neverToError(error))
//       }
//     },
//   })
//   const form = useForm<formSchemaType>({
//     resolver: standardSchemaResolver(formSchema),
//     defaultValues: {
//       username: '',
//       password: '',
//     },
//   })
//   async function onSubmit(data: { username: string; password: string }) {
//     setIsLoading(true)
//     try {
//       await loginMutation.mutateAsync({ body: data })
//     } catch {
//       setIsLoading(false)
//     }
//   }
//   return (
//     <div className='relative flex min-h-screen w-full flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-[#f7fafc] via-white to-[#eef6ff] dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#0b1220]'>
//       {/* Hand‑drawn doodle layer (no bg image) */}
//       <svg
//         aria-hidden
//         className='pointer-events-none absolute inset-0 h-full w-full opacity-40 dark:opacity-25'
//         viewBox='0 0 1440 900'
//         preserveAspectRatio='none'
//       >
//         <g
//           fill='none'
//           stroke='#0f172a'
//           strokeWidth='2.50'
//           strokeLinecap='round'
//           strokeLinejoin='round'
//           className='dark:stroke-white/50'
//         >
//           {/* Corner scribbles */}
//           <path
//             d='M40 70 C 120 30, 200 120, 280 80'
//             strokeDasharray='420'
//             strokeDashoffset='420'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='420'
//               to='0'
//               dur='2.4s'
//               fill='freeze'
//             />
//           </path>
//           <path
//             d='M55 120 C 140 170, 220 110, 300 160'
//             strokeDasharray='420'
//             strokeDashoffset='420'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='420'
//               to='0'
//               dur='2.6s'
//               fill='freeze'
//             />
//           </path>
//           {/* Right top swirl */}
//           <path
//             d='M1160 120 q 60 -40 120 0 t 120 0'
//             strokeDasharray='360'
//             strokeDashoffset='360'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='360'
//               to='0'
//               dur='2.2s'
//               fill='freeze'
//             />
//           </path>
//           <path
//             d='M1180 160 q 50 -35 100 0 t 100 0'
//             strokeDasharray='320'
//             strokeDashoffset='320'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='320'
//               to='0'
//               dur='2.3s'
//               fill='freeze'
//             />
//           </path>
//           {/* Bottom wavy underline */}
//           <path
//             d='M0 820 C 120 790, 240 860, 360 830 S 600 800, 720 835 960 875, 1080 835 1320 790, 1440 820'
//             strokeDasharray='1600'
//             strokeDashoffset='1600'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='1600'
//               to='0'
//               dur='2.8s'
//               fill='freeze'
//             />
//           </path>
//           {/* Doodle circles */}
//           <circle
//             cx='180'
//             cy='240'
//             r='22'
//             strokeDasharray='140'
//             strokeDashoffset='140'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='140'
//               to='0'
//               dur='2s'
//               fill='freeze'
//             />
//           </circle>
//           <circle
//             cx='1260'
//             cy='260'
//             r='16'
//             strokeDasharray='100'
//             strokeDashoffset='100'
//           >
//             <animate
//               attributeName='stroke-dashoffset'
//               from='100'
//               to='0'
//               dur='2s'
//               fill='freeze'
//             />
//           </circle>
//         </g>
//       </svg>
//       <div className='h-10' />
//       {/* Logo and Welcome */}
//       <div className='z-10 mb-8 flex flex-col items-center px-4 text-center'>
//         <div className='relative mt-8 h-40 w-40'>
//           {/* <div className='absolute inset-0 rounded-full border border-black/30 bg-white/60 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5' /> */}
//           <img src={ViteLogo} alt='SSBD Logo' />
//         </div>
//         <h1 className='mt-2 text-2xl font-extrabold text-blue-900 drop-shadow-sm dark:text-white'>
//           TELANGANA GRAMEENA BANK
//         </h1>
//         <h1 className='mt-2 bg-gradient-to-r from-[var(--primary)] to-[var(--foreground)] bg-clip-text text-4xl font-extrabold text-transparent'>
//           EWS-CMS
//         </h1>
//         <p className='mt-2 text-sm font-bold text-gray-700'>
//           (Early Warning System - Credit Monitoring System)
//         </p>
//       </div>
//       {/* Form Card */}
//       <div className='z-10 w-[92%] max-w-md rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.01] dark:border-slate-700/60 dark:bg-slate-900/85'>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
//             <FormField
//               control={form.control}
//               name='username'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel className='text-[13px] font-bold text-slate-800 dark:text-slate-200'>
//                     Username
//                   </FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder='name@example.com'
//                       {...field}
//                       className='h-11 rounded-xl border-slate-300/70 bg-white/80 placeholder:text-slate-400 focus-visible:ring-sky-400 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white'
//                       autoComplete='username'
//                       aria-label='Username'
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name='password'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel className='text-[13px] font-bold text-slate-800 dark:text-slate-200'>
//                     Password
//                   </FormLabel>
//                   <FormControl>
//                     <PasswordInput
//                       placeholder='••••••••'
//                       {...field}
//                       className='h-11 rounded-xl border-slate-300/70 bg-white/80 placeholder:text-slate-400 focus-visible:ring-sky-400 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white'
//                       autoComplete='current-password'
//                       aria-label='Password'
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <Button
//               type='submit'
//               className='relative mt-2 h-11 w-full rounded-xl text-[15px] font-bold text-white shadow-lg focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70'
//               disabled={isLoading}
//             >
//               <span className='relative z-10'>
//                 {isLoading ? 'Logging in…' : 'Login'}
//               </span>
//               <span className='absolute inset-0 [animation:shine_2.4s_infinite] rounded-xl [background-size:200%_100%] opacity-0 [background:linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)]' />
//             </Button>
//           </form>
//         </Form>
//       </div>
//       {/* Bottom scribble accent */}
//       <svg
//         aria-hidden
//         className='pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 opacity-40 dark:opacity-30'
//         width='280'
//         height='60'
//         viewBox='0 0 280 60'
//       >
//         <path
//           d='M5 30 Q 40 5, 75 30 T 145 30 T 215 30 T 275 30'
//           fill='none'
//           stroke='#0f172a'
//           strokeWidth='2'
//           className='dark:stroke-white/50'
//           strokeDasharray='600'
//           strokeDashoffset='600'
//         >
//           <animate
//             attributeName='stroke-dashoffset'
//             from='600'
//             to='0'
//             dur='1.6s'
//             begin='0.2s'
//             fill='freeze'
//           />
//         </path>
//       </svg>
//       {/* Local shimmer keyframes */}
//       <style>{`@keyframes shine { 0% { background-position-x: 200%; opacity: 0 } 10% { opacity: .6 } 100% { background-position-x: -200%; opacity: 0 } }`}</style>
//     </div>
//   )
// }
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import ViteLogo from '@/assets/logo copy.png'
import { useAuthStore } from '@/stores/authStore.ts'
import type { AuthUser } from '@/stores/authStore.ts'
import { $api } from '@/lib/api.ts'
import {
  isPathAllowedInCurrentSurface,
  isPublicSurface,
} from '@/lib/app-surface'
import { isPasswordChangeRequired } from '@/lib/password-change-policy.ts'
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

const formSchema = z.object({
  username: z.string().min(1, { message: 'Please enter your username' }),
  password: z
    .string()
    .min(1, {
      message: 'Please enter your password',
    })
    .min(4, {
      message: 'Password must be at least 4 characters long',
    }),
})

type formSchemaType = z.infer<typeof formSchema>

const navigateToPostLoginLanding = (
  user: AuthUser | null | undefined,
  navigate: ReturnType<typeof useNavigate>
) => {
  if (user?.stockAuditor) {
    navigate({ to: '/stock-audit/assigned-audits', search: { tab: 'PENDING' } })
    return
  }

  if (user?.advocate) {
    navigate({ to: '/advocate' })
    return
  }

  if (user?.valuer) {
    navigate({ to: '/valuer' })
    return
  }

  navigate({ to: isPublicSurface ? '/403' : '/' })
}

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const setAccessToken = useAuthStore((s) => s.auth.setAccessToken)
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/sign-in' })

  const loginMutation = $api.useMutation('post', '/user/authenticate', {
    onSuccess: (res) => {
      const authenticatedUser = res.data ?? null
      if (authenticatedUser) {
        setUser(authenticatedUser)
      }
      setAccessToken(authenticatedUser?.token ?? '')
      if (isPasswordChangeRequired(authenticatedUser)) {
        navigate({ to: '/settings/change-password' })
        return
      }

      if (
        search.redirect?.startsWith('/') &&
        isPathAllowedInCurrentSurface(search.redirect)
      ) {
        navigate({ to: search.redirect })
        return
      }

      navigateToPostLoginLanding(authenticatedUser, navigate)
    },
    onError: (error) => {
      if ((error as Error).message) {
        toast.error((error as Error).message)
      } else {
        toast.error(neverToError(error))
      }
    },
  })

  const form = useForm<formSchemaType>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
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
    <div className='relative flex min-h-screen w-full flex-col items-center justify-start overflow-hidden bg-gradient-to-br from-[#f7fafc] via-white to-[#eef6ff] dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#0b1220]'>
      {/* Hand‑drawn doodle layer (no bg image) */}
      <svg
        aria-hidden
        className='pointer-events-none absolute inset-0 h-full w-full opacity-40 dark:opacity-25'
        viewBox='0 0 1440 900'
        preserveAspectRatio='none'
      >
        <g
          fill='none'
          stroke='#0f172a'
          strokeWidth='2.50'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='dark:stroke-white/50'
        >
          {/* Corner scribbles */}
          <path
            d='M40 70 C 120 30, 200 120, 280 80'
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
            d='M55 120 C 140 170, 220 110, 300 160'
            strokeDasharray='420'
            strokeDashoffset='420'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='420'
              to='0'
              dur='2.6s'
              fill='freeze'
            />
          </path>

          {/* Right top swirl */}
          <path
            d='M1160 120 q 60 -40 120 0 t 120 0'
            strokeDasharray='360'
            strokeDashoffset='360'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='360'
              to='0'
              dur='2.2s'
              fill='freeze'
            />
          </path>
          <path
            d='M1180 160 q 50 -35 100 0 t 100 0'
            strokeDasharray='320'
            strokeDashoffset='320'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='320'
              to='0'
              dur='2.3s'
              fill='freeze'
            />
          </path>

          {/* Bottom wavy underline */}
          <path
            d='M0 820 C 120 790, 240 860, 360 830 S 600 800, 720 835 960 875, 1080 835 1320 790, 1440 820'
            strokeDasharray='1600'
            strokeDashoffset='1600'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='1600'
              to='0'
              dur='2.8s'
              fill='freeze'
            />
          </path>

          {/* Doodle circles */}
          <circle
            cx='180'
            cy='240'
            r='22'
            strokeDasharray='140'
            strokeDashoffset='140'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='140'
              to='0'
              dur='2s'
              fill='freeze'
            />
          </circle>
          <circle
            cx='1260'
            cy='260'
            r='16'
            strokeDasharray='100'
            strokeDashoffset='100'
          >
            <animate
              attributeName='stroke-dashoffset'
              from='100'
              to='0'
              dur='2s'
              fill='freeze'
            />
          </circle>
        </g>
      </svg>

      <div className='h-10' />

      {/* Logo and Welcome */}
      <div className='z-10 mb-8 flex flex-col items-center px-4 text-center'>
        <div className='relative mt-8 h-40 w-40'>
          {/* <div className='absolute inset-0 rounded-full border border-black/30 bg-white/60 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/5' /> */}
          <img src={ViteLogo} alt='SSBD Logo' />
        </div>
        <h1 className='mt-3 text-2xl font-extrabold text-[color:var(--primary)] drop-shadow-sm dark:text-white'>
          Chhattisgarh Rajya Gramin Bank
        </h1>
        <h1 className='mt-2 bg-gradient-to-r from-[var(--primary)] to-[var(--foreground)] bg-clip-text text-4xl font-extrabold text-transparent'>
          EWS-CMS
        </h1>

        <p className='mt-2 text-sm font-bold text-gray-700 dark:text-gray-300'>
          (Early Warning System - Credit Monitoring System)
        </p>
      </div>

      {/* Form Card */}
      <div className='z-10 w-[92%] max-w-md rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.01] dark:border-slate-700/60 dark:bg-slate-900/85'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[13px] font-bold text-slate-800 dark:text-slate-200'>
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='name@example.com'
                      {...field}
                      className='h-11 rounded-xl border-slate-300/70 bg-white/80 placeholder:text-slate-400 focus-visible:ring-sky-400 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white'
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
                  <FormLabel className='text-[13px] font-bold text-slate-800 dark:text-slate-200'>
                    Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='••••••••'
                      {...field}
                      className='h-11 rounded-xl border-slate-300/70 bg-white/80 placeholder:text-slate-400 focus-visible:ring-sky-400 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white'
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
              className='relative mt-2 h-11 w-full rounded-xl text-[15px] font-bold text-white shadow-lg focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70'
              disabled={isLoading}
            >
              <span className='relative z-10'>
                {isLoading ? 'Logging in…' : 'Login'}
              </span>
              <span className='absolute inset-0 [animation:shine_2.4s_infinite] rounded-xl [background-size:200%_100%] opacity-0 [background:linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)]' />
            </Button>
          </form>
        </Form>
      </div>

      {/* Bottom scribble accent */}
      <svg
        aria-hidden
        className='pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 opacity-40 dark:opacity-30'
        width='280'
        height='60'
        viewBox='0 0 280 60'
      >
        <path
          d='M5 30 Q 40 5, 75 30 T 145 30 T 215 30 T 275 30'
          fill='none'
          stroke='#0f172a'
          strokeWidth='2'
          className='dark:stroke-white/50'
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

      {/* Local shimmer keyframes */}
      <style>{`@keyframes shine { 0% { background-position-x: 200%; opacity: 0 } 10% { opacity: .6 } 100% { background-position-x: -200%; opacity: 0 } }`}</style>
    </div>
  )
}
