export type EstadoRemisionKey = "PENDIENTE" | "APLICADA" | "ANULADA" | "OTRO";

export type RemisionCompraItemUI = {
  id_detalle_remision_compra?: number;
  id_producto: number;
  productoNombre: string;
  cantidad: number;
  precio_unitario: number;
  id_iva: number;
  ivaPorcentaje: number;
  lote: string;
  fecha_vencimiento: string;
  codigo_barras: string;
  cod_barras?: string;
  nota: string;
};

export type RemisionCompraUI = {
  id: number;
  numeroRemision: string;
  fecha: string;
  fechaVencimiento: string;
  observaciones: string;
  ordenCompraId: number;
  ordenCompra: string;

  proveedorId: number;
  proveedor: string;
  proveedorTipoDocumento: string;
  proveedorNumeroDocumento: string;

  estadoId: number;
  estado: string;
  estadoKey: EstadoRemisionKey;

  idUsuarioCreador: number;
  idFactura: number | null;
  afectaExistencias: boolean;
  fechaAplicacionExistencias: string;
  idUsuarioAplicoExistencias: number | null;

  idBodega: number;
  bodega: string;

  itemsCount: number;
  items: RemisionCompraItemUI[];
  total: number;
};

export type CompraOption = {
  id: number;
  codigo: string;
  proveedorId: number;
  proveedorNombre: string;
  proveedorTipoDocumento: string;
  proveedorNumeroDocumento: string;
  idBodega: number;
  bodegaNombre: string;
  estado: string;
};

export type CompraDetailItem = {
  idProducto: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  idIva: number;
  ivaPorcentaje: number;
  codigoBarras: string;
};

export type CompraDetail = {
  id: number;
  codigo: string;
  proveedorId: number;
  proveedorNombre: string;
  proveedorTipoDocumento: string;
  proveedorNumeroDocumento: string;
  idBodega: number;
  bodegaNombre: string;
  numeroRemisionSugerido: string;
  items: CompraDetailItem[];
};

export type CreateRemisionCompraPayload = {
  id_compra: number;
  id_proveedor: number;
  id_bodega: number;
  id_factura?: number;
  fecha_vencimiento?: string;
  observaciones?: string;
  detalle_remision_compra: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
    id_iva: number;
    lote?: string;
    fecha_vencimiento?: string;
    codigo_barras?: string;
    nota?: string;
  }>;
};

export type UpdateRemisionCompraPayload = {
  id_factura?: number | null;
  fecha_vencimiento?: string | null;
  observaciones?: string;
  detalle_remision_compra?: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
    id_iva: number;
    lote?: string;
    fecha_vencimiento?: string;
    codigo_barras?: string;
    nota?: string;
  }>;
};

export type CambiarEstadoRemisionCompraPayload = {
  id_estado_remision_compra: number;
};
