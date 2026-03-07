import { productosData, type Producto } from "./productos";

export interface Orden {
  id: number;
  numeroOrden: string;
  cliente: string;
  fecha: string;
  fechaVencimiento: string;
  estado: "Pendiente" | "Procesando" | "Enviada" | "Entregada" | "Cancelada";
  items: number;
  total: number;
  observaciones: string;
  bodega: string;
  productos?: Array<{
    producto: Producto;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

export const ordenesData: Orden[] = [
  {
    id: 1,
    numeroOrden: "ORD-001",
    cliente: "Juan Carlos Pérez Rodríguez",
    fecha: "2024-01-15",
    fechaVencimiento: "2024-01-20",
    estado: "Procesando",
    items: 2,
    total: 1475000,
    observaciones: "Cliente frecuente - prioridad alta",
    bodega: "Bodega Principal",
    productos: [
      {
        producto: productosData[0],
        cantidad: 10,
        precio: 125000,
        subtotal: 1250000,
      },
      {
        producto: productosData[3],
        cantidad: 5,
        precio: 45000,
        subtotal: 225000,
      },
    ],
  },
  {
    id: 2,
    numeroOrden: "ORD-002",
    cliente: "María Fernanda García López",
    fecha: "2024-01-14",
    fechaVencimiento: "2024-01-19",
    estado: "Enviada",
    items: 1,
    total: 944000,
    observaciones: "Envío por transportadora",
    bodega: "Bodega Medellín",
    productos: [
      {
        producto: productosData[1],
        cantidad: 8,
        precio: 118000,
        subtotal: 944000,
      },
    ],
  },
  {
    id: 3,
    numeroOrden: "ORD-003",
    cliente: "Distribuidora ABC S.A.S.",
    fecha: "2024-01-16",
    fechaVencimiento: "2024-01-21",
    estado: "Pendiente",
    items: 2,
    total: 2075000,
    observaciones: "Verificar disponibilidad antes de confirmar",
    bodega: "Bodega Secundaria",
    productos: [
      {
        producto: productosData[2],
        cantidad: 15,
        precio: 115000,
        subtotal: 1725000,
      },
      {
        producto: productosData[7],
        cantidad: 10,
        precio: 35000,
        subtotal: 350000,
      },
    ],
  },
];

export const CATEGORIAS_CLIENTE = [
  "Distribuidor",
  "Minorista",
  "Mayorista",
  "Consumidor Final",
  "Otros",
] as const;