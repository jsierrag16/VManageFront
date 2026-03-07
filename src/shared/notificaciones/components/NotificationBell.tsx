import { Bell } from "lucide-react";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export default function NotificationBell({
  unreadCount,
  onClick,
}: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-blue-700 rounded-lg transition-colors text-white"
      type="button"
      aria-label="Abrir notificaciones"
    >
      <Bell size={20} />

      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}