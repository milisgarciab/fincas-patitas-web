import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { hoyLocal } from '../fechas'
import { aLista } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Días que faltan para vencer (negativo = ya venció)
const diasPara = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const [hy, hm, hd] = hoyLocal().split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(hy, hm - 1, hd)) / 86400000)
}

export default function LotesInventario() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')

  const [lotes, setLotes] = useState<any[]>([])
  const [insumos, setInsumos] = useState<any[]>([])
  const [insumoFiltro, setInsumoFiltro] = useState('')
  const [soloPorVencer, setSoloPorVencer] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [abierto, setAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState('')
  const [numero, setNumero] = useState('')
  const [vence, setVence] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const cargar = useCallback(async () => {
    const [l, i] = await Promise.allSettled([
      api.get('/lotes-inventario', {
        params: {
          insumo_id: insumoFiltro || undefined,
          vence_en_dias: soloPorVencer ? 30 : undefined,
        },
      }),
      api.get('/bodega'),
    ])
    if (l.status === 'fulfilled') {
      setLotes(aLista(l.value.data))
      setError('')
    } else {
      setError('No se pudieron cargar los lotes de inventario')
    }
    setInsumos(i.status === 'fulfilled' ? aLista(i.value.data) : [])
  }, [insumoFiltro, soloPorVencer])

  useEffect(() => {
    setCargando(true)
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const insumoDe = (l: any) =>
    insumos.find((i) => i.id === l.insumo_id) ?? null

  const abrirForm = (l?: any) => {
    setErrorForm('')
    setEditandoId(l?.id ?? null)
    setInsumoId(l ? String(l.insumo_id) : insumoFiltro)
    setNumero(l?.numero_lote ?? '')
    setVence(l?.fecha_vencimiento ? String(l.fecha_vencimiento).slice(0, 10) : '')
    setCantidad(l ? String(Number(l.cantidad_disponible)) : '')
    setCosto(l ? String(Number(l.costo_unitario)) : '')
    setAbierto(true)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')
    setGuardando(true)
    try {
      if (editandoId) {
        await api.put(`/lotes-inventario/${editandoId}`, {
          numero_lote: numero.trim() || undefined,
          fecha_vencimiento: vence,
          cantidad_disponible: Number(cantidad),
          costo_unitario: Number(costo),
        })
      } else {
        await api.post('/lotes-inventario', {
          insumo_id: Number(insumoId),
          numero_lote: numero.trim() || undefined,
          fecha_vencimiento: vence,
          cantidad_disponible: Number(cantidad),
          costo_unitario: Number(costo),
        })
      }
      setAbierto(false)
      await cargar()
    } catch (err: any) {
      setErrorForm(err.response?.data?.error?.message ?? 'No se pudo guardar el lote')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (l: any) => {
    if (!window.confirm('¿Eliminar este lote de inventario? No se puede deshacer.')) return
    setError('')
    try {
      await api.delete(`/lotes-inventario/${l.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el lote')
    }
  }

  const vencidos = lotes.filter((l) => diasPara(l.fecha_vencimiento) < 0).length
  const porVencer = lotes.filter((l) => {
    const d = diasPara(l.fecha_vencimiento)
    return d >= 0 && d <= 30
  }).length

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marron">Lotes de inventario</h1>
          <p className="text-sm text-gray-500">Fechas de vencimiento y costo de cada compra</p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => abrirForm()}
            className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo lote
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Vencidos</p>
            <p className="text-2xl font-bold text-red-600">{vencidos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Vencen en 30 días</p>
            <p className="text-2xl font-bold text-amber-600">{porVencer}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={insumoFiltro}
          onChange={(e) => setInsumoFiltro(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todos los insumos</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={soloPorVencer}
            onChange={(e) => setSoloPorVencer(e.target.checked)}
          />
          Solo los que vencen en 30 días o menos
        </label>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bosque text-white">
            <tr>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">N.º de lote</th>
              <th className="px-4 py-2">Vencimiento</th>
              <th className="px-4 py-2">Disponible</th>
              <th className="px-4 py-2">Costo unitario</th>
              {(puedeEditar || puedeEliminar) && <th className="px-4 py-2 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : lotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay lotes de inventario
                </td>
              </tr>
            ) : (
              lotes.map((l) => {
                const d = diasPara(l.fecha_vencimiento)
                const ins = insumoDe(l)
                return (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-sm font-medium">
                      {l.bodega?.nombre ?? ins?.nombre ?? `Insumo #${l.insumo_id}`}
                    </td>
                    <td className="px-4 py-2 text-sm">{l.numero_lote ?? '—'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={
                          d < 0
                            ? 'text-red-600 font-semibold'
                            : d <= 30
                              ? 'text-amber-600 font-semibold'
                              : ''
                        }
                      >
                        {fechaDia(l.fecha_vencimiento)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {d < 0 ? `Venció hace ${-d} días` : d === 0 ? 'Vence hoy' : `En ${d} días`}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {Number(l.cantidad_disponible)} {ins?.unidad_medida ?? ''}
                    </td>
                    <td className="px-4 py-2 text-sm">{pesos(Number(l.costo_unitario))}</td>
                    {(puedeEditar || puedeEliminar) && (
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          {puedeEditar && (
                            <button
                              onClick={() => abrirForm(l)}
                              title="Editar"
                              className="p-1.5 rounded-lg hover:bg-black/5 text-bosque"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              onClick={() => eliminar(l)}
                              title="Eliminar"
                              className="p-1.5 rounded-lg hover:bg-black/5 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {abierto && (
        <Modal titulo={editandoId ? 'Editar lote' : 'Nuevo lote de inventario'} onCerrar={() => setAbierto(false)}>
          <form onSubmit={guardar} className="space-y-4">
            {!editandoId && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Insumo</label>
                <select
                  value={insumoId}
                  onChange={(e) => setInsumoId(e.target.value)}
                  required
                  className={campo}
                >
                  <option value="">Selecciona un insumo</option>
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Número de lote (opcional)</label>
              <input value={numero} onChange={(e) => setNumero(e.target.value)} maxLength={50} className={campo} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha de vencimiento</label>
              <input type="date" value={vence} onChange={(e) => setVence(e.target.value)} required className={campo} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cantidad disponible</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className={campo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Costo unitario</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                  className={campo}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Este lote no mueve el stock del insumo: las entradas y salidas se registran en Inventario.
            </p>
            {errorForm && <p className="text-red-600 text-sm">{errorForm}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}