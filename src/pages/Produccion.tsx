import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerLista } from '../produccionApi'

interface Origen {
  animales: { id: number; codigo: string; nombre: string } | null
  lotes_animales: { id: number; nombre: string } | null
}

interface RegistroLeche extends Origen {
  id: number
  litros: string
  jornada: string
  observaciones: string | null
  registrado_en: string
  eliminado_en: string | null
  creado_por: { nombre_usuario: string } | null
}

interface RegistroHuevos extends Origen {
  id: number
  cantidad: number
  cantidad_rotos: number
  jornada: string
  observaciones: string | null
  registrado_en: string
  eliminado_en: string | null
  creado_por: { nombre_usuario: string } | null
}

// Rutas reales del backend (confirmadas en Swagger)
const RUTAS_LECHE = ['/produccion-leche']
const RUTAS_HUEVOS = ['/produccion-huevos', '/produccion/huevos']

const fechaHora = (f: string) =>
  new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

const textoOrigen = (r: Origen) =>
  r.animales
    ? `${r.animales.nombre} (${r.animales.codigo})`
    : r.lotes_animales
      ? r.lotes_animales.nombre
      : '—'

function CeldaOrigen({ r }: { r: Origen }) {
  return r.animales ? (
    <Link to={`/animales/${r.animales.id}`} className="text-cafe hover:underline">
      {textoOrigen(r)}
    </Link>
  ) : (
    <>{textoOrigen(r)}</>
  )
}

export default function Produccion() {
  const [leche, setLeche] = useState<RegistroLeche[]>([])
  const [huevos, setHuevos] = useState<RegistroHuevos[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorLeche, setErrorLeche] = useState('')
  const [errorHuevos, setErrorHuevos] = useState('')

  useEffect(() => {
    // Cada lista carga por su cuenta: si una falla, la otra se sigue viendo
    const cargarLeche = obtenerLista<RegistroLeche>(RUTAS_LECHE)
      .then((l) => setLeche(l.filter((x) => !x.eliminado_en)))
      .catch(() => setErrorLeche('No se pudo cargar la producción de leche'))

    const cargarHuevos = obtenerLista<RegistroHuevos>(RUTAS_HUEVOS)
      .then((l) => setHuevos(l.filter((x) => !x.eliminado_en)))
      .catch(() => setErrorHuevos('No se pudo cargar la producción de huevos'))

    Promise.all([cargarLeche, cargarHuevos]).finally(() => setCargando(false))
  }, [])

  const totalLitros = leche.reduce((s, r) => s + Number(r.litros), 0)
  const totalHuevos = huevos.reduce((s, r) => s + r.cantidad, 0)
  const totalRotos = huevos.reduce((s, r) => s + r.cantidad_rotos, 0)

  const lecheOrdenada = [...leche].sort((a, b) => b.registrado_en.localeCompare(a.registrado_en))
  const huevosOrdenados = [...huevos].sort((a, b) => b.registrado_en.localeCompare(a.registrado_en))

  const boton = 'bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Producción</h1>

        {!cargando && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Leche total</p>
              <p className="text-2xl font-bold text-green-800">{totalLitros} L</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Huevos recolectados</p>
              <p className="text-2xl font-bold text-green-800">{totalHuevos}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Huevos rotos</p>
              <p className="text-2xl font-bold text-red-600">{totalRotos}</p>
            </div>
          </div>
        )}

        {/* Leche */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-green-800">Leche</h2>
          <Link to="/produccion/leche/nuevo" className={boton}>
            Registrar leche
          </Link>
        </div>
        {errorLeche && <p className="text-red-600 mb-3">{errorLeche}</p>}
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-8">
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
              ) : lecheOrdenada.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No hay registros de leche
                  </td>
                </tr>
              ) : (
                lecheOrdenada.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{fechaHora(r.registrado_en)}</td>
                    <td className="px-4 py-2">
                      <CeldaOrigen r={r} />
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

        {/* Huevos */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-green-800">Huevos</h2>
          <Link to="/produccion/huevos/nuevo" className={boton}>
            Registrar huevos
          </Link>
        </div>
        {errorHuevos && <p className="text-red-600 mb-3">{errorHuevos}</p>}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Animal / Lote</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Rotos</th>
                <th className="px-4 py-2">Jornada</th>
                <th className="px-4 py-2">Observaciones</th>
                <th className="px-4 py-2">Registró</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : huevosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No hay registros de huevos
                  </td>
                </tr>
              ) : (
                huevosOrdenados.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{fechaHora(r.registrado_en)}</td>
                    <td className="px-4 py-2">
                      <CeldaOrigen r={r} />
                    </td>
                    <td className="px-4 py-2 font-medium">{r.cantidad}</td>
                    <td className="px-4 py-2">{r.cantidad_rotos}</td>
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
    </div>
  )
}