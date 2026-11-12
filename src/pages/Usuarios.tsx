import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { obtenerLista } from '../produccionApi'
import { NOMBRE_ROL, rolActual } from '../permisos'

interface Usuario {
  id: number
  nombre_usuario: string
  correo_electronico: string
  telefono?: string | null
  rol_id: number
  activo?: boolean
  roles?: { nombre: string } | null
}

// Rutas posibles del backend: se prueban en este orden
const RUTAS_USUARIOS = ['/usuarios', '/auth/usuarios', '/users']

const nombreRol = (u: Usuario) => NOMBRE_ROL[u.rol_id] ?? u.roles?.nombre ?? `Rol ${u.rol_id}`

const claseRol = (rolId: number) =>
  rolId === 1
    ? 'bg-bosque text-white'
    : rolId === 2
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
      : 'bg-menta text-bosque-oscuro'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [texto, setTexto] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const miRol = rolActual()

  useEffect(() => {
    obtenerLista<Usuario>(RUTAS_USUARIOS)
      .then(setUsuarios)
      .catch((err) => {
        if (err.message === 'RUTA_NO_ENCONTRADA') {
          setError(
            'No se encontró la ruta de usuarios en el backend. En Swagger abre el GET de usuarios y pásame la línea Request URL.',
          )
        } else if (err.response?.status === 403) {
          setError('Tu rol no tiene permiso para ver la lista de usuarios.')
        } else {
          setError('No se pudo cargar la lista de usuarios')
        }
      })
      .finally(() => setCargando(false))
  }, [])

  // El Administrador ve a todos; el Encargado solo a los Empleados (según la matriz)
  const base = miRol === 1 ? usuarios : usuarios.filter((u) => u.rol_id === 3)

  const visibles = base
    .filter((u) => !filtroRol || u.rol_id === Number(filtroRol))
    .filter((u) => {
      const q = texto.trim().toLowerCase()
      return (
        !q ||
        u.nombre_usuario?.toLowerCase().includes(q) ||
        u.correo_electronico?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => a.rol_id - b.rol_id || a.nombre_usuario.localeCompare(b.nombre_usuario))

  const contar = (rolId: number) => base.filter((u) => u.rol_id === rolId).length
  const hayEstado = base.some((u) => u.activo !== undefined)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-menta flex items-center justify-center">
          <Users className="w-5 h-5 text-bosque" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-marron">Usuarios</h1>
          <p className="text-sm text-gray-500">Personas registradas y su rol</p>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-display font-bold text-3xl text-marron">{base.length}</p>
          </div>
          {miRol === 1 && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">Administradores</p>
                <p className="font-display font-bold text-3xl text-marron">{contar(1)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500">Encargados</p>
                <p className="font-display font-bold text-3xl text-marron">{contar(2)}</p>
              </div>
            </>
          )}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Empleados</p>
            <p className="font-display font-bold text-3xl text-marron">{contar(3)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-bosque/40"
          />
        </div>
        {miRol === 1 && (
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bosque/40"
          >
            <option value="">Todos los roles</option>
            <option value="1">Administrador</option>
            <option value="2">Encargado</option>
            <option value="3">Empleado</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Rol</th>
              {hayEstado && <th className="px-4 py-2">Estado</th>}
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
                  No hay usuarios para mostrar
                </td>
              </tr>
            ) : (
              visibles.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-bosque text-white flex items-center justify-center text-sm font-semibold shrink-0">
                        {(u.nombre_usuario ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium">{u.nombre_usuario}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">{u.correo_electronico}</td>
                  <td className="px-4 py-2 text-sm">{u.telefono ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${claseRol(u.rol_id)}`}
                    >
                      {nombreRol(u)}
                    </span>
                  </td>
                  {hayEstado && (
                    <td className="px-4 py-2 text-sm">{u.activo ? 'Activo' : 'Inactivo'}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}