import api from "../../../shared/services/api";

export const ESTADO_REMISION_IDS = {
  PENDIENTE: 1,
  APLICADA: 2, // en backend realmente corresponde a "Recibida"
  ANULADA: 3,
} as const;

type RawRecord = Record<string, any>;

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
  idBodega: number;
  bodegaNombre: string;
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

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const asArray = <T = any>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const unwrapResponse = <T = any>(response: any): T => {
  return response?.data?.data ?? response?.data ?? response;
};

const extractList = <T = any>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const formatDateOnly = (value: unknown) => {
  const str = toStringSafe(value);
  if (!str) return "";
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const buildBodegaParamsVariants = (selectedBodegaId?: number) => {
  if (!selectedBodegaId) return [{}];

  return [
    { idBodega: selectedBodegaId },
    { id_bodega: selectedBodegaId },
    {},
  ];
};

async function getRequestFirstSuccess(
  candidates: Array<{ url: string; params?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.get(candidate.url, {
        params: candidate.params,
      });
      return unwrapResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function postRequestFirstSuccess(
  candidates: Array<{ url: string; data?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.post(candidate.url, candidate.data);
      return unwrapResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function patchRequestFirstSuccess(
  candidates: Array<{ url: string; data?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.patch(candidate.url, candidate.data);
      return unwrapResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

const getEstadoKey = (estado: unknown, afectaExistencias?: boolean): EstadoRemisionKey => {
  const norm = normalizeText(estado);

  if (norm === "anulada") return "ANULADA";
  if (
    afectaExistencias ||
    norm === "recibida" ||
    norm === "aplicada" ||
    norm === "aprobada" ||
    norm === "confirmada"
  ) {
    return "APLICADA";
  }
  if (norm === "pendiente") return "PENDIENTE";

  return "OTRO";
};

const mapRemisionItem = (raw: RawRecord): RemisionCompraItemUI => {
  const cantidad = toNumber(raw?.cantidad);
  const precio = toNumber(raw?.precio_unitario);
  const ivaPorcentaje = toNumber(
    raw?.iva?.porcentaje ?? raw?.iva_porcentaje ?? raw?.porcentaje_iva
  );

  return {
    id_detalle_remision_compra: toNumber(raw?.id_detalle_remision_compra || 0) || undefined,
    id_producto: toNumber(
      raw?.id_producto ?? raw?.producto?.id_producto ?? raw?.producto?.id ?? raw?.idProducto
    ),
    productoNombre: toStringSafe(
      raw?.producto?.nombre_producto ??
        raw?.nombre_producto ??
        raw?.productoNombre
    ),
    cantidad,
    precio_unitario: precio,
    id_iva: toNumber(raw?.id_iva ?? raw?.iva?.id_iva ?? raw?.idIva),
    ivaPorcentaje,
    lote: toStringSafe(raw?.lote),
    fecha_vencimiento: formatDateOnly(raw?.fecha_vencimiento),
    codigo_barras: toStringSafe(raw?.codigo_barras ?? raw?.cod_barras ?? raw?.codigoBarras),
    cod_barras: toStringSafe(raw?.codigo_barras ?? raw?.cod_barras ?? raw?.codigoBarras),
    nota: toStringSafe(raw?.nota),
  };
};

const mapRemision = (raw: RawRecord): RemisionCompraUI => {
  const items = asArray(raw?.detalle_remision_compra).map(mapRemisionItem);

  const total = items.reduce((acc, item) => {
    const subtotal = item.cantidad * item.precio_unitario;
    const iva = subtotal * (item.ivaPorcentaje / 100);
    return acc + subtotal + iva;
  }, 0);

  const estado = toStringSafe(
    raw?.estado_remision_compra?.nombre_estado ?? raw?.estado ?? raw?.nombre_estado
  );

  return {
    id: toNumber(raw?.id_remision_compra ?? raw?.id),
    numeroRemision: toStringSafe(
      raw?.codigo_remision_compra ?? raw?.numeroRemision ?? raw?.codigo
    ),
    fecha: formatDateOnly(raw?.fecha_creacion ?? raw?.fecha),
    fechaVencimiento: formatDateOnly(raw?.fecha_vencimiento),
    observaciones: toStringSafe(raw?.observaciones),
    ordenCompraId: toNumber(raw?.id_compra ?? raw?.compras?.id_compra),
    ordenCompra: toStringSafe(
      raw?.compras?.codigo_compra ?? raw?.ordenCompra ?? raw?.codigo_compra
    ),
    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),
    proveedor: toStringSafe(
      raw?.proveedor?.nombre_empresa ?? raw?.proveedorNombre ?? raw?.nombre_empresa
    ),
    estadoId: toNumber(
      raw?.id_estado_remision_compra ?? raw?.estado_remision_compra?.id_estado_remision_compra
    ),
    estado,
    estadoKey: getEstadoKey(estado, Boolean(raw?.afecta_existencias)),
    idUsuarioCreador: toNumber(raw?.id_usuario_creador ?? raw?.usuario?.id_usuario),
    idFactura:
      raw?.id_factura === null || raw?.id_factura === undefined
        ? null
        : toNumber(raw?.id_factura),
    afectaExistencias: Boolean(raw?.afecta_existencias),
    fechaAplicacionExistencias: formatDateOnly(raw?.fecha_aplicacion_existencias),
    idUsuarioAplicoExistencias:
      raw?.id_usuario_aplico_existencias === null ||
      raw?.id_usuario_aplico_existencias === undefined
        ? null
        : toNumber(raw?.id_usuario_aplico_existencias),
    idBodega: toNumber(raw?.id_bodega ?? raw?.bodega?.id_bodega),
    bodega: toStringSafe(
      raw?.bodega?.nombre_bodega ?? raw?.bodegaNombre ?? raw?.nombre_bodega
    ),
    itemsCount:
      toNumber(raw?._count?.detalle_remision_compra) || items.length || 0,
    items,
    total,
  };
};

const mapCompraOption = (raw: RawRecord): CompraOption => {
  return {
    id: toNumber(raw?.id_compra ?? raw?.id),
    codigo: toStringSafe(raw?.codigo_compra ?? raw?.codigo),
    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),
    proveedorNombre: toStringSafe(
      raw?.proveedor?.nombre_empresa ?? raw?.proveedorNombre ?? raw?.nombre_empresa
    ),
    idBodega: toNumber(raw?.id_bodega ?? raw?.bodega?.id_bodega),
    bodegaNombre: toStringSafe(
      raw?.bodega?.nombre_bodega ?? raw?.bodegaNombre ?? raw?.nombre_bodega
    ),
    estado: toStringSafe(
      raw?.estado_compra?.nombre_estado ?? raw?.estado ?? raw?.nombre_estado
    ),
  };
};

const mapCompraDetailItem = (raw: RawRecord): CompraDetailItem => {
  return {
    idProducto: toNumber(
      raw?.id_producto ?? raw?.producto?.id_producto ?? raw?.producto?.id
    ),
    productoNombre: toStringSafe(
      raw?.producto?.nombre_producto ??
        raw?.nombre_producto ??
        raw?.productoNombre
    ),
    cantidad: toNumber(raw?.cantidad),
    precioUnitario: toNumber(raw?.precio_unitario),
    idIva: toNumber(raw?.id_iva ?? raw?.iva?.id_iva ?? raw?.producto?.id_iva),
    ivaPorcentaje: toNumber(
      raw?.iva?.porcentaje ??
        raw?.iva_porcentaje ??
        raw?.producto?.iva?.porcentaje
    ),
    codigoBarras: toStringSafe(
      raw?.codigo_barras ?? raw?.cod_barras ?? raw?.codigoBarras
    ),
  };
};

const mapCompraDetail = (raw: RawRecord): CompraDetail => {
  const detalle =
    asArray(raw?.detalle_compra).length > 0
      ? asArray(raw?.detalle_compra)
      : asArray(raw?.items).length > 0
        ? asArray(raw?.items)
        : asArray(raw?.detalles);

  return {
    id: toNumber(raw?.id_compra ?? raw?.id),
    codigo: toStringSafe(raw?.codigo_compra ?? raw?.codigo),
    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),
    proveedorNombre: toStringSafe(
      raw?.proveedor?.nombre_empresa ?? raw?.proveedorNombre ?? raw?.nombre_empresa
    ),
    idBodega: toNumber(raw?.id_bodega ?? raw?.bodega?.id_bodega),
    bodegaNombre: toStringSafe(
      raw?.bodega?.nombre_bodega ?? raw?.bodegaNombre ?? raw?.nombre_bodega
    ),
    items: detalle.map(mapCompraDetailItem),
  };
};

export async function getRemisionesCompra(selectedBodegaId?: number) {
  const paramsVariants = buildBodegaParamsVariants(selectedBodegaId);

  const raw = await getRequestFirstSuccess([
    ...paramsVariants.map((params) => ({
      url: "/remisiones-compra",
      params,
    })),
    ...paramsVariants.map((params) => ({
      url: "/remision-compra",
      params,
    })),
  ]);

  return extractList(raw).map(mapRemision);
}

export async function getRemisionCompraById(id: number) {
  const raw = await getRequestFirstSuccess([
    { url: `/remisiones-compra/${id}` },
    { url: `/remision-compra/${id}` },
  ]);

  return mapRemision(raw);
}

export async function createRemisionCompra(payload: CreateRemisionCompraPayload) {
  const raw = await postRequestFirstSuccess([
    { url: "/remisiones-compra", data: payload },
    { url: "/remision-compra", data: payload },
  ]);

  return mapRemision(raw);
}

export async function updateRemisionCompra(
  id: number,
  payload: UpdateRemisionCompraPayload
) {
  const raw = await patchRequestFirstSuccess([
    { url: `/remisiones-compra/${id}`, data: payload },
    { url: `/remision-compra/${id}`, data: payload },
  ]);

  return mapRemision(raw);
}

export async function cambiarEstadoRemisionCompra(
  id: number,
  payload: CambiarEstadoRemisionCompraPayload
) {
  const raw = await patchRequestFirstSuccess([
    { url: `/remisiones-compra/${id}/estado`, data: payload },
    { url: `/remision-compra/${id}/estado`, data: payload },
  ]);

  return mapRemision(raw);
}

export async function getComprasOptions(selectedBodegaId?: number) {
  const paramsVariants = buildBodegaParamsVariants(selectedBodegaId);

  const raw = await getRequestFirstSuccess([
    ...paramsVariants.map((params) => ({
      url: "/compras",
      params,
    })),
    ...paramsVariants.map((params) => ({
      url: "/compras/options",
      params,
    })),
  ]);

  const compras = extractList(raw)
    .map(mapCompraOption)
    .filter((item) => item.id > 0);

  const unique = Array.from(
    new Map(compras.map((item) => [item.id, item])).values()
  );

  return unique.sort((a, b) => b.id - a.id);
}

export async function getCompraById(id: number) {
  const raw = await getRequestFirstSuccess([
    { url: `/compras/${id}` },
    { url: `/compras/detalle/${id}` },
  ]);

  return mapCompraDetail(raw);
}
