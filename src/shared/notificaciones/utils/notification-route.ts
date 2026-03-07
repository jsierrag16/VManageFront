import { NotificationItem } from "../types/notification.types";

export function resolveNotificationRoute(notification: NotificationItem) {
  switch (notification.tipo) {
    case "traslado":
      return {
        module: "traslados",
        targetId: notification.datos?.id,
      };

    case "vencimiento":
    case "stockBajo":
      return {
        module: "existencias",
        targetId: notification.datos?.producto?.id,
      };

    default:
      return null;
  }
}