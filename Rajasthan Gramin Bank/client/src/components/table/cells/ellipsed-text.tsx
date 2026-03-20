interface EllipsedTextProps {
  text: string
  maxWidth?: string | number
  className?: string
}

export default function EllipsedText({
  text,
  maxWidth = 150,
  className = '',
}: EllipsedTextProps) {
  return (
    <div
      title={text}
      className={`truncate overflow-hidden whitespace-nowrap ${className}`}
      style={{ maxWidth }}
    >
      {text}
    </div>
  )
}
