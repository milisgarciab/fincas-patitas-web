import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export default function Modal({ titulo, onCerrar, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-marron">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="p-1 rounded-lg hover:bg-black/5"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}