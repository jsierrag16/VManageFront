import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  CreditCard,
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
import { Badge } from "../../../shared/components/ui/badge";
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

type MetodoPago = "Efectivo" | "Transferencia" | "Tarjeta" | "Cheque";
type EstadoPago = "Pagado" | "Parcial" | "Pendiente";

/* 👇 DEFINIRLA AQUÍ */
const METODOS_PAGO: MetodoPago[] = [
  "Efectivo",
  "Transferencia",
  "Tarjeta",
  "Cheque",
];

interface Abono {
  fecha: string;
  monto: number;
  metodoPago: MetodoPago;
  usuario: string;
  observaciones: string;
}

interface PagoAbono {
  id: number;
  numeroTransaccion: string;
  remisionAsociada: string;
  cliente: string;
  fecha: string;
  metodoPago: MetodoPago;
  monto: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
  observaciones: string;
  bodega: string;
  abonos?: Abono[];
}

export const pagosAbonosData: PagoAbono[] = [
  {
    id: 1,
    numeroTransaccion: "TRX-001",
    remisionAsociada: "RV-001",
    cliente: "Comercializadora El Campo",
    fecha: "2024-01-15",
    metodoPago: "Transferencia",
    monto: 16950.0,
    saldoPendiente: 0,
    estadoPago: "Pagado",
    observaciones: "Pago completo de remisión",
    bodega: "Bodega Central",
    abonos: [],
  },
  {
    id: 2,
    numeroTransaccion: "TRX-002",
    remisionAsociada: "RV-002",
    cliente: "Distribuidora Las Palmas",
    fecha: "2024-01-14",
    metodoPago: "Efectivo",
    monto: 9605.0,
    saldoPendiente: 4605.0,
    estadoPago: "Parcial",
    observaciones: "Pago parcial con abonos",
    bodega: "Bodega Central",
    abonos: [
      {
        fecha: "2024-01-14",
        monto: 5000.0,
        metodoPago: "Efectivo",
        usuario: "Admin Sistema",
        observaciones: "Primer abono",
      },
    ],
  },
  {
    id: 3,
    numeroTransaccion: "TRX-003",
    remisionAsociada: "RV-003",
    cliente: "Granja Santa Rosa",
    fecha: "2024-01-16",
    metodoPago: "Transferencia",
    monto: 5876.0,
    saldoPendiente: 5876.0,
    estadoPago: "Pendiente",
    observaciones: "Pago pendiente de recibir",
    bodega: "Bodega Norte",
    abonos: [],
  },
  {
    id: 4,
    numeroTransaccion: "TRX-004",
    remisionAsociada: "RV-004",
    cliente: "Comercializadora El Campo",
    fecha: "2024-01-13",
    metodoPago: "Efectivo",
    monto: 13560.0,
    saldoPendiente: 3560.0,
    estadoPago: "Parcial",
    observaciones: "Pago en cuotas",
    bodega: "Bodega Central",
    abonos: [
      {
        fecha: "2024-01-13",
        monto: 5000.0,
        metodoPago: "Efectivo",
        usuario: "Admin Sistema",
        observaciones: "Primera cuota",
      },
      {
        fecha: "2024-01-20",
        monto: 5000.0,
        metodoPago: "Tarjeta",
        usuario: "Admin Sistema",
        observaciones: "Segunda cuota",
      },
    ],
  },
  {
    id: 5,
    numeroTransaccion: "TRX-005",
    remisionAsociada: "RV-005",
    cliente: "Distribuidora ABC",
    fecha: "2024-01-12",
    metodoPago: "Transferencia",
    monto: 2825.0,
    saldoPendiente: 0,
    estadoPago: "Pagado",
    observaciones: "Pago completo",
    bodega: "Bodega Sur",
    abonos: [],
  },
];

interface PagosAbonosProps {
  currentUser?: any;
  selectedBodega: string; // ✅ importante para filtrar
}



