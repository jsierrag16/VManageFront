import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Plus,
  Search,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import type { AppOutletContext } from "@/layouts/MainLayout";
import {
  pagosAbonosService,
  type ClientePagoApi,
  type RemisionSnapshotPagoApi,
  type PagoAbonoApi,
  type FacturaApi,
  type MetodoPagoApi,
  type RemisionPendienteApi,
} from "../services/pagos-abonos.service";

const LIST_PATH = "/app/pagos-abonos";

function today() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function onlyDate(value?: string | null) {
  if (!value) return "-";
  return String(value).split("T")[0];
}

function formatMoney(value?: number | string | null) {
  const numberValue = Number(value ?? 0);

  return `COP$${numberValue.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

  return "Ocurrió un error en la operación";
}

function getRemisionesSnapshotData(
  factura: FacturaApi,
): RemisionSnapshotPagoApi[] {
  const data = factura.remisiones_snapshot_data;

  if (Array.isArray(data)) return data;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function getPagoBodegaIds(factura: FacturaApi) {
  const idsRemisionesVivas = (factura.remision_venta ?? [])
    .map(
      (remision) =>
        remision?.orden_venta?.bodega?.id_bodega ??
        remision?.orden_venta?.id_bodega,
    )
    .filter((id): id is number => Number.isFinite(Number(id)))
    .map(Number);

  const idsSnapshot = getRemisionesSnapshotData(factura)
    .map((remision) => remision.id_bodega)
    .filter((id): id is number => Number.isFinite(Number(id)))
    .map(Number);

  const idBodegaDirecta = Number(factura.id_bodega ?? 0);

  return Array.from(
    new Set([
      ...idsRemisionesVivas,
      ...idsSnapshot,
      ...(idBodegaDirecta > 0 ? [idBodegaDirecta] : []),
    ]),
  );
}

function getRemisionesDetallePago(factura: FacturaApi) {
  const remisionesVivas = factura.remision_venta ?? [];

  if (remisionesVivas.length > 0) {
    return remisionesVivas.map((remision) => ({
      id: remision.id_remision_venta,
      codigoRemision:
        remision.codigo_remision_venta ??
        `RV-${String(remision.id_remision_venta).padStart(4, "0")}`,
      codigoOrden:
        remision.orden_venta?.codigo_orden_venta ??
        (remision.orden_venta?.id_orden_venta
          ? `OV-${String(remision.orden_venta.id_orden_venta).padStart(4, "0")}`
          : "-"),
      fecha: remision.fecha_creacion,
      fechaVencimiento: remision.fecha_vencimiento,
      bodega: remision.orden_venta?.bodega?.nombre_bodega ?? "-",
      estado: remision.estado_remision_venta?.nombre_estado ?? "-",
      total: remision.resumen?.total ?? 0,
    }));
  }

  return getRemisionesSnapshotData(factura).map((remision) => ({
    id: remision.id_remision_venta,
    codigoRemision:
      remision.codigo_remision_venta ??
      `RV-${String(remision.id_remision_venta).padStart(4, "0")}`,
    codigoOrden:
      remision.codigo_orden_venta ??
      (remision.id_orden_venta
        ? `OV-${String(remision.id_orden_venta).padStart(4, "0")}`
        : "-"),
    fecha: remision.fecha_creacion,
    fechaVencimiento: remision.fecha_vencimiento,
    bodega: remision.nombre_bodega ?? "-",
    estado: remision.estado_remision ?? "-",
    total: remision.total ?? 0,
  }));
}

function facturaMatchesBodega(
  factura: FacturaApi,
  selectedBodegaId?: number | null,
) {
  if (!selectedBodegaId || selectedBodegaId <= 0) {
    return true;
  }

  return getPagoBodegaIds(factura).includes(Number(selectedBodegaId));
}

function getEstadoFacturaLabel(factura: FacturaApi) {
  return factura.estado_factura?.nombre_estado_factura ?? "Pendiente";
}

function getEstadoFacturaBadge(estado?: string | null) {
  const normalized = normalizeText(estado);

  if (normalized.includes("pagad")) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (
    normalized.includes("abonad") ||
    normalized.includes("parcial") ||
    normalized.includes("abono")
  ) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (normalized.includes("anulad")) {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function getFacturaTotal(factura: FacturaApi) {
  return Number(factura.resumen_pago?.total_factura ?? factura.total ?? 0);
}

function getFacturaAbonado(factura: FacturaApi) {
  return Number(factura.resumen_pago?.total_abonado ?? 0);
}

function getFacturaSaldo(factura: FacturaApi) {
  return Number(factura.resumen_pago?.saldo_pendiente ?? 0);
}

function getPagoRemisiones(factura: FacturaApi) {
  const remisionesVivas = factura.remision_venta
    ?.map((remision) => remision.codigo_remision_venta)
    .filter(Boolean)
    .join(", ");

  if (remisionesVivas) return remisionesVivas;

  const remisionesSnapshot = getRemisionesSnapshotData(factura)
    .map((remision) => remision.codigo_remision_venta)
    .filter(Boolean)
    .join(", ");

  return remisionesSnapshot || factura.remisiones_snapshot || "-";
}

function getPagoBodegasLabel(factura: FacturaApi) {
  const bodegasVivas = (factura.remision_venta ?? [])
    .map((remision) => remision.orden_venta?.bodega?.nombre_bodega)
    .filter(Boolean);

  const bodegasSnapshot = getRemisionesSnapshotData(factura)
    .map((remision) => remision.nombre_bodega)
    .filter(Boolean);

  const bodegas = Array.from(
    new Set([
      ...bodegasVivas,
      ...bodegasSnapshot,
      factura.bodega?.nombre_bodega,
      factura.bodega_snapshot,
    ].filter(Boolean)),
  );

  return bodegas.length > 0 ? bodegas.join(", ") : "Sin bodega";
}

function getPagoBodega(factura: FacturaApi) {
  return getPagoBodegasLabel(factura);
}

function getUsuarioNombre(
  usuario?: { nombre?: string | null; apellido?: string | null } | null,
) {
  const nombre = `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();
  return nombre || "—";
}

