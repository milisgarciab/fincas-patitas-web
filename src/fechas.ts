// Fecha de hoy en hora local (YYYY-MM-DD), sin el corrimiento de la hora UTC
export function hoyLocal(): string {
  return aTexto(new Date())
}

// Día local de una fecha ISO del servidor
export function fechaLocal(iso: string): string {
  return aTexto(new Date(iso))
}

function aTexto(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}