import type { Compra, ProductoOrden, CompraEstado } from "./compras.types";

const normalizarEstado = (estado?: string) =>
  (estado ?? "").trim().toLowerCase();

const estadoNombreMap = (estado?: string): CompraEstado => {
  const value = normalizarEstado(estado);

  if (value === "aprobada") return "Aprobada";
  if (value === "anulada") return "Anulada";
  return "Pendiente";
};

export const ESTADO_COMPRA_IDS: Record<CompraEstado, number> = {
  Pendiente: 1,
  Aprobada: 2,
  Anulada: 3,
};

export const getFechaActual = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getItemsCount = (row: any): number => {
  if (typeof row?._count?.detalle_compra === "number") {
    return row._count.detalle_compra;
  }

  if (Array.isArray(row?.detalle_compra)) {
    return row.detalle_compra.length;
  }

  return 0;
};

const formatIvaNombre = (iva: any) => {
  const porcentaje = Number(iva?.porcentaje ?? 0);

  if (porcentaje > 0) {
    return `IVA ${porcentaje}%`;
  }

  return "IVA";
};

export const mapCompraList = (row: any): Compra => {
  return {
    id: row.id_compra,
    numeroOrden: row.codigo_compra,
    fecha: row.fecha_solicitud?.slice(0, 10) ?? "",
    fechaEntrega: row.fecha_entrega?.slice(0, 10) ?? "",
    proveedor: row.proveedor?.nombre_empresa ?? "-",
    proveedorId: row.id_proveedor,
    terminoPago: row.termino_pago?.nombre_termino ?? "-",
    terminoPagoId: row.id_termino_pago,
    bodega: row.bodega?.nombre_bodega ?? "-",
    bodegaId: row.id_bodega,
    estado: estadoNombreMap(row.estado_compra?.nombre_estado),
    observaciones: row.descripcion ?? "",
    subtotal: Number(row.subtotal ?? 0),
    impuestos: Number(row.total_iva ?? 0),
    total: Number(row.total ?? 0),
    items: getItemsCount(row),
  };
};

export const mapCompraDetail = (row: any): Compra => {
  const productos: ProductoOrden[] = Array.isArray(row.detalle_compra)
    ? row.detalle_compra.map((d: any) => ({
        producto: {
          id: d.producto?.id_producto ?? d.id_producto,
          nombre: d.producto?.nombre_producto ?? "-",
        },
        cantidad: Number(d.cantidad ?? 0),
        precio: Number(d.precio_unitario ?? 0),
        subtotal: Number(d.cantidad ?? 0) * Number(d.precio_unitario ?? 0),
        idIva: d.id_iva,
        ivaNombre: formatIvaNombre(d.iva),
        ivaPorcentaje: Number(d.iva?.porcentaje ?? 0),
      }))
    : [];

  return {
    ...mapCompraList(row),
    items: productos.length,
    productos,
  };
};
