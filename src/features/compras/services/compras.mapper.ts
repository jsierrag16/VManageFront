import type { CompraEstado, CompraUI } from "./compras.types";

type AnyRecord = Record<string, any>;

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pickText = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const onlyDate = (value?: string | null): string => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const normalizeEstado = (raw?: string | null, id?: number): CompraEstado => {
  const value = (raw || "").toLowerCase().trim();

  if (value.includes("anul")) return "Anulada";
  if (value.includes("aprob")) return "Aprobada";
  if (value.includes("pend")) return "Pendiente";

  if (id === 3) return "Anulada";
  if (id === 2) return "Aprobada";
  return "Pendiente";
};

const getProveedorRel = (row: AnyRecord) =>
  row.proveedor || row.proveedores || {};

const getBodegaRel = (row: AnyRecord) =>
  row.bodega || row.bodegas || {};

const getEstadoRel = (row: AnyRecord) =>
  row.estado_compra || row.estadoCompra || {};

const getTerminoPagoRel = (row: AnyRecord) =>
  row.termino_pago || row.terminos_pago || row.terminoPago || {};

const getProductoRel = (row: AnyRecord) =>
  row.producto || row.productos || {};

const getIvaRel = (row: AnyRecord) =>
  row.iva || row.ivas || {};

export const mapApiCompraToUI = (row: AnyRecord): CompraUI => {
  const proveedorRel = getProveedorRel(row);
  const bodegaRel = getBodegaRel(row);
  const estadoRel = getEstadoRel(row);
  const terminoPagoRel = getTerminoPagoRel(row);

  const detalle = Array.isArray(row.detalle_compra) ? row.detalle_compra : [];

  const productos = detalle.map((item: AnyRecord) => {
    const productoRel = getProductoRel(item);
    const ivaRel = getIvaRel(item);

    const cantidad = toNumber(item.cantidad);
    const precio = toNumber(item.precio_unitario);
    const subtotal = Number((cantidad * precio).toFixed(2));
    const ivaPorcentaje = toNumber(
      ivaRel?.porcentaje ?? item?.porcentaje ?? 0
    );

    return {
      producto: {
        id: toNumber(item.id_producto ?? productoRel?.id_producto ?? productoRel?.id),
        nombre: pickText(
          productoRel?.nombre_producto,
          productoRel?.nombre,
          item?.nombre_producto
        ),
      },
      cantidad,
      precio,
      subtotal,
      idIva: toNumber(item.id_iva ?? ivaRel?.id_iva ?? ivaRel?.id),
      ivaPorcentaje,
      ivaNombre: pickText(
        ivaRel?.nombre_iva,
        ivaRel?.nombre,
        `${ivaPorcentaje}%`
      ),
    };
  });

  const estadoId = toNumber(
    row.id_estado_compra ?? estadoRel?.id_estado_compra ?? estadoRel?.id
  );

  return {
    id: toNumber(row.id_compra ?? row.id),
    numeroOrden: pickText(row.codigo_compra, row.numeroOrden, row.numero_orden),
    proveedor: pickText(
      proveedorRel?.nombre_proveedor,
      proveedorRel?.nombre,
      row?.proveedor
    ),
    proveedorId: toNumber(
      row.id_proveedor ?? proveedorRel?.id_proveedor ?? proveedorRel?.id
    ),
    terminoPago: pickText(
      terminoPagoRel?.nombre_termino_pago,
      terminoPagoRel?.nombre,
      row?.termino_pago_nombre
    ),
    terminoPagoId: toNumber(
      row.id_termino_pago ?? terminoPagoRel?.id_termino_pago ?? terminoPagoRel?.id
    ),
    fecha: onlyDate(row.fecha_solicitud ?? row.fecha),
    fechaEntrega: onlyDate(row.fecha_entrega),
    estado: normalizeEstado(
      pickText(
        estadoRel?.nombre_estado_compra,
        estadoRel?.estado_compra,
        estadoRel?.nombre,
        row?.estado
      ),
      estadoId
    ),
    estadoId,
    items: detalle.length || toNumber(row.items),
    subtotal: toNumber(row.subtotal),
    impuestos: toNumber(row.total_iva ?? row.impuestos),
    total: toNumber(row.total),
    observaciones: pickText(row.descripcion, row.observaciones),
    bodega: pickText(
      bodegaRel?.nombre_bodega,
      bodegaRel?.nombre,
      row?.bodega
    ),
    bodegaId: toNumber(
      row.id_bodega ?? bodegaRel?.id_bodega ?? bodegaRel?.id
    ),
    productos,
  };
};
