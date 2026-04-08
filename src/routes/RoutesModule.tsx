import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useState, type ReactElement } from "react";
import { useAuth } from "@/shared/context/AuthContext";

// Guards
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";

// Páginas
import Login from "@/features/auth/pages/Login";
import RestablecerContrasena from "@/features/auth/pages/RestablecerContrasena";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Bodegas from "@/features/existencias/bodegas/pages/Bodegas";
import Productos from "@/features/existencias/productos/pages/Productos";
import Traslados from "@/features/existencias/traslados/pages/Traslados";
import Perfil from "@/features/usuarios/perfil/pages/Perfil";
import Usuarios from "@/features/usuarios/pages/Usuarios";
import Roles from "@/features/configuracion/roles/pages/Roles";
import Proveedores from "@/features/compras/proveedores/pages/Proveedores";
import Compras from "@/features/compras/ordenes-compra/pages/OrdenesCompra";
import RemisionesCompra from "@/features/compras/remisiones-compra/pages/RemisionesCompra";
import Clientes from "@/features/ventas/clientes/pages/Clientes";
import Cotizaciones from "@/features/ventas/cotizaciones/pages/Cotizaciones";
import OrdenesVenta from "@/features/ventas/ordenes-venta/pages/OrdenesVenta";
import Remisiones from "@/features/ventas/remisiones-venta/pages/RemisionesVenta";
import PagosAbonos from "@/features/ventas/pagos-abonos/pages/PagosAbonos";

// Layout
import MainLayout from "@/layouts/MainLayout";

// Assets
import vManageLogo from "@/assets/images/VManageLogo.png";
import vManageLogoSmall from "@/assets/images/VLogo.png";
import gvmLogo from "@/assets/images/GVMLogo.png";

type CrudRouteConfig = {
  basePath: string;
  element: ReactElement;
  modulo: string;
  submodulo: string;
  redirectTo?: string;
  includeView?: boolean;
  includeCreate?: boolean;
  includeEdit?: boolean;
  includeDelete?: boolean;
  includeAnular?: boolean;
  includeAbonar?: boolean;
};

export default function RoutesModule() {
  const { usuario, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const withPermission = (
    element: ReactElement,
    modulo: string,
    submodulo: string,
    accion: string,
    redirectTo: string
  ) => (
    <ProtectedRoute
      modulo={modulo}
      submodulo={submodulo}
      accion={accion}
      redirectTo={redirectTo}
    >
      {element}
    </ProtectedRoute>
  );

  const buildCrudRoutes = ({
    basePath,
    element,
    modulo,
    submodulo,
    redirectTo,
    includeView = true,
    includeCreate = true,
    includeEdit = true,
    includeDelete = false,
    includeAnular = false,
    includeAbonar = false,
  }: CrudRouteConfig) => {
    const redirect = redirectTo ?? `/app/${basePath}`;

    return (
      <>
        <Route
          path={basePath}
          element={withPermission(element, modulo, submodulo, "ver", "/app")}
        />

        {includeCreate && (
          <Route
            path={`${basePath}/crear`}
            element={withPermission(element, modulo, submodulo, "crear", redirect)}
          />
        )}

        {includeView && (
          <Route
            path={`${basePath}/:id/ver`}
            element={withPermission(element, modulo, submodulo, "ver", redirect)}
          />
        )}

        {includeEdit && (
          <Route
            path={`${basePath}/:id/editar`}
            element={withPermission(element, modulo, submodulo, "editar", redirect)}
          />
        )}

        {includeDelete && (
          <Route
            path={`${basePath}/:id/eliminar`}
            element={withPermission(element, modulo, submodulo, "eliminar", redirect)}
          />
        )}

        {includeAnular && (
          <Route
            path={`${basePath}/:id/anular`}
            element={withPermission(element, modulo, submodulo, "anular", redirect)}
          />
        )}

        {includeAbonar && (
          <Route
            path={`${basePath}/:id/abonar`}
            element={withPermission(
              element,
              modulo,
              submodulo,
              "agregarAbonos",
              redirect
            )}
          />
        )}
      </>
    );
  };

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
          path="/restablecer-contrasena"
          element={<RestablecerContrasena />}
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
              />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute
                modulo="dashboard"
                accion="acceder"
                redirectTo="/app/perfil"
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {buildCrudRoutes({
            basePath: "productos",
            element: <Productos />,
            modulo: "existencias",
            submodulo: "productos",
            includeDelete: false,
          })}

          {buildCrudRoutes({
            basePath: "traslados",
            element: <Traslados />,
            modulo: "existencias",
            submodulo: "traslados",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "bodegas",
            element: <Bodegas />,
            modulo: "existencias",
            submodulo: "bodegas",
            includeView: false,
            includeDelete: true,
          })}

          {buildCrudRoutes({
            basePath: "proveedores",
            element: <Proveedores />,
            modulo: "compras",
            submodulo: "proveedores",
            includeDelete: true,
          })}

          {buildCrudRoutes({
            basePath: "ordenes-compra",
            element: <Compras />,
            modulo: "compras",
            submodulo: "ordenesCompra",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "remisiones-compra",
            element: <RemisionesCompra />,
            modulo: "compras",
            submodulo: "remisionesCompra",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "clientes",
            element: <Clientes />,
            modulo: "ventas",
            submodulo: "clientes",
            includeDelete: true,
          })}

          {buildCrudRoutes({
            basePath: "cotizaciones",
            element: <Cotizaciones />,
            modulo: "ventas",
            submodulo: "cotizaciones",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "ordenes-venta",
            element: <OrdenesVenta />,
            modulo: "ventas",
            submodulo: "ordenesVenta",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "remisiones-venta",
            element: <Remisiones />,
            modulo: "ventas",
            submodulo: "remisionesVenta",
            includeDelete: false,
            includeAnular: true,
          })}

          {buildCrudRoutes({
            basePath: "pagos-abonos",
            element: <PagosAbonos />,
            modulo: "ventas",
            submodulo: "pagos",
            includeEdit: false,
            includeDelete: false,
            includeAnular: true,
            includeAbonar: true,
          })}

          {buildCrudRoutes({
            basePath: "roles",
            element: <Roles />,
            modulo: "administracion",
            submodulo: "roles",
            includeDelete: true,
          })}

          {buildCrudRoutes({
            basePath: "usuarios",
            element: <Usuarios />,
            modulo: "administracion",
            submodulo: "usuarios",
            includeDelete: true,
          })}

          <Route
            path="perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div>Ruta no encontrada dentro de /app</div>} />
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