import api from "@/shared/services/api";

type ApiCategoriaProducto = {
  id_categoria_producto?: number;
  nombre_categoria_producto?: string;
  categoria_producto?: string;
  nombre?: string;
};

type ApiIva = {
  id_iva?: number;
  porcentaje_iva?: number | string;
  porcentaje?: number | string;
  valor_iva?: number | string;
  valor?: number | string;
  nombre_iva?: string;
  nombre?: string;
};

export type ApiProducto = {
  id_producto: number;
  codigo_producto?: string | null;
  nombre_producto: string;
  descripcion?: string | null;
  codigo_barras?: string | null;
  id_categoria_producto: number;
  id_iva: number;
  estado: boolean;
  categoria_producto?: ApiCategoriaProducto | null;
  iva?: ApiIva | null;
};

type ApiProductosFindAllResponse =
  | ApiProducto[]
  | {
      page: number;
      limit: number;
      total: number;
      pages: number;
      data: ApiProducto[];
    };

export type ProductoUI = {
  id: number;
  codigoProducto: string;
  nombre: string;
  descripcion: string;
  codigoBarras: string;
  idCategoriaProducto: number;
  categoriaNombre: string;
  idIva: number;
  ivaValor: number | null;
  ivaLabel: string;
  estado: boolean;
};

export type ProductoFormPayload = {
  codigo_producto?: string;
  nombre_producto: string;
  descripcion?: string;
  codigo_barras?: string;
  id_categoria_producto: number;
  id_iva: number;
  estado?: boolean;
};

export type FindAllProductosParams = {
  page?: number;
  limit?: number;
  q?: string;
  estado?: "true" | "false";
  includeRefs?: boolean;
  id_categoria_producto?: number;
  id_iva?: number;
  codigo_barras?: string;
};

export type ProductosListResult = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: ProductoUI[];
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const getCategoriaNombre = (
  categoria?: ApiCategoriaProducto | null,
  fallbackId?: number
): string => {
  const nombre =
    categoria?.nombre_categoria_producto ||
    categoria?.categoria_producto ||
    categoria?.nombre;

  return nombre?.trim() || `ID ${fallbackId ?? ""}`.trim();
};

const getIvaValor = (iva?: ApiIva | null): number | null => {
  return (
    parseNumber(iva?.porcentaje_iva) ??
    parseNumber(iva?.porcentaje) ??
    parseNumber(iva?.valor_iva) ??
    parseNumber(iva?.valor)
  );
};

const getIvaLabel = (iva?: ApiIva | null, fallbackId?: number): string => {
  const porcentaje = getIvaValor(iva);
  if (porcentaje !== null) return `${porcentaje}%`;

  const nombre = iva?.nombre_iva || iva?.nombre;
  return nombre?.trim() || `ID ${fallbackId ?? ""}`.trim();
};

export const mapProductoFromApi = (producto: ApiProducto): ProductoUI => {
  const ivaValor = getIvaValor(producto.iva);

  return {
    id: producto.id_producto,
    codigoProducto: producto.codigo_producto?.trim() || "",
    nombre: producto.nombre_producto?.trim() || "",
    descripcion: producto.descripcion?.trim() || "",
    codigoBarras: producto.codigo_barras?.trim() || "",
    idCategoriaProducto: producto.id_categoria_producto,
    categoriaNombre: getCategoriaNombre(
      producto.categoria_producto,
      producto.id_categoria_producto
    ),
    idIva: producto.id_iva,
    ivaValor,
    ivaLabel: getIvaLabel(producto.iva, producto.id_iva),
    estado: Boolean(producto.estado),
  };
};

const normalizeListResponse = (
  response: ApiProductosFindAllResponse
): ProductosListResult => {
  if (Array.isArray(response)) {
    return {
      page: 1,
      limit: response.length || 10,
      total: response.length,
      pages: response.length > 0 ? 1 : 1,
      data: response.map(mapProductoFromApi),
    };
  }

  return {
    page: response.page,
    limit: response.limit,
    total: response.total,
    pages: response.pages,
    data: response.data.map(mapProductoFromApi),
  };
};

export const productosService = {
  async findAll(params: FindAllProductosParams = {}): Promise<ProductosListResult> {
    const { data } = await api.get<ApiProductosFindAllResponse>("/producto", {
      params: {
        includeRefs:
          params.includeRefs !== undefined
            ? params.includeRefs
              ? "true"
              : "false"
            : undefined,
        page: params.page,
        limit: params.limit,
        q: params.q?.trim() || undefined,
        estado: params.estado,
        id_categoria_producto: params.id_categoria_producto,
        id_iva: params.id_iva,
        codigo_barras: params.codigo_barras?.trim() || undefined,
      },
    });

    return normalizeListResponse(data);
  },

  async findOne(id: number, includeRefs = true): Promise<ProductoUI> {
    const { data } = await api.get<ApiProducto>(`/producto/${id}`, {
      params: {
        includeRefs: includeRefs ? "true" : "false",
      },
    });

    return mapProductoFromApi(data);
  },

  async create(payload: ProductoFormPayload): Promise<ProductoUI> {
    const { data } = await api.post<ApiProducto>("/producto", payload);
    return mapProductoFromApi(data);
  },

  async update(id: number, payload: Partial<ProductoFormPayload>): Promise<ProductoUI> {
    const { data } = await api.patch<ApiProducto>(`/producto/${id}`, payload);
    return mapProductoFromApi(data);
  },

  async disable(id: number): Promise<ProductoUI> {
    const { data } = await api.delete<ApiProducto>(`/producto/${id}`);
    return mapProductoFromApi(data);
  },

  async enable(id: number): Promise<ProductoUI> {
    const { data } = await api.patch<ApiProducto>(`/producto/${id}/enable`);
    return mapProductoFromApi(data);
  },
};
