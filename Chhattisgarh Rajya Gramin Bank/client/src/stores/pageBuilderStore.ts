import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColumnConfig = {
  key: string
  label: string
  type: 'text' | 'currency'
}
export type DialogFieldConfig = { key: string; label: string }

export interface PageConfig {
  processCode: string // e.g., 'SMA'
  title: string // e.g., 'SMA Accounts'
  apiPath: string // e.g., '/sma/accountlist'
  identifierKey: string
  statsKey: string
  columns: ColumnConfig[]
  dialogFields: DialogFieldConfig[]
}

interface PageBuilderState {
  deployedPages: PageConfig[]
  deployPage: (config: PageConfig) => void
}

export const usePageBuilderStore = create<PageBuilderState>()(
  persist(
    (set) => ({
      // Start with ESR already "deployed" as an example
      deployedPages: [
        {
          processCode: 'ESR',
          title: 'ESR Accounts',
          apiPath: '/esr/accountlist',
          identifierKey: 'acctNo',
          statsKey: 'outstand',
          columns: [
            { key: 'acctNo', label: 'Account No', type: 'text' },
            { key: 'custName', label: 'Customer Name', type: 'text' },
            { key: 'outstand', label: 'Outstanding', type: 'currency' },
          ],
          dialogFields: [
            { key: 'acctNo', label: 'Account No' },
            { key: 'custName', label: 'Customer Name' },
            { key: 'outstand', label: 'Outstanding' },
          ],
        },
      ],
      deployPage: (config) =>
        set((state) => {
          // Prevent duplicates by updating if it exists, or adding if new
          const existingIndex = state.deployedPages.findIndex(
            (p) => p.processCode === config.processCode
          )
          if (existingIndex >= 0) {
            const newPages = [...state.deployedPages]
            newPages[existingIndex] = config
            return { deployedPages: newPages }
          }
          return { deployedPages: [...state.deployedPages, config] }
        }),
    }),
    { name: 'page-builder-storage' } // Saves to localStorage so it survives refresh!
  )
)
