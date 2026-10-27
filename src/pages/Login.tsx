import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { api } from '../api'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const registrado = location.state?.registrado

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const { data } = await api.post('/auth/login', {
        correo_electronico: correo,
        contrasena,
      })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/inicio')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error?.message ?? 'Error al iniciar sesión')
      } else {
        setError('No se pudo conectar con el backend')
      }
    } finally {
      setCargando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600'

  return (
    <AuthLayout>
      <form
        onSubmit={entrar}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-green-800 text-center">
          Iniciar sesión
        </h1>

        {registrado && (
          <p className="text-green-700 text-sm text-center">
            Cuenta creada. Ya puedes iniciar sesión.
          </p>
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className={campo}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          className={campo}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
        >
          {cargando ? 'Entrando...' : 'Iniciar sesión'}
        </button>

        <p className="text-sm text-center text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-green-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}