import { productosData, type Producto } from "./productos";

export interface Cotizacion {
  id: number;
  numeroCotizacion: string;
  cliente: string;
  fecha: string;
  fechaVencimiento: string;
  estado: "Pendiente" | "Aprobada" | "Rechazada" | "Vencida";
  items: number;
  subtotal: number;
  impuestos: number;
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

export const cotizacionesData: Cotizacion[] = [
  {
    id: 1,
    numeroCotizacion: "COT-001",
    cliente: "Juan Carlos Pérez Rodríguez",
    fecha: "2024-01-15",
    fechaVencimiento: "2024-01-22",
    estado: "Pendiente",
    items: 2,
    subtotal: 1240336.13,
    impuestos: 234663.87,
    total: 1475000,
    observaciones: "Cotización para compra de productos de cerdo",
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
    numeroCotizacion: "COT-002",
    cliente: "María Fernanda García López",
    fecha: "2024-01-14",
    fechaVencimiento: "2024-01-21",
    estado: "Aprobada",
    items: 1,
    subtotal: 793277.31,
    impuestos: 150722.69,
    total: 944000,
    observaciones: "Cliente aprobó cotización",
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
    numeroCotizacion: "COT-003",
    cliente: "Distribuidora ABC S.A.S.",
    fecha: "2024-01-16",
    fechaVencimiento: "2024-01-23",
    estado: "Pendiente",
    items: 2,
    subtotal: 1743697.48,
    impuestos: 331302.52,
    total: 2075000,
    observaciones: "Pendiente de aprobación del cliente",
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