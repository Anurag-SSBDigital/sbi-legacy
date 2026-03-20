interface YesNoCellProps {
  value: boolean | undefined
}

export default function YesNoCell({ value }: YesNoCellProps) {
  return value ? 'Yes' : 'No'
}
