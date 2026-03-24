import api from "../../../shared/services/api";

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

export type CompraEstado = "Pendiente" | "Aprobada" | "Anulada";

export type ProductoOrden = {
  producto: BasicOption;
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva: number;
  ivaNombre: string;
  ivaPorcentaje: number;
};

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

type RawRecord = Record<string, any>;

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toBooleanSafe = (value: unknown, fallback = true) => {
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
};

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
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

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
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

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
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

const mapBasicOption = (raw: RawRecord): BasicOption => {
  return {
    id: toNumber(
      raw?.id ??
        raw?.id_producto ??
        raw?.id_bodega ??
        raw?.id_termino_pago ??
        raw?.id_proveedor
    ),
    nombre: toStringSafe(
      raw?.nombre ??
        raw?.nombre_producto ??
        raw?.nombre_bodega ??
        raw?.nombre_termino ??
        raw?.nombre_empresa
    ),
    estado: toBooleanSafe(raw?.estado, true),
  };
};

const mapProveedorOption = (raw: RawRecord): ProveedorOption => {
  return {
    id: toNumber(raw?.id_proveedor ?? raw?.id),
    nombre: toStringSafe(raw?.nombre_empresa ?? raw?.nombre),
    estado: toBooleanSafe(raw?.estado, true),
    numeroDocumento: toStringSafe(raw?.num_documento),
    idTipoDocumento:
      raw?.id_tipo_doc === null || raw?.id_tipo_doc === undefined
        ? null
        : toNumber(raw?.id_tipo_doc),
    tipoDocumento: toStringSafe(
      raw?.tipo_documento?.nombre_doc ?? raw?.nombre_doc
    ),
  };
};

const mapIvaOption = (raw: RawRecord): IvaOption => {
  return {
    id: toNumber(raw?.id_iva ?? raw?.id),
    nombre: toStringSafe(raw?.nombre_iva ?? raw?.nombre),
    porcentaje: toNumber(raw?.porcentaje),
    estado: toBooleanSafe(raw?.estado, true),
  };
};

const mapProductoOrden = (raw: RawRecord): ProductoOrden => {
  const cantidad = toNumber(raw?.cantidad);
  const precio = toNumber(raw?.precio_unitario ?? raw?.precio);
  const subtotal =
    raw?.subtotal !== undefined && raw?.subtotal !== null
      ? toNumber(raw?.subtotal)
      : cantidad * precio;

  return {
    producto: {
      id: toNumber(raw?.producto?.id_producto ?? raw?.id_producto),
      nombre: toStringSafe(
        raw?.producto?.nombre_producto ?? raw?.producto?.nombre
      ),
      estado: true,
    },
    cantidad,
    precio,
    subtotal,
    idIva: toNumber(raw?.id_iva ?? raw?.iva?.id_iva),
    ivaNombre: toStringSafe(
      raw?.iva?.nombre_iva ?? raw?.iva?.nombre ?? "IVA"
    ),
    ivaPorcentaje: toNumber(raw?.iva?.porcentaje ?? raw?.porcentaje),
  };
};

const mapCompra = (raw: RawRecord): Compra => {
  const productos = Array.isArray(raw?.detalle_compra)
    ? raw.detalle_compra.map(mapProductoOrden)
    : [];

  return {
    id: toNumber(raw?.id_compra ?? raw?.id),
    numeroOrden: toStringSafe(raw?.codigo_compra ?? raw?.numeroOrden),
    fecha: toStringSafe(raw?.fecha_solicitud ?? raw?.fecha),
    fechaEntrega: toStringSafe(raw?.fecha_entrega),
    estado: toStringSafe(
      raw?.estado_compra?.nombre_estado ?? raw?.estado
    ) as CompraEstado,
    observaciones: toStringSafe(raw?.descripcion ?? raw?.observaciones),
    subtotal: toNumber(raw?.subtotal),
    impuestos: toNumber(raw?.total_iva ?? raw?.impuestos),
    total: toNumber(raw?.total),
    items: toNumber(raw?._count?.detalle_compra ?? productos.length),

    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),
    proveedor: toStringSafe(
      raw?.proveedor?.nombre_empresa ?? raw?.proveedor
    ),
    proveedorNumeroDocumento: toStringSafe(raw?.proveedor?.num_documento),
    proveedorTipoDocumento: toStringSafe(
      raw?.proveedor?.tipo_documento?.nombre_doc
    ),

    terminoPagoId: toNumber(
      raw?.id_termino_pago ?? raw?.termino_pago?.id_termino_pago
    ),
    terminoPago: toStringSafe(raw?.termino_pago?.nombre_termino),

    bodegaId: toNumber(raw?.id_bodega ?? raw?.bodega?.id_bodega),
    bodega: toStringSafe(raw?.bodega?.nombre_bodega),

    productos,
  };
};

