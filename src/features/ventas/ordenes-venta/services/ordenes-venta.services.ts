import type {
  CatalogosOrdenVentaResponse,
  CreateOrdenVentaPayload,
  OrdenVentaApi,
  UpdateOrdenVentaPayload,
} from '../types/ordenes-venta.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt') ||
    ''
  );
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function extractMessage(errorData: any) {
  if (Array.isArray(errorData?.message)) {
    return errorData.message.join(', ');
  }

  return errorData?.message || errorData?.error || 'Error en la solicitud';
}

function unwrapResponse<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

function normalizeOrden(orden: any): OrdenVentaApi {
  return {
    ...orden,
    detalle_orden_venta: Array.isArray(orden?.detalle_orden_venta)
      ? orden.detalle_orden_venta.map((item: any) => ({
          ...item,
          id_detalle_orden_venta:
            item?.id_detalle_orden_venta ?? item?.id_orden_detalle_venta,
        }))
      : [],
  };
}

function normalizeOrdenes(payload: any): OrdenVentaApi[] {
  const data = unwrapResponse<any>(payload);
  return Array.isArray(data) ? data.map(normalizeOrden) : [];
}

function normalizeCatalogos(payload: any): CatalogosOrdenVentaResponse {
  const data = unwrapResponse<any>(payload) || {};

  return {
    clientes: Array.isArray(data?.clientes) ? data.clientes : [],
    productos: Array.isArray(data?.productos) ? data.productos : [],
    terminos_pago: Array.isArray(data?.terminos_pago) ? data.terminos_pago : [],
    estados: Array.isArray(data?.estados) ? data.estados : [],
    cotizaciones: Array.isArray(data?.cotizaciones) ? data.cotizaciones : [],
  };
}

async function request<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = getToken();

  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = 'Error en la solicitud';

    try {
      const errorData = await response.json();
      message = extractMessage(errorData);
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
  async getAll(id_bodega?: number) {
    const response = await request<any>(
      '/ordenes-venta',
      { method: 'GET' },
      { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined },
    );

    return normalizeOrdenes(response);
  },

  async getOne(id: number) {
    const response = await request<any>(`/ordenes-venta/${id}`, {
      method: 'GET',
    });

    return normalizeOrden(unwrapResponse(response));
  },

  async getCatalogos(id_bodega?: number) {
    const response = await request<any>(
      '/ordenes-venta/catalogos',
      { method: 'GET' },
      { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined },
    );

    return normalizeCatalogos(response);
  },

  async create(payload: CreateOrdenVentaPayload) {
    const response = await request<any>('/ordenes-venta', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return normalizeOrden(unwrapResponse(response));
  },

  async update(id: number, payload: UpdateOrdenVentaPayload) {
    const response = await request<any>(`/ordenes-venta/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return normalizeOrden(unwrapResponse(response));
  },

  async updateEstado(id: number, id_estado_orden_venta: number) {
    const response = await request<any>(`/ordenes-venta/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado_orden_venta }),
    });

    return normalizeOrden(unwrapResponse(response));
  },
};