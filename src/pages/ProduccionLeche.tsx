import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerLista } from '../produccionApi'

interface RegistroLeche {
  id: number
  litros: string
  jornada: string
  observaciones: string | null
  registrado_en: string
  eliminado_en: string | null
  animales: { id: number; codigo: string; nombre: string } | null
  lotes_animales: { id: number; nombre: string } | null
  creado_por: { nombre_usuario: string } | null
}

// Rutas posibles del backend: se prueban en este orden
const RUTAS_LECHE = [
  '/production/leche',
  '/production/milk',
  '/produccion/leche',
  '/production/leches',
  '/production/produccion-leche',
  '/leche',
]

export default function ProduccionLeche() {
  const [registros, setRegistros] = useState<RegistroLeche[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerLista<RegistroLeche>(RUTAS_LECHE)
      .then((lista) => setRegistros(lista.filter((x) => !x.eliminado_en)))
      .catch((err) =>
        setError(
          err.message === 'RUTA_NO_ENCONTRADA'
            ? `No se encontró la ruta de leche en el backend. Probé: ${RUTAS_LECHE.join(', ')}`
            : 'No se pudo cargar la producción de leche',
        ),
      )
      .finally(() => setCargando(false))
  }, [])

  const totalLitros = registros.reduce((suma, r) => suma + Number(r.litros), 0)

  const fechaHora = (f: string) =>
    new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

  const origen = (r: RegistroLeche) =>
    r.animales
      ? `${r.animales.nombre} (${r.animales.codigo})`
      : r.lotes_animales
        ? r.lotes_animales.nombre
        : '—'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Producción de leche</h1>
          <Link to="/inicio" className="text-green-700 hover:underline">
            ← Inicio
          </Link>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {!cargando && !error && (
          <div className="bg-white rounded-xl shadow p-4 mb-4 inline-block">
            <p className="text-sm text-gray-500">Total registrado</p>
            <p className="text-2xl font-bold text-green-800">{totalLitros} L</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Animal / Lote</th>
                <th className="px-4 py-2">Litros</th>
                <th className="px-4 py-2">Jornada</th>
                <th className="px-4 py-2">Observaciones</th>
                <th className="px-4 py-2">Registró</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No hay registros de leche
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{fechaHora(r.registrado_en)}</td>
                    <td className="px-4 py-2">
                      {r.animales ? (
                        <Link
                          to={`/animales/${r.animales.id}`}
                          className="text-green-700 hover:underline"
                        >
                          {origen(r)}
                        </Link>
                      ) : (
                        origen(r)
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium">{r.litros} L</td>
                    <td className="px-4 py-2">{r.jornada}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {r.observaciones ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {r.creado_por?.nombre_usuario ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}