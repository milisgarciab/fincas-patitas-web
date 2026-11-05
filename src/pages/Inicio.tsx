import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Milk,
  Package,
  PawPrint,
  Syringe,
  TriangleAlert,
} from 'lucide-react'
import { api } from '../api'

interface Animal {
  especies: { nombre: string } | null
}

interface Insumo {
  id: number
  nombre: string
  unidad_medida: string
  stock_actual: string
  stock_minimo: string
  stock_bajo: boolean
}

// Si no existe public/inicio.jpg, se ve el paisaje en degradado
const FONDO_HERO = [
  'linear-gradient(90deg, var(--color-crema) 0%, color-mix(in srgb, var(--color-crema) 93%, transparent) 38%, transparent 68%)',
  "url('/inicio.jpg')",
  'linear-gradient(180deg, #CFE8F7 0%, #E8F3D8 55%, #A9CF7B 100%)',
].join(', ')

const ROSA = 'bg-pink-100 dark:bg-pink-900/30'
const AMARILLO = 'bg-amber-100 dark:bg-amber-900/30'

function Foto({ src, emoji }: { src: string; emoji: string }) {
  const [falla, setFalla] = useState(false)
  return falla ? (
    <div className="h-28 flex items-center justify-center text-6xl bg-white/60 dark:bg-white/10">
      {emoji}
    </div>
  ) : (
    <img src={src} alt="" onError={() => setFalla(true)} className="w-full h-28 object-cover" />
  )
}

function Estadistica(props: {
  emoji: string
  valor: string | number
  texto: string
  fondo: string
  ruta: string
}) {
  return (
    <Link
      to={props.ruta}
      className={`rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition ${props.fondo}`}
    >
      <span className="w-14 h-14 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center text-3xl">
        {props.emoji}
      </span>
      <div>
        <p className="font-display font-bold text-4xl leading-9 text-marron">{props.valor}</p>
        <p className="text-sm font-semibold text-marron/75">{props.texto}</p>
      </div>
    </Link>
  )
}

