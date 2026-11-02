import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icono: LucideIcon
  tipo?: string
  placeholder: string
  valor: string
  onCambio: (v: string) => void
  etiqueta?: string
  requerido?: boolean
  minimo?: number
}

export default function CampoAuth({
  icono: Icono,
  tipo = 'text',
  placeholder,
  valor,
  onCambio,
  etiqueta,
  requerido = true,
  minimo,
}: Props) {
  const [ver, setVer] = useState(false)
  const esClave = tipo === 'password'

  return (
    <label className="block">
      {etiqueta && (
        <span className="block text-xs font-medium text-bosque-oscuro mb-1">{etiqueta}</span>
      )}
      <span className="relative block">
        <Icono className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type={esClave && ver ? 'text' : tipo}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          required={requerido}
          minLength={minimo}
          className="w-full rounded-lg border border-black/10 bg-white pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/40"
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </span>
    </label>
  )
}