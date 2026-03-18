import api from "@/shared/services/api";
import type { BasicOption, IvaOption, Compra, CompraCreatePayload, CompraUpdatePayload } from "./compras.types";
import { mapCompraDetail, mapCompraList } from "./compras.mapper";

type CatalogosResponse = {
  proveedores: BasicOption[];
  productos: BasicOption[];
  terminosPago: BasicOption[];
  ivas: IvaOption[];
  bodegas: BasicOption[];
  huboError: boolean;
};

const mapBasicOption = (row: any): BasicOption => ({
  id:
    row.id ??
    row.id_proveedor ??
    row.id_producto ??
    row.id_termino_pago ??
    row.id_bodega ??
    0,
  nombre:
    row.nombre ??
    row.nombre_empresa ??
    row.nombre_producto ??
    row.nombre_termino ??
    row.nombre_bodega ??
    "-",
  estado: row.estado,
});

const mapIvaOption = (row: any): IvaOption => ({
  id: row.id ?? row.id_iva ?? 0,
  nombre: row.nombre ?? row.nombre_iva ?? `IVA ${row.porcentaje ?? ""}`.trim(),
  porcentaje: Number(row.porcentaje ?? 0),
  estado: row.estado,
});

const getRequestFirstSuccess = async (paths: string[]) => {
  let lastError: unknown;

  for (const path of paths) {
    try {
      const res = await api.get(path);
      return res.data;
    } catch (error) {
      lastError = error;
      console.warn(`Fallo catálogo en ruta ${path}`, error);
    }
  }

  throw lastError;
};

export const comprasService = {
  async getAll(idBodega?: number): Promise<Compra[]> {
    const { data } = await api.get("/compras", {
      params: idBodega ? { id_bodega: idBodega } : undefined,
    });

    return Array.isArray(data) ? data.map(mapCompraList) : [];
  },

  async getById(id: number): Promise<Compra> {
    const { data } = await api.get(`/compras/${id}`);
    return mapCompraDetail(data);
  },

  async create(payload: CompraCreatePayload): Promise<Compra> {
    const { data } = await api.post("/compras", payload);
    return mapCompraDetail(data);
  },

  async update(id: number, payload: CompraUpdatePayload): Promise<Compra> {
    const { data } = await api.patch(`/compras/${id}`, payload);
    return mapCompraDetail(data);
  },

  async aprobar(id: number): Promise<Compra> {
    const { data } = await api.patch(`/compras/${id}/aprobar`);
    return mapCompraDetail(data);
  },

  async anular(id: number): Promise<Compra> {
    const { data } = await api.patch(`/compras/${id}/anular`);
    return mapCompraDetail(data);
  },

  async getCatalogos(): Promise<CatalogosResponse> {
    const results = await Promise.allSettled([
      getRequestFirstSuccess(["/proveedores", "/proveedor"]),
      getRequestFirstSuccess(["/productos", "/producto"]),
      getRequestFirstSuccess(["/terminos-pago", "/termino-pago", "/terminos_pago", "/termino_pago"]),
      getRequestFirstSuccess(["/ivas", "/iva"]),
      getRequestFirstSuccess(["/bodegas", "/bodega"]),
    ]);

    const [proveedoresRes, productosRes, terminosRes, ivasRes, bodegasRes] = results;

    const huboError = results.some((r) => r.status === "rejected");

    return {
      proveedores:
        proveedoresRes.status === "fulfilled" && Array.isArray(proveedoresRes.value)
          ? proveedoresRes.value.map(mapBasicOption)
          : [],
      productos:
        productosRes.status === "fulfilled" && Array.isArray(productosRes.value)
          ? productosRes.value.map(mapBasicOption)
          : [],
      terminosPago:
        terminosRes.status === "fulfilled" && Array.isArray(terminosRes.value)
          ? terminosRes.value.map(mapBasicOption)
          : [],
      ivas:
        ivasRes.status === "fulfilled" && Array.isArray(ivasRes.value)
          ? ivasRes.value.map(mapIvaOption)
          : [],
      bodegas:
        bodegasRes.status === "fulfilled" && Array.isArray(bodegasRes.value)
          ? bodegasRes.value.map(mapBasicOption)
          : [],
      huboError,
    };
  },
};
