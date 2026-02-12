import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { usuario } = useAuth();

  if (usuario) {
    // Si YA está logueado, no debe ver el login, lo mandamos a /app
    return <Navigate to="/app" replace />;
  }

  return children;
};
