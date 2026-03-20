import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { localCreateWorkflowFromStages } from '@/workflow.contract/local/wfLocalApi'
import { StageMetadataV1Schema } from '@/workflow.test/contract/v1/schema'
import { CheckCircle2, Play, Code, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import BranchSelector from '@/features/dashboard/components/branch-selector'
import { WorkflowBundleV1Schema } from '../contract/bundle.schema'

export default function BuilderPage() {
  const nav = useNavigate()
  const user = useAuthStore().auth.user

  const [text, setText] = useState<string>(
    () => `{
  "bundleVersion": 1,
  "workflowKey": "EWS_ROLE_WORKFLOW_3_STAGE_V1",
  "title": "EWS Role Workflow (3 Stages)",
  "pages": [
    {
      "pageId": "stage-1-superadmin",
      "title": "Stage 1: Superadmin Entry",
      "assigneeRoles": ["superadmin"],
      "stage": {
        "schemaVersion": 1,
        "kind": "FORM",
        "ui": { "layout": "TWO_COLUMN", "saveDraftLabel": "Save Draft", "submitLabel": "Send to Admin" },
        "form": {
          "formKey": "S1_SUPERADMIN",
          "title": "Stage 1: Superadmin Entry",
          "mode": "DRAFT_AND_SUBMIT",
          "sections": [
            {
              "key": "s1",
              "title": "Account Info",
              "fields": [
                { "key": "accountNo", "label": "Account No", "type": "TEXT", "required": true },
                { "key": "borrowerName", "label": "Borrower Name", "type": "TEXT", "required": true },
                { "key": "isHighRisk", "label": "High Risk?", "type": "YES_NO", "required": true },
                {
                  "key": "highRiskReason",
                  "label": "Reason (if High Risk)",
                  "type": "TEXTAREA",
                  "visibleIf": { "op": "EQ", "field": "isHighRisk", "value": true },
                  "validations": [
                    { "rule": "REQUIRED_IF", "condition": { "op": "EQ", "field": "isHighRisk", "value": true }, "message": "Reason is required." }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      "pageId": "stage-2-admin",
      "title": "Stage 2: Admin Review",
      "assigneeRoles": ["admin"],
      "stage": {
        "schemaVersion": 1,
        "kind": "FORM",
        "ui": { "layout": "SINGLE_COLUMN", "saveDraftLabel": "Save Draft", "submitLabel": "Send to BM" },
        "form": {
          "formKey": "S2_ADMIN",
          "title": "Stage 2: Admin Review",
          "mode": "DRAFT_AND_SUBMIT",
          "sections": [
            {
              "key": "s2",
              "title": "Verification",
              "fields": [
                { "key": "kycComplete", "label": "KYC Completed?", "type": "YES_NO", "required": true },
                {
                  "key": "kycRemarks",
                  "label": "KYC Remarks (if No)",
                  "type": "TEXTAREA",
                  "visibleIf": { "op": "EQ", "field": "kycComplete", "value": false },
                  "validations": [
                    { "rule": "REQUIRED_IF", "condition": { "op": "EQ", "field": "kycComplete", "value": false }, "message": "Remarks required when KYC is No." }
                  ]
                },
                {
                  "key": "bills",
                  "label": "Bills",
                  "type": "TABLE",
                  "columns": [
                    { "key": "billNo", "label": "Bill No", "type": "TEXT" },
                    { "key": "billDate", "label": "Bill Date", "type": "DATE" },
                    { "key": "billAmount", "label": "Amount", "type": "CURRENCY" }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      "pageId": "stage-3-bm",
      "title": "Stage 3: Branch Manager Approval",
      "assigneeRoles": ["branchmanager"],
      "stage": {
        "schemaVersion": 1,
        "kind": "APPROVAL",
        "approval": {
          "title": "Stage 3: Branch Manager Approval",
          "actions": [
            { "key": "APPROVE", "label": "Approve", "requiresComment": true },
            { "key": "REJECT", "label": "Reject", "requiresComment": true },
            { "key": "SEND_BACK", "label": "Send Back", "requiresComment": true }
          ],
          "fields": [
            { "key": "bmRemarks", "label": "BM Remarks", "type": "TEXTAREA", "required": true }
          ]
        }
      }
    }
  ]
}`
  )
  const [error, setError] = useState<string>('')
  const [branchId, setBranchId] = useState<string | undefined>(undefined)
  const [deptId, setDeptId] = useState<string | undefined>(undefined)

  const parsed = useMemo(() => {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }, [text])

  function validateOnly() {
    setError('')
    try {
      if (!parsed) throw new Error('Invalid JSON formatting.')
      WorkflowBundleV1Schema.parse(parsed) // validates bundle + each StageMetadataV1 (if your schema does that)
      alert('JSON is valid ✅')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  function create() {
    setError('')
    try {
      if (!parsed) throw new Error('Invalid JSON formatting.')

      const bundle = WorkflowBundleV1Schema.parse(parsed)

      // Generate instance/stage IDs for local test (avoid collisions)
      const instanceId = Date.now()
      const baseStageDefId = Date.now() % 1000000 // keep smaller if you want

      const stages = bundle.pages.map((p, idx: number) => {
        const meta = StageMetadataV1Schema.parse(p.stage)

        const stageKey =
          meta.kind === 'FORM'
            ? (meta.form?.formKey ?? `STAGE_${idx + 1}`)
            : `APPROVAL_${idx + 1}`

        const stageName =
          meta.kind === 'FORM'
            ? (meta.form?.title ?? p.title ?? `Stage ${idx + 1}`)
            : (meta.approval?.title ?? p.title ?? `Stage ${idx + 1}`)

        const assigneeRole = (p.assigneeRoles?.[0] ?? 'user') as string

        return {
          stageDefId: baseStageDefId + idx + 1,
          stageKey,
          stageName,
          assigneeRole,
          metadata: meta,
        }
      })

      const res = localCreateWorkflowFromStages({
        instanceId,
        stages,
      })

      // Helpful note: first task belongs to the first stage's role
      const firstRole = stages[0]?.assigneeRole
      if (firstRole && user) {
        // only informational; permissions are enforced on /ui
      }

      // ✅ Navigate to CONTRACT route (not /wf/dynamic)
      nav({
        to: '/wf/instances/$instanceId/stages/$stageDefId',
        params: {
          instanceId: String(res.instanceId),
          stageDefId: String(res.firstStageDefId),
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  return (
    <div className='bg-background flex min-h-svh flex-col'>
      <Header>
        <BranchSelector
          value={branchId}
          setValue={setBranchId}
          deptValue={deptId}
          deptSetValue={setDeptId}
        />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <main className='animate-fadeIn max-w-9xl w-full flex-1 space-y-6 p-4 md:p-8'>
        <div className='space-y-1'>
          <h1 className='font-manrope text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <Code className='text-primary h-6 w-6' />
            Dynamic Workflow Builder (Contract Mode)
          </h1>
          <p className='text-muted-foreground text-sm'>
            Paste a WorkflowBundleV1 JSON. This will create local{' '}
            <span className='font-mono'>wf_stage_def</span>,{' '}
            <span className='font-mono'>wf_stage_detail</span>, and tasks, then
            open the contract route:{' '}
            <span className='font-mono'>
              /wf/instances/:instanceId/stages/:stageDefId
            </span>
            .
          </p>
        </div>

        <Card className='border-t-primary flex flex-col overflow-hidden border-t-4 shadow-md'>
          <div className='relative flex-1'>
            <textarea
              className='bg-muted/20 text-foreground focus:ring-primary/50 min-h-[500px] w-full resize-y border-0 p-6 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none focus:ring-inset'
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
          </div>

          {error && (
            <div className='border-destructive/20 bg-destructive/10 text-destructive animate-fadeIn flex items-start gap-3 border-t p-4'>
              <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
              <div className='font-mono text-sm whitespace-pre-wrap'>
                {error}
              </div>
            </div>
          )}

          <div className='bg-muted/10 flex items-center justify-end gap-3 border-t px-6 py-4'>
            <Button variant='outline' onClick={validateOnly} className='gap-2'>
              <CheckCircle2 className='text-primary h-4 w-4' />
              Validate
            </Button>

            <Button onClick={create} className='gap-2 shadow-md'>
              <Play className='h-4 w-4 fill-current' />
              Create Workflow
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
