import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../shared/context/AuthContext";

// Guards
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

// Páginas
import Login from "../features/auth/pages/login";

// Layout + rutas internas
import MainLayout from "../layouts/MainLayout"; // ajusta la ruta si tu MainLayout está en otra carpeta
import AppRoutes from "./AppRoutes"; // ajusta si lo creaste en otra ruta

// Assets
import vManageLogo from "../assets/images/VManageLogo.png";
import vManageLogoSmall from "../assets/images/VLogo.png";
import gvmLogo from "../assets/images/GVMLogo.png";

export default function RoutesModule() {
  const { usuario, setUsuario } = useAuth();

  // ✅ Por ahora seguimos usando estado para "activeSection" (luego lo cambiamos a useLocation)
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedBodega, setSelectedBodega] = useState("Todas las bodegas");

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("isAuthenticated");
    setUsuario(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* RUTA PROTEGIDA /app */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout
                currentUser={usuario}
                onLogout={handleLogout}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                selectedBodega={selectedBodega}
                setSelectedBodega={setSelectedBodega}
                vManageLogo={vManageLogo}
                vManageLogoSmall={vManageLogoSmall}
                gvmLogo={gvmLogo}
              />
            </ProtectedRoute>
          }
        >
          {/* ✅ Rutas hijas dentro de /app */}
          <Route path="*" element={<AppRoutes />} />
        </Route>

        {/* REDIRECCIONES */}
        <Route path="/" element={<Navigate to={usuario ? "/app" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={usuario ? "/app" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
