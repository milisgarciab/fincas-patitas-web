import { useEffect, useState } from 'react'
import { KeyRound, Plus, Search, Users } from 'lucide-react'
import { api } from '../api'
import { NOMBRE_ROL, puede } from '../permisos'
import Modal from '../components/Modal'

interface Usuario {
  id: number
  nombre_usuario: string
  correo_electronico: string
  telefono?: string | null
  rol_id: number
  estado?: string | null
}

const ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Encargado' },
  { id: 3, nombre: 'Empleado' },
]

const claseRol = (rolId: number) =>
  rolId === 1
    ? 'bg-bosque text-white'
    : rolId === 2
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
      : 'bg-menta text-bosque-oscuro'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Usuarios() {
  const gestiona = puede('usuarios.gestionar')
  const yo = JSON.parse(localStorage.getItem('user') ?? '{}')

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [texto, setTexto] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [trabajando, setTrabajando] = useState<number | null>(null)

  // Crear
  const [creando, setCreando] = useState(false)
  const [nNombre, setNNombre] = useState('')
  const [nCorreo, setNCorreo] = useState('')
  const [nTelefono, setNTelefono] = useState('')
  const [nClave, setNClave] = useState('')
  const [nRol, setNRol] = useState('3')
  const [guardando, setGuardando] = useState(false)
  const [errorCrear, setErrorCrear] = useState('')

  // Restablecer contraseña
  const [reseteando, setReseteando] = useState<Usuario | null>(null)
  const [nuevaClave, setNuevaClave] = useState('')
  const [errorClave, setErrorClave] = useState('')

  const cargar = () =>
    api
      .get('/users')
      .then((r) => {
        setUsuarios(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))
        setError('')
      })
      .catch((err) =>
        setError(
          err.response?.status === 403
            ? 'Solo el Administrador puede ver la lista de usuarios.'
            : 'No se pudo cargar la lista de usuarios',
        ),
      )

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const mensajeDe = (err: any, porDefecto: string) =>
    err.response?.data?.error?.message ?? porDefecto

  const cambiarRol = async (u: Usuario, rolId: number) => {
    if (rolId === u.rol_id) return
    if (!window.confirm(`¿Cambiar el rol de ${u.nombre_usuario} a ${NOMBRE_ROL[rolId]}?`)) return
    setError('')
    setAviso('')
    setTrabajando(u.id)
    try {
      await api.patch(`/users/${u.id}/rol`, { rol_id: rolId })
      await cargar()
      setAviso(`Rol de ${u.nombre_usuario} actualizado.`)
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo cambiar el rol'))
    } finally {
      setTrabajando(null)
    }
  }

  const cambiarEstado = async (u: Usuario) => {
    const nuevo = u.estado === 'Inactivo' ? 'Activo' : 'Inactivo'
    if (!window.confirm(`¿${nuevo === 'Activo' ? 'Activar' : 'Desactivar'} a ${u.nombre_usuario}?`)) return
    setError('')
    setAviso('')
    setTrabajando(u.id)
    try {
      await api.patch(`/users/${u.id}/status`, { estado: nuevo })
      await cargar()
      setAviso(`${u.nombre_usuario} quedó ${nuevo === 'Activo' ? 'activo' : 'inactivo'}.`)
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo cambiar el estado'))
    } finally {
      setTrabajando(null)
    }
  }

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorCrear('')
    setGuardando(true)
    try {
      await api.post('/users', {
        nombre_usuario: nNombre.trim(),
        correo_electronico: nCorreo.trim(),
        contrasena: nClave,
        telefono: nTelefono.trim() || undefined,
        rol_id: Number(nRol),
      })
      setCreando(false)
      setNNombre('')
      setNCorreo('')
      setNTelefono('')
      setNClave('')
      setNRol('3')
      await cargar()
      setAviso('Usuario creado.')
    } catch (err: any) {
      setErrorCrear(mensajeDe(err, 'No se pudo crear el usuario'))
    } finally {
      setGuardando(false)
    }
  }

  const restablecer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reseteando) return
    setErrorClave('')
    setGuardando(true)
    try {
      await api.patch(`/users/${reseteando.id}/reset-password`, { nueva_contrasena: nuevaClave })
      setAviso(`Contraseña de ${reseteando.nombre_usuario} restablecida.`)
      setReseteando(null)
      setNuevaClave('')
    } catch (err: any) {
      setErrorClave(mensajeDe(err, 'No se pudo restablecer la contraseña'))
    } finally {
      setGuardando(false)
    }
  }

  const visibles = usuarios
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

  const contar = (rolId: number) => usuarios.filter((u) => u.rol_id === rolId).length
  const inactivos = usuarios.filter((u) => u.estado === 'Inactivo').length

  const tarjeta = (titulo: string, valor: number) => (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="font-display font-bold text-3xl text-marron">{valor}</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-menta flex items-center justify-center">
            <Users className="w-5 h-5 text-bosque" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-marron">Usuarios</h1>
            <p className="text-sm text-gray-500">Personas registradas y su rol</p>
          </div>
        </div>
        {gestiona && (
          <button
            onClick={() => {
              setErrorCrear('')
              setCreando(true)
            }}
            className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {aviso && <p className="text-bosque text-sm">{aviso}</p>}

      {!cargando && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {tarjeta('Total', usuarios.length)}
          {tarjeta('Administradores', contar(1))}
          {tarjeta('Encargados', contar(2))}
          {tarjeta('Empleados', contar(3))}
          {tarjeta('Inactivos', inactivos)}
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
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bosque/40"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Estado</th>
              {gestiona && <th className="px-4 py-2 text-right">Acciones</th>}
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
                  No hay usuarios para mostrar
                </td>
              </tr>
            ) : (
              visibles.map((u) => {
                const esYo = u.id === yo.id
                const inactivo = u.estado === 'Inactivo'
                return (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-bosque text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {(u.nombre_usuario ?? '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">
                          {u.nombre_usuario}
                          {esYo && <span className="text-xs text-gray-500"> (tú)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">{u.correo_electronico}</td>
                    <td className="px-4 py-2 text-sm">{u.telefono ?? '—'}</td>
                    <td className="px-4 py-2">
                      {gestiona && !esYo ? (
                        <select
                          value={u.rol_id}
                          disabled={trabajando === u.id}
                          onChange={(e) => cambiarRol(u, Number(e.target.value))}
                          className={`px-2 py-1 rounded-full text-sm font-semibold border-0 ${claseRol(u.rol_id)}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${claseRol(u.rol_id)}`}
                        >
                          {NOMBRE_ROL[u.rol_id] ?? `Rol ${u.rol_id}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          inactivo ? 'bg-gray-200 text-gray-700' : 'bg-menta text-bosque-oscuro'
                        }`}
                      >
                        {inactivo ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    {gestiona && (
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setNuevaClave('')
                              setErrorClave('')
                              setReseteando(u)
                            }}
                            title="Restablecer contraseña"
                            className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {!esYo && (
                            <button
                              onClick={() => cambiarEstado(u)}
                              disabled={trabajando === u.id}
                              className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-black/5 disabled:opacity-50"
                            >
                              {inactivo ? 'Activar' : 'Desactivar'}
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

      {creando && (
        <Modal titulo="Nuevo usuario" onCerrar={() => setCreando(false)}>
          <form onSubmit={crear} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre de usuario</label>
              <input
                value={nNombre}
                onChange={(e) => setNNombre(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={nCorreo}
                onChange={(e) => setNCorreo(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Teléfono (opcional)</label>
              <input
                type="tel"
                value={nTelefono}
                onChange={(e) => setNTelefono(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={nClave}
                onChange={(e) => setNClave(e.target.value)}
                required
                minLength={8}
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rol</label>
              <select value={nRol} onChange={(e) => setNRol(e.target.value)} className={campo}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            {errorCrear && <p className="text-red-600 text-sm">{errorCrear}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCreando(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {reseteando && (
        <Modal
          titulo="Restablecer contraseña"
          onCerrar={() => setReseteando(null)}
        >
          <form onSubmit={restablecer} className="space-y-4">
            <p className="text-sm text-gray-500">
              Nueva contraseña para {reseteando.nombre_usuario}.
            </p>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                required
                minLength={8}
                className={campo}
              />
            </div>

            {errorClave && <p className="text-red-600 text-sm">{errorClave}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReseteando(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Restablecer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}