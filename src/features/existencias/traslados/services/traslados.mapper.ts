import type {
    BodegaCatalogoBackend,
    ExistenciaDisponibleBackend,
    TrasladoBackend,
    TrasladoDetailBackend,
    CreateTrasladoPayload,
    UpdateTrasladoPayload,
} from "./traslados.services";

const toNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

export type OpcionCatalogo = {
    id: number;
    nombre: string;
};

export type EstadoTrasladoUI = "Pendiente" | "Enviado" | "Recibido" | "Anulado";

export type ExistenciaDisponibleUI = {
    idExistencia: number;
    idProducto: number;
    nombreProducto: string;
    descripcion: string;
    idBodega: number;
    nombreBodega: string;
    lote: string;
    cantidadDisponible: number;
    fechaVencimiento: string;
    idCategoria: number | null;
    categoria: string;
    idIva: number | null;
    iva: number;
    raw: ExistenciaDisponibleBackend;
};

export type TrasladoItemUI = {
    idDetalle?: number;
    idExistencia: number;
    idProducto: number;
    productoNombre: string;
    loteNumero: string;
    cantidad: number;
    idBodega: number;
    bodegaNombre: string;
    fechaVencimiento: string;
};

export type TrasladoUI = {
    id: number;
    codigo: string;
    fecha: string;
    idBodegaOrigen: number;
    bodegaOrigen: string;
    idBodegaDestino: number;
    bodegaDestino: string;
    observaciones: string;
    idEstado: number;
    estado: EstadoTrasladoUI;
    idResponsable: number | null;
    responsable: string;
    items: TrasladoItemUI[];
    raw: TrasladoBackend | TrasladoDetailBackend;
};

export const estadoTrasladoBackendToUI = (idEstado: number): EstadoTrasladoUI => {
    if (idEstado === 1) return "Pendiente";
    if (idEstado === 2) return "Enviado";
    if (idEstado === 3) return "Recibido";
    if (idEstado === 4) return "Anulado";
    return "Pendiente";
};

export const estadoTrasladoUIToBackend = (estado: EstadoTrasladoUI): number => {
    if (estado === "Pendiente") return 1;
    if (estado === "Enviado") return 2;
    if (estado === "Recibido") return 3;
    if (estado === "Anulado") return 4;
    return 1;
};

export const bodegaCatalogoBackendToOption = (
    bodega: BodegaCatalogoBackend
): OpcionCatalogo => ({
    id: bodega.id_bodega,
    nombre: bodega.nombre_bodega,
});

export const existenciaDisponibleBackendToUI = (
    existencia: ExistenciaDisponibleBackend
): ExistenciaDisponibleUI => ({
    idExistencia: existencia.id_existencia,
    idProducto: existencia.id_producto,
    nombreProducto: existencia.producto.nombre_producto,
    descripcion: existencia.producto.descripcion ?? "",
    idBodega: existencia.id_bodega,
    nombreBodega: existencia.bodega.nombre_bodega,
    lote: existencia.lote,
    cantidadDisponible:
        existencia.cantidad_disponible !== undefined &&
            existencia.cantidad_disponible !== null
            ? toNumber(existencia.cantidad_disponible)
            : Math.max(
                0,
                toNumber(existencia.cantidad) -
                toNumber(existencia.cantidad_reservada),
            ),
    fechaVencimiento: existencia.fecha_vencimiento ?? "",
    idCategoria: existencia.producto.categoria_producto?.id_categoria_producto ?? null,
    categoria: existencia.producto.categoria_producto?.nombre_categoria ?? "",
    idIva: existencia.producto.iva?.id_iva ?? null,
    iva: toNumber(existencia.producto.iva?.porcentaje),
    raw: existencia,
});

export const existenciasDisponiblesBackendToUI = (
    existencias: ExistenciaDisponibleBackend[]
): ExistenciaDisponibleUI[] => existencias.map(existenciaDisponibleBackendToUI);

export const trasladoBackendToUI = (
    traslado: TrasladoBackend | TrasladoDetailBackend
): TrasladoUI => {
    const items: TrasladoItemUI[] =
        "detalle_traslado" in traslado
            ? traslado.detalle_traslado.map((item) => ({
                idDetalle: item.id_detalle,
                idExistencia: item.id_existencia,
                idProducto: item.existencias.id_producto,
                productoNombre: item.existencias.producto.nombre_producto,
                loteNumero: item.existencias.lote,
                cantidad: toNumber(item.cantidad),
                idBodega: item.existencias.id_bodega,
                bodegaNombre: item.existencias.bodega.nombre_bodega,
                fechaVencimiento: item.existencias.fecha_vencimiento ?? "",
            }))
            : [];

    return {
        id: traslado.id_traslado,
        codigo: traslado.codigo_traslado ?? `TRS-${traslado.id_traslado}`,
        fecha: traslado.fecha_traslado,
        idBodegaOrigen: traslado.id_bodega_origen,
        bodegaOrigen: traslado.bodega_traslado_id_bodega_origenTobodega.nombre_bodega,
        idBodegaDestino: traslado.id_bodega_destino,
        bodegaDestino: traslado.bodega_traslado_id_bodega_destinoTobodega.nombre_bodega,
        observaciones: traslado.nota ?? "",
        idEstado: traslado.id_estado_traslado,
        estado: estadoTrasladoBackendToUI(traslado.id_estado_traslado),
        idResponsable: traslado.id_responsable ?? null,
        responsable: traslado.usuario
            ? `${traslado.usuario.nombre} ${traslado.usuario.apellido}`.trim()
            : "Sin responsable",
        items,
        raw: traslado,
    };
};

export const trasladosBackendToUI = (
    traslados: TrasladoBackend[]
): TrasladoUI[] => traslados.map(trasladoBackendToUI);

export const trasladoDetailBackendToUI = (
    traslado: TrasladoDetailBackend
): TrasladoUI => trasladoBackendToUI(traslado);

export const trasladoFormToCreatePayload = (args: {
    idBodegaOrigen: number;
    idBodegaDestino: number;
    fecha?: string;
    nota?: string;
    detalle: { idExistencia: number; cantidad: number }[];
}): CreateTrasladoPayload => ({
    id_bodega_origen: args.idBodegaOrigen,
    id_bodega_destino: args.idBodegaDestino,
    fecha_traslado: args.fecha || undefined,
    nota: args.nota?.trim() || undefined,
    detalle: args.detalle.map((item) => ({
        id_existencia: item.idExistencia,
        cantidad: item.cantidad,
    })),
});

export const trasladoFormToUpdatePayload = (args: {
    idBodegaOrigen?: number;
    idBodegaDestino?: number;
    fecha?: string;
    nota?: string;
    idEstado?: number;
    detalle?: { idExistencia: number; cantidad: number }[];
}): UpdateTrasladoPayload => ({
    id_bodega_origen: args.idBodegaOrigen,
    id_bodega_destino: args.idBodegaDestino,
    fecha_traslado: args.fecha || undefined,
    nota: args.nota?.trim() || undefined,
    id_estado_traslado: args.idEstado,
    detalle: args.detalle?.map((item) => ({
        id_existencia: item.idExistencia,
        cantidad: item.cantidad,
    })),
});
