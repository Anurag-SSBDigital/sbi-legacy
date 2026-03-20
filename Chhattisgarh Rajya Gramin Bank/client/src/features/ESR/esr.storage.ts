import type { ESRRecord } from "./esr.types";

import type { ESRFormValues } from "./esr.schema";

export type ESRStoredRecord = ESRFormValues & {
  id: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
};


const keyFor = (accountId: string) => `esr_records_v1:${accountId}`;

export const esrStore = {
  list(accountId: string): ESRRecord[] {
    const raw = localStorage.getItem(keyFor(accountId));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ESRRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  get(accountId: string, esrId: string): ESRRecord | undefined {
    return esrStore.list(accountId).find((r) => r.id === esrId);
  },

  upsert(accountId: string, record: ESRRecord) {
    const rows = esrStore.list(accountId);
    const idx = rows.findIndex((r) => r.id === record.id);
    const next = [...rows];
    if (idx >= 0) next[idx] = record;
    else next.unshift(record);
    localStorage.setItem(keyFor(accountId), JSON.stringify(next));
  },

  remove(accountId: string, esrId: string) {
    const next = esrStore.list(accountId).filter((r) => r.id !== esrId);
    localStorage.setItem(keyFor(accountId), JSON.stringify(next));
  },
};

export const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;
