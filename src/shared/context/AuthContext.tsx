import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";

import { UsuarioSistema } from "../../data/usuarios-sistema";
import { Permisos } from "../../data/roles";
import { Bodega } from "../../data/bodegas";
import { authUserToUsuarioSistema } from "../../features/auth/services/auth.mapper";
import { getMe } from "../../features/auth/services/auth.services";

type BodegaId = number;

interface AuthContextType {
  usuario: UsuarioSistema | null;
  permisos: Permisos | null;
  token: string | null;
  isAuthLoading: boolean;

  setSession: (token: string, usuario: UsuarioSistema | any) => void;
  setUsuario: (usuario: UsuarioSistema | null) => void;
  refreshUsuario: () => Promise<UsuarioSistema | null>;
  logout: () => void;

  tienePermiso: (
    modulo: string,
    submodulo?: string,
    accion?: string
  ) => boolean;

  bodegasDisponibles: Bodega[];
  selectedBodegaId: BodegaId | null;
  setSelectedBodegaId: (bodegaId: BodegaId) => void;
  puedeVerBodega: (bodegaId: BodegaId) => boolean;
  isBodegaFijada: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<UsuarioSistema | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedBodegaId, setSelectedBodegaIdState] =
    useState<BodegaId | null>(null);

  const setUsuario = useCallback((nuevoUsuario: UsuarioSistema | null) => {
    setUsuarioState(nuevoUsuario);

    if (nuevoUsuario) {
      localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
    } else {
      localStorage.removeItem("usuario");
    }
  }, []);

  const logout = useCallback(() => {
    setUsuarioState(null);
    setToken(null);
    setSelectedBodegaIdState(null);

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("isAuthenticated");
  }, []);

  const refreshUsuario = useCallback(async (): Promise<UsuarioSistema | null> => {
    const tokenGuardado = localStorage.getItem("token");
    if (!tokenGuardado) return null;

    try {
      const userBackend = await getMe();
      const userMapeado = authUserToUsuarioSistema(userBackend);
      setUsuario(userMapeado);
      return userMapeado;
    } catch (error) {
      console.error("Error refrescando usuario:", error);
      logout();
      return null;
    }
  }, [logout, setUsuario]);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (tokenGuardado) {
      setToken(tokenGuardado);
    }

    if (usuarioGuardado) {
      try {
        const u = JSON.parse(usuarioGuardado) as UsuarioSistema;
        setUsuarioState(u);
      } catch {
        localStorage.removeItem("usuario");
      }
    }

    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    void refreshUsuario();
  }, [token, refreshUsuario]);

  const setSession = (newToken: string, newUser: UsuarioSistema | any) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);

    const usuarioNormalizado =
      newUser?.permisos && newUser?.bodegasIds
        ? newUser
        : authUserToUsuarioSistema(newUser);

    setUsuario(usuarioNormalizado);
    localStorage.setItem("isAuthenticated", "true");
  };

  const puedeVerBodega = (bodegaId: BodegaId) => {
    if (!usuario) return false;

    if (bodegaId === 0) return (usuario.bodegas?.length ?? 0) >= 2;

    return (
      Array.isArray(usuario.bodegas) &&
      usuario.bodegas.some((b) => b.id === bodegaId)
    );
  };

  const bodegasDisponibles = useMemo(() => {
    return usuario?.bodegas ?? [];
  }, [usuario]);

  const isBodegaFijada = useMemo(() => {
    return !!usuario && (usuario.bodegas?.length ?? 0) === 1;
  }, [usuario]);

  useEffect(() => {
    if (!usuario) {
      setSelectedBodegaIdState(null);
      return;
    }

    const key = `selectedBodegaId:${usuario.id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      const parsed = Number(saved);
      if (Number.isFinite(parsed) && puedeVerBodega(parsed)) {
        setSelectedBodegaIdState(parsed);
        return;
      }
    }

    if ((usuario.bodegas?.length ?? 0) === 1) {
      const id = usuario.bodegas[0].id;
      setSelectedBodegaIdState(id);
      localStorage.setItem(key, String(id));
      return;
    }

    setSelectedBodegaIdState(0);
    localStorage.setItem(key, "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const setSelectedBodegaId = (bodegaId: BodegaId) => {
    if (!usuario) return;
    if (!puedeVerBodega(bodegaId)) return;

    setSelectedBodegaIdState(bodegaId);

    const key = `selectedBodegaId:${usuario.id}`;
    localStorage.setItem(key, String(bodegaId));
  };

  const tienePermiso = (
    modulo: string,
    submodulo?: string,
    accion?: string
  ): boolean => {
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
      return Object.values(permisos[modulo][submodulo]).some(
        (valor) => valor === true
      );
    }

    return permisos[modulo][submodulo][accion] === true;
  };

  const value: AuthContextType = {
    usuario,
    permisos: usuario?.permisos || null,
    token,
    isAuthLoading,

    setSession,
    setUsuario,
    refreshUsuario,
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
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}