import {
  WorkflowBundleV1Schema,
  type WorkflowBundleV1,
} from '../contract/bundle.schema'
import { emitBundleChanged } from './bundle.events'

const REG_KEY = 'wf_bundle_registry_v1' // sidebar/list uses this
const BUNDLE_KEY = (bundleId: string) => `wf_bundle_v1:${bundleId}`
const VALUES_KEY = (bundleId: string, pageId: string) =>
  `wf_values_v1:${bundleId}:${pageId}`

export type BundleRegistryRow = {
  bundleId: string
  workflowKey: string
  title: string
  firstPageId: string
  createdAt: string
}

function readJson<T>(k: string, fallback: T): T {
  const raw = localStorage.getItem(k)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(k: string, v: unknown) {
  localStorage.setItem(k, JSON.stringify(v))
}

function makeBundleId() {
  // URL strategy C: bundleId in path + workflowKey in query
  // (simple unique ID; swap with uuid if you want)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function listBundles(): BundleRegistryRow[] {
  return readJson<BundleRegistryRow[]>(REG_KEY, [])
}

export function getBundle(bundleId: string): WorkflowBundleV1 | null {
  const raw = localStorage.getItem(BUNDLE_KEY(bundleId))
  if (!raw) return null
  try {
    return WorkflowBundleV1Schema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

export function createBundleFromJson(json: unknown): BundleRegistryRow {
  const bundle = WorkflowBundleV1Schema.parse(json)
  const bundleId = makeBundleId()

  writeJson(BUNDLE_KEY(bundleId), bundle)

  const row: BundleRegistryRow = {
    bundleId,
    workflowKey: bundle.workflowKey,
    title: bundle.title,
    firstPageId: bundle.pages[0].pageId,
    createdAt: new Date().toISOString(),
  }

  const reg = listBundles()
  writeJson(REG_KEY, [row, ...reg])

  emitBundleChanged()
  return row
}

export function deleteBundle(bundleId: string) {
  // remove from registry
  const reg = listBundles().filter((r) => r.bundleId !== bundleId)
  writeJson(REG_KEY, reg)

  // remove bundle
  localStorage.removeItem(BUNDLE_KEY(bundleId))

  // remove values keys (best-effort)
  const prefix = `wf_values_v1:${bundleId}:`
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(prefix)) localStorage.removeItem(k)
  }

  emitBundleChanged()
}

export function getPageValues(
  bundleId: string,
  pageId: string
): Record<string, unknown> {
  return readJson<Record<string, unknown>>(VALUES_KEY(bundleId, pageId), {})
}

export function patchPageValues(
  bundleId: string,
  pageId: string,
  patch: Record<string, unknown>
) {
  const cur = getPageValues(bundleId, pageId)
  const next = { ...cur, ...(patch ?? {}) }
  writeJson(VALUES_KEY(bundleId, pageId), next)
  emitBundleChanged()
}
