import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, Truck, Package, ShoppingCart, FileText, Settings,
  ChevronDown, Warehouse, ArrowRightLeft, Shield
} from "lucide-react";

// Definición de ítems y funciones auxiliares
const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: Home },
  { id: "inventario", name: "Existencias", icon: Package },
  { id: "compras", name: "Compras", icon: ShoppingCart },
  { id: "ventas", name: "Ventas", icon: FileText },
  { id: "configuracion", name: "Configuración", icon: Settings },
  { id: "usuarios", name: "Usuarios", icon: Users },
];

const getAvailableMenus = (rol: string) => {
  switch (rol) {
    case "Administrador": return menuItems;
    case "Vendedor": return menuItems.filter(i => ["dashboard", "inventario", "compras", "ventas"].includes(i.id));
    case "Aux. Administrativo": return menuItems.filter(i => ["dashboard", "inventario", "compras", "ventas"].includes(i.id));
    case "Aux. Logistico": return menuItems.filter(i => ["dashboard", "inventario", "ventas"].includes(i.id));
    case "Conductor": return menuItems.filter(i => ["ventas"].includes(i.id));
    default: return menuItems;
  }
};

interface SidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  currentUser: any;

  // lo mantenemos para no romper tu layout, pero ya no es necesario
  activeSection: string;

  // ahora recibe PATHS, ejemplo: "/app/bodegas"
  onNavigate: (path: string) => void;

  onCloseMobile: () => void;

  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
}

