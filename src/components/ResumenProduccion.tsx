import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { hoyLocal } from '../fechas'

interface Dato {
  clave: string
  valor: string
}

const etiqueta = (k: string) => {
  const t = k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const formatear = (v: unknown): string => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  const n = typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v
  if (typeof n === 'number') {
    return Number.isInteger(n)
      ? n.toLocaleString('es-CO')
      : n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
  }
  return String(v)
}

// Convierte el objeto en una lista plana "Leche · Total litros: 12"
function aplanar(obj: any, prefijo = ''): Dato[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return []
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k === 'id') return []
    const nombre = prefijo ? `${prefijo} · ${etiqueta(k)}` : etiqueta(k)
    if (Array.isArray(v)) return []
    if (v !== null && typeof v === 'object') return aplanar(v, nombre)
    return [{ clave: nombre, valor: formatear(v) }]
  })
}

const restarDias = (iso: string, dias: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - dias)).toISOString().slice(0, 10)
}

function Tarjetas({ datos, vacio }: { datos: Dato[] | null; vacio: string }) {
  if (datos === null) return <p className="text-sm text-gray-500">{vacio}</p>
  if (datos.length === 0) return <p className="text-sm text-gray-500">Sin datos para mostrar.</p>
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {datos.map((d) => (
        <div key={d.clave} className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">{d.clave}</p>
          <p className="font-display font-bold text-2xl text-marron">{d.valor}</p>
        </div>
      ))}
    </div>
  )
}

export default function ResumenProduccion() {
  const [hoy, setHoy] = useState<Dato[] | null>(null)
  const [indicadores, setIndicadores] = useState<Dato[] | null>(null)
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargarHoy = useCallback(() => {
    api
      .get('/production/summary/today')
      .then((r) => setHoy(aplanar(r.data?.data ?? r.data)))
      .catch(() => setHoy(null))
  }, [])

  const cargarIndicadores = useCallback((desde: string, hasta: string) => {
    setCargando(true)
    api
      .get('/produccion/indicadores', {
        params: { fecha_inicio: desde || undefined, fecha_fin: hasta || undefined },
      })
      .then((r) => setIndicadores(aplanar(r.data?.data ?? r.data)))
      .catch(() => setIndicadores(null))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargarHoy()
    cargarIndicadores('', '')
  }, [cargarHoy, cargarIndicadores])

  const aplicar = (desde: string, hasta: string) => {
    setInicio(desde)
    setFin(hasta)
    cargarIndicadores(desde, hasta)
  }

  const boton =
    'px-3 py-1.5 rounded-lg text-sm font-semibold border border-bosque text-bosque hover:bg-menta'

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-lg text-marron mb-2">Producción de hoy</h2>
        <Tarjetas datos={hoy} vacio="No se pudo cargar el resumen del día." />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-marron mb-2">Indicadores</h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => aplicar('', '')} className={boton}>
            Todo el histórico
          </button>
          <button onClick={() => aplicar(hoyLocal().slice(0, 8) + '01', hoyLocal())} className={boton}>
            Este mes
          </button>
          <button onClick={() => aplicar(restarDias(hoyLocal(), 30), hoyLocal())} className={boton}>
            Últimos 30 días
          </button>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 bg-white text-sm"
          />
          <span className="text-gray-500 text-sm">a</span>
          <input
            type="date"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 bg-white text-sm"
          />
          <button onClick={() => aplicar(inicio, fin)} className={boton}>
            Aplicar
          </button>
        </div>
        {cargando ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <Tarjetas datos={indicadores} vacio="No se pudieron cargar los indicadores." />
        )}
      </div>
    </section>
  )
}