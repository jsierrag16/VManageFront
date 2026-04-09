import type { NotificationItem } from "./types/notification.types";

export function resolveNotificationRoute(notification: NotificationItem) {
  if (notification.action?.route) {
    return notification.action.route;
  }

  if (notification.ruta) {
    return notification.ruta;
  }

  switch (notification.tipo) {
    case "traslado":
      return "/app/traslados";
    case "vencimiento":
    case "stockBajo":
      return "/app/productos";
    default:
      return null;
  }
}