function isFacturaAnulada(factura?: FacturaApi | null) {
  return normalizeText(getEstadoFacturaLabel(factura as FacturaApi)).includes(
    "anulad",
  );
}

function hasAbonosActivos(factura?: FacturaApi | null) {
  return (factura?.pagos_abonos ?? []).some((abono) => abono.estado);
}

function formatFechaVisual(fecha?: string | null) {
  if (!fecha) return "Sin fecha";

  const [year, month, day] = fecha.split("-");

  if (!year || !month || !day) return fecha;

  return `${Number(day)}/${Number(month)}/${year}`;
}

export default function PagosAbonos() {
  const { selectedBodegaId, selectedBodegaNombre } =
    useOutletContext<AppOutletContext>();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { tienePermiso } = useAuth();
  const canAnularPagos = tienePermiso("ventas", "pagos", "anular");

  const isCrear = location.pathname.endsWith("/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isAbonar = location.pathname.endsWith("/abonar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = () => navigate(LIST_PATH);

  const [loading, setLoading] = useState(false);
  const [loadingRemisiones, setLoadingRemisiones] = useState(false);
  const [savingFactura, setSavingFactura] = useState(false);
  const [savingAbono, setSavingAbono] = useState(false);
  const [savingAnulacion, setSavingAnulacion] = useState(false);
  const [abonoAAnular, setAbonoAAnular] = useState<PagoAbonoApi | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPagos, setExpandedPagos] = useState<Record<number, boolean>>({});
  const itemsPerPage = 10;

  const [facturas, setFacturas] = useState<FacturaApi[]>([]);
  const [clientes, setClientes] = useState<ClientePagoApi[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPagoApi[]>([]);
  const [remisionesPendientes, setRemisionesPendientes] = useState<
    RemisionPendienteApi[]
  >([]);

  const [createForm, setCreateForm] = useState({
    idCliente: "",
    idRemisiones: [] as number[],
    fechaFactura: today(),
    fechaVencimiento: "",
    nota: "",
  });

  const [abonoForm, setAbonoForm] = useState({
    fechaPago: today(),
    idMetodo: "",
    valor: "",
  });

  const loadInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const [facturasRes, clientesRes, catalogosRes] = await Promise.all([
        pagosAbonosService.getFacturas(selectedBodegaId ?? undefined),
        pagosAbonosService.getClientesConRemisionesPendientes(
          selectedBodegaId ?? undefined,
        ),
        pagosAbonosService.getCatalogos(),
      ]);

      setFacturas(Array.isArray(facturasRes) ? facturasRes : []);
      setClientes(Array.isArray(clientesRes) ? clientesRes : []);
      setMetodosPago(Array.isArray(catalogosRes?.metodos_pago) ? catalogosRes.metodos_pago : []);

      setAbonoForm((prev) => ({
        ...prev,
        idMetodo:
          prev.idMetodo ||
          String(catalogosRes?.metodos_pago?.[0]?.id_metodo ?? ""),
      }));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [selectedBodegaId]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const facturaSeleccionada = useMemo(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return facturas.find((factura) => factura.id_factura === id) ?? null;
  }, [facturas, params.id]);

  useEffect(() => {
    if (!isVer && !isAbonar && !isAnular) return;
    if (!params.id) return;

    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      closeToList();
      return;
    }

    if (!loading && facturas.length > 0 && !facturaSeleccionada) {
      closeToList();
    }
  }, [
    isVer,
    isAbonar,
    isAnular,
    params.id,
    facturaSeleccionada,
    loading,
    facturas.length,
  ]);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((factura) => {
      if (!facturaMatchesBodega(factura, selectedBodegaId)) return false;

      if (!searchTerm.trim()) return true;

      const q = normalizeText(searchTerm);

      const remisionesText = getPagoRemisiones(factura);
      const bodegasText = getPagoBodegasLabel(factura);

      return (
        normalizeText(factura.codigo_factura).includes(q) ||
        normalizeText(factura.cliente?.nombre_cliente).includes(q) ||
        normalizeText(remisionesText).includes(q) ||
        normalizeText(bodegasText).includes(q) ||
        normalizeText(getEstadoFacturaLabel(factura)).includes(q)
      );
    });
  }, [facturas, selectedBodegaId, searchTerm]);

  const stats = useMemo(() => {
    const visibles = facturasFiltradas;

    return {
      totalFacturas: visibles.length,
      totalFacturado: visibles.reduce(
        (acc, factura) => acc + getFacturaTotal(factura),
        0,
      ),
      totalAbonado: visibles.reduce(
        (acc, factura) => acc + getFacturaAbonado(factura),
        0,
      ),
      saldoPendiente: visibles.reduce(
        (acc, factura) => acc + getFacturaSaldo(factura),
        0,
      ),
    };
  }, [facturasFiltradas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaNombre]);

  const totalPages = Math.max(
    1,
    Math.ceil(facturasFiltradas.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFacturas = facturasFiltradas.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const totalSeleccionado = useMemo(() => {
    return remisionesPendientes
      .filter((remision) =>
        createForm.idRemisiones.includes(remision.id_remision_venta),
      )
      .reduce((acc, remision) => acc + Number(remision.resumen?.total ?? 0), 0);
  }, [remisionesPendientes, createForm.idRemisiones]);

  const resetCreateForm = () => {
    setCreateForm({
      idCliente: "",
      idRemisiones: [],
      fechaFactura: today(),
      fechaVencimiento: "",
      nota: "",
    });
    setRemisionesPendientes([]);
  };

  const resetAbonoForm = () => {
    setAbonoForm((prev) => ({
      fechaPago: today(),
      idMetodo: prev.idMetodo || String(metodosPago[0]?.id_metodo ?? ""),
      valor: "",
    }));
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    navigate(`${LIST_PATH}/crear`);
  };

  const handleOpenView = (factura: FacturaApi) => {
    navigate(`${LIST_PATH}/${factura.id_factura}/ver`);
  };

  const handleOpenAbono = (factura: FacturaApi) => {
    resetAbonoForm();
    navigate(`${LIST_PATH}/${factura.id_factura}/abonar`);
  };

  const handleOpenAnularFactura = (factura: FacturaApi) => {
    navigate(`${LIST_PATH}/${factura.id_factura}/anular`);
  };

  const handleOpenAnularAbono = (abono: PagoAbonoApi) => {
    setAbonoAAnular(abono);
  };

  const handleConfirmarAnularAbono = async () => {
    if (!abonoAAnular) return;

    if (!canAnularPagos) {
      toast.error("No tienes permiso para anular abonos");
      return;
    }

    setSavingAnulacion(true);

    try {
      await pagosAbonosService.anularAbono(abonoAAnular.id_pago);

      toast.success("Abono anulado correctamente");

      setAbonoAAnular(null);

      await loadInitialData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingAnulacion(false);
    }
  };

  const handleClienteChange = async (value: string) => {
    setCreateForm((prev) => ({
      ...prev,
      idCliente: value,
      idRemisiones: [],
    }));

    if (!value) {
      setRemisionesPendientes([]);
      return;
    }

    setLoadingRemisiones(true);

    try {
      const remisiones = await pagosAbonosService.getRemisionesPendientesByCliente(
        Number(value),
        selectedBodegaId ?? undefined,
      );

      setRemisionesPendientes(Array.isArray(remisiones) ? remisiones : []);
    } catch (error) {
      setRemisionesPendientes([]);
      toast.error(extractErrorMessage(error));
    } finally {
      setLoadingRemisiones(false);
    }
  };

  const toggleRemision = (idRemision: number) => {
    setCreateForm((prev) => {
      const alreadySelected = prev.idRemisiones.includes(idRemision);

      return {
        ...prev,
        idRemisiones: alreadySelected
          ? prev.idRemisiones.filter((id) => id !== idRemision)
          : [...prev.idRemisiones, idRemision],
      };
    });
  };

  const handleCreateFactura = async () => {
    if (!createForm.idCliente) {
      toast.error("Debes seleccionar un cliente");
      return;
    }

    if (createForm.idRemisiones.length === 0) {
      toast.error("Debes seleccionar al menos una remisión");
      return;
    }

    if (!createForm.fechaVencimiento) {
      toast.error("La fecha de vencimiento es obligatoria");
      return;
    }

    setSavingFactura(true);

    try {
      await pagosAbonosService.createFactura({
        id_cliente: Number(createForm.idCliente),
        id_remisiones: createForm.idRemisiones,
        fecha_factura: createForm.fechaFactura,
        fecha_vencimiento: createForm.fechaVencimiento,
        nota: createForm.nota.trim() || undefined,
      });

      toast.success("Pago creado correctamente");
      resetCreateForm();
      closeToList();
      await loadInitialData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingFactura(false);
    }
  };

  const handleRegistrarAbono = async () => {
    if (!facturaSeleccionada) return;

    const valor = Number(abonoForm.valor);

    if (!abonoForm.idMetodo) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Debes ingresar un valor de abono válido");
      return;
    }

    if (valor > getFacturaSaldo(facturaSeleccionada)) {
      toast.error("El abono no puede superar el saldo pendiente");
      return;
    }

    setSavingAbono(true);

    try {
      await pagosAbonosService.addAbono(facturaSeleccionada.id_factura, {
        fecha_pago: abonoForm.fechaPago,
        valor,
        id_metodo: Number(abonoForm.idMetodo),
      });

      toast.success("Abono registrado correctamente");
      resetAbonoForm();
      closeToList();
      await loadInitialData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingAbono(false);
    }
  };

  const handleAnularPago = async () => {
    if (!facturaSeleccionada) return;

    if (!canAnularPagos) {
      toast.error("No tienes permiso para anular facturas");
      return;
    }

    if (hasAbonosActivos(facturaSeleccionada)) {
      toast.error(
        "No puedes anular una factura con abonos activos. Primero anula los abonos registrados.",
      );
      return;
    }

    setSavingAnulacion(true);

    try {
      await pagosAbonosService.anularFactura(facturaSeleccionada.id_factura);
      toast.success("Factura anulada correctamente");
      closeToList();
      await loadInitialData();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSavingAnulacion(false);
    }
  };

  const togglePagoDetalle = (idFactura: number) => {
    setExpandedPagos((prev) => ({
      ...prev,
      [idFactura]: !prev[idFactura],
    }));
  };

  const clienteSeleccionado = useMemo(
    () =>
      clientes.find(
        (cliente) => String(cliente.id_cliente) === String(createForm.idCliente),
      ) ?? null,
    [clientes, createForm.idCliente],
  );

  function getDocumentoCliente(cliente: ClientePagoApi | null) {
    if (!cliente) return "Selecciona un cliente";

    const tipoDocumento =
      cliente.tipo_documento?.nombre_doc ?? "Documento";

    return cliente.num_documento
      ? `${tipoDocumento}: ${cliente.num_documento}`
      : "Sin documento";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Pagos y abonos</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Gestiona los pagos y abonos en
          </p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {selectedBodegaNombre}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Total facturado</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                {formatMoney(stats.totalFacturado)}
              </p>
            </div>
            <TrendingUp className="text-yellow-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total abonado</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                {formatMoney(stats.totalAbonado)}
              </p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Saldo pendiente</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                {formatMoney(stats.saldoPendiente)}
              </p>
            </div>

            <DollarSign className="text-blue-200" size={40} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por pago, cliente, remisión o estado..."
              className="pl-10 w-full"
            />
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus size={18} className="mr-2" />
            Nuevo pago
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>#</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento / NIT</TableHead>
                <TableHead className="text-center">Registro / Fecha</TableHead>
                <TableHead className="text-center">Vencimiento</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
                <TableHead className="w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && currentFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                    No se encontraron pagos y abonos
                  </TableCell>
                </TableRow>
              ) : (
                currentFacturas.map((factura, index) => {
                  const expanded = Boolean(expandedPagos[factura.id_factura]);

                  return (
                    <Fragment key={factura.id_factura}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>{startIndex + index + 1}</TableCell>

                        <TableCell className="font-medium">
                          {factura.codigo_factura}
                        </TableCell>

                        <TableCell>
                          {factura.cliente?.nombre_cliente ?? "Sin cliente"}
                        </TableCell>

                        <TableCell>
                          {factura.cliente?.num_documento
                            ? `NIT: ${factura.cliente.num_documento}`
                            : "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          <span>
                            {getUsuarioNombre(factura.usuario_creador)} - {onlyDate(factura.fecha_factura)}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">{onlyDate(factura.fecha_vencimiento)}</TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-3 h-7 text-sm border ${getEstadoFacturaBadge(
                              getEstadoFacturaLabel(factura),
                            )}`}
                          >
                            {getEstadoFacturaLabel(factura)}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenView(factura)}
                              className="hover:bg-blue-50"
                              title="Ver pago"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAbono(factura)}
                              disabled={getFacturaSaldo(factura) <= 0 || isFacturaAnulada(factura)}
                              className="hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={
                                getFacturaSaldo(factura) <= 0
                                  ? "Pago completado"
                                  : isFacturaAnulada(factura)
                                    ? "Pago anulado"
                                    : "Registrar abono"
                              }
                            >
                              <DollarSign
                                size={16}
                                className={
                                  getFacturaSaldo(factura) <= 0 || isFacturaAnulada(factura)
                                    ? "text-gray-400"
                                    : "text-green-600"
                                }
                              />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAnularFactura(factura)}
                              disabled={
                                !canAnularPagos ||
                                isFacturaAnulada(factura) ||
                                hasAbonosActivos(factura)
                              }
                              className="hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={
                                !canAnularPagos
                                  ? "No tienes permiso para anular"
                                  : isFacturaAnulada(factura)
                                    ? "Pago ya anulado"
                                    : hasAbonosActivos(factura)
                                      ? "Primero debes anular los abonos"
                                      : "Anular pago"
                              }
                            >
                              <Ban
                                size={16}
                                className={
                                  !canAnularPagos ||
                                    isFacturaAnulada(factura) ||
                                    hasAbonosActivos(factura)
                                    ? "text-gray-400"
                                    : "text-red-600"
                                }
                              />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePagoDetalle(factura.id_factura)}
                            className="hover:bg-gray-100"
                            title={expanded ? "Contraer detalle" : "Ver detalle financiero"}
                          >
                            {expanded ? (
                              <ChevronDown size={18} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={18} className="text-gray-600" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow className="bg-gray-50/70">
                          <TableCell colSpan={8} className="p-4">
                            <div className="space-y-4">
                              <div className="rounded-lg border bg-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="font-semibold text-gray-900">Remisiones del pago</p>
                                  <span className="text-xs text-gray-500">
                                    {getRemisionesDetallePago(factura).length} remisión(es)
                                  </span>
                                </div>

                                <div className="rounded-lg border overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gray-50">
                                        <TableHead>Remisión</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                      </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                      {getRemisionesDetallePago(factura).map((remision) => (
                                        <TableRow key={remision.id}>
                                          <TableCell className="font-medium">
                                            {remision.codigoRemision}
                                          </TableCell>

                                          <TableCell className="text-right font-semibold">
                                            {formatMoney(remision.total)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-lg border bg-white p-4">
                                  <p className="text-sm text-gray-500">Total del pago</p>
                                  <p className="text-xl font-semibold">
                                    {formatMoney(getFacturaTotal(factura))}
                                  </p>
                                </div>

                                <div className="rounded-lg border bg-white p-4">
                                  <p className="text-sm text-gray-500">Saldo pendiente</p>
                                  <p
                                    className={`text-xl font-semibold ${getFacturaSaldo(factura) > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                      }`}
                                  >
                                    {formatMoney(getFacturaSaldo(factura))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        {facturasFiltradas.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(startIndex + itemsPerPage, facturasFiltradas.length)} de{" "}
              {facturasFiltradas.length} registros
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8"
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) {
            resetCreateForm();
            closeToList();
          }
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="crear-pago-description"
        >
          <DialogHeader>
            <DialogTitle>Crear pago</DialogTitle>
            <DialogDescription id="crear-pago-description">
              Selecciona un cliente y una o varias remisiones entregadas pendientes por agregar al pago.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="rounded-xl bg-gray-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Información general
                  </h3>
                  <p className="text-sm text-gray-500">
                    Selecciona el cliente, revisa el documento y define la fecha de vencimiento.
                  </p>
                </div>

                <div className="min-w-37.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-center">
                  <p className="text-xs font-medium text-blue-700">Fecha del Pago</p>
                  <p className="text-base font-bold text-blue-900">
                    {formatFechaVisual(createForm.fechaFactura)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={createForm.idCliente || undefined}
                    onValueChange={handleClienteChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>

                    <SelectContent>
                      {clientes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay clientes disponibles
                        </div>
                      ) : (
                        clientes.map((cliente) => (
                          <SelectItem
                            key={cliente.id_cliente}
                            value={String(cliente.id_cliente)}
                          >
                            {cliente.nombre_cliente}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Documento / NIT</Label>
                  <div className="flex h-10 items-center rounded-md border bg-white px-3 text-sm font-medium text-gray-700">
                    {getDocumentoCliente(clienteSeleccionado)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha vencimiento *</Label>
                  <Input
                    type="date"
                    value={createForm.fechaVencimiento}
                    min={createForm.fechaFactura}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bodega del filtro actual</Label>
                  <div className="flex h-10 items-center rounded-md border bg-white px-3 text-sm font-medium text-gray-700">
                    {selectedBodegaNombre || "Todas las bodegas"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Remisiones disponibles *</Label>

                {createForm.idCliente && (
                  <span className="text-xs text-gray-500">
                    {remisionesPendientes.length} remisión(es) disponible(s)
                  </span>
                )}
              </div>

              <div className="rounded-lg border max-h-72 overflow-y-auto bg-white">
                {!createForm.idCliente ? (
                  <div className="p-4 text-sm text-gray-500">
                    Selecciona primero un cliente para consultar sus remisiones pendientes.
                  </div>
                ) : loadingRemisiones ? (
                  <div className="p-4 text-sm text-gray-500">
                    Cargando remisiones pendientes...
                  </div>
                ) : remisionesPendientes.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    Este cliente no tiene remisiones entregadas pendientes por agregar al pago.
                  </div>
                ) : (
                  <div className="divide-y">
                    {remisionesPendientes.map((remision) => {
                      const checked = createForm.idRemisiones.includes(
                        remision.id_remision_venta,
                      );

                      return (
                        <label
                          key={remision.id_remision_venta}
                          className="flex items-start justify-between gap-4 p-4 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                toggleRemision(remision.id_remision_venta)
                              }
                              className="mt-1"
                            />

                            <div className="space-y-1">
                              <p className="font-semibold text-sm">
                                {remision.codigo_remision_venta ??
                                  `RV-${remision.id_remision_venta}`}
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                                <p>
                                  Orden:{" "}
                                  <span className="font-medium text-gray-700">
                                    {remision.orden_venta?.codigo_orden_venta ?? "-"}
                                  </span>
                                </p>

                                <p>
                                  Fecha:{" "}
                                  <span className="font-medium text-gray-700">
                                    {onlyDate(remision.fecha_creacion)}
                                  </span>
                                </p>

                                <p>
                                  Bodega:{" "}
                                  <span className="font-medium text-gray-700">
                                    {remision.orden_venta?.bodega?.nombre_bodega ?? "-"}
                                  </span>
                                </p>

                                <p>
                                  Estado:{" "}
                                  <span className="font-medium text-gray-700">
                                    {remision.estado_remision_venta?.nombre_estado ?? "-"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-green-700 whitespace-nowrap">
                            {formatMoney(remision.resumen?.total ?? 0)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nota</Label>
                <Textarea
                  value={createForm.nota}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      nota: e.target.value,
                    }))
                  }
                  placeholder="Observaciones del pago..."
                  className="min-h-26.25"
                />
              </div>

              <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remisiones seleccionadas</span>
                  <span className="font-semibold">
                    {createForm.idRemisiones.length}
                  </span>
                </div>

                <div className="flex justify-between text-base border-t pt-3">
                  <span className="font-medium text-gray-700">Total del pago</span>
                  <span className="font-bold text-green-700">
                    {formatMoney(totalSeleccionado)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                resetCreateForm();
                closeToList();
              }}
              disabled={savingFactura}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleCreateFactura}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                savingFactura ||
                !createForm.idCliente ||
                createForm.idRemisiones.length === 0 ||
                !createForm.fechaVencimiento
              }
            >
              {savingFactura ? "Guardando..." : "Crear pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="ver-pago-description"
        >
          <DialogHeader>
            <DialogTitle>
              Detalle de pago - {facturaSeleccionada?.codigo_factura ?? ""}
            </DialogTitle>
            <DialogDescription id="ver-pago-description" className="sr-only">
              Detalle completo del pago y de sus abonos.
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">
                    {facturaSeleccionada.cliente?.nombre_cliente ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-md px-3 h-7 text-sm border ${getEstadoFacturaBadge(
                        getEstadoFacturaLabel(facturaSeleccionada),
                      )}`}
                    >
                      {getEstadoFacturaLabel(facturaSeleccionada)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha pago</p>
                  <p className="font-semibold">
                    {onlyDate(facturaSeleccionada.fecha_factura)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha vencimiento</p>
                  <p className="font-semibold">
                    {onlyDate(facturaSeleccionada.fecha_vencimiento)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">
                    {getPagoBodega(facturaSeleccionada)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Remisión</p>
                  <p className="font-semibold">
                    {getPagoRemisiones(facturaSeleccionada)}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total pago</span>
                  <span className="font-bold">
                    {formatMoney(getFacturaTotal(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total abonado</span>
                  <span className="font-semibold text-green-600">
                    {formatMoney(getFacturaAbonado(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="text-gray-600">Saldo pendiente</span>
                  <span className="font-bold text-red-600">
                    {formatMoney(getFacturaSaldo(facturaSeleccionada))}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Remisiones del pago
                </h3>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Remisión</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Fecha remisión</TableHead>
                        <TableHead>Bodega</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {getRemisionesDetallePago(facturaSeleccionada).length > 0 ? (
                        getRemisionesDetallePago(facturaSeleccionada).map((remision) => (
                          <TableRow key={remision.id}>
                            <TableCell className="font-medium">
                              {remision.codigoRemision}
                            </TableCell>

                            <TableCell>{remision.codigoOrden}</TableCell>

                            <TableCell>{onlyDate(remision.fecha)}</TableCell>

                            <TableCell>{remision.bodega}</TableCell>

                            <TableCell className="text-right">
                              {formatMoney(remision.total)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                            No hay remisiones asociadas a este pago
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Abonos registrados</h3>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-center">Abonado / Anulado</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(facturaSeleccionada.pagos_abonos ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                            No hay abonos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        facturaSeleccionada.pagos_abonos.map((abono) => {
                          const estaAnulado = !abono.estado;

                          return (
                            <TableRow key={abono.id_pago}>
                              <TableCell>{onlyDate(abono.fecha_pago)}</TableCell>

                              <TableCell>
                                {abono.metodo_pago?.nombre_metodo ?? "-"}
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm text-gray-700">
                                    {estaAnulado
                                      ? `${getUsuarioNombre(abono.usuario_anulo)} - ${abono.fecha_anulacion
                                        ? onlyDate(abono.fecha_anulacion)
                                        : "Sin fecha de anulación"
                                      }`
                                      : `${getUsuarioNombre(abono.usuario_registro)} - ${onlyDate(
                                        abono.fecha_pago,
                                      )}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`inline-flex items-center rounded-md px-3 h-7 text-sm border ${estaAnulado
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                                    }`}
                                >
                                  {estaAnulado ? "Anulado" : "Abonado"}
                                </span>
                              </TableCell>


                              <TableCell className="text-right font-semibold">
                                {formatMoney(abono.valor)}
                              </TableCell>

                              <TableCell className="text-center">
                                {canAnularPagos && abono.estado ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenAnularAbono(abono)}
                                    disabled={savingAnulacion}
                                    className="hover:bg-red-50"
                                    title="Anular abono"
                                  >
                                    <Ban size={16} className="text-red-600" />
                                  </Button>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {facturaSeleccionada.nota && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Nota</p>
                  <p>{facturaSeleccionada.nota}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAbonar}
        onOpenChange={(open) => {
          if (!open) {
            resetAbonoForm();
            closeToList();
          }
        }}
      >
        <DialogContent
          className="max-w-xl"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="abonar-pago-description"
        >
          <DialogHeader>
            <DialogTitle>
              Registrar abono - {facturaSeleccionada?.codigo_factura ?? ""}
            </DialogTitle>
            <DialogDescription id="abonar-pago-description">
              Registra un abono sobre el pago seleccionado.
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cliente</span>
                  <span className="font-medium">
                    {facturaSeleccionada.cliente?.nombre_cliente ?? "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total pago</span>
                  <span className="font-medium">
                    {formatMoney(getFacturaTotal(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saldo pendiente</span>
                  <span className="font-bold text-red-600">
                    {formatMoney(getFacturaSaldo(facturaSeleccionada))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha del abono *</Label>
                <Input
                  type="date"
                  value={abonoForm.fechaPago}
                  onChange={(e) =>
                    setAbonoForm((prev) => ({
                      ...prev,
                      fechaPago: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Método de pago *</Label>
                <Select
                  value={abonoForm.idMetodo || undefined}
                  onValueChange={(value) =>
                    setAbonoForm((prev) => ({
                      ...prev,
                      idMetodo: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPago.map((metodo) => (
                      <SelectItem
                        key={metodo.id_metodo}
                        value={String(metodo.id_metodo)}
                      >
                        {metodo.nombre_metodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor del abono *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={abonoForm.valor}
                  onChange={(e) =>
                    setAbonoForm((prev) => ({
                      ...prev,
                      valor: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetAbonoForm();
                closeToList();
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleRegistrarAbono}
              className="bg-green-600 hover:bg-green-700"
              disabled={savingAbono}
            >
              {savingAbono ? "Guardando..." : "Registrar abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="anular-factura-description"
        >
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription id="anular-factura-description">
              Esta acción anulará el pago interno y liberará las remisiones asociadas.
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Vas a anular el pago{" "}
                <strong>{facturaSeleccionada.codigo_factura}</strong>.
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente</span>
                  <span className="font-medium">
                    {facturaSeleccionada.cliente?.nombre_cliente ?? "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">
                    {formatMoney(getFacturaTotal(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Abonado activo</span>
                  <span className="font-medium">
                    {formatMoney(getFacturaAbonado(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Estado</span>
                  <Badge
                    variant="outline"
                    className={getEstadoFacturaBadge(
                      getEstadoFacturaLabel(facturaSeleccionada),
                    )}
                  >
                    {getEstadoFacturaLabel(facturaSeleccionada)}
                  </Badge>
                </div>
              </div>

              {hasAbonosActivos(facturaSeleccionada) && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Este pago tiene abonos activos. Primero debes anular los abonos
                  para poder anular el pago.
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró el pago
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeToList}
              disabled={savingAnulacion}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleAnularPago}
              disabled={
                savingAnulacion ||
                !facturaSeleccionada ||
                hasAbonosActivos(facturaSeleccionada) ||
                isFacturaAnulada(facturaSeleccionada)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {savingAnulacion ? "Anulando..." : "Anular factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!abonoAAnular}
        onOpenChange={(open) => {
          if (!open) setAbonoAAnular(null);
        }}
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Anular abono</DialogTitle>
            <DialogDescription>
              Esta acción marcará el abono como anulado y recalculará el saldo del pago.
            </DialogDescription>
          </DialogHeader>

          {abonoAAnular && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Vas a anular este abono. Esta acción no eliminará el registro, solo lo
                dejará marcado como anulado.
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha</span>
                  <span className="font-medium">
                    {onlyDate(abonoAAnular.fecha_pago)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Método</span>
                  <span className="font-medium">
                    {abonoAAnular.metodo_pago?.nombre_metodo ?? "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Valor</span>
                  <span className="font-medium">
                    {formatMoney(abonoAAnular.valor)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAbonoAAnular(null)}
              disabled={savingAnulacion}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmarAnularAbono}
              disabled={savingAnulacion || !abonoAAnular}
              className="bg-red-600 hover:bg-red-700"
            >
              {savingAnulacion ? "Anulando..." : "Anular abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}