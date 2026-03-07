import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../../shared/context/AuthContext";
import { bodegasData } from "../../../data/bodegas";

// Componentes
import { StatsCard } from "../components/StatsCard";
import { ordenesData } from "../../../data/ordenes";

// Contextos y Datos
import { useTraslados } from "../../../shared/context/TrasladosContext";
import { useProductos } from "../../../shared/context/ProductosContext";
import { clientesData } from "../../../data/clientes";


export default function Dashboard() {
  const { selectedBodegaId } = useAuth();

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
        </div>
      )}
    </motion.div>
  );
}
