import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { puede } from '../permisos'
import { hoyLocal } from '../fechas'

interface Gasto {
  id: number
  categoria: string
  descripcion: string | null
  monto: string
  fecha: string
}

interface Venta {
  id: number
  producto: string
  cantidad: string
  precio_unitario: string
  total: string
  comprador: string | null
  fecha: string
}

type Pestana = 'gastos' | 'ventas'

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Fecha en UTC para que no se corra un día
const fecha = (f: string) => new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' })

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function Finanzas() {
  const puedeEditar = puede('finanzas.editar')

  const [pestana, setPestana] = useState<Pestana>('gastos')
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  // Formulario de gasto
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fechaGasto, setFechaGasto] = useState(hoyLocal())

  // Formulario de venta
  const [producto, setProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [comprador, setComprador] = useState('')
  const [fechaVenta, setFechaVenta] = useState(hoyLocal())

  const cargar = async () => {
    setError('')
    try {
      const [g, v] = await Promise.all([api.get('/gastos'), api.get('/ventas')])
      setGastos(Array.isArray(g.data) ? g.data : g.data.data)
      setVentas(Array.isArray(v.data) ? v.data : v.data.data)
    } catch {
      setError('No se pudieron cargar las finanzas')
    }
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const limpiarForm = () => {
    setCategoria('')
    setDescripcion('')
    setMonto('')
    setFechaGasto(hoyLocal())
    setProducto('')
    setCantidad('')
    setPrecio('')
    setComprador('')
    setFechaVenta(hoyLocal())
    setEditandoId(null)
  }

  const cerrarForm = () => {
    limpiarForm()
    setMostrarForm(false)
  }

  const alternarForm = () => {
    if (mostrarForm) cerrarForm()
    else {
      limpiarForm()
      setMostrarForm(true)
    }
  }

  const cambiarPestana = (p: Pestana) => {
    setPestana(p)
    cerrarForm()
    setError('')
  }

  // ---------- Gastos ----------
  const editarGasto = (g: Gasto) => {
    setCategoria(g.categoria)
    setDescripcion(g.descripcion ?? '')
    setMonto(String(Number(g.monto)))
    setFechaGasto(g.fecha.slice(0, 10))
    setEditandoId(g.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    const body = {
      categoria: categoria.trim(),
      descripcion: descripcion || undefined,
      monto: Number(monto),
      fecha: fechaGasto,
    }
    try {
      if (editandoId) await api.put(`/gastos/${editandoId}`, body)
      else await api.post('/gastos', body)
      cerrarForm()
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar el gasto')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarGasto = async (g: Gasto) => {
    if (!window.confirm(`¿Eliminar el gasto de ${pesos(Number(g.monto))} (${g.categoria})?`)) return
    setError('')
    try {
      await api.delete(`/gastos/${g.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el gasto')
    }
  }

  // ---------- Ventas ----------
  const editarVenta = (v: Venta) => {
    setProducto(v.producto)
    setCantidad(String(Number(v.cantidad)))
    setPrecio(String(Number(v.precio_unitario)))
    setComprador(v.comprador ?? '')
    setFechaVenta(v.fecha.slice(0, 10))
    setEditandoId(v.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardarVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    const body = {
      producto: producto.trim(),
      cantidad: Number(cantidad),
      precio_unitario: Number(precio),
      comprador: comprador || undefined,
      fecha: fechaVenta,
    }
    try {
      if (editandoId) await api.put(`/ventas/${editandoId}`, body)
      else await api.post('/ventas', body)
      cerrarForm()
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar la venta')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarVenta = async (v: Venta) => {
    if (!window.confirm(`¿Eliminar la venta de ${v.producto} por ${pesos(Number(v.total))}?`)) return
    setError('')
    try {
      await api.delete(`/ventas/${v.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar la venta')
    }
  }

  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)
  const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0)
  const balance = totalVentas - totalGastos

  const gastosOrdenados = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ventasOrdenadas = [...ventas].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const tab = (activa: boolean) =>
    `px-4 py-2 rounded-lg font-semibold ${
      activa ? 'bg-bosque text-white' : 'bg-white text-bosque-oscuro hover:bg-menta'
    }`

  const botonIcono = 'p-1.5 rounded-lg hover:bg-black/5'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-bosque-oscuro mb-4">Finanzas</h1>

        {!puedeEditar && (
          <p className="text-sm text-gray-600 bg-white rounded-xl shadow-sm px-4 py-3 mb-4">
            Tu rol solo permite consultar esta información.
          </p>
        )}

        {!cargando && !error && (
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Ventas</p>
              <p className="text-2xl font-bold text-bosque-oscuro">{pesos(totalVentas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Gastos</p>
              <p className="text-2xl font-bold text-red-600">{pesos(totalGastos)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Diferencia</p>
              <p
                className={`text-2xl font-bold ${balance >= 0 ? 'text-bosque-oscuro' : 'text-red-600'}`}
              >
                {pesos(balance)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => cambiarPestana('gastos')} className={tab(pestana === 'gastos')}>
              Gastos
            </button>
            <button onClick={() => cambiarPestana('ventas')} className={tab(pestana === 'ventas')}>
              Ventas
            </button>
          </div>
          {puedeEditar && (
            <button
              onClick={alternarForm}
              className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
            >
              {mostrarForm ? 'Cancelar' : pestana === 'gastos' ? 'Nuevo gasto' : 'Nueva venta'}
            </button>
          )}
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {puedeEditar && mostrarForm && pestana === 'gastos' && (
          <form
            onSubmit={guardarGasto}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-2"
          >
            <h2 className="sm:col-span-2 font-bold text-bosque-oscuro">
              {editandoId ? 'Editar gasto' : 'Nuevo gasto'}
            </h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Categoría</label>
              <input
                list="categorias-gasto"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className={campo}
              />
              <datalist id="categorias-gasto">
                <option value="Alimentación" />
                <option value="Medicamentos" />
                <option value="Mantenimiento" />
                <option value="Mano de obra" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monto (COP)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={fechaGasto}
                onChange={(e) => setFechaGasto(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={campo}
              />
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="sm:col-span-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar gasto'}
            </button>
          </form>
        )}

        {puedeEditar && mostrarForm && pestana === 'ventas' && (
          <form
            onSubmit={guardarVenta}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-2"
          >
            <h2 className="sm:col-span-2 font-bold text-bosque-oscuro">
              {editandoId ? 'Editar venta' : 'Nueva venta'}
            </h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Producto</label>
              <input
                list="productos-venta"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                required
                className={campo}
              />
              <datalist id="productos-venta">
                <option value="Leche" />
                <option value="Huevos" />
                <option value="Cerdo" />
                <option value="Bovino" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Comprador (opcional)</label>
              <input
                value={comprador}
                onChange={(e) => setComprador(e.target.value)}
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cantidad</label>
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
              <label className="block text-sm text-gray-600 mb-1">Precio unitario (COP)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={fechaVenta}
                onChange={(e) => setFechaVenta(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-gray-600">
                Total estimado:{' '}
                <span className="font-bold text-bosque-oscuro">
                  {pesos(Number(cantidad || 0) * Number(precio || 0))}
                </span>
              </p>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="sm:col-span-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar venta'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {pestana === 'gastos' ? (
            <table className="w-full text-left">
              <thead className="bg-bosque text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2">Monto</th>
                  {puedeEditar && <th className="px-4 py-2 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : gastosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay gastos registrados
                    </td>
                  </tr>
                ) : (
                  gastosOrdenados.map((g) => (
                    <tr key={g.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm">{fecha(g.fecha)}</td>
                      <td className="px-4 py-2">{g.categoria}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{g.descripcion ?? '—'}</td>
                      <td className="px-4 py-2 font-medium">{pesos(Number(g.monto))}</td>
                      {puedeEditar && (
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => editarGasto(g)}
                              title="Editar"
                              className={`${botonIcono} text-bosque`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarGasto(g)}
                              title="Eliminar"
                              className={`${botonIcono} text-red-600`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-bosque text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Precio unitario</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Comprador</th>
                  {puedeEditar && <th className="px-4 py-2 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : ventasOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No hay ventas registradas
                    </td>
                  </tr>
                ) : (
                  ventasOrdenadas.map((v) => (
                    <tr key={v.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm">{fecha(v.fecha)}</td>
                      <td className="px-4 py-2">{v.producto}</td>
                      <td className="px-4 py-2">{Number(v.cantidad)}</td>
                      <td className="px-4 py-2">{pesos(Number(v.precio_unitario))}</td>
                      <td className="px-4 py-2 font-medium">{pesos(Number(v.total))}</td>
                      <td className="px-4 py-2 text-sm">{v.comprador ?? '—'}</td>
                      {puedeEditar && (
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => editarVenta(v)}
                              title="Editar"
                              className={`${botonIcono} text-bosque`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarVenta(v)}
                              title="Eliminar"
                              className={`${botonIcono} text-red-600`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}