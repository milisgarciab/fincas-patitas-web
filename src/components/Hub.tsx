import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { puede } from '../permisos'
import type { Permiso } from '../permisos'

export interface TarjetaHub {
  titulo: string
  descripcion: string
  ruta: string
  icono: LucideIcon
  permiso?: Permiso
}

export default function Hub({
  titulo,
  subtitulo,
  tarjetas,
}: {
  titulo: string
  subtitulo: string
  tarjetas: TarjetaHub[]
}) {
  const visibles = tarjetas.filter((t) => !t.permiso || puede(t.permiso))

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marron">{titulo}</h1>
        <p className="text-sm text-gray-500">{subtitulo}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibles.map((t) => {
          const Icono = t.icono
          return (
            <Link
              key={t.ruta}
              to={t.ruta}
              className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-menta flex items-center justify-center shrink-0">
                  <Icono className="w-6 h-6 text-bosque" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-xl text-marron">{t.titulo}</h2>
                  <p className="text-sm text-gray-500">{t.descripcion}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-bosque">
                Entrar <ArrowRight className="w-4 h-4" />
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}