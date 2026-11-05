import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Layers, Leaf, Lock, Mail, PawPrint, Phone, TrendingUp, User, ClipboardList } from 'lucide-react'
import { api } from '../api'
import Logo from '../components/Logo'
import CampoAuth from '../components/CampoAuth'

const BENEFICIOS = [
  { icono: ClipboardList, texto: 'Más control' },
  { icono: TrendingUp, texto: 'Mejores resultados' },
  { icono: Layers, texto: 'Todo en un solo lugar' },
]

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [sinIlustracion, setSinIlustracion] = useState(false)
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
      setError(err.response?.data?.error?.message ?? 'No se pudo crear la cuenta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 flex items-center justify-center bg-gradient-to-br from-[#E3F0D8] to-[#F4F9EE] dark:from-[#141A12] dark:to-[#1D2719]">
      <div className="relative w-full max-w-5xl min-h-[640px] rounded-3xl overflow-hidden grid md:grid-cols-[1.1fr_1fr]">
        <Leaf className="absolute -top-6 -left-6 w-40 h-40 text-hoja/40 rotate-12" />

        {/* Presentación */}
        <div className="relative hidden md:flex flex-col p-8">
          <Logo />

          <div className="flex-1 flex items-center justify-center my-4">
            {sinIlustracion ? (
              <div className="w-64 h-56 rounded-[40%] bg-hoja/40 flex items-center justify-center">
                <PawPrint className="w-20 h-20 text-bosque" />
              </div>
            ) : (
              <img
                src="/registro.png"
                alt="Animales de la finca"
                className="max-h-64 object-contain"
                onError={() => setSinIlustracion(true)}
              />
            )}
          </div>

          <h2 className="text-3xl font-bold text-bosque-oscuro">¡Únete a nuestra finca!</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-xs">
            Gestiona tu producción, cuida tus animales y lleva el control de todo desde un
            solo lugar.
          </p>

          <div className="flex gap-6 mt-6">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <div key={texto} className="flex flex-col items-center text-center gap-1 text-bosque">
                <Icono className="w-5 h-5" />
                <span className="text-xs">{texto}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <form
            onSubmit={registrar}
            className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-3"
          >
            <div className="md:hidden flex justify-center mb-2">
              <Logo />
            </div>

            <div className="mb-1">
              <h1 className="text-2xl font-bold text-bosque-oscuro">Crear cuenta</h1>
              <p className="text-sm text-gray-500">Completa la información para registrarte.</p>
            </div>

            <CampoAuth
              icono={User}
              etiqueta="Nombre completo"
              placeholder="Ej: María López"
              valor={nombre}
              onCambio={setNombre}
            />
            <CampoAuth
              icono={Mail}
              tipo="email"
              etiqueta="Correo electrónico"
              placeholder="ejemplo@correo.com"
              valor={correo}
              onCambio={setCorreo}
            />
            <CampoAuth
              icono={Phone}
              tipo="tel"
              etiqueta="Teléfono"
              placeholder="3001234567"
              valor={telefono}
              onCambio={setTelefono}
            />
            <CampoAuth
              icono={Lock}
              tipo="password"
              etiqueta="Contraseña"
              placeholder="Mínimo 8 caracteres"
              valor={contrasena}
              onCambio={setContrasena}
              minimo={8}
            />

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={terminos}
                onChange={(e) => setTerminos(e.target.checked)}
                required
                className="accent-bosque"
              />
              Acepto los términos y condiciones
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-3 disabled:opacity-50"
            >
              {cargando ? 'Creando...' : 'Registrarse'}
              {!cargando && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-center text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/" className="text-bosque font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}