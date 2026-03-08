import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { usuario, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return null;
  }

  if (usuario) {
    return <Navigate to="/app" replace />;
  }

  return children;
};