import {
  CalendarClock,
  ClipboardList,
  Layers,
  MapPin,
  Package,
  PawPrint,
  Scale,
  Sprout,
  Tags,
  Trees,
  Users,
  Wheat,
} from 'lucide-react'
import Hub from '../components/Hub'

export function HubAnimales() {
  return (
    <Hub
      titulo="Animales"
      subtitulo="Elige qué quieres revisar o registrar."
      tarjetas={[
        {
          titulo: 'Lista de animales',
          descripcion: 'Fichas, búsqueda y registro de animales',
          ruta: '/animales',
          icono: PawPrint,
        },
        {
          titulo: 'Nacimientos',
          descripcion: 'Crías nacidas en la finca y sus padres',
          ruta: '/nacimientos',
          icono: Sprout,
        },
        {
          titulo: 'Alimentación',
          descripcion: 'Qué y cuánto come cada animal',
          ruta: '/alimentacion',
          icono: Wheat,
        },
        {
          titulo: 'Peso',
          descripcion: 'Evolución del peso de cada animal',
          ruta: '/pesos',
          icono: Scale,
        },
      ]}
    />
  )
}

export function HubUbicacion() {
  return (
    <Hub
      titulo="Ubicación"
      subtitulo="Elige qué quieres revisar o administrar."
      tarjetas={[
        {
          titulo: 'Mapa',
          descripcion: 'Ubicación de la finca',
          ruta: '/ubicacion',
          icono: MapPin,
        },
        {
          titulo: 'Potreros',
          descripcion: 'Terrenos, ocupación y encargados',
          ruta: '/potreros',
          icono: Trees,
        },
        {
          titulo: 'Lotes',
          descripcion: 'Grupos de animales por especie',
          ruta: '/lotes',
          icono: Layers,
        },
      ]}
    />
  )
}

export function HubInventario() {
  return (
    <Hub
      titulo="Inventario"
      subtitulo="Elige qué quieres revisar o registrar."
      tarjetas={[
        {
          titulo: 'Insumos',
          descripcion: 'Stock, entradas y salidas',
          ruta: '/bodega',
          icono: Package,
        },
        {
          titulo: 'Vencimientos',
          descripcion: 'Lotes de inventario y fechas de vencimiento',
          ruta: '/bodega/lotes',
          icono: CalendarClock,
        },
      ]}
    />
  )
}

export function HubAdministracion() {
  return (
    <Hub
      titulo="Administración"
      subtitulo="Control de personas, catálogos y actividad del sistema."
      tarjetas={[
        {
          titulo: 'Usuarios',
          descripcion: 'Cuentas, roles y estado',
          ruta: '/usuarios',
          icono: Users,
          permiso: 'usuarios.ver',
        },
        {
          titulo: 'Catálogos',
          descripcion: 'Especies, razas y categorías de bodega',
          ruta: '/catalogos',
          icono: Tags,
          permiso: 'catalogos.gestionar',
        },
        {
          titulo: 'Auditoría',
          descripcion: 'Quién hizo cada cambio',
          ruta: '/auditoria',
          icono: ClipboardList,
          permiso: 'auditoria.ver',
        },
      ]}
    />
  )
}