export default function Inicio() {
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')
  const [animales, setAnimales] = useState<Animal[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])

  useEffect(() => {
    api
      .get('/animales', { params: { pagina: 1, limite: 100 } })
      .then((r) => setAnimales(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => {})
    api
      .get('/bodega')
      .then((r) => setInsumos(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => {})
  }, [])

  const contar = (especie: string) =>
    animales.filter((a) => a.especies?.nombre === especie).length

  const bovinos = contar('Bovino')
  const cerdos = contar('Cerdo')
  const gallinas = contar('Gallina')

  const bajos = insumos.filter((i) => i.stock_bajo)
  const disponible = insumos.length
    ? Math.round(((insumos.length - bajos.length) / insumos.length) * 100)
    : 0

  // Los 3 insumos más justos respecto a su mínimo; la barra es el stock frente a 3 veces el mínimo
  const razon = (i: Insumo) => Number(i.stock_actual) / (Number(i.stock_minimo) || 1)
  const resumen = [...insumos].sort((a, b) => razon(a) - razon(b)).slice(0, 3)
  const relleno = (i: Insumo) =>
    Math.min(100, (Number(i.stock_actual) / ((Number(i.stock_minimo) || 1) * 3)) * 100)

  const accesos = [
    { icono: PawPrint, texto: 'Registrar animal', ruta: '/animales/nuevo' },
    { icono: Package, texto: 'Actualizar inventario', ruta: '/bodega' },
    { icono: Syringe, texto: 'Registrar tratamiento', ruta: '/salud/nuevo' },
    { icono: Milk, texto: 'Ver producción', ruta: '/produccion' },
  ]

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Bienvenida */}
      <section
        className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center p-6 sm:p-10 shadow-sm"
        style={{
          backgroundImage: FONDO_HERO,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        {/* En modo oscuro se oscurece la foto del paisaje */}
        <div className="pointer-events-none absolute inset-0 hidden dark:block bg-black/30" />

        <div className="relative max-w-md">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight text-marron">
            ¡Hola, {user.nombre_usuario ?? 'bienvenida'}!
          </h1>
          <p className="mt-3 text-gray-700 text-lg">
            Tu sistema de gestión agropecuaria, para una finca más productiva y feliz.
          </p>
          <Link
            to="/animales"
            className="mt-5 inline-flex items-center gap-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-full px-6 py-3"
          >
            Ver mis animales
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estadistica emoji="🐄" valor={bovinos} texto="Total de bovinos" fondo="bg-menta" ruta="/animales" />
        <Estadistica emoji="🐖" valor={cerdos} texto="Total de cerdos" fondo={ROSA} ruta="/animales" />
        <Estadistica emoji="🐔" valor={gallinas} texto="Total de gallinas" fondo={AMARILLO} ruta="/animales" />
        <Estadistica
          emoji="📦"
          valor={`${disponible}%`}
          texto="Inventario con stock suficiente"
          fondo="bg-menta"
          ruta="/bodega"
        />
      </section>

      {/* Tarjetas */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-marron flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-bosque" />
              Nuestros animales
            </h2>
            <Link to="/animales" className="text-sm text-bosque font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { src: '/vaca.jpg', emoji: '🐄', nombre: 'Bovinos', n: bovinos, fondo: 'bg-menta' },
              { src: '/cerdo.jpg', emoji: '🐖', nombre: 'Cerdos', n: cerdos, fondo: ROSA },
              { src: '/gallina.jpg', emoji: '🐔', nombre: 'Gallinas', n: gallinas, fondo: AMARILLO },
            ].map((a) => (
              <Link
                key={a.nombre}
                to="/animales"
                className={`rounded-xl overflow-hidden text-center ${a.fondo}`}
              >
                <Foto src={a.src} emoji={a.emoji} />
                <p className="font-display font-bold text-marron pt-2">{a.nombre}</p>
                <p className="text-xs text-marron/70 pb-2">{a.n} registrados</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-marron flex items-center gap-2">
              <Package className="w-5 h-5 text-bosque" />
              Inventario
            </h2>
            <Link to="/bodega" className="text-sm text-bosque font-semibold hover:underline">
              Ver inventario →
            </Link>
          </div>

          <div className="space-y-4">
            {resumen.length === 0 && (
              <p className="text-sm text-gray-500">No hay insumos para mostrar.</p>
            )}
            {resumen.map((i) => (
              <div key={i.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-marron font-semibold truncate pr-2">{i.nombre}</span>
                  <span className="text-marron/80 shrink-0">
                    {Number(i.stock_actual)} {i.unidad_medida}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i.stock_bajo ? 'bg-amber-500' : 'bg-bosque'}`}
                    style={{ width: `${relleno(i)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className={`mt-5 rounded-xl px-4 py-3 flex items-center gap-3 text-sm ${
              bajos.length
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                : 'bg-menta text-bosque-oscuro'
            }`}
          >
            <TriangleAlert className="w-5 h-5 shrink-0" />
            <p className="flex-1">
              {bajos.length
                ? `Stock bajo: ${bajos
                    .slice(0, 2)
                    .map((b) => b.nombre)
                    .join(', ')}${bajos.length > 2 ? ` y ${bajos.length - 2} más` : ''}`
                : 'Todo el inventario está en orden'}
            </p>
            {bajos.length > 0 && (
              <Link to="/bodega" className="font-semibold underline shrink-0">
                Ver detalle
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-display font-bold text-xl text-marron mb-4">⚡ Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            {accesos.map(({ icono: Icono, texto, ruta }) => (
              <Link
                key={ruta}
                to={ruta}
                className="rounded-xl bg-crema hover:bg-menta transition p-4 flex flex-col items-center text-center gap-2"
              >
                <Icono className="w-7 h-7 text-bosque" />
                <span className="text-sm font-semibold text-marron">{texto}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <p
        className="text-center text-3xl text-marron/80 pt-2"
        style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }}
      >
        Juntos por el bienestar de tus animales ♡
      </p>
    </div>
  )
}