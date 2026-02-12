export interface Bodega {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  responsable: string;
  telefono: string;
  capacidad: string;
  descripcion?: string;
  estado: boolean;
}

export const bodegasData: Bodega[] = [
  {
    id: 'BOD-001',
    codigo: 'BOD-001',
    nombre: 'Bodega Principal',
    direccion: 'Calle 80 #45-23',
    ciudad: 'Bogotá',
    responsable: 'Carlos Rodríguez',
    telefono: '601-234-5678',
    capacidad: '1000 m²',
    descripcion: 'Bodega principal para almacenamiento general',
    estado: true,
  },
  {
    id: 'BOD-002',
    codigo: 'BOD-002',
    nombre: 'Bodega Secundaria',
    direccion: 'Carrera 15 #123-45',
    ciudad: 'Bogotá',
    responsable: 'María García',
    telefono: '601-345-6789',
    capacidad: '500 m²',
    descripcion: 'Bodega para productos refrigerados',
    estado: true,
  },
  {
    id: 'BOD-003',
    codigo: 'BOD-003',
    nombre: 'Bodega Medellín',
    direccion: 'Carrera 43A #12-34',
    ciudad: 'Medellín',
    responsable: 'Pedro López',
    telefono: '604-567-8901',
    capacidad: '800 m²',
    estado: true,
  },
];
