import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from "./components/NotificationBell";
import NotificationPanel from "./components/NotificationPanel";
import { useNotifications } from "./hooks/useNotifications";
import { resolveNotificationRoute } from "./notification-route";
import type { NotificationItem } from "./types/notification.types";

interface NotificacionesProps {
  traslados?: unknown[];
  productos?: unknown[];
  onNavigateToTraslados?: (notification?: NotificationItem) => void;
  onNavigateToExistencias?: (notification?: NotificationItem) => void;
}

function extractErrorMessage(error: any) {
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (Array.isArray(error?.response?.data?.message)) {
    return error.response.data.message.join(", ");
  }

  if (typeof error?.response?.data?.error === "string") {
    return error.response.data.error;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Ocurrió un error en la operación";
}

export default function Notificaciones({
  onNavigateToTraslados,
  onNavigateToExistencias,
}: NotificacionesProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    errorMessage,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.leida) {
        await markAsRead(notification.id);
      }

      const route = resolveNotificationRoute(notification);

      if (route) {
        setOpen(false);
        navigate(route);
        toast.info(`Navegando a ${notification.titulo}`);
        return;
      }

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
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success("Notificación marcada como leída");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeNotification(id);
      toast.success("Notificación eliminada");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleRefresh = async () => {
    try {
      await loadNotifications(true);
      toast.success("Notificaciones actualizadas");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
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
        loading={loading}
        refreshing={refreshing}
        errorMessage={errorMessage}
        onRefresh={handleRefresh}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    </>
  );
}