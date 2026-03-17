import api from "@/shared/services/api";

export type OpcionCatalogo = {
  id: number;
  nombre: string;
};

export async function getTiposDocumentoCatalogo(): Promise<OpcionCatalogo[]> {
  const { data } = await api.get("/tipo-documento");
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id_tipo_doc,
    nombre: item.nombre_doc,
  }));
}

export async function getRolesCatalogo(): Promise<OpcionCatalogo[]> {
  const { data } = await api.get("/roles");
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id_rol,
    nombre: item.nombre_rol,
  }));
}

export async function getBodegasCatalogo(): Promise<OpcionCatalogo[]> {
  const { data } = await api.get("/bodega");
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id_bodega,
    nombre: item.nombre_bodega,
  }));
}

export async function getGenerosCatalogo() {
  const { data } = await api.get("/genero");
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    id: item.id_genero,
    nombre: item.nombre_genero,
  }));
}