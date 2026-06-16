import api from "@/shared/services/api";
import type {
  ClienteApi,
  ClienteFormPayload,
  DepartamentoOption,
  MunicipioOption,
} from "../types/clientes.types";

export const clientesService = {
  async getAll(params?: {
    q?: string;
    incluirInactivos?: boolean;
    id_bodega?: number;
  }) {
    const response = await api.get<ClienteApi[]>("/clientes", {
      params: {
        q: params?.q || undefined,
        incluirInactivos: params?.incluirInactivos ?? true,
        id_bodega:
          params?.id_bodega && params.id_bodega > 0
            ? params.id_bodega
            : undefined,
      },
    });

    return response.data;
  },

  async getDepartamentos() {
    const response = await api.get<DepartamentoOption[]>("/departamentos");

    return response.data.map((item: any) => ({
      id: item.id_departamento ?? item.id,
      nombre:
        item.nombre_departamento ??
        item.nombre ??
        item.departamento ??
        "Sin nombre",
    }));
  },

  async getMunicipiosByDepartamento(idDepartamento: number) {
    const response = await api.get<MunicipioOption[]>("/municipios", {
      params: {
        id_departamento: idDepartamento,
      },
    });

    return response.data.map((item: any) => {
      const departamentoRef = item.departamentos ?? item.departamento ?? null;

      return {
        id: item.id_municipio ?? item.id,
        nombre:
          item.nombre_municipio ??
          item.nombre ??
          item.municipio ??
          "Sin nombre",
        idDepartamento: Number(
          item.id_departamento ??
          departamentoRef?.id_departamento ??
          0
        ),
        departamento:
          departamentoRef?.nombre_departamento ??
          departamentoRef?.nombre ??
          departamentoRef?.departamento ??
          "",
      };
    });
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
