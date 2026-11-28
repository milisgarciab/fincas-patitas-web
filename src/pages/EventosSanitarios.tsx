import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { aLista } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'

const TIPOS = ['Vacunación', 'Desparasitación', 'Tratamiento Médico', 'Cirugía', 'Chequeo General']
const ESTADOS = ['Abierto', 'En tratamiento', 'Resuelto']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'
const fechaHora = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const CODIGOS: Record<string, string> = {
  EVENTO_RESUELTO: 'Este evento ya está resuelto y no se puede cambiar.',
  EVENTO_ELIMINADO: 'Este evento ya fue eliminado.',
  REFUERZO_PENDIENTE: 'No se puede resolver: tiene un refuerzo pendiente.',
  ALREADY_DELETED: 'Este evento ya estaba eliminado.',
}

const mensajeDe = (err: any, porDefecto: string) =>
  CODIGOS[err.response?.data?.error?.code] ?? err.response?.data?.error?.message ?? porDefecto

const CAMPOS_TEXTO = [
  'unidad_dosis',
  'via_administracion',
  'medicamento',
  'profesional_responsable',
  'descripcion_tratamiento',
  'fecha_evento',
  'fecha_proximo_refuerzo',
]

export default function EventosSanitarios() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [eventos, setEventos] = useState<any[]>([])
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState('')
  const [verEliminados, setVerEliminados] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [trabajando, setTrabajando] = useState<number | null>(null)

  // Edición
  const [editando, setEditando] = useState<any | null>(null)
  const [f, setF] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Historial
  const [historial, setHistorial] = useState<any | null>(null)

  const cargar = useCallback(
    () =>
      api
        .get('/eventos-sanitarios', {
          params: { incluir_eliminados: verEliminados ? 'true' : undefined },
        })
        .then((r) => {
          setEventos(aLista(r.data))
          setError('')
        })
        .catch(() => setError('No se pudieron cargar los eventos de salud')),
    [verEliminados],
  )

  useEffect(() => {
    setCargando(true)
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const visibles = eventos
    .filter((e) => !tipo || e.tipo_evento === tipo)
    .filter((e) => !estado || e.estado === estado)
    .filter((e) => {
      const q = texto.trim().toLowerCase()
      if (!q) return true
      return (
        e.animales?.nombre?.toLowerCase().includes(q) ||
        e.animales?.codigo?.toLowerCase().includes(q) ||
        e.medicamento?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => String(b.fecha_evento).localeCompare(String(a.fecha_evento)) || b.id - a.id)

  const abiertos = eventos.filter((e) => !e.eliminado_en && e.estado === 'Abierto').length
  const refuerzos = eventos.filter(
    (e) => !e.eliminado_en && e.estado !== 'Resuelto' && e.fecha_proximo_refuerzo,
  ).length

  // ---------- Cambiar estado ----------
  const cambiarEstado = async (e: any, nuevo: string) => {
    if (nuevo === e.estado) return
    setError('')
    setAviso('')
    setTrabajando(e.id)
    try {
      await api.patch(`/eventos-sanitarios/${e.id}/estado`, { estado: nuevo })
      await cargar()
      setAviso(`Estado actualizado a "${nuevo}".`)
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo cambiar el estado'))
    } finally {
      setTrabajando(null)
    }
  }

  // ---------- Editar ----------
  const abrirEdicion = (e: any) => {
    setErrorForm('')
    setF({
      tipo_evento: e.tipo_evento ?? 'Vacunación',
      dosis_aplicada: e.dosis_aplicada != null ? String(Number(e.dosis_aplicada)) : '',
      unidad_dosis: e.unidad_dosis ?? '',
      via_administracion: e.via_administracion ?? '',
      medicamento: e.medicamento ?? '',
      profesional_responsable: e.profesional_responsable ?? '',
      fecha_evento: e.fecha_evento ? String(e.fecha_evento).slice(0, 10) : '',
      fecha_proximo_refuerzo: e.fecha_proximo_refuerzo
        ? String(e.fecha_proximo_refuerzo).slice(0, 10)
        : '',
      descripcion_tratamiento: e.descripcion_tratamiento ?? '',
    })
    setEditando(e)
  }

  const guardarEdicion = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!editando) return
    setErrorForm('')
    setGuardando(true)
    const body: Record<string, unknown> = { tipo_evento: f.tipo_evento }
    if (f.dosis_aplicada) body.dosis_aplicada = Number(f.dosis_aplicada)
    CAMPOS_TEXTO.forEach((k) => {
      if (f[k]) body[k] = f[k]
    })
    try {
      await api.put(`/eventos-sanitarios/${editando.id}`, body)
      setEditando(null)
      await cargar()
      setAviso('Evento actualizado.')
    } catch (err: any) {
      setErrorForm(mensajeDe(err, 'No se pudo guardar el evento'))
    } finally {
      setGuardando(false)
    }
  }

  // ---------- Eliminar (borrado lógico) ----------
  const eliminar = async (e: any) => {
    if (
      !window.confirm(
        `¿Eliminar este evento de ${e.animales?.nombre ?? 'el animal'}? Queda marcado como eliminado en el historial.`,
      )
    )
      return
    setError('')
    setAviso('')
    try {
      await api.delete(`/eventos-sanitarios/${e.id}`)
      await cargar()
      setAviso('Evento eliminado.')
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo eliminar el evento'))
    }
  }

  const set = (k: string) => (ev: React.ChangeEvent<any>) => setF({ ...f, [k]: ev.target.value })

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Salud animal</h1>
          <p className="text-sm text-gray-500">Vacunas, tratamientos y seguimiento de casos</p>
        </div>
        <Link
          to="/salud/nuevo"
          className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {aviso && <p className="text-bosque text-sm">{aviso}</p>}

      {!cargando && !error && (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Casos abiertos</p>
            <p className="text-2xl font-bold text-red-600">{abiertos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Refuerzos pendientes</p>
            <p className="text-2xl font-bold text-marron">{refuerzos}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por animal o medicamento..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={verEliminados}
            onChange={(e) => setVerEliminados(e.target.checked)}
          />
          Mostrar eliminados
        </label>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Animal</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Próx. refuerzo</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay eventos de salud para mostrar
                </td>
              </tr>
            ) : (
              visibles.map((e) => {
                const eliminado = !!e.eliminado_en
                const resuelto = e.estado === 'Resuelto'
                return (
                  <tr
                    key={e.id}
                    className={`border-t border-gray-100 ${eliminado ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-2 text-sm">{fechaDia(e.fecha_evento)}</td>
                    <td className="px-4 py-2 text-sm">
                      <Link to={`/animales/${e.animal_id}`} className="text-bosque hover:underline">
                        {e.animales?.nombre ?? `Animal #${e.animal_id}`}
                      </Link>
                      {e.animales?.codigo && (
                        <span className="block font-mono text-xs text-gray-500">
                          {e.animales.codigo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {e.tipo_evento}
                      {e.medicamento && (
                        <span className="block text-xs text-gray-500">{e.medicamento}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {eliminado ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs">
                          Eliminado
                        </span>
                      ) : (
                        <select
                          value={e.estado ?? 'Abierto'}
                          disabled={resuelto || !puedeEditar || trabajando === e.id}
                          onChange={(ev) => cambiarEstado(e, ev.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1 bg-white text-sm disabled:bg-gray-100"
                        >
                          {ESTADOS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">{fechaDia(e.fecha_proximo_refuerzo)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setHistorial(e)}
                          title="Historial del registro"
                          className="p-1.5 rounded-lg hover:bg-black/5 text-gray-600"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {puedeEditar && !eliminado && !resuelto && (
                          <button
                            onClick={() => abrirEdicion(e)}
                            title="Editar"
                            className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {puedeEliminar && !eliminado && (
                          <button
                            onClick={() => eliminar(e)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <Modal
          titulo={`Editar evento: ${editando.animales?.nombre ?? `Animal #${editando.animal_id}`}`}
          onCerrar={() => setEditando(null)}
        >
          <form onSubmit={guardarEdicion} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo de evento</label>
              <select value={f.tipo_evento} onChange={set('tipo_evento')} className={campo}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Dosis</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={f.dosis_aplicada}
                  onChange={set('dosis_aplicada')}
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Unidad (ml, mg...)</label>
                <input value={f.unidad_dosis} onChange={set('unidad_dosis')} maxLength={20} className={campo} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vía de administración</label>
                <input
                  value={f.via_administracion}
                  onChange={set('via_administracion')}
                  placeholder="Subcutánea, Oral..."
                  maxLength={30}
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Medicamento</label>
                <input value={f.medicamento} onChange={set('medicamento')} maxLength={100} className={campo} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Profesional responsable</label>
              <input
                value={f.profesional_responsable}
                onChange={set('profesional_responsable')}
                maxLength={100}
                className={campo}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha del evento</label>
                <input type="date" value={f.fecha_evento} onChange={set('fecha_evento')} className={campo} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Próximo refuerzo</label>
                <input
                  type="date"
                  value={f.fecha_proximo_refuerzo}
                  onChange={set('fecha_proximo_refuerzo')}
                  className={campo}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción del tratamiento</label>
              <textarea
                value={f.descripcion_tratamiento}
                onChange={set('descripcion_tratamiento')}
                rows={3}
                className={campo}
              />
            </div>

            {errorForm && <p className="text-red-600 text-sm">{errorForm}</p>}

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

      {historial && (
        <Modal titulo="Historial del registro" onCerrar={() => setHistorial(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">
              {historial.tipo_evento} · {historial.animales?.nombre ?? `Animal #${historial.animal_id}`}
            </p>
            {(historial.eventos_sanitarios_historial ?? []).length === 0 ? (
              <p className="text-gray-500">Este evento no tiene acciones registradas.</p>
            ) : (
              <ul className="space-y-2">
                {(historial.eventos_sanitarios_historial as any[]).map((h) => (
                  <li key={h.id} className="border-b border-gray-100 pb-2">
                    <span className="font-semibold">{h.accion}</span>
                    <span className="text-gray-500">
                      {' '}
                      · {h.usuarios?.nombre_usuario ?? (h.usuario_id ? `Usuario #${h.usuario_id}` : 'Sin usuario')}
                    </span>
                    <span className="block text-xs text-gray-500">{fechaHora(h.fecha)}</span>
                  </li>
                ))}
              </ul>
            )}
            {historial.eliminado_en && (
              <p className="text-red-600">
                Eliminado el {fechaHora(historial.eliminado_en)}
                {historial.eliminado_por?.nombre_usuario ? ` por ${historial.eliminado_por.nombre_usuario}` : ''}.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}