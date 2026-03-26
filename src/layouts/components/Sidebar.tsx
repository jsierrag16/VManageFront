import { useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Users,
  Truck,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  ChevronDown,
  Warehouse,
  ArrowRightLeft,
  Shield,
} from "lucide-react";
import { useAuth } from "../../shared/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  activeSection: string;
  onNavigate: (path: string) => void;
  onCloseMobile: () => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
}

export function Sidebar({
  isOpen,
  isMobileOpen,
  onNavigate,
  onCloseMobile,
  vManageLogo,
  vManageLogoSmall,
  gvmLogo,
}: SidebarProps) {
  const { pathname } = useLocation();
  const { tienePermiso } = useAuth();

  const [expanded, setExpanded] = useState({
    inventario: false,
    compras: false,
    ventas: false,
    configuracion: false,
  });

  const toggleSubmenu = (key: keyof typeof expanded) => {
    setExpanded((prev) => {
      const newState = {
        inventario: false,
        compras: false,
        ventas: false,
        configuracion: false,
      };
      newState[key] = !prev[key];
      return newState;
    });
  };

  const getFirstSubmenuPath = (itemId: string) => {
    if (itemId === "inventario") return inventarioSubItems[0]?.path;
    if (itemId === "compras") return comprasSubItems[0]?.path;
    if (itemId === "ventas") return ventasSubItems[0]?.path;
    if (itemId === "configuracion") return configuracionSubItems[0]?.path;
    return null;
  };

  const handleMenuClick = (itemId: string) => {
    const isParentModule =
      itemId === "inventario" ||
      itemId === "compras" ||
      itemId === "ventas" ||
      itemId === "configuracion";

    if (isParentModule) {
      if (!isOpen) {
        const firstPath = getFirstSubmenuPath(itemId);
        if (firstPath) {
          onNavigate(firstPath);
          onCloseMobile();
        }
        return;
      }

      if (itemId === "inventario") toggleSubmenu("inventario");
      else if (itemId === "compras") toggleSubmenu("compras");
      else if (itemId === "ventas") toggleSubmenu("ventas");
      else if (itemId === "configuracion") toggleSubmenu("configuracion");

      return;
    }

    setExpanded({
      inventario: false,
      compras: false,
      ventas: false,
      configuracion: false,
    });

    if (itemId === "dashboard") onNavigate("/app");
    else if (itemId === "usuarios") onNavigate("/app/usuarios");
    else onNavigate("/app");

    onCloseMobile();
  };

  const handleSubItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  const isActive = (path: string) => {
    if (path === "/app") return pathname === "/app" || pathname === "/app/";
    return pathname.startsWith(path);
  };

  const inventarioSubItems = useMemo(
    () =>
      [
        {
          id: "productos",
          label: "Productos",
          icon: Package,
          path: "/app/productos",
          visible: tienePermiso("existencias", "productos"),
        },
        {
          id: "traslados",
          label: "Traslados",
          icon: ArrowRightLeft,
          path: "/app/traslados",
          visible: tienePermiso("existencias", "traslados"),
        },
        {
          id: "bodegas",
          label: "Bodegas",
          icon: Warehouse,
          path: "/app/bodegas",
          visible: tienePermiso("existencias", "bodegas"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const comprasSubItems = useMemo(
    () =>
      [
        {
          id: "proveedores",
          label: "Proveedores",
          icon: Truck,
          path: "/app/proveedores",
          visible: tienePermiso("compras", "proveedores"),
        },
        {
          id: "ordenes-compra",
          label: "Ordenes Compra",
          icon: ShoppingCart,
          path: "/app/ordenes-compra",
          visible: tienePermiso("compras", "ordenesCompra"),
        },
        {
          id: "remisiones-compra",
          label: "Remisiones Compra",
          icon: FileText,
          path: "/app/remisiones-compra",
          visible: tienePermiso("compras", "remisionesCompra"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const ventasSubItems = useMemo(
    () =>
      [
        {
          id: "clientes",
          label: "Clientes",
          icon: Users,
          path: "/app/clientes",
          visible: tienePermiso("ventas", "clientes"),
        },
        {
          id: "cotizaciones",
          label: "Cotizaciones",
          icon: FileText,
          path: "/app/cotizaciones",
          visible: tienePermiso("ventas", "cotizaciones"),
        },
        {
          id: "ordenes-venta",
          label: "Ordenes Venta",
          icon: FileText,
          path: "/app/ordenes-venta",
          visible: tienePermiso("ventas", "ordenesVenta"),
        },
        {
          id: "remisiones-venta",
          label: "Remisiones Venta",
          icon: FileText,
          path: "/app/remisiones-venta",
          visible: tienePermiso("ventas", "remisionesVenta"),
        },
        {
          id: "pagos",
          label: "Pagos",
          icon: Settings,
          path: "/app/pagos-abonos",
          visible: tienePermiso("ventas", "pagos"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const configuracionSubItems = useMemo(
    () =>
      [
        {
          id: "roles",
          label: "Roles",
          icon: Shield,
          path: "/app/roles",
          visible: tienePermiso("administracion", "roles"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const menuItems = useMemo(() => {
    const items = [];

    if (tienePermiso("dashboard")) {
      items.push({ id: "dashboard", name: "Dashboard", icon: Home, hasSubmenu: false });
    }

    if (inventarioSubItems.length > 0) {
      items.push({ id: "inventario", name: "Existencias", icon: Package, hasSubmenu: true });
    }

    if (comprasSubItems.length > 0) {
      items.push({ id: "compras", name: "Compras", icon: ShoppingCart, hasSubmenu: true });
    }

    if (ventasSubItems.length > 0) {
      items.push({ id: "ventas", name: "Ventas", icon: FileText, hasSubmenu: true });
    }

    if (configuracionSubItems.length > 0) {
      items.push({ id: "configuracion", name: "Configuración", icon: Settings, hasSubmenu: true });
    }

    if (tienePermiso("administracion", "usuarios")) {
      items.push({ id: "usuarios", name: "Usuarios", icon: Users, hasSubmenu: false });
    }

    return items;
  }, [
    tienePermiso,
    inventarioSubItems,
    comprasSubItems,
    ventasSubItems,
    configuracionSubItems,
  ]);

  return (
    <>
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 border-r border-emerald-200 text-gray-700 transition-all duration-300 z-40 shadow-sm flex-shrink-0 ${isOpen ? "w-64" : "w-20"
          } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          <Link to="/app" className="block">
            <div className="p-4 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90">
              {isOpen ? (
                <img src={vManageLogo} alt="VManage" className="h-16 w-auto" />
              ) : (
                <img src={vManageLogoSmall} alt="V" className="h-14 w-auto" />
              )}
            </div>
          </Link>

          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expanded[item.id as keyof typeof expanded];

              const mainActive =
                item.id === "dashboard"
                  ? isActive("/app")
                  : item.id === "inventario"
                    ? inventarioSubItems.some((sub) => isActive(sub.path))
                    : item.id === "compras"
                      ? comprasSubItems.some((sub) => isActive(sub.path))
                      : item.id === "ventas"
                        ? ventasSubItems.some((sub) => isActive(sub.path))
                        : item.id === "configuracion"
                          ? configuracionSubItems.some((sub) => isActive(sub.path))
                          : item.id === "usuarios"
                            ? isActive("/app/usuarios")
                            : false;

              return (
                <div key={item.id}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${mainActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-emerald-200 hover:text-gray-900"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={20} className="flex-shrink-0" />
                      {isOpen && <span className="text-sm truncate">{item.name}</span>}
                    </div>

                    {isOpen && item.hasSubmenu && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    )}
                  </motion.button>

                  {isOpen && item.hasSubmenu && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4"
                        >
                          {item.id === "inventario" &&
                            inventarioSubItems.map((sub) => (
                              <SubMenuItem
                                key={sub.id}
                                icon={sub.icon}
                                label={sub.label}
                                onClick={() => handleSubItemClick(sub.path)}
                                active={isActive(sub.path)}
                              />
                            ))}

                          {item.id === "compras" &&
                            comprasSubItems.map((sub) => (
                              <SubMenuItem
                                key={sub.id}
                                icon={sub.icon}
                                label={sub.label}
                                onClick={() => handleSubItemClick(sub.path)}
                                active={isActive(sub.path)}
                              />
                            ))}

                          {item.id === "ventas" &&
                            ventasSubItems.map((sub) => (
                              <SubMenuItem
                                key={sub.id}
                                icon={sub.icon}
                                label={sub.label}
                                onClick={() => handleSubItemClick(sub.path)}
                                active={isActive(sub.path)}
                              />
                            ))}

                          {item.id === "configuracion" &&
                            configuracionSubItems.map((sub) => (
                              <SubMenuItem
                                key={sub.id}
                                icon={sub.icon}
                                label={sub.label}
                                onClick={() => handleSubItemClick(sub.path)}
                                active={isActive(sub.path)}
                              />
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 flex items-center justify-center">
            <img
              src={gvmLogo}
              alt="GVM"
              className={`${isOpen ? "h-14" : "h-8"} w-auto opacity-70`}
            />
          </div>
        </div>
      </motion.aside>

      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}

function SubMenuItem({ icon: Icon, label, onClick, active }: any) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 rounded-lg mb-1 text-sm cursor-pointer flex items-center gap-3 ${active
        ? "bg-blue-500 text-white"
        : "text-gray-600 hover:bg-emerald-100 hover:text-gray-900"
        }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}