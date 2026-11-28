import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../api'
import { obtenerLista } from '../produccionApi'
import { aLista, cargarAnimales } from '../animalesLista'
import type { AnimalResumen } from '../animalesLista'
import { puede } from '../permisos'
import Modal from '../components/Modal'

interface Animal {
  id: number
  codigo: string
  nombre: string
  genero: string
  estado: string
  origen: string | null
  fecha_nacimiento: string | null
  fecha_ingreso: string | null
  madre_id: number | null
  padre_id: number | null
  potrero_id: number | null
  lote_id: number | null
  especies: { nombre: string } | null
  razas: { nombre: string } | null
  lotes_animales: { nombre: string } | null
}

type Pestana =
  | 'ficha'
  | 'salud'
  | 'reproduccion'
  | 'produccion'
  | 'alimentacion'
  | 'peso'
  | 'ubicacion'
  | 'historial'

const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: 'ficha', texto: 'Ficha' },
  { id: 'salud', texto: 'Salud' },
  { id: 'reproduccion', texto: 'Reproducción' },
  { id: 'produccion', texto: 'Producción' },
  { id: 'alimentacion', texto: 'Alimentación' },
  { id: 'peso', texto: 'Peso' },
  { id: 'ubicacion', texto: 'Ubicación' },
  { id: 'historial', texto: 'Historial' },
]

// Fecha solo-día en UTC para que no se corra un día
const fechaDia = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '—'
const fechaHora = (f: string | null | undefined) =>
  f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

const lista = (r: PromiseSettledResult<{ data: any }>): any[] | null =>
  r.status === 'fulfilled' ? aLista(r.value.data) : null

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
      <span className="text-gray-500">{etiqueta}</span>
      <span className="font-medium text-gray-800 text-right">{valor}</span>
    </div>
  )
}

