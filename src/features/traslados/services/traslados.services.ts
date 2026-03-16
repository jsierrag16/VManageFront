import api from "@/shared/services/api";

export type ExistenciaDisponibleBackend = {
    id_existencia: number;
    id_producto: number;
    id_bodega: number;
    nota?: string | null;
    cantidad: number | string;
    cantidad_reservada?: number | string | null;
    cantidad_disponible?: number | string | null;
    fecha_vencimiento?: string | null;
    lote: string;
    producto: {
        id_producto: number;
        nombre_producto: string;
        descripcion?: string | null;
        estado: boolean;
        iva?: {
            id_iva: number;
            porcentaje: number | string;
        } | null;
        categoria_producto?: {
            id_categoria_producto: number;
            nombre_categoria: string;
        } | null;
    };
    bodega: {
        id_bodega: number;
        nombre_bodega: string;
    };
};

export type TrasladoBackend = {
    id_traslado: number;
    codigo_traslado?: string | null;
    id_bodega_origen: number;
    id_bodega_destino: number;
    fecha_traslado: string;
    nota?: string | null;
    id_estado_traslado: number;
    id_responsable?: number | null;
    estado_traslado: {
        id_estado_traslado: number;
        nombre_estado: string;
    };
    bodega_traslado_id_bodega_origenTobodega: {
        id_bodega: number;
        nombre_bodega: string;
    };
    bodega_traslado_id_bodega_destinoTobodega: {
        id_bodega: number;
        nombre_bodega: string;
    };
    usuario?: {
        id_usuario: number;
        nombre: string;
        apellido: string;
        email: string;
    } | null;
};

export type TrasladoDetailBackend = TrasladoBackend & {
    detalle_traslado: {
        id_detalle: number;
        id_existencia: number;
        cantidad: number | string;
        existencias: {
            id_existencia: number;
            id_producto: number;
            id_bodega: number;
            cantidad: number | string;
            lote: string;
            fecha_vencimiento?: string | null;
            producto: {
                id_producto: number;
                nombre_producto: string;
            };
            bodega: {
                id_bodega: number;
                nombre_bodega: string;
            };
        };
    }[];
};

export type DetalleTrasladoPayload = {
    id_existencia: number;
    cantidad: number;
};

export type CreateTrasladoPayload = {
    id_bodega_origen: number;
    id_bodega_destino: number;
    fecha_traslado?: string;
    nota?: string;
    detalle: DetalleTrasladoPayload[];
};

export type UpdateTrasladoPayload = {
    id_bodega_origen?: number;
    id_bodega_destino?: number;
    fecha_traslado?: string;
    nota?: string;
    id_estado_traslado?: number;
    detalle?: DetalleTrasladoPayload[];
};

export const getTraslados = async (
    idBodega?: number
): Promise<TrasladoBackend[]> => {
    const { data } = await api.get("/traslados", {
        params: idBodega ? { id_bodega: idBodega } : undefined,
    });
    return data;
};

export const getTrasladoById = async (
    id: number
): Promise<TrasladoDetailBackend> => {
    const { data } = await api.get(`/traslados/${id}`);
    return data;
};

export const createTraslado = async (
    payload: CreateTrasladoPayload
): Promise<TrasladoDetailBackend> => {
    const { data } = await api.post("/traslados", payload);
    return data;
};

export const updateTraslado = async (
    id: number,
    payload: UpdateTrasladoPayload
): Promise<TrasladoDetailBackend> => {
    const { data } = await api.patch(`/traslados/${id}`, payload);
    return data;
};

export const getExistenciasDisponibles = async (
    idBodega?: number
): Promise<ExistenciaDisponibleBackend[]> => {
    const { data } = await api.get("/existencias", {
        params: idBodega ? { id_bodega: idBodega } : undefined,
    });
    return data;
};

export type BodegaCatalogoBackend = {
    id_bodega: number;
    nombre_bodega: string;
    estado: boolean;
};

export const getBodegasCatalogo = async (): Promise<BodegaCatalogoBackend[]> => {
    const { data } = await api.get("/bodega");
    return Array.isArray(data) ? data : data?.data ?? [];
};
