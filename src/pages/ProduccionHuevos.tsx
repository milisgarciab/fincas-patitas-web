import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { obtenerLista } from '../produccionApi'
import { aInputFechaHora, fechaLocal, hoyLocal } from '../fechas'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface RegistroHuevos {
  id: number
  cantidad: number
  cantidad_rotos: number
  jornada: string
  observaciones: string | null
  registrado_en: string
  eliminado_en: string | null
  animales: { id: number; codigo: string; nombre: string } | null
  lotes_animales: { id: number; nombre: string } | null
  creado_por: { nombre_usuario: string } | null
}

const RUTAS_HUEVOS = ['/produccion-huevos', '/produccion/huevos']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function ProduccionHuevos() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [registros, setRegistros] = useState<RegistroHuevos[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [editando, setEditando] = useState<RegistroHuevos | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [rotos, setRotos] = useState('0')
  const [observaciones, setObservaciones] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

  const cargar = () =>
    obtenerLista<RegistroHuevos>(RUTAS_HUEVOS)
      .then((l) => setRegistros(l.filter((x) => !x.eliminado_en)))
      .catch(() => setError('No se pudo cargar la producción de huevos'))

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const hoy = hoyLocal()
  const total = registros.reduce((s, r) => s + r.cantidad, 0)
  const rotosTotal = registros.reduce((s, r) => s + r.cantidad_rotos, 0)
  const huevosHoy = registros
    .filter((r) => fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + r.cantidad, 0)

  const ordenados = [...registros].sort((a, b) => b.registrado_en.localeCompare(a.registrado_en))

  const fechaHoraTexto = (f: string) =>
    new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })

  const origen = (r: RegistroHuevos) =>
    r.animales
      ? `${r.animales.nombre} (${r.animales.codigo})`
      : r.lotes_animales
        ? r.lotes_animales.nombre
        : '—'

  const abrirEdicion = (r: RegistroHuevos) => {
    setCantidad(String(r.cantidad))
    setRotos(String(r.cantidad_rotos))
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
      await api.put(`/produccion-huevos/${editando.id}`, {
        cantidad: Number(cantidad),
        cantidad_rotos: Number(rotos),
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

  const eliminar = async (r: RegistroHuevos) => {
    if (!window.confirm(`¿Eliminar el registro de ${r.cantidad} huevos (${origen(r)})?`)) return
    setError('')
    try {
      await api.delete(`/produccion-huevos/${r.id}`)
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
          <span className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl">
            🥚
          </span>
          <h1 className="text-2xl font-bold text-marron">Huevos</h1>
        </div>
        <Link
          to="/produccion/huevos/nuevo"
          className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          Registrar huevos
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total recolectado</p>
            <p className="font-display font-bold text-2xl text-marron">{total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Hoy</p>
            <p className="font-display font-bold text-2xl text-marron">{huevosHoy}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Rotos</p>
            <p className="font-display font-bold text-2xl text-red-600">{rotosTotal}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Animal / Lote</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Rotos</th>
              <th className="px-4 py-2">Jornada</th>
              <th className="px-4 py-2">Observaciones</th>
              <th className="px-4 py-2">Registró</th>
              {puedeEditar && <th className="px-4 py-2 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : ordenados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No hay registros de huevos
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
                  <td className="px-4 py-2 font-medium">{r.cantidad}</td>
                  <td className="px-4 py-2">{r.cantidad_rotos}</td>
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
        <Modal titulo="Editar registro de huevos" onCerrar={() => setEditando(null)}>
          <form onSubmit={guardarEdicion} className="space-y-4">
            <p className="text-sm text-gray-500">Registro de {origen(editando)}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rotos</label>
                <input
                  type="number"
                  min="0"
                  value={rotos}
                  onChange={(e) => setRotos(e.target.value)}
                  className={campo}
                />
              </div>
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