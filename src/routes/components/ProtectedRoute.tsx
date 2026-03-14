import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  modulo?: string;
  submodulo?: string;
  accion?: string;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  modulo,
  submodulo,
  accion,
  redirectTo = "/app",
}: ProtectedRouteProps) => {
  const { usuario, isAuthLoading, tienePermiso } = useAuth();
  const location = useLocation();

  if (isAuthLoading) return null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (modulo && !tienePermiso(modulo, submodulo, accion)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};