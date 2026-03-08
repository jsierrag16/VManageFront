// Tipos de ítems de remisión de compra
export interface ItemRemisionCompra {
  producto: string;
  productoNombre: string;
  numeroLote: string;
  cantidad: number;
  fechaVencimiento: string;
}

// Tipo de remisión de compra
export interface RemisionCompra {
  id: number;
  numeroRemision: string;
  ordenCompra: string;
  proveedor: string;
  fecha: string;
  estado: "Pendiente" | "Aprobada" | "Anulada";
  items: ItemRemisionCompra[];
  total: number;
  observaciones: string;
  bodega: string;
}

// Datos iniciales de remisiones de compra
export const remisionesCompraData: RemisionCompra[] = [
  {
    id: 1,
    numeroRemision: "RC-001",
    ordenCompra: "OC-001",
    proveedor: "Alimentos San José S.A.",
    fecha: "2024-01-15",
    estado: "Aprobada",
    bodega: "Bodega Principal",
    items: [
      {
        producto: "PROD-001",
        productoNombre: "Concentrado Inicial Lechones",
        numeroLote: "AL-2024-001",
        cantidad: 100,
        fechaVencimiento: "2025-06-15",
      },
    ],
    total: 5650.0,
    observaciones: "Mercancía recibida conforme",
  },
  {
    id: 2,
    numeroRemision: "RC-002",
    ordenCompra: "OC-002",
    proveedor: "Veterinaria La Esperanza",
    fecha: "2024-01-14",
    estado: "Aprobada",
    bodega: "Bodega Secundaria",
    items: [
      {
        producto: "PROD-004",
        productoNombre: "Vitamina ADE Inyectable",
        numeroLote: "VIT-2024-034",
        cantidad: 50,
        fechaVencimiento: "2026-02-10",
      },
    ],
    total: 2825.0,
    observaciones: "Ingresado a inventario",
  },
  {
    id: 3,
    numeroRemision: "RC-003",
    ordenCompra: "OC-003",
    proveedor: "Distribuidora Agropecuaria",
    fecha: "2024-01-16",
    estado: "Pendiente",
    bodega: "Bodega Medellín",
    items: [
      {
        producto: "PROD-002",
        productoNombre: "Concentrado Levante",
        numeroLote: "AL-2024-012",
        cantidad: 150,
        fechaVencimiento: "2025-07-30",
      },
    ],
    total: 9605.0,
    observaciones: "Esperando recepción",
  },
  {
    id: 4,
    numeroRemision: "RC-004",
    ordenCompra: "OC-004",
    proveedor: "Suplementos Nutricionales",
    fecha: "2024-01-13",
    estado: "Aprobada",
    bodega: "Bodega Principal",
    items: [
      {
        producto: "PROD-012",
        productoNombre: "Premezcla Minerales",
        numeroLote: "VIT-2024-113",
        cantidad: 75,
        fechaVencimiento: "2026-09-10",
      },
    ],
    total: 3616.0,
    observaciones: "Procesado completamente",
  },
  {
    id: 5,
    numeroRemision: "RC-005",
    ordenCompra: "OC-005",
    proveedor: "Alimentos San José S.A.",
    fecha: "2024-01-12",
    estado: "Pendiente",
    bodega: "Bodega Medellín",
    items: [
      {
        producto: "PROD-003",
        productoNombre: "Concentrado Engorde",
        numeroLote: "AL-2024-023",
        cantidad: 80,
        fechaVencimiento: "2025-08-25",
      },
    ],
    total: 1695.0,
    observaciones: "Pendiente de aprobación",
  },
];