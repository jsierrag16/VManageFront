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
import Proveedores from "@/features/proveedores/pages/Proveedores";
import Compras from "@/features/compras/pages/Compras";
import RemisionesCompra from "@/features/remisiones/pages/RemisionesCompra";
import Clientes from "@/features/clientes/pages/Clientes";
import Cotizaciones from "@/features/cotizaciones/pages/Cotizaciones";
import Ordenes from "@/features/ordenes/pages/Ordenes";
import Remisiones from "@/features/remisiones/pages/Remisiones";
import PagosAbonos from "@/features/pagosAbonos/pages/PagosAbonos";

// ✅ data mock
import { productosData } from "@/data/productos";
import { trasladosData } from "@/data/traslados";

export default function RoutesModule() {
  const { usuario, logout } = useAuth();

  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

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
                traslados={trasladosData}
                productos={productosData}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="productos" element={<Productos />} />
          <Route path="productos/crear" element={<Productos />} />
          <Route path="productos/:id/ver" element={<Productos />} />
          <Route path="productos/:id/editar" element={<Productos />} />

          <Route path="traslados" element={<Traslados />} />
          <Route path="traslados/crear" element={<Traslados />} />
          <Route path="traslados/:id/ver" element={<Traslados />} />
          <Route path="traslados/:id/editar" element={<Traslados />} />
          <Route path="traslados/:id/cancelar" element={<Traslados />} />

          <Route path="bodegas" element={<Bodegas />} />
          <Route path="bodegas/crear" element={<Bodegas />} />
          <Route path="bodegas/:id/editar" element={<Bodegas />} />
          <Route path="bodegas/:id/eliminar" element={<Bodegas />} />

          <Route path="proveedores" element={<Proveedores />} />
          <Route path="proveedores/crear" element={<Proveedores />} />
          <Route path="proveedores/:id/ver" element={<Proveedores />} />
          <Route path="proveedores/:id/editar" element={<Proveedores />} />
          <Route path="proveedores/:id/eliminar" element={<Proveedores />} />

          <Route path="compras" element={<Compras />} />
          <Route path="compras/crear" element={<Compras />} />
          <Route path="compras/:id/ver" element={<Compras />} />
          <Route path="compras/:id/editar" element={<Compras />} />
          <Route path="compras/:id/eliminar" element={<Compras />} />

          <Route path="remcompras" element={<RemisionesCompra />} />
          <Route path="remcompras/crear" element={<RemisionesCompra />} />
          <Route path="remcompras/:id/ver" element={<RemisionesCompra />} />
          <Route path="remcompras/:id/editar" element={<RemisionesCompra />} />
          <Route path="remcompras/:id/eliminar" element={<RemisionesCompra />} />

          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/crear" element={<Clientes />} />
          <Route path="clientes/:id/ver" element={<Clientes />} />
          <Route path="clientes/:id/editar" element={<Clientes />} />
          <Route path="clientes/:id/eliminar" element={<Clientes />} />

          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="cotizaciones/crear" element={<Cotizaciones />} />
          <Route path="cotizaciones/:id/ver" element={<Cotizaciones />} />
          <Route path="cotizaciones/:id/editar" element={<Cotizaciones />} />
          <Route path="cotizaciones/:id/eliminar" element={<Cotizaciones />} />

          <Route path="ordenes" element={<Ordenes />} />
          <Route path="ordenes/crear" element={<Ordenes />} />
          <Route path="ordenes/:id/ver" element={<Ordenes />} />
          <Route path="ordenes/:id/editar" element={<Ordenes />} />
          <Route path="ordenes/:id/eliminar" element={<Ordenes />} />

          <Route path="remisiones" element={<Remisiones />} />
          <Route path="remisiones/crear" element={<Remisiones />} />
          <Route path="remisiones/:id/ver" element={<Remisiones />} />
          <Route path="remisiones/:id/editar" element={<Remisiones />} />
          <Route path="remisiones/:id/eliminar" element={<Remisiones />} />

          <Route path="pagos" element={<PagosAbonos />} />
          <Route path="pagos/crear" element={<PagosAbonos />} />
          <Route path="pagos/:id/ver" element={<PagosAbonos />} />
          <Route path="pagos/:id/editar" element={<PagosAbonos />} />
          <Route path="pagos/:id/abonar" element={<PagosAbonos />} />

          <Route path="roles" element={<Roles />} />
          <Route path="roles/crear" element={<Roles />} />
          <Route path="roles/:id/editar" element={<Roles />} />
          <Route path="roles/:id/ver" element={<Roles />} />
          <Route path="roles/:id/eliminar" element={<Roles />} />

          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/crear" element={<Usuarios />} />
          <Route path="usuarios/:id/editar" element={<Usuarios />} />
          <Route path="usuarios/:id/ver" element={<Usuarios />} />
          <Route path="usuarios/:id/eliminar" element={<Usuarios />} />

          <Route path="perfil" element={<Perfil />} />

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route
          path="/"
          element={<Navigate to={usuario ? "/app" : "/login"} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={usuario ? "/app" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}