// Item de un traslado
export interface TrasladoItem {
  productoId: string;
  productoNombre: string;
  loteNumero: string;
  cantidad: number;
}

// Tipo de Traslado
export interface Traslado {
  id: string;
  codigo: string;
  fecha: string;
  bodegaOrigen: string;
  bodegaDestino: string;
  items: TrasladoItem[];
  responsable: string;
  estado: 'Enviado' | 'Recibido' | 'Cancelado';
  observaciones?: string;
}

// Datos iniciales de traslados
export const trasladosData: Traslado[] = [
  {
    id: 'TRS-001',
    codigo: 'TRD-001',
    fecha: '2024-01-15',
    bodegaOrigen: 'Bodega Principal',
    bodegaDestino: 'Bodega Secundaria',
    items: [
      {
        productoId: 'PROD-001',
        productoNombre: 'Acetaminofén 500mg',
        loteNumero: 'L2024-001',
        cantidad: 50,
      },
      {
        productoId: 'PROD-002',
        productoNombre: 'Ibuprofeno 400mg',
        loteNumero: 'L2024-102',
        cantidad: 30,
      },
    ],
    responsable: 'Admin Principal',
    estado: 'Recibido',
    observaciones: 'Traslado completado sin novedad',
  },
  {
    id: 'TRS-002',
    codigo: 'TRD-002',
    fecha: '2024-01-16',
    bodegaOrigen: 'Bodega Principal',
    bodegaDestino: 'Bodega Norte',
    items: [
      {
        productoId: 'PROD-002',
        productoNombre: 'Ibuprofeno 400mg',
        loteNumero: 'L2024-102',
        cantidad: 30,
      },
    ],
    responsable: 'Juan Vendedor',
    estado: 'Enviado',
    observaciones: 'En tránsito hacia bodega norte',
  },
  {
    id: 'TRS-003',
    codigo: 'TRD-003',
    fecha: '2024-01-17',
    bodegaOrigen: 'Bodega Secundaria',
    bodegaDestino: 'Bodega Principal',
    items: [
      {
        productoId: 'PROD-003',
        productoNombre: 'Amoxicilina 500mg',
        loteNumero: 'L2024-203',
        cantidad: 75,
      },
      {
        productoId: 'PROD-004',
        productoNombre: 'Omeprazol 20mg',
        loteNumero: 'L2024-304',
        cantidad: 40,
      },
      {
        productoId: 'PROD-005',
        productoNombre: 'Loratadina 10mg',
        loteNumero: 'L2024-405',
        cantidad: 60,
      },
    ],
    responsable: 'Carlos Logística',
    estado: 'Enviado',
    observaciones: 'En tránsito',
  },
  {
    id: 'TRS-004',
    codigo: 'TRD-004',
    fecha: '2024-01-18',
    bodegaOrigen: 'Bodega Norte',
    bodegaDestino: 'Bodega Secundaria',
    items: [
      {
        productoId: 'PROD-004',
        productoNombre: 'Omeprazol 20mg',
        loteNumero: 'L2024-304',
        cantidad: 100,
      },
    ],
    responsable: 'Admin Principal',
    estado: 'Recibido',
    observaciones: 'Traslado exitoso',
  },
];
