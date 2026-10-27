import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import AuthLayout from '../components/AuthLayout'

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await api.post('/auth/register', {
        nombre_usuario: nombre,
        correo_electronico: correo,
        contrasena,
        telefono,
      })
      navigate('/', { state: { registrado: true } })
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ?? 'No se pudo crear la cuenta',
      )
    } finally {
      setCargando(false)
    }
  }

  const campo =
    'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600'

  return (
    <AuthLayout>
      <form
        onSubmit={registrar}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-green-800 text-center">
          Crear cuenta
        </h1>

        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className={campo}
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className={campo}
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
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
          {cargando ? 'Creando...' : 'Crear cuenta'}
        </button>

        <p className="text-sm text-center text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="text-green-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}