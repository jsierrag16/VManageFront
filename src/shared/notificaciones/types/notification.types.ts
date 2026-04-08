export type NotificationType = "traslado" | "vencimiento" | "stockBajo";

export type NotificationPriority = "alta" | "media" | "baja";

export interface NotificationAction {
  module: string;
  entityId?: number | string;
  action?: string;
  route?: string;
}

export interface NotificationItem {
  id: string;
  tipo: NotificationType;
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: NotificationPriority;
  leida: boolean;
  datos?: unknown;
  action?: NotificationAction;
  ruta?: string;
  id_bodega?: number | null;
  id_bodega_relacionada?: number | null;
}

export interface NotificationsListResult {
  data: NotificationItem[];
  unreadCount: number;
  scope?: {
    ids_bodegas: number[];
  };
}