import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '../api'
import { puede } from '../permisos'
import { fechaLocal, hoyLocal } from '../fechas'

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

interface RegistroLeche {
  litros: string
  registrado_en: string
  eliminado_en: string | null
}

interface RegistroHuevos {
  cantidad: number
  cantidad_rotos: number
  registrado_en: string
  eliminado_en: string | null
}

type Pestana = 'precios' | 'balance'

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Fecha en UTC para que no se corra un día
const fecha = (f: string) => new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' })

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const comoLista = (r: PromiseSettledResult<{ data: any }>): any[] | null =>
  r.status === 'fulfilled'
    ? Array.isArray(r.value.data)
      ? r.value.data
      : r.value.data.data
    : null

export default function MercadoBalance() {
  const puedeConfigurar = puede('precios.configurar')
  const puedeGenerar = puede('finanzas.editar')

  const [pestana, setPestana] = useState<Pestana>('precios')
  const [precios, setPrecios] = useState<Precio[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [leche, setLeche] = useState<RegistroLeche[]>([])
  const [huevos, setHuevos] = useState<RegistroHuevos[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  // Formulario de precio
  const [producto, setProducto] = useState('')
  const [precio, setPrecio] = useState('')
  const [fechaPrecio, setFechaPrecio] = useState(hoyLocal())

  // Formulario de balance
  const [fechaInicio, setFechaInicio] = useState(hoyLocal())
  const [fechaFin, setFechaFin] = useState(hoyLocal())

  const cargar = async () => {
    setError('')
    const [p, b, l, h] = await Promise.allSettled([
      api.get('/precios-mercado'),
      api.get('/balance'),
      api.get('/produccion-leche'),
      api.get('/produccion-huevos'),
    ])
    const listaPrecios = comoLista(p)
    const listaBalances = comoLista(b)
    if (listaPrecios) setPrecios(listaPrecios)
    if (listaBalances) setBalances(listaBalances)
    if (!listaPrecios || !listaBalances) setError('No se pudieron cargar los precios o los balances')
    // Si la producción falla, solo se pierde el valor estimado
    setLeche(comoLista(l) ?? [])
    setHuevos(comoLista(h) ?? [])
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  const limpiarForm = () => {
    setProducto('')
    setPrecio('')
    setFechaPrecio(hoyLocal())
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

  // ---------- Precios ----------
  const editarPrecio = (p: Precio) => {
    setProducto(p.producto)
    setPrecio(String(Number(p.precio)))
    setFechaPrecio(p.fecha.slice(0, 10))
    setEditandoId(p.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardarPrecio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    const body = { producto: producto.trim(), precio: Number(precio), fecha: fechaPrecio }
    try {
      if (editandoId) await api.put(`/precios-mercado/${editandoId}`, body)
      else await api.post('/precios-mercado', body)
      cerrarForm()
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo guardar el precio')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarPrecio = async (p: Precio) => {
    if (!window.confirm(`¿Eliminar el precio de ${p.producto} (${pesos(Number(p.precio))})?`)) return
    setError('')
    try {
      await api.delete(`/precios-mercado/${p.id}`)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el precio')
    }
  }

  // ---------- Balance ----------
  const generarBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (fechaFin < fechaInicio) {
      setError('La fecha final no puede ser anterior a la inicial')
      return
    }
    const yaExiste = balances.some((b) => b.periodo.slice(0, 10) === fechaInicio)
    if (
      yaExiste &&
      !window.confirm(
        'Ya existe un balance con ese periodo. Si continúas, se guardará otro registro más. ¿Generarlo de todas formas?',
      )
    ) {
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

  // ---------- Valor estimado de la producción del día ----------
  const hoy = hoyLocal()

  const litrosHoy = leche
    .filter((r) => !r.eliminado_en && fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + Number(r.litros), 0)

  // Los huevos rotos no se cuentan como vendibles
  const huevosHoy = huevos
    .filter((r) => !r.eliminado_en && fechaLocal(r.registrado_en) === hoy)
    .reduce((s, r) => s + Math.max(r.cantidad - r.cantidad_rotos, 0), 0)

  const ultimoPrecio = (palabra: string): Precio | undefined =>
    precios
      .filter((p) => p.producto.toLowerCase().includes(palabra))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)[0]

  const precioLeche = ultimoPrecio('leche')
  const precioHuevos = ultimoPrecio('huevo')
  const valorLeche = precioLeche ? litrosHoy * Number(precioLeche.precio) : null
  const valorHuevos = precioHuevos ? huevosHoy * Number(precioHuevos.precio) : null
  const valorTotal = (valorLeche ?? 0) + (valorHuevos ?? 0)

  const preciosOrdenados = [...precios].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const balancesOrdenados = [...balances].sort((a, b) => b.periodo.localeCompare(a.periodo))

  const tab = (activa: boolean) =>
    `px-4 py-2 rounded-lg font-semibold ${
      activa ? 'bg-bosque text-white' : 'bg-white text-bosque-oscuro hover:bg-menta'
    }`

  const botonVisible = pestana === 'precios' ? puedeConfigurar : puedeGenerar
  const botonIcono = 'p-1.5 rounded-lg hover:bg-black/5'

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-bosque-oscuro mb-4">Precios y balance</h1>

        {/* Valor estimado de la producción de hoy */}
        {!cargando && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display font-bold text-lg text-bosque-oscuro">
                Valor estimado de la producción de hoy
              </h2>
              <p className="font-display font-extrabold text-3xl text-bosque-oscuro">
                {pesos(valorTotal)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-3 text-sm">
              <div className="rounded-xl bg-menta px-4 py-3">
                <p className="font-semibold text-bosque-oscuro">Leche</p>
                {precioLeche ? (
                  <p className="text-gray-600">
                    {litrosHoy} L × {pesos(Number(precioLeche.precio))} ={' '}
                    <span className="font-semibold">{pesos(valorLeche ?? 0)}</span>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    {litrosHoy} L, pero no hay un precio de mercado registrado para la leche.
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-menta px-4 py-3">
                <p className="font-semibold text-bosque-oscuro">Huevos</p>
                {precioHuevos ? (
                  <p className="text-gray-600">
                    {huevosHoy} × {pesos(Number(precioHuevos.precio))} ={' '}
                    <span className="font-semibold">{pesos(valorHuevos ?? 0)}</span>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    {huevosHoy} huevos, pero no hay un precio de mercado registrado para los huevos.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Usa los registros de producción de hoy y el último precio de mercado de cada
              producto (por litro y por huevo). Los huevos rotos no se cuentan.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={() => cambiarPestana('precios')} className={tab(pestana === 'precios')}>
              Precios de mercado
            </button>
            <button onClick={() => cambiarPestana('balance')} className={tab(pestana === 'balance')}>
              Balance
            </button>
          </div>
          {botonVisible && (
            <button
              onClick={alternarForm}
              className="bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-4 py-2"
            >
              {mostrarForm ? 'Cancelar' : pestana === 'precios' ? 'Nuevo precio' : 'Generar balance'}
            </button>
          )}
        </div>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        {puedeConfigurar && mostrarForm && pestana === 'precios' && (
          <form
            onSubmit={guardarPrecio}
            className="bg-white rounded-xl shadow p-6 mb-4 grid gap-4 sm:grid-cols-3"
          >
            <h2 className="sm:col-span-3 font-bold text-bosque-oscuro">
              {editandoId ? 'Editar precio' : 'Nuevo precio de mercado'}
            </h2>
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
              className="sm:col-span-3 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar precio'}
            </button>
          </form>
        )}

        {puedeGenerar && mostrarForm && pestana === 'balance' && (
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
              className="sm:col-span-2 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
            >
              {guardando ? 'Generando...' : 'Generar balance'}
            </button>
          </form>
        )}

        {pestana === 'balance' && (
          <p className="text-xs text-gray-500 mb-3">
            Cada balance es una foto del momento en que se generó: si luego editas o eliminas
            una venta o un gasto, el balance ya guardado no se recalcula.
          </p>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {pestana === 'precios' ? (
            <table className="w-full text-left">
              <thead className="bg-bosque text-white">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Precio</th>
                  {puedeConfigurar && <th className="px-4 py-2 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : preciosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No hay precios registrados
                    </td>
                  </tr>
                ) : (
                  preciosOrdenados.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-sm">{fecha(p.fecha)}</td>
                      <td className="px-4 py-2">{p.producto}</td>
                      <td className="px-4 py-2 font-medium">{pesos(Number(p.precio))}</td>
                      {puedeConfigurar && (
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => editarPrecio(p)}
                              title="Editar"
                              className={`${botonIcono} text-bosque`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarPrecio(p)}
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
                            neto >= 0 ? 'text-bosque-oscuro' : 'text-red-600'
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