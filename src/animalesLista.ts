import { api } from './api'

export interface AnimalResumen {
  id: number
  codigo: string
  nombre: string | null
  genero: string
  estado: string | null
  especie_id: number
  lote_id: number | null
  potrero_id: number | null
  madre_id: number | null
  padre_id: number | null
}

// Respuestas que vienen como [] o como { data: [] }
export const aLista = (d: any): any[] => (Array.isArray(d) ? d : (d?.data ?? []))

// Trae todas las páginas (el backend entrega máximo 100 por página)
export async function cargarAnimales(estado = 'Todos'): Promise<AnimalResumen[]> {
  const todos: AnimalResumen[] = []
  let pagina = 1
  let total = 1
  while (pagina <= total && pagina <= 20) {
    const r = await api.get('/animales', { params: { page: pagina, limit: 100, estado } })
    todos.push(...aLista(r.data))
    total = r.data?.paginacion?.totalPaginas ?? 1
    pagina++
  }
  return todos
}

export const etiquetaAnimal = (
  a: { nombre?: string | null; codigo?: string } | null | undefined,
  id?: number,
) => (a ? `${a.nombre ?? 'Sin nombre'} (${a.codigo})` : `Animal #${id}`)