type CatalogosResponse = {
  proveedores: ProveedorOption[];
  productos: BasicOption[];
  terminosPago: BasicOption[];
  ivas: IvaOption[];
  bodegas: BasicOption[];
  huboError: boolean;
};

export const comprasService = {
  async getAll(selectedBodegaId?: number): Promise<Compra[]> {
    const paramsVariants = buildBodegaParamsVariants(selectedBodegaId);

    const raw = await getRequestFirstSuccess([
      ...paramsVariants.map((params) => ({
        url: "/compras",
        params,
      })),
      ...paramsVariants.map((params) => ({
        url: "/compra",
        params,
      })),
    ]);

    return extractList(raw).map(mapCompra);
  },

  async getById(id: number): Promise<Compra> {
    const raw = await getRequestFirstSuccess([
      { url: `/compras/${id}` },
      { url: `/compra/${id}` },
    ]);

    return mapCompra(raw);
  },

  async create(payload: CompraCreatePayload): Promise<Compra> {
    const raw = await postRequestFirstSuccess([
      { url: "/compras", data: payload },
      { url: "/compra", data: payload },
    ]);

    return mapCompra(raw);
  },

  async update(
    id: number,
    payload: CompraCreatePayload & { id_estado_compra?: number }
  ): Promise<Compra> {
    const raw = await patchRequestFirstSuccess([
      { url: `/compras/${id}`, data: payload },
      { url: `/compra/${id}`, data: payload },
    ]);

    return mapCompra(raw);
  },

  async aprobar(id: number) {
    return patchRequestFirstSuccess([
      { url: `/compras/${id}/aprobar` },
      { url: `/compra/${id}/aprobar` },
      { url: `/compras/${id}/estado`, data: { id_estado_compra: 2 } },
    ]);
  },

  async anular(id: number) {
    return patchRequestFirstSuccess([
      { url: `/compras/${id}/anular` },
      { url: `/compra/${id}/anular` },
      { url: `/compras/${id}/estado`, data: { id_estado_compra: 3 } },
    ]);
  },

  async getCatalogos(): Promise<CatalogosResponse> {
    let huboError = false;

    const [
      proveedoresRes,
      productosRes,
      terminosPagoRes,
      ivasRes,
      bodegasRes,
    ] = await Promise.allSettled([
      getRequestFirstSuccess([
        { url: "/proveedores" },
        { url: "/proveedor" },
      ]),
      getRequestFirstSuccess([
        { url: "/productos" },
        { url: "/producto" },
      ]),
      getRequestFirstSuccess([
        { url: "/terminos-pago" },
        { url: "/termino-pago" },
      ]),
      getRequestFirstSuccess([
        { url: "/ivas" },
        { url: "/iva" },
      ]),
      getRequestFirstSuccess([
        { url: "/bodegas" },
        { url: "/bodega" },
      ]),
    ]);

    const proveedores =
      proveedoresRes.status === "fulfilled"
        ? extractList(proveedoresRes.value).map(mapProveedorOption)
        : (huboError = true, []);

    const productos =
      productosRes.status === "fulfilled"
        ? extractList(productosRes.value).map(mapBasicOption)
        : (huboError = true, []);

    const terminosPago =
      terminosPagoRes.status === "fulfilled"
        ? extractList(terminosPagoRes.value).map(mapBasicOption)
        : (huboError = true, []);

    const ivas =
      ivasRes.status === "fulfilled"
        ? extractList(ivasRes.value).map(mapIvaOption)
        : (huboError = true, []);

    const bodegas =
      bodegasRes.status === "fulfilled"
        ? extractList(bodegasRes.value).map(mapBasicOption)
        : (huboError = true, []);

    return {
      proveedores,
      productos,
      terminosPago,
      ivas,
      bodegas,
      huboError,
    };
  },
};
