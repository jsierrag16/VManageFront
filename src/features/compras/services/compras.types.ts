export type CompraEstado = "Pendiente" | "Aprobada" | "Anulada";

export const ESTADO_COMPRA_IDS = {
  Pendiente: 1,
  Aprobada: 2,
  Anulada: 3,
} as const;
// Ajusta estos ids si tu tabla estado_compra usa otros valores.

export type ProductoOrdenUI = {
  producto: {
    id: number;
    nombre: string;
  };
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva: number;
  ivaPorcentaje: number;
  ivaNombre: string;
};

export type CompraUI = {
  id: number;
  numeroOrden: string;
  proveedor: string;
  proveedorId: number;
  terminoPago: string;
  terminoPagoId: number;
  fecha: string;
  fechaEntrega: string;
  estado: CompraEstado;
  estadoId: number;
  items: number;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  bodega: string;
  bodegaId: number;
  productos: ProductoOrdenUI[];
};

export type CompraDetallePayload = {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  id_iva: number;
};

export type CreateCompraPayload = {
  id_proveedor: number;
  id_termino_pago: number;
  descripcion?: string;
  fecha_entrega?: string;
  detalle: CompraDetallePayload[];
};

export type UpdateCompraPayload = Partial<CreateCompraPayload> & {
  id_estado_compra?: number;
};

export type BasicOption = {
  id: number;
  nombre: string;
  estado?: boolean;
};

export type IvaOption = {
  id: number;
  nombre: string;
  porcentaje: number;
  estado?: boolean;
};

export type ProductoOption = {
  id: number;
  nombre: string;
  estado?: boolean;
};
