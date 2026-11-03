import { Link } from 'react-router-dom'
import { puede } from '../permisos'
import type { Permiso } from '../permisos'

interface Tarjeta {
  icono: string
  titulo: string
  texto: string
  ruta: string
  permiso?: Permiso
}

const TARJETAS: Tarjeta[] = [
  { icono: '🐄', titulo: 'Animales', texto: 'Lista, detalle y edición de tu ganado.', ruta: '/animales' },
  { icono: '🥛', titulo: 'Producción', texto: 'Leche y huevos en un solo lugar.', ruta: '/produccion' },
  { icono: '📦', titulo: 'Inventario', texto: 'Insumos, categorías y stock bajo.', ruta: '/bodega' },
  { icono: '💉', titulo: 'Salud animal', texto: 'Vacunas, tratamientos y seguimiento.', ruta: '/salud' },
  { icono: '🐣', titulo: 'Reproducción', texto: 'Gestaciones: confirmar y cerrar.', ruta: '/reproduccion' },
  { icono: '💰', titulo: 'Gastos y ventas', texto: 'Control de ingresos y egresos.', ruta: '/finanzas', permiso: 'finanzas.ver' },
  { icono: '📊', titulo: 'Precios y balance', texto: 'Precios de mercado y balances.', ruta: '/finanzas/balance', permiso: 'finanzas.ver' },
]

export default function Inicio() {
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')
  const visibles = TARJETAS.filter((t) => !t.permiso || puede(t.permiso))

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-green-800">
        Bienvenida, {user.nombre_usuario}
      </h1>
      <p className="text-gray-600 mt-1 mb-6">¿Qué quieres hacer hoy en la finca?</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibles.map((t) => (
          <Link
            key={t.ruta}
            to={t.ruta}
            className="bg-white rounded-xl shadow p-5 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <div className="text-4xl mb-3">{t.icono}</div>
            <h2 className="text-lg font-semibold text-green-800">{t.titulo}</h2>
            <p className="text-sm text-gray-600 mt-1">{t.texto}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}