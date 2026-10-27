import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

interface Categoria {
  id: number
  nombre: string
}

// Unidades que ya usa tu inventario
const UNIDADES = ['Unidad', 'Bulto', 'Kg', 'Ltr', 'ml', 'Dosis', 'Arroba']

export default function CrearInsumo() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('Unidad')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api
      .get('/categorias-bodega')
      .then((r) => setCategorias(r.data))
      .catch(() => setError('No se pudieron cargar las categorías'))
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/bodega', {
        categoria_id: Number(categoriaId),
        nombre,
        unidad_medida: unidad,
      })
      navigate('/bodega')
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo crear el insumo')
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/bodega" className="text-green-700 hover:underline">
          ← Volver al inventario
        </Link>

        <form
          onSubmit={guardar}
          className="mt-4 bg-white rounded-xl shadow p-6 space-y-4"
        >
          <h1 className="text-2xl font-bold text-green-800">Nuevo insumo</h1>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className={campo}
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Unidad de medida
            </label>
            <select
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className={campo}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear insumo'}
          </button>
        </form>
      </div>
    </div>
  )
}