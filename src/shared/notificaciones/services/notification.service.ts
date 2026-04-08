import api from "@/shared/services/api";
import type {
  NotificationItem,
  NotificationsListResult,
} from "../types/notification.types";

type GetNotificationsParams = {
  idBodega?: number | null;
  soloNoLeidas?: boolean;
  limit?: number;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const unwrapEntityResponse = <T = any>(response: any): T => {
  return (response?.data?.data ?? response?.data ?? response) as T;
};

const normalizeNotification = (raw: any): NotificationItem => {
  return {
    id: String(raw?.id ?? ""),
    tipo: raw?.tipo ?? "stockBajo",
    titulo: String(raw?.titulo ?? ""),
    descripcion: String(raw?.descripcion ?? ""),
    fecha: String(raw?.fecha ?? new Date().toISOString()),
    prioridad: raw?.prioridad ?? "media",
    leida: Boolean(raw?.leida),
    datos: raw?.datos ?? null,
    action: raw?.action
      ? {
          module: String(raw.action.module ?? ""),
          entityId:
            raw.action.entityId === null || raw.action.entityId === undefined
              ? undefined
              : raw.action.entityId,
          action: raw.action.action
            ? String(raw.action.action)
            : undefined,
          route: raw.action.route ? String(raw.action.route) : undefined,
        }
      : undefined,
    ruta: raw?.ruta ? String(raw.ruta) : undefined,
    id_bodega:
      raw?.id_bodega === null || raw?.id_bodega === undefined
        ? null
        : toNumber(raw.id_bodega),
    id_bodega_relacionada:
      raw?.id_bodega_relacionada === null ||
      raw?.id_bodega_relacionada === undefined
        ? null
        : toNumber(raw.id_bodega_relacionada),
  };
};

const normalizeListResult = (raw: any): NotificationsListResult => {
  const rows = Array.isArray(raw?.data)
    ? raw.data.map(normalizeNotification)
    : [];

  return {
    data: rows,
    unreadCount: toNumber(raw?.unreadCount),
    scope: Array.isArray(raw?.scope?.ids_bodegas)
      ? {
          ids_bodegas: raw.scope.ids_bodegas.map((item: unknown) =>
            toNumber(item),
          ),
        }
      : undefined,
  };
};

export const notificationService = {
  async getNotifications(
    params: GetNotificationsParams = {},
  ): Promise<NotificationsListResult> {
    const response = await api.get("/notificaciones", {
      params: {
        id_bodega:
          params.idBodega === null || params.idBodega === undefined
            ? undefined
            : params.idBodega,
        solo_no_leidas:
          params.soloNoLeidas === undefined ? undefined : params.soloNoLeidas,
        limit: params.limit ?? 50,
      },
    });

    return normalizeListResult(response.data);
  },

  async getUnreadCount(idBodega?: number | null): Promise<number> {
    const response = await api.get("/notificaciones/contador", {
      params: {
        id_bodega:
          idBodega === null || idBodega === undefined ? undefined : idBodega,
      },
    });

    return toNumber(response?.data?.unreadCount);
  },

  async sync(idBodega?: number | null) {
    const response = await api.post(
      "/notificaciones/sincronizar",
      {},
      {
        params: {
          id_bodega:
            idBodega === null || idBodega === undefined ? undefined : idBodega,
        },
      },
    );

    return response.data;
  },

  async markAsRead(id: string | number): Promise<NotificationItem> {
    const response = await api.patch(`/notificaciones/${id}/leida`);
    return normalizeNotification(unwrapEntityResponse(response));
  },

  async markAllAsRead(idBodega?: number | null) {
    const response = await api.patch(
      "/notificaciones/marcar-todas-leidas",
      {},
      {
        params: {
          id_bodega:
            idBodega === null || idBodega === undefined
              ? undefined
              : idBodega,
        },
      },
    );

    return response.data as { updated: number };
  },

  async remove(id: string | number) {
    const response = await api.delete(`/notificaciones/${id}`);
    return response.data as { message?: string };
  },
};