function Tabla({
  columnas,
  filas,
  vacio,
}: {
  columnas: string[]
  filas: React.ReactNode[][]
  vacio: string
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-bosque text-white">
          <tr>
            {columnas.map((c) => (
              <th key={c} className="px-4 py-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-6 text-center text-gray-500">
                {vacio}
              </td>
            </tr>
          ) : (
            filas.map((f, i) => (
              <tr key={i} className="border-t border-gray-100">
                {f.map((c, j) => (
                  <td key={j} className="px-4 py-2 text-sm">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Campos de un ítem de la línea de tiempo (la forma exacta no está en la documentación)
const fechaItem = (x: any) =>
  x.fecha ?? x.fecha_evento ?? x.registrado_en ?? x.fecha_inseminacion ?? x.creado_en ?? null
const tipoItem = (x: any) => x.tipo ?? x.tipo_evento ?? x.categoria ?? x.evento ?? 'Registro'
const detalleItem = (x: any) =>
  x.descripcion ??
  x.detalle ??
  x.descripcion_tratamiento ??
  (x.peso_kg != null ? `${Number(x.peso_kg)} kg` : null) ??
  (x.litros != null ? `${Number(x.litros)} L` : null) ??
  x.estado ??
  '—'

export default function AnimalDetalle() {
  const { id } = useParams()
  const idNum = Number(id)
  const navigate = useNavigate()
  const puedeEditar = puede('animales.editar')
  const puedeTrasladar = puede('animales.trasladar')

  const [pestana, setPestana] = useState<Pestana>('ficha')
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [todos, setTodos] = useState<AnimalResumen[] | null>(null)
  const [potreros, setPotreros] = useState<any[] | null>(null)
  const [eventos, setEventos] = useState<any[] | null>(null)
  const [gestaciones, setGestaciones] = useState<any[] | null>(null)
  const [leche, setLeche] = useState<any[] | null>(null)
  const [huevos, setHuevos] = useState<any[] | null>(null)
  const [pesos, setPesos] = useState<any[] | null>(null)
  const [alimentos, setAlimentos] = useState<any[] | null>(null)
  const [movimientos, setMovimientos] = useState<any[] | null>(null)
  const [descendencia, setDescendencia] = useState<any[] | null>(null)
  const [linea, setLinea] = useState<any[] | null>(null)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)

  // Traslado
  const [trasladando, setTrasladando] = useState(false)
  const [destino, setDestino] = useState('')
  const [errorTraslado, setErrorTraslado] = useState('')
  const [guardandoTraslado, setGuardandoTraslado] = useState(false)

  const cargar = useCallback(async () => {
    const [a, todosR, pot, ev, rep, le, hu, pe, al, mov, des, his] = await Promise.allSettled([
      api.get(`/animales/${id}`),
      cargarAnimales(),
      api.get('/ubicaciones-potreros'),
      api.get('/eventos-sanitarios', { params: { animal_id: id } }),
      api.get('/reproduccion'),
      obtenerLista<any>(['/produccion-leche']),
      obtenerLista<any>(['/produccion-huevos']),
      api.get('/registros-peso', { params: { animal_id: id } }),
      api.get('/alimentacion', { params: { animal_id: id } }),
      api.get(`/animales/${id}/movimientos`),
      api.get(`/nacimientos/${id}/descendencia`),
      api.get(`/animales/${id}/historial`),
    ])

    if (a.status === 'fulfilled') {
      setAnimal(a.value.data)
      setError('')
    } else {
      setError(
        (a.reason as any)?.response?.status === 404
          ? 'Ese animal no existe'
          : 'No se pudo cargar el animal',
      )
    }

    setTodos(todosR.status === 'fulfilled' ? todosR.value : null)
    setPotreros(lista(pot))
    setEventos(lista(ev)?.filter((e) => !e.eliminado_en) ?? null)
    setGestaciones(
      lista(rep)?.filter((g) => !g.eliminado_en && (g.animal_id === idNum || g.macho_id === idNum)) ??
        null,
    )
    const delAnimal = (r: any) => !r.eliminado_en && (r.animal_id === idNum || r.animales?.id === idNum)
    setLeche(le.status === 'fulfilled' ? le.value.filter(delAnimal) : null)
    setHuevos(hu.status === 'fulfilled' ? hu.value.filter(delAnimal) : null)
    setPesos(lista(pe))
    setAlimentos(lista(al))
    setMovimientos(lista(mov))
    setDescendencia(lista(des))
    setLinea(
      his.status === 'fulfilled' ? (his.value.data?.historial?.lineaDeTiempo ?? []) : null,
    )
  }, [id, idNum])

  useEffect(() => {
    setCargando(true)
    cargar().finally(() => setCargando(false))
  }, [cargar])

  const eliminar = async () => {
    if (!animal) return
    if (!window.confirm(`¿Eliminar a ${animal.nombre} (${animal.codigo})? No se puede deshacer.`)) {
      return
    }
    setEliminando(true)
    setError('')
    try {
      await api.delete(`/animales/${id}`)
      navigate('/animales')
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'No se pudo eliminar el animal')
      setEliminando(false)
    }
  }

  const abrirTraslado = () => {
    setDestino('')
    setErrorTraslado('')
    setTrasladando(true)
  }

  const trasladar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorTraslado('')
    setGuardandoTraslado(true)
    try {
      await api.post(`/animales/${id}/trasladar`, { potrero_destino_id: Number(destino) })
      setTrasladando(false)
      await cargar()
    } catch (err: any) {
      setErrorTraslado(err.response?.data?.error?.message ?? 'No se pudo trasladar el animal')
    } finally {
      setGuardandoTraslado(false)
    }
  }

  // ---------- Datos derivados ----------
  const nombreDe = (animalId: number | null) => {
    if (!animalId) return '—'
    const a = todos?.find((x) => x.id === animalId)
    return a ? `${a.nombre ?? 'Sin nombre'} (${a.codigo})` : `Animal #${animalId}`
  }

  const enlaceAnimal = (animalId: number | null) =>
    animalId ? (
      <Link to={`/animales/${animalId}`} className="text-bosque hover:underline">
        {nombreDe(animalId)}
      </Link>
    ) : (
      '—'
    )

  const nombrePotrero = (potreroId: number | null | undefined) => {
    if (!potreroId) return null
    return potreros?.find((p) => p.id === potreroId)?.nombre ?? `Potrero #${potreroId}`
  }

  // Crías: ruta propia; si falla, se deducen de la lista de animales
  const crias: any[] | null =
    descendencia ?? todos?.filter((x) => x.madre_id === idNum || x.padre_id === idNum) ?? null
  const nacidoPorReproduccion = !!animal?.madre_id && /^nacid/i.test(animal?.origen ?? '')

  // Peso con el cambio frente al registro anterior
  const pesosOrdenados = [...(pesos ?? [])].sort((a, b) =>
    String(a.registrado_en).localeCompare(String(b.registrado_en)),
  )
  const filasPeso = pesosOrdenados
    .map((r, i) => {
      const cambio = i === 0 ? null : Number(r.peso_kg) - Number(pesosOrdenados[i - 1].peso_kg)
      return [
        fechaHora(r.registrado_en),
        `${Number(r.peso_kg)} kg`,
        cambio === null ? (
          '—'
        ) : (
          <span className={cambio < 0 ? 'text-red-600' : 'text-bosque'}>
            {cambio > 0 ? '+' : ''}
            {cambio.toFixed(2)} kg
          </span>
        ),
      ]
    })
    .reverse()

  const sinDatos = (v: unknown) => v === null
  const aviso = (texto: string) => <p className="text-sm text-gray-500">{texto}</p>

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
      <Link
        to="/animales"
        className="inline-flex items-center gap-1 text-sm font-semibold text-bosque hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Animales
      </Link>

      {cargando && <p className="text-gray-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {animal && (
        <>
          {/* Encabezado */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-menta flex items-center justify-center text-3xl">
                {animal.especies?.nombre === 'Cerdo'
                  ? '🐖'
                  : animal.especies?.nombre === 'Gallina'
                    ? '🐔'
                    : '🐄'}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-marron">{animal.nombre}</h1>
                <p className="font-mono text-sm text-gray-500">
                  {animal.codigo} · {animal.especies?.nombre}{' '}
                  {animal.razas ? `· ${animal.razas.nombre}` : ''}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  animal.estado === 'Activo'
                    ? 'bg-menta text-bosque-oscuro'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {animal.estado}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/salud/nuevo?animal=${animal.id}`}
                className="flex items-center gap-1 border border-bosque text-bosque font-semibold rounded-lg px-3 py-2 hover:bg-menta"
              >
                <Plus className="w-4 h-4" />
                Registrar salud
              </Link>
              {puedeEditar && (
                <>
                  <Link
                    to={`/animales/${animal.id}/editar`}
                    className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-3 py-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Link>
                  <button
                    onClick={eliminar}
                    disabled={eliminando}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-3 py-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pestañas */}
          <div className="flex flex-wrap gap-2">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  pestana === p.id
                    ? 'bg-bosque text-white'
                    : 'bg-white text-bosque-oscuro hover:bg-menta'
                }`}
              >
                {p.texto}
              </button>
            ))}
          </div>

          {/* Ficha */}
          {pestana === 'ficha' && (
            <div className="space-y-4">
              {nacidoPorReproduccion && (
                <p className="text-sm bg-menta text-bosque-oscuro rounded-lg px-4 py-3">
                  Este animal nació por reproducción: sus datos de nacimiento, especie, raza y
                  padres no se pueden editar.
                </p>
              )}

              <div className="bg-white rounded-xl shadow-sm p-5">
                <Fila etiqueta="Especie" valor={animal.especies?.nombre ?? '—'} />
                <Fila etiqueta="Raza" valor={animal.razas?.nombre ?? '—'} />
                <Fila etiqueta="Género" valor={animal.genero} />
                <Fila etiqueta="Fecha de nacimiento" valor={fechaDia(animal.fecha_nacimiento)} />
                <Fila etiqueta="Fecha de ingreso" valor={fechaDia(animal.fecha_ingreso)} />
                <Fila etiqueta="Origen" valor={animal.origen ?? '—'} />
                <Fila etiqueta="Madre" valor={enlaceAnimal(animal.madre_id)} />
                <Fila etiqueta="Padre" valor={enlaceAnimal(animal.padre_id)} />
              </div>

              <div>
                <h2 className="font-display font-bold text-lg text-marron mb-2">Crías</h2>
                {sinDatos(crias) ? (
                  aviso('No se pudieron cargar las crías.')
                ) : (
                  <Tabla
                    columnas={['Animal', 'Género', 'Nacimiento']}
                    filas={crias!.map((c) => [
                      enlaceAnimal(c.id),
                      c.genero,
                      fechaDia(c.fecha_nacimiento),
                    ])}
                    vacio="Este animal no tiene crías registradas"
                  />
                )}
              </div>
            </div>
          )}

          {/* Salud */}
          {pestana === 'salud' && (
            <div className="space-y-3">
              {sinDatos(eventos) ? (
                aviso('No se pudo cargar la salud del animal.')
              ) : (
                <Tabla
                  columnas={['Fecha', 'Tipo', 'Dosis', 'Tratamiento', 'Estado']}
                  filas={[...eventos!]
                    .sort((a, b) => String(b.fecha_evento).localeCompare(String(a.fecha_evento)))
                    .map((e) => [
                      fechaDia(e.fecha_evento),
                      e.tipo_evento,
                      e.dosis_aplicada != null
                        ? `${Number(e.dosis_aplicada)} ${e.unidad_dosis ?? ''}`.trim()
                        : '—',
                      e.descripcion_tratamiento ?? '—',
                      e.estado,
                    ])}
                  vacio="Este animal no tiene eventos de salud"
                />
              )}
              <Link
                to={`/salud/nuevo?animal=${animal.id}`}
                className="inline-flex items-center gap-1 text-bosque font-semibold hover:underline"
              >
                <Plus className="w-4 h-4" />
                Registrar un evento de salud
              </Link>
            </div>
          )}

          {/* Reproducción */}
          {pestana === 'reproduccion' && (
            <div>
              {sinDatos(gestaciones) ? (
                aviso('No se pudo cargar la reproducción del animal.')
              ) : (
                <Tabla
                  columnas={['Rol', 'Pareja', 'Tipo', 'Inseminación', 'Parto estimado', 'Estado']}
                  filas={[...gestaciones!]
                    .sort((a, b) => b.id - a.id)
                    .map((g) => {
                      const esHembra = g.animal_id === idNum
                      return [
                        esHembra ? 'Hembra' : 'Macho',
                        enlaceAnimal(esHembra ? g.macho_id : g.animal_id),
                        g.tipo ?? '—',
                        fechaDia(g.fecha_inseminacion),
                        fechaDia(g.fecha_estimada_parto),
                        g.estado,
                      ]
                    })}
                  vacio="Este animal no tiene registros de reproducción"
                />
              )}
            </div>
          )}

          {/* Producción */}
          {pestana === 'produccion' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-lg text-marron mb-2">🥛 Leche</h2>
                {sinDatos(leche) ? (
                  aviso('No se pudo cargar la producción de leche.')
                ) : (
                  <Tabla
                    columnas={['Fecha', 'Litros', 'Jornada', 'Observaciones']}
                    filas={[...leche!]
                      .sort((a, b) => String(b.registrado_en).localeCompare(String(a.registrado_en)))
                      .map((r) => [
                        fechaHora(r.registrado_en),
                        `${Number(r.litros)} L`,
                        r.jornada ?? '—',
                        r.observaciones ?? '—',
                      ])}
                    vacio="Sin registros de leche para este animal"
                  />
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-marron mb-2">🥚 Huevos</h2>
                {sinDatos(huevos) ? (
                  aviso('No se pudo cargar la producción de huevos.')
                ) : (
                  <Tabla
                    columnas={['Fecha', 'Cantidad', 'Rotos', 'Observaciones']}
                    filas={[...huevos!]
                      .sort((a, b) => String(b.registrado_en).localeCompare(String(a.registrado_en)))
                      .map((r) => [
                        fechaHora(r.registrado_en),
                        r.cantidad,
                        r.cantidad_rotos ?? 0,
                        r.observaciones ?? '—',
                      ])}
                    vacio="Sin registros de huevos para este animal"
                  />
                )}
              </div>
            </div>
          )}

          {/* Alimentación */}
          {pestana === 'alimentacion' && (
            <div className="space-y-3">
              {sinDatos(alimentos) ? (
                aviso('No se pudo cargar la alimentación del animal.')
              ) : (
                <Tabla
                  columnas={['Fecha', 'Alimento', 'Cantidad']}
                  filas={[...alimentos!]
                    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
                    .map((r) => [
                      fechaDia(r.fecha),
                      r.tipo_alimento,
                      `${Number(r.cantidad)} ${r.unidad}`,
                    ])}
                  vacio="Este animal no tiene registros de alimentación"
                />
              )}
              <Link
                to={`/alimentacion?animal=${animal.id}&nuevo=1`}
                className="inline-flex items-center gap-1 text-bosque font-semibold hover:underline"
              >
                <Plus className="w-4 h-4" />
                Registrar alimentación
              </Link>
            </div>
          )}

          {/* Peso */}
          {pestana === 'peso' && (
            <div className="space-y-3">
              {sinDatos(pesos) ? (
                aviso('No se pudo cargar el peso del animal.')
              ) : (
                <Tabla
                  columnas={['Fecha', 'Peso', 'Cambio']}
                  filas={filasPeso}
                  vacio="Este animal no tiene registros de peso"
                />
              )}
              <Link
                to={`/pesos?animal=${animal.id}&nuevo=1`}
                className="inline-flex items-center gap-1 text-bosque font-semibold hover:underline"
              >
                <Plus className="w-4 h-4" />
                Registrar peso
              </Link>
            </div>
          )}

          {/* Ubicación */}
          {pestana === 'ubicacion' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h2 className="font-display font-bold text-lg text-marron">Ubicación actual</h2>
                  {puedeTrasladar && (
                    <button
                      onClick={abrirTraslado}
                      className="flex items-center gap-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg px-3 py-2"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Trasladar
                    </button>
                  )}
                </div>
                <Fila
                  etiqueta="Potrero"
                  valor={nombrePotrero(animal.potrero_id) ?? 'Sin potrero asignado'}
                />
                <Fila etiqueta="Lote" valor={animal.lotes_animales?.nombre ?? 'Sin lote'} />
                <p className="text-xs text-gray-500 mt-3">
                  El potrero solo cambia con un traslado, para que quede registrado el movimiento.
                </p>
              </div>

              <div>
                <h2 className="font-display font-bold text-lg text-marron mb-2">
                  Historial de movimientos
                </h2>
                {sinDatos(movimientos) ? (
                  aviso('No se pudo cargar el historial de movimientos.')
                ) : (
                  <Tabla
                    columnas={['Fecha', 'Desde', 'Hacia']}
                    filas={[...movimientos!]
                      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
                      .map((m) => [
                        fechaHora(m.fecha),
                        nombrePotrero(m.potrero_origen_id) ?? 'Sin ubicación',
                        nombrePotrero(m.potrero_destino_id) ?? '—',
                      ])}
                    vacio="Este animal todavía no tiene traslados"
                  />
                )}
              </div>
            </div>
          )}

          {/* Historial unificado */}
          {pestana === 'historial' && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Línea de tiempo con salud, producción, peso y gestaciones.
              </p>
              {sinDatos(linea) ? (
                aviso('No se pudo cargar el historial del animal.')
              ) : (
                <Tabla
                  columnas={['Fecha', 'Tipo', 'Detalle']}
                  filas={[...linea!]
                    .sort((a, b) => String(fechaItem(b)).localeCompare(String(fechaItem(a))))
                    .map((x) => [fechaHora(fechaItem(x)), tipoItem(x), detalleItem(x)])}
                  vacio="Este animal todavía no tiene historial"
                />
              )}
            </div>
          )}
        </>
      )}

      {trasladando && (
        <Modal titulo="Trasladar animal" onCerrar={() => setTrasladando(false)}>
          <form onSubmit={trasladar} className="space-y-4">
            <p className="text-sm text-gray-500">
              {animal?.nombre}: elige el potrero de destino. El movimiento queda en el historial.
            </p>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Potrero de destino</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                required
                className={campo}
              >
                <option value="">Selecciona un potrero</option>
                {(potreros ?? [])
                  .filter((p) => p.id !== animal?.potrero_id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                      {p.estado ? ` · ${p.estado}` : ''}
                    </option>
                  ))}
              </select>
              {potreros === null && (
                <p className="text-sm text-red-600 mt-1">No se pudo cargar la lista de potreros.</p>
              )}
            </div>

            {errorTraslado && <p className="text-red-600 text-sm">{errorTraslado}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTrasladando(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoTraslado || !destino}
                className="flex-1 bg-bosque hover:bg-bosque-oscuro text-white font-semibold rounded-lg py-2 disabled:opacity-50"
              >
                {guardandoTraslado ? 'Trasladando...' : 'Trasladar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}