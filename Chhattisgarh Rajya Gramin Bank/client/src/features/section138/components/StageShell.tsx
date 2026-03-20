import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Hash, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppBreadcrumb } from '@/components/breadcrumb/app-breadcrumb'
import { Home } from '@/components/breadcrumb/common-crumbs'
import { useSection138 } from '../Section138Provider'
import type { CaseStage } from '../section138.types'
import { StageNav } from './StageNav'

const stageToPath = (caseId: string, stage: CaseStage) => {
  switch (stage) {
    case 'STAGE_1':
      return `/section138/${caseId}/stage-1`
    case 'STAGE_2':
      return `/section138/${caseId}/stage-2`
    case 'STAGE_3':
      return `/section138/${caseId}/stage-3`
    case 'STAGE_4':
      return `/section138/${caseId}/stage-4`
    case 'STAGE_5':
      return `/section138/${caseId}/stage-5`
    default:
      return `/section138/${caseId}/stage-1`
  }
}

export const StageShell: React.FC<{
  title: string
  children: React.ReactNode
  stage: CaseStage
}> = ({ title, children, stage }) => {
  const { record, goStage } = useSection138()
  const navigate = useNavigate()

  const go = (s: CaseStage) => {
    goStage(s)
    navigate({ to: stageToPath(record.id, s) })
  }

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <AppBreadcrumb
        crumbs={[Home]}
        currentPage={{ type: 'label', label: `Section 138 - ${title}` }}
      />

      <Card className='shadow-sm'>
        <CardHeader className='bg-muted/20 border-b pb-4'>
          <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <CardTitle className='flex flex-col gap-1'>
              <span className='text-muted-foreground text-[10px] font-bold tracking-widest uppercase'>
                Recovery Workflow
              </span>
              <span className='text-xl font-bold tracking-tight'>{title}</span>
            </CardTitle>

            <div className='flex flex-wrap items-center gap-2'>
              <div className='bg-background text-foreground flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold shadow-sm'>
                <Hash className='text-muted-foreground h-3.5 w-3.5' />
                <span>{record.id}</span>
              </div>
              <div className='bg-background text-foreground flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold shadow-sm'>
                <Activity className='text-muted-foreground h-3.5 w-3.5' />
                <span>{record.overallStatus}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          <StageNav
            currentStage={stage}
            onGo={go}
            disabled={record.overallStatus === 'CLOSED'}
          />
        </CardContent>
      </Card>

      <div className='animate-in fade-in slide-in-from-bottom-2 duration-500'>
        {children}
      </div>
    </div>
  )
}
