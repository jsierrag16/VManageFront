import {
  Menu,
  Building2,
  ChevronDown,
  Edit,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../shared/components/ui/dropdown-menu";
import Notificaciones from "../../shared/notificaciones/Notificaciones";
import { useAuth } from "../../shared/context/AuthContext";
import { Traslado } from "../../data/traslados";
import { Producto } from "../../data/productos";
import { NotificationItem } from "../../shared/notificaciones/types/notification.types";

interface NavbarProps {
  onSidebarToggle: () => void;
  onMobileMenuToggle: () => void;
  currentUser: {
    nombre?: string;
    apellido?: string;
    email?: string;
    rol?: string;
    avatarUrl?: string;
  } | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  traslados: Traslado[];
  productos: Producto[];
  onNavigateToTraslados: (notification?: NotificationItem) => void;
  onNavigateToExistencias: (notification?: NotificationItem) => void;
  isOpen?: boolean;
}

export function Navbar({
  onSidebarToggle,
  onMobileMenuToggle,
  currentUser,
  onLogout,
  onOpenProfile,
  traslados,
  productos,
  onNavigateToTraslados,
  onNavigateToExistencias,
  isOpen = true,
}: NavbarProps) {
  const {
    bodegasDisponibles,
    selectedBodegaId,
    setSelectedBodegaId,
    isBodegaFijada,
  } = useAuth();

  const tieneVariasBodegas = bodegasDisponibles.length >= 2;

  const opciones = tieneVariasBodegas
    ? [{ id: 0, nombre: "Todas las bodegas" }, ...bodegasDisponibles]
    : bodegasDisponibles;

  const selectedNombre =
    selectedBodegaId === 0 && tieneVariasBodegas
      ? "Todas las bodegas"
      : opciones.find((b) => b.id === selectedBodegaId)?.nombre ||
        bodegasDisponibles[0]?.nombre ||
        "Sin bodega";

  return (
    <header className="sticky top-0 z-20 bg-[#2563EB] border-b border-[#1D4ED8] shadow-md">
      <div className="flex items-center justify-between pl-1 pr-2 lg:pl-2 lg:pr-8 py-1.5">
        <div className="flex items-center">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-white hover:bg-[#1D4ED8] rounded-lg transition-colors"
            type="button"
          >
            <Menu size={22} />
          </button>

          <motion.button
            onClick={onSidebarToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:flex p-2 text-white hover:bg-[#1D4ED8] rounded-lg transition-colors focus:outline-none"
            type="button"
            title={isOpen ? "Comprimir panel lateral" : "Expandir panel lateral"}
          >
            {isOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
          </motion.button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {opciones.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                disabled={isBodegaFijada || !tieneVariasBodegas}
              >
                <button
                  type="button"
                  className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg text-sm transition-colors text-white ${
                    isBodegaFijada || !tieneVariasBodegas
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-[#1D4ED8]"
                  }`}
                  title={
                    isBodegaFijada || !tieneVariasBodegas
                      ? "No puedes cambiar de bodega"
                      : "Seleccionar bodega"
                  }
                >
                  <Building2 size={18} className="text-white" />
                  <span className="hidden lg:block font-medium">
                    {selectedNombre}
                  </span>
                  <ChevronDown size={16} className="hidden lg:block text-white" />
                </button>
              </DropdownMenuTrigger>

              {tieneVariasBodegas && (
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Seleccionar Bodega</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {opciones.map((bodega) => (
                    <DropdownMenuItem
                      key={bodega.id}
                      onClick={() => setSelectedBodegaId(bodega.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <span>{bodega.nombre}</span>
                        {selectedBodegaId === bodega.id && (
                          <span className="text-[#2563EB]">✓</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          )}

          <div className="text-white">
            <Notificaciones
              traslados={traslados}
              productos={productos}
              onNavigateToTraslados={onNavigateToTraslados}
              onNavigateToExistencias={onNavigateToExistencias}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 text-white hover:bg-[#1D4ED8] px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none"
                type="button"
              >
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src={currentUser?.avatarUrl || ""} />
                  <AvatarFallback className="bg-white text-[#2563EB] font-medium border border-[#1D4ED8]">
                    {currentUser?.nombre?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden md:block text-left leading-none">
                  <p className="text-sm font-medium">
                    {currentUser?.nombre} {currentUser?.apellido}
                  </p>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {currentUser?.rol}
                  </p>
                </div>

                <ChevronDown size={16} className="text-white hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    {currentUser?.nombre} {currentUser?.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onOpenProfile}
                className="cursor-pointer"
              >
                <Edit size={16} className="mr-2 text-slate-400" />
                Editar perfil
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut size={16} className="mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}