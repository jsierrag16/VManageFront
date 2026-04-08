import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { notificationService } from "../services/notification.service";
import type { NotificationItem } from "../types/notification.types";

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

  return "No se pudieron cargar las notificaciones";
}

export function useNotifications() {
  const { selectedBodegaId } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveBodegaId = useMemo(() => {
    if (selectedBodegaId === null || selectedBodegaId === undefined) {
      return undefined;
    }

    return selectedBodegaId;
  }, [selectedBodegaId]);

  const loadNotifications = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
          await notificationService.sync(effectiveBodegaId);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const result = await notificationService.getNotifications({
          idBodega: effectiveBodegaId,
          limit: 50,
        });

        setNotifications(Array.isArray(result.data) ? result.data : []);
        setUnreadCount(result.unreadCount ?? 0);
      } catch (error) {
        setErrorMessage(extractErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [effectiveBodegaId],
  );

  useEffect(() => {
    void loadNotifications(false);
  }, [loadNotifications]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadNotifications(false);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      const updated = await notificationService.markAsRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, leida: updated.leida } : item,
        ),
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));

      return updated;
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead(effectiveBodegaId);

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        leida: true,
      })),
    );

    setUnreadCount(0);
  }, [effectiveBodegaId]);

  const removeNotification = useCallback(async (id: string) => {
    await notificationService.remove(id);

    setNotifications((prev) => {
      const current = prev.find((item) => item.id === id);
      const next = prev.filter((item) => item.id !== id);

      if (current && !current.leida) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }

      return next;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    errorMessage,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}