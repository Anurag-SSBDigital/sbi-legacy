// components/reports/base/PdfTable.tsx
import React from 'react'
import { View, Text, StyleSheet, Styles } from '@react-pdf/renderer'

type Accessor<T> = keyof T | ((row: T) => string | number | null | undefined)

export type PdfTableColumnDef<T> = {
  key: Accessor<T>
  label: string
  ratio: number
  align?: 'left' | 'center' | 'right'
  /**
   * When true, inserts zero-width breaks in long tokens to force wrapping.
   * Useful for account numbers, long IDs, etc.
   */
  softWrap?: boolean
  /**
   * Optional custom cell renderer.
   * If provided, it receives the already-stringified value and the whole row.
   */
  render?: (value: string, row: T) => React.ReactNode
}

type Theme = {
  border: string
  headerBg: string
  headerFg: string
  zebra: string
}

export type PdfTableProps<T> = {
  columns: PdfTableColumnDef<T>[]
  rows: T[]
  getRowKey?: (row: T, index: number) => string | number
  zebra?: boolean
  theme?: Partial<Theme>
  style?: Styles
  headerStyle?: Styles
  rowStyle?: Styles
  cellStyle?: Styles
  cellTextStyle?: Styles
}

const DEFAULT_THEME: Theme = {
  border: '#e5e7eb',
  headerBg: '#0b1220',
  headerFg: '#ffffff',
  zebra: '#f9fafb',
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

/** Insert zero-width spaces every N chars in long alphanumeric runs to force wrap. */
// function zwspWrap(s: string, group = 4): string {
//   if (!s) return ''
//   // Only split long alphanumeric chunks; leave words with spaces/punctuation alone
//   return s.replace(/[A-Za-z0-9]{10,}/g, (m) => {
//     const parts = m.match(new RegExp(`.{1,${group}}`, 'g')) || [m]
//     return parts.join('\u200b')
//   })
// }

export function PdfTable<T>({
  columns,
  rows,
  getRowKey,
  zebra = true,
  theme,
  style,
  headerStyle,
  rowStyle,
  cellStyle,
  cellTextStyle,
}: PdfTableProps<T>) {
  const t = { ...DEFAULT_THEME, ...(theme || {}) }
  const totalRatio = columns.reduce((acc, c) => acc + c.ratio, 0)

  const styles = StyleSheet.create({
    tableWrap: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 6,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: t.headerBg,
    },
    headerCell: {
      borderRightWidth: 1,
      borderRightColor: '#0f172a',
      paddingVertical: 6,
      paddingHorizontal: 6,
      justifyContent: 'center',
    },
    headerText: {
      color: t.headerFg,
      fontWeight: 'bold',
      fontSize: 10,
    },
    row: {
      flexDirection: 'row',
    },
    zebra: {
      backgroundColor: zebra ? t.zebra : 'transparent',
    },
    cell: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      borderRightWidth: 1,
      borderRightColor: t.border,
      paddingVertical: 6,
      paddingHorizontal: 6,
      justifyContent: 'center',
    },
    last: { borderRightWidth: 0 },
    cellText: {
      fontSize: 10,
      lineHeight: 1.3,
    },
    textLeft: { textAlign: 'left' },
    textCenter: { textAlign: 'center' },
    textRight: { textAlign: 'right' },
  })

  return (
    <View style={[styles.tableWrap, style].filter((x) => !!x)}>
      {/* Header */}
      <View
        style={[styles.headerRow, headerStyle].filter((x) => !!x)}
        wrap={false}
      >
        {columns.map((c, i) => (
          <View
            key={`h-${c.label}-${i}`}
            style={[
              styles.headerCell,
              { width: `${(c.ratio / totalRatio) * 100}%` },
              i === columns.length - 1 && { borderRightWidth: 0 },
            ].filter((x) => !!x)}
          >
            <Text
              style={[
                styles.headerText,
                c.align === 'center' && styles.textCenter,
                c.align === 'right' && styles.textRight,
              ].filter((x) => !!x)}
            >
              {c.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      {rows.map((r, rowIdx) => {
        const rowKey =
          (getRowKey ? getRowKey(r, rowIdx) : undefined) ?? `r-${rowIdx}`
        const isZebra = rowIdx % 2 === 0

        return (
          <View
            key={String(rowKey)}
            style={[styles.row, isZebra && styles.zebra, rowStyle].filter(
              (x) => !!x
            )}
            wrap={false}
          >
            {columns.map((c, colIdx) => {
              const raw = typeof c.key === 'function' ? c.key(r) : r[c.key]
              const value = asText(raw)

              // Soften long alphanumeric strings if requested
              // if (c.softWrap) value = zwspWrap(value)

              const widthStyle = { width: `${(c.ratio / totalRatio) * 100}%` }
              const alignStyle =
                c.align === 'center'
                  ? styles.textCenter
                  : c.align === 'right'
                    ? styles.textRight
                    : styles.textLeft

              return (
                <View
                  key={`c-${rowKey}-${colIdx}`}
                  style={[
                    styles.cell,
                    widthStyle,
                    colIdx === columns.length - 1 && styles.last,
                    cellStyle,
                  ].filter((x) => !!x)}
                >
                  {c.render ? (
                    // Custom renderer gets string value + full row
                    c.render(value, r)
                  ) : (
                    <Text
                      style={[
                        styles.cellText,
                        alignStyle,
                        cellTextStyle,
                      ].filter((x) => !!x)}
                    >
                      {value}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}
