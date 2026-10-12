import { useEffect, type ReactNode } from 'react'

/** Bottom sheet on phones, centered dialog on iPad/desktop. */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4 no-print" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-n10-border bg-n10-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button type="button" className="-mr-2 -mt-2 min-h-[48px] min-w-[48px] text-2xl leading-none text-n10-mute" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
