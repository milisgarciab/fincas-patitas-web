import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightLeft, History, Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { hoyLocal } from '../fechas'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface Insumo {
  id: number
  nombre: string
  descripcion: string | null
  unidad_medida: string
  stock_actual: string
  stock_minimo: string
  stock_bajo: boolean
  categorias_bodega: { id: number; nombre: string }
}

interface Categoria {
  id: number
  nombre: string
}

interface Movimiento {
  id: number
  tipo: string
  cantidad: string
  motivo: string | null
  fecha: string
}

// Unidades que ya usa tu inventario
const UNIDADES = ['Unidad', 'Bulto', 'Kg', 'Ltr', 'ml', 'Dosis', 'Arroba']

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Bodega() {
  const puedeEditar = puede('registros.editar')
  const puedeEliminar = puede('registros.eliminar')
  const puedeEntrada = puede('stock.entrada')

  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [soloBajo, setSoloBajo] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Edición
  const [editando, setEditando] = useState<Insumo | null>(null)
  const [nombre, setNombre] = useState('')
  const [categoriaEdit, setCategoriaEdit] = useState('')
  const [unidad, setUnidad] = useState('Unidad')
  const [guardando, setGuardando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

  // Movimiento de stock
  const [moviendo, setMoviendo] = useState<Insumo | null>(null)
  const [tipoMov, setTipoMov] = useState<'Entrada' | 'Salida'>('Salida')
  const [cantidadMov, setCantidadMov] = useState('')
  const [motivoMov, setMotivoMov] = useState('Consumo')
  const [fechaMov, setFechaMov] = useState(hoyLocal())
  const [errorMov, setErrorMov] = useState('')

  // Historial
  const [historial, setHistorial] = useState<Insumo | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null)

  const cargar = () =>
    Promise.all([api.get('/bodega'), api.get('/categorias-bodega')])
      .then(([ins, cat]) => {
        setInsumos(ins.data)
        setCategorias(cat.data)
      })
      .catch(() => setError('No se pudo cargar el inventario'))

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const filtrados = insumos
    .filter((i) => i.nombre.toLowerCase().includes(texto.toLowerCase()))
    .filter((i) => !categoriaId || i.categorias_bodega.id === Number(categoriaId))
    .filter((i) => !soloBajo || i.stock_bajo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const totalBajo = insumos.filter((i) => i.stock_bajo).length

  // ---------- Editar ----------
  const abrirEdicion = (i: Insumo) => {
    setNombre(i.nombre)
    setCategoriaEdit(String(i.categorias_bodega.id))
    setUnidad(i.unidad_medida)
    setErrorEdicion('')
    setEditando(i)
  }

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando) return
    setErrorEdicion('')
    setGuardando(true)
    try {
      await api.put(`/bodega/${editando.id}`, {
        categoria_id: Number(categoriaEdit),
        nombre: nombre.trim(),
        unidad_medida: unidad,
      })
      setEditando(null)
      await cargar()
    } catch (err: any) {
      setErrorEdicion(err.response?.data?.error?.message ?? 'No se pudo guardar el cambio')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (i: Insumo) => {
    if (
      !window.confirm(
        `¿Eliminar el insumo "${i.nombre}"? También se borran sus lotes y no se puede deshacer.`,
      )
    )
      return
    setError('')
    try {
      await api.delete(`/bodega/${i.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el insumo')
    }
  }

  // ---------- Movimiento de stock ----------
  const MOTIVOS: Record<'Entrada' | 'Salida', string[]> = {
    Entrada: ['Compra'],
    Salida: ['Consumo', 'Merma'],
  }

  const abrirMovimiento = (i: Insumo) => {
    setTipoMov('Salida')
    setMotivoMov('Consumo')
    setCantidadMov('')
    setFechaMov(hoyLocal())
    setErrorMov('')
    setMoviendo(i)
  }

  const cambiarTipo = (t: 'Entrada' | 'Salida') => {
    setTipoMov(t)
    setMotivoMov(MOTIVOS[t][0])
  }

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moviendo) return
    setErrorMov('')
    setGuardando(true)
    try {
      await api.post(`/bodega/${moviendo.id}/movimientos`, {
        tipo: tipoMov,
        cantidad: Number(cantidadMov),
        motivo: motivoMov,
        fecha: fechaMov,
      })
      setMoviendo(null)
      await cargar()
    } catch (err: any) {
      setErrorMov(err.response?.data?.error?.message ?? 'No se pudo registrar el movimiento')
    } finally {
      setGuardando(false)
    }
  }

  // ---------- Historial ----------
  const abrirHistorial = (i: Insumo) => {
    setHistorial(i)
    setMovimientos(null)
    api
      .get('/movimientos-inventario', { params: { insumo_id: i.id } })
      .then((r) => setMovimientos(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setMovimientos([]))
  }

  const botonIcono = 'p-1.5 rounded-lg hover:bg-black/5'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-bosque-oscuro">Inventario</h1>
          {puede('insumos.crear') && (
            <Link
              to="/bodega/nuevo"
              className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
            >
              Nuevo insumo
            </Link>
          )}
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {!cargando && !error && (
          <div className="flex gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Insumos</p>
              <p className="text-2xl font-bold text-bosque-oscuro">{insumos.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Con stock bajo</p>
              <p className="text-2xl font-bold text-red-600">{totalBajo}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
          />
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={soloBajo}
              onChange={(e) => setSoloBajo(e.target.checked)}
            />
            Solo stock bajo
          </label>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bosque text-white">
              <tr>
                <th className="px-4 py-2">Insumo</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Unidad</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Mínimo</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No hay insumos para mostrar
                  </td>
                </tr>
              ) : (
                filtrados.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <p className="font-medium">{i.nombre}</p>
                      {i.descripcion && <p className="text-xs text-gray-500">{i.descripcion}</p>}
                    </td>
                    <td className="px-4 py-2">{i.categorias_bodega?.nombre}</td>
                    <td className="px-4 py-2">{i.unidad_medida}</td>
                    <td className="px-4 py-2 font-medium">{Number(i.stock_actual)}</td>
                    <td className="px-4 py-2">{Number(i.stock_minimo)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm ${
                          i.stock_bajo ? 'bg-red-100 text-red-700' : 'bg-menta text-bosque-oscuro'
                        }`}
                      >
                        {i.stock_bajo ? 'Stock bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirMovimiento(i)}
                          title="Registrar entrada o salida"
                          className={`${botonIcono} text-bosque`}
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirHistorial(i)}
                          title="Historial de movimientos"
                          className={`${botonIcono} text-gray-600`}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {puedeEditar && (
                          <button
                            onClick={() => abrirEdicion(i)}
                            title="Editar"
                            className={`${botonIcono} text-bosque`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {puedeEliminar && (
                          <button
                            onClick={() => eliminar(i)}
                            title="Eliminar"
                            className={`${botonIcono} text-red-600`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <Modal titulo="Editar insumo" onCerrar={() => setEditando(null)}>
          <form onSubmit={guardarEdicion} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Categoría</label>
              <select
                value={categoriaEdit}
                onChange={(e) => setCategoriaEdit(e.target.value)}
                required
                className={campo}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Unidad de medida</label>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={campo}>
                {[...new Set([...UNIDADES, editando.unidad_medida])].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500">
              El stock no se edita aquí: cambia con las entradas y salidas de stock.
            </p>

            {errorEdicion && <p className="text-red-600 text-sm">{errorEdicion}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {moviendo && (
        <Modal titulo={`Movimiento de stock: ${moviendo.nombre}`} onCerrar={() => setMoviendo(null)}>
          <form onSubmit={guardarMovimiento} className="space-y-4">
            <p className="text-sm text-gray-500">
              Stock actual: {Number(moviendo.stock_actual)} {moviendo.unidad_medida}
            </p>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <select
                value={tipoMov}
                onChange={(e) => cambiarTipo(e.target.value as 'Entrada' | 'Salida')}
                className={campo}
              >
                {puedeEntrada && <option value="Entrada">Entrada (compra)</option>}
                <option value="Salida">Salida (consumo o merma)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Motivo</label>
              <select
                value={motivoMov}
                onChange={(e) => setMotivoMov(e.target.value)}
                className={campo}
              >
                {MOTIVOS[tipoMov].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Cantidad ({moviendo.unidad_medida})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cantidadMov}
                onChange={(e) => setCantidadMov(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={fechaMov}
                onChange={(e) => setFechaMov(e.target.value)}
                required
                className={campo}
              />
            </div>

            {errorMov && <p className="text-red-600 text-sm">{errorMov}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMoviendo(null)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {historial && (
        <Modal titulo={`Historial: ${historial.nombre}`} onCerrar={() => setHistorial(null)}>
          {movimientos === null ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : movimientos.length === 0 ? (
            <p className="text-sm text-gray-500">Este insumo todavía no tiene movimientos.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-1 pr-3">Fecha</th>
                  <th className="py-1 pr-3">Tipo</th>
                  <th className="py-1 pr-3">Cantidad</th>
                  <th className="py-1">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {[...movimientos]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .map((m) => (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className="py-1 pr-3">
                        {new Date(m.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-1 pr-3">{m.tipo}</td>
                      <td className="py-1 pr-3">{Number(m.cantidad)}</td>
                      <td className="py-1">{m.motivo ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  )
}