export default function PagosAbonos({ currentUser, selectedBodega }: PagosAbonosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [pagosAbonos, setPagosAbonos] = useState<PagoAbono[]>(pagosAbonosData);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoAbono | null>(null);

  const [abonoData, setAbonoData] = useState<{
    monto: number;
    metodoPago: MetodoPago;
    observaciones: string;
  }>({
    monto: 0,
    metodoPago: "Efectivo",
    observaciones: "",
  });

  const getFechaActual = () => new Date().toISOString().split("T")[0];

  // ✅ Filtrar por bodega seleccionada (y luego por búsqueda)
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
          pago.remisionAsociada.toLowerCase().includes(q) ||
          pago.cliente.toLowerCase().includes(q) ||
          pago.estadoPago.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [pagosAbonos, searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagos = filteredPagos.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // ✅ Estadísticas consistentes (recaudado = monto - saldoPendiente)
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

    const saldoPendienteTotal = filtered.reduce((sum, p) => sum + p.saldoPendiente, 0);

    const pendientes = filtered.filter((p) => p.estadoPago === "Pendiente").length;

    return { totalTransacciones, totalRecaudado, saldoPendienteTotal, pendientes };
  }, [pagosAbonos, selectedBodega]);

  const handleAgregarAbono = () => {
    if (!selectedPago) return;

    if (!abonoData.monto || abonoData.monto <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    if (abonoData.monto > selectedPago.saldoPendiente) {
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

    const nuevoSaldo = selectedPago.saldoPendiente - abonoData.monto;
    const nuevoEstado: EstadoPago = nuevoSaldo === 0 ? "Pagado" : "Parcial";

    setPagosAbonos((prev) =>
      prev.map((pago) =>
        pago.id === selectedPago.id
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
    setIsAbonoModalOpen(false);
    setSelectedPago(null);
    setAbonoData({ monto: 0, metodoPago: "Efectivo", observaciones: "" });
  };

  const openViewModal = (pago: PagoAbono) => {
    setSelectedPago(pago);
    setIsViewModalOpen(true);
  };

  const openAbonoModal = (pago: PagoAbono) => {
    setSelectedPago(pago);
    setIsAbonoModalOpen(true);
  };

  const getEstadoBadge = (estado: EstadoPago) => {
    const badges: Record<
      EstadoPago,
      { class: string; icon: typeof Clock }
    > = {
      Pendiente: { class: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      Pagado: { class: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      Parcial: { class: "bg-orange-100 text-orange-800 border-orange-200", icon: TrendingUp },
    };
    return badges[estado];
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Transacciones</p>
              <p className="text-3xl mt-2">{stats.totalTransacciones}</p>
            </div>
            <CreditCard className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Recaudado</p>
              <p className="text-3xl mt-2">
                ${stats.totalRecaudado.toLocaleString("es-CO")}
              </p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Saldo Pendiente</p>
              <p className="text-3xl mt-2">
                ${stats.saldoPendienteTotal.toLocaleString("es-CO")}
              </p>
            </div>
            <DollarSign className="text-red-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendientes</p>
              <p className="text-3xl mt-2">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-200" size={40} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por transacción, remisión, cliente o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
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
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredPagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <CreditCard size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron transacciones</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentPagos.map((pago, index) => {
                  const estadoBadge = getEstadoBadge(pago.estadoPago);
                  const IconEstado = estadoBadge.icon;

                  return (
                    <TableRow key={pago.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{pago.remisionAsociada}</TableCell>
                      <TableCell>{pago.cliente}</TableCell>
                      <TableCell>{new Date(pago.fecha).toLocaleDateString("es-CO")}</TableCell>
                      <TableCell>{pago.metodoPago}</TableCell>
                      <TableCell>
                        ${pago.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={pago.saldoPendiente > 0 ? "text-red-600 font-medium" : ""}>
                        {pago.saldoPendiente > 0
                          ? `$${pago.saldoPendiente.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadge.class}>
                          <IconEstado size={12} className="mr-1" />
                          {pago.estadoPago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(pago)}
                            className="hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>

                          {pago.saldoPendiente > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAbonoModal(pago)}
                              className="hover:bg-green-50"
                              title="Agregar abono"
                            >
                              <DollarSign size={16} className="text-green-600" />
                            </Button>
                          )}
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
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredPagos.length)} de{" "}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
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
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="view-pago-description">
          <DialogHeader>
            <DialogTitle>Detalle de Pago - {selectedPago?.numeroTransaccion}</DialogTitle>
            <DialogDescription id="view-pago-description" className="sr-only">
              Detalles completos del pago y sus abonos
            </DialogDescription>
          </DialogHeader>

          {selectedPago && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Remisión Asociada</p>
                  <p className="font-semibold">{selectedPago.remisionAsociada}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{selectedPago.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">{new Date(selectedPago.fecha).toLocaleDateString("es-CO")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-semibold">{selectedPago.metodoPago}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="outline" className={getEstadoBadge(selectedPago.estadoPago).class}>
                    {selectedPago.estadoPago}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">{selectedPago.bodega}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Monto Total:</span>
                  <span className="font-bold">
                    ${selectedPago.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Total Abonado:</span>
                  <span className="font-semibold text-green-600">
                    ${(selectedPago.monto - selectedPago.saldoPendiente).toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {selectedPago.saldoPendiente > 0 && (
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span className="text-gray-600">Saldo Pendiente:</span>
                    <span className="font-bold text-red-600">
                      ${selectedPago.saldoPendiente.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {selectedPago.abonos && selectedPago.abonos.length > 0 && (
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
                        {selectedPago.abonos.map((abono, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(abono.fecha).toLocaleDateString("es-CO")}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              ${abono.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
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

              {selectedPago.observaciones && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Observaciones</p>
                  <p>{selectedPago.observaciones}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedPago(null);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Abono */}
      <Dialog open={isAbonoModalOpen} onOpenChange={setIsAbonoModalOpen}>
        <DialogContent aria-describedby="abono-description">
          <DialogHeader>
            <DialogTitle>Agregar Abono - {selectedPago?.remisionAsociada}</DialogTitle>
            <DialogDescription id="abono-description">
              Registra un abono para el pago de {selectedPago?.cliente}
            </DialogDescription>
          </DialogHeader>

          {selectedPago && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Monto Total:</span>
                  <span className="font-semibold">
                    ${selectedPago.monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saldo Pendiente:</span>
                  <span className="font-bold text-red-600">
                    ${selectedPago.saldoPendiente.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto-abono">Monto del Abono *</Label>
                <Input
                  id="monto-abono"
                  type="number"
                  step="0.01"
                  max={selectedPago.saldoPendiente}
                  value={abonoData.monto || ""}
                  onChange={(e) =>
                    setAbonoData({ ...abonoData, monto: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo-abono">Método de Pago *</Label>
                <Select
                  value={abonoData.metodoPago}
                  onValueChange={(value: string) =>
                    setAbonoData({ ...abonoData, metodoPago: value as MetodoPago })
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
                  onChange={(e) => setAbonoData({ ...abonoData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAbonoModalOpen(false);
                setAbonoData({ monto: 0, metodoPago: "Efectivo", observaciones: "" });
                setSelectedPago(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAgregarAbono} className="bg-green-600 hover:bg-green-700">
              Registrar Abono
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
