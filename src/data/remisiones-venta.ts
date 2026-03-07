import type { Producto } from "./productos";

export interface ProductoRemisionVenta {
  producto: Producto;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface RemisionVenta {
  id: number;
  numeroRemision: string;
  ordenVenta: string;
  cliente: string;
  fecha: string;
  estado: "Pendiente" | "Aprobada" | "Facturada" | "Anulada";
  items: number;
  total: number;
  observaciones: string;
  productos?: ProductoRemisionVenta[];
  bodega: string;
}

export const remisionesVentaData: RemisionVenta[] = [
  {
    id: 1,
    numeroRemision: "RV-001",
    ordenVenta: "ORD-001",
    cliente: "Juan Carlos Pérez Rodríguez",
    fecha: "2024-01-15",
    estado: "Aprobada",
    items: 12,
    total: 16950.0,
    observaciones: "Remisión lista para facturar",
    bodega: "Bodega Principal",
  },
  {
    id: 2,
    numeroRemision: "RV-002",
    ordenVenta: "ORD-002",
    cliente: "María Fernanda García López",
    fecha: "2024-01-14",
    estado: "Facturada",
    items: 8,
    total: 9605.0,
    observaciones: "Factura #F-001 generada",
    bodega: "Bodega Secundaria",
  },
  {
    id: 3,
    numeroRemision: "RV-003",
    ordenVenta: "ORD-003",
    cliente: "Distribuidora ABC S.A.S.",
    fecha: "2024-01-16",
    estado: "Pendiente",
    items: 5,
    total: 5876.0,
    observaciones: "Esperando aprobación",
    bodega: "Bodega Medellín",
  },
  {
    id: 4,
    numeroRemision: "RV-004",
    ordenVenta: "ORD-004",
    cliente: "Juan Carlos Pérez Rodríguez",
    fecha: "2024-01-13",
    estado: "Facturada",
    items: 10,
    total: 13560.0,
    observaciones: "Entrega completa - Factura #F-002",
    bodega: "Bodega Principal",
  },
  {
    id: 5,
    numeroRemision: "RV-005",
    ordenVenta: "ORD-005",
    cliente: "Distribuidora ABC S.A.S.",
    fecha: "2024-01-12",
    estado: "Anulada",
    items: 3,
    total: 2825.0,
    observaciones: "Anulada por solicitud del cliente",
    bodega: "Bodega Medellín",
  },
];