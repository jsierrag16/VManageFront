import api from "../../../shared/services/api";

export type EstadoRemisionKey = "PENDIENTE" | "APLICADA" | "ANULADA" | "OTRO";

export const ESTADO_REMISION_IDS = {
  PENDIENTE: 1,
  APLICADA: 3,
  ANULADA: 4,
} as const;

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[];
      page?: number;
      total?: number;
      pages?: number;
      limit?: number;
    };

const unwrapList = <T>(payload: ApiListResponse<T> | null | undefined): T[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringValue = (value: unknown, fallback = ""): string => {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
};

const toInputDate = (value: unknown): string => {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const resolveEstadoKey = (
  idEstado: number,
  nombreEstado: unknown
): EstadoRemisionKey => {
  if (idEstado === ESTADO_REMISION_IDS.PENDIENTE) return "PENDIENTE";
  if (idEstado === ESTADO_REMISION_IDS.APLICADA) return "APLICADA";
  if (idEstado === ESTADO_REMISION_IDS.ANULADA) return "ANULADA";

  const raw = toStringValue(nombreEstado).trim().toLowerCase();

  if (["pendiente"].includes(raw)) return "PENDIENTE";

  if (
    ["recibida", "recibido", "aprobada", "aprobado", "confirmada", "confirmado"].includes(raw)
  ) {
    return "APLICADA";
  }

  if (["anulada", "anulado", "cancelada", "cancelado"].includes(raw)) {
    return "ANULADA";
  }

  return "OTRO";
};

export type CompraDetalleItem = {
  idProducto: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  idIva: number;
  ivaPorcentaje: number;
  codigoBarras: string;
};

export type CompraOption = {
  id: number;
  codigo: string;
  proveedorId: number;
  proveedorNombre: string;
  idBodega: number;
  bodegaNombre: string;
  estado: string;
};

export type CompraDetail = CompraOption & {
  items: CompraDetalleItem[];
};

export type RemisionCompraItemUI = {
  id?: number;
  id_producto: number;
  productoNombre: string;
  cantidad: number;
  precio_unitario: number;
  id_iva: number;
  ivaPorcentaje: number;
  lote: string;
  fecha_vencimiento: string;
  cod_barras: string;
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
  idBodega: number;
  bodega: string;
  estado: string;
  estadoKey: EstadoRemisionKey;
  idEstado: number;
  afectaExistencias: boolean;
  idFactura: number | null;
  items: RemisionCompraItemUI[];
  itemsCount: number;
  total: number;
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
    cod_barras?: string;
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
    cod_barras?: string;
    nota?: string;
  }>;
};

export type CambiarEstadoRemisionCompraPayload = {
  id_estado_remision_compra: number;
};

const mapCompraBase = (raw: any): CompraOption => {
  return {
    id: toNumber(raw?.id_compra),
    codigo: toStringValue(raw?.codigo_compra),
    proveedorId: toNumber(raw?.id_proveedor),
    proveedorNombre: toStringValue(
      raw?.proveedor?.nombre_empresa ?? raw?.nombre_empresa ?? raw?.proveedor_nombre
    ),
    idBodega: toNumber(raw?.id_bodega),
    bodegaNombre: toStringValue(
      raw?.bodega?.nombre_bodega ?? raw?.nombre_bodega ?? raw?.bodega_nombre
    ),
    estado: toStringValue(
      raw?.estado_compra?.nombre_estado ?? raw?.nombre_estado ?? ""
    ),
  };
};

const mapCompraDetalleItem = (raw: any): CompraDetalleItem => {
  return {
    idProducto: toNumber(raw?.id_producto),
    productoNombre: toStringValue(
      raw?.producto?.nombre_producto ?? raw?.nombre_producto ?? raw?.productoNombre
    ),
    cantidad: toNumber(raw?.cantidad),
    precioUnitario: toNumber(raw?.precio_unitario),
    idIva: toNumber(raw?.id_iva),
    ivaPorcentaje: toNumber(
      raw?.iva?.porcentaje ?? raw?.porcentaje_iva ?? raw?.ivaPorcentaje
    ),
    codigoBarras: toStringValue(
      raw?.producto?.codigo_barras ??
        raw?.producto?.cod_barras ??
        raw?.codigo_barras ??
        raw?.cod_barras
    ),
  };
};

const mapCompraDetail = (raw: any): CompraDetail => {
  const base = mapCompraBase(raw);
  const detalleRaw = unwrapList<any>(raw?.detalle_compra);

  return {
    ...base,
    items: detalleRaw.map(mapCompraDetalleItem),
  };
};

const mapRemisionItem = (raw: any): RemisionCompraItemUI => {
  return {
    id:
      raw?.id_detalle_remision_compra != null
        ? toNumber(raw.id_detalle_remision_compra)
        : undefined,
    id_producto: toNumber(raw?.id_producto),
    productoNombre: toStringValue(
      raw?.producto?.nombre_producto ?? raw?.nombre_producto ?? raw?.productoNombre
    ),
    cantidad: toNumber(raw?.cantidad),
    precio_unitario: toNumber(raw?.precio_unitario),
    id_iva: toNumber(raw?.id_iva),
    ivaPorcentaje: toNumber(
      raw?.iva?.porcentaje ?? raw?.porcentaje_iva ?? raw?.ivaPorcentaje
    ),
    lote: toStringValue(raw?.lote),
    fecha_vencimiento: toInputDate(raw?.fecha_vencimiento),
    cod_barras: toStringValue(raw?.cod_barras ?? raw?.codigo_barras),
    nota: toStringValue(raw?.nota),
  };
};

const calcularTotal = (items: RemisionCompraItemUI[]) => {
  return items.reduce((acc, item) => {
    const base = item.cantidad * item.precio_unitario;
    const iva = base * (item.ivaPorcentaje / 100);
    return acc + base + iva;
  }, 0);
};

const mapRemision = (raw: any): RemisionCompraUI => {
  const detalleRaw = unwrapList<any>(raw?.detalle_remision_compra);
  const items = detalleRaw.map(mapRemisionItem);

  const idEstado = toNumber(raw?.id_estado_remision_compra);
  const estadoNombre = toStringValue(
    raw?.estado_remision_compra?.nombre_estado ??
      raw?.nombre_estado ??
      raw?.estado,
    "Pendiente"
  );

  return {
    id: toNumber(raw?.id_remision_compra),
    numeroRemision: toStringValue(
      raw?.codigo_remision_compra ?? raw?.numeroRemision
    ),
    fecha: toInputDate(raw?.fecha_creacion ?? raw?.fecha),
    fechaVencimiento: toInputDate(raw?.fecha_vencimiento),
    observaciones: toStringValue(raw?.observaciones),
    ordenCompraId: toNumber(raw?.id_compra),
    ordenCompra: toStringValue(
      raw?.compras?.codigo_compra ??
        raw?.compra?.codigo_compra ??
        raw?.codigo_compra
    ),
    proveedorId: toNumber(raw?.id_proveedor),
    proveedor: toStringValue(
      raw?.proveedor?.nombre_empresa ?? raw?.nombre_empresa ?? raw?.proveedorNombre
    ),
    idBodega: toNumber(raw?.id_bodega),
    bodega: toStringValue(
      raw?.bodega?.nombre_bodega ?? raw?.nombre_bodega ?? raw?.bodegaNombre
    ),
    estado: estadoNombre,
    estadoKey: resolveEstadoKey(idEstado, estadoNombre),
    idEstado,
    afectaExistencias: Boolean(raw?.afecta_existencias),
    idFactura:
      raw?.id_factura == null || raw?.id_factura === ""
        ? null
        : toNumber(raw?.id_factura),
    items,
    itemsCount:
      items.length ||
      toNumber(raw?._count?.detalle_remision_compra) ||
      toNumber(raw?.itemsCount) ||
      toNumber(raw?.total_items),
    total: calcularTotal(items),
  };
};

export async function getRemisionesCompra(params?: { idCompra?: number }) {
  const response = await api.get("/remisiones-compra", {
    params: params?.idCompra ? { idCompra: params.idCompra } : undefined,
  });

  return unwrapList<any>(response.data).map(mapRemision);
}

export async function getRemisionCompraById(id: number) {
  const response = await api.get(`/remisiones-compra/${id}`);
  return mapRemision(response.data);
}

export async function createRemisionCompra(payload: CreateRemisionCompraPayload) {
  const response = await api.post("/remisiones-compra", payload);
  return mapRemision(response.data);
}

export async function updateRemisionCompra(
  id: number,
  payload: UpdateRemisionCompraPayload
) {
  const response = await api.put(`/remisiones-compra/${id}`, payload);
  return mapRemision(response.data);
}

export async function cambiarEstadoRemisionCompra(
  id: number,
  payload: CambiarEstadoRemisionCompraPayload
) {
  const response = await api.patch(`/remisiones-compra/${id}/estado`, payload);
  return mapRemision(response.data);
}

export async function getComprasOptions() {
  const response = await api.get("/compras");
  return unwrapList<any>(response.data).map(mapCompraBase);
}

export async function getCompraById(id: number) {
  const response = await api.get(`/compras/${id}`);
  return mapCompraDetail(response.data);
}

