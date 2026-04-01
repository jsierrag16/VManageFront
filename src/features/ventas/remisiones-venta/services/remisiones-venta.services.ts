// import type {
//   CatalogosRemisionVentaResponse,
//   CreateRemisionVentaPayload,
//   RemisionVentaApi,
//   UpdateRemisionVentaPayload,
// } from "../types/remisiones-venta.types";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// function getToken() {
//   return (
//     localStorage.getItem("token") ||
//     localStorage.getItem("access_token") ||
//     localStorage.getItem("jwt") ||
//     ""
//   );
// }

// function buildUrl(
//   path: string,
//   params?: Record<string, string | number | undefined>
// ) {
//   const url = new URL(`${API_URL}${path}`);

//   if (params) {
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== undefined && value !== null && value !== "") {
//         url.searchParams.append(key, String(value));
//       }
//     });
//   }

//   return url.toString();
// }

// function extractMessage(errorData: any) {
//   if (Array.isArray(errorData?.message)) {
//     return errorData.message.join(", ");
//   }

//   return errorData?.message || errorData?.error || "Error en la solicitud";
// }

// function unwrapResponse<T>(payload: any): T {
//   return (payload?.data ?? payload) as T;
// }

// async function request<T>(
//   path: string,
//   init?: RequestInit,
//   params?: Record<string, string | number | undefined>
// ): Promise<T> {
//   const token = getToken();

//   const response = await fetch(buildUrl(path, params), {
//     ...init,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...(init?.headers || {}),
//     },
//   });

//   if (!response.ok) {
//     let message = "Error en la solicitud";

//     try {
//       const errorData = await response.json();
//       message = extractMessage(errorData);
//     } catch {
//       //
//     }

//     throw new Error(message);
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json();
// }

// export const remisionesVentaService = {
//   async getAll(id_bodega?: number) {
//     const response = await request<any>(
//       "/remisiones-venta",
//       { method: "GET" },
//       { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined }
//     );

//     return unwrapResponse<RemisionVentaApi[]>(response) ?? [];
//   },

//   async getOne(id: number) {
//     const response = await request<any>(`/remisiones-venta/${id}`, {
//       method: "GET",
//     });

//     return unwrapResponse<RemisionVentaApi>(response);
//   },

//   async getCatalogos(id_bodega?: number, id_remision_edicion?: number) {
//     const response = await request<any>(
//       "/remisiones-venta/catalogos",
//       { method: "GET" },
//       {
//         id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined,
//         id_remision_edicion:
//           id_remision_edicion && id_remision_edicion > 0
//             ? id_remision_edicion
//             : undefined,
//       }
//     );

//     const data = unwrapResponse<CatalogosRemisionVentaResponse>(response);

//     return {
//       estados: Array.isArray(data?.estados) ? data.estados : [],
//       ordenes: Array.isArray(data?.ordenes) ? data.ordenes : [],
//     };
//   },

//   async create(payload: CreateRemisionVentaPayload) {
//     const response = await request<any>("/remisiones-venta", {
//       method: "POST",
//       body: JSON.stringify(payload),
//     });

//     return unwrapResponse<RemisionVentaApi>(response);
//   },

//   async update(id: number, payload: UpdateRemisionVentaPayload) {
//     const response = await request<any>(`/remisiones-venta/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(payload),
//     });

//     return unwrapResponse<RemisionVentaApi>(response);
//   },

//   async updateEstado(id: number, id_estado_remision_venta: number) {
//     const response = await request<any>(`/remisiones-venta/${id}/estado`, {
//       method: "PATCH",
//       body: JSON.stringify({ id_estado_remision_venta }),
//     });

//     return unwrapResponse<RemisionVentaApi>(response);
//   },
// };


import type {
  CatalogosRemisionVentaResponse,
  CreateRemisionVentaPayload,
  RemisionVentaApi,
  UpdateRemisionVentaPayload,
} from "../types/remisiones-venta.types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>
) {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

function extractMessage(errorData: any) {
  if (Array.isArray(errorData?.message)) {
    return errorData.message.join(", ");
  }

  return errorData?.message || errorData?.error || "Error en la solicitud";
}

function unwrapResponse<T>(payload: any): T {
  return (payload?.data ?? payload) as T;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | undefined>
): Promise<T> {
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

export const remisionesVentaService = {
  async getAll(id_bodega?: number) {
    const response = await request<any>(
      "/remisiones-venta",
      { method: "GET" },
      { id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined }
    );

    return unwrapResponse<RemisionVentaApi[]>(response) ?? [];
  },

  async getOne(id: number) {
    const response = await request<any>(`/remisiones-venta/${id}`, {
      method: "GET",
    });

    return unwrapResponse<RemisionVentaApi>(response);
  },

  async getCatalogos(id_bodega?: number, id_remision_edicion?: number) {
    const response = await request<any>(
      "/remisiones-venta/catalogos",
      { method: "GET" },
      {
        id_bodega: id_bodega && id_bodega > 0 ? id_bodega : undefined,
        id_remision_edicion:
          id_remision_edicion && id_remision_edicion > 0
            ? id_remision_edicion
            : undefined,
      }
    );

    const data = unwrapResponse<CatalogosRemisionVentaResponse>(response);

    return {
      estados: Array.isArray(data?.estados) ? data.estados : [],
      ordenes: Array.isArray(data?.ordenes) ? data.ordenes : [],
    };
  },

  async create(payload: CreateRemisionVentaPayload) {
    const response = await request<any>("/remisiones-venta", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return unwrapResponse<RemisionVentaApi>(response);
  },

  async update(id: number, payload: UpdateRemisionVentaPayload) {
    const response = await request<any>(`/remisiones-venta/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return unwrapResponse<RemisionVentaApi>(response);
  },

  async updateEstado(
    id: number,
    payload: { id_estado_remision_venta: number; firma_digital?: string }
  ) {
    const response = await request<any>(`/remisiones-venta/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return unwrapResponse<RemisionVentaApi>(response);
  },
};