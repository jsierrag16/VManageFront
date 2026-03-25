import type {
  BasicOption,
  Compra,
  IvaOption,
  ProveedorOption,
  ProductoOrden,
} from "./ordenes-compra.types";

type RawRecord = Record<string, any>;

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const ESTADO_COMPRA_IDS = {
  Pendiente: 1,
  Aprobada: 2,
  Anulada: 3,
} as const;

export const getFechaActual = () => {
  return new Date().toISOString().split("T")[0];
};

export const mapProveedorOption = (raw: RawRecord): ProveedorOption => {
  return {
    id: toNumber(raw?.id_proveedor ?? raw?.id),
    nombre: toStringSafe(raw?.nombre_empresa ?? raw?.nombre),
    estado:
      raw?.estado === undefined || raw?.estado === null
        ? true
        : Boolean(raw.estado),
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

export const mapBasicOption = (raw: RawRecord): BasicOption => {
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
    estado:
      raw?.estado === undefined || raw?.estado === null
        ? true
        : Boolean(raw.estado),
  };
};

export const mapIvaOption = (raw: RawRecord): IvaOption => {
  return {
    id: toNumber(raw?.id_iva ?? raw?.id),
    nombre: toStringSafe(raw?.nombre_iva ?? raw?.nombre),
    porcentaje: toNumber(raw?.porcentaje),
    estado:
      raw?.estado === undefined || raw?.estado === null
        ? true
        : Boolean(raw.estado),
  };
};

export const mapProductoOrden = (raw: RawRecord): ProductoOrden => {
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

export const mapCompra = (raw: RawRecord): Compra => {
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
    ) as Compra["estado"],
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
