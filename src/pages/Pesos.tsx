import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { aLista, cargarAnimales, etiquetaAnimal } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'
import SelectorAnimal from '../components/SelectorAnimal'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

// Para el input datetime-local (hora local, sin zona)
const aLocal = (d: Date) => {
  const c = new Date(d)
  c.setMinutes(c.getMinutes() - c.getTimezoneOffset())
  return c.toISOString().slice(0, 16)
}

const fechaHora = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function Pesos() {
  const [params] = useSearchParams()
  const animalFiltro = params.get('animal') ?? ''
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [registros, setRegistros] = useState<any[]>([])
  const [animales, setAnimales] = useState<AnimalResumen[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [abierto, setAbierto] = useState(params.get('nuevo') === '1')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [animalId, setAnimalId] = useState(animalFiltro)
  const [peso, setPeso] = useState('')
  const [fecha, setFecha] = useState(aLocal(new Date()))
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const cargar = useCallback(async () => {
    const [r, a] = await Promise.allSettled([api.get('/registros-peso'), cargarAnimales()])
    if (r.status === 'fulfilled') {
      setRegistros(aLista(r.value.data))
      setError('')
    } else {
      setError('No se pudieron cargar los registros de peso')
    }
    setAnimales(a.status === 'fulfilled' ? a.value : [])
  }, [])

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const animalDe = (id: number) => animales.find((a) => a.id === id)

  // Cambio frente al registro anterior del mismo animal
  const cambios = new Map<number, number | null>()
  const porAnimal = new Map<number, any[]>()
  registros.forEach((r) => porAnimal.set(r.animal_id, [...(porAnimal.get(r.animal_id) ?? []), r]))
  porAnimal.forEach((lista) => {
    const orden = [...lista].sort((a, b) =>
      String(a.registrado_en).localeCompare(String(b.registrado_en)),
    )
    orden.forEach((r, i) =>
      cambios.set(r.id, i === 0 ? null : Number(r.peso_kg) - Number(orden[i - 1].peso_kg)),
    )
  })

  const visibles = registros
    .filter((r) => !animalFiltro || r.animal_id === Number(animalFiltro))
    .filter((r) => {
      const q = texto.trim().toLowerCase()
      if (!q) return true
      const a = animalDe(r.animal_id)
      return a?.nombre?.toLowerCase().includes(q) || a?.codigo?.toLowerCase().includes(q)
    })
    .sort((a, b) => String(b.registrado_en).localeCompare(String(a.registrado_en)))

  const abrirForm = (r?: any) => {
    setErrorForm('')
    setEditandoId(r?.id ?? null)
    setAnimalId(r ? String(r.animal_id) : animalFiltro)
    setPeso(r ? String(Number(r.peso_kg)) : '')
    setFecha(r?.registrado_en ? aLocal(new Date(r.registrado_en)) : aLocal(new Date()))
    setAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    const registradoEn = fecha ? new Date(fecha).toISOString() : undefined
    try {
      if (editandoId) {
        await api.put(`/registros-peso/${editandoId}`, {
          peso_kg: Number(peso),
          registrado_en: registradoEn,
        })
      } else {
        await api.post('/registros-peso', {
          animal_id: Number(animalId),
          peso_kg: Number(peso),
          registrado_en: registradoEn,
        })
      }
      setAbierto(false)
      await cargar()
    } catch (err: any) {
      setErrorForm(err.response?.data?.error?.message ?? 'No se pudo guardar el peso')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (r: any) => {
    if (!window.confirm('¿Eliminar este registro de peso?')) return
    setError('')
    try {
      await api.delete(`/registros-peso/${r.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el registro')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Registros de peso</h1>
          <p className="text-sm text-gray-500">Evolución del peso de cada animal</p>
        </div>
        <button
          onClick={() => abrirForm()}
          className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Registrar peso
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {animalFiltro && (
        <p className="text-sm text-gray-600">
          Mostrando solo a {etiquetaAnimal(animalDe(Number(animalFiltro)), Number(animalFiltro))}.{' '}
          <Link to="/pesos" className="text-bosque hover:underline">
            Ver todos
          </Link>
        </p>
      )}

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por animal..."
        className={campo}
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Animal</th>
              <th className="px-4 py-2">Peso</th>
              <th className="px-4 py-2">Cambio</th>
              {(puedeEditar || puedeEliminar) && <th className="px-4 py-2 text-right">Acciones</th>}
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
                  No hay registros de peso
                </td>
              </tr>
            ) : (
              visibles.map((r) => {
                const c = cambios.get(r.id)
                return (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm">{fechaHora(r.registrado_en)}</td>
                    <td className="px-4 py-2 text-sm">
                      <Link to={`/animales/${r.animal_id}`} className="text-bosque hover:underline">
                        {etiquetaAnimal(animalDe(r.animal_id) ?? r.animales, r.animal_id)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">{Number(r.peso_kg)} kg</td>
                    <td
                      className={`px-4 py-2 text-sm ${
                        c == null ? 'text-gray-400' : c < 0 ? 'text-red-600' : 'text-bosque'
                      }`}
                    >
                      {c == null ? '—' : `${c > 0 ? '+' : ''}${c.toFixed(2)} kg`}
                    </td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          {puedeEditar && (
                            <button
                              onClick={() => abrirForm(r)}
                              title="Editar"
                              className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              onClick={() => eliminar(r)}
                              title="Eliminar"
                              className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {abierto && (
        <Modal
          titulo={editandoId ? 'Editar peso' : 'Registrar peso'}
          onCerrar={() => setAbierto(false)}
        >
          <form onSubmit={guardar} className="space-y-4">
            {editandoId ? (
              <p className="text-sm text-gray-600">
                Animal: {etiquetaAnimal(animalDe(Number(animalId)), Number(animalId))}
              </p>
            ) : (
              <SelectorAnimal etiqueta="Animal" valor={animalId} onCambio={setAnimalId} requerido />
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">Peso (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
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