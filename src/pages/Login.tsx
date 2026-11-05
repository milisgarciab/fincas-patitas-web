import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, Leaf, LifeBuoy, Lock, Mail } from 'lucide-react'
import { api } from '../api'
import Logo from '../components/Logo'
import CampoAuth from '../components/CampoAuth'
import FondoEstrellas from '../components/FondoEstrellas'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const registrado = location.state?.registrado

  const guardado = localStorage.getItem('correoRecordado') ?? ''
  const [correo, setCorreo] = useState(guardado)
  const [contrasena, setContrasena] = useState('')
  const [recordar, setRecordar] = useState(!!guardado)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

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
      if (recordar) localStorage.setItem('correoRecordado', correo)
      else localStorage.removeItem('correoRecordado')
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

  return (
    <FondoEstrellas>
      <div className="w-full max-w-5xl min-h-[600px] rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-[1.1fr_1fr] bg-crema">
        {/* Video */}
        <div
          className="relative hidden md:flex flex-col justify-between p-8 text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0A3A2A, #2F7D4F)' }}
        >
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/login.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

          <div className="relative z-10">
            <Logo claro />
          </div>
          <p
            className="relative z-10 text-4xl leading-snug -rotate-6 origin-bottom-left mb-6 drop-shadow"
            style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }}
          >
            Animales sanos,
            <br />
            fincas productivas,
            <br />
            siempre juntos ♡
          </p>
        </div>

        {/* Formulario */}
        <div className="relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
          <Leaf className="absolute -bottom-8 -right-8 w-44 h-44 text-hoja/40 -rotate-[30deg]" />

          <form onSubmit={entrar} className="relative w-full max-w-sm space-y-4">
            <div className="md:hidden flex justify-center mb-2">
              <Logo />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-bosque-oscuro">Iniciar sesión</h1>
              <p className="text-sm text-gray-500 mt-1">Accede a tu cuenta para continuar</p>
            </div>

            {registrado && (
              <p className="text-sm text-bosque bg-menta rounded-lg px-3 py-2">
                Cuenta creada. Ya puedes iniciar sesión.
              </p>
            )}

            <CampoAuth
              icono={Mail}
              tipo="email"
              placeholder="Correo electrónico"
              valor={correo}
              onCambio={setCorreo}
            />

            <CampoAuth
              icono={Lock}
              tipo="password"
              placeholder="Contraseña"
              valor={contrasena}
              onCambio={setContrasena}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="accent-bosque"
                />
                Recordarme
              </label>
              <button
                type="button"
                disabled
                title="Próximamente"
                className="text-bosque disabled:opacity-60"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-3 disabled:opacity-50"
            >
              {cargando ? 'Entrando...' : 'Iniciar sesión'}
              {!cargando && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-3">
              <span className="flex-1 border-t border-gray-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="flex-1 border-t border-gray-300" />
            </div>

            <Link
              to="/registro"
              className="block text-center border border-bosque text-bosque font-semibold rounded-lg py-3 hover:bg-menta"
            >
              Crear una cuenta
            </Link>

            <p className="flex items-center gap-2 text-sm text-gray-500">
              <LifeBuoy className="w-4 h-4" />
              ¿Necesitas ayuda?
            </p>
          </form>
        </div>
      </div>
    </FondoEstrellas>
  )
}