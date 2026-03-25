import api from "@/shared/services/api";
import type { Producto } from "@/data/productos";

export type EstadoCotizacionUI =
  | "Pendiente"
  | "Aprobada"
  | "Rechazada"
  | "Vencida"
  | "Anulada";

export type DetalleCotizacionPayload = {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  id_iva?: number;
};

export type CreateCotizacionPayload = {
  fecha: string;
  fecha_vencimiento: string;
  id_cliente: number;
  id_bodega: number;
  id_usuario_creador: number;
  id_estado_cotizacion: number;
  observaciones?: string;
  detalle: DetalleCotizacionPayload[];
};

export type UpdateCotizacionPayload = {
    fecha: string;
    fecha_vencimiento: string;
    id_cliente: number;
    id_bodega: number;
    id_estado_cotizacion: number;
    observaciones?: string;
    detalle: DetalleCotizacionPayload[];
  };

type IvaApi = {
  id_iva: number;
  porcentaje: number | string;
};

type ProductoApi = {
  id_producto: number;
  nombre_producto: string;
  descripcion?: string | null;
  estado?: boolean;
  codigo_barras?: string | null;
  stock_total?: number | null;
  categoria_producto?: {
    id_categoria_producto: number;
    nombre_categoria?: string;
  } | null;
  iva?: IvaApi | null;
  lotes?: Array<{
    id_existencia?: number;
    lote?: string;
    cantidad?: number;
    fecha_vencimiento?: string | null;
    id_bodega?: number;
    nombre_bodega?: string;
  }>;
};

type DetalleCotizacionApi = {
  id_detalle_cotizacion: number;
  id_producto: number;
  cantidad: number | string;
  precio_unitario: number | string;
  id_iva: number;
  producto?: ProductoApi | null;
  iva?: IvaApi | null;
};

type CotizacionApi = {
  id_cotizacion: number;
  codigo_cotizacion: string | null;
  fecha: string;
  fecha_vencimiento: string;
  id_cliente: number;
  id_bodega: number;
  id_usuario_creador: number;
  id_estado_cotizacion: number;
  observaciones?: string | null;
  cliente?: {
    id_cliente: number;
    nombre_cliente: string;
  } | null;
  bodega?: {
    id_bodega: number;
    nombre_bodega: string;
  } | null;
  estado_cotizacion?: {
    id_estado_cotizacion: number;
    nombre_estado: string;
  } | null;
  detalle_cotizacion?: DetalleCotizacionApi[];
};

export type CotizacionProductoUI = {
  producto: Producto;
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva?: number;
};

export type CotizacionUI = {
  id: number;
  numeroCotizacion: string;
  cliente: string;
  idCliente: number;
  fecha: string;
  fechaVencimiento: string;
  estado: EstadoCotizacionUI;
  estadoId: number;
  items: number;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  bodega: string;
  idBodega: number;
  productos: CotizacionProductoUI[];
};

export const ESTADO_COTIZACION_FALLBACK: Record<EstadoCotizacionUI, number> = {
  Pendiente: 1,
  Aprobada: 2,
  Rechazada: 3,
  Vencida: 4,
  Anulada: 5,
};

function normalizeDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeEstado(nombre?: string | null): EstadoCotizacionUI {
  const text = (nombre ?? "").trim().toLowerCase();

  if (text === "aprobada") return "Aprobada";
  if (text === "rechazada") return "Rechazada";
  if (text === "vencida") return "Vencida";
  if (text === "anulada") return "Anulada";
  return "Pendiente";
}

