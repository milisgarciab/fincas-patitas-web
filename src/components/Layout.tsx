import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Baby,
  Bell,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  Milk,
  Package,
  PawPrint,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Item {
  texto: string
  ruta: string
}

interface Opcion {
  texto: string
  icono: LucideIcon
  ruta?: string
  exacta?: boolean
  hijos?: Item[]
}

const ROLES: Record<number, string> = {
  1: 'Administrador',
  2: 'Encargado',
  3: 'Empleado',
}

const MENU: Opcion[] = [
  { texto: 'Inicio', icono: Home, ruta: '/inicio', exacta: true },
  { texto: 'Animales', icono: PawPrint, ruta: '/animales' },
  {
    texto: 'Producción',
    icono: Milk,
    hijos: [
      { texto: 'Leche', ruta: '/produccion/leche' },
      { texto: 'Huevos', ruta: '/produccion/huevos' },
    ],
  },
  { texto: 'Inventario', icono: Package, ruta: '/bodega' },
  { texto: 'Salud', icono: HeartPulse, ruta: '/salud' },
  { texto: 'Reproducción', icono: Baby, ruta: '/reproduccion' },
  { texto: 'Finanzas', icono: Wallet, ruta: '/finanzas' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')
  const rol = ROLES[user.rol_id] ?? 'Usuario'
  const inicial = (user.nombre_usuario ?? '?').charAt(0).toUpperCase()

  const [menuMovil, setMenuMovil] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const [produccionAbierta, setProduccionAbierta] = useState(
    location.pathname.startsWith('/produccion'),
  )
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setMenuMovil(false)
    setMenuUsuario(false)
    if (location.pathname.startsWith('/produccion')) setProduccionAbierta(true)
  }, [location.pathname])

  const salir = () => {
    localStorage.clear()
    navigate('/')
  }

  const buscar = (e: React.FormEvent) => {
    e.preventDefault()
    const q = busqueda.trim()
    if (q) navigate(`/animales?q=${encodeURIComponent(q)}`)
  }

  const claseItem = (activo: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      activo ? 'bg-activo text-white' : 'text-white/80 hover:bg-white/10'
    }`

  const lateral = (
    <div className="flex flex-col h-full text-white">
      <Link to="/inicio" className="h-16 shrink-0 flex items-center gap-3 px-5">
        <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
          <PawPrint className="w-5 h-5 text-bosque" />
        </span>
        <span className="font-bold leading-tight">
          Fincas y<br />
          Patitas
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {MENU.map((m) => {
          const Icono = m.icono

          if (m.ruta) {
            return (
              <NavLink
                key={m.texto}
                to={m.ruta}
                end={m.exacta}
                className={({ isActive }) => claseItem(isActive)}
              >
                <Icono className="w-5 h-5" />
                {m.texto}
              </NavLink>
            )
          }

          const activo = location.pathname.startsWith('/produccion')
          return (
            <div key={m.texto}>
              <button
                onClick={() => setProduccionAbierta((a) => !a)}
                className={`w-full ${claseItem(activo && !produccionAbierta)}`}
              >
                <Icono className="w-5 h-5" />
                <span className="flex-1 text-left">{m.texto}</span>
                {produccionAbierta ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {produccionAbierta && (
                <div className="mt-1 ml-5 pl-4 border-l border-white/15 space-y-1">
                  {m.hijos!.map((h) => (
                    <NavLink
                      key={h.ruta}
                      to={h.ruta}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-sm ${
                          isActive
                            ? 'bg-activo text-white'
                            : 'text-white/75 hover:bg-white/10'
                        }`
                      }
                    >
                      {h.texto}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 p-4 border-t border-white/10 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-semibold">
          {inicial}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.nombre_usuario}</p>
          <p className="text-xs text-white/60">{rol}</p>
        </div>
        <button
          onClick={salir}
          title="Cerrar sesión"
          className="p-2 rounded-lg text-white/70 hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-crema">
      {/* Menú lateral fijo (computador) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-bosque-oscuro z-30">
        {lateral}
      </aside>

      {/* Menú deslizable (celular) */}
      {menuMovil && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <aside className="w-60 bg-bosque-oscuro h-full shadow-xl">{lateral}</aside>
          <div className="flex-1 bg-black/40" onClick={() => setMenuMovil(false)} />
        </div>
      )}

      <div className="lg:pl-60">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur border-b border-black/5 flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setMenuMovil((m) => !m)}
            className="lg:hidden p-2 rounded-lg text-bosque-oscuro hover:bg-black/5"
            aria-label="Abrir menú"
          >
            {menuMovil ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <form onSubmit={buscar} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar animales, registros, productos..."
              className="w-full rounded-lg bg-crema border border-black/5 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bosque/40"
            />
          </form>

          <div className="ml-auto flex items-center gap-3">
            <button className="p-2 rounded-lg text-bosque-oscuro hover:bg-black/5" title="Notificaciones">
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuUsuario((m) => !m)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5"
              >
                <span className="w-8 h-8 rounded-full bg-bosque text-white flex items-center justify-center text-sm font-semibold">
                  {inicial}
                </span>
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-medium text-bosque-oscuro">
                    {user.nombre_usuario}
                  </span>
                  <span className="block text-xs text-gray-500">{rol}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {menuUsuario && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuUsuario(false)} />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-lg py-1 z-40">
                    <button
                      onClick={salir}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-crema"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="[&>div]:min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}