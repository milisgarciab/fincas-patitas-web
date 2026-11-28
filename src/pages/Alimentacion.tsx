import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { hoyLocal } from '../fechas'
import { aLista, cargarAnimales, etiquetaAnimal } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'
import SelectorAnimal from '../components/SelectorAnimal'

const ALIMENTOS = ['Concentrado', 'Heno', 'Pasto', 'Sal mineralizada', 'Maíz', 'Silo']
const UNIDADES = ['Kg', 'Bulto', 'Ltr', 'Unidad', 'Arroba']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'

export default function Alimentacion() {
  const [params] = useSearchParams()
  const animalFiltro = params.get('animal') ?? ''
  const puedeEliminar = puede('registros.eliminar')

  const [registros, setRegistros] = useState<any[]>([])
  const [animales, setAnimales] = useState<AnimalResumen[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [abierto, setAbierto] = useState(params.get('nuevo') === '1')
  const [animalId, setAnimalId] = useState(animalFiltro)
  const [alimento, setAlimento] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('Kg')
  const [fecha, setFecha] = useState(hoyLocal())
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const cargar = useCallback(async () => {
    const [r, a] = await Promise.allSettled([api.get('/alimentacion'), cargarAnimales()])
    if (r.status === 'fulfilled') {
      setRegistros(aLista(r.value.data))
      setError('')
    } else {
      setError('No se pudo cargar la alimentación')
    }
    setAnimales(a.status === 'fulfilled' ? a.value : [])
  }, [])

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const animalDe = (id: number) => animales.find((a) => a.id === id)

  const visibles = registros
    .filter((r) => !animalFiltro || r.animal_id === Number(animalFiltro))
    .filter((r) => {
      const q = texto.trim().toLowerCase()
      if (!q) return true
      const a = animalDe(r.animal_id)
      return (
        r.tipo_alimento?.toLowerCase().includes(q) ||
        a?.nombre?.toLowerCase().includes(q) ||
        a?.codigo?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || b.id - a.id)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    try {
      await api.post('/alimentacion', {
        animal_id: Number(animalId),
        tipo_alimento: alimento.trim(),
        cantidad: Number(cantidad),
        unidad,
        fecha,
      })
      setAbierto(false)
      setAlimento('')
      setCantidad('')
      await cargar()
    } catch (err: any) {
      setErrorForm(err.response?.data?.error?.message ?? 'No se pudo guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (r: any) => {
    if (!window.confirm('¿Eliminar este registro de alimentación?')) return
    setError('')
    try {
      await api.delete(`/alimentacion/${r.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el registro')
    }
  }

  const mes = hoyLocal().slice(0, 7)
  const delMes = registros.filter((r) => String(r.fecha).startsWith(mes)).length

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Alimentación</h1>
          <p className="text-sm text-gray-500">Qué y cuánto come cada animal</p>
        </div>
        <button
          onClick={() => {
            setErrorForm('')
            setAbierto(true)
          }}
          className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Registrar alimentación
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {animalFiltro && (
        <p className="text-sm text-gray-600">
          Mostrando solo a {etiquetaAnimal(animalDe(Number(animalFiltro)), Number(animalFiltro))}.{' '}
          <Link to="/alimentacion" className="text-bosque hover:underline">
            Ver todos
          </Link>
        </p>
      )}

      {!cargando && !error && (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Registros</p>
            <p className="text-2xl font-bold text-marron">{registros.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Este mes</p>
            <p className="text-2xl font-bold text-marron">{delMes}</p>
          </div>
        </div>
      )}

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por alimento o animal..."
        className={campo}
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Animal</th>
              <th className="px-4 py-2">Alimento</th>
              <th className="px-4 py-2">Cantidad</th>
              {puedeEliminar && <th className="px-4 py-2 text-right">Acciones</th>}
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
                  No hay registros de alimentación
                </td>
              </tr>
            ) : (
              visibles.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm">{fechaDia(r.fecha)}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link to={`/animales/${r.animal_id}`} className="text-bosque hover:underline">
                      {etiquetaAnimal(animalDe(r.animal_id), r.animal_id)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm">{r.tipo_alimento}</td>
                  <td className="px-4 py-2 text-sm">
                    {Number(r.cantidad)} {r.unidad}
                  </td>
                  {puedeEliminar && (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => eliminar(r)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {abierto && (
        <Modal titulo="Registrar alimentación" onCerrar={() => setAbierto(false)}>
          <form onSubmit={guardar} className="space-y-4">
            <SelectorAnimal etiqueta="Animal" valor={animalId} onCambio={setAnimalId} requerido />

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo de alimento</label>
              <input
                list="alimentos"
                value={alimento}
                onChange={(e) => setAlimento(e.target.value)}
                required
                maxLength={50}
                className={campo}
              />
              <datalist id="alimentos">
                {ALIMENTOS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Unidad</label>
                <input
                  list="unidades-alimento"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  required
                  maxLength={20}
                  className={campo}
                />
                <datalist id="unidades-alimento">
                  {UNIDADES.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className={campo}
              />
            </div>

            {errorForm && <p className="text-red-600 text-sm">{errorForm}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !animalId}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}