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
};

export type CatalogosPagosAbonosResponse = {
  metodos_pago: MetodoPagoApi[];
  estados_factura: EstadoFacturaApi[];
};

export type CreateFacturaPayload = {
  id_cliente: number;
  id_remisiones: number[];
  fecha_factura: string;
  fecha_vencimiento?: string;
  nota?: string;
};

export type CreateAbonoPayload = {
  fecha_pago: string;
  valor: number;
  id_metodo: number;
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
};