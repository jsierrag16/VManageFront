import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";

import type { AppOutletContext } from "../../../layouts/MainLayout";
import { useAuth } from "../../../shared/context/AuthContext";
import { bodegasData } from "../../../data/bodegas";

// Componentes
import { StatsCard } from "../components/StatsCard";
import { DashboardCharts } from "../components/DashboardCharts";

// Páginas / Secciones
import Clientes from "../../clientes/pages/Clientes";
import Proveedores from "../../proveedores/pages/Proveedores";
import Existencias from "../../productos/pages/Productos";
import Compras from "../../compras/pages/Compras";
import RemisionesCompra from "../../remisiones/pages/RemisionesCompra";
import Ordenes, { ordenesData } from "../../ordenes/pages/Ordenes";
import Remisiones from "../../remisiones/pages/Remisiones";
import PagosAbonos from "../../pagosAbonos/pages/PagosAbonos";
import Cotizaciones from "../../cotizaciones/pages/Cotizaciones";
import Usuarios from "../../usuarios/pages/Usuarios";
import Roles from "../../roles/pages/Roles";
import Bodegas from "../../bodegas/pages/Bodegas";
import Traslados from "../../traslados/pages/Traslados";
import Perfil from "../../perfil/pages/Perfil";

// Contextos y Datos
import { useTraslados } from "../../../shared/context/TrasladosContext";
import { useProductos } from "../../../shared/context/ProductosContext";
import { clientesData } from "../../../data/clientes";

// Datos de ejemplo para las gráficas
const salesData = [
  { name: "Ene", ventas: 1475000, compras: 850000 },
  { name: "Feb", ventas: 944000, compras: 620000 },
  { name: "Mar", ventas: 2075000, compras: 1180000 },
  { name: "Abr", ventas: 1850000, compras: 1050000 },
  { name: "May", ventas: 2200000, compras: 1300000 },
  { name: "Jun", ventas: 2650000, compras: 1580000 },
  { name: "Jul", ventas: 2890000, compras: 1720000 },
];

