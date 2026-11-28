import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { aLista } from '../animalesLista'
import Modal from '../components/Modal'

interface Especie {
  id: number
  nombre: string
}

type Pestana = 'especies' | 'razas' | 'categorias'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

function Seccion({
  ruta,
  singular,
  conEspecie,
  especies,
  avisoEliminar,
  alCambiar,
}: {
  ruta: string
  singular: string
  conEspecie?: boolean
  especies: Especie[]
  avisoEliminar: string
  alCambiar?: () => void
}) {
  const [items, setItems] = useState<any[]>([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [abierto, setAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [especieId, setEspecieId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const cargar = useCallback(
    () =>
      api
        .get(ruta)
        .then((r) => {
          setItems(aLista(r.data))
          setError('')
        })
        .catch(() => setError(`No se pudo cargar la lista de ${singular}s`)),
    [ruta, singular],
  )

  useEffect(() => {
    setCargando(true)
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const abrirForm = (it?: any) => {
    setErrorForm('')
    setEditandoId(it?.id ?? null)
    setNombre(it?.nombre ?? '')
    setEspecieId(it?.especie_id ? String(it.especie_id) : '')
    setAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    const body: Record<string, unknown> = { nombre: nombre.trim() }
    if (conEspecie) body.especie_id = Number(especieId)
    try {
      if (editandoId) await api.put(`${ruta}/${editandoId}`, body)
      else await api.post(ruta, body)
      setAbierto(false)
      await cargar()
      alCambiar?.()
    } catch (err: any) {
      setErrorForm(
        err.response?.status === 409
          ? (err.response?.data?.error?.message ?? 'Ya existe un registro con ese nombre')
          : (err.response?.data?.error?.message ?? 'No se pudo guardar'),
      )
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (it: any) => {
    if (!window.confirm(`¿Eliminar "${it.nombre}"? ${avisoEliminar}`)) return
    setError('')
    try {
      await api.delete(`${ruta}/${it.id}`)
      await cargar()
      alCambiar?.()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? `No se pudo eliminar ${singular}`)
    }
  }

  const visibles = items
    .filter((it) => it.nombre?.toLowerCase().includes(texto.trim().toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
        />
        <button
          onClick={() => abrirForm()}
          className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Nueva {singular}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              {conEspecie && <th className="px-4 py-2">Especie</th>}
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  No hay registros
                </td>
              </tr>
            ) : (
              visibles.map((it) => (
                <tr key={it.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium">{it.nombre}</td>
                  {conEspecie && (
                    <td className="px-4 py-2 text-sm">
                      {it.especies?.nombre ??
                        especies.find((s) => s.id === it.especie_id)?.nombre ??
                        '—'}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => abrirForm(it)}
                        title="Editar"
                        className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminar(it)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {abierto && (
        <Modal
          titulo={editandoId ? `Editar ${singular}` : `Nueva ${singular}`}
          onCerrar={() => setAbierto(false)}
        >
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={50}
                className={campo}
              />
            </div>
            {conEspecie && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Especie</label>
                <select
                  value={especieId}
                  onChange={(e) => setEspecieId(e.target.value)}
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
            )}
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
                disabled={guardando}
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

export default function Catalogos() {
  const [pestana, setPestana] = useState<Pestana>('especies')
  const [especies, setEspecies] = useState<Especie[]>([])

  const cargarEspecies = useCallback(() => {
    api
      .get('/especies')
      .then((r) => setEspecies(aLista(r.data)))
      .catch(() => setEspecies([]))
  }, [])

  useEffect(() => {
    cargarEspecies()
  }, [cargarEspecies])

  const PESTANAS: { id: Pestana; texto: string }[] = [
    { id: 'especies', texto: 'Especies' },
    { id: 'razas', texto: 'Razas' },
    { id: 'categorias', texto: 'Categorías de bodega' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marron">Catálogos</h1>
        <p className="text-sm text-gray-500">Listas que usan los animales y el inventario</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              pestana === p.id ? 'bg-bosque text-white' : 'bg-white text-bosque-oscuro hover:bg-menta'
            }`}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === 'especies' && (
        <Seccion
          ruta="/especies"
          singular="especie"
          especies={especies}
          avisoEliminar="No se puede eliminar si tiene razas asociadas."
          alCambiar={cargarEspecies}
        />
      )}
      {pestana === 'razas' && (
        <Seccion
          ruta="/razas"
          singular="raza"
          conEspecie
          especies={especies}
          avisoEliminar="No se puede eliminar si hay animales de esa raza."
        />
      )}
      {pestana === 'categorias' && (
        <Seccion
          ruta="/categorias-bodega"
          singular="categoría"
          especies={especies}
          avisoEliminar="ATENCIÓN: también se borran todos sus insumos y lotes de inventario. No se puede deshacer."
        />
      )}
    </div>
  )
}