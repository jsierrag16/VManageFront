import type {
    CategoriaProductoBackend,
    IvaBackend,
    ProductoBackend,
    ProductosResponse,
    CreateProductoPayload,
} from "./productos.services";

import type { ProductoVistaBackend } from "./productos.services";

export type ProductoVistaUI = {
    id: number;
    nombre: string;
    categoria: string;
    descripcion: string;
    iva: number;
    stockTotal: number;
    estado: boolean;
    lotes: {
        id: number;
        numeroLote: string;
        cantidadDisponible: number;
        fechaVencimiento: string;
        bodega: string;
        idBodega: number;
    }[];
    raw: ProductoVistaBackend;
};

export const productoVistaBackendToUI = (
    producto: ProductoVistaBackend
): ProductoVistaUI => {
    return {
        id: producto.id_producto,
        nombre: producto.nombre_producto,
        categoria: producto.categoria_producto?.nombre_categoria ?? "",
        descripcion: producto.descripcion ?? "",
        iva: toNumber(producto.iva?.porcentaje),
        stockTotal: producto.stock_total,
        estado: producto.estado,
        lotes: producto.lotes.map((lote) => ({
            id: lote.id_existencia,
            numeroLote: lote.lote,
            cantidadDisponible: Number(lote.cantidad),
            fechaVencimiento: lote.fecha_vencimiento ?? "",
            bodega: lote.nombre_bodega,
            idBodega: lote.id_bodega,
        })),
        raw: producto,
    };
};

export const productosVistaBackendToUI = (
    productos: ProductoVistaBackend[]
): ProductoVistaUI[] => {
    return productos.map(productoVistaBackendToUI);
};
export type ProductoUI = {
    id: number;
    nombre: string;
    descripcion: string;
    idCategoria: number;
    categoria: string;
    idIva: number;
    iva: number;
    estado: boolean;
    raw: ProductoBackend;
};

export type ProductosUIResponse =
    | ProductoUI[]
    | {
        page: number;
        limit: number;
        total: number;
        pages: number;
        data: ProductoUI[];
    };

export type ProductoFormValues = {
    nombre: string;
    descripcion: string;
    idCategoria: number;
    idIva: number;
    estado?: boolean;
};

export type OpcionCatalogo = {
    id: number;
    nombre: string;
};

const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

export const productoBackendToUI = (
    producto: ProductoBackend
): ProductoUI => {
    return {
        id: producto.id_producto,
        nombre: producto.nombre_producto,
        descripcion: producto.descripcion ?? "",
        idCategoria: producto.id_categoria_producto,
        categoria: producto.categoria_producto?.nombre_categoria ?? "",
        idIva: producto.id_iva,
        iva: toNumber(producto.iva?.porcentaje),
        estado: producto.estado,
        raw: producto,
    };
};

export const productosBackendToUI = (
    response: ProductosResponse
): ProductosUIResponse => {
    if (Array.isArray(response)) {
        return response.map(productoBackendToUI);
    }

    return {
        ...response,
        data: response.data.map(productoBackendToUI),
    };
};

export const productoFormToCreatePayload = (
    values: ProductoFormValues
): CreateProductoPayload => {
    return {
        nombre_producto: values.nombre.trim(),
        descripcion: values.descripcion.trim() || undefined,
        id_categoria_producto: values.idCategoria,
        id_iva: values.idIva,
        ...(values.estado !== undefined ? { estado: values.estado } : {}),
    };
};

export const productoFormToUpdatePayload = (
    values: ProductoFormValues
) => {
    return {
        nombre_producto: values.nombre.trim(),
        descripcion: values.descripcion.trim() || undefined,
        id_categoria_producto: values.idCategoria,
        id_iva: values.idIva,
        ...(values.estado !== undefined ? { estado: values.estado } : {}),
    };
};

export const categoriaProductoBackendToOption = (
    categoria: CategoriaProductoBackend
): OpcionCatalogo => {
    return {
        id: categoria.id_categoria_producto,
        nombre: categoria.nombre_categoria,
    };
};

export const ivaBackendToOption = (iva: IvaBackend): OpcionCatalogo => {
    return {
        id: iva.id_iva,
        nombre: `${toNumber(iva.porcentaje)}%`,
    };
};
