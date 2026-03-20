import { components } from '@/types/api/v1.js'
import { Document, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
// If your Linux build complains about extension, use: import { camelToTitleCase } from '@/lib/utils'
import { camelToTitleCase } from '@/lib/utils.ts'
import { PdfBasePage } from '@/components/reports/pdf/base/PdfBasePage'
import {
  PdfTable,
  PdfTableColumnDef,
} from '@/components/reports/pdf/table/PdfTable'

type Row = components['schemas']['AlertSummaryDTO']

/* --------------------------- Global hyphenation --------------------------- */
try {
  Font.registerHyphenationCallback((word: string) => {
    if (/^[A-Za-z0-9]+$/.test(word) && word.length >= 10) {
      return word.match(/.{1,4}/g) || [word]
    }
    return [word]
  })
} catch {
  // ignore if already registered or in SSR build step
}

/* -------------------------------- Theme --------------------------------- */
const colors = {
  border: '#e5e7eb',
  headerBg: '#0b1220',
  headerFg: '#ffffff',
  zebra: '#f9fafb',
  cardBg: '#f8fafc',
  cardBorder: '#e5e7eb',
  text: '#0f172a',
  subtle: '#6b7280',
}

const styles = StyleSheet.create({
  summaryWrap: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 140,
  },
  summaryTitle: { fontSize: 9, color: colors.subtle, marginBottom: 2 },
  summaryValue: { fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { marginTop: 4, fontSize: 12, fontWeight: 'bold' },

  /* Safer: no transformOrigin (react-pdf ignores it); slight global scale */
  tableScaleFirst: { transform: 'scale(0.97)' },
  tableScaleAll: { transform: 'scale(0.98)' }, // apply to every page for Linux safety
})

/* ------------------------------ Column model ----------------------------- */
const COLUMNS: PdfTableColumnDef<Row>[] = [
  {
    key: 'alertId',
    label: 'Alert ID',
    ratio: 0.9,
    align: 'center',
    softWrap: true,
  },
  {
    key: 'accountNo',
    label: 'Account No',
    ratio: 1.4,
    align: 'center',
    softWrap: true,
  },
  {
    key: 'customerName',
    label: 'Customer Name',
    ratio: 1.2,
    align: 'left',
    softWrap: true,
  },
  {
    key: 'masterDescription',
    label: 'Alert Description',
    ratio: 2.0,
    align: 'left',
    softWrap: true,
  },
  { key: (r) => r.status, label: 'Status', ratio: 1.2, align: 'center' },
  { key: 'alertDate', label: 'Alert Date', ratio: 1.2, align: 'center' },
  { key: 'alertReason', label: 'Alert Reason', ratio: 2.0, align: 'left' },
]

/* -------------------- Conservative rows-per-page calculation -------------- */
/**
 * Linux fonts/margins run taller than Windows in many setups.
 * Make estimates conservative so we never overfill.
 */
const A4_HEIGHT = 842 // pt portrait
const DEFAULT_TOP_BOTTOM_MARGIN = 56 // MUST match PdfBasePage margins
const EST_HEADER_BLOCK = 148 // was 120 → safer
const EST_TABLE_HEADER = 32 // was 28 → safer
const EST_ROW_HEIGHT = 24 // was 22 → safer
const BASE_SAFETY_ROWS = 1 // always keep 1 row margin

function getRowsPerPage(metaLines: number) {
  const metaPerLine = 18 // was 16 → safer
  const metaHeight = Math.min(6, metaLines) * metaPerLine

  const usable =
    A4_HEIGHT -
    DEFAULT_TOP_BOTTOM_MARGIN * 2 -
    EST_HEADER_BLOCK -
    metaHeight -
    EST_TABLE_HEADER

  const raw = Math.floor(usable / EST_ROW_HEIGHT)

  // more meta == less rows
  const extraSafety = metaLines >= 4 ? 1 : 0

  return Math.max(6, raw - BASE_SAFETY_ROWS - extraSafety)
}

/* -------------------------------- Pagination ------------------------------ */
function paginate<T>(rows: T[], rowsPerPage: number): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage))
  }
  return pages
}

