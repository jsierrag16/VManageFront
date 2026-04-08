import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import NotificationItem from "./NotificationItem";
import { NotificationItem as NotificationItemType } from "../types/notification.types";

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationItemType[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItemType) => void;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationPanel({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onMarkAsRead,
  onDelete,
}: NotificationPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </DialogTitle>
              <DialogDescription className="sr-only">
                Lista de notificaciones del sistema
              </DialogDescription>
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-125 pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p>No hay notificaciones</p>
              <p className="text-sm mt-1">Todo está bajo control</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={onNotificationClick}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}