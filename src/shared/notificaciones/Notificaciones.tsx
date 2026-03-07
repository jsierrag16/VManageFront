import { useState } from "react";
import { toast } from "sonner";
import { Traslado } from "@/data/traslados";
import { Producto } from "@/data/productos";
import NotificationBell from "./components/NotificationBell";
import NotificationPanel from "./components/NotificationPanel";
import { useNotifications } from "./hooks/useNotifications";
import { NotificationItem } from "./types/notification.types";

interface NotificacionesProps {
  traslados: Traslado[];
  productos: Producto[];
  onNavigateToTraslados?: (notification?: NotificationItem) => void;
  onNavigateToExistencias?: (notification?: NotificationItem) => void;
}

export default function Notificaciones({
  traslados,
  productos,
  onNavigateToTraslados,
  onNavigateToExistencias,
}: NotificacionesProps) {
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications(traslados, productos);

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);

    if (notification.tipo === "traslado" && onNavigateToTraslados) {
      setOpen(false);
      onNavigateToTraslados(notification);
      toast.info(`Navegando a ${notification.titulo}`);
      return;
    }

    if (
      (notification.tipo === "vencimiento" ||
        notification.tipo === "stockBajo") &&
      onNavigateToExistencias
    ) {
      setOpen(false);
      onNavigateToExistencias(notification);
      toast.info("Navegando a existencias");
      return;
    }

    toast.info("Notificación marcada como leída");
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    toast.success("Notificación marcada como leída");
  };

  const handleDelete = (id: string) => {
    removeNotification(id);
    toast.success("Notificación eliminada");
  };

  return (
    <>
      <NotificationBell
        unreadCount={unreadCount}
        onClick={() => setOpen(true)}
      />

      <NotificationPanel
        open={open}
        onOpenChange={setOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </>
  );
}