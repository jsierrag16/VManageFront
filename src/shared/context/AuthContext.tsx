import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UsuarioSistema } from "../../data/usuarios-sistema";
import { Permisos } from "../../data/roles";

interface AuthContextType {
  usuario: UsuarioSistema | null;
  permisos: Permisos | null;
  setUsuario: (usuario: UsuarioSistema | null) => void;
  logout: () => void;
  tienePermiso: (modulo: string, submodulo?: string, accion?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<UsuarioSistema | null>(null);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuarioState(JSON.parse(usuarioGuardado));
    }
  }, []);

  const setUsuario = (nuevoUsuario: UsuarioSistema | null) => {
    setUsuarioState(nuevoUsuario);
    if (nuevoUsuario) {
      localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
    } else {
      localStorage.removeItem("usuario");
    }
  };

  const logout = () => {
    setUsuarioState(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("isAuthenticated");
  };

  // Función para verificar si el usuario tiene un permiso específico
  const tienePermiso = (
    modulo: string,
    submodulo?: string,
    accion?: string
  ): boolean => {
    if (!usuario || !usuario.permisos) return false;

    const permisos = usuario.permisos as any;

    // Verificar acceso al módulo principal
    if (!permisos[modulo]) return false;

    // Si solo se consulta el módulo (ej: dashboard)
    if (!submodulo) {
      // Para módulos simples como dashboard
      if (modulo === "dashboard") {
        return permisos.dashboard.acceder;
      }
      // Para módulos complejos, verificar si tiene al menos un permiso
      return Object.keys(permisos[modulo]).some((sub) => {
        const subPermisos = permisos[modulo][sub];
        return Object.values(subPermisos).some((valor) => valor === true);
      });
    }

    // Si se consulta submódulo
    if (!permisos[modulo][submodulo]) return false;

    // Si no se especifica acción, verificar si tiene al menos un permiso en el submódulo
    if (!accion) {
      return Object.values(permisos[modulo][submodulo]).some(
        (valor) => valor === true
      );
    }

    // Verificar acción específica
    return permisos[modulo][submodulo][accion] === true;
  };

  const value = {
    usuario,
    permisos: usuario?.permisos || null,
    setUsuario,
    logout,
    tienePermiso,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
