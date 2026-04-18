export type CatalogoEstadoRemisionVenta = {
  id_estado_remision_venta: number;
  nombre_estado: string;
};

export type ExistenciaDisponibleApi = {
  id_existencia: number;
  id_producto: number;
  lote?: string | null;
  codigo_barras?: string | null;
  fecha_vencimiento?: string | null;
  cantidad_disponible: number;
  bodega?: {
    id_bodega?: number;
    nombre_bodega?: string;
  };
};

export type OrdenVentaCatalogoApi = {
  id_orden_venta: number;
  codigo_orden_venta: string;
  fecha_creacion?: string;
  fecha_vencimiento?: string | null;
  cantidad_pendiente_total: number;
  cliente?: {
    id_cliente: number;
    nombre_cliente?: string;
    num_documento?: string;
  };
  bodega?: {
    id_bodega?: number;
    nombre_bodega?: string;
  };
  estado_orden_venta?: {
    id_estado_orden_venta?: number;
    nombre_estado?: string;
  };
  detalle: Array<{
    id_producto: number;
    cantidad_orden: number;
    cantidad_remitida: number;
    cantidad_pendiente: number;
    precio_unitario: number;
    producto?: {
      id_producto: number;
      nombre_producto?: string;
      descripcion?: string | null;
      iva?: {
        id_iva?: number;
        porcentaje?: number;
      };
      categoria_producto?: {
        id_categoria_producto?: number;
        nombre_categoria?: string;
      };
    };
    existencias_disponibles: ExistenciaDisponibleApi[];
  }>;
};

export type CatalogosRemisionVentaResponse = {
  estados: CatalogoEstadoRemisionVenta[];
  ordenes: OrdenVentaCatalogoApi[];
};

export type DetalleRemisionVentaApi = {
  id_detalle_remision_venta: number;
  cantidad: number | string;
  precio_unitario: number | string;
  iva?: number | string | null;
  existencias?: {
    id_existencia: number;
    id_producto?: number;
    lote?: string | null;
    codigo_barras?: string | null;
    fecha_vencimiento?: string | null;
    cantidad?: number | string;
    producto?: {
      id_producto?: number;
      nombre_producto?: string;
    };
    bodega?: {
      id_bodega?: number;
      nombre_bodega?: string;
    };
  };
};

export type RemisionVentaApi = {
  id_remision_venta: number;
  codigo_remision_venta?: string | null;
  fecha_creacion?: string;
  fecha_vencimiento?: string | null;
  observaciones?: string | null;
  id_orden_venta: number;
  id_cliente: number;
  id_estado_remision_venta: number;
  id_usuario_creador: number;
  firma_digital?: string | null;
  nombre_firmante?: string | null;
  fecha_firma?: string | null;
  cliente?: {
    id_cliente: number;
    nombre_cliente?: string;
    num_documento?: string;
  };
  orden_venta?: {
    id_orden_venta: number;
    codigo_orden_venta?: string | null;
    bodega?: {
      id_bodega?: number;
      nombre_bodega?: string;
    };
  };
  estado_remision_venta?: {
    id_estado_remision_venta: number;
    nombre_estado?: string;
  };
  detalle_remision_venta?: DetalleRemisionVentaApi[];
};

export type CreateRemisionVentaPayload = {
  fecha_creacion: string;
  fecha_vencimiento?: string | null;
  observaciones?: string | null;
  id_orden_venta: number;
  id_estado_remision_venta: number;
  id_usuario_creador: number;
  detalle: Array<{
    id_producto: number;
    lotes: Array<{
      id_existencia: number;
      cantidad: number;
    }>;
  }>;
  firma_digital?: string | null;
  nombre_firmante?: string | null;
  fecha_firma?: string | null;
};

export type UpdateRemisionVentaPayload = CreateRemisionVentaPayload;