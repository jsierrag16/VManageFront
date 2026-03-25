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