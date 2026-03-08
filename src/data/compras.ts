import { Producto, productosData } from "./productos";

// Tipo de detalle de compra
export interface CompraProducto {
  producto: Producto;
  cantidad: number;
  precio: number;
  subtotal: number;
}

// Tipo de Compra
export interface Compra {
  id: number;
  numeroOrden: string;
  proveedor: string;
  fecha: string;
  fechaEntrega: string;
  estado: "Pendiente" | "Aprobada"| "Anulada";
  items: number;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  bodega: string;
  productos?: CompraProducto[];
}

// Categorías disponibles para proveedores
export const CATEGORIAS_PROVEEDOR = [
  "Medicamentos",
  "Equipos Médicos",
  "Material de Curación",
  "Alimentos",
  "Suplementos",
  "Insumos Veterinarios",
  "Otros",
] as const;

// Datos iniciales de compras (compartidos entre módulos)
export const comprasData: Compra[] = [
  {
    id: 1,
    numeroOrden: "OC-001",
    proveedor: "Alimentos San José S.A.",
    fecha: "2024-01-15",
    fechaEntrega: "2024-01-20",
    estado: "Aprobada",
    items: 2,
    subtotal: 4201.68,
    impuestos: 798.32,
    total: 5000.0,
    observaciones: "Entrega en Bodega Principal",
    bodega: "Bodega Principal",
    productos: [
      {
        producto: productosData[0],
        cantidad: 10,
        precio: 250,
        subtotal: 2500,
      },
      {
        producto: productosData[1],
        cantidad: 20,
        precio: 85.084,
        subtotal: 1701.68,
      },
    ],
  },
  {
    id: 2,
    numeroOrden: "OC-002",
    proveedor: "Veterinaria La Esperanza",
    fecha: "2024-01-14",
    fechaEntrega: "2024-01-18",
    estado: "Aprobada",
    items: 2,
    subtotal: 2373.95,
    impuestos: 451.05,
    total: 2825.0,
    observaciones: "Productos refrigerados",
    bodega: "Bodega Secundaria",
    productos: [
      {
        producto: productosData[2],
        cantidad: 15,
        precio: 120,
        subtotal: 1800,
      },
      {
        producto: productosData[3],
        cantidad: 8,
        precio: 71.74,
        subtotal: 573.95,
      },
    ],
  },
  {
    id: 3,
    numeroOrden: "OC-003",
    proveedor: "Distribuidora Agropecuaria",
    fecha: "2024-01-16",
    fechaEntrega: "2024-01-22",
    estado: "Pendiente",
    items: 3,
    subtotal: 8071.01,
    impuestos: 1533.99,
    total: 9605.0,
    observaciones: "Urgente - Prioridad alta",
    bodega: "Bodega Medellín",
    productos: [
      {
        producto: productosData[0],
        cantidad: 20,
        precio: 250,
        subtotal: 5000,
      },
      {
        producto: productosData[1],
        cantidad: 25,
        precio: 85.084,
        subtotal: 2127.1,
      },
      {
        producto: productosData[4],
        cantidad: 12,
        precio: 78.66,
        subtotal: 943.91,
      },
    ],
  },
  {
    id: 4,
    numeroOrden: "OC-004",
    proveedor: "Suplementos Nutricionales",
    fecha: "2024-01-13",
    fechaEntrega: "2024-01-17",
    estado: "Aprobada",
    items: 2,
    subtotal: 3037.82,
    impuestos: 577.18,
    total: 3615.0,
    observaciones: "Entrega completa",
    bodega: "Bodega Principal",
    productos: [
      {
        producto: productosData[1],
        cantidad: 30,
        precio: 85.084,
        subtotal: 2552.52,
      },
      {
        producto: productosData[5],
        cantidad: 5,
        precio: 97.06,
        subtotal: 485.3,
      },
    ],
  },
  {
    id: 5,
    numeroOrden: "OC-005",
    proveedor: "Alimentos San José S.A.",
    fecha: "2024-01-12",
    fechaEntrega: "2024-01-15",
    estado: "Pendiente",
    items: 1,
    subtotal: 1424.37,
    impuestos: 270.63,
    total: 1695.0,
    observaciones: "Orden pendiente de aprobación",
    bodega: "Bodega Principal",
    productos: [
      {
        producto: productosData[6],
        cantidad: 18,
        precio: 79.13,
        subtotal: 1424.37,
      },
    ],
  },
];