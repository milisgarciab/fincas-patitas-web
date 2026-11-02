import { useState } from 'react'
import { PawPrint } from 'lucide-react'

export default function Logo({ claro = false }: { claro?: boolean }) {
  const [sinImagen, setSinImagen] = useState(false)

  return (
    <div className="flex items-center gap-3">
      {sinImagen ? (
        <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow">
          <PawPrint className="w-6 h-6 text-bosque" />
        </span>
      ) : (
        <img
          src="/logo.png"
          alt="Fincas y Patitas"
          className="w-11 h-11 object-contain"
          onError={() => setSinImagen(true)}
        />
      )}
      <span
        className={`text-xl font-bold leading-tight ${
          claro ? 'text-white' : 'text-bosque-oscuro'
        }`}
      >
        Fincas y<br />
        Patitas
      </span>
    </div>
  )
}