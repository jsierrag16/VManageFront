import api from "@/shared/services/api";

type ApiExistenciaProductoRef = {
  id_producto?: number;
  nombre_producto?: string;
  codigo_producto?: string | null;
};

type ApiExistenciaRaw = {
  id_existencia?: number;
  id_producto?: number;
  id_bodega?: number;
  cantidad?: number | string;
  lote?: string | null;
  fecha_vencimiento?: string | null;
  nota?: string | null;
  producto?: ApiExistenciaProductoRef | null;
};

export type ExistenciaUI = {
  id: number;
  idProducto: number;
  idBodega: number | null;
  cantidad: number;
  lote: string;
  fechaVencimiento: string | null;
  nota: string;
  productoNombre: string;
  productoCodigo: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return fallback;
};

const mapExistenciaFromApi = (item: ApiExistenciaRaw): ExistenciaUI => {
  return {
    id: toNumber(item.id_existencia, 0),
    idProducto: toNumber(item.id_producto ?? item.producto?.id_producto, 0),
    idBodega:
      item.id_bodega !== undefined && item.id_bodega !== null
        ? toNumber(item.id_bodega, 0)
        : null,
    cantidad: toNumber(item.cantidad, 0),
    lote: item.lote?.trim() || "",
    fechaVencimiento: item.fecha_vencimiento || null,
    nota: item.nota?.trim() || "",
    productoNombre: item.producto?.nombre_producto?.trim() || "",
    productoCodigo: item.producto?.codigo_producto?.trim() || "",
  };
};

export const existenciasService = {
  async findAll(): Promise<ExistenciaUI[]> {
    const { data } = await api.get<ApiExistenciaRaw[]>("/existencias");
    return Array.isArray(data) ? data.map(mapExistenciaFromApi) : [];
  },

  async findOne(id: number): Promise<ExistenciaUI> {
    const { data } = await api.get<ApiExistenciaRaw>(`/existencias/${id}`);
    return mapExistenciaFromApi(data);
  },
};
