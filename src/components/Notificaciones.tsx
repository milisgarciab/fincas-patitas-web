import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarClock, HeartPulse, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api } from '../api'
import { hoyLocal } from '../fechas'

interface Aviso {
  id: string
  titulo: string
  detalle: string
  ruta: string
  icono: LucideIcon
}

const DIAS_AVISO = 30
const MAX_POR_TIPO = 5
const CADA_MS = 5 * 60 * 1000

const lista = (r: PromiseSettledResult<{ data: any }>): any[] =>
  r.status === 'fulfilled'
    ? Array.isArray(r.value.data)
      ? r.value.data
      : (r.value.data?.data ?? [])
    : []

// Milisegundos de un día YYYY-MM-DD, para comparar días sin lío de horas
const aMs = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`

function calcular(insumos: any[], gestaciones: any[], eventos: any[]): Aviso[] {
  const avisos: Aviso[] = []
  const hoy = aMs(hoyLocal())

  // Stock bajo
  const bajos = insumos.filter((i) => i.stock_bajo)
  bajos.slice(0, MAX_POR_TIPO).forEach((i) =>
    avisos.push({
      id: `stock-${i.id}`,
      titulo: `Stock bajo: ${i.nombre}`,
      detalle: `Quedan ${Number(i.stock_actual)} ${i.unidad_medida} (mínimo ${Number(i.stock_minimo)})`,
      ruta: '/bodega',
      icono: Package,
    }),
  )
  if (bajos.length > MAX_POR_TIPO) {
    avisos.push({
      id: 'stock-mas',
      titulo: `y ${bajos.length - MAX_POR_TIPO} insumos más con stock bajo`,
      detalle: 'Revisa el inventario',
      ruta: '/bodega',
      icono: Package,
    })
  }

  // Partos próximos o vencidos
  const partos = gestaciones
    .filter((g) => !g.eliminado_en && g.estado === 'Gestante' && g.fecha_estimada_parto)
    .map((g) => ({ g, dias: Math.round((aMs(g.fecha_estimada_parto) - hoy) / 86400000) }))
    .filter((x) => x.dias <= DIAS_AVISO)
    .sort((a, b) => a.dias - b.dias)
  partos.slice(0, MAX_POR_TIPO).forEach(({ g, dias }) =>
    avisos.push({
      id: `parto-${g.id}`,
      titulo: `Parto próximo: ${g.animales?.nombre ?? `animal #${g.animal_id}`}`,
      detalle:
        dias < 0
          ? `Pasó la fecha estimada hace ${plural(-dias, 'día')}`
          : dias === 0
            ? 'Se espera para hoy'
            : `Se espera en ${plural(dias, 'día')}`,
      ruta: '/reproduccion',
      icono: CalendarClock,
    }),
  )

  // Gestaciones por confirmar
  gestaciones
    .filter((g) => !g.eliminado_en && g.estado === 'Pendiente')
    .slice(0, MAX_POR_TIPO)
    .forEach((g) =>
      avisos.push({
        id: `pendiente-${g.id}`,
        titulo: `Gestación por confirmar: ${g.animales?.nombre ?? `animal #${g.animal_id}`}`,
        detalle: 'Pendiente de confirmación',
        ruta: '/reproduccion',
        icono: CalendarClock,
      }),
    )

  // Casos de salud abiertos
  eventos
    .filter((e) => e.estado === 'Abierto')
    .slice(0, MAX_POR_TIPO)
    .forEach((e) =>
      avisos.push({
        id: `salud-${e.id}`,
        titulo: `Caso abierto: ${e.tipo_evento}`,
        detalle: e.animales?.nombre ?? `Animal #${e.animal_id}`,
        ruta: '/salud',
        icono: HeartPulse,
      }),
    )

  return avisos
}

export default function Notificaciones() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [abierto, setAbierto] = useState(false)

  const cargar = useCallback(async () => {
    const [b, r, s] = await Promise.allSettled([
      api.get('/bodega'),
      api.get('/reproduccion'),
      api.get('/eventos-sanitarios'),
    ])
    setAvisos(calcular(lista(b), lista(r), lista(s)))
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, CADA_MS)
    return () => clearInterval(t)
  }, [cargar])

  const alternar = () => {
    if (!abierto) cargar()
    setAbierto((a) => !a)
  }

  return (
    <div className="relative">
      <button
        onClick={alternar}
        className="relative p-2 rounded-lg text-marron hover:bg-black/5"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {avisos.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {avisos.length > 9 ? '9+' : avisos.length}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-display font-bold text-marron">Notificaciones</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {avisos.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center text-gray-500">
                  Todo en orden, no hay avisos.
                </p>
              ) : (
                avisos.map((a) => {
                  const Icono = a.icono
                  return (
                    <Link
                      key={a.id}
                      to={a.ruta}
                      onClick={() => setAbierto(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-crema border-b border-gray-100 last:border-0"
                    >
                      <span className="mt-0.5 w-8 h-8 rounded-full bg-menta flex items-center justify-center shrink-0">
                        <Icono className="w-4 h-4 text-bosque" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-marron">{a.titulo}</span>
                        <span className="block text-xs text-gray-500">{a.detalle}</span>
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}