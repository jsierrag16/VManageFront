import api from "@/shared/services/api";

export type SelectOption = {
  value: string;
  label: string;
};

type ApiCategoriaProducto = {
  id_categoria_producto: number;
  nombre_categoria: string;
};

type ApiIva = {
  id_iva: number;
  porcentaje: number | string;
};

export const catalogosService = {
  async getCategoriasProducto(): Promise<SelectOption[]> {
    const { data } = await api.get<ApiCategoriaProducto[]>("/categoria-producto");

    return data.map((item) => ({
      value: String(item.id_categoria_producto),
      label: item.nombre_categoria,
    }));
  },

  async getIvas(): Promise<SelectOption[]> {
    const { data } = await api.get<ApiIva[]>("/iva");

    return data.map((item) => ({
      value: String(item.id_iva),
      label: `${item.porcentaje}%`,
    }));
  },
};
