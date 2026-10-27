import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

interface Precio {
  id: number
  producto: string
  precio: string
  fecha: string
}

interface Balance {
  id: number
  periodo: string
  total_ventas: string
  total_gastos: string
  balance_neto: string
  creado_en: string
}

type Pestana = 'precios' | 'balance'

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Fecha en UTC para que no se corra un día
const fecha = (f: string) => new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' })

const hoy = () => new Date().toISOString().slice(0, 10)

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600'

export default function MercadoBalance() {
  const [pestana, setPestana] = useState<Pestana>('precios')
  const [precios, setPrecios] = useState<Precio[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Formulario de precio
  const [producto, setProducto] = useState('')
  const [precio, setPrecio] = useState('')
  const [fechaPrecio, setFechaPrecio] = useState(hoy())

  // Formulario de balance
  const [fechaInicio, setFechaInicio] = useState(hoy())
  const [fechaFin, setFechaFin] = useState(hoy())

  const cargar = async () => {
    setError('')
    try {
      const [p, b] = await Promise.all([api.get('/precios-mercado'), api.get('/balance')])
      setPrecios(Array.isArray(p.data) ? p.data : p.data.data)
      setBalances(Array.isArray(b.data) ? b.data : b.data.data)
    } catch {
      setError('No se pudieron cargar los datos')
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

  const guardarPrecio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await api.post('/precios-mercado', {
        producto,
        precio: Number(precio),
        fecha: fechaPrecio,
      })
      setProducto('')
      setPrecio('')
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo registrar el precio')
    } finally {
      setGuardando(false)
    }
  }

  const generarBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (fechaFin < fechaInicio) {
      setError('La fecha final no puede ser anterior a la inicial')
      return
    }
    setGuardando(true)
    try {
      await api.post('/balance/generar', {
        periodo: fechaInicio,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      })
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo generar el balance')
    } finally {
      setGuardando(false)
    }
  }

  const preciosOrdenados = [...precios].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const balancesOrdenados = [...balances].sort((a, b) => b.periodo.localeCompare(a.periodo))

  const tab = (activa: boolean) =>
    `px-4 py-2 rounded-lg font-medium ${
      activa ? 'bg-green-700 text-white' : 'bg-white text-green-800 hover:bg-green-100'
    }`

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-800">Precios y balance</h1>
          <div className="flex items-center gap-4">
            <Link to="/finanzas" className="text-green-700 hover:underline">
              Gastos y ventas
            </Link>
            <Link to="/inicio" className="text-green-700 hover:underline">
              ← Inicio
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => cambiarPestana('precios')} className={tab(pestana === 'precios')}>
              Precios de mercado
            </button>
            <button onClick={() => cambiarPestana('balance')} className={tab(pestana === 'balance')}>
              Balance
            </button>
          </div>
          <button
            onClick={() => setMostrarForm((m) => !m)}
            className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-4 py-2"
          >
            {mostrarForm ? 'Cancelar' : pestana === 'precios' ? 'Nuevo precio' : 'Generar balance'}
          </button>
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {mostrarForm && pestana === 'precios' && (
          <form
            onSubmit={guardarPrecio}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-3"
          >
            <div>
              <label className="block text-sm text-gray-600 mb-1">Producto</label>
              <input
                list="productos-precio"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                required
                className={campo}
              />
              <datalist id="productos-precio">
                <option value="Leche" />
                <option value="Huevos" />
                <option value="Cerdo" />
                <option value="Bovino" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Precio (COP)</label>
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
                value={fechaPrecio}
                onChange={(e) => setFechaPrecio(e.target.value)}
                required
                className={campo}
              />
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="sm:col-span-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Registrar precio'}
            </button>
          </form>
        )}

        {mostrarForm && pestana === 'balance' && (
          <form
            onSubmit={generarBalance}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="block text-sm text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                className={campo}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
                className={campo}
              />
            </div>
            <p className="sm:col-span-2 text-sm text-gray-500">
              El servidor suma las ventas y los gastos de ese rango y guarda el resultado como
              un balance nuevo.
            </p>
            <button
              type="submit"
              disabled={guardando}
              className="sm:col-span-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Generando...' : 'Generar balance'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {pestana === 'precios' ? (
            <table className="w-full text-left">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Precio</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : preciosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      No hay precios registrados
                    </td>
                  </tr>
                ) : (
                  preciosOrdenados.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm">{fecha(p.fecha)}</td>
                      <td className="px-4 py-2">{p.producto}</td>
                      <td className="px-4 py-2 font-medium">{pesos(Number(p.precio))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-4 py-2">Periodo</th>
                  <th className="px-4 py-2">Ventas</th>
                  <th className="px-4 py-2">Gastos</th>
                  <th className="px-4 py-2">Balance neto</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : balancesOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No hay balances generados
                    </td>
                  </tr>
                ) : (
                  balancesOrdenados.map((b) => {
                    const neto = Number(b.balance_neto)
                    return (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-sm">{fecha(b.periodo)}</td>
                        <td className="px-4 py-2">{pesos(Number(b.total_ventas))}</td>
                        <td className="px-4 py-2">{pesos(Number(b.total_gastos))}</td>
                        <td
                          className={`px-4 py-2 font-medium ${
                            neto >= 0 ? 'text-green-800' : 'text-red-600'
                          }`}
                        >
                          {pesos(neto)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}