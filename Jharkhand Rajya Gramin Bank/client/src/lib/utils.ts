import { type ClassValue, clsx } from 'clsx'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const initials = (s: string) =>
  (s.match(/\b[a-z]/gi) || []).join('').toUpperCase()

export const neverToError = (error: unknown, fallbackError?: string) =>
  ((error as { message?: string } | undefined)?.message ??
  (error as unknown) instanceof Error)
    ? (error as Error)?.message
    : (fallbackError ?? 'Something went wrong')

export const toastError = (error: unknown, fallbackError?: string) =>
  toast.error(neverToError(error, fallbackError))

export function valueTypeCasting(v: unknown): string | number | undefined {
  if (typeof v === 'string' || typeof v === 'number') return v
  return v as undefined
}

export function capitalizeFirstWord(str: string) {
  return str.replace(/^\s*\w+/, function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1)
  })
}

export const fmtINR = (n?: number) =>
  n !== undefined
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(n)
    : '—'

export function camelToTitleCase(input: string): string {
  return input
    .replace(/([A-Z])/g, ' $1') // insert space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // capitalize the first character
    .trim() // remove any leading/trailing spaces
}
