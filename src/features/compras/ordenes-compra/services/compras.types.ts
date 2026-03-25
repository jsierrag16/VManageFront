export type BasicOption = {
  id: number;
  nombre: string;
  estado?: boolean;
};

export type ProveedorOption = BasicOption & {
  numeroDocumento: string;
  idTipoDocumento: number | null;
  tipoDocumento: string;
};

export type IvaOption = {
  id: number;
  nombre: string;
  porcentaje: number;
  estado?: boolean;
};

export type ProductoOrden = {
  producto: BasicOption;
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva: number;
  ivaNombre: string;
  ivaPorcentaje: number;
};

export type CompraEstado = "Pendiente" | "Aprobada" | "Anulada";

export type Compra = {
  id: number;
  numeroOrden: string;
  fecha: string;
  fechaEntrega: string;
  estado: CompraEstado;
  observaciones: string;
  subtotal: number;
  impuestos: number;
  total: number;
  items: number;

  proveedorId: number;
  proveedor: string;
  proveedorNumeroDocumento: string;
  proveedorTipoDocumento: string;

  terminoPagoId: number;
  terminoPago: string;

  bodegaId: number;
  bodega: string;

  productos?: ProductoOrden[];
};

export type CompraCreatePayload = {
  id_bodega: number;
  id_proveedor: number;
  id_termino_pago: number;
  descripcion?: string;
  fecha_entrega?: string;
  detalle: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
    id_iva: number;
  }>;
};
