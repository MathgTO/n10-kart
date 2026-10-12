import { formatGradeParts, type Letter } from '@/lib/grades'

/**
 * Grade letter on a fixed vertical axis: base glyph centered in a fixed cell;
 * +/− hangs in a fixed suffix cell so A / A+ / A- bases stack in one column.
 */
export function GradeLetter({
  letter,
  className = '',
  size = 'lg',
}: {
  letter: Letter | string | null | undefined
  className?: string
  size?: 'sm' | 'lg' | 'xl'
}) {
  const parts = formatGradeParts(letter)
  if (!parts) return null
  const baseCls =
    size === 'xl' ? 'text-4xl' : size === 'lg' ? 'text-xl' : 'text-sm'
  const sufCls = size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-lg' : 'text-xs'
  const baseW = size === 'xl' ? 'w-[1.15em]' : 'w-[1.05em]'
  const sufW = size === 'xl' ? 'w-[0.65em]' : 'w-[0.55em]'
  return (
    <span className={`inline-flex items-baseline justify-end tabular-nums ${className}`} aria-label={String(letter)}>
      <span className={`inline-block ${baseW} text-center font-extrabold leading-none ${baseCls}`}>{parts.base}</span>
      <span className={`inline-block ${sufW} text-left font-extrabold leading-none ${sufCls}`}>
        {parts.suffix || '\u00a0'}
      </span>
    </span>
  )
}