export default function Dashboard() {
  const outlet = useOutletContext<AppOutletContext>();
  const { setUsuario, selectedBodegaId } = useAuth();

  const currentUser = outlet.currentUser;
  const onUserUpdate = setUsuario;

  // ✅ Convertimos el ID global a nombre (porque tus datos filtran por nombre)
  const selectedBodegaNombre = useMemo(() => {
    if (selectedBodegaId === 0) return "Todas las bodegas";
    const b = bodegasData.find((x) => x.id === selectedBodegaId);
    return b?.nombre ?? "Todas las bodegas";
  }, [selectedBodegaId]);

  const { traslados } = useTraslados();
  const { productos } = useProductos();

  const [activeSection, setActiveSection] = useState("dashboard");

  const dashboardStats = useMemo(() => {
    const ordenesFiltradas =
      selectedBodegaNombre === "Todas las bodegas"
        ? ordenesData
        : ordenesData.filter((o) => o.bodega === selectedBodegaNombre);

    const clientesFiltrados =
      selectedBodegaNombre === "Todas las bodegas"
        ? clientesData
        : clientesData.filter((c) => c.bodega === selectedBodegaNombre);

    const productosFiltrados = productos
      .map((p: any) => {
        if (selectedBodegaNombre === "Todas las bodegas") {
          return {
            ...p,
            stockTotal: p.lotes.reduce(
              (sum: number, l: any) => sum + l.cantidadDisponible,
              0
            ),
          };
        }

        const lotesBodega = p.lotes.filter(
          (l: any) => l.bodega === selectedBodegaNombre
        );

        return {
          ...p,
          stockTotal: lotesBodega.reduce(
            (sum: number, l: any) => sum + l.cantidadDisponible,
            0
          ),
          lotes: lotesBodega,
        };
      })
      .filter((p: any) => p.stockTotal > 0);

    const trasladosFiltrados =
      selectedBodegaNombre === "Todas las bodegas"
        ? traslados
        : traslados.filter(
            (t: any) =>
              t.bodegaOrigen === selectedBodegaNombre ||
              t.bodegaDestino === selectedBodegaNombre
          );

    const totalVentas = ordenesFiltradas.reduce((sum, o) => sum + o.total, 0);
    const totalClientes = clientesFiltrados.length;
    const totalOrdenes = ordenesFiltradas.length;
    const totalProductos = productosFiltrados.length;
    const ordenesEnProceso = ordenesFiltradas.filter(
      (o) => o.estado === "Procesando"
    ).length;
    const productosStockBajo = productosFiltrados.filter(
      (p: any) => p.stockTotal < 50
    ).length;
    const trasladosPendientes = trasladosFiltrados.filter(
      (t: any) => t.estado === "Enviado"
    ).length;

    return {
      totalVentas: {
        value: new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }).format(totalVentas),
        raw: totalVentas,
        change: "+18.5%",
        isPositive: true,
      },
      totalClientes: {
        value: totalClientes.toString(),
        raw: totalClientes,
        change: "+12.3%",
        isPositive: true,
      },
      totalOrdenes: {
        value: totalOrdenes.toString(),
        raw: totalOrdenes,
        change: "+7.8%",
        isPositive: true,
        enProceso: ordenesEnProceso,
      },
      totalProductos: {
        value: totalProductos.toString(),
        raw: totalProductos,
        change: "+5.2%",
        isPositive: true,
        stockBajo: productosStockBajo,
      },
      traslados: {
        value: trasladosFiltrados.length.toString(),
        raw: trasladosFiltrados.length,
        pendientes: trasladosPendientes,
      },
    };
  }, [selectedBodegaNombre, traslados, productos]);

  const inventoryData = useMemo(() => {
    const categorias: Record<string, number> = {};

    productos.forEach((producto: any) => {
      const stockPorBodega = producto.lotes
        .filter(
          (lote: any) =>
            selectedBodegaNombre === "Todas las bodegas" ||
            lote.bodega === selectedBodegaNombre
        )
        .reduce((sum: number, lote: any) => sum + lote.cantidadDisponible, 0);

      if (!categorias[producto.categoria]) categorias[producto.categoria] = 0;
      categorias[producto.categoria] += stockPorBodega;
    });

    return Object.entries(categorias).map(([name, stock]) => ({ name, stock }));
  }, [selectedBodegaNombre, productos]);

  const revenueData = useMemo(() => {
    return salesData.map((item) => ({
      name: item.name,
      ingresos: item.ventas * 0.35,
    }));
  }, []);

  return (
    <motion.div
      key={activeSection}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">
              Bienvenido al panel de control de VManage
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Bodega seleccionada: <span className="font-medium">{selectedBodegaNombre}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Ventas"
              value={dashboardStats.totalVentas.value}
              change={dashboardStats.totalVentas.change}
              isPositive={dashboardStats.totalVentas.isPositive}
              color="blue"
              onClick={() => {
                setActiveSection("ordenes");
                toast.info("Redirigiendo a Órdenes de Venta");
              }}
            />
            <StatsCard
              title="Clientes"
              value={dashboardStats.totalClientes.value}
              change={dashboardStats.totalClientes.change}
              isPositive={dashboardStats.totalClientes.isPositive}
              color="green"
              onClick={() => {
                setActiveSection("clientes");
                toast.info("Redirigiendo a Clientes");
              }}
            />
            <StatsCard
              title="Órdenes"
              value={dashboardStats.totalOrdenes.value}
              change={dashboardStats.totalOrdenes.change}
              isPositive={dashboardStats.totalOrdenes.isPositive}
              color="orange"
              onClick={() => {
                setActiveSection("ordenes");
                toast.info("Redirigiendo a Órdenes");
              }}
            />
            <StatsCard
              title="Productos"
              value={dashboardStats.totalProductos.value}
              change={dashboardStats.totalProductos.change}
              isPositive={dashboardStats.totalProductos.isPositive}
              color="purple"
              onClick={() => {
                setActiveSection("existencias");
                toast.info("Redirigiendo a Existencias");
              }}
            />
          </div>

          <DashboardCharts
            salesData={salesData}
            inventoryData={inventoryData}
            revenueData={revenueData}
          />
        </div>
      )}

      {activeSection === "existencias" && (
        <Existencias
          selectedBodega={selectedBodegaNombre}
          onNavigateToTraslados={() => setActiveSection("traslados")}
        />
      )}
      {activeSection === "traslados" && <Traslados selectedBodega={selectedBodegaNombre} />}
      {activeSection === "bodegas" && <Bodegas />}
      {activeSection === "proveedores" && <Proveedores selectedBodega={selectedBodegaNombre} />}
      {activeSection === "ordenescompra" && <Compras selectedBodega={selectedBodegaNombre} />}
      {activeSection === "remisionescompra" && <RemisionesCompra selectedBodega={selectedBodegaNombre} />}
      {activeSection === "clientes" && <Clientes selectedBodega={selectedBodegaNombre} />}
      {activeSection === "cotizaciones" && <Cotizaciones selectedBodega={selectedBodegaNombre} />}
      {activeSection === "ordenes" && <Ordenes currentUser={currentUser} selectedBodega={selectedBodegaNombre} />}
      {activeSection === "remisiones" && <Remisiones currentUser={currentUser} selectedBodega={selectedBodegaNombre} />}
      {activeSection === "pagos" && <PagosAbonos currentUser={currentUser} selectedBodega={selectedBodegaNombre} />}
      {activeSection === "roles" && <Roles />}
      {activeSection === "usuarios" && <Usuarios selectedBodega={selectedBodegaNombre} />}
      {activeSection === "perfil" && (
        <Perfil
          currentUser={currentUser}
          onBack={() => setActiveSection("dashboard")}
          onUserUpdate={onUserUpdate}
        />
      )}
    </motion.div>
  );
}
