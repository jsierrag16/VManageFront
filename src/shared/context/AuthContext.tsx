import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { UsuarioSistema } from "../../data/usuarios-sistema";
import { Permisos } from "../../data/roles";
import { bodegasData, Bodega } from "../../data/bodegas";

type BodegaId = number;

interface AuthContextType {
  usuario: UsuarioSistema | null;
  permisos: Permisos | null;

  setUsuario: (usuario: UsuarioSistema | null) => void;
  logout: () => void;

  tienePermiso: (modulo: string, submodulo?: string, accion?: string) => boolean;

  // ✅ Bodegas (global)
  bodegasDisponibles: Bodega[];
  selectedBodegaId: BodegaId | null;
  setSelectedBodegaId: (bodegaId: BodegaId) => void;
  puedeVerBodega: (bodegaId: BodegaId) => boolean;
  isBodegaFijada: boolean; // true si solo tiene 1 bodega
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<UsuarioSistema | null>(null);
  const [selectedBodegaId, setSelectedBodegaIdState] = useState<BodegaId | null>(null);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      const u = JSON.parse(usuarioGuardado) as UsuarioSistema;
      setUsuarioState(u);
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
    setSelectedBodegaIdState(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("isAuthenticated");
  };

  const puedeVerBodega = (bodegaId: BodegaId) => {
    if (!usuario) return false;

    // ✅ 0 = "Todas las bodegas" solo si tiene 2+ bodegas asignadas
    if (bodegaId === 0) return (usuario.bodegasIds?.length ?? 0) >= 2;

    return Array.isArray(usuario.bodegasIds) && usuario.bodegasIds.includes(bodegaId);
  };



  // Bodegas visibles para el usuario (filtradas por permisos)
  const bodegasDisponibles = useMemo(() => {
    if (!usuario) return [];
    const ids = usuario.bodegasIds ?? [];
    return bodegasData.filter((b) => ids.includes(b.id));
  }, [usuario]);

  const isBodegaFijada = useMemo(() => {
    return !!usuario && (usuario.bodegasIds?.length ?? 0) === 1;
  }, [usuario]);

  // Inicializar bodega seleccionada cuando cambia el usuario
  useEffect(() => {
    if (!usuario) {
      setSelectedBodegaIdState(null);
      return;
    }

    const key = `selectedBodegaId:${usuario.id}`;
    const saved = localStorage.getItem(key);

    // 1) Si hay una selección guardada y es válida, usarla
    if (saved) {
      const parsed = Number(saved);
      if (Number.isFinite(parsed) && puedeVerBodega(parsed)) {
        setSelectedBodegaIdState(parsed);
        return;
      }
    }

    // 2) Si solo tiene 1 bodega, se fija automáticamente
    if ((usuario.bodegasIds?.length ?? 0) === 1) {
      const id = usuario.bodegasIds[0];
      setSelectedBodegaIdState(id);
      localStorage.setItem(key, String(id));
      return;
    }

    // 3) Si tiene varias, selecciona la primera por defecto (o deja null si prefieres)
    // ✅ si tiene varias bodegas, arrancar en "Todas"
    setSelectedBodegaIdState(0);
    localStorage.setItem(key, "0");
  }, [usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSelectedBodegaId = (bodegaId: BodegaId) => {
    if (!usuario) return;

    // No permitir elegir una bodega no autorizada
    if (!puedeVerBodega(bodegaId)) return;

    setSelectedBodegaIdState(bodegaId);

    const key = `selectedBodegaId:${usuario.id}`;
    localStorage.setItem(key, String(bodegaId));
  };

  // Función para verificar si el usuario tiene un permiso específico
  const tienePermiso = (modulo: string, submodulo?: string, accion?: string): boolean => {
    if (!usuario || !usuario.permisos) return false;

    const permisos = usuario.permisos as any;

    if (!permisos[modulo]) return false;

    if (!submodulo) {
      if (modulo === "dashboard") {
        return permisos.dashboard.acceder;
      }
      return Object.keys(permisos[modulo]).some((sub) => {
        const subPermisos = permisos[modulo][sub];
        return Object.values(subPermisos).some((valor) => valor === true);
      });
    }

    if (!permisos[modulo][submodulo]) return false;

    if (!accion) {
      return Object.values(permisos[modulo][submodulo]).some((valor) => valor === true);
    }

    return permisos[modulo][submodulo][accion] === true;
  };

  const value: AuthContextType = {
    usuario,
    permisos: usuario?.permisos || null,
    setUsuario,
    logout,
    tienePermiso,

    bodegasDisponibles,
    selectedBodegaId,
    setSelectedBodegaId,
    puedeVerBodega,
    isBodegaFijada,
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
