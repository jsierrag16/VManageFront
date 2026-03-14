import api from "@/shared/services/api";

export type CategoriaProductoBackend = {
    id_categoria_producto: number;
    nombre_categoria: string;
};

export type IvaBackend = {
    id_iva: number;
    porcentaje: number | string;
};

export type ProductoBackend = {
    id_producto: number;
    nombre_producto: string;
    descripcion?: string | null;
    id_categoria_producto: number;
    id_iva: number;
    estado: boolean;
    categoria_producto?: CategoriaProductoBackend | null;
    iva?: IvaBackend | null;
};

export type ProductosResponse =
    | ProductoBackend[]
    | {
        page: number;
        limit: number;
        total: number;
        pages: number;
        data: ProductoBackend[];
    };

export type GetProductosParams = {
    q?: string;
    estado?: boolean | "todos";
    id_categoria_producto?: number;
    id_iva?: number;
    page?: number;
    limit?: number;
    includeRefs?: boolean;
};

export type CreateProductoPayload = {
    nombre_producto: string;
    descripcion?: string;
    id_categoria_producto: number;
    id_iva: number;
    estado?: boolean;
};

export type UpdateProductoPayload = {
    nombre_producto?: string;
    descripcion?: string;
    id_categoria_producto?: number;
    id_iva?: number;
    estado?: boolean;
};

const buildGetProductosParams = (params: GetProductosParams = {}) => {
    const query: Record<string, string | number> = {};

    if (params.q?.trim()) {
        query.q = params.q.trim();
    }

    if (params.estado !== undefined && params.estado !== "todos") {
        query.estado = params.estado ? "true" : "false";
    }

    if (params.id_categoria_producto) {
        query.id_categoria_producto = params.id_categoria_producto;
    }

    if (params.id_iva) {
        query.id_iva = params.id_iva;
    }

    if (params.page) {
        query.page = params.page;
    }

    if (params.limit) {
        query.limit = params.limit;
    }

    query.includeRefs = params.includeRefs === false ? "false" : "true";

    return query;
};

export const getProductos = async (
    params: GetProductosParams = {}
): Promise<ProductosResponse> => {
    const { data } = await api.get("/producto", {
        params: buildGetProductosParams(params),
    });
    return data;
};

export const getProductoById = async (
    id: number,
    includeRefs = true
): Promise<ProductoBackend> => {
    const { data } = await api.get(`/producto/${id}`, {
        params: {
            includeRefs: includeRefs ? "true" : "false",
        },
    });
    return data;
};

export const createProducto = async (
    payload: CreateProductoPayload
): Promise<ProductoBackend> => {
    const { data } = await api.post("/producto", payload);
    return data;
};

export const updateProducto = async (
    id: number,
    payload: UpdateProductoPayload
): Promise<ProductoBackend> => {
    const { data } = await api.patch(`/producto/${id}`, payload);
    return data;
};

export const disableProducto = async (
    id: number
): Promise<ProductoBackend> => {
    const { data } = await api.delete(`/producto/${id}`);
    return data;
};

export const enableProducto = async (
    id: number
): Promise<ProductoBackend> => {
    const { data } = await api.patch(`/producto/${id}/enable`, {});
    return data;
};

export const cambiarEstadoProducto = async (
    id: number,
    nuevoEstado: boolean
): Promise<ProductoBackend> => {
    return nuevoEstado ? enableProducto(id) : disableProducto(id);
};

export type ProductoVistaBackend = {
    id_producto: number;
    nombre_producto: string;
    descripcion?: string | null;
    id_categoria_producto: number;
    id_iva: number;
    estado: boolean;
    categoria_producto?: CategoriaProductoBackend | null;
    iva?: IvaBackend | null;
    stock_total: number;
    lotes: {
        id_existencia: number;
        lote: string;
        cantidad: number;
        fecha_vencimiento: string | null;
        id_bodega: number;
        nombre_bodega: string;
    }[];
};

export const getProductosVista = async (
    scope: "active" | "all" = "all"
): Promise<ProductoVistaBackend[]> => {
    const { data } = await api.get("/existencias/productos-vista", {
        params: { scope },
    });
    return data;
};