export function AlertsReportPdf({
  reportData,
  alertType,
  branch,
  selectedStages,
  fromDate,
  toDate,
  rowsPerPage,
}: {
  reportData: Row[]
  alertType: string
  branch?: string
  selectedStages: string[]
  fromDate?: string
  toDate?: string
  rowsPerPage?: number
}) {
  const meta = [
    `Branch: ${branch || 'All Branches'}`,
    `Stages: ${selectedStages.length ? selectedStages.map(camelToTitleCase).join(', ') : '—'}`,
    fromDate ? `From: ${fromDate}` : '',
    toDate ? `To: ${toDate}` : '',
  ].filter(Boolean)

  const effectiveRowsPerPage = rowsPerPage ?? getRowsPerPage(meta.length)
  const pages = paginate(reportData, effectiveRowsPerPage)

  const totalCount = reportData.length
  const byStatus = reportData.reduce<Record<string, number>>((acc, r) => {
    const k = (r.status || 'Unknown') as string
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  const baseTitle = `${alertType} Alerts Report`

  return (
    <Document>
      {pages.length === 0 ? (
        <PdfBasePage title={baseTitle} meta={meta}>
          <View style={styles.summaryWrap}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Alerts</Text>
              <Text style={styles.summaryValue}>0</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Selected Stages</Text>
              <Text style={styles.summaryValue}>
                {selectedStages.length ? selectedStages.length : '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>No data</Text>
          <Text style={{ color: colors.subtle, marginTop: 4 }}>
            No alerts match the given filters.
          </Text>
        </PdfBasePage>
      ) : (
        pages.map((rows, pageIndex) => (
          <PdfBasePage key={pageIndex} title={baseTitle} meta={meta}>
            {pageIndex === 0 ? (
              <View style={styles.summaryWrap}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Total Alerts</Text>
                  <Text style={styles.summaryValue}>{totalCount}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Distinct Status</Text>
                  <Text style={styles.summaryValue}>
                    {Object.keys(byStatus).length}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Apply tiny scale on ALL pages for Linux safety; first page a hair more if meta is long */}
            <View
              style={
                pageIndex === 0 && meta.length > 3
                  ? styles.tableScaleFirst
                  : styles.tableScaleAll
              }
            >
              <PdfTable<Row>
                columns={COLUMNS}
                rows={rows.map((r) => ({
                  ...r,
                  status: r.status?.split('_').join(' ') as Row['status'],
                }))}
                zebra
                theme={{
                  border: colors.border,
                  headerBg: colors.headerBg,
                  headerFg: colors.headerFg,
                  zebra: colors.zebra,
                }}
                getRowKey={(r, i) =>
                  r.alertId ? String(r.alertId) : `${pageIndex}-${i}`
                }
              />
            </View>
          </PdfBasePage>
        ))
      )}
    </Document>
  )
}

// import { components } from '@/types/api/v1.js'
// import { Document, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
// import { camelToTitleCase } from '@/lib/utils.ts'
// import { PdfBasePage } from '@/components/reports/pdf/base/PdfBasePage'
// import {
//   PdfTable,
//   PdfTableColumnDef,
// } from '@/components/reports/pdf/table/PdfTable'

// type Row = components['schemas']['AlertSummaryDTO']

// try {
//   Font.registerHyphenationCallback((word: string) => {
//     if (/^[A-Za-z0-9]+$/.test(word) && word.length >= 10) {
//       return word.match(/.{1,4}/g) || [word]
//     }
//     return [word]
//   })
// } catch {
//   // ignore if already registered or in SSR build step
// }

// const colors = {
//   border: '#e5e7eb',
//   headerBg: '#0b1220',
//   headerFg: '#ffffff',
//   zebra: '#f9fafb',
//   cardBg: '#f8fafc',
//   cardBorder: '#e5e7eb',
//   text: '#0f172a',
//   subtle: '#6b7280',
// }

// const styles = StyleSheet.create({
//   summaryWrap: {
//     marginTop: 6,
//     marginBottom: 8,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   summaryCard: {
//     backgroundColor: colors.cardBg,
//     borderColor: colors.cardBorder,
//     borderWidth: 1,
//     borderRadius: 6,
//     padding: 8,
//     marginRight: 8,
//     marginBottom: 8,
//     minWidth: 140,
//   },
//   summaryTitle: { fontSize: 9, color: colors.subtle, marginBottom: 2 },
//   summaryValue: { fontSize: 12, fontWeight: 'bold' },

//   sectionTitle: { marginTop: 4, fontSize: 12, fontWeight: 'bold' },

//   /* New: light scale wrapper so long meta doesn’t push rows off the page */
//   tableScale: { transform: 'scale(0.97)', transformOrigin: 'top left' },
// })

// const COLUMNS: PdfTableColumnDef<Row>[] = [
//   {
//     key: 'alertId',
//     label: 'Alert ID',
//     ratio: 0.9,
//     align: 'center',
//     softWrap: true,
//   },
//   {
//     key: 'accountNo',
//     label: 'Account No',
//     ratio: 1.4,
//     align: 'center',
//     softWrap: true,
//   },
//   {
//     key: 'customerName',
//     label: 'Customer Name',
//     ratio: 1.2,
//     align: 'left',
//     softWrap: true,
//   },
//   {
//     key: 'masterDescription',
//     label: 'Alert Description',
//     ratio: 2.0,
//     align: 'left',
//     softWrap: true,
//   },
//   { key: (r) => r.status, label: 'Status', ratio: 1.2, align: 'center' },
//   { key: 'alertDate', label: 'Alert Date', ratio: 1.2, align: 'center' },
//   { key: 'alertReason', label: 'Alert Reason', ratio: 2.0, align: 'left' },
// ]
// const A4_HEIGHT = 842
// const DEFAULT_TOP_BOTTOM_MARGIN = 56
// const EST_HEADER_BLOCK = 120
// const EST_TABLE_HEADER = 28
// const EST_ROW_HEIGHT = 22

// function getRowsPerPage(metaLines: number) {
//   const metaHeight = Math.min(5, metaLines) * 16
//   const usable =
//     A4_HEIGHT -
//     DEFAULT_TOP_BOTTOM_MARGIN * 2 -
//     EST_HEADER_BLOCK -
//     metaHeight -
//     EST_TABLE_HEADER

//   const rows = Math.max(8, Math.floor(usable / EST_ROW_HEIGHT))
//   return rows
// }

// function paginate<T>(rows: T[], rowsPerPage: number): T[][] {
//   const pages: T[][] = []
//   for (let i = 0; i < rows.length; i += rowsPerPage) {
//     pages.push(rows.slice(i, i + rowsPerPage))
//   }
//   return pages
// }

// export function AlertsReportPdf({
//   reportData,
//   alertType,
//   branch,
//   selectedStages,
//   fromDate,
//   toDate,
//   rowsPerPage,
// }: {
//   reportData: Row[]
//   alertType: string
//   branch?: string
//   selectedStages: string[]
//   fromDate?: string
//   toDate?: string
//   rowsPerPage?: number
// }) {
//   const meta = [
//     `Branch: ${branch || 'All Branches'}`,
//     `Stages: ${
//       selectedStages.length
//         ? selectedStages.map(camelToTitleCase).join(', ')
//         : '—'
//     }`,
//     fromDate ? `From: ${fromDate}` : '',
//     toDate ? `To: ${toDate}` : '',
//   ].filter(Boolean)

//   const effectiveRowsPerPage = rowsPerPage ?? getRowsPerPage(meta.length)

//   const pages = paginate(reportData, effectiveRowsPerPage)
//   const totalCount = reportData.length
//   const byStatus = reportData.reduce<Record<string, number>>((acc, r) => {
//     const k = (r.status || 'Unknown') as string
//     acc[k] = (acc[k] || 0) + 1
//     return acc
//   }, {})

//   const baseTitle = `${alertType} Alerts Report`

//   return (
//     <Document>
//       {pages.length === 0 ? (
//         <PdfBasePage title={baseTitle} meta={meta}>
//           <View style={styles.summaryWrap}>
//             <View style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>Total Alerts</Text>
//               <Text style={styles.summaryValue}>0</Text>
//             </View>
//             <View style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>Selected Stages</Text>
//               <Text style={styles.summaryValue}>
//                 {selectedStages.length ? selectedStages.length : '—'}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.sectionTitle}>No data</Text>
//           <Text style={{ color: colors.subtle, marginTop: 4 }}>
//             No alerts match the given filters.
//           </Text>
//         </PdfBasePage>
//       ) : (
//         pages.map((rows, pageIndex) => (
//           <PdfBasePage key={pageIndex} title={baseTitle} meta={meta}>
//             {pageIndex === 0 ? (
//               <View style={styles.summaryWrap}>
//                 <View style={styles.summaryCard}>
//                   <Text style={styles.summaryTitle}>Total Alerts</Text>
//                   <Text style={styles.summaryValue}>{totalCount}</Text>
//                 </View>
//                 <View style={styles.summaryCard}>
//                   <Text style={styles.summaryTitle}>Distinct Status</Text>
//                   <Text style={styles.summaryValue}>
//                     {Object.keys(byStatus).length}
//                   </Text>
//                 </View>
//               </View>
//             ) : null}

//             <View
//               style={
//                 pageIndex === 0 && meta.length > 3
//                   ? styles.tableScale
//                   : undefined
//               }
//             >
//               <PdfTable<Row>
//                 columns={COLUMNS}
//                 rows={rows.map((r) => ({
//                   ...r,
//                   status: r.status?.split('_').join(' ') as Row['status'],
//                 }))}
//                 zebra
//                 theme={{
//                   border: colors.border,
//                   headerBg: colors.headerBg,
//                   headerFg: colors.headerFg,
//                   zebra: colors.zebra,
//                 }}
//                 getRowKey={(r, i) =>
//                   r.alertId ? String(r.alertId) : `${pageIndex}-${i}`
//                 }
//               />
//             </View>
//           </PdfBasePage>
//         ))
//       )}
//     </Document>
//   )
// }

// import { components } from '@/types/api/v1.js'
// import { Document, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
// import { camelToTitleCase } from '@/lib/utils.ts'
// import { PdfBasePage } from '@/components/reports/pdf/base/PdfBasePage'
// import {
//   PdfTable,
//   PdfTableColumnDef,
// } from '@/components/reports/pdf/table/PdfTable'

// type Row = components['schemas']['AlertSummaryDTO']

// /* --------------------------- 1) GLOBAL HYPHENATION -------------------------- */
// /**
//  * Split very long alphanumeric tokens (esp. pure digits like account numbers)
//  * into 4-char “syllables” so react-pdf can wrap them.
//  * NOTE: This is global for the document; do it once per bundle.
//  */
// try {
//   Font.registerHyphenationCallback((word: string) => {
//     if (/^[A-Za-z0-9]+$/.test(word) && word.length >= 10) {
//       return word.match(/.{1,4}/g) || [word]
//     }
//     return [word]
//   })
// } catch {
//   // ignore if already registered or in SSR build step
// }

// /* ------------------------------- THEME / UI -------------------------------- */
// const colors = {
//   border: '#e5e7eb', // gray-200
//   headerBg: '#0b1220', // deep navy
//   headerFg: '#ffffff',
//   zebra: '#f9fafb', // gray-50
//   cardBg: '#f8fafc', // slate-50
//   cardBorder: '#e5e7eb',
//   text: '#0f172a', // slate-900
//   subtle: '#6b7280', // gray-500
//   gridSplit: '#d1d5db', // gray-300
//   status: {
//     Open: { bg: '#dbeafe', fg: '#1e3a8a' },
//     Pending: { bg: '#fef3c7', fg: '#92400e' },
//     Escalated: { bg: '#fee2e2', fg: '#991b1b' },
//     Closed: { bg: '#dcfce7', fg: '#065f46' },
//     Default: { bg: '#e5e7eb', fg: '#374151' },
//   },
// }

// const styles = StyleSheet.create({
//   // Summary
//   summaryWrap: {
//     marginTop: 6,
//     marginBottom: 8,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   summaryCard: {
//     backgroundColor: colors.cardBg,
//     borderColor: colors.cardBorder,
//     borderWidth: 1,
//     borderRadius: 6,
//     padding: 8,
//     marginRight: 8,
//     marginBottom: 8,
//     minWidth: 140,
//   },
//   summaryTitle: { fontSize: 9, color: colors.subtle, marginBottom: 2 },
//   summaryValue: { fontSize: 12, fontWeight: 'bold' },

//   sectionTitle: { marginTop: 4, fontSize: 12, fontWeight: 'bold' },
// })

// /* ------------------------------ Column Model ------------------------------- */
// const COLUMNS: PdfTableColumnDef<Row>[] = [
//   {
//     key: 'alertId',
//     label: 'Alert ID',
//     ratio: 0.85,
//     align: 'center',
//     softWrap: true,
//   },
//   {
//     key: 'accountNo',
//     label: 'Account No',
//     ratio: 1.6, // slight bump to reduce crowding
//     align: 'center',
//     softWrap: true,
//   },
//   {
//     key: 'customerName',
//     label: 'Customer Name',
//     ratio: 1.3,
//     align: 'left',
//     softWrap: true,
//   },
//   {
//     key: 'masterDescription',
//     label: 'Alert Description',
//     ratio: 2.1,
//     align: 'left',
//   },
//   { key: (r) => r.status, label: 'Status', ratio: 1.4, align: 'center' },
//   { key: 'alertDate', label: 'Alert Date', ratio: 1.4, align: 'center' },
//   { key: 'alertReason', label: 'Alert Reason', ratio: 2.15, align: 'left' },
// ]

// /* ------------------------------- Pagination -------------------------------- */
// function paginate<T>(rows: T[], rowsPerPage: number): T[][] {
//   const pages: T[][] = []
//   for (let i = 0; i < rows.length; i += rowsPerPage) {
//     pages.push(rows.slice(i, i + rowsPerPage))
//   }
//   return pages
// }
// const DEFAULT_ROWS_PER_PAGE = 22

// export function AlertsReportPdf({
//   reportData,
//   alertType,
//   branch,
//   selectedStages,
//   fromDate,
//   toDate,
//   rowsPerPage = DEFAULT_ROWS_PER_PAGE,
// }: {
//   reportData: Row[]
//   alertType: string
//   branch?: string
//   selectedStages: string[]
//   fromDate?: string
//   toDate?: string
//   rowsPerPage?: number
// }) {
//   const meta = [
//     `Branch: ${branch || 'All Branches'}`,
//     `Stages: ${selectedStages.length ? selectedStages.map(camelToTitleCase).join(', ') : '—'}`,
//     fromDate ? `From: ${fromDate}` : '',
//     toDate ? `To: ${toDate}` : '',
//   ].filter(Boolean)

//   const pages = paginate(reportData, rowsPerPage)
//   const totalCount = reportData.length
//   const byStatus = reportData.reduce<Record<string, number>>((acc, r) => {
//     const k = (r.status || 'Unknown') as string
//     acc[k] = (acc[k] || 0) + 1
//     return acc
//   }, {})

//   const baseTitle = `${alertType} Alerts Report`

//   return (
//     <Document>
//       {pages.length === 0 ? (
//         <PdfBasePage title={baseTitle} meta={meta}>
//           <View style={styles.summaryWrap}>
//             <View style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>Total Alerts</Text>
//               <Text style={styles.summaryValue}>0</Text>
//             </View>
//             <View style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>Selected Stages</Text>
//               <Text style={styles.summaryValue}>
//                 {selectedStages.length ? selectedStages.length : '—'}
//               </Text>
//             </View>
//           </View>

//           <Text style={styles.sectionTitle}>No data</Text>
//           <Text style={{ color: colors.subtle, marginTop: 4 }}>
//             No alerts match the given filters.
//           </Text>
//         </PdfBasePage>
//       ) : (
//         pages.map((rows, pageIndex) => (
//           <PdfBasePage key={pageIndex} title={baseTitle} meta={meta}>
//             {pageIndex === 0 ? (
//               <View style={styles.summaryWrap}>
//                 <View style={styles.summaryCard}>
//                   <Text style={styles.summaryTitle}>Total Alerts</Text>
//                   <Text style={styles.summaryValue}>{totalCount}</Text>
//                 </View>
//                 <View style={styles.summaryCard}>
//                   <Text style={styles.summaryTitle}>Distinct Status</Text>
//                   <Text style={styles.summaryValue}>
//                     {Object.keys(byStatus).length}
//                   </Text>
//                 </View>
//               </View>
//             ) : null}

//             {/* TABLE (reusable) */}
//             <PdfTable<Row>
//               columns={COLUMNS}
//               rows={rows.map((r) => ({
//                 ...r,
//                 status: r.status?.split('_').join(' ') as Row['status'],
//               }))}
//               zebra
//               theme={{
//                 border: colors.border,
//                 headerBg: colors.headerBg,
//                 headerFg: colors.headerFg,
//                 zebra: colors.zebra,
//               }}
//               getRowKey={(r, i) =>
//                 r.alertId ? String(r.alertId) : `${pageIndex}-${i}`
//               }
//             />
//           </PdfBasePage>
//         ))
//       )}
//     </Document>
//   )
// }
