export type CatalogoCliente = {
  id_cliente: number;
  nombre_cliente?: string;
  nombre?: string;
  num_documento?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  estado?: boolean | string;
};

export type CatalogoProducto = {
  id_producto: number;
  nombre_producto?: string;
  nombre?: string;
  precio_venta?: number;
  precio?: number;
  precio_minimo_venta?: number | null;
  estado?: boolean;
  categoria_producto?: {
    id_categoria_producto?: number;
    nombre_categoria?: string;
  };
  iva?: {
    id_iva?: number;
    porcentaje?: number;
  };
};

export type CatalogoTerminoPago = {
  id_termino_pago: number;
  nombre_termino?: string;
  nombre?: string;
};

export type CatalogoEstadoOrdenVenta = {
  id_estado_orden_venta: number;
  nombre_estado?: string;
  nombre?: string;
};

export type UsuarioGestionOrdenVenta = {
  id_usuario: number;
  nombre?: string | null;
  apellido?: string | null;
};

export type DetalleCotizacionApi = {
  id_detalle_cotizacion?: number;
  id_producto: number;
  cantidad: number | string;
  precio_unitario?: number | string;
  precio?: number | string;
  valor_unitario?: number | string;
  id_iva?: number | null;
  iva_porcentaje?: number | string | null;
  producto?: CatalogoProducto;
};

export type CatalogoCotizacion = {
  id_cotizacion: number;
  codigo_cotizacion?: string;
  numero_cotizacion?: string;
  id_cliente?: number;
  id_bodega?: number;
  cliente?: CatalogoCliente;
  detalle_cotizacion?: DetalleCotizacionApi[];
  orden_venta?: {
    id_orden_venta: number;
  } | null;
};

export type DetalleOrdenVentaApi = {
  id_detalle_orden_venta?: number;
  id_orden_detalle_venta?: number;
  id_producto: number;
  cantidad: number | string;
  precio_unitario: number | string;
  producto?: CatalogoProducto;
};

export type OrdenVentaApi = {
  id_orden_venta: number;
  codigo_orden_venta?: string;
  fecha_creacion?: string;
  fecha_vencimiento?: string | null;
  descripcion?: string | null;
  id_cliente?: number;
  id_bodega?: number;
  id_estado_orden_venta?: number;
  id_termino_pago?: number;
  id_usuario?: number;
  id_cotizacion?: number | null;
  cliente?: CatalogoCliente;
  fecha_aprobacion?: string | null;
  id_usuario_aprobo?: number | null;
  usuario_aprobo?: UsuarioGestionOrdenVenta | null;

  fecha_anulacion?: string | null;
  id_usuario_anulo?: number | null;
  usuario_anulo?: UsuarioGestionOrdenVenta | null;
  bodega?: {
    id_bodega?: number;
    nombre_bodega?: string;
    nombre?: string;
  };
  estado_orden_venta?: CatalogoEstadoOrdenVenta;
  termino_pago?: CatalogoTerminoPago;
  detalle_orden_venta?: DetalleOrdenVentaApi[];
  cotizacion?: CatalogoCotizacion | null;
};

export type CatalogosOrdenVentaResponse = {
  clientes: CatalogoCliente[];
  productos: CatalogoProducto[];
  terminos_pago: CatalogoTerminoPago[];
  estados: CatalogoEstadoOrdenVenta[];
  cotizaciones: CatalogoCotizacion[];
};

export type CreateOrdenVentaPayload = {
  fecha_creacion: string;
  fecha_vencimiento?: string | null;
  descripcion?: string | null;
  id_cliente: number;
  id_bodega: number;
  id_estado_orden_venta: number;
  id_termino_pago: number;
  id_usuario: number;
  id_cotizacion?: number;
  detalle: Array<{
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }>;
};

export type UpdateOrdenVentaPayload = Partial<CreateOrdenVentaPayload>;