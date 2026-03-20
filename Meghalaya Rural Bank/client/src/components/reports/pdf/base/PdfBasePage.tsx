// BasePage.tsx
import { ReactNode, useMemo } from 'react'
import { Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'
import BannerImg from '@/assets/banner.png'
import { useAuthStore } from '@/stores/authStore.ts'

type FooterInfo = {
  username?: string
  fullName?: string
  /** If omitted, defaults to now */
  generatedAt?: Date | string
  /** e.g., "Surat, GJ" or branch name */
  location?: string
  /** e.g., "Asia/Kolkata" (used for date formatting if available) */
  timeZone?: string
}

const theme = {
  page: {
    bg: '#FFFFFF',
    text: '#0f172a', // slate-900
    subtle: '#6b7280', // gray-500
  },
  surface: {
    border: '#e5e7eb', // gray-200
    tint: '#f8fafc', // slate-50
  },
  brand: {
    headerBg: '#111827', // gray-900
    headerFg: '#ffffff',
    chipBg: '#eef2ff', // indigo-50
    chipBorder: '#c7d2fe', // indigo-200
    chipFg: '#3730a3', // indigo-800
  },
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: theme.page.bg,
    color: theme.page.text,
    fontSize: 10,
    fontFamily: 'Helvetica',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  headerContainer: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
  },
  banner: {
    width: '100%',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaChip: {
    borderWidth: 1,
    borderColor: theme.brand.chipBorder,
    backgroundColor: theme.brand.chipBg,
    color: theme.brand.chipFg,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9,
  },
  divider: {
    marginTop: 10,
    height: 1,
    backgroundColor: theme.surface.border,
  },
  content: { flexGrow: 1 },

  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    fontSize: 8,
    color: theme.page.subtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: { flexDirection: 'column' },
  footerLine: { marginTop: 2 },

  watermark: {
    position: 'absolute',
    top: '38%',
    left: '16%',
    width: '70%',
    opacity: 0.05,
  },
})

function formatGeneratedAt(dateLike: Date | string | undefined, tz?: string) {
  const d =
    dateLike instanceof Date
      ? dateLike
      : dateLike
        ? new Date(dateLike)
        : new Date()

  // Conservative formatting that works well in react-pdf environments
  try {
    // Prefer explicit Intl with timeZone when available
    const fmtDate = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

    const fmtTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d)

    return `${fmtDate} ${fmtTime}${tz ? ` (${tz})` : ''}`
  } catch {
    // Fallback if Intl/timeZone not supported in the rendering context
    return d.toISOString()
  }
}

export function PdfBasePage({
  title,
  meta,
  footerNote,
  children,
  bannerSrc = BannerImg,
  bannerMaxHeight = 70,
  footerInfo,
  watermarkImage, // optional faint background image
}: {
  title: string
  meta?: string[]
  footerNote?: string
  children: ReactNode
  bannerSrc?: string | null
  bannerMaxHeight?: number
  footerInfo?: FooterInfo
  watermarkImage?: string | null
}) {
  const user = useAuthStore((state) => state.auth.user)

  const resolvedTz =
    footerInfo?.timeZone ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC') ||
    'UTC'

  const generatedAtText = formatGeneratedAt(footerInfo?.generatedAt, resolvedTz)
  const displayFullName =
    footerInfo?.fullName || user?.fullName || user?.name || ''
  const displayUsername = footerInfo?.username || user?.username || ''
  const displayLocation = footerInfo?.location || ''

  // Estimate header height to keep main content below fixed header
  const headerHeight = useMemo(() => {
    const top = 24
    const titleBlock = title ? 22 : 0
    const metaLines = meta?.length ?? 0
    // meta chips wrap—give a bit more room per item
    const metaBlock = metaLines > 0 ? 26 : 0
    const bannerBlock = bannerSrc ? bannerMaxHeight + 10 : 0
    const bottomGap = 12
    return top + bannerBlock + titleBlock + metaBlock + bottomGap
  }, [title, meta, bannerSrc, bannerMaxHeight])

  return (
    <Page size='A4' style={[styles.page, { paddingTop: headerHeight }]}>
      {/* Optional watermark */}
      {watermarkImage ? (
        <Image src={watermarkImage} style={styles.watermark} fixed />
      ) : null}

      {/* Header */}
      <View style={styles.headerContainer} fixed>
        {bannerSrc ? (
          <Image
            src={bannerSrc}
            style={[styles.banner, { maxHeight: bannerMaxHeight }]}
          />
        ) : null}

        {title ? <Text style={styles.title}>{title}</Text> : null}

        {meta && meta.length > 0 ? (
          <View style={styles.metaWrap}>
            {meta.map((m, i) => (
              <Text key={i} style={styles.metaChip}>
                {m}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />
      </View>

      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <View style={styles.footerLeft}>
          <Text>
            Generated by: {displayFullName || '—'}
            {displayUsername ? ` (${displayUsername})` : ''}
          </Text>
          <Text style={styles.footerLine}>Generated at: {generatedAtText}</Text>
          {displayLocation ? (
            <Text style={styles.footerLine}>Location: {displayLocation}</Text>
          ) : null}
          {footerNote ? (
            <Text style={styles.footerLine}>{footerNote}</Text>
          ) : null}
        </View>

        <Text
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  )
}
