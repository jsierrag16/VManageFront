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

import { getMe } from "../../features/auth/services/auth.services";

type BodegaId = number;

interface AuthContextType {
  usuario: UsuarioSistema | null;
  permisos: Permisos | null;
  token: string | null;

  setSession: (token: string, usuario: UsuarioSistema) => void;
  setUsuario: (usuario: UsuarioSistema | null) => void;
  logout: () => void;

  tienePermiso: (modulo: string, submodulo?: string, accion?: string) => boolean;

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
  const [selectedBodegaId, setSelectedBodegaIdState] = useState<BodegaId | null>(null);

  // ✅ Cargar sesión desde storage
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (tokenGuardado) setToken(tokenGuardado);

    if (usuarioGuardado) {
      try {
        const u = JSON.parse(usuarioGuardado) as UsuarioSistema;
        setUsuarioState(u);
      } catch {
        localStorage.removeItem("usuario");
      }
    }
  }, []);

  // ✅ Auto-login PRO: validar token con backend
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        await getMe(); // valida token
        // 🔥 Más adelante: aquí mismo actualizamos usuario desde backend con /auth/me completo
      } catch (err: any) {
        // si es 401/403, token inválido/expirado
        logout();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const setUsuario = (nuevoUsuario: UsuarioSistema | null) => {
    setUsuarioState(nuevoUsuario);
    if (nuevoUsuario) {
      localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
    } else {
      localStorage.removeItem("usuario");
    }
  };

  const setSession = (newToken: string, newUser: UsuarioSistema) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);

    setUsuarioState(newUser);
    localStorage.setItem("usuario", JSON.stringify(newUser));

    localStorage.setItem("isAuthenticated", "true"); // opcional, puedes quitarlo luego
  };

  const logout = () => {
    setUsuarioState(null);
    setToken(null);
    setSelectedBodegaIdState(null);

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("isAuthenticated");
  };

  const puedeVerBodega = (bodegaId: BodegaId) => {
    if (!usuario) return false;

    // ✅ 0 = "Todas" solo si tiene 2+ bodegas asignadas
    if (bodegaId === 0) return (usuario.bodegasIds?.length ?? 0) >= 2;

    return Array.isArray(usuario.bodegasIds) && usuario.bodegasIds.includes(bodegaId);
  };

  // ✅ Por ahora, bodegasData es mock. Luego vendrá del backend.
  const bodegasDisponibles = useMemo(() => {
    if (!usuario) return [];
    const ids = usuario.bodegasIds ?? [];
    return bodegasData.filter((b) => ids.includes(b.id));
  }, [usuario]);

  const isBodegaFijada = useMemo(() => {
    return !!usuario && (usuario.bodegasIds?.length ?? 0) === 1;
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

    if ((usuario.bodegasIds?.length ?? 0) === 1) {
      const id = usuario.bodegasIds[0];
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
    token,

    setSession,
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
  if (!context) throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}