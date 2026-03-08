import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  Ban,
  Trash2,
  Plus,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
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
import { Textarea } from "../../../shared/components/ui/textarea";
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

import { clientesData as initialClientesData, type Cliente } from "../../../data/clientes";
import { productosData, type Producto } from "../../../data/productos";
import { bodegasData } from "../../../data/bodegas";
import { cotizacionesData } from "../../../data/cotizaciones";
import { ordenesData, type Orden } from "../../../data/ordenes";

import type { AppOutletContext } from "../../../layouts/MainLayout";

export default function Ordenes() {
  // ✅ estados base
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenes, setOrdenes] = useState<Orden[]>(ordenesData);
  const [clientes] = useState<Cliente[]>(initialClientesData);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [ordenParaCambioEstado, setOrdenParaCambioEstado] = useState<Orden | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [ordenParaPdf, setOrdenParaPdf] = useState<Orden | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ router + bodega + flags URL
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  const isCrear = location.pathname.endsWith("/ordenes/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = useCallback(() => {
    navigate("/app/ordenes");
  }, [navigate]);

  // ✅ orden seleccionada por URL (:id)
  const ordenSeleccionada = useMemo(() => {
    if (!params.id) return null;

    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;

    return ordenes.find((o) => o.id === id) ?? null;
  }, [ordenes, params.id]);

  // ✅ si entran a /ver, /editar o /Anular con id inválido → volver
  useEffect(() => {
    if (!isVer && !isEditar && !isAnular) return;

    if (!ordenSeleccionada) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isAnular, ordenSeleccionada, closeToList]);

  // ✅ navegación (modales por URL)
  const handleView = (orden: Orden) => {
    navigate(`/app/ordenes/${orden.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/ordenes/crear");
  };

  const handleEdit = (orden: Orden) => {
    navigate(`/app/ordenes/${orden.id}/editar`);
  };

  const handleAnular = (orden: Orden) => {
    navigate(`/app/ordenes/${orden.id}/anular`);
  };

  // ✅ formulario principal
  const [formData, setFormData] = useState({
    numeroOrden: "",
    cliente: "",
    fecha: "",
    fechaVencimiento: "",
    estado: "Pendiente" as
      | "Pendiente"
      | "Procesando"
      | "Enviada"
      | "Entregada"
      | "Anulada",
    items: 0,
    observaciones: "",
    bodega: "",
  });

  // ✅ productos de la orden
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState<string>("");
  const [productosOrden, setProductosOrden] = useState<
    Array<{
      producto: Producto;
      cantidad: number;
      precio: number;
      subtotal: number;
    }>
  >([]);

  // ✅ cotización seleccionada
  const [selectedCotizacionId, setSelectedCotizacionId] = useState("");

  // ✅ productos activos
  const productosActivos = useMemo(() => {
    return productosData.filter((p) => p.estado);
  }, []);

  // ✅ clientes activos
  const clientesActivos = useMemo(() => {
    return clientes.filter((c) => c.estado === "Activo");
  }, [clientes]);

  // ✅ generar número de orden
  const generarNumeroOrden = () => {
    const maxNum = ordenes.reduce((max, o) => {
      const match = /^ORD-(\d+)$/.exec(o.numeroOrden);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `ORD-${String(maxNum + 1).padStart(3, "0")}`;
  };

  // ✅ fecha actual
  const getFechaActual = () => {
    return new Date().toISOString().split("T")[0];
  };

  // ✅ fecha vencimiento
  const getFechaVencimiento = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 5);
    return fecha.toISOString().split("T")[0];
  };

  // ✅ filtrar órdenes por bodega + búsqueda
  const filteredOrdenes = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return ordenes
      .filter((orden) => {
        if (selectedBodega === "Todas las bodegas") return true;
        return orden.bodega === selectedBodega;
      })
      .filter((orden) => {
        return (
          orden.numeroOrden.toLowerCase().includes(s) ||
          orden.cliente.toLowerCase().includes(s) ||
          orden.estado.toLowerCase().includes(s) ||
          String(orden.items).includes(s)
        );
      });
  }, [ordenes, searchTerm, selectedBodega]);

  // ✅ resetear página cuando cambia filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // ✅ paginación
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrdenes = filteredOrdenes.slice(startIndex, endIndex);

  // ✅ estadísticas
  const stats = useMemo(() => {
    const totalOrdenes = ordenes.length;
    const pendientes = ordenes.filter((o) => o.estado === "Pendiente").length;
    const procesando = ordenes.filter((o) => o.estado === "Procesando").length;
    const anuladas = ordenes.filter((o) => o.estado === "Anulada").length;

    return { totalOrdenes, pendientes, procesando, anuladas };
  }, [ordenes]);

  // ✅ reset formulario
  const resetForm = () => {
    setFormData({
      numeroOrden: "",
      cliente: "",
      fecha: "",
      fechaVencimiento: "",
      estado: "Pendiente",
      items: 0,
      observaciones: "",
      bodega: "",
    });

    setProductosOrden([]);
    setSelectedProductoId("");
    setCantidadProducto(1);
    setPrecioProducto("");
    setSelectedCotizacionId("");
  };

  // ✅ al entrar a /crear
  useEffect(() => {
    if (!isCrear) return;

    const bodegaInicial =
      selectedBodega === "Todas las bodegas"
        ? "Bodega Principal"
        : selectedBodega;

    resetForm();

    setFormData({
      numeroOrden: generarNumeroOrden(),
      cliente: "",
      fecha: getFechaActual(),
      fechaVencimiento: getFechaVencimiento(),
      estado: "Pendiente",
      items: 0,
      observaciones: "",
      bodega: bodegaInicial,
    });
  }, [isCrear, selectedBodega, ordenes]);

  // ✅ al entrar a /editar
  useEffect(() => {
    if (!isEditar) return;
    if (!ordenSeleccionada) return;

    setFormData({
      numeroOrden: ordenSeleccionada.numeroOrden,
      cliente: ordenSeleccionada.cliente,
      fecha: ordenSeleccionada.fecha,
      fechaVencimiento: ordenSeleccionada.fechaVencimiento,
      estado: ordenSeleccionada.estado,
      items: ordenSeleccionada.items,
      observaciones: ordenSeleccionada.observaciones,
      bodega: ordenSeleccionada.bodega,
    });

    setProductosOrden(ordenSeleccionada.productos || []);
    setSelectedProductoId("");
    setCantidadProducto(1);
    setPrecioProducto("");
    setSelectedCotizacionId("");
  }, [isEditar, ordenSeleccionada]);

  // ✅ cargar desde cotización
  const handleCargarDesdeCotizacion = (cotizacionId: string) => {
    if (!cotizacionId || cotizacionId === "sin-cotizacion") {
      setProductosOrden([]);
      return;
    }

    const cotizacionSeleccionada = cotizacionesData.find(
      (c) => c.id.toString() === cotizacionId
    );

    if (!cotizacionSeleccionada) {
      toast.error("Cotización no encontrada");
      return;
    }

    if (cotizacionSeleccionada.productos && cotizacionSeleccionada.productos.length > 0) {
      setProductosOrden(cotizacionSeleccionada.productos);
      setFormData((prev) => ({
        ...prev,
        cliente: cotizacionSeleccionada.cliente,
        bodega: cotizacionSeleccionada.bodega,
      }));
      toast.success(
        `${cotizacionSeleccionada.productos.length} producto(s) cargado(s) desde la cotización`
      );
    } else {
      toast.info("La cotización seleccionada no tiene productos");
      setProductosOrden([]);
    }
  };

  // ✅ agregar producto
  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Por favor selecciona un producto");
      return;
    }

    if (cantidadProducto <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }

    const precio = parseFloat(precioProducto);

    if (!precioProducto.trim() || Number.isNaN(precio) || precio <= 0) {
      toast.error("El precio debe ser mayor a cero");
      return;
    }

    const producto = productosActivos.find((p) => p.id === selectedProductoId);
    if (!producto) return;

    const productoExistente = productosOrden.find(
      (p) => p.producto.id === selectedProductoId
    );

    if (productoExistente) {
      toast.error("Este producto ya está agregado. Elimínalo primero si deseas modificarlo");
      return;
    }

    const subtotal = cantidadProducto * precio;

    const nuevoProducto = {
      producto,
      cantidad: cantidadProducto,
      precio,
      subtotal,
    };

    setProductosOrden([...productosOrden, nuevoProducto]);
    setSelectedProductoId("");
    setCantidadProducto(1);
    setPrecioProducto("");

    toast.success("Producto agregado correctamente");
  };

  // ✅ eliminar producto
  const handleEliminarProducto = (productoId: string) => {
    setProductosOrden(
      productosOrden.filter((p) => p.producto.id !== productoId)
    );
    toast.success("Producto eliminado de la orden");
  };

  // ✅ totales
  const calcularTotales = useMemo(() => {
    const total = productosOrden.reduce((sum, item) => sum + item.subtotal, 0);
    const items = productosOrden.length;

    return { total, items };
  }, [productosOrden]);

  // ✅ crear orden
  const confirmCreate = () => {
    if (
      !formData.numeroOrden ||
      !formData.cliente ||
      !formData.fecha ||
      !formData.fechaVencimiento ||
      !formData.bodega
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto a la orden");
      return;
    }

    const nuevaOrden: Orden = {
      id: ordenes.length > 0 ? Math.max(...ordenes.map((o) => o.id)) + 1 : 1,
      numeroOrden: formData.numeroOrden,
      cliente: formData.cliente,
      fecha: formData.fecha,
      fechaVencimiento: formData.fechaVencimiento,
      estado: formData.estado,
      items: calcularTotales.items,
      total: calcularTotales.total,
      observaciones: formData.observaciones,
      bodega: formData.bodega,
      productos: [...productosOrden],
    };

    setOrdenes([...ordenes, nuevaOrden]);
    closeToList();
    setShowSuccessModal(true);
  };

  // ✅ editar orden
  const confirmEdit = () => {
    if (!ordenSeleccionada) return;

    if (ordenSeleccionada.estado === "Anulada") {
      toast.error("No puedes editar una orden anulada");
      return;
    }

    if (!formData.numeroOrden || !formData.cliente || !formData.bodega) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto a la orden");
      return;
    }

    setOrdenes(
      ordenes.map((orden) =>
        orden.id === ordenSeleccionada.id
          ? {
            ...orden,
            ...formData,
            items: calcularTotales.items,
            total: calcularTotales.total,
            productos: [...productosOrden],
          }
          : orden
      )
    );

    toast.success("Orden de venta actualizada exitosamente");
    closeToList();
  };

  // ✅ eliminar orden
  const confirmAnular = () => {
    if (!ordenSeleccionada) return;

    if (ordenSeleccionada.estado === "Anulada") {
      toast.error("La orden ya está anulada");
      return;
    }

    setOrdenes(
      ordenes.map((orden) =>
        orden.id === ordenSeleccionada.id
          ? { ...orden, estado: "Anulada" }
          : orden
      )
    );

    toast.success("Orden de venta anulada exitosamente");
    closeToList();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const openPdfOptionsModal = (orden: Orden) => {
    setOrdenParaPdf(orden);
    setIsPdfOptionsModalOpen(true);
  };

  const handleDownloadPDF = (orden: Orden, incluirPrecios: boolean = true) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE VENTA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`N° Orden: ${orden.numeroOrden}`, 20, 40);
    doc.text(`Cliente: ${orden.cliente}`, 20, 46);
    doc.text(`Bodega: ${orden.bodega}`, 20, 52);

    doc.text(`Fecha: ${new Date(orden.fecha).toLocaleDateString("es-CO")}`, 120, 40);
    doc.text(
      `Fecha Vencimiento: ${new Date(orden.fechaVencimiento).toLocaleDateString("es-CO")}`,
      120,
      46
    );
    doc.text(`Estado: ${orden.estado}`, 120, 52);

    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    if (orden.productos && orden.productos.length > 0) {
      let tableData;
      let tableHeaders;
      let columnStyles;

      if (incluirPrecios) {
        tableData = orden.productos.map((item) => [
          item.producto.nombre,
          item.cantidad.toString(),
          `$${item.precio.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
          `$${item.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        ]);
        tableHeaders = [["Producto", "Cantidad", "Precio Unit.", "Subtotal"]];
        columnStyles = {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        };
      } else {
        tableData = orden.productos.map((item) => [
          item.producto.nombre,
          item.cantidad.toString(),
        ]);
        tableHeaders = [["Producto", "Cantidad"]];
        columnStyles = {
          0: { cellWidth: 130 },
          1: { cellWidth: 30, halign: "center" },
        };
      }

      autoTable(doc, {
        startY: 65,
        head: tableHeaders,
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: columnStyles as any,
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    const totalesY = finalY + 10;

    if (incluirPrecios) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total:", 130, totalesY);
      doc.text(
        `$${orden.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        190,
        totalesY,
        { align: "right" }
      );
    }

    if (orden.observaciones) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const obsY = incluirPrecios ? totalesY + 20 : totalesY + 10;
      doc.text("Observaciones:", 20, obsY);
      const splitObservaciones = doc.splitTextToSize(orden.observaciones, 170);
      doc.text(splitObservaciones, 20, obsY + 6);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generado el ${new Date().toLocaleString("es-CO")}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );

    const suffix = incluirPrecios ? "" : "_SinPrecios";
    doc.save(`Orden_Venta_${orden.numeroOrden}${suffix}.pdf`);
    toast.success("PDF descargado exitosamente");
  };

  const handleToggleEstado = (orden: Orden) => {
    if (orden.estado === "Anulada") {
      toast.info("No puedes cambiar el estado de una orden anulada");
      return;
    }

    setOrdenParaCambioEstado(orden);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (!ordenParaCambioEstado) return;

    let nuevoEstado: Orden["estado"] = ordenParaCambioEstado.estado;

    switch (ordenParaCambioEstado.estado) {
      case "Pendiente":
        nuevoEstado = "Procesando";
        break;
      case "Procesando":
        nuevoEstado = "Enviada";
        break;
      case "Enviada":
        nuevoEstado = "Entregada";
        break;
      case "Entregada":
        toast.info("Esta orden ya está en estado final (Entregada)");
        setShowConfirmEstadoModal(false);
        setOrdenParaCambioEstado(null);
        return;
      case "Anulada":
        toast.info("Las órdenes anuladas no pueden cambiar de estado");
        setShowConfirmEstadoModal(false);
        setOrdenParaCambioEstado(null);
        return;
      default:
        return;
    }

    setOrdenes(
      ordenes.map((orden) =>
        orden.id === ordenParaCambioEstado.id
          ? { ...orden, estado: nuevoEstado }
          : orden
      )
    );

    toast.success(`Estado actualizado a: ${nuevoEstado}`);
    setShowConfirmEstadoModal(false);
    setOrdenParaCambioEstado(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Órdenes de Venta</h2>
        <p className="text-gray-600 mt-1">
          Gestiona las órdenes de venta de productos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalOrdenes}
              </p>
            </div>
            <ShoppingCart className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendientes}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Procesando</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.procesando}
              </p>
            </div>
            <CheckCircle2 className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y botón crear */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por número de orden, cliente, estado o número de items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrdenes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentOrdenes.map((orden, index) => (
                  <TableRow key={orden.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {orden.numeroOrden}
                    </TableCell>
                    <TableCell>{orden.cliente}</TableCell>
                    <TableCell>
                      {new Date(orden.fecha).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell>
                      {new Date(orden.fechaVencimiento).toLocaleDateString(
                        "es-CO"
                      )}
                    </TableCell>
                    <TableCell>{orden.items}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(orden)}
                        disabled={orden.estado === "Anulada"}
                        className={`h-7 ${orden.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : orden.estado === "Procesando"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : orden.estado === "Enviada"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : orden.estado === "Entregada"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-100 opacity-60 cursor-not-allowed"
                          }`}
                      >
                        {orden.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(orden)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfOptionsModal(orden)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(orden)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(orden)}
                          className="hover:bg-red-50"
                          title="Anular"
                        >
                          <Ban size={16} className="text-red-600" />
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
        {filteredOrdenes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredOrdenes.length)} de{" "}
              {filteredOrdenes.length} órdenes
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

      {/* Modal Crear Orden */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Venta</DialogTitle>
            <DialogDescription>
              Completa la información para crear una nueva orden de venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroOrden">Número de Orden *</Label>
                <Input
                  id="numeroOrden"
                  value={formData.numeroOrden}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
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
            </div>

            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Select
                value={formData.cliente}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, cliente: value })
                }
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesActivos.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fechaVencimiento: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bodega">Bodega *</Label>
                <Select
                  value={formData.bodega}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, bodega: value })
                  }
                >
                  <SelectTrigger id="bodega">
                    <SelectValue placeholder="Selecciona una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter((bodega) => bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Orden</Label>

              {/* Selector de Cotización */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 mb-4">
                <Label
                  htmlFor="cotizacion-select"
                  className="text-blue-900 mb-2 block"
                >
                  ¿Deseas cargar productos desde una cotización existente?
                </Label>

                <Select
                  value={selectedCotizacionId}
                  onValueChange={(value: string) => {
                    setSelectedCotizacionId(value);
                    handleCargarDesdeCotizacion(value);
                  }}
                >
                  <SelectTrigger id="cotizacion-select" className="bg-white">
                    <SelectValue placeholder="Selecciona una cotización (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cotizacion">Sin cotización</SelectItem>
                    {cotizacionesData
                      .filter((cot) => {
                        const matchBodega =
                          cot.bodega === formData.bodega || formData.bodega === "";
                        const matchCliente = formData.cliente
                          ? cot.cliente === formData.cliente
                          : true;
                        return matchBodega && matchCliente;
                      })
                      .map((cotizacion) => (
                        <SelectItem
                          key={cotizacion.id}
                          value={cotizacion.id.toString()}
                        >
                          {cotizacion.numeroCotizacion} - {cotizacion.cliente} (
                          {cotizacion.items} items)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-blue-600 mt-2">
                  {formData.cliente
                    ? `Mostrando cotizaciones del cliente ${formData.cliente}`
                    : "Selecciona un cliente para ver sus cotizaciones disponibles"}
                </p>
              </div>

              {/* Formulario productos */}
              <div className="grid grid-cols-12 gap-2 mt-3">
                <div className="col-span-5">
                  <Label htmlFor="producto">Producto</Label>
                  <Select
                    value={selectedProductoId}
                    onValueChange={(value: string) => setSelectedProductoId(value)}
                  >
                    <SelectTrigger id="producto">
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosActivos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) =>
                      setCantidadProducto(parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor="precio">Precio Unit.</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    min="0"
                    step="0"
                    placeholder="0.00"
                    className="h-12 sin-flechas"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Tabla productos */}
              {productosOrden.length > 0 && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosOrden.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell className="font-medium">
                            {item.producto.nombre}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.precio.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.subtotal.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEliminarProducto(item.producto.id)
                              }
                              className="hover:bg-red-50"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Totales */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    ${calcularTotales.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Escribe cualquier observación sobre la orden de venta..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Orden */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Orden de Venta</DialogTitle>
            <DialogDescription>
              Actualiza la información de la orden de venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroOrdenEdit">Número de Orden</Label>
                <Input
                  id="numeroOrdenEdit"
                  value={formData.numeroOrden}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="estadoEdit">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(
                    value:
                      | "Pendiente"
                      | "Procesando"
                      | "Enviada"
                      | "Entregada"
                      | "Anulada"
                  ) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger id="estadoEdit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Procesando">Procesando</SelectItem>
                    <SelectItem value="Enviada">Enviada</SelectItem>
                    <SelectItem value="Entregada">Entregada</SelectItem>
                    <SelectItem value="Anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="clienteEdit">Cliente *</Label>
              <Select
                value={formData.cliente}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, cliente: value })
                }
              >
                <SelectTrigger id="clienteEdit">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesActivos.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaEdit">Fecha *</Label>
                <Input
                  id="fechaEdit"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bodegaEdit">Bodega *</Label>
                <Select
                  value={formData.bodega}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, bodega: value })
                  }
                >
                  <SelectTrigger id="bodegaEdit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter((bodega) => bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sección productos */}
            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Orden</Label>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 mb-4">
                <Label
                  htmlFor="cotizacion-select-edit"
                  className="text-blue-900 mb-2 block"
                >
                  ¿Deseas cargar productos desde una cotización existente?
                </Label>

                <Select
                  value={selectedCotizacionId}
                  onValueChange={(value: string) => {
                    setSelectedCotizacionId(value);
                    handleCargarDesdeCotizacion(value);
                  }}
                >
                  <SelectTrigger id="cotizacion-select-edit" className="bg-white">
                    <SelectValue placeholder="Selecciona una cotización (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cotizacion">Sin cotización</SelectItem>
                    {cotizacionesData
                      .filter((cot) => {
                        const matchBodega =
                          cot.bodega === formData.bodega || formData.bodega === "";
                        const matchCliente = formData.cliente
                          ? cot.cliente === formData.cliente
                          : true;
                        return matchBodega && matchCliente;
                      })
                      .map((cotizacion) => (
                        <SelectItem
                          key={cotizacion.id}
                          value={cotizacion.id.toString()}
                        >
                          {cotizacion.numeroCotizacion} - {cotizacion.cliente} (
                          {cotizacion.items} items)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-blue-600 mt-2">
                  {formData.cliente
                    ? `Mostrando cotizaciones del cliente ${formData.cliente}`
                    : "Selecciona un cliente para ver sus cotizaciones disponibles"}
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2 mt-3">
                <div className="col-span-5">
                  <Label htmlFor="productoEdit">Producto</Label>
                  <Select
                    value={selectedProductoId}
                    onValueChange={(value: string) => setSelectedProductoId(value)}
                  >
                    <SelectTrigger id="productoEdit">
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosActivos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="cantidadEdit">Cantidad</Label>
                  <Input
                    id="cantidadEdit"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) =>
                      setCantidadProducto(parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor="precioEdit">Precio Unit.</Label>
                  <Input
                    id="precioEdit"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    min="0"
                    step="0"
                    placeholder="0.00"
                    className="h-12 sin-flechas"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {productosOrden.length > 0 && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosOrden.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell className="font-medium">
                            {item.producto.nombre}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.precio.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.subtotal.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleEliminarProducto(item.producto.id)
                              }
                              className="hover:bg-red-50"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    ${calcularTotales.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observacionesEdit">Observaciones</Label>
              <Textarea
                id="observacionesEdit"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Escribe cualquier observación sobre la orden de venta..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Actualizar Orden
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
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
            <DialogDescription className="sr-only">
              Información detallada de la orden de venta
            </DialogDescription>
          </DialogHeader>

          {ordenSeleccionada && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Número de Orden</p>
                  <p className="font-medium text-blue-600">
                    {ordenSeleccionada.numeroOrden}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEstado(ordenSeleccionada)}
                      className={`h-7 px-3 ${ordenSeleccionada.estado === "Pendiente"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : ordenSeleccionada.estado === "Procesando"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : ordenSeleccionada.estado === "Enviada"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                            : ordenSeleccionada.estado === "Entregada"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                    >
                      {ordenSeleccionada.estado}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{ordenSeleccionada.cliente}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-medium">{ordenSeleccionada.bodega}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium">
                    {new Date(ordenSeleccionada.fecha).toLocaleDateString("es-CO")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-medium">
                    {new Date(
                      ordenSeleccionada.fechaVencimiento
                    ).toLocaleDateString("es-CO")}
                  </p>
                </div>
              </div>

              {ordenSeleccionada.productos &&
                ordenSeleccionada.productos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Productos</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-right">
                              Precio Unit.
                            </TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordenSeleccionada.productos.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {item.producto.nombre}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.cantidad}
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.precio.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.subtotal.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              <div className="flex justify-end">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total de la Orden</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${ordenSeleccionada.total.toLocaleString()}
                  </p>
                </div>
              </div>

              {ordenSeleccionada.observaciones && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Observaciones</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">
                      {ordenSeleccionada.observaciones}
                    </p>
                  </div>
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
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anular Orden</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas Anular esta orden de venta?
            </DialogDescription>
          </DialogHeader>

          {ordenSeleccionada && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Se anulara la orden{" "}
                <span className="font-medium text-gray-900">
                  {ordenSeleccionada.numeroOrden}
                </span>{" "}
                del cliente{" "}
                <span className="font-medium text-gray-900">
                  {ordenSeleccionada.cliente}
                </span>
                .
              </p>
              <p className="text-sm text-red-600 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmAnular}>
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={24} />
              Orden Creada Exitosamente
            </DialogTitle>
            <DialogDescription className="sr-only">
              La orden de venta ha sido creada correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              La orden de venta ha sido registrada correctamente en el sistema.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSuccessModalClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="confirm-estado-orden-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de la Orden</DialogTitle>
            <DialogDescription id="confirm-estado-orden-description">
              ¿Estás seguro de que deseas cambiar el estado de esta orden?
            </DialogDescription>
          </DialogHeader>

          {ordenParaCambioEstado && (
            <div className="py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Orden:</span>
                <span className="font-medium">
                  {ordenParaCambioEstado.numeroOrden}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">
                  {ordenParaCambioEstado.cliente}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado actual:</span>
                <span className="font-medium">
                  {ordenParaCambioEstado.estado}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nuevo estado:</span>
                <span className="font-medium">
                  {ordenParaCambioEstado.estado === "Pendiente"
                    ? "Procesando"
                    : ordenParaCambioEstado.estado === "Procesando"
                      ? "Enviada"
                      : ordenParaCambioEstado.estado === "Enviada"
                        ? "Entregada"
                        : ordenParaCambioEstado.estado}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setOrdenParaCambioEstado(null);
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

      {/* Modal Opciones PDF */}
      <Dialog
        open={isPdfOptionsModalOpen}
        onOpenChange={setIsPdfOptionsModalOpen}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar PDF</DialogTitle>
            <DialogDescription>
              Selecciona el formato del PDF que deseas descargar
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Button
              onClick={() => {
                if (ordenParaPdf) handleDownloadPDF(ordenParaPdf, true);
                setIsPdfOptionsModalOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar con Precios
            </Button>

            <Button
              onClick={() => {
                if (ordenParaPdf) handleDownloadPDF(ordenParaPdf, false);
                setIsPdfOptionsModalOpen(false);
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar sin Precios
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPdfOptionsModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}