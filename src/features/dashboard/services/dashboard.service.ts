import api from "@/shared/services/api";

export type DashboardResumenResponse = {
  bodega: {
    id_bodega: number | null;
    nombre_bodega: string;
    ids_bodegas: number[];
    total_bodegas: number;
  };
  periodo: {
    etiqueta: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  ventas: {
    total_mes_actual: number;
    cotizaciones_pendientes: number;
    ordenes_pendientes: number;
    remisiones_pendientes_facturar: number;
    facturas_pendientes_cobro: number;
    saldo_pendiente_cobro: number;
  };
  compras: {
    total_mes_actual: number;
    ordenes_pendientes: number;
    remisiones_pendientes: number;
  };
  inventario: {
    productos_con_stock: number;
    productos_stock_bajo: number;
    lotes_por_vencer: number;
    umbral_stock_bajo: number;
  };
  terceros: {
    clientes_activos: number;
    proveedores_activos: number;
  };
  logistica: {
    traslados_pendientes: number;
  };
};

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const unwrapResponse = <T = any>(response: any): T => {
  return (response?.data?.data ?? response?.data ?? response) as T;
};

const normalizeResumen = (raw: any): DashboardResumenResponse => {
  return {
    bodega: {
      id_bodega:
        raw?.bodega?.id_bodega === null || raw?.bodega?.id_bodega === undefined
          ? null
          : toNumber(raw?.bodega?.id_bodega),
      nombre_bodega: String(raw?.bodega?.nombre_bodega ?? "Todas las bodegas"),
      ids_bodegas: Array.isArray(raw?.bodega?.ids_bodegas)
        ? raw.bodega.ids_bodegas.map((item: unknown) => toNumber(item))
        : [],
      total_bodegas: toNumber(raw?.bodega?.total_bodegas),
    },
    periodo: {
      etiqueta: String(raw?.periodo?.etiqueta ?? ""),
      fecha_inicio: String(raw?.periodo?.fecha_inicio ?? ""),
      fecha_fin: String(raw?.periodo?.fecha_fin ?? ""),
    },
    ventas: {
      total_mes_actual: toNumber(raw?.ventas?.total_mes_actual),
      cotizaciones_pendientes: toNumber(raw?.ventas?.cotizaciones_pendientes),
      ordenes_pendientes: toNumber(raw?.ventas?.ordenes_pendientes),
      remisiones_pendientes_facturar: toNumber(
        raw?.ventas?.remisiones_pendientes_facturar,
      ),
      facturas_pendientes_cobro: toNumber(
        raw?.ventas?.facturas_pendientes_cobro,
      ),
      saldo_pendiente_cobro: toNumber(raw?.ventas?.saldo_pendiente_cobro),
    },
    compras: {
      total_mes_actual: toNumber(raw?.compras?.total_mes_actual),
      ordenes_pendientes: toNumber(raw?.compras?.ordenes_pendientes),
      remisiones_pendientes: toNumber(raw?.compras?.remisiones_pendientes),
    },
    inventario: {
      productos_con_stock: toNumber(raw?.inventario?.productos_con_stock),
      productos_stock_bajo: toNumber(raw?.inventario?.productos_stock_bajo),
      lotes_por_vencer: toNumber(raw?.inventario?.lotes_por_vencer),
      umbral_stock_bajo: toNumber(raw?.inventario?.umbral_stock_bajo),
    },
    terceros: {
      clientes_activos: toNumber(raw?.terceros?.clientes_activos),
      proveedores_activos: toNumber(raw?.terceros?.proveedores_activos),
    },
    logistica: {
      traslados_pendientes: toNumber(raw?.logistica?.traslados_pendientes),
    },
  };
};

export const dashboardService = {
  async getResumen(
    idBodega?: number | null,
  ): Promise<DashboardResumenResponse> {
    const response = await api.get("/dashboard/resumen", {
      params: {
        id_bodega:
          idBodega === null || idBodega === undefined ? undefined : idBodega,
      },
    });

    return normalizeResumen(unwrapResponse(response));
  },
};