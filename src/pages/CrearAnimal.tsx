import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

interface Especie {
  id: number
  nombre: string
}

interface Raza {
  id: number
  especie_id: number
  nombre: string
}

// Ruta del backend que lista las razas (verifícala en Swagger)
const RUTA_RAZAS = '/razas'

export default function CrearAnimal() {
  const navigate = useNavigate()
  const [especies, setEspecies] = useState<Especie[]>([])
  const [razas, setRazas] = useState<Raza[]>([])

  const [nombre, setNombre] = useState('')
  const [genero, setGenero] = useState('Macho')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [especieId, setEspecieId] = useState('')
  const [razaId, setRazaId] = useState('')
  const [madreId, setMadreId] = useState('')
  const [padreId, setPadreId] = useState('')

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/especies').then((r) => setEspecies(r.data))
    api
      .get(RUTA_RAZAS)
      .then((r) => setRazas(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => setError('No se pudieron cargar las razas'))
  }, [])

  const razasDeEspecie = razas.filter((r) => r.especie_id === Number(especieId))

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const { data } = await api.post('/animales', {
        nombre,
        genero,
        estado: 'Activo',
        fecha_nacimiento: fechaNacimiento || undefined,
        especie_id: Number(especieId),
        raza_id: Number(razaId),
        madre_id: madreId ? Number(madreId) : undefined,
        padre_id: padreId ? Number(padreId) : undefined,
      })
      navigate(`/animales/${data.id}`)
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ?? 'No se pudo crear el animal',
      )
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600'

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/animales" className="text-green-700 hover:underline">
          ← Volver a animales
        </Link>

        <form
          onSubmit={guardar}
          className="mt-4 bg-white rounded-xl shadow p-6 space-y-4"
        >
          <h1 className="text-2xl font-bold text-green-800">Nuevo animal</h1>

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
            <label className="block text-sm text-gray-600 mb-1">Género</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className={campo}
            >
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={campo}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Especie</label>
            <select
              value={especieId}
              onChange={(e) => {
                setEspecieId(e.target.value)
                setRazaId('')
              }}
              required
              className={campo}
            >
              <option value="">Selecciona una especie</option>
              {especies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Raza</label>
            <select
              value={razaId}
              onChange={(e) => setRazaId(e.target.value)}
              required
              disabled={!especieId}
              className={campo}
            >
              <option value="">
                {especieId ? 'Selecciona una raza' : 'Primero elige la especie'}
              </option>
              {razasDeEspecie.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                ID de la madre (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={madreId}
                onChange={(e) => setMadreId(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                ID del padre (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={padreId}
                onChange={(e) => setPadreId(e.target.value)}
                className={campo}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear animal'}
          </button>
        </form>
      </div>
    </div>
  )
}