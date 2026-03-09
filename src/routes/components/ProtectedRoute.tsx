import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { usuario, isAuthLoading } = useAuth();

  const token = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("usuario");

  if (isAuthLoading) {
    return null;
  }

  if (!usuario && (!token || !usuarioGuardado)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
