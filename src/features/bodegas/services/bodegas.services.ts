import api from "@/shared/services/api";

export type BodegaBackend = {
  id_bodega: number;
  nombre_bodega: string;
  direccion: string;
  id_municipio: number;
  estado: boolean;
  municipios?: {
    id_municipio: number;
    nombre_municipio: string;
    departamentos?: {
      id_departamento: number;
      nombre_departamento: string;
    } | null;
  } | null;
};

export type Bodega = {
  id: number;
  nombre: string;
  direccion: string;
  idMunicipio: number;
  municipio: string;
  departamento: string;
  estado: boolean;
  raw: BodegaBackend;
};

export type CreateBodegaPayload = {
  nombre_bodega: string;
  direccion: string;
  id_municipio: number;
  estado?: boolean;
};

export type UpdateBodegaPayload = Partial<CreateBodegaPayload>;

type BodegasListRawResponse =
  | BodegaBackend[]
  | {
      page: number;
      limit: number;
      total: number;
      pages: number;
      data: BodegaBackend[];
    };

export type BodegasListResponse = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: Bodega[];
};

function mapBodegaBackendToFrontend(item: BodegaBackend): Bodega {
  return {
    id: item.id_bodega,
    nombre: item.nombre_bodega,
    direccion: item.direccion,
    idMunicipio: item.id_municipio,
    municipio: item.municipios?.nombre_municipio ?? "",
    departamento: item.municipios?.departamentos?.nombre_departamento ?? "",
    estado: item.estado,
    raw: item,
  };
}

function normalizeBodegasResponse(raw: BodegasListRawResponse): BodegasListResponse {
  if (Array.isArray(raw)) {
    const mapped = raw.map(mapBodegaBackendToFrontend);
    return {
      page: 1,
      limit: mapped.length || 1,
      total: mapped.length,
      pages: 1,
      data: mapped,
    };
  }

  return {
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    pages: raw.pages,
    data: raw.data.map(mapBodegaBackendToFrontend),
  };
}

export async function getBodegas(): Promise<BodegasListResponse> {
  const { data } = await api.get<BodegasListRawResponse>("/bodega", {
    params: { includeMunicipio: "true" },
  });

  return normalizeBodegasResponse(data);
}

export async function getBodegaById(id: number): Promise<Bodega> {
  const { data } = await api.get<BodegaBackend>(`/bodega/${id}`, {
    params: { includeMunicipio: "true" },
  });

  return mapBodegaBackendToFrontend(data);
}

export async function createBodega(payload: CreateBodegaPayload): Promise<Bodega> {
  const { data } = await api.post<BodegaBackend>("/bodega", payload);
  return mapBodegaBackendToFrontend(data);
}

export async function updateBodega(
  id: number,
  payload: UpdateBodegaPayload
): Promise<Bodega> {
  const { data } = await api.patch<BodegaBackend>(`/bodega/${id}`, payload);
  return mapBodegaBackendToFrontend(data);
}

export async function deleteBodega(id: number): Promise<Bodega> {
  const { data } = await api.delete<BodegaBackend>(`/bodega/${id}`);
  return mapBodegaBackendToFrontend(data);
}

export async function disableBodega(id: number): Promise<Bodega> {
  const { data } = await api.patch<BodegaBackend>(`/bodega/${id}/disable`);
  return mapBodegaBackendToFrontend(data);
}

export async function enableBodega(id: number): Promise<Bodega> {
  const { data } = await api.patch<BodegaBackend>(`/bodega/${id}/enable`);
  return mapBodegaBackendToFrontend(data);
}

export async function toggleEstadoBodega(bodega: Bodega): Promise<Bodega> {
  if (bodega.estado) {
    return disableBodega(bodega.id);
  }
  return enableBodega(bodega.id);
}