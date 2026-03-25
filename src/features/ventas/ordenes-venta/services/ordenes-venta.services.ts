import type {
    CatalogosOrdenVentaResponse,
    CreateOrdenVentaPayload,
    OrdenVentaApi,
    UpdateOrdenVentaPayload,
  } from "../types/ordenes-venta.types";
  
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  
  function getToken() {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("jwt") ||
      ""
    );
  }
  
  function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
    const url = new URL(`${API_URL}${path}`);
  
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== 0) {
          url.searchParams.append(key, String(value));
        }
      });
    }
  
    return url.toString();
  }
  
  async function request<T>(path: string, init?: RequestInit, params?: Record<string, string | number | undefined>): Promise<T> {
    const token = getToken();
  
    const response = await fetch(buildUrl(path, params), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  
    if (!response.ok) {
      let message = "Error en la solicitud";
      try {
        const errorData = await response.json();
        message = errorData?.message || errorData?.error || message;
      } catch {
        //
      }
      throw new Error(message);
    }
  
    if (response.status === 204) {
      return undefined as T;
    }
  
    return response.json();
  }
  
  export const ordenesVentaService = {
    getAll(id_bodega?: number) {
      return request<OrdenVentaApi[]>(
        "/ordenes-venta",
        { method: "GET" },
        { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined }
      );
    },
  
    getOne(id: number) {
      return request<OrdenVentaApi>(`/ordenes-venta/${id}`, { method: "GET" });
    },
  
    getCatalogos(id_bodega?: number) {
      return request<CatalogosOrdenVentaResponse>(
        "/ordenes-venta/catalogos",
        { method: "GET" },
        { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined }
      );
    },
  
    create(payload: CreateOrdenVentaPayload) {
      return request<OrdenVentaApi>("/ordenes-venta", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  
    update(id: number, payload: UpdateOrdenVentaPayload) {
      return request<OrdenVentaApi>(`/ordenes-venta/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
  
    updateEstado(id: number, id_estado_orden_venta: number) {
      return request<OrdenVentaApi>(`/ordenes-venta/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ id_estado_orden_venta }),
      });
    },
  };