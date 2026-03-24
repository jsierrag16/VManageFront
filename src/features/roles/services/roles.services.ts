import api from "@/shared/services/api";

export type PermisoBackend = {
  id_permiso: number;
  nombre_permiso: string;
};

export type RolBackend = {
  id_rol: number;
  nombre_rol: string;
  descripcion: string | null;
  estado: boolean;
  _count?: {
    usuario?: number;
  };
  roles_permisos?: {
    permisos: PermisoBackend;
  }[];
};

export type CreateRolPayload = {
  nombre_rol: string;
  descripcion: string;
  estado?: boolean;
  ids_permisos?: number[];
};

export type UpdateRolPayload = {
  nombre_rol?: string;
  descripcion?: string;
  estado?: boolean;
  ids_permisos?: number[];
};

export const getRoles = async (
  incluirInactivos = true,
): Promise<RolBackend[]> => {
  const { data } = await api.get("/roles", {
    params: { incluirInactivos },
  });
  return data;
};

export const getRolById = async (id: number): Promise<RolBackend> => {
  const { data } = await api.get(`/roles/${id}`);
  return data;
};

export const createRol = async (
  payload: CreateRolPayload,
): Promise<RolBackend> => {
  const { data } = await api.post("/roles", payload);
  return data;
};

export const updateRol = async (
  id: number,
  payload: UpdateRolPayload,
): Promise<RolBackend> => {
  const { data } = await api.patch(`/roles/${id}`, payload);
  return data;
};

export const updateRolPermisos = async (
  id: number,
  ids_permisos: number[],
): Promise<RolBackend> => {
  const { data } = await api.patch(`/roles/${id}/permisos`, {
    ids_permisos,
  });
  return data;
};

export const deleteRol = async (id: number): Promise<RolBackend> => {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
};
