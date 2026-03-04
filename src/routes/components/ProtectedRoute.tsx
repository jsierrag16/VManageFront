import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, usuario } = useAuth();

  // ✅ criterio JWT: token manda
  if (!token && !usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};