import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { obtenerLista } from '../produccionApi'
import { fechaLocal, hoyLocal } from '../fechas'

interface Leche {
  litros: string
  registrado_en: string
  eliminado_en: string | null
}

interface Huevos {
  cantidad: number
  cantidad_rotos: number
  registrado_en: string
  eliminado_en: string | null
}

const RUTAS_LECHE = ['/produccion-leche']
const RUTAS_HUEVOS = ['/produccion-huevos', '/produccion/huevos']

interface Dato {
  etiqueta: string
  valor: string
}

function Tarjeta(props: {
  emoji: string
  titulo: string
  texto: string
  datos: Dato[]
  ruta: string
  fondo: string
}) {
  return (
    <Link
      to={props.ruta}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition p-6 flex flex-col"
    >
      <div className="flex items-center gap-4">
        <span
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${props.fondo}`}
        >
          {props.emoji}
        </span>
        <div>
          <h2 className="font-display font-bold text-2xl text-marron">{props.titulo}</h2>
          <p className="text-sm text-gray-500">{props.texto}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        {props.datos.map((d) => (
          <div key={d.etiqueta} className="rounded-xl bg-crema px-3 py-2">
            <p className="text-xs text-gray-500">{d.etiqueta}</p>
            <p className="font-display font-bold text-xl text-marron">{d.valor}</p>
          </div>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center gap-2 font-semibold text-bosque group-hover:gap-3 transition-all">
        Entrar
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  )
}

export default function Produccion() {
  const [leche, setLeche] = useState<Leche[] | null>(null)
  const [huevos, setHuevos] = useState<Huevos[] | null>(null)

  useEffect(() => {
    obtenerLista<Leche>(RUTAS_LECHE)
      .then((l) => setLeche(l.filter((x) => !x.eliminado_en)))
      .catch(() => setLeche([]))
    obtenerLista<Huevos>(RUTAS_HUEVOS)
      .then((l) => setHuevos(l.filter((x) => !x.eliminado_en)))
      .catch(() => setHuevos([]))
  }, [])

  const hoy = hoyLocal()
  const raya = '—'

  const litrosTotal = leche?.reduce((s, r) => s + Number(r.litros), 0)
  const litrosHoy = leche
    ?.filter((r) => fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + Number(r.litros), 0)

  const huevosTotal = huevos?.reduce((s, r) => s + r.cantidad, 0)
  const rotos = huevos?.reduce((s, r) => s + r.cantidad_rotos, 0)
  const huevosHoy = huevos
    ?.filter((r) => fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + r.cantidad, 0)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-marron">Producción</h1>
      <p className="text-gray-500 mt-1 mb-6">Elige qué producción quieres revisar o registrar.</p>

      <div className="grid gap-5 md:grid-cols-2">
        <Tarjeta
          emoji="🥛"
          titulo="Leche"
          texto="Ordeños por animal o por lote"
          ruta="/produccion/leche"
          fondo="bg-menta"
          datos={[
            { etiqueta: 'Total', valor: litrosTotal === undefined ? raya : `${litrosTotal} L` },
            { etiqueta: 'Hoy', valor: litrosHoy === undefined ? raya : `${litrosHoy} L` },
            { etiqueta: 'Registros', valor: leche ? String(leche.length) : raya },
          ]}
        />
        <Tarjeta
          emoji="🥚"
          titulo="Huevos"
          texto="Recolección y huevos rotos"
          ruta="/produccion/huevos"
          fondo="bg-amber-100 dark:bg-amber-900/30"
          datos={[
            { etiqueta: 'Total', valor: huevosTotal === undefined ? raya : String(huevosTotal) },
            { etiqueta: 'Hoy', valor: huevosHoy === undefined ? raya : String(huevosHoy) },
            { etiqueta: 'Rotos', valor: rotos === undefined ? raya : String(rotos) },
          ]}
        />
      </div>
    </div>
  )
}