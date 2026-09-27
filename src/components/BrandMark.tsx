/** App mark — lime chevron from brand plate (no letterforms). */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <img
      src={asset('n10-mark.png')}
      alt="N10"
      className={className}
      width={64}
      height={64}
      decoding="async"
    />
  )
}

/** Header lockup: full brand plate (chevron + N10 + tagline). */
export function BrandLockup() {
  return (
    <span className="flex min-w-0 items-center">
      <img
        src={asset('n10-logo.jpg')}
        alt="N10 — The next tenth. This session."
        className="h-10 w-auto max-w-[min(100%,220px)] sm:h-11 sm:max-w-[280px] rounded-md object-contain object-left"
        decoding="async"
      />
    </span>
  )
}
