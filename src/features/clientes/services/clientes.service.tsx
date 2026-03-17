import api from "@/shared/services/api";
import type { ClienteApi, ClienteFormPayload } from "../types/clientes.types";

export const clientesService = {
  async getAll(params?: { q?: string; incluirInactivos?: boolean }) {
    const response = await api.get<ClienteApi[]>("/clientes", {
      params: {
        q: params?.q || undefined,
        incluirInactivos: params?.incluirInactivos ?? true,
      },
    });

    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<ClienteApi>(`/clientes/${id}`);
    return response.data;
  },

  async create(payload: ClienteFormPayload) {
    const response = await api.post<ClienteApi>("/clientes", payload);
    return response.data;
  },

  async update(id: number, payload: Partial<ClienteFormPayload> & { estado?: boolean }) {
    const response = await api.patch<ClienteApi>(`/clientes/${id}`, payload);
    return response.data;
  },

  async remove(id: number) {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },

  async getMeta() {
    const response = await api.get("/clientes/meta");
    return response.data;
  },
};