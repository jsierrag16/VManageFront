import api from "@/shared/services/api";

export type EstadoProveedor = "Activo" | "Inactivo";

type ApiListResponse<T> =
  | T[]
  | {
      page: number;
      limit: number;
      total: number;
      pages: number;
      data: T[];
    };

type ApiTipoDocumento = {
  id_tipo_doc: number;
  nombre_doc: string;
};

type ApiTipoProveedor = {
  id_tipo_proveedor: number;
  nombre_tipo_proveedor: string;
};

type ApiDepartamento = {
  id_departamento: number;
  nombre_departamento: string;
};

type ApiMunicipio = {
  id_municipio: number;
  nombre_municipio: string;
  id_departamento?: number;
  departamentos?: ApiDepartamento | null;
};

type ApiProveedor = {
  id_proveedor: number;
  codigo_proveedor?: string | null;
  num_documento: string;
  nombre_empresa: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  nombre_contacto?: string | null;
  id_tipo_proveedor: number;
  id_tipo_doc: number;
  id_municipio: number;
  estado: boolean;
  tipo_documento?: ApiTipoDocumento | null;
  tipo_proveedor?: ApiTipoProveedor | null;
  municipios?: ApiMunicipio | null;
};

export type CatalogOption = {
  value: string;
  label: string;
};

export type MunicipioOption = {
  value: string;
  label: string;
  nombre: string;
  departamento: string;
};

export type ProveedorItem = {
  id: number;
  codigoProveedor: string;
  numeroDocumento: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  estado: EstadoProveedor;
  idTipoDocumento: number;
  tipoDocumento: string;
  idTipoProveedor: number;
  tipoProveedor: string;
  idMunicipio: number;
  ciudad: string;
  departamento: string;
};

export type SaveProveedorPayload = {
  codigo_proveedor?: string;
  num_documento: string;
  nombre_empresa: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  nombre_contacto?: string;
  id_tipo_proveedor: number;
  id_tipo_doc: number;
  id_municipio: number;
  estado?: boolean;
};

export type GetProveedoresParams = {
  page?: number;
  limit?: number;
  q?: string;
  estado?: "true" | "false";
  id_tipo_proveedor?: number;
  id_tipo_doc?: number;
  id_municipio?: number;
};

const normalizeList = <T>(payload: ApiListResponse<T> | unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: T[] }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  return [];
};

const extractPagination = <T>(
  payload: ApiListResponse<T> | unknown,
  fallbackLimit: number,
  fallbackTotal: number
) => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: T[] }).data)
  ) {
    const typed = payload as {
      page?: number;
      limit?: number;
      total?: number;
      pages?: number;
      data: T[];
    };

    return {
      page: typed.page ?? 1,
      limit: typed.limit ?? fallbackLimit,
      total: typed.total ?? typed.data.length,
      pages:
        typed.pages ??
        Math.max(
          1,
          Math.ceil((typed.total ?? typed.data.length) / (typed.limit ?? fallbackLimit || 1))
        ),
    };
  }

  return {
    page: 1,
    limit: fallbackLimit,
    total: fallbackTotal,
    pages: Math.max(1, Math.ceil(fallbackTotal / (fallbackLimit || 1))),
  };
};

const uniqueByValue = <T extends { value: string }>(items: T[]) => {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.value, item);
  }
  return Array.from(map.values());
};

export const mapProveedorApiToUi = (item: ApiProveedor): ProveedorItem => ({
  id: item.id_proveedor,
  codigoProveedor: item.codigo_proveedor?.trim() || "",
  numeroDocumento: item.num_documento?.trim() || "",
  nombre: item.nombre_empresa?.trim() || "",
  email: item.email?.trim() || "",
  telefono: item.telefono?.trim() || "",
  direccion: item.direccion?.trim() || "",
  contacto: item.nombre_contacto?.trim() || "",
  estado: item.estado ? "Activo" : "Inactivo",
  idTipoDocumento: item.id_tipo_doc,
  tipoDocumento: item.tipo_documento?.nombre_doc?.trim() || "",
  idTipoProveedor: item.id_tipo_proveedor,
  tipoProveedor: item.tipo_proveedor?.nombre_tipo_proveedor?.trim() || "",
  idMunicipio: item.id_municipio,
  ciudad: item.municipios?.nombre_municipio?.trim() || "",
  departamento: item.municipios?.departamentos?.nombre_departamento?.trim() || "",
});

export async function getProveedores(
  params: GetProveedoresParams = {}
): Promise<{
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: ProveedorItem[];
}> {
  const { data } = await api.get<ApiListResponse<ApiProveedor>>("/proveedor", {
    params: {
      includeRefs: "true",
      ...params,
    },
  });

  const rows = normalizeList<ApiProveedor>(data).map(mapProveedorApiToUi);
  const meta = extractPagination(data, params.limit ?? 10, rows.length);

  return {
    ...meta,
    data: rows,
  };
}

export async function getProveedorById(id: number): Promise<ProveedorItem> {
  const { data } = await api.get<ApiProveedor>(`/proveedor/${id}`, {
    params: { includeRefs: "true" },
  });

  return mapProveedorApiToUi(data);
}

export async function createProveedor(payload: SaveProveedorPayload) {
  const { data } = await api.post("/proveedor", payload);
  return data;
}

export async function updateProveedor(id: number, payload: SaveProveedorPayload) {
  const { data } = await api.patch(`/proveedor/${id}`, payload);
  return data;
}

export async function disableProveedor(id: number) {
  const { data } = await api.delete(`/proveedor/${id}`);
  return data;
}

export async function enableProveedor(id: number) {
  const { data } = await api.patch(`/proveedor/${id}/enable`);
  return data;
}

export async function getTiposDocumentoOptions(): Promise<CatalogOption[]> {
  const { data } = await api.get<ApiListResponse<ApiTipoDocumento>>("/tipo-documento");

  return uniqueByValue(
    normalizeList<ApiTipoDocumento>(data)
      .map((item) => ({
        value: String(item.id_tipo_doc),
        label: item.nombre_doc,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  );
}

export async function getTiposProveedorOptions(): Promise<CatalogOption[]> {
  const { data } = await api.get<ApiListResponse<ApiTipoProveedor>>("/tipo-proveedor");

  return uniqueByValue(
    normalizeList<ApiTipoProveedor>(data)
      .map((item) => ({
        value: String(item.id_tipo_proveedor),
        label: item.nombre_tipo_proveedor,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  );
}

export async function getMunicipiosOptions(): Promise<MunicipioOption[]> {
  const { data } = await api.get<ApiListResponse<ApiMunicipio>>("/municipio", {
    params: { includeRefs: "true" },
  });

  return uniqueByValue(
    normalizeList<ApiMunicipio>(data)
      .map((item) => {
        const nombre = item.nombre_municipio?.trim() || `Municipio ${item.id_municipio}`;
        const departamento = item.departamentos?.nombre_departamento?.trim() || "";

        return {
          value: String(item.id_municipio),
          nombre,
          departamento,
          label: departamento ? `${nombre} - ${departamento}` : nombre,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  );
}
