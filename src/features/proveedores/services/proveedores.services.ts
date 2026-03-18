import type { AxiosRequestConfig } from "axios";
import api from "../../../shared/services/api";
import {
  mapCatalogOption,
  mapMunicipioOption,
  mapProveedor,
  type CatalogOption,
  type MunicipioOption,
  type ProveedorItem,
} from "./proveedores.mapper";

export type { CatalogOption, MunicipioOption, ProveedorItem };

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

export type PaginatedProveedoresResponse = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: ProveedorItem[];
};

type RequestCandidate = {
  url: string;
  config?: AxiosRequestConfig;
};

const DEFAULT_LIMIT = 10;

const cleanParams = (params?: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
};

const extractArray = <T = any>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
};

const normalizePaginatedResponse = (raw: any): PaginatedProveedoresResponse => {
  const rows = extractArray(raw).map(mapProveedor);

  if (Array.isArray(raw)) {
    return {
      page: 1,
      limit: rows.length || DEFAULT_LIMIT,
      total: rows.length,
      pages: 1,
      data: rows,
    };
  }

  const total = Number(raw?.total ?? rows.length);
  const limit = Number((raw?.limit ?? rows.length) || DEFAULT_LIMIT);
  const page = Number(raw?.page ?? 1);
  const pages =
    Number(raw?.pages ?? 0) || Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  return {
    page,
    limit,
    total,
    pages,
    data: rows,
  };
};

const getRequestFirstSuccess = async <T = any>(
  candidates: RequestCandidate[]
): Promise<T> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.get<T>(candidate.url, candidate.config);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const sortOptions = <T extends { label: string }>(items: T[]) =>
  [...items].sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

export const getProveedores = async (
  params: GetProveedoresParams = {}
): Promise<PaginatedProveedoresResponse> => {
  const response = await api.get("/proveedor", {
    params: cleanParams({
      ...params,
      includeRefs: "true",
    }),
  });

  return normalizePaginatedResponse(response.data);
};

export const getProveedorById = async (id: number): Promise<ProveedorItem> => {
  const response = await api.get(`/proveedor/${id}`, {
    params: { includeRefs: "true" },
  });

  return mapProveedor(response.data);
};

export const createProveedor = async (
  payload: SaveProveedorPayload
): Promise<ProveedorItem> => {
  const response = await api.post("/proveedor", payload);
  return mapProveedor(response.data);
};

export const updateProveedor = async (
  id: number,
  payload: SaveProveedorPayload
): Promise<ProveedorItem> => {
  const response = await api.patch(`/proveedor/${id}`, payload);
  return mapProveedor(response.data);
};

export const disableProveedor = async (id: number): Promise<ProveedorItem> => {
  const response = await api.delete(`/proveedor/${id}`);
  return mapProveedor(response.data);
};

export const enableProveedor = async (id: number): Promise<ProveedorItem> => {
  const response = await api.patch(`/proveedor/${id}/enable`);
  return mapProveedor(response.data);
};

export const getTiposDocumentoOptions = async (): Promise<CatalogOption[]> => {
  const raw = await getRequestFirstSuccess<any>([
    { url: "/tipo-documento" },
    { url: "/tipo_documento" },
    { url: "/tipos-documento" },
    { url: "/tipos-documentos" },
    { url: "/tipo-documentos" },
  ]);

  const items = extractArray(raw).map((item) =>
    mapCatalogOption(item, ["id_tipo_doc", "id"], ["nombre_doc", "nombre", "label"])
  );

  return sortOptions(items);
};

export const getTiposProveedorOptions = async (): Promise<CatalogOption[]> => {
  const response = await api.get("/tipo-proveedor");

  const raw = response.data;

  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  const mapped = rows
    .map((item: any) => ({
      value: String(item?.id_tipo_proveedor ?? ""),
      label: String(item?.nombre_tipo_proveedor ?? "").trim(),
    }))
    .filter((item: CatalogOption) => item.value && item.label);

  return mapped;
};

export const getMunicipiosOptions = async (): Promise<MunicipioOption[]> => {
  const raw = await getRequestFirstSuccess<any>([
    {
      url: "/municipios",
      config: { params: cleanParams({ includeRefs: "true", limit: 5000 }) },
    },
    {
      url: "/municipios",
      config: { params: cleanParams({ includeDepartamento: "true", limit: 5000 }) },
    },
    {
      url: "/municipios",
      config: { params: cleanParams({ limit: 5000 }) },
    },
    {
      url: "/municipio",
      config: { params: cleanParams({ includeRefs: "true", limit: 5000 }) },
    },
    {
      url: "/municipio",
      config: { params: cleanParams({ limit: 5000 }) },
    },
  ]);

  const items = extractArray(raw).map(mapMunicipioOption);

  return sortOptions(items);
};
