import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Toaster } from "../shared/components/ui/sonner";
import { useAuth } from "../shared/context/AuthContext";
import { Traslado } from "../data/traslados";
import { Producto } from "../data/productos";
import { NotificationItem } from "../shared/notificaciones/types/notification.types";

export type AppOutletContext = {
  currentUser: any;
  onLogout: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
  traslados?: Traslado[];
  productos?: Producto[];
  selectedBodegaId: number | null;
  selectedBodegaNombre: string;
  bodegasDisponibles: { id: number; nombre: string }[];
  isBodegaFijada: boolean;
};

type MainLayoutProps = {
  currentUser: any;
  onLogout: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
  traslados?: Traslado[];
  productos?: Producto[];
};

export default function MainLayout({
  currentUser,
  onLogout,
  activeSection,
  setActiveSection,
  vManageLogo,
  vManageLogoSmall,
  gvmLogo,
  traslados = [],
  productos = [],
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  const { bodegasDisponibles, selectedBodegaId, isBodegaFijada } = useAuth();

  const tieneVariasBodegas = bodegasDisponibles.length >= 2;

  const selectedBodegaNombre =
    selectedBodegaId === 0 && tieneVariasBodegas
      ? "Todas las bodegas"
      : bodegasDisponibles.find((b) => b.id === selectedBodegaId)?.nombre ||
      bodegasDisponibles[0]?.nombre ||
      "Sin bodega";

  const handleNavigateToTraslados = (notification?: NotificationItem) => {
    const trasladoId = notification?.action?.entityId;

    if (!trasladoId) {
      navigate("/app/traslados");
      return;
    }

    navigate(`/app/traslados/${trasladoId}/ver`);
  };

  const handleNavigateToExistencias = (notification?: NotificationItem) => {
    const productoId = notification?.action?.entityId;

    if (!productoId) {
      navigate("/app/productos");
      return;
    }

    navigate(`/app/productos/${productoId}/ver`);
  };

  return (
    <>
      <Toaster richColors position="top-center" />

      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          isMobileOpen={isMobileMenuOpen}
          activeSection={activeSection}
          onNavigate={(path) => navigate(path)}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          vManageLogo={vManageLogo}
          vManageLogoSmall={vManageLogoSmall}
          gvmLogo={gvmLogo}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            currentUser={currentUser}
            onLogout={onLogout}
            onOpenProfile={() => navigate("/app/perfil")}
            traslados={traslados}
            productos={productos}
            onNavigateToTraslados={handleNavigateToTraslados}
            onNavigateToExistencias={handleNavigateToExistencias}
          />

          <main className="flex-1 p-4 lg:p-8">
            <Outlet
              context={{
                currentUser,
                onLogout,
                activeSection,
                setActiveSection,
                vManageLogo,
                vManageLogoSmall,
                gvmLogo,
                traslados,
                productos,
                selectedBodegaId: selectedBodegaId === 0 ? null : selectedBodegaId,
                selectedBodegaNombre,
                bodegasDisponibles,
                isBodegaFijada,
              }}
            />
          </main>
        </div>
      </div>
    </>
  );
}