import api from "@/shared/services/api";

export type MetodoPagoApi = {
  id_metodo: number;
  nombre_metodo: string;
};

export type EstadoFacturaApi = {
  id_estado_factura: number;
  nombre_estado_factura: string;
};

export type ResumenRemisionApi = {
  subtotal: number;
  total_iva: number;
  total: number;
};

export type ResumenPagoFacturaApi = {
  subtotal: number;
  total_iva: number;
  total_factura: number;
  total_abonado: number;
  saldo_pendiente: number;
};

export type RemisionPendienteApi = {
  id_remision_venta: number;
  codigo_remision_venta: string | null;
  fecha_creacion: string;
  fecha_vencimiento: string | null;
  observaciones: string | null;
  id_cliente: number;
  id_factura: number | null;

  orden_venta?: {
    id_orden_venta: number;
    codigo_orden_venta?: string | null;
    id_bodega?: number;
    bodega?: {
      id_bodega: number;
      nombre_bodega: string;
    } | null;
  } | null;

  cliente?: {
    id_cliente: number;
    nombre_cliente?: string;
    num_documento?: string;
  } | null;

  estado_remision_venta?: {
    id_estado_remision_venta: number;
    nombre_estado: string;
  } | null;

  resumen?: ResumenRemisionApi;
};

export type PagoAbonoApi = {
  id_pago: number;
  fecha_pago: string;
  estado: boolean;
  valor: number | string;
  id_metodo: number;
  id_factura: number;
  metodo_pago?: MetodoPagoApi | null;
  id_usuario_registro?: number | null;
  fecha_anulacion?: string | null;
  id_usuario_anulo?: number | null;
  usuario_registro?: UsuarioGestionApi | null;
  usuario_anulo?: UsuarioGestionApi | null;
};

export type FacturaApi = {
  id_factura: number;
  codigo_factura: string;
  fecha_factura: string;
  fecha_vencimiento: string | null;
  total: number | string;
  nota: string | null;
  id_cliente: number;
  id_estado_factura: number;

  id_usuario_creador?: number | null;
  fecha_anulacion?: string | null;
  id_usuario_anulo?: number | null;
  usuario_creador?: UsuarioGestionApi | null;
  usuario_anulo?: UsuarioGestionApi | null;

  cliente?: {
    id_cliente: number;
    codigo_cliente?: string;
    nombre_cliente?: string;
    num_documento?: string;
  } | null;

  estado_factura?: EstadoFacturaApi | null;
  pagos_abonos: PagoAbonoApi[];
  remision_venta: RemisionPendienteApi[];
  resumen_pago?: ResumenPagoFacturaApi;

  id_bodega?: number | null;
  remisiones_snapshot?: string | null;
  bodega_snapshot?: string | null;
  remisiones_snapshot_data?: RemisionSnapshotPagoApi[] | string | null;

  bodega?: {
    id_bodega: number;
    nombre_bodega: string;
  } | null;
};

export type UsuarioGestionApi = {
  id_usuario: number;
  nombre?: string | null;
  apellido?: string | null;
};

export type CatalogosPagosAbonosResponse = {
  metodos_pago: MetodoPagoApi[];
  estados_factura: EstadoFacturaApi[];
};

export type CreateFacturaPayload = {
  id_cliente: number;
  id_remisiones: number[];
  fecha_factura: string;
  fecha_vencimiento: string;
  nota?: string;
};

export type CreateAbonoPayload = {
  fecha_pago: string;
  valor: number;
  id_metodo: number;
};

export type RemisionSnapshotPagoApi = {
  id_remision_venta: number;
  codigo_remision_venta: string | null;
  fecha_creacion: string | null;
  fecha_vencimiento: string | null;
  id_orden_venta: number | null;
  codigo_orden_venta: string | null;
  id_bodega: number | null;
  nombre_bodega: string | null;
  estado_remision: string | null;
  subtotal: number;
  total_iva: number;
  total: number;
};

export type ClientePagoApi = {
  id_cliente: number;
  codigo_cliente?: string | null;
  nombre_cliente: string;
  num_documento: string;
  estado?: boolean;
  remisiones_pendientes_count?: number;

  tipo_documento?: {
    id_tipo_doc: number;
    nombre_doc: string;
  } | null;
};

function unwrapResponse<T>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

export const pagosAbonosService = {
  async getCatalogos() {
    const response = await api.get("/pagos-abonos/catalogos");
    return unwrapResponse<CatalogosPagosAbonosResponse>(response);
  },

  async getRemisionesPendientesByCliente(
    idCliente: number,
    idBodega?: number,
  ) {
    const response = await api.get(
      `/pagos-abonos/clientes/${idCliente}/remisiones-pendientes`,
      {
        params: {
          id_bodega: idBodega && idBodega > 0 ? idBodega : undefined,
        },
      },
    );

    return unwrapResponse<RemisionPendienteApi[]>(response);
  },

  async getFacturas(idBodega?: number) {
    const response = await api.get("/pagos-abonos/facturas", {
      params: {
        id_bodega: idBodega && idBodega > 0 ? idBodega : undefined,
      },
    });

    return unwrapResponse<FacturaApi[]>(response);
  },

  async getFacturasByCliente(idCliente: number, idBodega?: number) {
    const response = await api.get(`/pagos-abonos/clientes/${idCliente}/facturas`, {
      params: {
        id_bodega: idBodega && idBodega > 0 ? idBodega : undefined,
      },
    });

    return unwrapResponse<FacturaApi[]>(response);
  },

  async getClientesConRemisionesPendientes(idBodega?: number) {
    const response = await api.get(
      "/pagos-abonos/clientes-con-remisiones-pendientes",
      {
        params: {
          id_bodega: idBodega && idBodega > 0 ? idBodega : undefined,
        },
      },
    );

    return unwrapResponse<ClientePagoApi[]>(response);
  },

  async getFactura(idFactura: number) {
    const response = await api.get(`/pagos-abonos/facturas/${idFactura}`);
    return unwrapResponse<FacturaApi>(response);
  },

  async createFactura(payload: CreateFacturaPayload) {
    const response = await api.post("/pagos-abonos/facturas", payload);
    return unwrapResponse<FacturaApi>(response);
  },

  async addAbono(idFactura: number, payload: CreateAbonoPayload) {
    const response = await api.post(
      `/pagos-abonos/facturas/${idFactura}/abonos`,
      payload,
    );
    return unwrapResponse<FacturaApi>(response);
  },

  async anularAbono(idPago: number) {
    const response = await api.patch(`/pagos-abonos/abonos/${idPago}/anular`);
    return unwrapResponse<{ message: string; factura: FacturaApi }>(response);
  },

  async anularFactura(idFactura: number) {
    const response = await api.patch(
      `/pagos-abonos/facturas/${idFactura}/anular`,
    );

    return unwrapResponse<{ message: string; factura: FacturaApi }>(response);
  },
};