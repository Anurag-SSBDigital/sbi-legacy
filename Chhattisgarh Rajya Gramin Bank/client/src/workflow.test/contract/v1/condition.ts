type JsonValue = unknown

export type ConditionV1T =
  | {
      op: 'EQ' | 'NE' | 'GT' | 'LT' | 'GTE' | 'LTE'
      field: string
      value: JsonValue
    }
  | { op: 'IN'; field: string; value: JsonValue[] }
  | { op: 'AND'; conditions: ConditionV1T[] }
  | { op: 'OR'; conditions: ConditionV1T[] }
  | { op: 'NOT'; condition: ConditionV1T }

export function evalCondition(
  cond: ConditionV1T | undefined,
  values: Record<string, unknown>
): boolean {
  if (!cond) return true

  const left = (field: string) => values?.[field]

  switch (cond.op) {
    case 'EQ':
      return left(cond.field) === cond.value
    case 'NE':
      return left(cond.field) !== cond.value
    case 'GT':
      return compare(left(cond.field), cond.value) > 0
    case 'LT':
      return compare(left(cond.field), cond.value) < 0
    case 'GTE':
      return compare(left(cond.field), cond.value) >= 0
    case 'LTE':
      return compare(left(cond.field), cond.value) <= 0
    case 'IN':
      return Array.isArray(cond.value)
        ? cond.value.includes(left(cond.field))
        : false
    case 'AND':
      return cond.conditions.every((c) =>
        evalCondition(c as ConditionV1T, values)
      )
    case 'OR':
      return cond.conditions.some((c) =>
        evalCondition(c as ConditionV1T, values)
      )
    case 'NOT':
      return !evalCondition(cond.condition as ConditionV1T, values)
  }
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  return 0
}
