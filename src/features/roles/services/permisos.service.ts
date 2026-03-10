import api from "@/shared/services/api";

export type PermisoBackend = {
  id_permiso: number;
  nombre_permiso: string;
};

export const getPermisos = async (): Promise<PermisoBackend[]> => {
  const { data } = await api.get("/permisos");
  return data;
};
