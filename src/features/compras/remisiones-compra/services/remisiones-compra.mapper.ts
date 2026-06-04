import type {
  CompraDetail,
  CompraDetailItem,
  CompraOption,
  EstadoRemisionKey,
  RemisionCompraItemUI,
  RemisionCompraUI,
} from "./remisiones-compras.types";

type RawRecord = Record<string, any>;

export const ESTADO_REMISION_IDS = {
  PENDIENTE: 1,
  APLICADA: 2,
  ANULADA: 3,
} as const;

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toBooleanSafe = (value: unknown, fallback = false) => {
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const asArray = <T = any>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

export const unwrapResponse = <T = any>(response: any): T => {
  return response?.data?.data ?? response?.data ?? response;
};

export const extractList = <T = any>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export const formatDateOnly = (value: unknown) => {
  if (!value) return "";

  if (typeof value === "string") {
    const soloFecha = value.split("T")[0];

    if (/^\d{4}-\d{2}-\d{2}$/.test(soloFecha)) {
      return soloFecha;
    }
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const buildBodegaParamsVariants = (selectedBodegaId?: number) => {
  if (!selectedBodegaId) return [{}, undefined];

  return [
    { idBodega: selectedBodegaId },
    { id_bodega: selectedBodegaId },
    {},
  ];
};

export const filterBySelectedBodega = <T extends { idBodega: number }>(
  items: T[],
  selectedBodegaId?: number
) => {
  if (!selectedBodegaId) return items;

  return items.filter(
    (item) => Number(item.idBodega) === Number(selectedBodegaId)
  );
};

const getEstadoNombre = (raw: RawRecord) => {
  return toStringSafe(
    raw?.estado_remision_compra?.nombre_estado ??
    raw?.estado ??
    raw?.nombre_estado
  );
};

const getEstadoKey = (
  estado: unknown,
  afectaExistencias?: boolean
): EstadoRemisionKey => {
  const normalized = normalizeText(estado);

  if (normalized.includes("anulada") || normalized.includes("anulado")) {
    return "ANULADA";
  }

  if (
    afectaExistencias ||
    normalized.includes("aplicada") ||
    normalized.includes("aplicado") ||
    normalized.includes("aprobada") ||
    normalized.includes("aprobado") ||
    normalized.includes("recibida") ||
    normalized.includes("recibido") ||
    normalized.includes("confirmada") ||
    normalized.includes("confirmado")
  ) {
    return "APLICADA";
  }

  if (normalized.includes("pendiente")) {
    return "PENDIENTE";
  }

  return "OTRO";
};

const getFechaAplicacionExistencias = (raw: RawRecord) => {
  return (
    raw?.fecha_aplicacion_existencias ??
    raw?.fechaAplicacionExistencias ??
    raw?.fecha_aprobada ??
    raw?.fechaAprobada ??
    raw?.fecha_aprobacion ??
    raw?.fechaAprobacion ??
    null
  );
};

const getUsuarioAplicoExistenciasNombre = (raw: RawRecord) => {
  const usuario =
    raw?.usuario_remision_compra_id_usuario_aplico_existenciasTousuario ??
    raw?.usuario_aplico_existencias ??
    raw?.usuarioAplicoExistencias ??
    raw?.usuario_aprobo ??
    raw?.usuarioAprobo ??
    null;

  const nombre = toStringSafe(usuario?.nombre).trim();
  const apellido = toStringSafe(usuario?.apellido).trim();
  const email = toStringSafe(usuario?.email).trim();

  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || email || "";
};

const getUsuarioAnuloNombre = (raw: RawRecord) => {
  const usuario =
    raw?.usuario_anulo ??
    raw?.usuarioAnulo ??
    null;

  const nombre = toStringSafe(usuario?.nombre).trim();
  const apellido = toStringSafe(usuario?.apellido).trim();
  const email = toStringSafe(usuario?.email).trim();

  const nombreCompleto = `${nombre} ${apellido}`.trim();

  return nombreCompleto || email || "";
};

export const mapRemisionItem = (raw: RawRecord): RemisionCompraItemUI => {
  const cantidad = toNumber(raw?.cantidad);
  const precio = toNumber(raw?.precio_unitario);

  const ivaPorcentaje = toNumber(
    raw?.iva?.porcentaje ??
    raw?.iva_porcentaje ??
    raw?.porcentaje_iva ??
    raw?.porcentaje
  );

  const codigoBarras = toStringSafe(
    raw?.codigo_barras ?? raw?.cod_barras ?? raw?.codigoBarras
  );

  return {
    id_detalle_remision_compra:
      toNumber(raw?.id_detalle_remision_compra || 0) || undefined,

    id_producto: toNumber(
      raw?.id_producto ??
      raw?.producto?.id_producto ??
      raw?.producto?.id ??
      raw?.idProducto
    ),

    productoNombre: toStringSafe(
      raw?.producto?.nombre_producto ??
      raw?.nombre_producto ??
      raw?.productoNombre ??
      raw?.producto?.nombre
    ),

    cantidad,
    precio_unitario: precio,

    id_iva: toNumber(raw?.id_iva ?? raw?.iva?.id_iva ?? raw?.idIva),
    ivaPorcentaje,

    lote: toStringSafe(raw?.lote),

    // Esta fecha sí se conserva porque pertenece al lote/producto.
    fecha_vencimiento: formatDateOnly(raw?.fecha_vencimiento),

    codigo_barras: codigoBarras,
    cod_barras: codigoBarras,

    nota: toStringSafe(raw?.nota),
  };
};

export const mapRemision = (raw: RawRecord): RemisionCompraUI => {
  const items = asArray(raw?.detalle_remision_compra).map(mapRemisionItem);

  const total = items.reduce((acc, item) => {
    const subtotal = item.cantidad * item.precio_unitario;
    const iva = subtotal * (item.ivaPorcentaje / 100);
    return acc + subtotal + iva;
  }, 0);

  const estado = getEstadoNombre(raw);
  const afectaExistencias = toBooleanSafe(raw?.afecta_existencias);

  const fechaAplicacionExistencias = formatDateOnly(
    getFechaAplicacionExistencias(raw)
  );

  return {
    id: toNumber(raw?.id_remision_compra ?? raw?.id),

    numeroRemision: toStringSafe(
      raw?.codigo_remision_compra ?? raw?.numeroRemision ?? raw?.codigo
    ),

    fecha: formatDateOnly(raw?.fecha_creacion ?? raw?.fecha),

    observaciones: toStringSafe(raw?.observaciones),

    ordenCompraId: toNumber(raw?.id_compra ?? raw?.compras?.id_compra),

    ordenCompra: toStringSafe(
      raw?.compras?.codigo_compra ?? raw?.ordenCompra ?? raw?.codigo_compra
    ),

    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),

    proveedor: toStringSafe(
      raw?.proveedor?.nombre_empresa ??
      raw?.proveedorNombre ??
      raw?.nombre_empresa
    ),

    proveedorTipoDocumento: toStringSafe(
      raw?.proveedorTipoDocumento ??
      raw?.tipoDocumentoProveedor ??
      raw?.proveedor?.tipo_documento?.nombre_doc ??
      raw?.proveedor?.tipo_documento?.nombre_tipo_doc ??
      raw?.proveedor?.tipo_doc?.nombre_doc ??
      raw?.proveedor?.tipo_doc?.nombre_tipo_doc ??
      raw?.proveedor?.tipoDocumento?.nombre_doc ??
      raw?.proveedor?.tipoDocumento?.nombre ??
      raw?.proveedor?.nombre_doc ??
      raw?.proveedor?.nombre_tipo_doc
    ),

    proveedorNumeroDocumento: toStringSafe(
      raw?.proveedorNumeroDocumento ??
      raw?.numDocumentoProveedor ??
      raw?.numeroDocumentoProveedor ??
      raw?.proveedor?.num_documento ??
      raw?.proveedor?.numero_documento ??
      raw?.proveedor?.documento
    ),

    estadoId: toNumber(
      raw?.id_estado_remision_compra ??
      raw?.estado_remision_compra?.id_estado_remision_compra
    ),

    fechaAnulacion: formatDateOnly(raw?.fecha_anulacion ?? raw?.fechaAnulacion),

    idUsuarioAnulo:
      raw?.id_usuario_anulo === null || raw?.id_usuario_anulo === undefined
        ? null
        : toNumber(raw?.id_usuario_anulo),

    usuarioAnulo: getUsuarioAnuloNombre(raw),

    estado,
    estadoKey: getEstadoKey(estado, afectaExistencias),

    idUsuarioCreador: toNumber(
      raw?.id_usuario_creador ?? raw?.usuario?.id_usuario
    ),

    codigoFactura: toStringSafe(
      raw?.codigo_factura ?? raw?.codigoFactura
    ),

    afectaExistencias,

    fechaAplicacionExistencias,

    idUsuarioAplicoExistencias:
      raw?.id_usuario_aplico_existencias === null ||
        raw?.id_usuario_aplico_existencias === undefined
        ? null
        : toNumber(raw?.id_usuario_aplico_existencias),

    usuarioAplicoExistencias: getUsuarioAplicoExistenciasNombre(raw),

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

export const mapCompraOption = (raw: RawRecord): CompraOption => {
  return {
    id: toNumber(raw?.id_compra ?? raw?.id),

    codigo: toStringSafe(raw?.codigo_compra ?? raw?.codigo),

    proveedorId: toNumber(raw?.id_proveedor ?? raw?.proveedor?.id_proveedor),

    proveedorNombre: toStringSafe(
      raw?.proveedor?.nombre_empresa ??
      raw?.proveedorNombre ??
      raw?.nombre_empresa
    ),

    proveedorTipoDocumento: toStringSafe(
      raw?.proveedorTipoDocumento ??
      raw?.tipoDocumentoProveedor ??
      raw?.proveedor?.tipo_documento?.nombre_doc ??
      raw?.proveedor?.tipo_documento?.nombre_tipo_doc ??
      raw?.proveedor?.tipo_doc?.nombre_doc ??
      raw?.proveedor?.tipo_doc?.nombre_tipo_doc ??
      raw?.proveedor?.nombre_doc ??
      raw?.proveedor?.nombre_tipo_doc
    ),

    proveedorNumeroDocumento: toStringSafe(
      raw?.proveedorNumeroDocumento ??
      raw?.numDocumentoProveedor ??
      raw?.numeroDocumentoProveedor ??
      raw?.proveedor?.num_documento ??
      raw?.proveedor?.numero_documento
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

export const mapCompraDetailItem = (raw: RawRecord): CompraDetailItem => {
  return {
    idProducto: toNumber(
      raw?.idProducto ??
      raw?.id_producto ??
      raw?.producto?.id_producto ??
      raw?.producto?.id
    ),

    productoNombre: toStringSafe(
      raw?.productoNombre ??
      raw?.nombre_producto ??
      raw?.producto?.nombre_producto ??
      raw?.producto?.nombre
    ),

    cantidad: toNumber(raw?.cantidad),

    precioUnitario: toNumber(
      raw?.precioUnitario ?? raw?.precio_unitario ?? raw?.precio
    ),

    idIva: toNumber(
      raw?.idIva ??
      raw?.id_iva ??
      raw?.iva?.id_iva ??
      raw?.producto?.id_iva
    ),

    ivaPorcentaje: toNumber(
      raw?.ivaPorcentaje ??
      raw?.iva_porcentaje ??
      raw?.iva?.porcentaje ??
      raw?.producto?.iva?.porcentaje ??
      raw?.porcentaje
    ),

    codigoBarras: toStringSafe(
      raw?.codigoBarras ?? raw?.codigo_barras ?? raw?.cod_barras
    ),
  };
};

export const mapCompraDetail = (raw: RawRecord): CompraDetail => {
  const source = (raw?.compra ?? raw) as RawRecord;

  const detalle =
    asArray(source?.detalle_compra).length > 0
      ? asArray(source?.detalle_compra)
      : asArray(source?.items).length > 0
        ? asArray(source?.items)
        : asArray(source?.detalles);

  return {
    id: toNumber(source?.id_compra ?? source?.id),

    codigo: toStringSafe(source?.codigo_compra ?? source?.codigo),

    proveedorId: toNumber(
      source?.proveedorId ??
      source?.id_proveedor ??
      source?.proveedor?.id_proveedor ??
      source?.proveedor?.id
    ),

    proveedorNombre: toStringSafe(
      source?.proveedorNombre ??
      source?.proveedor?.nombre_empresa ??
      source?.nombre_empresa
    ),

    proveedorTipoDocumento: toStringSafe(
      source?.proveedorTipoDocumento ??
      source?.tipoDocumentoProveedor ??
      source?.proveedor?.tipo_doc?.nombre_tipo_doc ??
      source?.proveedor?.tipo_doc?.nombre_doc ??
      source?.proveedor?.tipoDocumento?.nombre ??
      source?.proveedor?.tipo_documento?.nombre_tipo_doc ??
      source?.proveedor?.tipo_documento?.nombre_doc ??
      source?.proveedor?.nombre_tipo_doc ??
      source?.proveedor?.nombre_doc
    ),

    proveedorNumeroDocumento: toStringSafe(
      source?.proveedorNumeroDocumento ??
      source?.numDocumentoProveedor ??
      source?.numeroDocumentoProveedor ??
      source?.proveedor?.num_documento ??
      source?.proveedor?.numero_documento
    ),

    idBodega: toNumber(
      source?.idBodega ??
      source?.id_bodega ??
      source?.bodega?.id_bodega ??
      source?.bodega?.id
    ),

    bodegaNombre: toStringSafe(
      source?.bodegaNombre ??
      source?.bodega?.nombre_bodega ??
      source?.nombre_bodega
    ),

    numeroRemisionSugerido: toStringSafe(
      raw?.numeroRemisionSugerido ??
      raw?.numero_remision_sugerido ??
      source?.numeroRemisionSugerido ??
      source?.siguienteNumeroRemision ??
      source?.numero_remision_sugerido
    ),

    items: detalle.map(mapCompraDetailItem),
  };
};