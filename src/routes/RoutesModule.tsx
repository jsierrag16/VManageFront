import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../shared/context/AuthContext";

// Guards
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

// Páginas
import Login from "../features/auth/pages/login";
import Dashboard from "../features/dashboard/pages/Dashboard";
import Bodegas from "../features/bodegas/pages/Bodegas";

// Layout
import MainLayout from "../layouts/MainLayout";

// Assets
import vManageLogo from "../assets/images/VManageLogo.png";
import vManageLogoSmall from "../assets/images/VLogo.png";
import gvmLogo from "../assets/images/GVMLogo.png";

export default function RoutesModule() {
  const { usuario, logout } = useAuth();

  // ✅ Por ahora seguimos usando estado para "activeSection" (luego lo cambiamos a useLocation)
  const [activeSection, setActiveSection] = useState("dashboard");

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
                onLogout={logout}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                vManageLogo={vManageLogo}
                vManageLogoSmall={vManageLogoSmall}
                gvmLogo={gvmLogo}
              />
            </ProtectedRoute>
          }
        >
          {/* ✅ Rutas hijas reales dentro de /app */}
          <Route index element={<Dashboard />} />

          {/* BODEGAS */}
          <Route path="bodegas" element={<Bodegas />} />
          <Route path="bodegas/crear" element={<Bodegas />} />
          <Route path="bodegas/:id/editar" element={<Bodegas />} />

          {/* fallback dentro de /app */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        {/* REDIRECCIONES */}
        <Route path="/" element={<Navigate to={usuario ? "/app" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={usuario ? "/app" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
