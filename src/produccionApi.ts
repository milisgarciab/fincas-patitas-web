import { api } from './api'

// Rutas reales del backend, confirmadas en Swagger
function rutasReales(candidatas: string[]): string[] {
  const texto = candidatas.join(' ').toLowerCase()
  if (/leche|milk/.test(texto)) return ['/produccion-leche']
  if (/huevo|egg/.test(texto)) return ['/produccion-huevos']
  return []
}

export async function obtenerLista<T>(candidatas: string[]): Promise<T[]> {
  for (const ruta of [...rutasReales(candidatas), ...candidatas]) {
    try {
      const r = await api.get(ruta)
      return Array.isArray(r.data) ? r.data : r.data.data
    } catch (err: any) {
      if (err.response?.status !== 404) throw err
    }
  }
  throw new Error('RUTA_NO_ENCONTRADA')
}