import { z } from 'zod'
import { StageMetadataV1Schema } from '@/workflow.test/contract/v1/schema'

// reuse your StageMetadataV1Schema

export const WorkflowPageV1Schema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1),
  assigneeRoles: z.array(z.string()).optional(),
  stage: StageMetadataV1Schema,
})

export const WorkflowBundleV1Schema = z
  .object({
    bundleVersion: z.literal(1),
    workflowKey: z.string().min(1),
    title: z.string().min(1),
    pages: z.array(WorkflowPageV1Schema).min(1),
  })
  .superRefine((v, ctx) => {
    const ids = new Set<string>()
    for (const p of v.pages) {
      if (ids.has(p.pageId)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate pageId: ${p.pageId}`,
        })
      }
      ids.add(p.pageId)
    }
  })

export type WorkflowBundleV1 = z.infer<typeof WorkflowBundleV1Schema>
export type WorkflowPageV1 = z.infer<typeof WorkflowPageV1Schema>
