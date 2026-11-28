import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { aLista, cargarAnimales } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface Especie {
  id: number
  nombre: string
}

interface Usuario {
  id: number
  nombre_usuario: string
}

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Lotes() {
  const gestiona = puede('ubicacion.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [lotes, setLotes] = useState<any[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [animales, setAnimales] = useState<AnimalResumen[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  // Crear / editar
  const [formAbierto, setFormAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [especieId, setEspecieId] = useState('')
  const [fecha, setFecha] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [encargadoId, setEncargadoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Animales del lote
  const [verLote, setVerLote] = useState<any | null>(null)

  const cargar = useCallback(async () => {
    const [l, e, a, u] = await Promise.allSettled([
      api.get('/lotes-animales'),
      api.get('/especies'),
      cargarAnimales(),
      api.get('/users'),
    ])
    if (l.status === 'fulfilled') {
      setLotes(aLista(l.value.data))
      setError('')
    } else {
      setError('No se pudo cargar la lista de lotes')
    }
    setEspecies(e.status === 'fulfilled' ? aLista(e.value.data) : [])
    setAnimales(a.status === 'fulfilled' ? a.value : [])
    setUsuarios(u.status === 'fulfilled' ? aLista(u.value.data) : null)
  }, [])

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const mensajeDe = (err: any, porDefecto: string) =>
    err.response?.data?.error?.message ?? porDefecto

  const nombreEspecie = (l: any) =>
    l.especies?.nombre ?? especies.find((x) => x.id === l.especie_id)?.nombre ?? '—'

  const nombreEncargado = (l: any) => {
    if (l.encargado?.nombre_usuario) return l.encargado.nombre_usuario as string
    if (!l.encargado_id) return 'Sin encargado'
    return usuarios?.find((u) => u.id === l.encargado_id)?.nombre_usuario ?? `Usuario #${l.encargado_id}`
  }

  const animalesDe = (id: number) => animales.filter((a) => a.lote_id === id)

  const abrirForm = (l?: any) => {
    setErrorForm('')
    setEditandoId(l?.id ?? null)
    setNombre(l?.nombre ?? '')
    setEspecieId(l?.especie_id ? String(l.especie_id) : '')
    setFecha(l?.fecha_creacion ? String(l.fecha_creacion).slice(0, 10) : '')
    setCapacidad(l?.capacidad_estimada != null ? String(l.capacidad_estimada) : '')
    setDescripcion(l?.descripcion ?? '')
    setEncargadoId(l?.encargado_id ? String(l.encargado_id) : '')
    setFormAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    const body: Record<string, unknown> = {
      nombre: nombre.trim(),
      especie_id: Number(especieId),
      fecha_creacion: fecha || undefined,
      capacidad_estimada: capacidad ? Number(capacidad) : undefined,
      descripcion: descripcion.trim() || undefined,
    }
    // Solo el Administrador ve la lista de usuarios; los demás no tocan el encargado
    if (usuarios) body.encargado_id = encargadoId ? Number(encargadoId) : null
    try {
      if (editandoId) await api.put(`/lotes-animales/${editandoId}`, body)
      else await api.post('/lotes-animales', body)
      setFormAbierto(false)
      await cargar()
      setAviso(editandoId ? 'Lote actualizado.' : 'Lote creado.')
    } catch (err: any) {
      setErrorForm(mensajeDe(err, 'No se pudo guardar el lote'))
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (l: any) => {
    if (!window.confirm(`¿Eliminar el lote "${l.nombre}"? No se puede deshacer.`)) return
    setError('')
    setAviso('')
    try {
      await api.delete(`/lotes-animales/${l.id}`)
      await cargar()
      setAviso('Lote eliminado.')
    } catch (err: any) {
      setError(
        err.response?.status === 409
          ? 'No se puede eliminar: hay animales asociados a este lote.'
          : mensajeDe(err, 'No se pudo eliminar el lote'),
      )
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Lotes</h1>
          <p className="text-sm text-gray-500">Grupos de animales de una misma especie</p>
        </div>
        {gestiona && (
          <button
            onClick={() => abrirForm()}
            className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo lote
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {aviso && <p className="text-bosque text-sm">{aviso}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Lote</th>
              <th className="px-4 py-2">Especie</th>
              <th className="px-4 py-2">Animales</th>
              <th className="px-4 py-2">Capacidad</th>
              <th className="px-4 py-2">Encargado</th>
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
            ) : lotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay lotes registrados
                </td>
              </tr>
            ) : (
              lotes.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <p className="font-medium">{l.nombre}</p>
                    {l.descripcion && <p className="text-xs text-gray-500">{l.descripcion}</p>}
                  </td>
                  <td className="px-4 py-2 text-sm">{nombreEspecie(l)}</td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setVerLote(l)}
                      className="text-bosque font-semibold hover:underline"
                    >
                      {animalesDe(l.id).length}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-sm">{l.capacidad_estimada ?? '—'}</td>
                  <td className="px-4 py-2 text-sm">{nombreEncargado(l)}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      {gestiona && (
                        <button
                          onClick={() => abrirForm(l)}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          onClick={() => eliminar(l)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
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

      {formAbierto && (
        <Modal titulo={editandoId ? 'Editar lote' : 'Nuevo lote'} onCerrar={() => setFormAbierto(false)}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Capacidad estimada</label>
                <input
                  type="number"
                  min="0"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  className={campo}
                />
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
            {usuarios && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Encargado</label>
                <select
                  value={encargadoId}
                  onChange={(e) => setEncargadoId(e.target.value)}
                  className={campo}
                >
                  <option value="">Sin encargado</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_usuario}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

      {verLote && (
        <Modal titulo={`Animales de ${verLote.nombre}`} onCerrar={() => setVerLote(null)}>
          {animalesDe(verLote.id).length === 0 ? (
            <p className="text-sm text-gray-500">Este lote no tiene animales.</p>
          ) : (
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {animalesDe(verLote.id).map((a) => (
                <li key={a.id} className="text-sm">
                  <Link to={`/animales/${a.id}`} className="text-bosque hover:underline">
                    {a.nombre ?? 'Sin nombre'} ({a.codigo})
                  </Link>
                  <span className="text-gray-500"> · {a.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}