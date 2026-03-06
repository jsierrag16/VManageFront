import { useState, useMemo, useEffect, useRef } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  Barcode,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";

import { comprasData } from "../../../data/compras";
import { useProductos } from "../../../shared/context/ProductosContext";
import {
  remisionesCompraData,
  type RemisionCompra,
  type ItemRemisionCompra,
} from "../../../data/remisiones-compra";

import type { AppOutletContext } from "../../../layouts/MainLayout";

export default function RemisionesCompra() {
  const { productos } = useProductos();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // ✅ estados base
  const [searchTerm, setSearchTerm] = useState("");
  const [remisiones, setRemisiones] = useState<RemisionCompra[]>(
    remisionesCompraData
  );

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [remisionParaCambioEstado, setRemisionParaCambioEstado] =
    useState<RemisionCompra | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<"Pendiente" | "Aprobada" | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ router + bodega + flags URL
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/remcompras/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = () => navigate("/app/remcompras");

  // ✅ remisión seleccionada por URL (:id)
  const remisionSeleccionada = useMemo(() => {
    if (!params.id) return null;
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return remisiones.find((r) => r.id === id) ?? null;
  }, [remisiones, params.id]);

  // ✅ si entran a /ver, /editar o /eliminar con id inválido → volver
  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!remisionSeleccionada) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isEliminar, remisionSeleccionada]);

  // ✅ navegación (modales por URL)
  const handleView = (r: RemisionCompra) => {
    navigate(`/app/remcompras/${r.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/remcompras/crear");
  };

  const handleEdit = (r: RemisionCompra) => {
    navigate(`/app/remcompras/${r.id}/editar`);
  };

  const handleDelete = (r: RemisionCompra) => {
    navigate(`/app/remcompras/${r.id}/eliminar`);
  };

  // Form data
  const [formData, setFormData] = useState({
    numeroRemision: "",
    ordenCompra: "",
    proveedor: "",
    fecha: "",
    observaciones: "",
  });

  // Items de la remisión
  const [items, setItems] = useState<ItemRemisionCompra[]>([]);

  // Formulario de item actual
  const [currentProducto, setCurrentProducto] = useState("");
  const [currentNumeroLote, setCurrentNumeroLote] = useState("");
  const [currentCantidad, setCurrentCantidad] = useState("");
  const [currentFechaVencimiento, setCurrentFechaVencimiento] = useState("");

  // Estado para el lector de código de barras
  const [codigoBarras, setCodigoBarras] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // ✅ filtrar por bodega + búsqueda
  const filteredRemisiones = useMemo(() => {
    const porBodega =
      selectedBodega === "Todas las bodegas"
        ? remisiones
        : remisiones.filter((r) => r.bodega === selectedBodega);

    return porBodega.filter(
      (remision) =>
        remision.numeroRemision
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        remision.ordenCompra
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        remision.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        remision.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(remision.items.length).includes(searchTerm)
    );
  }, [remisiones, searchTerm, selectedBodega]);

  // ✅ resetear a página 1 cuando cambia filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // ✅ paginación
  const totalPages = Math.ceil(filteredRemisiones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(startIndex, endIndex);

  // ✅ resetear formulario
  const resetForm = () => {
    setFormData({
      numeroRemision: "",
      ordenCompra: "",
      proveedor: "",
      fecha: "",
      observaciones: "",
    });
    setItems([]);
    setCurrentProducto("");
    setCurrentNumeroLote("");
    setCurrentCantidad("");
    setCurrentFechaVencimiento("");
    setCodigoBarras("");
  };

  // ✅ al entrar a /crear, limpiar el formulario y generar número
  useEffect(() => {
    if (!isCrear) return;

    resetForm();

    const ultimaRemision =
      remisiones.length > 0
        ? remisiones.reduce((max, r) => {
          const num = parseInt(r.numeroRemision.split("-")[1]);
          return num > max ? num : max;
        }, 0)
        : 0;

    const siguienteNumero = ultimaRemision + 1;
    const nuevoNumeroRemision = `RC-${String(siguienteNumero).padStart(3, "0")}`;

    setFormData((prev) => ({
      ...prev,
      numeroRemision: nuevoNumeroRemision,
      fecha: new Date().toISOString().split("T")[0],
    }));
  }, [isCrear, remisiones]);

  // ✅ al entrar a /editar, precargar formulario
  useEffect(() => {
    if (!isEditar) return;
    if (!remisionSeleccionada) return;

    setFormData({
      numeroRemision: remisionSeleccionada.numeroRemision,
      ordenCompra: remisionSeleccionada.ordenCompra,
      proveedor: remisionSeleccionada.proveedor,
      fecha: remisionSeleccionada.fecha,
      observaciones: remisionSeleccionada.observaciones,
    });

    setItems(remisionSeleccionada.items);
    setCurrentProducto("");
    setCurrentNumeroLote("");
    setCurrentCantidad("");
    setCurrentFechaVencimiento("");
    setCodigoBarras("");
  }, [isEditar, remisionSeleccionada]);

  const handleOrdenCompraChange = (numeroOrden: string) => {
    const ordenSeleccionada = comprasData.find(
      (c) => c.numeroOrden === numeroOrden
    );

    if (ordenSeleccionada) {
      setFormData((prev) => ({
        ...prev,
        ordenCompra: numeroOrden,
        proveedor: ordenSeleccionada.proveedor,
      }));
    }
  };

  // ✅ calcular estadísticas
  const stats = useMemo(() => {
    const totalRemisiones = filteredRemisiones.length;
    const pendientes = filteredRemisiones.filter(
      (r) => r.estado === "Pendiente"
    ).length;
    const aprobadas = filteredRemisiones.filter(
      (r) => r.estado === "Aprobada"
    ).length;

    return { totalRemisiones, pendientes, aprobadas };
  }, [filteredRemisiones]);

  const handleAddItem = () => {
    if (
      !currentProducto ||
      !currentNumeroLote ||
      !currentCantidad ||
      !currentFechaVencimiento
    ) {
      toast.error("Por favor completa todos los campos del producto");
      return;
    }

    const cantidad = parseInt(currentCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error("La cantidad debe ser un número positivo");
      return;
    }

    const producto = productos.find((p: any) => p.id === currentProducto);
    if (!producto) {
      toast.error("Producto no encontrado");
      return;
    }

    const nuevoItem: ItemRemisionCompra = {
      producto: currentProducto,
      productoNombre: producto.nombre,
      numeroLote: currentNumeroLote,
      cantidad,
      fechaVencimiento: currentFechaVencimiento,
    };

    setItems([...items, nuevoItem]);

    setCurrentProducto("");
    setCurrentNumeroLote("");
    setCurrentCantidad("");
    setCurrentFechaVencimiento("");

    toast.success("Producto agregado a la remisión");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success("Producto eliminado de la remisión");
  };

  // ✅ crear remisión
  const confirmCreate = () => {
    if (
      !formData.numeroRemision ||
      !formData.ordenCompra ||
      !formData.proveedor ||
      !formData.fecha
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la remisión");
      return;
    }

    const nuevaRemision: RemisionCompra = {
      id: remisiones.length > 0 ? Math.max(...remisiones.map((r) => r.id)) + 1 : 1,
      numeroRemision: formData.numeroRemision,
      ordenCompra: formData.ordenCompra,
      proveedor: formData.proveedor,
      fecha: formData.fecha,
      estado: "Pendiente",
      items,
      total: 0,
      observaciones: formData.observaciones,
      bodega:
        selectedBodega === "Todas las bodegas"
          ? "Bodega Principal"
          : selectedBodega,
    };

    setRemisiones([...remisiones, nuevaRemision]);
    closeToList();
    setShowSuccessModal(true);
  };

  // ✅ editar remisión
  const confirmEdit = () => {
    if (!remisionSeleccionada) return;

    if (
      !formData.numeroRemision ||
      !formData.ordenCompra ||
      !formData.proveedor ||
      !formData.fecha
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la remisión");
      return;
    }

    setRemisiones(
      remisiones.map((remision) =>
        remision.id === remisionSeleccionada.id
          ? {
            ...remision,
            numeroRemision: formData.numeroRemision,
            ordenCompra: formData.ordenCompra,
            proveedor: formData.proveedor,
            fecha: formData.fecha,
            items,
            observaciones: formData.observaciones,
          }
          : remision
      )
    );

    toast.success("Remisión de compra actualizada exitosamente");
    closeToList();
  };

  // ✅ eliminar remisión
  const confirmDelete = () => {
    if (!remisionSeleccionada) return;

    setRemisiones(
      remisiones.filter((remision) => remision.id !== remisionSeleccionada.id)
    );

    toast.success("Remisión de compra eliminada exitosamente");
    closeToList();
  };

  const handleConfirmEstado = () => {
    if (!remisionParaCambioEstado || !nuevoEstado) return;

    // ✅ Si pasa a aprobada, aquí ejecutas la lógica de inventario
    if (nuevoEstado === "Aprobada") {
      try {
        remisionParaCambioEstado.items.forEach((item) => {
          // Aquí debes conectar tu lógica real de existencias.
          // Ejemplo conceptual:
          // actualizarExistencia(item.producto, item.cantidad, remisionParaCambioEstado.bodega, item.numeroLote, item.fechaVencimiento);

          console.log("Subir a existencias:", {
            producto: item.producto,
            cantidad: item.cantidad,
            bodega: remisionParaCambioEstado.bodega,
            lote: item.numeroLote,
            fechaVencimiento: item.fechaVencimiento,
          });
        });
      } catch (error) {
        toast.error("No fue posible actualizar existencias");
        return;
      }
    }

    setRemisiones(
      remisiones.map((remision) =>
        remision.id === remisionParaCambioEstado.id
          ? { ...remision, estado: nuevoEstado }
          : remision
      )
    );

    if (nuevoEstado === "Aprobada") {
      toast.success("Remisión aprobada y existencias agregadas al inventario");
    } else {
      toast.success("Estado de remisión actualizado exitosamente");
    }

    setShowConfirmEstadoModal(false);
    setRemisionParaCambioEstado(null);
    setNuevoEstado(null);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!codigoBarras.trim()) return;

      const productoEncontrado = productos.find(
        (p: any) => p.codigoBarras === codigoBarras.trim() && p.estado
      );

      if (productoEncontrado) {
        setCurrentProducto(productoEncontrado.id);
        toast.success(`Producto encontrado: ${productoEncontrado.nombre}`);
        setCodigoBarras("");

        setTimeout(() => {
          const numeroLoteInput = document.getElementById(
            "numeroLote"
          ) as HTMLInputElement;
          numeroLoteInput?.focus();
        }, 100);
      } else {
        toast.error("Producto no encontrado con ese código de barras");
        setCodigoBarras("");
      }
    }
  };

  const handleDescargarRemisiones = () => {
    try {
      const headers = [
        "N° Remisión",
        "Orden de Compra",
        "Proveedor",
        "Fecha",
        "Estado",
        "Bodega",
        "Items",
        "Total",
        "Observaciones",
      ];

      const rows = filteredRemisiones.map((remision) => [
        remision.numeroRemision,
        remision.ordenCompra,
        remision.proveedor,
        new Date(remision.fecha).toLocaleDateString("es-CO"),
        remision.estado,
        remision.bodega,
        remision.items.length.toString(),
        `$${remision.total.toFixed(2)}`,
        remision.observaciones || "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `remisiones_compra_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Remisiones descargadas exitosamente");
    } catch (error) {
      toast.error("Error al descargar las remisiones");
      console.error("Error al descargar:", error);
    }
  };

  const handleDescargarRemision = (remision: RemisionCompra) => {
    try {
      const csvLines = [
        "REMISIÓN DE COMPRA",
        "",
        "INFORMACIÓN GENERAL",
        `Número de Remisión,${remision.numeroRemision}`,
        `Orden de Compra,${remision.ordenCompra}`,
        `Proveedor,${remision.proveedor}`,
        `Fecha,${new Date(remision.fecha).toLocaleDateString("es-CO")}`,
        `Estado,${remision.estado}`,
        `Bodega,${remision.bodega}`,
        `Total,$${remision.total.toFixed(2)}`,
        `Observaciones,"${remision.observaciones || "N/A"}"`,
        "",
        "PRODUCTOS",
        "Producto,Lote,Cantidad,Fecha Vencimiento",
        ...remision.items.map(
          (item) =>
            `"${item.productoNombre}",${item.numeroLote},${item.cantidad},${new Date(
              item.fechaVencimiento
            ).toLocaleDateString("es-CO")}`
        ),
      ];

      const csvContent = csvLines.join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `remision_${remision.numeroRemision}_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        `Remisión ${remision.numeroRemision} descargada exitosamente`
      );
    } catch (error) {
      toast.error("Error al descargar la remisión");
      console.error("Error al descargar:", error);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      Pendiente: {
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      Aprobada: {
        class: "bg-blue-100 text-blue-800 border-blue-200",
        icon: CheckCircle,
      },
    };
    return badges[estado as keyof typeof badges] || badges.Pendiente;
  };

  const getSiguienteEstado = (
    estadoActual: RemisionCompra["estado"]
  ): RemisionCompra["estado"] | null => {
    const flujoEstados: Record<
      RemisionCompra["estado"],
      RemisionCompra["estado"] | null
    > = {
      Pendiente: "Aprobada",
      Aprobada: null,
    };

    return flujoEstados[estadoActual];
  };

  const handleEstadoClick = (remision: RemisionCompra) => {
    const siguienteEstado = getSiguienteEstado(remision.estado);

    if (!siguienteEstado) {
      toast.info("Esta remisión ya está en estado final (Aprobada)");
      return;
    }

    setRemisionParaCambioEstado(remision);
    setNuevoEstado(siguienteEstado);
    setShowConfirmEstadoModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Remisiones</p>
              <p className="text-3xl mt-2">{stats.totalRemisiones}</p>
            </div>
            <FileText className="text-blue-200" size={40} />
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

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Aprobadas</p>
              <p className="text-3xl mt-2">{stats.aprobadas}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por remisión, orden, proveedor, estado o número de items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleDescargarRemisiones} className="w-full sm:w-auto">
              <Download size={18} className="mr-2" />
              Descargar
            </Button>

            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus size={20} className="mr-2" />
              Nueva Remisión
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de remisiones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Remisión</TableHead>
                <TableHead>Orden de Compra</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron remisiones de compra</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentRemisiones.map((remision, index) => (
                  <TableRow key={remision.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{remision.numeroRemision}</TableCell>
                    <TableCell>{remision.ordenCompra}</TableCell>
                    <TableCell>{remision.proveedor}</TableCell>
                    <TableCell>{new Date(remision.fecha).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell>{remision.items.length}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEstadoClick(remision)}
                        className={`h-7 ${remision.estado === "Aprobada"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                      >
                        {remision.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(remision)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDescargarRemision(remision)}
                          className="hover:bg-green-50"
                          title="Descargar"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(remision)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(remision)}
                          className="hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {filteredRemisiones.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRemisiones.length)} de{" "}
              {filteredRemisiones.length} remisiones
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Modal Crear */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nueva Remisión de Compra</DialogTitle>
            <DialogDescription
              id="create-remision-compra-description"
              className="sr-only"
            >
              Formulario para crear una nueva remisión de compra
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">Número de Remisión *</Label>
                <Input
                  id="numeroRemision"
                  value={formData.numeroRemision}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordenCompra">Orden de Compra *</Label>
                <Select
                  value={formData.ordenCompra}
                  onValueChange={handleOrdenCompraChange}
                >
                  <SelectTrigger id="ordenCompra">
                    <SelectValue placeholder="Seleccionar orden de compra" />
                  </SelectTrigger>
                  <SelectContent>
                    {comprasData.map((compra) => (
                      <SelectItem
                        key={compra.numeroOrden}
                        value={compra.numeroOrden}
                      >
                        {compra.numeroOrden} - {compra.proveedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor *</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Productos */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold">Productos de la Remisión</h3>
              </div>

              {/* Barcode */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Barcode size={20} className="text-blue-600" />
                  <Label htmlFor="codigoBarras" className="text-blue-900">
                    Lector de Código de Barras
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="codigoBarras"
                    ref={barcodeInputRef}
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanee el código de barras del producto..."
                    className="pr-10 bg-white border-blue-300 focus:border-blue-500"
                  />
                  <Barcode
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400"
                    size={20}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Escanee el código de barras para seleccionar el producto
                  automáticamente
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={currentProducto}
                      onValueChange={(value: string) => setCurrentProducto(value)}
                    >
                      <SelectTrigger id="producto">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos
                          .filter((p: any) => p.estado)
                          .map((producto: any) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroLote">Número de Lote *</Label>
                    <Input
                      id="numeroLote"
                      value={currentNumeroLote}
                      onChange={(e) => setCurrentNumeroLote(e.target.value)}
                      placeholder="Ej: AL-2024-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={currentCantidad}
                      onChange={(e) => setCurrentCantidad(e.target.value)}
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimiento">
                      Fecha de Vencimiento *
                    </Label>
                    <Input
                      id="fechaVencimiento"
                      type="date"
                      value={currentFechaVencimiento}
                      onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            {new Date(item.fechaVencimiento).toLocaleDateString(
                              "es-CO"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">
                    Agrega productos usando el formulario anterior
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                closeToList();
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Remisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Remisión de Compra</DialogTitle>
            <DialogDescription
              id="edit-remision-compra-description"
              className="sr-only"
            >
              Formulario para editar la remisión de compra
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numeroRemision">Número de Remisión *</Label>
                <Input
                  id="edit-numeroRemision"
                  value={formData.numeroRemision}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroRemision: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ordenCompra">Orden de Compra *</Label>
                <Input
                  id="edit-ordenCompra"
                  value={formData.ordenCompra}
                  onChange={(e) =>
                    setFormData({ ...formData, ordenCompra: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-proveedor">Proveedor *</Label>
                <Input
                  id="edit-proveedor"
                  value={formData.proveedor}
                  onChange={(e) =>
                    setFormData({ ...formData, proveedor: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fecha">Fecha *</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Input
                  id="edit-observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold">Productos de la Remisión</h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-producto">Producto *</Label>
                    <Select
                      value={currentProducto}
                      onValueChange={(value: string) => setCurrentProducto(value)}
                    >
                      <SelectTrigger id="edit-producto">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos
                          .filter((p: any) => p.estado)
                          .map((producto: any) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-numeroLote">Número de Lote *</Label>
                    <Input
                      id="edit-numeroLote"
                      value={currentNumeroLote}
                      onChange={(e) => setCurrentNumeroLote(e.target.value)}
                      placeholder="Ej: AL-2024-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-cantidad">Cantidad *</Label>
                    <Input
                      id="edit-cantidad"
                      type="number"
                      value={currentCantidad}
                      onChange={(e) => setCurrentCantidad(e.target.value)}
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaVencimiento">
                      Fecha de Vencimiento *
                    </Label>
                    <Input
                      id="edit-fechaVencimiento"
                      type="date"
                      value={currentFechaVencimiento}
                      onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            {new Date(item.fechaVencimiento).toLocaleDateString(
                              "es-CO"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">
                    Agrega productos usando el formulario anterior
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                closeToList();
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-3xl"
          aria-describedby="view-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalle de Remisión de Compra</DialogTitle>
            <DialogDescription
              id="view-remision-compra-description"
              className="sr-only"
            >
              Detalles completos de la remisión de compra
            </DialogDescription>
          </DialogHeader>

          {remisionSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Remisión</p>
                  <p className="font-semibold">
                    {remisionSeleccionada.numeroRemision}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orden de Compra</p>
                  <p className="font-semibold">
                    {remisionSeleccionada.ordenCompra}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="font-semibold">
                    {remisionSeleccionada.proveedor}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">
                    {new Date(remisionSeleccionada.fecha).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">{remisionSeleccionada.bodega}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEstadoClick(remisionSeleccionada)}
                      className={`h-7 px-3 ${remisionSeleccionada.estado === "Aprobada"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                    >
                      {remisionSeleccionada.estado}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-blue-600" />
                  <h3 className="font-semibold">Productos</h3>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remisionSeleccionada.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            {new Date(item.fechaVencimiento).toLocaleDateString(
                              "es-CO"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {remisionSeleccionada.observaciones && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Observaciones</p>
                  <p className="mt-1">{remisionSeleccionada.observaciones}</p>
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

      {/* Modal Eliminar */}
      <Dialog
        open={isEliminar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent 
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="delete-remision-compra-description">
          <DialogHeader>
            <DialogTitle>Eliminar Remisión de Compra</DialogTitle>
            <DialogDescription id="delete-remision-compra-description">
              ¿Estás seguro de que deseas eliminar esta remisión de compra? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {remisionSeleccionada && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión:{" "}
                <span className="font-semibold">
                  {remisionSeleccionada.numeroRemision}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Proveedor:{" "}
                <span className="font-semibold">
                  {remisionSeleccionada.proveedor}
                </span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirm Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent 
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Remisión</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              {nuevoEstado === "Aprobada"
                ? "¿Deseas aprobar esta remisión? Al aprobarla, se agregarán automáticamente las existencias al inventario."
                : "Confirmar cambio de estado."}
            </DialogDescription>
          </DialogHeader>

          {remisionParaCambioEstado && nuevoEstado && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión:{" "}
                <span className="font-semibold">
                  {remisionParaCambioEstado.numeroRemision}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Estado actual:{" "}
                <Badge
                  variant="outline"
                  className={getEstadoBadge(remisionParaCambioEstado.estado).class}
                >
                  {remisionParaCambioEstado.estado}
                </Badge>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Nuevo estado:{" "}
                <Badge
                  variant="outline"
                  className={getEstadoBadge(nuevoEstado).class}
                >
                  {nuevoEstado}
                </Badge>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setRemisionParaCambioEstado(null);
                setNuevoEstado(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éxito */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={handleSuccessModalClose}
      >
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="success-remision-description"
        >
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-remision-description">
              La remisión de compra se ha creado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Remisión Creada!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              La remisión de compra se ha registrado correctamente en el sistema
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
