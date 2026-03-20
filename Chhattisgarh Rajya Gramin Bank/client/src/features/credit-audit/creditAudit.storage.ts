import type { CreditAuditStoredRecord } from "./creditAudit.types";

const KEY = "credit_audit_records_v1";

function readAll(): Record<string, CreditAuditStoredRecord[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CreditAuditStoredRecord[]>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, CreditAuditStoredRecord[]>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const creditAuditStore = {
  list(accountId: string) {
    const all = readAll();
    return (all[accountId] ?? []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  get(accountId: string, id: string) {
    const all = readAll();
    return (all[accountId] ?? []).find((x) => x.id === id);
  },

  upsert(accountId: string, rec: CreditAuditStoredRecord) {
    const all = readAll();
    const arr = all[accountId] ?? [];
    const idx = arr.findIndex((x) => x.id === rec.id);
    if (idx >= 0) arr[idx] = rec;
    else arr.push(rec);
    all[accountId] = arr;
    writeAll(all);
  },

  remove(accountId: string, id: string) {
    const all = readAll();
    const arr = all[accountId] ?? [];
    all[accountId] = arr.filter((x) => x.id !== id);
    writeAll(all);
  },
};