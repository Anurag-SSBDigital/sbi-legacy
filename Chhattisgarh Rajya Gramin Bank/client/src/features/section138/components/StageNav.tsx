import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CaseStage } from '../section138.types'

const STAGES: { key: CaseStage; label: string }[] = [
  { key: 'STAGE_1', label: 'Cheque Presentation' },
  { key: 'STAGE_2', label: 'Admin Approval' },
  { key: 'STAGE_3', label: 'Legal Notice' },
  { key: 'STAGE_4', label: 'Case Filing' },
  { key: 'STAGE_5', label: 'Resolution' },
]

export function StageNav({
  currentStage,
  onGo,
  disabled,
}: {
  currentStage: CaseStage
  onGo: (s: CaseStage) => void
  disabled?: boolean
}) {
  const isMobile = useIsMobile()
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage)

  if (isMobile) {
    return (
      <div className='w-full'>
        <Select
          value={currentStage}
          onValueChange={(v) => onGo(v as CaseStage)}
          disabled={disabled}
        >
          <SelectTrigger className='w-full font-semibold'>
            <SelectValue placeholder='Select Stage' />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s, idx) => (
              <SelectItem key={s.key} value={s.key}>
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      idx <= currentIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {idx < currentIndex ? (
                      <Check className='h-3 w-3' />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <nav aria-label='Progress' className='w-full'>
      <ol role='list' className='flex items-center justify-between gap-2'>
        {STAGES.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentIndex
          const isActive = stepIdx === currentIndex

          return (
            <li
              key={step.key}
              className={cn(
                stepIdx !== STAGES.length - 1 ? 'flex-1' : '',
                'relative'
              )}
            >
              {stepIdx !== STAGES.length - 1 && (
                <div
                  className='absolute inset-0 top-4 left-0 flex items-center pr-8'
                  aria-hidden='true'
                >
                  <div
                    className={cn(
                      'h-0.5 w-full',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}

              <button
                type='button'
                onClick={() => onGo(step.key)}
                disabled={disabled}
                className='group relative flex flex-col items-center gap-1.5 focus:outline-none'
              >
                <div className='flex h-8 items-center' aria-hidden='true'>
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isActive
                          ? 'bg-background border-primary text-primary'
                          : 'bg-background border-muted text-muted-foreground group-hover:border-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className='h-4 w-4' />
                    ) : isActive ? (
                      <Circle className='h-2 w-2 fill-current' />
                    ) : (
                      <span className='text-xs font-bold'>{stepIdx + 1}</span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-tight uppercase',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
