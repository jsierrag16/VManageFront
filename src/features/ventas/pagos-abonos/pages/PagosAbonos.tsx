import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
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
import { clientesService } from "@/features/ventas/clientes/services/clientes.service";
import type { ClienteApi } from "@/features/ventas/clientes/types/clientes.types";
import {
  pagosAbonosService,
  type FacturaApi,
  type MetodoPagoApi,
  type RemisionPendienteApi,
} from "../services/pagos-abonos.service";

const LIST_PATH = "/app/pagos-abonos";

function today() {
  return new Date().toISOString().split("T")[0];
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
  return numberValue.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function getFacturaBodegaIds(factura: FacturaApi) {
  const ids = (factura.remision_venta ?? [])
    .map(
      (remision) =>
        remision?.orden_venta?.bodega?.id_bodega ??
        remision?.orden_venta?.id_bodega,
    )
    .filter((id): id is number => Number.isFinite(Number(id)))
    .map(Number);

  return Array.from(new Set(ids));
}

function getFacturaBodegaNames(factura: FacturaApi) {
  const names = (factura.remision_venta ?? [])
    .map((remision) => remision?.orden_venta?.bodega?.nombre_bodega)
    .filter(Boolean) as string[];

  return Array.from(new Set(names));
}

function getFacturaBodegaLabel(factura: FacturaApi) {
  const names = getFacturaBodegaNames(factura);

  if (names.length === 0) return "Sin bodega";
  if (names.length === 1) return names[0];
  return "Múltiples bodegas";
}

function facturaMatchesBodega(
  factura: FacturaApi,
  selectedBodegaId?: number | null,
) {
  if (!selectedBodegaId || selectedBodegaId <= 0) {
    return true;
  }

  return getFacturaBodegaIds(factura).includes(Number(selectedBodegaId));
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

export default function PagosAbonos() {
  const { selectedBodegaId, selectedBodegaNombre } =
    useOutletContext<AppOutletContext>();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isAbonar = location.pathname.endsWith("/abonar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = () => navigate(LIST_PATH);

  const [loading, setLoading] = useState(false);
  const [loadingRemisiones, setLoadingRemisiones] = useState(false);
  const [savingFactura, setSavingFactura] = useState(false);
  const [savingAbono, setSavingAbono] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [facturas, setFacturas] = useState<FacturaApi[]>([]);
  const [clientes, setClientes] = useState<ClienteApi[]>([]);
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
        clientesService.getAll({ incluirInactivos: false }),
        pagosAbonosService.getCatalogos(),
      ]);

      setFacturas(Array.isArray(facturasRes) ? facturasRes : []);
      setClientes(
        Array.isArray(clientesRes)
          ? clientesRes.filter((cliente) => cliente.estado)
          : [],
      );
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

  useEffect(() => {
    if (!isAnular) return;

    toast.info(
      "La anulación de facturas todavía no está implementada en backend. Ya te dejé conectado crear, listar y abonar.",
    );
    closeToList();
  }, [isAnular]);

  const facturaSeleccionada = useMemo(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return facturas.find((factura) => factura.id_factura === id) ?? null;
  }, [facturas, params.id]);

  useEffect(() => {
    if (!isVer && !isAbonar) return;
    if (!params.id) return;

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      closeToList();
      return;
    }

    if (!loading && facturas.length > 0 && !facturaSeleccionada) {
      closeToList();
    }
  }, [isVer, isAbonar, params.id, facturaSeleccionada, loading, facturas.length]);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((factura) => {
      if (!facturaMatchesBodega(factura, selectedBodegaId)) return false;

      if (!searchTerm.trim()) return true;

      const q = normalizeText(searchTerm);

      const remisionesText = (factura.remision_venta ?? [])
        .map((remision) => remision.codigo_remision_venta ?? "")
        .join(" ");

      return (
        normalizeText(factura.codigo_factura).includes(q) ||
        normalizeText(factura.cliente?.nombre_cliente).includes(q) ||
        normalizeText(remisionesText).includes(q) ||
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

    setSavingFactura(true);

    try {
      await pagosAbonosService.createFactura({
        id_cliente: Number(createForm.idCliente),
        id_remisiones: createForm.idRemisiones,
        fecha_factura: createForm.fechaFactura,
        fecha_vencimiento: createForm.fechaVencimiento || undefined,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Pagos y abonos</h2>
        <p className="text-gray-600 mt-1">
          Gestiona los pagos y abonos
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Total facturado</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                ${formatMoney(stats.totalFacturado)}
              </p>
            </div>
            <TrendingUp className="text-yellow-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total abonado</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                ${formatMoney(stats.totalAbonado)}
              </p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Saldo pendiente</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                ${formatMoney(stats.saldoPendiente)}
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
              placeholder="Buscar por factura, cliente, remisión o estado..."
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
                <TableHead className="w-16">#</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Remisiones</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && currentFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-gray-500">
                    No se encontraron pagos y abonos
                  </TableCell>
                </TableRow>
              ) : (
                currentFacturas.map((factura, index) => (
                  <TableRow key={factura.id_factura} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {factura.codigo_factura}
                    </TableCell>
                    <TableCell>
                      {factura.cliente?.nombre_cliente ?? "Sin cliente"}
                    </TableCell>
                    <TableCell>
                      {(factura.remision_venta ?? [])
                        .map((remision) => remision.codigo_remision_venta)
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </TableCell>
                    <TableCell>{getFacturaBodegaLabel(factura)}</TableCell>
                    <TableCell>{onlyDate(factura.fecha_factura)}</TableCell>
                    <TableCell>${formatMoney(getFacturaTotal(factura))}</TableCell>
                    <TableCell
                      className={
                        getFacturaSaldo(factura) > 0 ? "text-red-600 font-medium" : ""
                      }
                    >
                      ${formatMoney(getFacturaSaldo(factura))}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-3 h-7 text-sm border ${getEstadoFacturaBadge(
                          getEstadoFacturaLabel(factura),
                        )}`}
                      >
                        {getEstadoFacturaLabel(factura)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenView(factura)}
                          className="hover:bg-blue-50"
                          title="Ver detalle"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>

                        {getFacturaSaldo(factura) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAbono(factura)}
                            className="hover:bg-green-50"
                            title="Agregar abono"
                          >
                            <DollarSign size={16} className="text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="crear-pago-description"
        >
          <DialogHeader>
            <DialogTitle>Crear pago</DialogTitle>
            <DialogDescription id="crear-pago-description">
              Selecciona un cliente y luego una o varias remisiones de venta
              aprobadas y pendientes por agregar al pago.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {clientes.map((cliente) => (
                      <SelectItem
                        key={cliente.id_cliente}
                        value={String(cliente.id_cliente)}
                      >
                        {cliente.nombre_cliente} - {cliente.num_documento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha factura *</Label>
                <Input
                  type="date"
                  value={createForm.fechaFactura}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      fechaFactura: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={createForm.fechaVencimiento}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      fechaVencimiento: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                <p className="text-gray-500">Bodega actual</p>
                <p className="font-semibold mt-1">
                  {selectedBodegaNombre || "Todas las bodegas"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remisiones disponibles *</Label>

              <div className="rounded-lg border max-h-72 overflow-y-auto">
                {!createForm.idCliente ? (
                  <div className="p-4 text-sm text-gray-500">
                    Selecciona primero un cliente.
                  </div>
                ) : loadingRemisiones ? (
                  <div className="p-4 text-sm text-gray-500">
                    Cargando remisiones pendientes...
                  </div>
                ) : remisionesPendientes.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    Este cliente no tiene remisiones aprobadas pendientes por
                    agregar.
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
                              <p className="font-medium text-sm">
                                {remision.codigo_remision_venta ??
                                  `RV-${remision.id_remision_venta}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                Orden:{" "}
                                {remision.orden_venta?.codigo_orden_venta ?? "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Fecha: {onlyDate(remision.fecha_creacion)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Estado:{" "}
                                {remision.estado_remision_venta?.nombre_estado ??
                                  "-"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Bodega:{" "}
                                {remision.orden_venta?.bodega?.nombre_bodega ?? "-"}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-green-700 whitespace-nowrap">
                            ${formatMoney(remision.resumen?.total ?? 0)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remisiones seleccionadas</span>
                <span className="font-medium">{createForm.idRemisiones.length}</span>
              </div>

              <div className="flex justify-between text-base border-t pt-2">
                <span className="font-medium text-gray-700">Total a cobrar</span>
                <span className="font-bold text-green-700">
                  ${formatMoney(totalSeleccionado)}
                </span>
              </div>
            </div>

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
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetCreateForm();
                closeToList();
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleCreateFactura}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={savingFactura}
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
              Detalle completo de la factura y de sus abonos.
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
                  <p className="text-sm text-gray-600">Fecha factura</p>
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
                    {getFacturaBodegaLabel(facturaSeleccionada)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-semibold">
                    {facturaSeleccionada.codigo_factura}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total factura</span>
                  <span className="font-bold">
                    ${formatMoney(getFacturaTotal(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total abonado</span>
                  <span className="font-semibold text-green-600">
                    ${formatMoney(getFacturaAbonado(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="text-gray-600">Saldo pendiente</span>
                  <span className="font-bold text-red-600">
                    ${formatMoney(getFacturaSaldo(facturaSeleccionada))}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Remisiones asociadas
                </h3>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Remisión</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Bodega</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(facturaSeleccionada.remision_venta ?? []).map((remision) => (
                        <TableRow key={remision.id_remision_venta}>
                          <TableCell className="font-medium">
                            {remision.codigo_remision_venta ??
                              `RV-${remision.id_remision_venta}`}
                          </TableCell>
                          <TableCell>
                            {remision.orden_venta?.codigo_orden_venta ?? "-"}
                          </TableCell>
                          <TableCell>{onlyDate(remision.fecha_creacion)}</TableCell>
                          <TableCell>
                            {remision.orden_venta?.bodega?.nombre_bodega ?? "-"}
                          </TableCell>
                          <TableCell>
                            {remision.estado_remision_venta?.nombre_estado ?? "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            ${formatMoney(remision.resumen?.total ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))}
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
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(facturaSeleccionada.pagos_abonos ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                            No hay abonos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        facturaSeleccionada.pagos_abonos.map((abono) => (
                          <TableRow key={abono.id_pago}>
                            <TableCell>{onlyDate(abono.fecha_pago)}</TableCell>
                            <TableCell>
                              {abono.metodo_pago?.nombre_metodo ?? "-"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-md px-3 h-7 text-sm border ${abono.estado
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                              >
                                {abono.estado ? "Activo" : "Anulado"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${formatMoney(abono.valor)}
                            </TableCell>
                          </TableRow>
                        ))
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
              Registra un abono sobre la factura seleccionada.
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
                  <span className="text-sm text-gray-600">Total factura</span>
                  <span className="font-medium">
                    ${formatMoney(getFacturaTotal(facturaSeleccionada))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saldo pendiente</span>
                  <span className="font-bold text-red-600">
                    ${formatMoney(getFacturaSaldo(facturaSeleccionada))}
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
    </div>
  );
}