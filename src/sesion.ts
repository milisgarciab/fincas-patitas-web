// Borra solo los datos de la sesión; deja el modo oscuro y el correo recordado
const CLAVES_SESION = ['accessToken', 'refreshToken', 'user']

export function limpiarSesion() {
  CLAVES_SESION.forEach((c) => localStorage.removeItem(c))
}