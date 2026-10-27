import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

interface Evento {
  id: number
  animal_id: number
  tipo_evento: string
  dosis_aplicada: string | null
  descripcion_tratamiento: string | null
  fecha_evento: string
  estado: string
  animales: { id: number; codigo: string; nombre: string } | null
}

const ESTADOS = ['Abierto', 'En tratamiento', 'Resuelto']

const colorEstado = (estado: string) =>
  estado === 'Abierto'
    ? 'bg-red-100 text-red-700'
    : estado === 'En tratamiento'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800'

export default function EventosSanitarios() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [filtro, setFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState<number | null>(null)

  useEffect(() => {
    api
      .get('/eventos-sanitarios')
      .then((r) => setEventos(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => setError('No se pudieron cargar los eventos sanitarios'))
      .finally(() => setCargando(false))
  }, [])

  const cambiarEstado = async (id: number, estado: string) => {
    setError('')
    setActualizando(id)
    try {
      await api.patch(`/eventos-sanitarios/${id}/estado`, { estado })
      setEventos((lista) => lista.map((e) => (e.id === id ? { ...e, estado } : e)))
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo cambiar el estado')
    } finally {
      setActualizando(null)
    }
  }

  // Fecha en UTC para que no se corra un día
  const fecha = (f: string) =>
    new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' })

  const visibles = eventos
    .filter((e) => !filtro || e.estado === filtro)
    .sort((a, b) => b.fecha_evento.localeCompare(a.fecha_evento))

  const abiertos = eventos.filter((e) => e.estado === 'Abierto').length

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Salud animal</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/salud/nuevo"
              className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
            >
              Nuevo evento
            </Link>
            <Link to="/inicio" className="text-green-700 hover:underline">
              ← Inicio
            </Link>
          </div>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {!cargando && (
          <div className="flex gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Eventos</p>
              <p className="text-2xl font-bold text-green-800">{eventos.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Casos abiertos</p>
              <p className="text-2xl font-bold text-red-600">{abiertos}</p>
            </div>
          </div>
        )}

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-4 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Animal</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Dosis</th>
                <th className="px-4 py-2">Tratamiento</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No hay eventos para mostrar
                  </td>
                </tr>
              ) : (
                visibles.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{fecha(e.fecha_evento)}</td>
                    <td className="px-4 py-2">
                      {e.animales ? (
                        <Link
                          to={`/animales/${e.animales.id}`}
                          className="text-green-700 hover:underline"
                        >
                          {e.animales.nombre} ({e.animales.codigo})
                        </Link>
                      ) : (
                        `Animal #${e.animal_id}`
                      )}
                    </td>
                    <td className="px-4 py-2">{e.tipo_evento}</td>
                    <td className="px-4 py-2">{e.dosis_aplicada ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {e.descripcion_tratamiento ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={e.estado}
                        disabled={actualizando === e.id}
                        onChange={(ev) => cambiarEstado(e.id, ev.target.value)}
                        className={`px-2 py-1 rounded-full text-sm border-0 ${colorEstado(e.estado)}`}
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
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