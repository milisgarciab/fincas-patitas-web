import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { aLista, cargarAnimales } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'

const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'

export default function Nacimientos() {
  const [nacimientos, setNacimientos] = useState<any[]>([])
  const [animales, setAnimales] = useState<AnimalResumen[]>([])
  const [texto, setTexto] = useState('')
  const [anio, setAnio] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([api.get('/nacimientos'), cargarAnimales()])
      .then(([n, a]) => {
        if (n.status === 'fulfilled') setNacimientos(aLista(n.value.data))
        else setError('No se pudieron cargar los nacimientos')
        setAnimales(a.status === 'fulfilled' ? a.value : [])
      })
      .finally(() => setCargando(false))
  }, [])

  const nombreDe = (id: number | null) => {
    if (!id) return '—'
    const a = animales.find((x) => x.id === id)
    return a ? `${a.nombre ?? 'Sin nombre'} (${a.codigo})` : `Animal #${id}`
  }

  const anios = [
    ...new Set(
      nacimientos
        .map((n) => (n.fecha_nacimiento ? String(n.fecha_nacimiento).slice(0, 4) : null))
        .filter(Boolean) as string[],
    ),
  ].sort((a, b) => b.localeCompare(a))

  const visibles = nacimientos
    .filter((n) => !anio || String(n.fecha_nacimiento).startsWith(anio))
    .filter((n) => {
      const q = texto.trim().toLowerCase()
      if (!q) return true
      return (
        n.nombre?.toLowerCase().includes(q) ||
        n.codigo?.toLowerCase().includes(q) ||
        nombreDe(n.madre_id).toLowerCase().includes(q) ||
        nombreDe(n.padre_id).toLowerCase().includes(q)
      )
    })
    .sort((a, b) => String(b.fecha_nacimiento).localeCompare(String(a.fecha_nacimiento)))

  const enlace = (id: number | null) =>
    id ? (
      <Link to={`/animales/${id}`} className="text-bosque hover:underline">
        {nombreDe(id)}
      </Link>
    ) : (
      '—'
    )

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marron">Nacimientos</h1>
        <p className="text-sm text-gray-500">Animales nacidos en la finca y sus progenitores</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="bg-white rounded-xl shadow-sm p-4 inline-block">
          <p className="text-sm text-gray-500">Nacimientos registrados</p>
          <p className="text-2xl font-bold text-marron">{nacimientos.length}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por cría, madre o padre..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
        />
        <select
          value={anio}
          onChange={(e) => setAnio(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todos los años</option>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Cría</th>
              <th className="px-4 py-2">Género</th>
              <th className="px-4 py-2">Nacimiento</th>
              <th className="px-4 py-2">Madre</th>
              <th className="px-4 py-2">Padre</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No hay nacimientos para mostrar
                </td>
              </tr>
            ) : (
              visibles.map((n) => (
                <tr key={n.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm">
                    <Link to={`/animales/${n.id}`} className="text-bosque hover:underline font-medium">
                      {n.nombre ?? 'Sin nombre'}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">{n.codigo}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">{n.genero}</td>
                  <td className="px-4 py-2 text-sm">{fechaDia(n.fecha_nacimiento)}</td>
                  <td className="px-4 py-2 text-sm">{enlace(n.madre_id)}</td>
                  <td className="px-4 py-2 text-sm">{enlace(n.padre_id)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}