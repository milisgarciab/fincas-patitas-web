import { Link, useNavigate } from 'react-router-dom'

export default function Inicio() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')

  const salir = () => {
    localStorage.clear()
    navigate('/')
  }

  const boton =
    'bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-green-50">
      <h1 className="text-2xl font-bold text-green-800">
        Bienvenida, {user.nombre_usuario}
      </h1>
      <Link to="/animales" className={boton}>
        Ver animales
      </Link>
      <Link to="/animales/nuevo" className={boton}>
        Nuevo animal
      </Link>
      <Link to="/produccion/leche" className={boton}>
        Producción de leche
      </Link>
      <Link to="/produccion/leche/nuevo" className={boton}>
        Registrar leche
      </Link>
      <Link to="/produccion/huevos" className={boton}>
        Producción de huevos
      </Link>
      <Link to="/produccion/huevos/nuevo" className={boton}>
        Registrar huevos
      </Link>
      <Link to="/bodega" className={boton}>
        Inventario
      </Link>
      <button onClick={salir} className={boton}>
        Cerrar sesión
      </button>
    </div>
  )
}