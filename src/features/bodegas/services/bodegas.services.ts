import api from "@/shared/services/api";
import { departamentosColombia } from "../../../data/colombia";
import type { Bodega } from "../../../data/bodegas";

type ApiMunicipio = {
  id_municipio: number;
  nombre_municipio?: string;
  municipio?: string;
  nombre?: string;
  nombre_departamento?: string;
  departamento?: { nombre_departamento?: string; nombre?: string } | string;
  departamentos?: { nombre_departamento?: string; nombre?: string } | string;
};

type ApiBodega = {
  id_bodega: number;
  nombre_bodega: string;
  direccion: string;
  id_municipio: number;
  estado: boolean;
  municipios?: ApiMunicipio | null;
};

type ApiBodegasResponse =
  | ApiBodega[]
  | {
      page: number;
      limit: number;
      total: number;
      pages: number;
      data: ApiBodega[];
    };

export type SaveBodegaPayload = {
  nombre: string;
  departamento: string;
  municipio: string;
  direccion: string;
  estado: boolean;
};

const isApiBodega = (value: unknown): value is ApiBodega => {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<ApiBodega>;
  return typeof item.id_bodega === "number";
};

const getMunicipioName = (municipio?: ApiMunicipio | null): string => {
  if (!municipio) return "";

  return (
    municipio.nombre_municipio ||
    municipio.municipio ||
    municipio.nombre ||
    ""
  );
};

const getDepartamentoFromStatic = (municipioNombre: string): string => {
  if (!municipioNombre) return "";

  const dept = departamentosColombia.find((item) =>
    item.municipios.includes(municipioNombre)
  );

  return dept?.nombre ?? "";
};

const getDepartamentoName = (
  municipio?: ApiMunicipio | null,
  municipioNombre = ""
): string => {
  if (!municipio) {
    return getDepartamentoFromStatic(municipioNombre);
  }

  if (municipio.nombre_departamento) {
    return municipio.nombre_departamento;
  }

  if (typeof municipio.departamento === "string") {
    return municipio.departamento;
  }

  if (municipio.departamento && typeof municipio.departamento === "object") {
    return (
      municipio.departamento.nombre_departamento ||
      municipio.departamento.nombre ||
      getDepartamentoFromStatic(municipioNombre)
    );
  }

  if (typeof municipio.departamentos === "string") {
    return municipio.departamentos;
  }

  if (municipio.departamentos && typeof municipio.departamentos === "object") {
    return (
      municipio.departamentos.nombre_departamento ||
      municipio.departamentos.nombre ||
      getDepartamentoFromStatic(municipioNombre)
    );
  }

  return getDepartamentoFromStatic(municipioNombre);
};

const normalizeBodega = (item: ApiBodega): Bodega => {
  const municipio = getMunicipioName(item.municipios);

  return {
    id: item.id_bodega,
    nombre: item.nombre_bodega ?? "",
    municipio,
    departamento: getDepartamentoName(item.municipios, municipio),
    direccion: item.direccion ?? "",
    estado: Boolean(item.estado),
  };
};

const extractBodegasArray = (data: ApiBodegasResponse): ApiBodega[] => {
  return Array.isArray(data) ? data : data.data;
};

/**
 * OJO:
 * No enviamos "departamento" al backend porque tu servicio de Nest
 * resuelve con municipio o id_municipio.
 * Si tienes whitelist/forbidNonWhitelisted, mandar departamento rompe.
 */
const mapSavePayload = (payload: SaveBodegaPayload) => {
  return {
    nombre_bodega: payload.nombre.trim(),
    direccion: payload.direccion.trim(),
    municipio: payload.municipio,
    estado: payload.estado,
  };
};

export async function getBodegas(): Promise<Bodega[]> {
  const { data } = await api.get<ApiBodegasResponse>("/bodega", {
    params: { includeMunicipio: true },
  });

  return extractBodegasArray(data).map(normalizeBodega);
}

export async function getBodegaById(id: number): Promise<Bodega> {
  const { data } = await api.get<ApiBodega>(`/bodega/${id}`, {
    params: { includeMunicipio: true },
  });

  return normalizeBodega(data);
}

export async function createBodega(
  payload: SaveBodegaPayload
): Promise<Bodega> {
  const body = mapSavePayload(payload);

  const { data } = await api.post<ApiBodega>("/bodega", body);

  if (!isApiBodega(data)) {
    throw new Error("Respuesta inválida al crear bodega");
  }

  return getBodegaById(data.id_bodega);
}

export async function updateBodega(
  id: number,
  payload: SaveBodegaPayload
): Promise<Bodega> {
  const body = mapSavePayload(payload);

  await api.patch(`/bodega/${id}`, body);

  return getBodegaById(id);
}

export async function deleteBodega(id: number): Promise<Bodega> {
  await api.delete(`/bodega/${id}`);

  return getBodegaById(id);
}

export async function toggleEstadoBodega(id: number): Promise<Bodega> {
  const actual = await getBodegaById(id);

  if (actual.estado) {
    await api.delete(`/bodega/${id}`);
    return getBodegaById(id);
  }

  await api.patch(`/bodega/${id}/enable`);
  return getBodegaById(id);
}
