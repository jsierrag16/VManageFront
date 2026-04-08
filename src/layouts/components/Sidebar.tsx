import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useLocation, Link } from "react-router-dom";
import { createPortal } from "react-dom";
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
  Boxes,
  Receipt,
  ReceiptText,
  BadgeDollarSign,
  type LucideIcon,
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

type ParentMenu = "inventario" | "compras" | "ventas" | "configuracion";

interface CompactPopupPosition {
  top: number;
  left: number;
}

interface SubItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  visible?: boolean;
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

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const compactPopupRef = useRef<HTMLDivElement | null>(null);

  const [expanded, setExpanded] = useState<Record<ParentMenu, boolean>>({
    inventario: false,
    compras: false,
    ventas: false,
    configuracion: false,
  });

  const [compactMenuOpen, setCompactMenuOpen] = useState<ParentMenu | null>(
    null
  );

  const [compactPopupPosition, setCompactPopupPosition] =
    useState<CompactPopupPosition>({
      top: 0,
      left: 0,
    });

  const toggleSubmenu = (key: ParentMenu) => {
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

  const isParentModule = (itemId: string): itemId is ParentMenu => {
    return (
      itemId === "inventario" ||
      itemId === "compras" ||
      itemId === "ventas" ||
      itemId === "configuracion"
    );
  };

  const isActive = (path: string) => {
    if (path === "/app") return pathname === "/app" || pathname === "/app/";
    return pathname.startsWith(path);
  };

  const inventarioSubItems = useMemo<SubItem[]>(
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

  const comprasSubItems = useMemo<SubItem[]>(
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
          label: "Ordenes compra",
          icon: Receipt,
          path: "/app/ordenes-compra",
          visible: tienePermiso("compras", "ordenesCompra"),
        },
        {
          id: "remisiones-compra",
          label: "Remisiones compra",
          icon: ReceiptText,
          path: "/app/remisiones-compra",
          visible: tienePermiso("compras", "remisionesCompra"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const ventasSubItems = useMemo<SubItem[]>(
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
          label: "Ordenes venta",
          icon: Receipt,
          path: "/app/ordenes-venta",
          visible: tienePermiso("ventas", "ordenesVenta"),
        },
        {
          id: "remisiones-venta",
          label: "Remisiones venta",
          icon: ReceiptText,
          path: "/app/remisiones-venta",
          visible: tienePermiso("ventas", "remisionesVenta"),
        },
        {
          id: "pagos",
          label: "Pagos abonos",
          icon: BadgeDollarSign,
          path: "/app/pagos-abonos",
          visible: tienePermiso("ventas", "pagos"),
        },
      ].filter((item) => item.visible),
    [tienePermiso]
  );

  const configuracionSubItems = useMemo<SubItem[]>(
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
    const items: Array<{
      id: string;
      name: string;
      icon: LucideIcon;
      hasSubmenu: boolean;
    }> = [];

    if (tienePermiso("dashboard")) {
      items.push({
        id: "dashboard",
        name: "Dashboard",
        icon: Home,
        hasSubmenu: false,
      });
    }

    if (inventarioSubItems.length > 0) {
      items.push({
        id: "inventario",
        name: "Existencias",
        icon: Boxes,
        hasSubmenu: true,
      });
    }

    if (comprasSubItems.length > 0) {
      items.push({
        id: "compras",
        name: "Compras",
        icon: ShoppingCart,
        hasSubmenu: true,
      });
    }

    if (ventasSubItems.length > 0) {
      items.push({
        id: "ventas",
        name: "Ventas",
        icon: ReceiptText,
        hasSubmenu: true,
      });
    }

    if (configuracionSubItems.length > 0) {
      items.push({
        id: "configuracion",
        name: "Configuración",
        icon: Settings,
        hasSubmenu: true,
      });
    }

    if (tienePermiso("administracion", "usuarios")) {
      items.push({
        id: "usuarios",
        name: "Usuarios",
        icon: Users,
        hasSubmenu: false,
      });
    }

    return items;
  }, [
    tienePermiso,
    inventarioSubItems,
    comprasSubItems,
    ventasSubItems,
    configuracionSubItems,
  ]);

  const getSubmenuItems = (itemId: string): SubItem[] => {
    if (itemId === "inventario") return inventarioSubItems;
    if (itemId === "compras") return comprasSubItems;
    if (itemId === "ventas") return ventasSubItems;
    if (itemId === "configuracion") return configuracionSubItems;
    return [];
  };

  const handleMenuClick = (
    itemId: string,
    event?: ReactMouseEvent<HTMLButtonElement>
  ) => {
    if (isParentModule(itemId)) {
      if (!isOpen) {
        if (event?.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();

          setCompactPopupPosition({
            top: Math.max(18, rect.top - 6),
            left: rect.right + 24,
          });
        }

        setCompactMenuOpen((prev) => (prev === itemId ? null : itemId));
        return;
      }

      setCompactMenuOpen(null);
      toggleSubmenu(itemId);
      return;
    }

    setExpanded({
      inventario: false,
      compras: false,
      ventas: false,
      configuracion: false,
    });
    setCompactMenuOpen(null);

    if (itemId === "dashboard") onNavigate("/app");
    else if (itemId === "usuarios") onNavigate("/app/usuarios");
    else onNavigate("/app");

    onCloseMobile();
  };

  const handleSubItemClick = (path: string) => {
    setCompactMenuOpen(null);
    onNavigate(path);
    onCloseMobile();
  };

  useEffect(() => {
    if (isOpen) {
      setCompactMenuOpen(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setCompactMenuOpen(null);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideSidebar =
        sidebarRef.current && sidebarRef.current.contains(target);

      const clickedInsidePopup =
        compactPopupRef.current && compactPopupRef.current.contains(target);

      if (clickedInsideSidebar || clickedInsidePopup) return;

      setCompactMenuOpen(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleViewportChange = () => {
      if (compactMenuOpen) {
        setCompactMenuOpen(null);
      }
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [compactMenuOpen]);

  const compactPopup =
    !isOpen &&
      compactMenuOpen &&
      typeof document !== "undefined"
      ? createPortal(
        <AnimatePresence>
          <motion.div
            ref={compactPopupRef}
            key={compactMenuOpen}
            initial={{ opacity: 0, y: 2, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.985 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="fixed z-99999 w-67.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.20)]"
            style={{
              top: compactPopupPosition.top,
              left: compactPopupPosition.left,
              maxHeight: "calc(100vh - 36px)",
              overflowY: "auto",
            }}
          >
            <div className="space-y-1">
              {getSubmenuItems(compactMenuOpen).map((sub) => (
                <CompactSubMenuItem
                  key={sub.id}
                  icon={sub.icon}
                  label={sub.label}
                  active={isActive(sub.path)}
                  onClick={() => handleSubItemClick(sub.path)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
      : null;

  return (
    <>
      <motion.aside
        ref={sidebarRef}
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40 shrink-0 ${isOpen ? "w-64" : "w-20"
          } ${isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }`}
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

          <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = isParentModule(item.id)
                ? expanded[item.id]
                : false;

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

              const submenuItems = getSubmenuItems(item.id);

              return (
                <div key={item.id} className="mb-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={(event) => handleMenuClick(item.id, event)}
                    className={`w-full flex items-center ${isOpen ? "justify-between px-3" : "justify-center px-0"
                      } py-2 rounded-lg text-sm transition-all duration-200 ${mainActive
                        ? isOpen
                          ? "text-blue-600 font-semibold"
                          : "bg-gray-100 text-blue-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <div
                      className={`flex items-center ${isOpen ? "gap-3" : ""
                        } min-w-0`}
                    >
                      <Icon
                        size={20}
                        className={`shrink-0 ${mainActive ? "text-blue-600" : "text-gray-500"
                          }`}
                      />
                      {isOpen && (
                        <span className="truncate font-semibold">
                          {item.name}
                        </span>
                      )}
                    </div>

                    {isOpen && item.hasSubmenu && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        <ChevronDown
                          size={16}
                          className={
                            mainActive ? "text-blue-600" : "text-gray-400"
                          }
                        />
                      </motion.div>
                    )}
                  </motion.button>

                  {isOpen && item.hasSubmenu && (
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden ml-6 pl-3 border-l border-gray-200 flex flex-col gap-1 mt-1"
                        >
                          {submenuItems.map((sub) => (
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

      {compactPopup}

      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setCompactMenuOpen(null);
            onCloseMobile();
          }}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}

interface SubMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active: boolean;
}

function SubMenuItem({
  icon: Icon,
  label,
  onClick,
  active,
}: SubMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${active
        ? "bg-gray-100 text-gray-900 font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
    >
      <Icon
        size={18}
        className={`shrink-0 ${active ? "text-gray-900" : "text-gray-400"
          }`}
      />
      <span className="truncate font-semibold">{label}</span>
    </button>
  );
}

interface CompactSubMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active: boolean;
}

function CompactSubMenuItem({
  icon: Icon,
  label,
  onClick,
  active,
}: CompactSubMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${active
        ? "bg-gray-100 text-gray-900"
        : "text-gray-700 hover:bg-gray-50"
        }`}
    >
      <Icon
        size={18}
        className={`shrink-0 ${active ? "text-gray-900" : "text-gray-400"
          }`}
      />
      <span className="truncate block font-semibold">{label}</span>
    </button>
  );
}