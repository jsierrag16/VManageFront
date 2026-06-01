import api from "@/shared/services/api";
import type {
  CategoriaProductoBackend,
  IvaBackend,
} from "./productos.services";

export const getCategoriasProducto = async (): Promise<CategoriaProductoBackend[]> => {
  const { data } = await api.get("/categoria-producto");
  return data;
};

export const getIvas = async (): Promise<IvaBackend[]> => {
  const { data } = await api.get("/iva");
  return data;
};

export type CreateIvaPayload = {
  porcentaje: number;
};

export const createIva = async (payload: CreateIvaPayload) => {
  const { data } = await api.post("/iva", payload);
  return data?.data ?? data;
};