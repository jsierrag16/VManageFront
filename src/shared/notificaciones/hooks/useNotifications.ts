import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { bodegasData } from "@/data/bodegas";
import { Traslado } from "@/data/traslados";
import { Producto } from "@/data/productos";
import { generateNotifications } from "../services/notification.service";
import { NotificationItem } from "../types/notification.types";

export function useNotifications(
  traslados: Traslado[],
  productos: Producto[]
) {
  const { selectedBodegaId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const selectedBodegaNombre =
    selectedBodegaId === 0
      ? "Todas las bodegas"
      : bodegasData.find((b) => b.id === selectedBodegaId)?.nombre ??
        "Todas las bodegas";

  const generated = useMemo(() => {
    return generateNotifications({
      traslados,
      productos,
      selectedBodegaNombre,
    });
  }, [traslados, productos, selectedBodegaNombre]);

  useEffect(() => {
    setNotifications(generated);
  }, [generated]);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}