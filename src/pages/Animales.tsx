import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

interface Animal {
  id: number
  codigo: string
  nombre: string
  genero: string
  estado: string
  fecha_nacimiento: string | null
  especies: { nombre: string }
  razas: { nombre: string }
}

interface Paginacion {
  pagina: number
  limite: number
  total: number
  totalPaginas: number
}

// Nombre del parámetro de búsqueda del backend (verifícalo en Swagger)
const PARAM_BUSQUEDA = 'buscar'

export default function Animales() {
  const [animales, setAnimales] = useState<Animal[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null)
  const [pagina, setPagina] = useState(1)
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(texto)
      setPagina(1)
    }, 400)
    return () => clearTimeout(t)
  }, [texto])

  useEffect(() => {
    setCargando(true)
    setError('')
    api
      .get('/animales', {
        params: { pagina, limite: 10, [PARAM_BUSQUEDA]: busqueda || undefined },
      })
      .then((r) => {
        setAnimales(r.data.data)
        setPaginacion(r.data.paginacion)
      })
      .catch(() => setError('No se pudieron cargar los animales'))
      .finally(() => setCargando(false))
  }, [pagina, busqueda])

  const fecha = (f: string | null) =>
    f ? new Date(f).toLocaleDateString('es-CO') : '—'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Animales</h1>
          <Link to="/inicio" className="text-green-700 hover:underline">
            ← Inicio
          </Link>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full mb-4 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
        />

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Especie</th>
                <th className="px-4 py-2">Raza</th>
                <th className="px-4 py-2">Género</th>
                <th className="px-4 py-2">Nacimiento</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : animales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No hay animales para mostrar
                  </td>
                </tr>
              ) : (
                animales.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-green-50">
                    <td className="px-4 py-2 font-mono text-sm">
                      <Link to={`/animales/${a.id}`} className="text-green-700 hover:underline">
                        {a.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/animales/${a.id}`} className="hover:underline">
                        {a.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{a.especies?.nombre}</td>
                    <td className="px-4 py-2">{a.razas?.nombre}</td>
                    <td className="px-4 py-2">{a.genero}</td>
                    <td className="px-4 py-2">{fecha(a.fecha_nacimiento)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm ${
                          a.estado === 'Activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginacion && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-gray-600 text-sm">
              {paginacion.total} animales · Página {paginacion.pagina} de{' '}
              {Math.max(paginacion.totalPaginas, 1)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => p - 1)}
                disabled={pagina <= 1}
                className="px-3 py-1 rounded-lg bg-green-700 text-white disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina >= paginacion.totalPaginas}
                className="px-3 py-1 rounded-lg bg-green-700 text-white disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}