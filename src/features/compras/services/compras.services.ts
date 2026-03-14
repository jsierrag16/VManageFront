import api from "@/shared/services/api";
import { mapApiCompraToUI } from "./compras.mapper";
import type {
  CompraUI,
  CreateCompraPayload,
  UpdateCompraPayload,
} from "./compras.types";

export async function getCompras(idBodega?: number): Promise<CompraUI[]> {
  const { data } = await api.get("/compras", {
    params: idBodega ? { id_bodega: idBodega } : undefined,
  });

  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapApiCompraToUI);
}

export async function getCompraById(id: number): Promise<CompraUI> {
  const { data } = await api.get(`/compras/${id}`);
  return mapApiCompraToUI(data);
}

export async function createCompra(payload: CreateCompraPayload): Promise<CompraUI> {
  const { data } = await api.post("/compras", payload);
  return mapApiCompraToUI(data);
}

export async function updateCompra(
  id: number,
  payload: UpdateCompraPayload
): Promise<CompraUI> {
  const { data } = await api.patch(`/compras/${id}`, payload);
  return mapApiCompraToUI(data);
}
