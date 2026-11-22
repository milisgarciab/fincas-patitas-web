import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { puede } from '../permisos'
import Modal from '../components/Modal'
import SelectorAnimal from '../components/SelectorAnimal'

interface Seguimiento {
  id: number
  animal_id: number
  macho_id: number | null
  tipo: string
  fecha_inseminacion: string
  fecha_estimada_parto: string | null
  fecha_real_parto: string | null
  estado: string
  notas: string | null
  eliminado_en: string | null
  editado_por: { nombre_usuario: string } | null
  animales: { id: number; codigo: string; nombre: string } | null
  macho: { id: number; codigo: string; nombre: string } | null
}

const ESTADOS = ['Pendiente', 'Gestante', 'Parida', 'Abortada', 'Fallida']

const colorEstado = (estado: string) =>
  estado === 'Pendiente'
    ? 'bg-yellow-100 text-yellow-800'
    : estado === 'Gestante'
      ? 'bg-blue-100 text-blue-800'
      : estado === 'Parida'
        ? 'bg-menta text-bosque-oscuro'
        : estado === 'Abortada'
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-200 text-gray-700'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Reproduccion() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [lista, setLista] = useState<Seguimiento[]>([])
  const [filtro, setFiltro] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState<number | null>(null)

  // Cierre
  const [cerrando, setCerrando] = useState<Seguimiento | null>(null)
  const [resultado, setResultado] = useState('Parida')
  const [fechaParto, setFechaParto] = useState(new Date().toISOString().slice(0, 10))
  const [notasCierre, setNotasCierre] = useState('')

  // Edición
  const [editando, setEditando] = useState<Seguimiento | null>(null)
  const [machoId, setMachoId] = useState('')
  const [tipo, setTipo] = useState('IA')
  const [fechaInsem, setFechaInsem] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

  const cargar = () => {
    setError('')
    return api
      .get('/reproduccion')
      .then((r) => {
        const datos: Seguimiento[] = Array.isArray(r.data) ? r.data : r.data.data
        setLista(datos.filter((x) => !x.eliminado_en))
      })
      .catch(() => setError('No se pudo cargar la reproducción'))
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const confirmar = async (id: number) => {
    setError('')
    setTrabajando(id)
    try {
      await api.patch(`/reproduccion/${id}/confirmar`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo confirmar')
    } finally {
      setTrabajando(null)
    }
  }

  const abrirCierre = (s: Seguimiento) => {
    setCerrando(s)
    setNotasCierre('')
    // Desde Pendiente solo se puede cerrar como Fallida
    setResultado(s.estado === 'Pendiente' ? 'Fallida' : 'Parida')
  }

  const cerrar = async () => {
    if (!cerrando) return
    setError('')
    setTrabajando(cerrando.id)
    try {
      await api.patch(`/reproduccion/${cerrando.id}/cerrar`, {
        resultado,
        fecha_real_parto: resultado === 'Fallida' ? undefined : fechaParto,
        notas: notasCierre || undefined,
      })
      setCerrando(null)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo cerrar el seguimiento')
    } finally {
      setTrabajando(null)
    }
  }

  const abrirEdicion = (s: Seguimiento) => {
    setMachoId(s.macho_id ? String(s.macho_id) : '')
    setTipo(s.tipo)
    setFechaInsem(s.fecha_inseminacion.slice(0, 10))
    setFechaEstimada(s.fecha_estimada_parto ? s.fecha_estimada_parto.slice(0, 10) : '')
    setNotas(s.notas ?? '')
    setErrorEdicion('')
    setEditando(s)
  }

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setErrorEdicion('')
    setGuardando(true)
    try {
      await api.put(`/reproduccion/${editando.id}`, {
        macho_id: machoId ? Number(machoId) : undefined,
        tipo,
        fecha_inseminacion: fechaInsem,
        fecha_estimada_parto: fechaEstimada || undefined,
        notas,
      })
      setEditando(null)
      await cargar()
    } catch (err: any) {
      setErrorEdicion(err.response?.data?.error?.message ?? 'No se pudo guardar el cambio')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (s: Seguimiento) => {
    if (!window.confirm(`¿Eliminar el seguimiento de ${s.animales?.nombre ?? 'esta hembra'}? Quedará marcado como eliminado.`)) return
    setError('')
    try {
      await api.delete(`/reproduccion/${s.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el seguimiento')
    }
  }

  // Fecha en UTC para que no se corra un día
  const fecha = (f: string | null) =>
    f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'

  const visibles = lista
    .filter((s) => !filtro || s.estado === filtro)
    .sort((a, b) => b.id - a.id)

  const gestantes = lista.filter((s) => s.estado === 'Gestante').length
  const pendientes = lista.filter((s) => s.estado === 'Pendiente').length

  const animal = (a: { id: number; codigo: string; nombre: string } | null, id: number | null) =>
    a ? (
      <Link to={`/animales/${a.id}`} className="text-bosque hover:underline">
        {a.nombre} ({a.codigo})
      </Link>
    ) : id ? (
      `Animal #${id}`
    ) : (
      '—'
    )

  const botonIcono = 'p-1.5 rounded-lg hover:bg-black/5'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">Reproducción</h1>
          <Link
            to="/reproduccion/nuevo"
            className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            Nueva gestación
          </Link>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {!cargando && (
          <div className="flex gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-700">{pendientes}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Gestantes</p>
              <p className="text-2xl font-bold text-blue-700">{gestantes}</p>
            </div>
          </div>
        )}

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-4 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bosque text-white">
              <tr>
                <th className="px-4 py-2">Hembra</th>
                <th className="px-4 py-2">Macho</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Inseminación</th>
                <th className="px-4 py-2">Parto estimado</th>
                <th className="px-4 py-2">Parto real</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No hay seguimientos para mostrar
                  </td>
                </tr>
              ) : (
                visibles.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{animal(s.animales, s.animal_id)}</td>
                    <td className="px-4 py-2">{animal(s.macho, s.macho_id)}</td>
                    <td className="px-4 py-2">{s.tipo}</td>
                    <td className="px-4 py-2 text-sm">{fecha(s.fecha_inseminacion)}</td>
                    <td className="px-4 py-2 text-sm">{fecha(s.fecha_estimada_parto)}</td>
                    <td className="px-4 py-2 text-sm">{fecha(s.fecha_real_parto)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm ${colorEstado(s.estado)}`}
                      >
                        {s.estado}
                      </span>
                      {s.editado_por && (
                        <p className="text-xs text-gray-500 mt-1">
                          Editado por {s.editado_por.nombre_usuario}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {s.estado === 'Pendiente' && (
                          <button
                            onClick={() => confirmar(s.id)}
                            disabled={trabajando === s.id}
                            className="px-2 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                        )}
                        {(s.estado === 'Pendiente' || s.estado === 'Gestante') && (
                          <button
                            onClick={() => abrirCierre(s)}
                            disabled={trabajando === s.id}
                            className="px-2 py-1 text-sm rounded bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
                          >
                            Cerrar
                          </button>
                        )}
                        {puedeEditar && (
                          <button
                            onClick={() => abrirEdicion(s)}
                            title="Editar"
                            className={`${botonIcono} text-bosque`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {puedeEliminar && (
                          <button
                            onClick={() => eliminar(s)}
                            title="Eliminar"
                            className={`${botonIcono} text-red-600`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cerrando && (
        <Modal titulo="Cerrar seguimiento" onCerrar={() => setCerrando(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {cerrando.animales?.nombre ?? `Animal #${cerrando.animal_id}`} · estado actual:{' '}
              {cerrando.estado}
            </p>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Resultado</label>
              <select
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                className={campo}
              >
                {(cerrando.estado === 'Pendiente'
                  ? ['Fallida']
                  : ['Parida', 'Abortada', 'Fallida']
                ).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {resultado !== 'Fallida' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha del suceso</label>
                <input
                  type="date"
                  value={fechaParto}
                  onChange={(e) => setFechaParto(e.target.value)}
                  className={campo}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">Notas (opcional)</label>
              <textarea
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                rows={2}
                className={campo}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCerrando(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                onClick={cerrar}
                disabled={trabajando === cerrando.id}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white rounded-lg py-2 disabled:opacity-50"
              >
                Cerrar seguimiento
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar gestación" onCerrar={() => setEditando(null)}>
          <form onSubmit={guardarEdicion} className="space-y-4">
            <p className="text-sm text-gray-500">
              Hembra: {editando.animales?.nombre ?? `#${editando.animal_id}`}
            </p>

            <SelectorAnimal
              etiqueta="Macho"
              valor={machoId}
              onCambio={setMachoId}
              genero="Macho"
              textoVacio="Sin macho registrado"
            />

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
                <option value="IA">IA</option>
                <option value="Monta natural">Monta natural</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha de inseminación o monta
              </label>
              <input
                type="date"
                value={fechaInsem}
                onChange={(e) => setFechaInsem(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha estimada de parto</label>
              <input
                type="date"
                value={fechaEstimada}
                onChange={(e) => setFechaEstimada(e.target.value)}
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className={campo}
              />
            </div>

            {errorEdicion && <p className="text-red-600 text-sm">{errorEdicion}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}