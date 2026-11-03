// Roles del backend: 1 = Administrador, 2 = Encargado, 3 = Empleado
export const NOMBRE_ROL: Record<number, string> = {
  1: 'Administrador',
  2: 'Encargado',
  3: 'Empleado',
}

export type Permiso =
  | 'finanzas.ver' // entrar al módulo de finanzas y ver el balance
  | 'finanzas.editar' // gastos, ventas y generar balance
  | 'precios.configurar' // precios de mercado
  | 'animales.editar' // editar y eliminar animales
  | 'insumos.crear' // crear insumos del catálogo
  | 'stock.entrada' // entradas de stock (para cuando exista la pantalla)
  | 'registros.eliminar' // eliminar registros (el Empleado solo edita)
  | 'usuarios.ver' // lista de usuarios (para cuando exista la pantalla)
  | 'usuarios.gestionar' // crear, cambiar rol y activar/desactivar usuarios

// Qué roles tienen cada permiso (según la matriz de permisos)
const PERMISOS: Record<Permiso, number[]> = {
  'finanzas.ver': [1, 2],
  'finanzas.editar': [1],
  'precios.configurar': [1, 2],
  'animales.editar': [1, 2],
  'insumos.crear': [1],
  'stock.entrada': [1, 2],
  'registros.eliminar': [1, 2],
  'usuarios.ver': [1, 2],
  'usuarios.gestionar': [1],
}

export function rolActual(): number {
  const user = JSON.parse(localStorage.getItem('user') ?? '{}')
  return Number(user.rol_id) || 3 // si no se sabe el rol, el más restringido
}

export function puede(permiso: Permiso, rol: number = rolActual()): boolean {
  return PERMISOS[permiso].includes(rol)
}