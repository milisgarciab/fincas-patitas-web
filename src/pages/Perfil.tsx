import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Phone, ShieldCheck, User } from 'lucide-react'
import { api } from '../api'
import { NOMBRE_ROL, rolActual } from '../permisos'
import { limpiarSesion } from '../sesion'

// Resumen de la matriz de permisos por rol
const PERMISOS_ROL: Record<number, string[]> = {
  1: [
    'Control total del sistema',
    'Gestionar usuarios y roles',
    'Registrar, editar y eliminar gastos y ventas',
    'Generar balances y configurar precios de mercado',
    'Crear los insumos del catálogo de inventario',
  ],
  2: [
    'Operar el sistema día a día',
    'Editar y eliminar registros operativos',
    'Consultar finanzas y configurar precios de mercado',
    'Trasladar animales entre potreros',
  ],
  3: [
    'Registrar datos operativos: animales, producción, salud y reproducción',
    'Editar registros ya creados, sin poder eliminarlos',
    'Sin acceso a finanzas ni a la gestión de usuarios',
    'Su contraseña solo la cambia un Administrador',
  ],
}

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Perfil() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')
  const rolId = rolActual()
  const rol = NOMBRE_ROL[rolId] ?? 'Usuario'

  const [nombre, setNombre] = useState<string>(user.nombre_usuario ?? '')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const inicial = (nombre || '?').charAt(0).toUpperCase()

  const salir = () => {
    limpiarSesion()
    navigate('/')
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setAviso('')
    if (clave && clave !== clave2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    const cambios: Record<string, string> = {}
    if (nombre.trim() && nombre.trim() !== user.nombre_usuario) cambios.nombre_usuario = nombre.trim()
    if (clave) cambios.contrasena = clave
    if (Object.keys(cambios).length === 0) {
      setError('No hay cambios para guardar.')
      return
    }
    setGuardando(true)
    try {
      await api.put(`/users/${user.id}/profile`, cambios)
      if (cambios.nombre_usuario) {
        localStorage.setItem('user', JSON.stringify({ ...user, nombre_usuario: cambios.nombre_usuario }))
      }
      setClave('')
      setClave2('')
      setAviso(
        cambios.nombre_usuario
          ? 'Datos actualizados. El nombre de la barra superior se refresca al recargar la página.'
          : 'Contraseña actualizada.',
      )
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  const Fila = ({
    icono: Icono,
    etiqueta,
    valor,
  }: {
    icono: typeof User
    etiqueta: string
    valor: string
  }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="w-9 h-9 rounded-full bg-menta flex items-center justify-center shrink-0">
        <Icono className="w-4 h-4 text-bosque" />
      </span>
      <div>
        <p className="text-xs text-gray-500">{etiqueta}</p>
        <p className="font-medium text-gray-800">{valor || '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-marron">Mi perfil</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="w-16 h-16 rounded-full bg-bosque text-white flex items-center justify-center text-2xl font-bold">
            {inicial}
          </span>
          <div>
            <p className="font-display font-bold text-xl text-marron">{nombre}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-menta text-bosque-oscuro">
              {rol}
            </span>
          </div>
        </div>

        <Fila icono={User} etiqueta="Nombre de usuario" valor={user.nombre_usuario} />
        <Fila icono={Mail} etiqueta="Correo electrónico" valor={user.correo_electronico} />
        <Fila icono={Phone} etiqueta="Teléfono" valor={user.telefono} />
      </div>

      <form onSubmit={guardar} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-marron">Cambiar mis datos</h2>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre de usuario</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} className={campo} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nueva contraseña (opcional)</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              minLength={8}
              className={campo}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Repite la contraseña</label>
            <input
              type="password"
              value={clave2}
              onChange={(e) => setClave2(e.target.value)}
              minLength={8}
              className={campo}
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {aviso && <p className="text-bosque text-sm">{aviso}</p>}
        <button
          type="submit"
          disabled={guardando}
          className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-display font-bold text-lg text-marron mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-bosque" />
          Qué puede hacer tu rol
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {(PERMISOS_ROL[rolId] ?? []).map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-bosque">•</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={salir}
        className="flex items-center gap-2 border border-red-300 text-red-600 font-semibold rounded-lg px-4 py-2 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  )
}