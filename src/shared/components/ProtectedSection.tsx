import { ReactNode } from "react";
import { useAuth } from "../shared/context/AuthContext";

interface ProtectedSectionProps {
  children: ReactNode;
  module: string;
  submodule?: string;
  action?: string;
  fallback?: ReactNode;
}

export function ProtectedSection({
  children,
  module,
  submodule,
  action,
  fallback = null,
}: ProtectedSectionProps) {
  const { tienePermiso } = useAuth();

  if (!tienePermiso(module, submodule, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}