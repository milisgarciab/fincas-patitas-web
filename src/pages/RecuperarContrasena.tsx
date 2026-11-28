import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { api } from '../api'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function RecuperarContrasena() {
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [correo, setCorreo] = useState('')
  const [token, setToken] = useState('')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pedirToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const r = await api.post('/auth/forgot-password', { email: correo.trim() })
      const d = r.data?.data ?? r.data
      const recibido = d?.token ?? d?.resetToken ?? d?.reset_token
      if (recibido) setToken(String(recibido))
      setMensaje(
        d?.message ?? 'Si el correo está registrado, se generó un código de recuperación.',
      )
      setPaso(2)
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo solicitar la recuperación')
    } finally {
      setEnviando(false)
    }
  }

  const cambiar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (clave !== clave2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setEnviando(true)
    try {
      await api.post('/auth/reset-password', { token: token.trim(), nueva_password: clave })
      setPaso(3)
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'El código no es válido o ya venció')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-bosque flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </span>
          <h1 className="font-display font-bold text-xl text-marron">Recuperar contraseña</h1>
        </div>

        {paso === 1 && (
          <form onSubmit={pedirToken} className="space-y-4">
            <p className="text-sm text-gray-500">
              Escribe el correo de tu cuenta y te generamos un código para crear una contraseña nueva.
            </p>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className={campo}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Solicitar código'}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={cambiar} className="space-y-4">
            {mensaje && <p className="text-sm text-bosque">{mensaje}</p>}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Código de recuperación</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} required className={campo} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
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
                required
                minLength={8}
                className={campo}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {enviando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {paso === 3 && (
          <p className="text-sm text-bosque">Listo, tu contraseña se cambió. Ya puedes iniciar sesión.</p>
        )}

        <Link to="/" className="block text-center text-sm text-bosque hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}