import { Menu, Building2, ChevronDown, Edit, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "../../shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../shared/components/ui/dropdown-menu";
import Notificaciones from "../../features/dashboard/components/Notificaciones";
import { useAuth } from "../../shared/context/AuthContext";

interface NavbarProps {
  onSidebarToggle: () => void;
  onMobileMenuToggle: () => void;

  // ❌ ya no lo necesitamos (causaba el warning si no lo usas)
  // isSidebarOpen: boolean;

  currentUser: any;

  onLogout: () => void;
  onOpenProfile: () => void;

  traslados: any[];
  productos: any[];
  onNavigateToTraslados: () => void;
  onNavigateToExistencias: () => void;
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
}: NavbarProps) {
  const { bodegasDisponibles, selectedBodegaId, setSelectedBodegaId, isBodegaFijada } = useAuth();

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
    <header className="sticky top-0 z-20 bg-blue-600 border-b border-blue-700 shadow-md">
      <div className="flex items-center justify-between pl-1 pr-2 lg:pl-2 lg:pr-8 py-2.5">
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors text-white"
          >
            <Menu size={22} />
          </button>

          {/* Desktop Toggle */}
          <motion.button
            onClick={onSidebarToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:flex p-2 hover:bg-blue-700 rounded-lg transition-colors text-white"
          >
            <Menu size={22} />
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de Bodega */}
          {opciones.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isBodegaFijada || !tieneVariasBodegas}>
                <button
                  className={`flex items-center gap-2 p-2 px-3 rounded-lg transition-colors text-white ${
                    isBodegaFijada || !tieneVariasBodegas
                      ? "opacity-80 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  title={
                    isBodegaFijada || !tieneVariasBodegas
                      ? "No puedes cambiar de bodega"
                      : "Seleccionar bodega"
                  }
                >
                  <Building2 size={20} />
                  <span className="hidden lg:block text-sm">{selectedNombre}</span>
                  <ChevronDown size={16} className="hidden lg:block" />
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
                      <div className="flex justify-between w-full">
                        <span>{bodega.nombre}</span>
                        {selectedBodegaId === bodega.id && <span className="text-blue-600">✓</span>}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          )}

          {/* ✅ Notificaciones (ya NO recibe selectedBodega) */}
          <Notificaciones
            traslados={traslados}
            productos={productos}
            onNavigateToTraslados={onNavigateToTraslados}
            onNavigateToExistencias={onNavigateToExistencias}
          />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.avatarUrl || ""} />
                  <AvatarFallback className="bg-white text-blue-600">
                    {currentUser?.nombre?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-white text-left">
                  <p className="text-sm">
                    {currentUser?.nombre} {currentUser?.apellido}
                  </p>
                  <p className="text-xs text-blue-100">{currentUser?.rol}</p>
                </div>
                <ChevronDown size={16} className="text-white hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {currentUser?.nombre} {currentUser?.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenProfile} className="cursor-pointer">
                <Edit size={16} className="mr-2" /> Editar perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                <LogOut size={16} className="mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
