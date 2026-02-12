import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Users, Truck, Package, ShoppingCart, FileText, Settings,
  ChevronDown, Warehouse, ArrowRightLeft, Shield
} from "lucide-react";

const { pathname } = useLocation();

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
  activeSection: string;
  onNavigate: (section: string) => void;
  onCloseMobile: () => void;
  vManageLogo?: string;
  vManageLogoSmall?: string;
  gvmLogo?: string;
}

export function Sidebar({
  isOpen, isMobileOpen, currentUser, activeSection, onNavigate, onCloseMobile, vManageLogo, vManageLogoSmall, gvmLogo
}: SidebarProps) {
  
  // Estados locales para los submenús
  const [expanded, setExpanded] = useState({
    inventario: false,
    compras: false,
    ventas: false,
    configuracion: false
  });

  const toggleSubmenu = (key: keyof typeof expanded) => {
    setExpanded(prev => {
        // Si queremos cerrar los demás al abrir uno:
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
      // Cerrar todo y navegar
      setExpanded({ inventario: false, compras: false, ventas: false, configuracion: false });
      onNavigate(itemId);
      onCloseMobile();
    }
  };

  const handleSubItemClick = (section: string) => {
    onNavigate(section);
    onCloseMobile();
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
              const isActive = activeSection === item.id;
              // Verificar si el menú está expandido
              const isExpanded = expanded[item.id as keyof typeof expanded];

              return (
                <div key={item.id}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                      isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-emerald-200 hover:text-gray-900"
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

                  {/* Renderizado de Submenús (Ejemplo simplificado, repite lógica para otros) */}
                  {isOpen && hasSubmenu && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4"
                        >
                          {/* Lógica específica de subítems según ID */}
                          {item.id === "inventario" && (
                            <>
                                <SubMenuItem icon={Package} label="Productos" onClick={() => handleSubItemClick("existencias")} active={activeSection === "existencias"} />
                                <SubMenuItem icon={ArrowRightLeft} label="Traslados" onClick={() => handleSubItemClick("traslados")} active={activeSection === "traslados"} />
                                <SubMenuItem icon={Warehouse} label="Bodegas" onClick={() => handleSubItemClick("/app/bodegas")} active={activeSection === "bodegas"} />
                            </>
                          )}
                          {item.id === "compras" && (
                            <>
                                <SubMenuItem icon={Truck} label="Proveedores" onClick={() => handleSubItemClick("proveedores")} active={activeSection === "proveedores"} />
                                <SubMenuItem icon={ShoppingCart} label="Ordenes Compra" onClick={() => handleSubItemClick("ordenescompra")} active={activeSection === "ordenescompra"} />
                                <SubMenuItem icon={FileText} label="Remisiones Compra" onClick={() => handleSubItemClick("remisionescompra")} active={activeSection === "remisionescompra"} />
                            </>
                          )}
                          {item.id === "ventas" && (
                            <>
                                <SubMenuItem icon={Users} label="Clientes" onClick={() => handleSubItemClick("clientes")} active={activeSection === "clientes"} />
                                <SubMenuItem icon={FileText} label="Cotizaciones" onClick={() => handleSubItemClick("cotizaciones")} active={activeSection === "cotizaciones"} />
                                <SubMenuItem icon={FileText} label="Ordenes Venta" onClick={() => handleSubItemClick("ordenes")} active={activeSection === "ordenes"} />
                                <SubMenuItem icon={FileText} label="Remisiones Venta" onClick={() => handleSubItemClick("remisiones")} active={activeSection === "remisiones"} />
                                <SubMenuItem icon={Settings} label="Pagos" onClick={() => handleSubItemClick("pagos")} active={activeSection === "pagos"} />
                            </>
                          )}
                           {item.id === "configuracion" && (
                            <>
                                <SubMenuItem icon={Shield} label="Roles" onClick={() => handleSubItemClick("roles")} active={activeSection === "roles"} />
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
              <img src={gvmLogo} alt="GVM" className={`${isOpen ? 'h-14' : 'h-8'} w-auto opacity-70`} />
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
        <div onClick={onClick} className={`px-4 py-2 rounded-lg mb-1 text-sm cursor-pointer flex items-center gap-3 ${active ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-emerald-100 hover:text-gray-900"}`}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
        </div>
    );
}