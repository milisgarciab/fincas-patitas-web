import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { obtenerLista } from '../produccionApi'
import { aInputFechaHora, fechaLocal, hoyLocal } from '../fechas'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface RegistroLeche {
  id: number
  litros: string
  jornada: string
  observaciones: string | null
  registrado_en: string
  eliminado_en: string | null
  animales: { id: number; codigo: string; nombre: string } | null
  lotes_animales: { id: number; nombre: string } | null
  creado_por: { nombre_usuario: string } | null
}

const RUTAS_LECHE = ['/produccion-leche']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function ProduccionLeche() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [registros, setRegistros] = useState<RegistroLeche[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [editando, setEditando] = useState<RegistroLeche | null>(null)
  const [litros, setLitros] = useState('')
  const [jornada, setJornada] = useState('Mañana')
  const [observaciones, setObservaciones] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

  const cargar = () =>
    obtenerLista<RegistroLeche>(RUTAS_LECHE)
      .then((l) => setRegistros(l.filter((x) => !x.eliminado_en)))
      .catch(() => setError('No se pudo cargar la producción de leche'))

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const hoy = hoyLocal()
  const total = registros.reduce((s, r) => s + Number(r.litros), 0)
  const litrosHoy = registros
    .filter((r) => fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + Number(r.litros), 0)

  const ordenados = [...registros].sort((a, b) => b.registrado_en.localeCompare(a.registrado_en))

  const fechaHoraTexto = (f: string) =>
    new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

  const origen = (r: RegistroLeche) =>
    r.animales
      ? `${r.animales.nombre} (${r.animales.codigo})`
      : r.lotes_animales
        ? r.lotes_animales.nombre
        : '—'

  const abrirEdicion = (r: RegistroLeche) => {
    setLitros(String(Number(r.litros)))
    setJornada(r.jornada)
    setObservaciones(r.observaciones ?? '')
    setFechaHora(aInputFechaHora(r.registrado_en))
    setErrorEdicion('')
    setEditando(r)
  }

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setErrorEdicion('')
    setGuardando(true)
    try {
      await api.put(`/produccion-leche/${editando.id}`, {
        litros: Number(litros),
        jornada,
        observaciones,
        registrado_en: new Date(fechaHora).toISOString(),
      })
      setEditando(null)
      await cargar()
    } catch (err: any) {
      setErrorEdicion(err.response?.data?.error?.message ?? 'No se pudo guardar el cambio')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (r: RegistroLeche) => {
    if (!window.confirm(`¿Eliminar el registro de ${Number(r.litros)} L (${origen(r)})?`)) return
    setError('')
    try {
      await api.delete(`/produccion-leche/${r.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el registro')
    }
  }

  const botonIcono = 'p-1.5 rounded-lg hover:bg-black/5'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <Link
        to="/produccion"
        className="inline-flex items-center gap-1 text-sm font-semibold text-bosque hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Producción
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-menta flex items-center justify-center text-3xl">
            🥛
          </span>
          <h1 className="text-2xl font-bold text-marron">Leche</h1>
        </div>
        <Link
          to="/produccion/leche/nuevo"
          className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          Registrar leche
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-display font-bold text-2xl text-marron">{total} L</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Hoy</p>
            <p className="font-display font-bold text-2xl text-marron">{litrosHoy} L</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Registros</p>
            <p className="font-display font-bold text-2xl text-marron">{registros.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Animal / Lote</th>
              <th className="px-4 py-2">Litros</th>
              <th className="px-4 py-2">Jornada</th>
              <th className="px-4 py-2">Observaciones</th>
              <th className="px-4 py-2">Registró</th>
              {puedeEditar && <th className="px-4 py-2 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : ordenados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No hay registros de leche
                </td>
              </tr>
            ) : (
              ordenados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm">{fechaHoraTexto(r.registrado_en)}</td>
                  <td className="px-4 py-2">
                    {r.animales ? (
                      <Link to={`/animales/${r.animales.id}`} className="text-bosque hover:underline">
                        {origen(r)}
                      </Link>
                    ) : (
                      origen(r)
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{Number(r.litros)} L</td>
                  <td className="px-4 py-2">{r.jornada}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{r.observaciones ?? '—'}</td>
                  <td className="px-4 py-2 text-sm">{r.creado_por?.nombre_usuario ?? '—'}</td>
                  {puedeEditar && (
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirEdicion(r)}
                          title="Editar"
                          className={`${botonIcono} text-bosque`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {puedeEliminar && (
                          <button
                            onClick={() => eliminar(r)}
                            title="Eliminar"
                            className={`${botonIcono} text-red-600`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <Modal titulo="Editar registro de leche" onCerrar={() => setEditando(null)}>
          <form onSubmit={guardarEdicion} className="space-y-4">
            <p className="text-sm text-gray-500">Registro de {origen(editando)}</p>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Litros</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Jornada</label>
              <select value={jornada} onChange={(e) => setJornada(e.target.value)} className={campo}>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
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