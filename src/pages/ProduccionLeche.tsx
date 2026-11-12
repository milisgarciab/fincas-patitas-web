import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { obtenerLista } from '../produccionApi'
import { fechaLocal, hoyLocal } from '../fechas'

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

const RUTAS_LECHE = ['/produccion-leche']

export default function ProduccionLeche() {
  const [registros, setRegistros] = useState<RegistroLeche[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerLista<RegistroLeche>(RUTAS_LECHE)
      .then((l) => setRegistros(l.filter((x) => !x.eliminado_en)))
      .catch(() => setError('No se pudo cargar la producción de leche'))
      .finally(() => setCargando(false))
  }, [])

  const hoy = hoyLocal()
  const total = registros.reduce((s, r) => s + Number(r.litros), 0)
  const litrosHoy = registros
    .filter((r) => fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + Number(r.litros), 0)

  const ordenados = [...registros].sort((a, b) => b.registrado_en.localeCompare(a.registrado_en))

  const fechaHora = (f: string) =>
    new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

  const origen = (r: RegistroLeche) =>
    r.animales
      ? `${r.animales.nombre} (${r.animales.codigo})`
      : r.lotes_animales
        ? r.lotes_animales.nombre
        : '—'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <Link
        to="/produccion"
        className="inline-flex items-center gap-1 text-sm font-semibold text-bosque hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Producción
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-menta flex items-center justify-center text-3xl">
            🥛
          </span>
          <h1 className="text-2xl font-bold text-marron">Leche</h1>
        </div>
        <Link
          to="/produccion/leche/nuevo"
          className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          Registrar leche
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-display font-bold text-2xl text-marron">{total} L</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Hoy</p>
            <p className="font-display font-bold text-2xl text-marron">{litrosHoy} L</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Registros</p>
            <p className="font-display font-bold text-2xl text-marron">{registros.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
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
            ) : ordenados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay registros de leche
                </td>
              </tr>
            ) : (
              ordenados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm">{fechaHora(r.registrado_en)}</td>
                  <td className="px-4 py-2">
                    {r.animales ? (
                      <Link to={`/animales/${r.animales.id}`} className="text-bosque hover:underline">
                        {origen(r)}
                      </Link>
                    ) : (
                      origen(r)
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{r.litros} L</td>
                  <td className="px-4 py-2">{r.jornada}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.observaciones ?? '—'}</td>
                  <td className="px-4 py-2 text-sm">{r.creado_por?.nombre_usuario ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}