import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { api } from '../api'
import SelectorAnimal from '../components/SelectorAnimal'

interface Especie {
  id: number
  nombre: string
}

interface Raza {
  id: number
  especie_id: number
  nombre: string
}

// Método de edición del backend (cámbialo a 'patch' si en Swagger es PATCH)
const METODO_EDITAR = 'put'
const RUTA_RAZAS = '/razas'

// Campos que no se pueden editar cuando el animal nació por reproducción.
// Es una suposición: confirmar con el equipo y ajustar esta lista.
const CAMPOS_BLOQUEADOS = ['especie', 'raza', 'fecha_nacimiento', 'madre', 'padre']

const ESTADOS = ['Activo', 'Vendido', 'Muerto']

export default function EditarAnimal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [especies, setEspecies] = useState<Especie[]>([])
  const [razas, setRazas] = useState<Raza[]>([])

  const [nombre, setNombre] = useState('')
  const [genero, setGenero] = useState('Macho')
  const [estado, setEstado] = useState('Activo')
  const [loteId, setLoteId] = useState<number | null>(null)
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [especieId, setEspecieId] = useState('')
  const [razaId, setRazaId] = useState('')
  const [madreId, setMadreId] = useState('')
  const [padreId, setPadreId] = useState('')
  const [nacidoPorReproduccion, setNacidoPorReproduccion] = useState(false)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const bloqueado = (campo: string) => nacidoPorReproduccion && CAMPOS_BLOQUEADOS.includes(campo)

  useEffect(() => {
    Promise.all([api.get('/especies'), api.get(RUTA_RAZAS), api.get(`/animales/${id}`)])
      .then(([esp, raz, ani]) => {
        setEspecies(esp.data)
        setRazas(Array.isArray(raz.data) ? raz.data : raz.data.data)
        const a = ani.data
        setNombre(a.nombre)
        setGenero(a.genero)
        setEstado(a.estado)
        setLoteId(a.lote_id)
        setFechaNacimiento(a.fecha_nacimiento ? a.fecha_nacimiento.slice(0, 10) : '')
        setEspecieId(String(a.especie_id))
        setRazaId(String(a.raza_id))
        setMadreId(a.madre_id ? String(a.madre_id) : '')
        setPadreId(a.padre_id ? String(a.padre_id) : '')
        // Nació por reproducción: tiene madre registrada y su origen empieza con "Nacido"
        setNacidoPorReproduccion(!!a.madre_id && /^nacid/i.test(a.origen ?? ''))
      })
      .catch(() => setError('No se pudo cargar el animal'))
      .finally(() => setCargando(false))
  }, [id])

  const razasDeEspecie = razas.filter((r) => r.especie_id === Number(especieId))

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.request({
        method: METODO_EDITAR,
        url: `/animales/${id}`,
        data: {
          nombre,
          genero,
          estado,
          fecha_nacimiento: fechaNacimiento || undefined,
          especie_id: Number(especieId),
          raza_id: Number(razaId),
          lote_id: loteId ?? undefined,
          madre_id: madreId ? Number(madreId) : undefined,
          padre_id: padreId ? Number(padreId) : undefined,
        },
      })
      navigate(`/animales/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-white/5'

  const Candado = () => <Lock className="inline w-3.5 h-3.5 ml-1 text-gray-400" />

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-xl mx-auto">
        <Link to={`/animales/${id}`} className="text-bosque hover:underline">
          ← Volver a la ficha
        </Link>

        {cargando ? (
          <p className="mt-6 text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={guardar} className="mt-4 bg-white rounded-xl shadow p-6 space-y-4">
            <h1 className="text-2xl font-bold text-bosque-oscuro">Editar animal</h1>

            {nacidoPorReproduccion && (
              <p className="text-sm bg-menta text-bosque-oscuro rounded-lg px-3 py-2">
                Este animal nació por reproducción: sus datos de nacimiento, especie, raza y
                padres vienen de ese registro y no se pueden cambiar aquí.
              </p>
            )}

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
              <select value={genero} onChange={(e) => setGenero(e.target.value)} className={campo}>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className={campo}>
                {[...new Set([...ESTADOS, estado])].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha de nacimiento
                {bloqueado('fecha_nacimiento') && <Candado />}
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                disabled={bloqueado('fecha_nacimiento')}
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Especie
                {bloqueado('especie') && <Candado />}
              </label>
              <select
                value={especieId}
                onChange={(e) => {
                  setEspecieId(e.target.value)
                  setRazaId('')
                }}
                required
                disabled={bloqueado('especie')}
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
              <label className="block text-sm text-gray-600 mb-1">
                Raza
                {bloqueado('raza') && <Candado />}
              </label>
              <select
                value={razaId}
                onChange={(e) => setRazaId(e.target.value)}
                required
                disabled={!especieId || bloqueado('raza')}
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

            {bloqueado('madre') ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Madre
                  <Candado />
                </label>
                <p className={`${campo} bg-gray-100 text-gray-500`}>
                  {madreId ? `Animal #${madreId}` : 'Sin madre registrada'}
                </p>
              </div>
            ) : (
              <SelectorAnimal
                etiqueta="Madre"
                valor={madreId}
                onCambio={setMadreId}
                genero="Hembra"
                excluirId={Number(id)}
                textoVacio="Sin madre registrada"
              />
            )}

            {bloqueado('padre') ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Padre
                  <Candado />
                </label>
                <p className={`${campo} bg-gray-100 text-gray-500`}>
                  {padreId ? `Animal #${padreId}` : 'Sin padre registrado'}
                </p>
              </div>
            ) : (
              <SelectorAnimal
                etiqueta="Padre"
                valor={padreId}
                onCambio={setPadreId}
                genero="Macho"
                excluirId={Number(id)}
                textoVacio="Sin padre registrado"
              />
            )}

            <p className="text-xs text-gray-500">
              La ubicación del animal no se edita aquí: se cambia con el botón Trasladar de su
              ficha.
            </p>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}