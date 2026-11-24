import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { api } from '../api'

interface Registro {
  id: number
  usuario_id: number | null
  metodo: string
  ruta: string
  codigo_respuesta: number | null
  fecha: string
}

interface Usuario {
  id: number
  nombre_usuario: string
}

const METODOS = ['POST', 'PUT', 'PATCH', 'DELETE']

const colorMetodo = (m: string) =>
  m === 'DELETE'
    ? 'bg-red-100 text-red-700'
    : m === 'POST'
      ? 'bg-menta text-bosque-oscuro'
      : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'

const colorCodigo = (c: number | null) =>
  c !== null && c >= 400 ? 'text-red-600 font-semibold' : 'text-gray-700'

export default function Auditoria() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [metodo, setMetodo] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/users')
      .then((r) => setUsuarios(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setCargando(true)
    setError('')
    api
      .get('/auditoria', {
        params: { metodo: metodo || undefined, usuario_id: usuarioId || undefined },
      })
      .then((r) => setRegistros(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch((err) =>
        setError(
          err.response?.status === 403
            ? 'Solo el Administrador puede consultar la auditoría.'
            : 'No se pudo cargar la auditoría',
        ),
      )
      .finally(() => setCargando(false))
  }, [metodo, usuarioId])

  const nombre = (id: number | null) =>
    id === null ? 'Sin usuario' : (usuarios.find((u) => u.id === id)?.nombre_usuario ?? `Usuario #${id}`)

  const fechaHora = (f: string) =>
    new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })

  const campo =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bosque/40'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-menta flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-bosque" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-marron">Auditoría</h1>
          <p className="text-sm text-gray-500">
            Últimas 200 acciones de escritura (crear, editar, eliminar)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={campo}>
          <option value="">Todas las acciones</option>
          {METODOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className={campo}>
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre_usuario}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Ruta</th>
              <th className="px-4 py-2">Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No hay registros
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm whitespace-nowrap">{fechaHora(r.fecha)}</td>
                  <td className="px-4 py-2 text-sm">{nombre(r.usuario_id)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorMetodo(r.metodo)}`}
                    >
                      {r.metodo}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">{r.ruta}</td>
                  <td className={`px-4 py-2 text-sm ${colorCodigo(r.codigo_respuesta)}`}>
                    {r.codigo_respuesta ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}