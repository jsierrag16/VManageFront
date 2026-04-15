import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Building2,
  FileText,
  Package,
  Receipt,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { AppOutletContext } from "@/layouts/MainLayout";
import { useAuth } from "@/shared/context/AuthContext";
import {
  dashboardService,
  type DashboardRankingResponse,
  type DashboardResumenResponse,
  type DashboardSeriesResponse,
} from "../services/dashboard.service";

function formatMoney(value?: number | string | null) {
  const numberValue = Number(value ?? 0);

  return numberValue.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatNumber(value?: number | string | null) {
  const numberValue = Number(value ?? 0);

  return numberValue.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractErrorMessage(error: any) {
  if (typeof error?.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (Array.isArray(error?.response?.data?.message)) {
    return error.response.data.message.join(", ");
  }

  if (typeof error?.response?.data?.error === "string") {
    return error.response.data.error;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "No se pudo cargar el dashboard";
}

type MainCard = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
};

type ModuleCard = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "yellow" | "purple" | "red" | "orange";
  onClick?: () => void;
};

const toneClasses: Record<ModuleCard["tone"], string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-green-50 text-green-700 border-green-100",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  red: "bg-red-50 text-red-700 border-red-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
};

function MainStatCard({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  onClick,
}: MainCard) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full rounded-2xl p-6 text-left shadow-lg transition-all ${onClick ? "hover:-translate-y-0.5 cursor-pointer" : "cursor-default"
        } ${gradient}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/80">{title}</p>
          <p className="text-3xl mt-2 font-semibold text-white">{value}</p>
          <p className="text-sm mt-3 text-white/80">{description}</p>
        </div>

        <div className="rounded-2xl bg-white/12 p-3">
          <Icon className="text-white" size={26} />
        </div>
      </div>
    </button>
  );
}

function ModuleStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  onClick,
}: ModuleCard) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all ${onClick
        ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        : "cursor-default"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl mt-2 font-semibold text-gray-900">{value}</p>
          <p className="text-sm mt-2 text-gray-600">{description}</p>
        </div>

        <div className={`rounded-xl border p-2 ${toneClasses[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}

function SectionBlock({
  title,
  subtitle,
  cards,
}: {
  title: string;
  subtitle: string;
  cards: ModuleCard[];
}) {
  if (cards.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-gray-900 font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <ModuleStatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded mt-3" />
        <div className="flex gap-3 mt-4">
          <div className="h-16 w-44 bg-gray-100 rounded-xl" />
          <div className="h-16 w-44 bg-gray-100 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl h-40 bg-gray-200 border border-gray-100"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl h-64 bg-gray-100 border border-gray-200"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyChart({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-center text-gray-500">
      <BarChart3 className="h-12 w-12 mb-3 opacity-25" />
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div
            key={`${entry?.dataKey}-${index}`}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-gray-600">{entry?.name}</span>
            <span className="font-medium text-gray-900">
              {formatMoney(entry?.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticChartCard({
  title,
  subtitle,
  children,
  loading = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-gray-900 font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>

      {loading ? (
        <div className="h-80 animate-pulse rounded-xl bg-gray-100 border border-gray-200" />
      ) : (
        children
      )}
    </div>
  );
}

export default function Dashboard() {
  const { selectedBodegaId, selectedBodegaNombre } =
    useOutletContext<AppOutletContext>();

  const { tienePermiso } = useAuth();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const currentMonthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const maxSelectableDate = useMemo(() => formatDateInput(today), [today]);

  const [fechaInicio, setFechaInicio] = useState(
    formatDateInput(currentMonthStart),
  );
  const [fechaFin, setFechaFin] = useState(formatDateInput(today));

  const [resumen, setResumen] = useState<DashboardResumenResponse | null>(null);
  const [series, setSeries] = useState<DashboardSeriesResponse | null>(null);
  const [ventasPorCategoria, setVentasPorCategoria] =
    useState<DashboardRankingResponse | null>(null);
  const [comprasPorProveedor, setComprasPorProveedor] =
    useState<DashboardRankingResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsRefreshing, setChartsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [chartsErrorMessage, setChartsErrorMessage] = useState("");

  const isDateRangeValid = useMemo(() => {
    if (!fechaInicio || !fechaFin) return true;
    return fechaInicio <= fechaFin;
  }, [fechaInicio, fechaFin]);

  const loadResumen = useCallback(
    async (manual = false) => {
      if (!isDateRangeValid) {
        setErrorMessage("La fecha inicial no puede ser mayor que la fecha final.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await dashboardService.getResumen({
          idBodega: selectedBodegaId ?? undefined,
          fechaInicio,
          fechaFin,
        });

        setResumen(response);
      } catch (error) {
        const message = extractErrorMessage(error);
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedBodegaId, fechaInicio, fechaFin, isDateRangeValid],
  );

  const loadCharts = useCallback(
    async (manual = false) => {
      if (!isDateRangeValid) {
        setChartsErrorMessage(
          "La fecha inicial no puede ser mayor que la fecha final.",
        );
        setChartsLoading(false);
        setChartsRefreshing(false);
        return;
      }

      try {
        if (manual) {
          setChartsRefreshing(true);
        } else {
          setChartsLoading(true);
        }

        setChartsErrorMessage("");

        const diffMs =
          new Date(`${fechaFin}T00:00:00`).getTime() -
          new Date(`${fechaInicio}T00:00:00`).getTime();

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        const agrupacion = diffDays <= 45 ? "dia" : "mes";

        const [seriesResponse, ventasCategoriaResponse, comprasProveedorResponse] =
          await Promise.all([
            dashboardService.getSeries({
              idBodega: selectedBodegaId ?? undefined,
              fechaInicio,
              fechaFin,
              agrupacion,
            }),
            dashboardService.getVentasPorCategoria({
              idBodega: selectedBodegaId ?? undefined,
              fechaInicio,
              fechaFin,
            }),
            dashboardService.getComprasPorProveedor({
              idBodega: selectedBodegaId ?? undefined,
              fechaInicio,
              fechaFin,
            }),
          ]);

        setSeries(seriesResponse);
        setVentasPorCategoria(ventasCategoriaResponse);
        setComprasPorProveedor(comprasProveedorResponse);
      } catch (error) {
        const message = extractErrorMessage(error);
        setChartsErrorMessage(message);
        toast.error(message);
      } finally {
        setChartsLoading(false);
        setChartsRefreshing(false);
      }
    },
    [selectedBodegaId, fechaInicio, fechaFin, isDateRangeValid],
  );

  useEffect(() => {
    void loadResumen(false);
  }, [loadResumen]);

  useEffect(() => {
    void loadCharts(false);
  }, [loadCharts]);

  const canVentas = useMemo(
    () =>
      Boolean(
        tienePermiso("ventas", "cotizaciones") ||
        tienePermiso("ventas", "ordenesVenta") ||
        tienePermiso("ventas", "remisionesVenta") ||
        tienePermiso("ventas", "pagos"),
      ),
    [tienePermiso],
  );

  const canCompras = useMemo(
    () =>
      Boolean(
        tienePermiso("compras", "ordenesCompra") ||
        tienePermiso("compras", "remisionesCompra"),
      ),
    [tienePermiso],
  );

  const canInventario = useMemo(
    () =>
      Boolean(
        tienePermiso("existencias", "productos") ||
        tienePermiso("existencias", "traslados"),
      ),
    [tienePermiso],
  );

  const canTerceros = useMemo(
    () =>
      Boolean(
        tienePermiso("ventas", "clientes") ||
        tienePermiso("compras", "proveedores"),
      ),
    [tienePermiso],
  );

  const canCharts = useMemo(
    () => Boolean(canVentas || canCompras),
    [canVentas, canCompras],
  );

  const mainCards = useMemo<MainCard[]>(() => {
    if (!resumen) return [];

    const cards: MainCard[] = [];

    if (canVentas) {
      cards.push({
        title: "Ventas del período",
        value: formatMoney(resumen.ventas.total_mes_actual),
        description: resumen.periodo.etiqueta || "Rango seleccionado",
        icon: BadgeDollarSign,
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
        onClick: tienePermiso("ventas", "pagos")
          ? () => navigate("/app/pagos-abonos")
          : tienePermiso("ventas", "ordenesVenta")
            ? () => navigate("/app/ordenes-venta")
            : undefined,
      });
    }

    if (tienePermiso("ventas", "pagos")) {
      cards.push({
        title: "Saldo pendiente",
        value: formatMoney(resumen.ventas.saldo_pendiente_cobro),
        description: `${formatNumber(
          resumen.ventas.facturas_pendientes_cobro,
        )} facturas pendientes de cobro`,
        icon: ReceiptText,
        gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        onClick: () => navigate("/app/pagos-abonos"),
      });
    }

    if (canCompras) {
      cards.push({
        title: "Compras del período",
        value: formatMoney(resumen.compras.total_mes_actual),
        description: `${formatNumber(
          resumen.compras.ordenes_pendientes,
        )} órdenes de compra pendientes`,
        icon: ShoppingCart,
        gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
        onClick: tienePermiso("compras", "ordenesCompra")
          ? () => navigate("/app/ordenes-compra")
          : undefined,
      });
    }

    if (tienePermiso("existencias", "productos")) {
      cards.push({
        title: "Stock bajo",
        value: formatNumber(resumen.inventario.productos_stock_bajo),
        description: `Productos con stock menor a ${formatNumber(
          resumen.inventario.umbral_stock_bajo,
        )}`,
        icon: AlertTriangle,
        gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
        onClick: () => navigate("/app/productos"),
      });
    }

    return cards.slice(0, 4);
  }, [resumen, canVentas, canCompras, navigate, tienePermiso]);

  const ventasCards = useMemo<ModuleCard[]>(() => {
    if (!resumen || !canVentas) return [];

    const cards: ModuleCard[] = [];

    if (tienePermiso("ventas", "cotizaciones")) {
      cards.push({
        title: "Cotizaciones pendientes",
        value: formatNumber(resumen.ventas.cotizaciones_pendientes),
        description: "Cotizaciones por revisar o convertir",
        icon: FileText,
        tone: "blue",
        onClick: () => navigate("/app/cotizaciones"),
      });
    }

    if (tienePermiso("ventas", "ordenesVenta")) {
      cards.push({
        title: "Órdenes de venta pendientes",
        value: formatNumber(resumen.ventas.ordenes_pendientes),
        description: "Órdenes aún en estado pendiente",
        icon: Receipt,
        tone: "orange",
        onClick: () => navigate("/app/ordenes-venta"),
      });
    }

    if (tienePermiso("ventas", "remisionesVenta")) {
      cards.push({
        title: "Remisiones por facturar",
        value: formatNumber(resumen.ventas.remisiones_pendientes_facturar),
        description: "Pendientes de asociar a una factura",
        icon: ReceiptText,
        tone: "purple",
        onClick: () => navigate("/app/remisiones-venta"),
      });
    }

    if (tienePermiso("ventas", "pagos")) {
      cards.push({
        title: "Facturas pendientes de cobro",
        value: formatNumber(resumen.ventas.facturas_pendientes_cobro),
        description: "Pendientes o abonadas con saldo",
        icon: BadgeDollarSign,
        tone: "green",
        onClick: () => navigate("/app/pagos-abonos"),
      });
    }

    return cards;
  }, [resumen, canVentas, navigate, tienePermiso]);

  const comprasCards = useMemo<ModuleCard[]>(() => {
    if (!resumen || !canCompras) return [];

    const cards: ModuleCard[] = [];

    if (tienePermiso("compras", "ordenesCompra")) {
      cards.push({
        title: "Órdenes de compra pendientes",
        value: formatNumber(resumen.compras.ordenes_pendientes),
        description: "Compras aún por aprobar o procesar",
        icon: ShoppingCart,
        tone: "orange",
        onClick: () => navigate("/app/ordenes-compra"),
      });
    }

    if (tienePermiso("compras", "remisionesCompra")) {
      cards.push({
        title: "Remisiones de compra pendientes",
        value: formatNumber(resumen.compras.remisiones_pendientes),
        description: "Pendientes por aplicar o gestionar",
        icon: ReceiptText,
        tone: "blue",
        onClick: () => navigate("/app/remisiones-compra"),
      });
    }

    if (tienePermiso("compras", "proveedores")) {
      cards.push({
        title: "Proveedores activos",
        value: formatNumber(resumen.terceros.proveedores_activos),
        description: "Proveedores con actividad en las bodegas visibles",
        icon: Truck,
        tone: "green",
        onClick: () => navigate("/app/proveedores"),
      });
    }

    return cards;
  }, [resumen, canCompras, navigate, tienePermiso]);

  const inventarioCards = useMemo<ModuleCard[]>(() => {
    if (!resumen || !canInventario) return [];

    const cards: ModuleCard[] = [];

    if (tienePermiso("existencias", "productos")) {
      cards.push({
        title: "Productos con stock",
        value: formatNumber(resumen.inventario.productos_con_stock),
        description: "Productos con disponibilidad actual",
        icon: Package,
        tone: "blue",
        onClick: () => navigate("/app/productos"),
      });

      cards.push({
        title: "Productos con stock bajo",
        value: formatNumber(resumen.inventario.productos_stock_bajo),
        description: `Stock menor a ${formatNumber(
          resumen.inventario.umbral_stock_bajo,
        )}`,
        icon: AlertTriangle,
        tone: "red",
        onClick: () => navigate("/app/productos"),
      });

      cards.push({
        title: "Lotes por vencer",
        value: formatNumber(resumen.inventario.lotes_por_vencer),
        description: "Con vencimiento dentro de 30 días",
        icon: Boxes,
        tone: "yellow",
        onClick: () => navigate("/app/productos"),
      });
    }

    if (tienePermiso("existencias", "traslados")) {
      cards.push({
        title: "Traslados pendientes",
        value: formatNumber(resumen.logistica.traslados_pendientes),
        description: "Pendientes o enviados entre bodegas",
        icon: ReceiptText,
        tone: "purple",
        onClick: () => navigate("/app/traslados"),
      });
    }

    return cards;
  }, [resumen, canInventario, navigate, tienePermiso]);

  const tercerosCards = useMemo<ModuleCard[]>(() => {
    if (!resumen || !canTerceros) return [];

    const cards: ModuleCard[] = [];

    if (tienePermiso("ventas", "clientes")) {
      cards.push({
        title: "Clientes activos",
        value: formatNumber(resumen.terceros.clientes_activos),
        description: "Clientes con actividad en la bodega filtrada",
        icon: Users,
        tone: "green",
        onClick: () => navigate("/app/clientes"),
      });
    }

    if (tienePermiso("compras", "proveedores")) {
      cards.push({
        title: "Proveedores activos",
        value: formatNumber(resumen.terceros.proveedores_activos),
        description: "Proveedores con compras registradas",
        icon: Truck,
        tone: "blue",
        onClick: () => navigate("/app/proveedores"),
      });
    }

    return cards;
  }, [resumen, canTerceros, navigate, tienePermiso]);

  const quickActions = useMemo(() => {
    const actions = [
      {
        label: "Clientes",
        path: "/app/clientes",
        visible: tienePermiso("ventas", "clientes"),
      },
      {
        label: "Cotizaciones",
        path: "/app/cotizaciones",
        visible: tienePermiso("ventas", "cotizaciones"),
      },
      {
        label: "Órdenes venta",
        path: "/app/ordenes-venta",
        visible: tienePermiso("ventas", "ordenesVenta"),
      },
      {
        label: "Remisiones venta",
        path: "/app/remisiones-venta",
        visible: tienePermiso("ventas", "remisionesVenta"),
      },
      {
        label: "Pagos y abonos",
        path: "/app/pagos-abonos",
        visible: tienePermiso("ventas", "pagos"),
      },
      {
        label: "Órdenes compra",
        path: "/app/ordenes-compra",
        visible: tienePermiso("compras", "ordenesCompra"),
      },
      {
        label: "Remisiones compra",
        path: "/app/remisiones-compra",
        visible: tienePermiso("compras", "remisionesCompra"),
      },
      {
        label: "Productos",
        path: "/app/productos",
        visible: tienePermiso("existencias", "productos"),
      },
      {
        label: "Traslados",
        path: "/app/traslados",
        visible: tienePermiso("existencias", "traslados"),
      },
    ];

    return actions.filter((item) => item.visible);
  }, [tienePermiso]);

  const seriesChartData = useMemo(() => {
    if (!series) return [];

    return series.labels.map((label, index) => ({
      label,
      ventas: series.ventas[index] ?? 0,
      compras: series.compras[index] ?? 0,
    }));
  }, [series]);

  const ventasPorCategoriaChartData = useMemo(() => {
    return ventasPorCategoria?.items ?? [];
  }, [ventasPorCategoria]);

  const comprasPorProveedorChartData = useMemo(() => {
    return comprasPorProveedor?.items ?? [];
  }, [comprasPorProveedor]);

  const handleRefreshDashboard = async () => {
    if (!isDateRangeValid) {
      toast.error("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    try {
      await Promise.all([loadResumen(true), loadCharts(true)]);
      toast.success("Dashboard actualizado");
    } catch {
      //
    }
  };

  if (loading && !resumen) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <h2 className="text-gray-900 text-xl font-semibold">Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Resumen ejecutivo, operativo y analítico del sistema según la
              bodega y el rango de fechas seleccionados.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                <Building2 size={14} className="mr-1" />
                {selectedBodegaNombre ||
                  resumen?.bodega.nombre_bodega ||
                  "Todas las bodegas"}
              </Badge>

              {resumen?.periodo?.fecha_inicio && resumen?.periodo?.fecha_fin ? (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {resumen.periodo.fecha_inicio} al {resumen.periodo.fecha_fin}
                </Badge>
              ) : null}

              {(resumen?.bodega?.total_bodegas ?? 0) > 1 &&
                (!selectedBodegaId || selectedBodegaId <= 0) ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {formatNumber(resumen?.bodega?.total_bodegas ?? 0)} bodegas en
                  vista
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  max={fechaFin && fechaFin < maxSelectableDate ? fechaFin : maxSelectableDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setFechaInicio(value);
                      return;
                    }

                    const maxDate =
                      fechaFin && fechaFin < maxSelectableDate ? fechaFin : maxSelectableDate;

                    if (value <= maxDate) {
                      setFechaInicio(value);
                    }
                  }}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  max={maxSelectableDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setFechaFin(value);
                      return;
                    }

                    if (value <= maxSelectableDate && (!fechaInicio || value >= fechaInicio)) {
                      setFechaFin(value);
                    }
                  }}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefreshDashboard}
              disabled={refreshing || chartsRefreshing}
              className="border-gray-200"
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${refreshing || chartsRefreshing ? "animate-spin" : ""
                  }`}
              />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {!isDateRangeValid ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          <p className="font-medium">Rango de fechas inválido</p>
          <p className="text-sm mt-1">
            La fecha inicial no puede ser mayor que la fecha final.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">No se pudo cargar el dashboard</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadResumen(true)}
            className="border-red-200"
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {mainCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {mainCards.map((card) => (
            <MainStatCard key={card.title} {...card} />
          ))}
        </div>
      ) : null}

      {canCharts ? (
        <>
          {chartsErrorMessage ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">No se pudieron cargar las gráficas</p>
                <p className="text-sm mt-1">{chartsErrorMessage}</p>
              </div>

              <Button
                variant="outline"
                onClick={() => void loadCharts(true)}
                className="border-red-200"
              >
                Reintentar
              </Button>
            </div>
          ) : null}

          <AnalyticChartCard
            title="Evolución de ventas y compras"
            subtitle="Comportamiento comparativo del rango seleccionado."
            loading={chartsLoading}
          >
            {seriesChartData.length === 0 ? (
              <EmptyChart
                title="Sin datos en el rango seleccionado"
                subtitle="No hay ventas ni compras para construir la serie."
              />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      name="Ventas"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="compras"
                      name="Compras"
                      stroke="#F97316"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </AnalyticChartCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnalyticChartCard
              title="Ventas por categoría"
              subtitle="Top categorías de productos vendidas en el rango."
              loading={chartsLoading}
            >
              {ventasPorCategoriaChartData.length === 0 ? (
                <EmptyChart
                  title="Sin ventas por categoría"
                  subtitle="No hay facturación suficiente para agrupar por categoría."
                />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ventasPorCategoriaChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={140}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<MoneyTooltip />} />
                      <Bar
                        dataKey="total"
                        name="Ventas"
                        fill="#2563EB"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </AnalyticChartCard>

            <AnalyticChartCard
              title="Compras por proveedor"
              subtitle="Top proveedores por monto comprado en el rango."
              loading={chartsLoading}
            >
              {comprasPorProveedorChartData.length === 0 ? (
                <EmptyChart
                  title="Sin compras por proveedor"
                  subtitle="No hay compras suficientes para construir el ranking."
                />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comprasPorProveedorChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={140}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<MoneyTooltip />} />
                      <Bar
                        dataKey="total"
                        name="Compras"
                        fill="#F97316"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </AnalyticChartCard>
          </div>
        </>
      ) : null}

      <SectionBlock
        title="Ventas"
        subtitle="Indicadores comerciales y de cartera filtrados por bodega."
        cards={ventasCards}
      />

      <SectionBlock
        title="Compras"
        subtitle="Seguimiento de órdenes y remisiones de compra."
        cards={comprasCards}
      />

      <SectionBlock
        title="Inventario y logística"
        subtitle="Disponibilidad, alertas de stock y movimientos entre bodegas."
        cards={inventarioCards}
      />

      <SectionBlock
        title="Terceros"
        subtitle="Clientes y proveedores activos relacionados con la operación visible."
        cards={tercerosCards}
      />

      {quickActions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-900 font-semibold">Accesos rápidos</h3>
            <p className="text-sm text-gray-600 mt-1">
              Navega rápido a los módulos principales según tus permisos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="border-gray-200"
                onClick={() => navigate(action.path)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}