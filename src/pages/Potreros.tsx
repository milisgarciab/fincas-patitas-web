import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from '../api'
import { aLista, cargarAnimales } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface Encargado {
  id: number
  nombre: string
}

interface Usuario {
  id: number
  nombre_usuario: string
}

const ESTADOS_SUGERIDOS = ['Disponible', 'Ocupado', 'En descanso', 'Mantenimiento']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const encargadosDe = (p: any): Encargado[] =>
  (p?.potrero_encargados ?? p?.encargados ?? []).map((e: any) => {
    const id = Number(e.usuario_id ?? e.usuarios?.id ?? e.id)
    return { id, nombre: e.usuarios?.nombre_usuario ?? e.nombre_usuario ?? `Usuario #${id}` }
  })

const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'

export default function Potreros() {
  const gestiona = puede('ubicacion.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [potreros, setPotreros] = useState<any[]>([])
  const [animales, setAnimales] = useState<AnimalResumen[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  // Crear / editar
  const [formAbierto, setFormAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [estado, setEstado] = useState('Disponible')
  const [hectareas, setHectareas] = useState('')
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Detalle
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [animalesPotrero, setAnimalesPotrero] = useState<any[] | null>(null)
  const [nuevoEncargado, setNuevoEncargado] = useState('')
  const [errorDetalle, setErrorDetalle] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  const cargar = useCallback(async () => {
    const [p, a, u] = await Promise.allSettled([
      api.get('/ubicaciones-potreros'),
      cargarAnimales(),
      api.get('/users'),
    ])
    if (p.status === 'fulfilled') {
      setPotreros(aLista(p.value.data))
      setError('')
    } else {
      setError('No se pudo cargar la lista de potreros')
    }
    setAnimales(a.status === 'fulfilled' ? a.value : [])
    setUsuarios(u.status === 'fulfilled' ? aLista(u.value.data) : null)
  }, [])

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const ocupados = (id: number) =>
    animales.filter((a) => a.potrero_id === id && a.estado === 'Activo').length

  const mensajeDe = (err: any, porDefecto: string) =>
    err.response?.data?.error?.message ?? porDefecto

  // ---------- Crear / editar ----------
  const abrirForm = (p?: any) => {
    setErrorForm('')
    setEditandoId(p?.id ?? null)
    setNombre(p?.nombre ?? '')
    setCapacidad(p?.capacidad_animales != null ? String(p.capacidad_animales) : '')
    setEstado(p?.estado ?? 'Disponible')
    setHectareas(p?.tamano_hectareas != null ? String(Number(p.tamano_hectareas)) : '')
    setFecha(p?.fecha_creacion ? String(p.fecha_creacion).slice(0, 10) : '')
    setDescripcion(p?.descripcion ?? '')
    setFormAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    const body = {
      nombre: nombre.trim(),
      capacidad_animales: capacidad ? Number(capacidad) : undefined,
      estado: estado.trim() || undefined,
      tamano_hectareas: hectareas ? Number(hectareas) : undefined,
      fecha_creacion: fecha || undefined,
      descripcion: descripcion.trim() || undefined,
    }
    try {
      if (editandoId) await api.put(`/ubicaciones-potreros/${editandoId}`, body)
      else await api.post('/ubicaciones-potreros', body)
      setFormAbierto(false)
      await cargar()
      setAviso(editandoId ? 'Potrero actualizado.' : 'Potrero creado.')
    } catch (err: any) {
      setErrorForm(mensajeDe(err, 'No se pudo guardar el potrero'))
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (p: any) => {
    if (!window.confirm(`¿Eliminar el potrero "${p.nombre}"? No se puede deshacer.`)) return
    setError('')
    setAviso('')
    try {
      await api.delete(`/ubicaciones-potreros/${p.id}`)
      await cargar()
      setAviso('Potrero eliminado.')
    } catch (err: any) {
      setError(
        err.response?.status === 409
          ? 'No se puede eliminar: hay animales asignados a este potrero.'
          : mensajeDe(err, 'No se pudo eliminar el potrero'),
      )
    }
  }

  // ---------- Detalle ----------
  const detalle = potreros.find((p) => p.id === detalleId) ?? null

  const abrirDetalle = (p: any) => {
    setDetalleId(p.id)
    setAnimalesPotrero(null)
    setErrorDetalle('')
    setNuevoEncargado('')
    api
      .get(`/ubicaciones-potreros/${p.id}/animales`)
      .then((r) => setAnimalesPotrero(aLista(r.data)))
      .catch(() => setAnimalesPotrero([]))
  }

  const agregarEncargado = async () => {
    if (!detalle || !nuevoEncargado) return
    setErrorDetalle('')
    try {
      await api.post(`/ubicaciones-potreros/${detalle.id}/encargados`, {
        usuario_id: Number(nuevoEncargado),
      })
      setNuevoEncargado('')
      await cargar()
    } catch (err: any) {
      setErrorDetalle(mensajeDe(err, 'No se pudo agregar el encargado'))
    }
  }

  const quitarEncargado = async (usuarioId: number) => {
    if (!detalle) return
    setErrorDetalle('')
    try {
      await api.delete(`/ubicaciones-potreros/${detalle.id}/encargados/${usuarioId}`)
      await cargar()
    } catch (err: any) {
      setErrorDetalle(mensajeDe(err, 'No se pudo quitar el encargado'))
    }
  }

  const subirFoto = async (archivo: File | undefined) => {
    if (!detalle || !archivo) return
    setErrorDetalle('')
    setSubiendo(true)
    try {
      const datos = new FormData()
      datos.append('foto', archivo)
      await api.post(`/ubicaciones-potreros/${detalle.id}/foto`, datos)
      await cargar()
    } catch (err: any) {
      setErrorDetalle(mensajeDe(err, 'No se pudo subir la foto'))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Potreros</h1>
          <p className="text-sm text-gray-500">Terrenos de la finca, su ocupación y encargados</p>
        </div>
        {gestiona && (
          <button
            onClick={() => abrirForm()}
            className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo potrero
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {aviso && <p className="text-bosque text-sm">{aviso}</p>}
      {cargando && <p className="text-gray-500">Cargando...</p>}

      {!cargando && potreros.length === 0 && !error && (
        <p className="text-gray-500">Todavía no hay potreros registrados.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {potreros.map((p) => {
          const n = ocupados(p.id)
          const encs = encargadosDe(p)
          const lleno = p.capacidad_animales != null && n >= p.capacidad_animales
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {p.foto_url ? (
                <img src={p.foto_url} alt={p.nombre} className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 bg-menta flex items-center justify-center text-4xl">🌿</div>
              )}
              <div className="p-4 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display font-bold text-lg text-marron">{p.nombre}</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-menta text-bosque-oscuro">
                    {p.estado ?? '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  Animales:{' '}
                  <span className={lleno ? 'font-semibold text-red-600' : 'font-semibold'}>
                    {n}
                    {p.capacidad_animales != null ? ` / ${p.capacidad_animales}` : ''}
                  </span>
                </p>
                {p.tamano_hectareas != null && (
                  <p className="text-sm text-gray-500">{Number(p.tamano_hectareas)} hectáreas</p>
                )}
                <p className="text-sm text-gray-500">
                  Encargados: {encs.length ? encs.map((e) => e.nombre).join(', ') : 'sin asignar'}
                </p>
              </div>
              <div className="flex gap-1 px-3 pb-3 justify-end">
                <button
                  onClick={() => abrirDetalle(p)}
                  title="Ver detalle"
                  className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {gestiona && (
                  <button
                    onClick={() => abrirForm(p)}
                    title="Editar"
                    className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {puedeEliminar && (
                  <button
                    onClick={() => eliminar(p)}
                    title="Eliminar"
                    className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {formAbierto && (
        <Modal
          titulo={editandoId ? 'Editar potrero' : 'Nuevo potrero'}
          onCerrar={() => setFormAbierto(false)}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Capacidad (animales)</label>
                <input
                  type="number"
                  min="0"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tamaño (hectáreas)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hectareas}
                  onChange={(e) => setHectareas(e.target.value)}
                  className={campo}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Estado</label>
                <input
                  list="estados-potrero"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  maxLength={20}
                  className={campo}
                />
                <datalist id="estados-potrero">
                  {ESTADOS_SUGERIDOS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha de creación</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={campo}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                maxLength={255}
                className={campo}
              />
            </div>
            {errorForm && <p className="text-red-600 text-sm">{errorForm}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormAbierto(false)}
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

      {detalle && (
        <Modal titulo={detalle.nombre} onCerrar={() => setDetalleId(null)}>
          <div className="space-y-4">
            {detalle.foto_url ? (
              <img
                src={detalle.foto_url}
                alt={detalle.nombre}
                className="w-full h-44 object-cover rounded-lg"
              />
            ) : (
              <div className="h-24 bg-menta rounded-lg flex items-center justify-center text-4xl">
                🌿
              </div>
            )}

            {gestiona && (
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-bosque cursor-pointer hover:underline">
                <Camera className="w-4 h-4" />
                {subiendo ? 'Subiendo...' : detalle.foto_url ? 'Cambiar foto' : 'Subir foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={subiendo}
                  onChange={(e) => {
                    subirFoto(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
            )}

            <div className="text-sm text-gray-700 space-y-1">
              <p>Estado: {detalle.estado ?? '—'}</p>
              <p>
                Capacidad: {detalle.capacidad_animales ?? '—'} · Tamaño:{' '}
                {detalle.tamano_hectareas != null ? `${Number(detalle.tamano_hectareas)} ha` : '—'}
              </p>
              <p>Creado: {fechaDia(detalle.fecha_creacion)}</p>
              {detalle.descripcion && <p>{detalle.descripcion}</p>}
            </div>

            <div>
              <h3 className="font-semibold text-marron mb-2">Encargados</h3>
              {encargadosDe(detalle).length === 0 ? (
                <p className="text-sm text-gray-500">Sin encargados asignados.</p>
              ) : (
                <ul className="space-y-1">
                  {encargadosDe(detalle).map((e) => (
                    <li key={e.id} className="flex items-center justify-between text-sm">
                      <span>{e.nombre}</span>
                      {gestiona && usuarios && (
                        <button
                          onClick={() => quitarEncargado(e.id)}
                          title="Quitar"
                          className="p-1 rounded hover:bg-black/5 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {gestiona &&
                (usuarios ? (
                  <div className="flex gap-2 mt-2">
                    <select
                      value={nuevoEncargado}
                      onChange={(e) => setNuevoEncargado(e.target.value)}
                      className={campo}
                    >
                      <option value="">Agregar encargado...</option>
                      {usuarios
                        .filter((u) => !encargadosDe(detalle).some((e) => e.id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre_usuario}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={agregarEncargado}
                      disabled={!nuevoEncargado}
                      className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-3 disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Solo el Administrador puede asignar o quitar encargados.
                  </p>
                ))}
            </div>

            <div>
              <h3 className="font-semibold text-marron mb-2">Animales en este potrero</h3>
              {animalesPotrero === null ? (
                <p className="text-sm text-gray-500">Cargando...</p>
              ) : animalesPotrero.length === 0 ? (
                <p className="text-sm text-gray-500">No hay animales en este potrero.</p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {animalesPotrero.map((a) => (
                    <li key={a.id} className="text-sm">
                      <Link to={`/animales/${a.id}`} className="text-bosque hover:underline">
                        {a.nombre ?? 'Sin nombre'} ({a.codigo})
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {errorDetalle && <p className="text-red-600 text-sm">{errorDetalle}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}