import api from "@/shared/services/api";

export type DepartamentoBackend = {
  id_departamento: number;
  nombre_departamento: string;
  id_pais: number;
};

export type MunicipioBackend = {
  id_municipio: number;
  nombre_municipio: string;
  id_departamento: number;
  departamentos?: {
    id_departamento: number;
    nombre_departamento: string;
    id_pais: number;
    paises?: {
      id_pais: number;
      nombre_pais: string;
    } | null;
  } | null;
};

export type DepartamentoOption = {
  id: number;
  nombre: string;
  raw: DepartamentoBackend;
};

export type MunicipioOption = {
  id: number;
  nombre: string;
  idDepartamento: number;
  departamento: string;
  raw: MunicipioBackend;
};

export type BodegaBackend = {
  id_bodega: number;
  nombre_bodega: string;
  direccion: string;
  id_municipio: number;
  estado: boolean;
  municipios?: {
    id_municipio: number;
    nombre_municipio: string;
    id_departamento: number;
    departamentos?: {
      id_departamento: number;
      nombre_departamento: string;
    } | null;
  } | null;
  _count?: {
    bodegas_por_usuario: number;
  };
};

export type Bodega = {
  id: number;
  nombre: string;
  direccion: string;
  idMunicipio: number;
  municipio: string;
  departamento: string;
  estado: boolean;
  tieneUsuariosAsignados: boolean;
  usuariosAsignados: number;
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
  const usuariosAsignados = item._count?.bodegas_por_usuario ?? 0;

  return {
    id: item.id_bodega,
    nombre: item.nombre_bodega,
    direccion: item.direccion,
    idMunicipio: item.id_municipio,
    municipio: item.municipios?.nombre_municipio ?? "",
    departamento: item.municipios?.departamentos?.nombre_departamento ?? "",
    estado: item.estado,
    tieneUsuariosAsignados: usuariosAsignados > 0,
    usuariosAsignados,
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

function mapDepartamento(item: DepartamentoBackend): DepartamentoOption {
  return {
    id: item.id_departamento,
    nombre: item.nombre_departamento,
    raw: item,
  };
}

function mapMunicipio(item: MunicipioBackend): MunicipioOption {
  return {
    id: item.id_municipio,
    nombre: item.nombre_municipio,
    idDepartamento: item.id_departamento,
    departamento: item.departamentos?.nombre_departamento ?? "",
    raw: item,
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

export async function toggleEstadoBodega(
  id: number,
  estadoActual: boolean
): Promise<Bodega> {
  if (estadoActual) {
    return disableBodega(id);
  }
  return enableBodega(id);
}

export async function getDepartamentos(): Promise<DepartamentoOption[]> {
  const { data } = await api.get<DepartamentoBackend[]>("/departamentos", {
    params: { id_pais: 1 },
  });

  return data.map(mapDepartamento);
}

export async function getMunicipios(
  idDepartamento: number
): Promise<MunicipioOption[]> {
  const { data } = await api.get<MunicipioBackend[]>("/municipios", {
    params: { id_departamento: idDepartamento },
  });

  return data.map(mapMunicipio);
}