function mapProductoApiToUi(
  producto?: ProductoApi | null,
  ivaPorcentaje?: number
): Producto {
  return {
    id: String(producto?.id_producto ?? ""),
    nombre: producto?.nombre_producto ?? "Producto",
    categoria: producto?.categoria_producto?.nombre_categoria ?? "",
    descripcion: producto?.descripcion ?? "",
    codigoBarras: producto?.codigo_barras ?? "",
    iva: toNumber(ivaPorcentaje ?? producto?.iva?.porcentaje ?? 0),
    stockTotal: toNumber(producto?.stock_total ?? 0),
    estado: producto?.estado ?? true,
    lotes: Array.isArray(producto?.lotes)
      ? producto!.lotes!.map((lote) => ({
          id: String(lote.id_existencia ?? lote.lote ?? ""),
          numeroLote: lote.lote ?? "",
          cantidadDisponible: toNumber(lote.cantidad ?? 0),
          fechaVencimiento: normalizeDate(lote.fecha_vencimiento ?? null),
          bodega: lote.nombre_bodega ?? "",
        }))
      : [],
  };
}

export function mapCotizacionApiToUi(item: CotizacionApi): CotizacionUI {
  const productos: CotizacionProductoUI[] = (item.detalle_cotizacion ?? []).map(
    (detalle) => {
      const cantidad = toNumber(detalle.cantidad);
      const precio = toNumber(detalle.precio_unitario);
      const subtotal = cantidad * precio;
      const ivaPorcentaje = toNumber(
        detalle.iva?.porcentaje ?? detalle.producto?.iva?.porcentaje ?? 0
      );

      return {
        producto: mapProductoApiToUi(detalle.producto, ivaPorcentaje),
        cantidad,
        precio,
        subtotal,
        idIva: detalle.id_iva,
      };
    }
  );

  const subtotal = productos.reduce((acc, itemProducto) => {
    const porcentaje = Number(itemProducto.producto.iva ?? 0);
    const base = itemProducto.subtotal / (1 + porcentaje / 100);
    return acc + base;
  }, 0);

  const impuestos = productos.reduce((acc, itemProducto) => {
    const porcentaje = Number(itemProducto.producto.iva ?? 0);
    const base = itemProducto.subtotal / (1 + porcentaje / 100);
    return acc + (itemProducto.subtotal - base);
  }, 0);

  return {
    id: item.id_cotizacion,
    numeroCotizacion:
      item.codigo_cotizacion || `COT-${String(item.id_cotizacion).padStart(4, "0")}`,
    cliente: item.cliente?.nombre_cliente ?? "Cliente",
    idCliente: item.id_cliente,
    fecha: normalizeDate(item.fecha),
    fechaVencimiento: normalizeDate(item.fecha_vencimiento),
    estado: normalizeEstado(item.estado_cotizacion?.nombre_estado),
    estadoId:
      item.estado_cotizacion?.id_estado_cotizacion ??
      item.id_estado_cotizacion ??
      ESTADO_COTIZACION_FALLBACK.Pendiente,
    items: productos.length,
    subtotal,
    impuestos,
    total: subtotal + impuestos,
    observaciones: item.observaciones ?? "",
    bodega: item.bodega?.nombre_bodega ?? "",
    idBodega: item.id_bodega,
    productos,
  };
}

export const cotizacionesService = {
  async getAll() {
    const response = await api.get<CotizacionApi[]>("/cotizaciones");
    return response.data.map(mapCotizacionApiToUi);
  },

  async getById(id: number) {
    const response = await api.get<CotizacionApi>(`/cotizaciones/${id}`);
    return mapCotizacionApiToUi(response.data);
  },

  async create(payload: CreateCotizacionPayload) {
    const response = await api.post<CotizacionApi>("/cotizaciones", payload);
    return mapCotizacionApiToUi(response.data);
  },

  async updateEstado(id: number, id_estado_cotizacion: number) {
    const response = await api.patch<CotizacionApi>(`/cotizaciones/${id}/estado`, {
      id_estado_cotizacion,
    });
    return mapCotizacionApiToUi(response.data);
  },

  async update(id: number, payload: UpdateCotizacionPayload) {
    const response = await api.patch<CotizacionApi>(`/cotizaciones/${id}`, payload);
    return mapCotizacionApiToUi(response.data);
  },
};