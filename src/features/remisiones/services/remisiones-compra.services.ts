import api from "../../../shared/services/api";
import {
  buildBodegaParamsVariants,
  ESTADO_REMISION_IDS,
  extractList,
  filterBySelectedBodega,
  mapCompraDetail,
  mapCompraOption,
  mapRemision,
  unwrapResponse,
} from "./remisiones-compra.mapper";

import type {
  CambiarEstadoRemisionCompraPayload,
  CompraDetail,
  CompraOption,
  CreateRemisionCompraPayload,
  RemisionCompraUI,
  UpdateRemisionCompraPayload,
} from "./remisiones-compras.types";

async function getRequestFirstSuccess(
  candidates: Array<{ url: string; params?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.get(candidate.url, {
        params: candidate.params,
      });
      return unwrapResponse(response);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

async function postRequestFirstSuccess(
  candidates: Array<{ url: string; data?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.post(candidate.url, candidate.data);
      return unwrapResponse(response);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

async function patchRequestFirstSuccess(
  candidates: Array<{ url: string; data?: Record<string, any> }>
) {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await api.patch(candidate.url, candidate.data);
      return unwrapResponse(response);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status !== 404) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

export const remisionesCompraService = {
  async getAll(selectedBodegaId?: number): Promise<RemisionCompraUI[]> {
    const paramsVariants = buildBodegaParamsVariants(selectedBodegaId);

    const raw = await getRequestFirstSuccess([
      ...paramsVariants.map((params) => ({
        url: "/remisiones-compra",
        params,
      })),
      ...paramsVariants.map((params) => ({
        url: "/remision-compra",
        params,
      })),
    ]);

    const remisiones = extractList(raw)
      .map(mapRemision)
      .filter((item) => item.id > 0);

    const filtradas = filterBySelectedBodega(remisiones, selectedBodegaId);

    const unique = Array.from(
      new Map(filtradas.map((item) => [item.id, item])).values()
    );

    return unique.sort((a, b) => b.id - a.id);
  },

  async getById(id: number): Promise<RemisionCompraUI> {
    const raw = await getRequestFirstSuccess([
      { url: `/remisiones-compra/${id}` },
      { url: `/remision-compra/${id}` },
    ]);

    return mapRemision(raw);
  },

  async getNextCode(): Promise<string> {
    const raw = await getRequestFirstSuccess([
      { url: "/remisiones-compra/siguiente-codigo" },
      { url: "/remision-compra/siguiente-codigo" },
    ]);

    return String(
      raw?.numeroRemision ??
        raw?.codigo_remision_compra ??
        raw?.codigo ??
        raw?.numero_remision ??
        ""
    );
  },

  async getCompraById(id: number): Promise<CompraDetail> {
    try {
      const raw = await getRequestFirstSuccess([
        { url: `/remisiones-compra/contexto-compra/${id}` },
        { url: `/remision-compra/contexto-compra/${id}` },
      ]);

      return mapCompraDetail(raw);
    } catch (error: any) {
      const status = error?.response?.status;

      if (status && status !== 404) {
        throw error;
      }

      const raw = await getRequestFirstSuccess([
        { url: `/compras/${id}` },
        { url: `/compra/${id}` },
      ]);

      return mapCompraDetail(raw);
    }
  },

  async create(payload: CreateRemisionCompraPayload): Promise<RemisionCompraUI> {
    const raw = await postRequestFirstSuccess([
      { url: "/remisiones-compra", data: payload },
      { url: "/remision-compra", data: payload },
    ]);

    return mapRemision(raw);
  },

  async update(
    id: number,
    payload: UpdateRemisionCompraPayload
  ): Promise<RemisionCompraUI> {
    const raw = await patchRequestFirstSuccess([
      { url: `/remisiones-compra/${id}`, data: payload },
      { url: `/remision-compra/${id}`, data: payload },
    ]);

    return mapRemision(raw);
  },

  async changeStatus(
    id: number,
    payload: CambiarEstadoRemisionCompraPayload
  ): Promise<RemisionCompraUI> {
    const raw = await patchRequestFirstSuccess([
      { url: `/remisiones-compra/${id}/estado`, data: payload },
      { url: `/remision-compra/${id}/estado`, data: payload },
    ]);

    return mapRemision(raw);
  },

  async getComprasOptions(selectedBodegaId?: number): Promise<CompraOption[]> {
    const paramsVariants = buildBodegaParamsVariants(selectedBodegaId);

    const raw = await getRequestFirstSuccess([
      ...paramsVariants.map((params) => ({
        url: "/compras",
        params: {
          ...(params ?? {}),
          solo_aprobadas: true,
        },
      })),
      ...paramsVariants.map((params) => ({
        url: "/compra",
        params: {
          ...(params ?? {}),
          solo_aprobadas: true,
        },
      })),
    ]);

    const compras = extractList(raw)
      .map(mapCompraOption)
      .filter((item) => item.id > 0);

    const filtradas = filterBySelectedBodega(compras, selectedBodegaId);

    const unique = Array.from(
      new Map(filtradas.map((item) => [item.id, item])).values()
    );

    return unique.sort((a, b) => b.id - a.id);
  },
};

export { ESTADO_REMISION_IDS };

export const getRemisionesCompra = remisionesCompraService.getAll.bind(
  remisionesCompraService
);

export const getRemisionCompraById = remisionesCompraService.getById.bind(
  remisionesCompraService
);

export const getSiguienteCodigoRemision =
  remisionesCompraService.getNextCode.bind(remisionesCompraService);

export const getCompraById = remisionesCompraService.getCompraById.bind(
  remisionesCompraService
);

export const createRemisionCompra = remisionesCompraService.create.bind(
  remisionesCompraService
);

export const updateRemisionCompra = remisionesCompraService.update.bind(
  remisionesCompraService
);

export const cambiarEstadoRemisionCompra =
  remisionesCompraService.changeStatus.bind(remisionesCompraService);

export const getComprasOptions =
  remisionesCompraService.getComprasOptions.bind(remisionesCompraService);

export type {
  CambiarEstadoRemisionCompraPayload,
  CompraDetail,
  CompraOption,
  CreateRemisionCompraPayload,
  RemisionCompraUI,
  UpdateRemisionCompraPayload,
} from "./remisiones-compras.types";
