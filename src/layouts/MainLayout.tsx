import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { Toaster } from "../shared/components/ui/sonner";

export type AppOutletContext = {
  currentUser: any;
  onLogout: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
  traslados?: any[];
  productos?: any[];
};

interface MainLayoutProps extends AppOutletContext { }

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
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            currentUser={currentUser}
            onLogout={onLogout}
            onOpenProfile={() => navigate("/app/perfil")}
            traslados={traslados}
            productos={productos}
            onNavigateToTraslados={() => navigate("/app/traslados")}
            onNavigateToExistencias={() => navigate("/app/existencias")}
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
              }}
            />
          </main>
        </div>
      </div>
    </>
  );
}
