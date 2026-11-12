import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

interface AnimalOpcion {
  id: number
  codigo: string
  nombre: string
  genero: string
  especies: { nombre: string } | null
}

interface Props {
  etiqueta: string
  valor: string
  onCambio: (id: string) => void
  genero?: 'Macho' | 'Hembra'
  requerido?: boolean
  excluirId?: number
  textoVacio?: string
}

const campo =
  'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-bosque/40'

export default function SelectorAnimal({
  etiqueta,
  valor,
  onCambio,
  genero,
  requerido = false,
  excluirId,
  textoVacio = 'Sin especificar',
}: Props) {
  const [animales, setAnimales] = useState<AnimalOpcion[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [texto, setTexto] = useState('')

  useEffect(() => {
    api
      .get('/animales', { params: { pagina: 1, limite: 100 } })
      .then((r) => {
        setAnimales(Array.isArray(r.data) ? r.data : r.data.data)
        setEstado('listo')
      })
      .catch(() => setEstado('error'))
  }, [])

  const etiquetaAnimal = (a: AnimalOpcion) =>
    `${a.nombre} (${a.codigo})${a.especies ? ` · ${a.especies.nombre}` : ''}`

  const opciones = useMemo(() => {
    const q = texto.trim().toLowerCase()
    const lista = animales
      .filter((a) => !genero || a.genero === genero)
      .filter((a) => a.id !== excluirId)
      .filter(
        (a) =>
          !q || a.nombre.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    // El animal ya elegido siempre se ve, aunque el buscador no lo incluya
    const elegido = animales.find((a) => String(a.id) === valor)
    if (elegido && !lista.some((a) => a.id === elegido.id)) lista.unshift(elegido)
    return lista
  }, [animales, texto, genero, excluirId, valor])

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{etiqueta}</label>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por nombre o código..."
        className={`${campo} mb-2 text-sm`}
      />
      <select
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        required={requerido}
        className={campo}
      >
        <option value="">
          {estado === 'cargando'
            ? 'Cargando animales...'
            : requerido
              ? 'Selecciona un animal'
              : textoVacio}
        </option>
        {opciones.map((a) => (
          <option key={a.id} value={a.id}>
            {etiquetaAnimal(a)}
          </option>
        ))}
      </select>
      {estado === 'error' && (
        <p className="text-xs text-red-600 mt-1">No se pudo cargar la lista de animales.</p>
      )}
      {estado === 'listo' && opciones.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">No hay animales que coincidan.</p>
      )}
    </div>
  )
}