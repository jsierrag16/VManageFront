import { useState, useMemo, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  Search,
  Eye,
  Clock,
  Ban,
  CheckCircle,
  CreditCard,
  Plus,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../shared/components/ui/dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { remisionesVentaData, type RemisionVenta } from "../../../data/remisiones-venta";
import { clientesData, type Cliente } from "../../../data/clientes";

import type { AppOutletContext } from "../../../layouts/MainLayout";
import {
  pagosAbonosData,
  METODOS_PAGO,
  type PagoAbono,
  type Abono,
  type MetodoPago,
  type EstadoPago,
} from "../../../data/pagos";

export default function PagosAbonos() {
  const { selectedBodegaNombre, currentUser } =
    useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isVer = location.pathname.endsWith("/ver");
  const isCrear = location.pathname.endsWith("/crear");
  const isAbonar = location.pathname.endsWith("/abonar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = () => navigate("/app/pagos");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [pagosAbonos, setPagosAbonos] = useState<PagoAbono[]>(pagosAbonosData);
  const [clientes] = useState<Cliente[]>(clientesData);

  const [abonoData, setAbonoData] = useState<{
    monto: number;
    metodoPago: MetodoPago;
    observaciones: string;
  }>({
    monto: 0,
    metodoPago: "Efectivo",
    observaciones: "",
  });

  const [remisionesVenta, setRemisionesVenta] = useState<RemisionVenta[]>(() => {
    const saved = localStorage.getItem("vetmanage_remisiones_venta");
    return saved ? (JSON.parse(saved) as RemisionVenta[]) : remisionesVentaData;
  });

  const [pagoData, setPagoData] = useState<{
    cliente: string;
    remisionesAsociadas: string[];
    metodoPago: MetodoPago;
    monto: number;
    observaciones: string;
  }>({
    cliente: "",
    remisionesAsociadas: [],
    metodoPago: "Efectivo",
    monto: 0,
    observaciones: "",
  });

  const remisionesDisponiblesParaPago = useMemo(() => {
    if (!pagoData.cliente) return [];

    return remisionesVenta.filter((remision) => {
      const esDelCliente = remision.cliente === pagoData.cliente;
      const noFacturada =
        remision.estado !== "Facturada" && remision.estado !== "Anulada";

      const yaTienePago = pagosAbonos.some(
        (pago) =>
          pago.remisionesAsociadas.includes(remision.numeroRemision) &&
          pago.estadoPago !== "Anulado"
      );

      return esDelCliente && noFacturada && !yaTienePago;
    });
  }, [pagoData.cliente, pagosAbonos, remisionesVenta]);

  const pagoSeleccionado = useMemo(() => {
    if (!params.id) return null;
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return pagosAbonos.find((p) => p.id === id) ?? null;
  }, [pagosAbonos, params.id]);

  useEffect(() => {
    const saved = localStorage.getItem("vetmanage_remisiones_venta");
    if (saved) {
      setRemisionesVenta(JSON.parse(saved));
    } else {
      setRemisionesVenta(remisionesVentaData);
    }
  }, [location.pathname]);
  useEffect(() => {
    if (!isVer && !isAbonar && !isAnular) return;

    if (!pagoSeleccionado) {
      closeToList();
    }
  }, [isVer, isAbonar, isAnular, pagoSeleccionado]);

  const getFechaActual = () => new Date().toISOString().split("T")[0];

  const filteredPagos = useMemo(() => {
    let filtered = pagosAbonos;

    if (selectedBodega && selectedBodega !== "Todas las bodegas") {
      filtered = filtered.filter((pago) => pago.bodega === selectedBodega);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pago) =>
          pago.numeroTransaccion.toLowerCase().includes(q) ||
          pago.remisionesAsociadas.some((remision) =>
            remision.toLowerCase().includes(q)
          ) ||
          pago.cliente.toLowerCase().includes(q) ||
          pago.estadoPago.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [pagosAbonos, searchTerm, selectedBodega]);

  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagos = filteredPagos.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  const stats = useMemo(() => {
    let filtered = pagosAbonos;

    if (selectedBodega && selectedBodega !== "Todas las bodegas") {
      filtered = filtered.filter((p) => p.bodega === selectedBodega);
    }

    const totalTransacciones = filtered.length;
    const totalRecaudado = filtered.reduce(
      (sum, p) => sum + (p.monto - p.saldoPendiente),
      0
    );
    const saldoPendienteTotal = filtered.reduce(
      (sum, p) => sum + p.saldoPendiente,
      0
    );
    const pendientes = filtered.filter(
      (p) => p.estadoPago === "Pendiente"
    ).length;

    return {
      totalTransacciones,
      totalRecaudado,
      saldoPendienteTotal,
      pendientes,
    };
  }, [pagosAbonos, selectedBodega]);

  const handleCreate = () => {
    navigate("/app/pagos/crear");
  };

  const handleView = (pago: PagoAbono) => {
    navigate(`/app/pagos/${pago.id}/ver`);
  };

  const handleAbonar = (pago: PagoAbono) => {
    setAbonoData({
      monto: 0,
      metodoPago: "Efectivo",
      observaciones: "",
    });
    navigate(`/app/pagos/${pago.id}/abonar`);
  };

  const handleAnular = (pago: PagoAbono) => {
    navigate(`/app/pagos/${pago.id}/anular`);
  };

  const confirmCreate = () => {
    if (!pagoData.cliente || pagoData.remisionesAsociadas.length === 0) {
      toast.error("Debes seleccionar un cliente y al menos una remisión");
      return;
    }

    if (!pagoData.monto || pagoData.monto <= 0) {
      toast.error("El monto total debe ser válido");
      return;
    }

    const remisionesSeleccionadas = remisionesDisponiblesParaPago.filter((r) =>
      pagoData.remisionesAsociadas.includes(r.numeroRemision)
    );

    if (remisionesSeleccionadas.length === 0) {
      toast.error("Debes seleccionar al menos una remisión válida");
      return;
    }

    const bodegaPago =
      remisionesSeleccionadas.length === 1
        ? remisionesSeleccionadas[0].bodega
        : "Múltiples bodegas";

    const nuevoPago: PagoAbono = {
      id: pagosAbonos.length > 0 ? Math.max(...pagosAbonos.map((p) => p.id)) + 1 : 1,
      numeroTransaccion: `TRX-${String(pagosAbonos.length + 1).padStart(3, "0")}`,
      remisionesAsociadas: remisionesSeleccionadas.map((r) => r.numeroRemision),
      cliente: pagoData.cliente,
      fecha: getFechaActual(),
      metodoPago: pagoData.metodoPago,
      monto: pagoData.monto,
      saldoPendiente: pagoData.monto,
      estadoPago: "Pendiente",
      observaciones: pagoData.observaciones,
      bodega: bodegaPago,
      abonos: [],
    };

    setPagosAbonos((prev) => [...prev, nuevoPago]);

    toast.success("Pago creado exitosamente");
    closeToList();

    setPagoData({
      cliente: "",
      remisionesAsociadas: [],
      metodoPago: "Efectivo",
      monto: 0,
      observaciones: "",
    });
  };

  const confirmAnular = () => {
    if (!pagoSeleccionado) return;

    if (pagoSeleccionado.estadoPago === "Anulado") {
      toast.error("El pago ya está anulado");
      return;
    }

    setPagosAbonos((prev) =>
      prev.map((pago) =>
        pago.id === pagoSeleccionado.id
          ? { ...pago, estadoPago: "Anulado" }
          : pago
      )
    );

    toast.success("Pago anulado exitosamente");
    closeToList();
  };

  const handleToggleRemision = (numeroRemision: string) => {
    setPagoData((prev) => {
      const yaExiste = prev.remisionesAsociadas.includes(numeroRemision);

      const nuevasRemisiones = yaExiste
        ? prev.remisionesAsociadas.filter((r) => r !== numeroRemision)
        : [...prev.remisionesAsociadas, numeroRemision];

      const totalSeleccionado = remisionesDisponiblesParaPago
        .filter((r) => nuevasRemisiones.includes(r.numeroRemision))
        .reduce((sum, r) => sum + r.total, 0);

      return {
        ...prev,
        remisionesAsociadas: nuevasRemisiones,
        monto: totalSeleccionado,
      };
    });
  };

  const handleAgregarAbono = () => {
    if (!pagoSeleccionado) return;

    if (pagoSeleccionado.estadoPago === "Anulado") {
      toast.error("No puedes agregar abonos a un pago anulado");
      return;
    }

    if (!abonoData.monto || abonoData.monto <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    if (abonoData.monto > pagoSeleccionado.saldoPendiente) {
      toast.error("El monto del abono no puede ser mayor al saldo pendiente");
      return;
    }

    const nuevoAbono: Abono = {
      fecha: getFechaActual(),
      monto: abonoData.monto,
      metodoPago: abonoData.metodoPago,
      usuario: currentUser?.nombre || "Admin Sistema",
      observaciones: abonoData.observaciones,
    };

    const nuevoSaldo = pagoSeleccionado.saldoPendiente - abonoData.monto;
    const nuevoEstado: EstadoPago = nuevoSaldo === 0 ? "Pagado" : "Parcial";

    setPagosAbonos((prev) =>
      prev.map((pago) =>
        pago.id === pagoSeleccionado.id
          ? {
            ...pago,
            saldoPendiente: nuevoSaldo,
            estadoPago: nuevoEstado,
            abonos: [...(pago.abonos || []), nuevoAbono],
          }
          : pago
      )
    );

    toast.success("Abono registrado exitosamente");
    closeToList();
    setAbonoData({
      monto: 0,
      metodoPago: "Efectivo",
      observaciones: "",
    });
  };

  const getEstadoBadge = (estado: EstadoPago) => {
    const badges: Record<
      EstadoPago,
      { class: string; icon: typeof Clock }
    > = {
      Pendiente: {
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      Pagado: {
        class: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      Parcial: {
        class: "bg-orange-100 text-orange-800 border-orange-200",
        icon: TrendingUp,
      },
      Anulado: {
        class: "bg-red-100 text-red-800 border-red-200",
        icon: Ban,
      },
    };

    return badges[estado];
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Transacciones</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                {stats.totalTransacciones}
              </p>
            </div>
            <CreditCard className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Recaudado</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                ${stats.totalRecaudado.toLocaleString("es-CO")}
              </p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div className="bg-red-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm text-white">Saldo Pendiente</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                ${stats.saldoPendienteTotal.toLocaleString("es-CO")}
              </p>
            </div>
            <DollarSign className="text-white" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendientes</p>
              <p className="text-3xl mt-2 font-semibold text-white">
                {stats.pendientes}
              </p>
            </div>
            <Clock className="text-yellow-200" size={40} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Buscar por transacción, remisión, cliente o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Remisión Asociada</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Saldo Pendiente</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredPagos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    <CreditCard
                      size={48}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p>No se encontraron transacciones</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentPagos.map((pago, index) => {
                  const estadoBadge = getEstadoBadge(pago.estadoPago);
                  const IconEstado = estadoBadge.icon;

                  return (
                    <TableRow key={pago.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pago.remisionesAsociadas.join(", ")}
                      </TableCell>
                      <TableCell>{pago.cliente}</TableCell>
                      <TableCell>
                        {new Date(pago.fecha).toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell>{pago.metodoPago}</TableCell>
                      <TableCell>
                        $
                        {pago.monto.toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        className={
                          pago.saldoPendiente > 0 ? "text-red-600 font-medium" : ""
                        }
                      >
                        {pago.saldoPendiente > 0
                          ? `$${pago.saldoPendiente.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`inline-flex items-center rounded-md px-3 h-7 text-sm ${estadoBadge.class}`}
                        >
                          <IconEstado size={12} className="mr-1" />
                          {pago.estadoPago}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(pago)}
                            className="hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>

                          {pago.saldoPendiente > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAbonar(pago)}
                              className="hover:bg-green-50"
                              title="Agregar abono"
                            >
                              <DollarSign
                                size={16}
                                className="text-green-600"
                              />
                            </Button>

                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnular(pago)}
                            className="hover:bg-red-50"
                            title="Anular"
                            disabled={pago.estadoPago === "Anulado"}
                          >
                            <Ban size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {filteredPagos.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredPagos.length)} de{" "}
              {filteredPagos.length} transacciones
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Modal Ver Detalle */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          aria-describedby="view-pago-description"
        >
          <DialogHeader>
            <DialogTitle>
              Detalle de Pago - {pagoSeleccionado?.numeroTransaccion}
            </DialogTitle>
            <DialogDescription
              id="view-pago-description"
              className="sr-only"
            >
              Detalles completos del pago y sus abonos
            </DialogDescription>
          </DialogHeader>

          {pagoSeleccionado && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Remisión Asociada</p>
                  <p className="font-semibold">
                    {pagoSeleccionado.remisionesAsociadas.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{pagoSeleccionado.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">
                    {new Date(pagoSeleccionado.fecha).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-semibold">{pagoSeleccionado.metodoPago}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    {(() => {
                      const estado = getEstadoBadge(pagoSeleccionado.estadoPago);
                      const IconEstado = estado.icon;

                      return (
                        <div
                          className={`inline-flex items-center rounded-md px-3 h-7 text-sm ${estado.class}`}
                        >
                          <IconEstado size={12} className="mr-1" />
                          {pagoSeleccionado.estadoPago}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">{pagoSeleccionado.bodega}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Monto Total:</span>
                  <span className="font-bold">
                    $
                    {pagoSeleccionado.monto.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total Abonado:</span>
                  <span className="font-semibold text-green-600">
                    $
                    {(pagoSeleccionado.monto - pagoSeleccionado.saldoPendiente).toLocaleString(
                      "es-CO",
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                {pagoSeleccionado.saldoPendiente > 0 && (
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span className="text-gray-600">Saldo Pendiente:</span>
                    <span className="font-bold text-red-600">
                      $
                      {pagoSeleccionado.saldoPendiente.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {pagoSeleccionado.abonos && pagoSeleccionado.abonos.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 border-b">
                    <h3 className="font-semibold">Historial de Abonos</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagoSeleccionado.abonos.map((abono, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(abono.fecha).toLocaleDateString("es-CO")}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              $
                              {abono.monto.toLocaleString("es-CO", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{abono.metodoPago}</TableCell>
                            <TableCell>{abono.usuario}</TableCell>
                            <TableCell>{abono.observaciones || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {pagoSeleccionado.observaciones && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Observaciones</p>
                  <p>{pagoSeleccionado.observaciones}</p>
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

      {/* Modal Crear Pago */}

      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) {
            setPagoData({
              cliente: "",
              remisionesAsociadas: [],
              metodoPago: "Efectivo",
              monto: 0,
              observaciones: "",
            });
            closeToList();
          }
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-3xl"
          aria-describedby="crear-pago-description"
        >
          <DialogHeader>
            <DialogTitle>Crear pago</DialogTitle>
            <DialogDescription id="crear-pago-description">
              Selecciona un cliente y una o varias remisiones pendientes para generar la cuenta por cobrar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente-pago">Cliente *</Label>
              <Select
                value={pagoData.cliente}
                onValueChange={(value: string) =>
                  setPagoData({
                    ...pagoData,
                    cliente: value,
                    remisionesAsociadas: [],
                    monto: 0,
                  })
                }
              >
                <SelectTrigger id="cliente-pago">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remisiones pendientes *</Label>

              <div className="rounded-lg border max-h-64 overflow-y-auto">
                {!pagoData.cliente ? (
                  <div className="p-4 text-sm text-gray-500">
                    Selecciona primero un cliente.
                  </div>
                ) : remisionesDisponiblesParaPago.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No hay remisiones pendientes disponibles para este cliente.
                  </div>
                ) : (
                  <div className="divide-y">
                    {remisionesDisponiblesParaPago.map((remision) => {
                      const checked = pagoData.remisionesAsociadas.includes(
                        remision.numeroRemision
                      );

                      return (
                        <label
                          key={remision.id}
                          className="flex items-start justify-between gap-4 p-4 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleToggleRemision(remision.numeroRemision)
                              }
                              className="mt-1 h-4 w-4 rounded border-gray-300"
                            />

                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {remision.numeroRemision}
                              </p>
                              <p className="text-xs text-gray-500">
                                Fecha:{" "}
                                {new Date(remision.fecha).toLocaleDateString("es-CO")}
                              </p>
                              <p className="text-xs text-gray-500">
                                Bodega: {remision.bodega}
                              </p>
                              <p className="text-xs text-gray-500">
                                Estado: {remision.estado}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-green-700 whitespace-nowrap">
                            $
                            {remision.total.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {pagoData.remisionesAsociadas.length > 0 && (
              <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{pagoData.cliente}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remisiones seleccionadas:</span>
                  <span className="font-medium">
                    {pagoData.remisionesAsociadas.length}
                  </span>
                </div>

                <div className="flex justify-between text-base border-t pt-2">
                  <span className="text-gray-700 font-medium">Total a cobrar:</span>
                  <span className="font-bold text-green-700">
                    $
                    {pagoData.monto.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metodo-pago">Método de pago *</Label>
                <Select
                  value={pagoData.metodoPago}
                  onValueChange={(value: string) =>
                    setPagoData({
                      ...pagoData,
                      metodoPago: value as MetodoPago,
                    })
                  }
                >
                  <SelectTrigger id="metodo-pago">
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((metodo) => (
                      <SelectItem key={metodo} value={metodo}>
                        {metodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto-pago">Monto total</Label>
                <Input
                  id="monto-pago"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pagoData.monto || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones-pago">Observaciones</Label>
              <Input
                id="observaciones-pago"
                value={pagoData.observaciones}
                onChange={(e) =>
                  setPagoData({
                    ...pagoData,
                    observaciones: e.target.value,
                  })
                }
                placeholder="Notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPagoData({
                  cliente: "",
                  remisionesAsociadas: [],
                  metodoPago: "Efectivo",
                  monto: 0,
                  observaciones: "",
                });
                closeToList();
              }}
            >
              Cancelar
            </Button>

            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Abono */}
      <Dialog
        open={isAbonar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="abono-description">
          <DialogHeader>
            <DialogTitle>
              Agregar Abono - {pagoSeleccionado?.remisionesAsociadas.join(", ")}
            </DialogTitle>
            <DialogDescription id="abono-description">
              Registra un abono para el pago de {pagoSeleccionado?.cliente}
            </DialogDescription>
          </DialogHeader>

          {pagoSeleccionado && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Monto Total:</span>
                  <span className="font-semibold">
                    $
                    {pagoSeleccionado.monto.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saldo Pendiente:</span>
                  <span className="font-bold text-red-600">
                    $
                    {pagoSeleccionado.saldoPendiente.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto-abono">Monto del Abono *</Label>
                <Input
                  id="monto-abono"
                  type="number"
                  step="0.01"
                  max={pagoSeleccionado.saldoPendiente}
                  value={abonoData.monto || ""}
                  onChange={(e) =>
                    setAbonoData({
                      ...abonoData,
                      monto: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo-abono">Método de Pago *</Label>
                <Select
                  value={abonoData.metodoPago}
                  onValueChange={(value: string) =>
                    setAbonoData({
                      ...abonoData,
                      metodoPago: value as MetodoPago,
                    })
                  }
                >
                  <SelectTrigger id="metodo-abono">
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((metodo) => (
                      <SelectItem key={metodo} value={metodo}>
                        {metodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones-abono">Observaciones</Label>
                <Input
                  id="observaciones-abono"
                  value={abonoData.observaciones}
                  onChange={(e) =>
                    setAbonoData({
                      ...abonoData,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAbonoData({
                  monto: 0,
                  metodoPago: "Efectivo",
                  observaciones: "",
                });
                closeToList();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAgregarAbono}
              className="bg-green-600 hover:bg-green-700"
            >
              Registrar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Anular Pago */}

      <Dialog
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="anular-pago-description"
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription id="anular-pago-description">
              Esta acción marcará el pago como anulado y no podrá seguir recibiendo abonos.
            </DialogDescription>
          </DialogHeader>

          {pagoSeleccionado && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transacción:</span>
                  <span className="font-medium">
                    {pagoSeleccionado.numeroTransaccion}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{pagoSeleccionado.cliente}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remisiones:</span>
                  <span className="font-medium text-right">
                    {pagoSeleccionado.remisionesAsociadas.join(", ")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-medium">
                    $
                    {pagoSeleccionado.monto.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saldo pendiente:</span>
                  <span className="font-medium text-red-600">
                    $
                    {pagoSeleccionado.saldoPendiente.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estado actual:</span>
                  <span className="font-medium">{pagoSeleccionado.estadoPago}</span>
                </div>
              </div>

              {pagoSeleccionado.estadoPago === "Anulado" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Este pago ya se encuentra anulado.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>

            <Button
              onClick={confirmAnular}
              className="bg-red-600 hover:bg-red-700"
              disabled={pagoSeleccionado?.estadoPago === "Anulado"}
            >
              Anular pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
