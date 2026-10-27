import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

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

const hoy = () => new Date().toISOString().slice(0, 10)

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600'

export default function Finanzas() {
  const [pestana, setPestana] = useState<Pestana>('gastos')
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Formulario de gasto
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fechaGasto, setFechaGasto] = useState(hoy())

  // Formulario de venta
  const [producto, setProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [comprador, setComprador] = useState('')
  const [fechaVenta, setFechaVenta] = useState(hoy())

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

  const cambiarPestana = (p: Pestana) => {
    setPestana(p)
    setMostrarForm(false)
    setError('')
  }

  const guardarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/gastos', {
        categoria,
        descripcion: descripcion || undefined,
        monto: Number(monto),
        fecha: fechaGasto,
      })
      setCategoria('')
      setDescripcion('')
      setMonto('')
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo registrar el gasto')
    } finally {
      setGuardando(false)
    }
  }

  const guardarVenta = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/ventas', {
        producto,
        cantidad: Number(cantidad),
        precio_unitario: Number(precio),
        comprador: comprador || undefined,
        fecha: fechaVenta,
      })
      setProducto('')
      setCantidad('')
      setPrecio('')
      setComprador('')
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo registrar la venta')
    } finally {
      setGuardando(false)
    }
  }

  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)
  const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0)
  const balance = totalVentas - totalGastos

  const gastosOrdenados = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ventasOrdenadas = [...ventas].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const tab = (activa: boolean) =>
    `px-4 py-2 rounded-lg font-medium ${
      activa ? 'bg-green-700 text-white' : 'bg-white text-green-800 hover:bg-green-100'
    }`

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Finanzas</h1>
          <Link to="/inicio" className="text-green-700 hover:underline">
            ← Inicio
          </Link>
        </div>

        {!cargando && !error && (
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Ventas</p>
              <p className="text-2xl font-bold text-green-800">{pesos(totalVentas)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Gastos</p>
              <p className="text-2xl font-bold text-red-600">{pesos(totalGastos)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-500">Diferencia</p>
              <p
                className={`text-2xl font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-600'}`}
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
          <button
            onClick={() => setMostrarForm((m) => !m)}
            className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
          >
            {mostrarForm ? 'Cancelar' : pestana === 'gastos' ? 'Nuevo gasto' : 'Nueva venta'}
          </button>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {mostrarForm && pestana === 'gastos' && (
          <form
            onSubmit={guardarGasto}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-2"
          >
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
              className="sm:col-span-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar gasto'}
            </button>
          </form>
        )}

        {mostrarForm && pestana === 'ventas' && (
          <form
            onSubmit={guardarVenta}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-2"
          >
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
                <span className="font-bold text-green-800">
                  {pesos(Number(cantidad || 0) * Number(precio || 0))}
                </span>
              </p>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="sm:col-span-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar venta'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {pestana === 'gastos' ? (
            <table className="w-full text-left">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : gastosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Precio unitario</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Comprador</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : ventasOrdenadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
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