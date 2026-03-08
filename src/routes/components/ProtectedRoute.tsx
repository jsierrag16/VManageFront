import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { usuario, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};