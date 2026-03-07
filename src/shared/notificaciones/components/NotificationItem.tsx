import type { MouseEvent } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Package,
  Trash2,
  Truck,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { NotificationItem as NotificationItemType } from "../types/notification.types";

interface NotificationItemProps {
  notification: NotificationItemType;
  onClick: (notification: NotificationItemType) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function getIcono(tipo: NotificationItemType["tipo"]) {
  switch (tipo) {
    case "traslado":
      return <Truck className="w-5 h-5" />;
    case "vencimiento":
      return <Clock className="w-5 h-5" />;
    case "stockBajo":
      return <Package className="w-5 h-5" />;
    default:
      return <AlertTriangle className="w-5 h-5" />;
  }
}

function getColorPrioridad(prioridad: NotificationItemType["prioridad"]) {
  switch (prioridad) {
    case "alta":
      return "bg-red-100 text-red-800 border-red-200";
    case "media":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "baja":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        notification.leida
          ? "bg-gray-50 border-gray-200 opacity-70"
          : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${getColorPrioridad(notification.prioridad)}`}
        >
          {getIcono(notification.tipo)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm mb-1 ${
                notification.leida ? "text-gray-600" : "text-gray-900"
              }`}
            >
              {notification.titulo}
            </h4>

            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${getColorPrioridad(
                notification.prioridad
              )}`}
            >
              {notification.prioridad.charAt(0).toUpperCase() +
                notification.prioridad.slice(1)}
            </Badge>
          </div>

          <p
            className={`text-xs ${
              notification.leida ? "text-gray-500" : "text-gray-600"
            } mb-2`}
          >
            {notification.descripcion}
          </p>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              {new Date(notification.fecha).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            <div className="flex items-center gap-2">
              {!notification.leida && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Leída
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        {!notification.leida && (
          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}