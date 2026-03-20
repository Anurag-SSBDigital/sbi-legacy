import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
import { $api, BASE_URL } from '@/lib/api.ts'
import { initials } from '@/lib/utils.ts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
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

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  fullname: z.string().min(2, 'Name must be at least 2 Character long'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm() {
  const user = useAuthStore().auth.user

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const defaultValues: Partial<ProfileFormValues> = {
    username: user?.username,
    fullname: user?.fullName,
  }

  const setUser = useAuthStore((s) => s.auth.setUser)

  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const updateProfileMutation = $api.useMutation('put', '/user/updateProfile', {
    onSuccess: (res) => {
      toast.success(res.message)
      form.reset({
        username: res?.data?.username,
        fullname: res?.data?.fullName,
      })
      setUser({ ...user, ...res.data })
    },
    onError: (err) => {
      toast.error(
        ((err as Error)?.message as string | undefined) ||
          'Something went wrong'
      )
    },
  })

  const uploadPicMutation = $api.useMutation('post', '/user/uploadProfilePic', {
    onSuccess: (res) => {
      setPreview(null) // drop local preview
      toast.success(res.message || 'Profile photo updated')
      location.reload()
    },
    onError: (err) => {
      toast.error(
        ((err as Error)?.message as string) || 'Could not upload photo'
      )
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    updateProfileMutation.mutate({
      body: { fullName: data.fullname },
      params: { header: { Authorization: '' } },
    })
  })

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }

    // optimistic local preview (nice UX)
    const url = URL.createObjectURL(file)
    setPreview(url)

    // build multipart payload
    const formData = new FormData()
    formData.append('file', file)

    uploadPicMutation.mutate({
      body: formData as unknown as undefined,
      params: {
        header: {
          Authorization: '',
        },
      },
    })
  }

  useEffect(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <>
      <div className='relative m-auto h-30 w-30'>
        <button
          type='button'
          onClick={handleAvatarClick}
          className='group relative h-30 w-30 rounded-full focus:outline-none'
        >
          <Avatar className='h-30 w-30'>
            <AvatarImage
              src={
                preview ??
                `${BASE_URL}/user/profilePic?username=${user?.username}&ts=${Date.now()}`
              }
            />
            <AvatarFallback>
              {initials(user?.fullName || user?.username || '')}
            </AvatarFallback>

            {/* hover overlay with a pencil icon */}
            <span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100'>
              <Pencil size={20} className='text-white' />
            </span>
          </Avatar>
        </button>

        {/* hidden file chooser */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileChange}
        />
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className='space-y-8'>
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder='shadcn' {...field} disabled />
                </FormControl>
                <FormDescription>Username can not be changed.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='fullname'
            disabled={updateProfileMutation.isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder='Full Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            disabled={
              !form.formState.isDirty || updateProfileMutation.isPending
            }
          >
            {updateProfileMutation?.isPending
              ? 'Updating Profile...'
              : 'Update profile'}
          </Button>
        </form>
      </Form>
    </>
  )
}
