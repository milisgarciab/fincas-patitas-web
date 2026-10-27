import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

interface Insumo {
  id: number
  nombre: string
  descripcion: string | null
  unidad_medida: string
  stock_actual: string
  stock_minimo: string
  stock_bajo: boolean
  categorias_bodega: { id: number; nombre: string }
}

interface Categoria {
  id: number
  nombre: string
}

export default function Bodega() {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [soloBajo, setSoloBajo] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/bodega'), api.get('/categorias-bodega')])
      .then(([ins, cat]) => {
        setInsumos(ins.data)
        setCategorias(cat.data)
      })
      .catch(() => setError('No se pudo cargar el inventario'))
      .finally(() => setCargando(false))
  }, [])

  const filtrados = insumos
    .filter((i) => i.nombre.toLowerCase().includes(texto.toLowerCase()))
    .filter((i) => !categoriaId || i.categorias_bodega.id === Number(categoriaId))
    .filter((i) => !soloBajo || i.stock_bajo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const totalBajo = insumos.filter((i) => i.stock_bajo).length

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Inventario</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/bodega/nuevo"
              className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
            >
              Nuevo insumo
            </Link>
            <Link to="/inicio" className="text-green-700 hover:underline">
              ← Inicio
            </Link>
          </div>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {!cargando && !error && (
          <div className="flex gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Insumos</p>
              <p className="text-2xl font-bold text-green-800">{insumos.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Con stock bajo</p>
              <p className="text-2xl font-bold text-red-600">{totalBajo}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={soloBajo}
              onChange={(e) => setSoloBajo(e.target.checked)}
            />
            Solo stock bajo
          </label>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="px-4 py-2">Insumo</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Unidad</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Mínimo</th>
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
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No hay insumos para mostrar
                  </td>
                </tr>
              ) : (
                filtrados.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <p className="font-medium">{i.nombre}</p>
                      {i.descripcion && (
                        <p className="text-xs text-gray-500">{i.descripcion}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">{i.categorias_bodega?.nombre}</td>
                    <td className="px-4 py-2">{i.unidad_medida}</td>
                    <td className="px-4 py-2 font-medium">{Number(i.stock_actual)}</td>
                    <td className="px-4 py-2">{Number(i.stock_minimo)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm ${
                          i.stock_bajo
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {i.stock_bajo ? 'Stock bajo' : 'OK'}
                      </span>
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