export function Sidebar({
  isOpen,
  isMobileOpen,
  currentUser,
  onNavigate,
  onCloseMobile,
  vManageLogo,
  vManageLogoSmall,
  gvmLogo
}: SidebarProps) {

  const { pathname } = useLocation();

  // Estados locales para los submenús
  const [expanded, setExpanded] = useState({
    inventario: false,
    compras: false,
    ventas: false,
    configuracion: false
  });

  const toggleSubmenu = (key: keyof typeof expanded) => {
    setExpanded(prev => {
      const newState = { inventario: false, compras: false, ventas: false, configuracion: false };
      newState[key] = !prev[key];
      return newState;
    });
  };

  const handleMenuClick = (itemId: string) => {
    if (itemId === "inventario") toggleSubmenu("inventario");
    else if (itemId === "compras") toggleSubmenu("compras");
    else if (itemId === "ventas") toggleSubmenu("ventas");
    else if (itemId === "configuracion") toggleSubmenu("configuracion");
    else {
      setExpanded({ inventario: false, compras: false, ventas: false, configuracion: false });

      // ✅ Navegación por URL
      if (itemId === "dashboard") onNavigate("/app");
      else if (itemId === "usuarios") onNavigate("/app/usuarios");
      else if (itemId === "ventas") onNavigate("/app/ventas");
      else if (itemId === "compras") onNavigate("/app/compras");
      else if (itemId === "configuracion") onNavigate("/app/configuracion");
      else onNavigate("/app");

      onCloseMobile();
    }
  };

  const handleSubItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  // ✅ helpers para "active" por ruta
  const isActive = (path: string) => {
    if (path === "/app") return pathname === "/app" || pathname === "/app/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 border-r border-emerald-200 text-gray-700 transition-all duration-300 z-40 shadow-sm flex-shrink-0 ${
          isOpen ? "w-64" : "w-20"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-center">
            {isOpen ? (
              <img src={vManageLogo} alt="VManage" className="h-16 w-auto" />
            ) : (
              <img src={vManageLogoSmall} alt="V" className="h-14 w-auto" />
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {getAvailableMenus(currentUser.rol).map((item) => {
              const Icon = item.icon;
              const hasSubmenu = ["inventario", "compras", "ventas", "configuracion"].includes(item.id);
              const isExpanded = expanded[item.id as keyof typeof expanded];

              // ✅ Active de menús principales (solo dashboard por ahora)
              const mainActive =
                item.id === "dashboard"
                  ? isActive("/app")
                  : item.id === "inventario"
                  ? isActive("/app/existencias") || isActive("/app/traslados") || isActive("/app/bodegas")
                  : item.id === "compras"
                  ? isActive("/app/proveedores") || isActive("/app/ordenescompra") || isActive("/app/remisionescompra")
                  : item.id === "ventas"
                  ? isActive("/app/clientes") || isActive("/app/cotizaciones") || isActive("/app/ordenes") || isActive("/app/remisiones") || isActive("/app/pagos")
                  : item.id === "configuracion"
                  ? isActive("/app/roles")
                  : item.id === "usuarios"
                  ? isActive("/app/usuarios")
                  : false;

              return (
                <div key={item.id}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                      mainActive ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-emerald-200 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={20} className="flex-shrink-0" />
                      {isOpen && <span className="text-sm truncate">{item.name}</span>}
                    </div>
                    {isOpen && hasSubmenu && (
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} />
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Submenús */}
                  {isOpen && hasSubmenu && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4"
                        >
                          {item.id === "inventario" && (
                            <>
                              <SubMenuItem
                                icon={Package}
                                label="Productos"
                                onClick={() => handleSubItemClick("/app/existencias")}
                                active={isActive("/app/existencias")}
                              />
                              <SubMenuItem
                                icon={ArrowRightLeft}
                                label="Traslados"
                                onClick={() => handleSubItemClick("/app/traslados")}
                                active={isActive("/app/traslados")}
                              />
                              <SubMenuItem
                                icon={Warehouse}
                                label="Bodegas"
                                onClick={() => handleSubItemClick("/app/bodegas")}
                                active={isActive("/app/bodegas")}
                              />
                            </>
                          )}

                          {item.id === "compras" && (
                            <>
                              <SubMenuItem
                                icon={Truck}
                                label="Proveedores"
                                onClick={() => handleSubItemClick("/app/proveedores")}
                                active={isActive("/app/proveedores")}
                              />
                              <SubMenuItem
                                icon={ShoppingCart}
                                label="Ordenes Compra"
                                onClick={() => handleSubItemClick("/app/ordenescompra")}
                                active={isActive("/app/ordenescompra")}
                              />
                              <SubMenuItem
                                icon={FileText}
                                label="Remisiones Compra"
                                onClick={() => handleSubItemClick("/app/remisionescompra")}
                                active={isActive("/app/remisionescompra")}
                              />
                            </>
                          )}

                          {item.id === "ventas" && (
                            <>
                              <SubMenuItem
                                icon={Users}
                                label="Clientes"
                                onClick={() => handleSubItemClick("/app/clientes")}
                                active={isActive("/app/clientes")}
                              />
                              <SubMenuItem
                                icon={FileText}
                                label="Cotizaciones"
                                onClick={() => handleSubItemClick("/app/cotizaciones")}
                                active={isActive("/app/cotizaciones")}
                              />
                              <SubMenuItem
                                icon={FileText}
                                label="Ordenes Venta"
                                onClick={() => handleSubItemClick("/app/ordenes")}
                                active={isActive("/app/ordenes")}
                              />
                              <SubMenuItem
                                icon={FileText}
                                label="Remisiones Venta"
                                onClick={() => handleSubItemClick("/app/remisiones")}
                                active={isActive("/app/remisiones")}
                              />
                              <SubMenuItem
                                icon={Settings}
                                label="Pagos"
                                onClick={() => handleSubItemClick("/app/pagos")}
                                active={isActive("/app/pagos")}
                              />
                            </>
                          )}

                          {item.id === "configuracion" && (
                            <>
                              <SubMenuItem
                                icon={Shield}
                                label="Roles"
                                onClick={() => handleSubItemClick("/app/roles")}
                                active={isActive("/app/roles")}
                              />
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logo Inferior GVM */}
          <div className="p-4 flex items-center justify-center">
            <img src={gvmLogo} alt="GVM" className={`${isOpen ? "h-14" : "h-8"} w-auto opacity-70`} />
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}

// Componente auxiliar pequeño
function SubMenuItem({ icon: Icon, label, onClick, active }: any) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 rounded-lg mb-1 text-sm cursor-pointer flex items-center gap-3 ${
        active ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-emerald-100 hover:text-gray-900"
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
