import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Toaster } from "../shared/components/ui/sonner";

interface MainLayoutProps {
  currentUser: any;
  onLogout: () => void;

  // Por ahora los dejamos (luego los hacemos automáticos por URL)
  activeSection: string;
  setActiveSection: (section: string) => void;

  selectedBodega: string;
  setSelectedBodega: (bodega: string) => void;

  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;

  traslados?: any[];
  productos?: any[];
}

export default function MainLayout({
  currentUser,
  onLogout,
  activeSection,
  setActiveSection,
  selectedBodega,
  setSelectedBodega,
  vManageLogo,
  vManageLogoSmall,
  gvmLogo,
  traslados = [],
  productos = []
}: MainLayoutProps) {

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          isMobileOpen={isMobileMenuOpen}
          currentUser={currentUser}
          activeSection={activeSection}
          onNavigate={(path) => navigate(path)}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          vManageLogo={vManageLogo}
          vManageLogoSmall={vManageLogoSmall}
          gvmLogo={gvmLogo}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            currentUser={currentUser}
            selectedBodega={selectedBodega}
            onBodegaChange={setSelectedBodega}
            onLogout={onLogout}
            onOpenProfile={() => navigate("/app/perfil")}
            traslados={traslados}
            productos={productos}
            onNavigateToTraslados={() => navigate("/app/traslados")}
            onNavigateToExistencias={() => navigate("/app/existencias")}
          />

          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
