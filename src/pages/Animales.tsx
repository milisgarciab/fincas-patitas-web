import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

interface Animal {
  id: number
  codigo: string
  nombre: string
  genero: string
  estado: string
  fecha_nacimiento: string | null
  especies: { nombre: string } | null
  razas: { nombre: string } | null
}

const POR_PAGINA = 10

export default function Animales() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''

  const [animales, setAnimales] = useState<Animal[]>([])
  const [texto, setTexto] = useState(q)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/animales', { params: { pagina: 1, limite: 100 } })
      .then((r) => setAnimales(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => setError('No se pudieron cargar los animales'))
      .finally(() => setCargando(false))
  }, [])

  // Si se busca desde la barra de arriba, el texto cambia solo
  useEffect(() => {
    setTexto(q)
    setPagina(1)
  }, [q])

  const cambiarTexto = (valor: string) => {
    setTexto(valor)
    setPagina(1)
    setParams(valor ? { q: valor } : {}, { replace: true })
  }

  const busqueda = texto.trim().toLowerCase()
  const filtrados = animales.filter(
    (a) =>
      !busqueda ||
      a.nombre.toLowerCase().includes(busqueda) ||
      a.codigo.toLowerCase().includes(busqueda) ||
      a.especies?.nombre.toLowerCase().includes(busqueda) ||
      a.razas?.nombre.toLowerCase().includes(busqueda),
  )

  const totalPaginas = Math.max(Math.ceil(filtrados.length / POR_PAGINA), 1)
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const fecha = (f: string | null) => (f ? new Date(f).toLocaleDateString('es-CO') : '—')

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">Animales</h1>
          <Link
            to="/animales/nuevo"
            className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            Nuevo animal
          </Link>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre, código, especie o raza..."
          value={texto}
          onChange={(e) => cambiarTexto(e.target.value)}
          className="w-full mb-4 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
        />

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bosque text-white">
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
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No hay animales para mostrar
                  </td>
                </tr>
              ) : (
                visibles.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-menta/40">
                    <td className="px-4 py-2 font-mono text-sm">
                      <Link to={`/animales/${a.id}`} className="text-bosque hover:underline">
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
                            ? 'bg-menta text-bosque-oscuro'
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

        {!cargando && !error && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-gray-600 text-sm">
              {filtrados.length} animales · Página {paginaActual} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual <= 1}
                className="px-3 py-1 rounded-lg bg-bosque text-white disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas}
                className="px-3 py-1 rounded-lg bg-bosque text-white disabled:opacity-40"
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