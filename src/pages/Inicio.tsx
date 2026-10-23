import { Link, useNavigate } from 'react-router-dom'

export default function Inicio() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')

  const salir = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-green-50">
      <h1 className="text-2xl font-bold text-green-800">
        Bienvenida, {user.nombre_usuario}
      </h1>
      <Link
        to="/animales"
        className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
      >
        Ver animales
      </Link>
      <Link
        to="/animales/nuevo"
        className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
      >
        Nuevo animal
      </Link>
      <button
        onClick={salir}
        className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
      >
        Cerrar sesión
      </button>
    </div>
  )
}