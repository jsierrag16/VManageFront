export type NotificationType = "traslado" | "vencimiento" | "stockBajo";

export type NotificationPriority = "alta" | "media" | "baja";

export interface NotificationAction {
  module: "traslados" | "existencias";
  entityId?: number | string;
  action?: "ver" | "editar" | "detalle";
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
}