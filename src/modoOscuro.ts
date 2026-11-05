const CLAVE = 'modoOscuro'

// Por defecto la web arranca en modo claro
export function modoOscuroActivo(): boolean {
  return localStorage.getItem(CLAVE) === '1'
}

export function aplicarModo(oscuro: boolean) {
  document.documentElement.classList.toggle('dark', oscuro)
  localStorage.setItem(CLAVE, oscuro ? '1' : '0')
}

// Se ejecuta apenas carga la web, para que no parpadee
document.documentElement.classList.toggle('dark', modoOscuroActivo())