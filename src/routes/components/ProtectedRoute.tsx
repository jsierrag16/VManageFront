import { ReactNode } from 'react'; 
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { usuario } = useAuth();

  if (!usuario) {
    // Si NO está logueado, lo mandamos al login
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, renderizamos el componente hijo (el Dashboard)
  return children;
};