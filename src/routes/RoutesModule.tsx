import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";

// Guards
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

// Páginas
import Login from "@/features/auth/pages/login";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Bodegas from "@/features/bodegas/pages/Bodegas";
import Productos from "@/features/productos/pages/Productos";
import Traslados from "@/features/traslados/pages/Traslados";

// Layout
import MainLayout from "@/layouts/MainLayout";

// Assets
import vManageLogo from "@/assets/images/VManageLogo.png";
import vManageLogoSmall from "@/assets/images/VLogo.png";
import gvmLogo from "@/assets/images/GVMLogo.png";
import Perfil from "@/features/perfil/pages/Perfil";
import Usuarios from "@/features/usuarios/pages/Usuarios";
import Roles from "@/features/roles/pages/Roles";


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

          {/* PERFIL */}
          <Route path="perfil" element={<Perfil />} />
          
          {/* USUARIOS */}
          <Route path="usuarios" element={< Usuarios/>} />
          <Route path="usuarios/crear" element={< Usuarios />} />
          <Route path="usuarios/:id/editar" element={< Usuarios/>} />
          <Route path="usuarios/:id/ver" element={< Usuarios/>} />
          <Route path="usuarios/:id/eliminar" element={< Usuarios/>} />
         
          {/* ROLES */}
          <Route path="roles" element={< Roles/>} />
          <Route path="roles/crear" element={< Roles />} />
          <Route path="roles/:id/editar" element={< Roles/>} />
          <Route path="roles/:id/ver" element={< Roles/>} />
          <Route path="roles/:id/eliminar" element={< Roles/>} />
          
          {/* BODEGAS */}
          <Route path="bodegas" element={<Bodegas />} />
          <Route path="bodegas/crear" element={<Bodegas />} />
          <Route path="bodegas/:id/editar" element={<Bodegas />} />
          <Route path="bodegas/:id/eliminar" element={<Bodegas />} />

          {/* PRODUCTOS */}
          <Route path="productos" element={<Productos />} />
          <Route path="productos/crear" element={<Productos />} />
          <Route path="productos/:id/editar" element={<Productos />} />
          <Route path="productos/:id/ver" element={<Productos />} />

          {/* TRASLADOS */}
          <Route path="traslados" element={<Traslados />} />
          <Route path="traslados/crear" element={<Traslados />} />
          <Route path="traslados/:id/ver" element={<Traslados />} />
          <Route path="traslados/:id/editar" element={<Traslados />} />
          <Route path="traslados/:id/cancelar" element={<Traslados />} />


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
