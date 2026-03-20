type CircularProgressProps = {
  size?: number
  strokeWidth?: number
  value: number // 0 to 100
  className?: string
}

export function CircularProgress({
  size = 48,
  strokeWidth = 4,
  value,
  className = '',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className={`rotate-[-90deg] ${className}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke='gray'
        strokeWidth={strokeWidth}
        className='text-gray-300'
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill='none'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className='text-primary transition-all duration-300 ease-out'
        strokeLinecap='round'
      />
    </svg>
  )
}
