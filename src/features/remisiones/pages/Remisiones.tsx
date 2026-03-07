import { useState, useMemo, useEffect } from "react";
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
  X,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
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

import type { AppOutletContext } from "../../../layouts/MainLayout";
import { ordenesData } from "../../../data/ordenes";
import { clientesData } from "../../../data/clientes";
import { productosData } from "../../../data/productos";
import { pagosAbonosData } from "../../../data/pagos";
import {
  remisionesVentaData,
  type RemisionVenta,
  type ProductoRemisionVenta,
} from "../../../data/remisiones-venta";

export default function Remisiones() {
  const { selectedBodegaNombre, currentUser } =
    useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // ✅ estados base
  const [searchTerm, setSearchTerm] = useState("");
  const [remisiones, setRemisiones] =
    useState<RemisionVenta[]>(remisionesVentaData);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [remisionParaCambioEstado, setRemisionParaCambioEstado] =
    useState<RemisionVenta | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<
    "Pendiente" | "Aprobada" | "Facturada" | "Anulada" | null
  >(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [remisionParaPdf, setRemisionParaPdf] =
    useState<RemisionVenta | null>(null);

  // ✅ router + flags URL
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/remisiones/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = () => navigate("/app/remisiones");

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
  const handleView = (remision: RemisionVenta) => {
    navigate(`/app/remisiones/${remision.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/remisiones/crear");
  };

  const handleEdit = (remision: RemisionVenta) => {
    navigate(`/app/remisiones/${remision.id}/editar`);
  };

  const handleDelete = (remision: RemisionVenta) => {
    navigate(`/app/remisiones/${remision.id}/eliminar`);
  };

  const [formData, setFormData] = useState({
    numeroRemision: "",
    ordenVenta: "",
    cliente: "",
    fecha: "",
    estado: "Pendiente" as "Pendiente" | "Aprobada" | "Facturada" | "Anulada",
    items: 0,
    total: 0,
    observaciones: "",
  });

  // Productos dentro de la remisión
  const [productosRemision, setProductosRemision] = useState<
    ProductoRemisionVenta[]
  >([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);

  // Productos activos
  const productosActivos = useMemo(
    () => productosData.filter((p) => p.estado),
    []
  );

  // Número automático
  const generarNumeroRemision = () => {
    const maxNum = remisiones.reduce((max, r) => {
      const match = /^RV-(\d+)$/.exec(r.numeroRemision);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `RV-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const getFechaActual = () => new Date().toISOString().split("T")[0];

  // Órdenes filtradas por cliente seleccionado
  const ordenesFiltradas = useMemo(() => {
    if (!formData.cliente) return ordenesData;
    return ordenesData.filter((orden) => orden.cliente === formData.cliente);
  }, [formData.cliente]);

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
        remision.ordenVenta
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        remision.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        remision.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        remision.items.toString().includes(searchTerm)
    );
  }, [remisiones, searchTerm, selectedBodega]);

  // ✅ paginación
  const totalPages = Math.ceil(filteredRemisiones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(startIndex, endIndex);

  // ✅ reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // ✅ stats sobre filtrado
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

  const handleOrdenChange = (ordenId: string) => {
    const ordenSeleccionada = ordenesData.find(
      (o) => o.numeroOrden === ordenId
    );

    if (ordenSeleccionada) {
      setFormData((prev) => ({
        ...prev,
        ordenVenta: ordenId,
        cliente: ordenSeleccionada.cliente,
      }));

      if (ordenSeleccionada.productos && ordenSeleccionada.productos.length > 0) {
        const productosConvertidos: ProductoRemisionVenta[] =
          ordenSeleccionada.productos.map((p) => ({
            producto: p.producto,
            cantidad: p.cantidad,
            precio: p.precio,
            subtotal: p.subtotal,
          }));

        setProductosRemision(productosConvertidos);
        toast.success(
          `${ordenSeleccionada.productos.length} productos cargados de la orden`
        );
      } else {
        setProductosRemision([]);
      }
    } else {
      setFormData((prev) => ({ ...prev, ordenVenta: ordenId }));
      setProductosRemision([]);
    }
  };

  const handleClienteChange = (clienteNombre: string) => {
    setFormData((prev) => ({ ...prev, cliente: clienteNombre }));

    if (formData.ordenVenta) {
      const ordenActual = ordenesData.find(
        (o) => o.numeroOrden === formData.ordenVenta
      );

      if (ordenActual && ordenActual.cliente !== clienteNombre) {
        setFormData((prev) => ({
          ...prev,
          cliente: clienteNombre,
          ordenVenta: "",
        }));
        setProductosRemision([]);
      }
    }
  };

  const agregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Selecciona un producto");
      return;
    }

    if (cantidadProducto <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (precioProducto <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    const producto = productosActivos.find((p) => p.id === selectedProductoId);
    if (!producto) return;

    const productoExistente = productosRemision.find(
      (p) => p.producto.id === selectedProductoId
    );
    if (productoExistente) {
      toast.error("Este producto ya está agregado");
      return;
    }

    const nuevoProducto: ProductoRemisionVenta = {
      producto,
      cantidad: cantidadProducto,
      precio: precioProducto,
      subtotal: cantidadProducto * precioProducto,
    };

    setProductosRemision([...productosRemision, nuevoProducto]);
    setSelectedProductoId("");
    setCantidadProducto(1);
    setPrecioProducto(0);
    toast.success("Producto agregado a la remisión");
  };

  const eliminarProducto = (productoId: string) => {
    setProductosRemision(
      productosRemision.filter((p) => p.producto.id !== productoId)
    );
    toast.success("Producto eliminado");
  };

  const calcularTotal = () =>
    productosRemision.reduce((total, item) => total + item.subtotal, 0);

  const resetForm = () => {
    setFormData({
      numeroRemision: "",
      ordenVenta: "",
      cliente: "",
      fecha: "",
      estado: "Pendiente",
      items: 0,
      total: 0,
      observaciones: "",
    });
    setProductosRemision([]);
    setSelectedProductoId("");
    setCantidadProducto(1);
    setPrecioProducto(0);
  };

  // ✅ al entrar a /crear
  useEffect(() => {
    if (!isCrear) return;

    resetForm();

    setFormData({
      numeroRemision: generarNumeroRemision(),
      ordenVenta: "",
      cliente: "",
      fecha: getFechaActual(),
      estado: "Pendiente",
      items: 0,
      total: 0,
      observaciones: "",
    });
  }, [isCrear, remisiones]);

  // ✅ al entrar a /editar
  useEffect(() => {
    if (!isEditar) return;
    if (!remisionSeleccionada) return;

    setFormData({
      numeroRemision: remisionSeleccionada.numeroRemision,
      ordenVenta: remisionSeleccionada.ordenVenta,
      cliente: remisionSeleccionada.cliente,
      fecha: remisionSeleccionada.fecha,
      estado: remisionSeleccionada.estado,
      items: remisionSeleccionada.items,
      total: remisionSeleccionada.total,
      observaciones: remisionSeleccionada.observaciones,
    });

    setProductosRemision(
      remisionSeleccionada.productos
        ? remisionSeleccionada.productos.map((p) => ({ ...p }))
        : []
    );
  }, [isEditar, remisionSeleccionada]);

  const confirmCreate = () => {
    if (!formData.ordenVenta || !formData.cliente) {
      toast.error("Por favor selecciona una orden de venta y un cliente");
      return;
    }

    if (productosRemision.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    const numeroRemisionNuevo = generarNumeroRemision();
    const totalRemision = calcularTotal();

    const nuevaRemision: RemisionVenta = {
      id: remisiones.length > 0 ? Math.max(...remisiones.map((r) => r.id)) + 1 : 1,
      numeroRemision: numeroRemisionNuevo,
      ordenVenta: formData.ordenVenta,
      cliente: formData.cliente,
      fecha: getFechaActual(),
      estado: formData.estado,
      items: productosRemision.length,
      total: totalRemision,
      observaciones: formData.observaciones,
      productos: productosRemision,
      bodega:
        selectedBodega === "Todas las bodegas"
          ? currentUser?.bodega || "Bodega Principal"
          : selectedBodega,
    };

    const nuevoPago = {
      id: pagosAbonosData.length + 1,
      numeroTransaccion: `TRX-${String(pagosAbonosData.length + 1).padStart(
        3,
        "0"
      )}`,
      remisionAsociada: numeroRemisionNuevo,
      cliente: formData.cliente,
      fecha: getFechaActual(),
      metodoPago: "Efectivo" as
        | "Efectivo"
        | "Transferencia"
        | "Tarjeta"
        | "Cheque",
      monto: totalRemision,
      saldoPendiente: totalRemision,
      estadoPago: "Pendiente" as "Pagado" | "Parcial" | "Pendiente",
      observaciones: `Pago generado automáticamente para remisión ${numeroRemisionNuevo}`,
      bodega: nuevaRemision.bodega,
      abonos: [],
    };

    pagosAbonosData.push(nuevoPago);

    setRemisiones([...remisiones, nuevaRemision]);
    closeToList();
    setShowSuccessModal(true);
  };

  const confirmEdit = () => {
    if (!remisionSeleccionada || !formData.ordenVenta || !formData.cliente) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (productosRemision.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    setRemisiones(
      remisiones.map((remision) =>
        remision.id === remisionSeleccionada.id
          ? {
            ...remision,
            ...formData,
            items: productosRemision.length,
            total: calcularTotal(),
            productos: productosRemision,
          }
          : remision
      )
    );

    toast.success("Remisión actualizada exitosamente");
    closeToList();
  };

  const confirmDelete = () => {
    if (!remisionSeleccionada) return;

    setRemisiones(
      remisiones.filter((remision) => remision.id !== remisionSeleccionada.id)
    );
    toast.success("Remisión eliminada exitosamente");
    closeToList();
  };

  const handleToggleEstado = (remision: RemisionVenta) => {
    let siguienteEstado: "Pendiente" | "Aprobada" | "Facturada" | "Anulada" | null =
      null;

    switch (remision.estado) {
      case "Pendiente":
        siguienteEstado = "Aprobada";
        break;
      case "Aprobada":
        siguienteEstado = "Facturada";
        break;
      case "Facturada":
        toast.info("Esta remisión ya está en estado final (Facturada)");
        return;
      case "Anulada":
        toast.info("Las remisiones anuladas no pueden cambiar de estado");
        return;
    }

    setRemisionParaCambioEstado(remision);
    setNuevoEstado(siguienteEstado);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (!remisionParaCambioEstado || !nuevoEstado) return;

    setRemisiones(
      remisiones.map((remision) =>
        remision.id === remisionParaCambioEstado.id
          ? { ...remision, estado: nuevoEstado }
          : remision
      )
    );

    toast.success(`Estado actualizado a: ${nuevoEstado}`);
    setShowConfirmEstadoModal(false);
    setRemisionParaCambioEstado(null);
    setNuevoEstado(null);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const generarPDF = (remision: RemisionVenta, incluirPrecios: boolean = true) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("REMISIÓN DE VENTA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`N° Remisión: ${remision.numeroRemision}`, 20, 40);
    doc.text(`Orden de Venta: ${remision.ordenVenta}`, 20, 46);
    doc.text(`Cliente: ${remision.cliente}`, 20, 52);

    doc.text(
      `Fecha: ${new Date(remision.fecha).toLocaleDateString("es-CO")}`,
      120,
      40
    );
    doc.text(`Estado: ${remision.estado}`, 120, 46);
    doc.text(`Items: ${remision.items}`, 120, 52);

    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    if (remision.productos && remision.productos.length > 0) {
      let tableData: any[] = [];
      let tableHeaders: any[] = [];
      let columnStyles: any = {};

      if (incluirPrecios) {
        tableData = remision.productos.map((p) => [
          p.producto.nombre,
          String(p.cantidad),
          `$${p.precio.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
          })}`,
          `$${p.subtotal.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
          })}`,
        ]);
        tableHeaders = [["Producto", "Cantidad", "Precio Unit.", "Subtotal"]];
        columnStyles = {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        };
      } else {
        tableData = remision.productos.map((p) => [
          p.producto.nombre,
          String(p.cantidad),
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
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles,
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    const totalesY = finalY + 10;

    if (incluirPrecios) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total:", 130, totalesY);
      doc.text(
        `$${remision.total.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
        })}`,
        190,
        totalesY,
        { align: "right" }
      );
    }

    if (remision.observaciones) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const obsY = incluirPrecios ? totalesY + 20 : totalesY + 10;
      doc.text("Observaciones:", 20, obsY);
      const split = doc.splitTextToSize(remision.observaciones, 170);
      doc.text(split, 20, obsY + 6);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generado el ${new Date().toLocaleString("es-CO")}`,
      105,
      pageHeight - 10,
      {
        align: "center",
      }
    );

    const suffix = incluirPrecios ? "" : "_SinPrecios";
    doc.save(`Remision_${remision.numeroRemision}${suffix}.pdf`);
    toast.success("PDF descargado exitosamente");
  };

  const openPdfOptionsModal = (remision: RemisionVenta) => {
    setRemisionParaPdf(remision);
    setIsPdfOptionsModalOpen(true);
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
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Buscar por remisión, orden, cliente, estado o número de items..."
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
            Nueva Remisión
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
                <TableHead>N° Remisión</TableHead>
                <TableHead>Orden de Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron remisiones de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentRemisiones.map((remision, index) => (
                  <TableRow key={remision.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {remision.numeroRemision}
                    </TableCell>
                    <TableCell>{remision.ordenVenta}</TableCell>
                    <TableCell>{remision.cliente}</TableCell>
                    <TableCell>
                      {new Date(remision.fecha).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell>{remision.items}</TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(remision)}
                        className={`h-7 ${remision.estado === "Facturada"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : remision.estado === "Aprobada"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : remision.estado === "Pendiente"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfOptionsModal(remision)}
                          className="hover:bg-gray-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-gray-600" />
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
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredRemisiones.length)} de{" "}
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
                  )
                )}
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
          if (!open) {
            closeToList();
            resetForm();
          }
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[85vw] max-h-[90vh] overflow-y-auto"
          aria-describedby="create-remision-venta-description"
        >
          <DialogHeader>
            <DialogTitle>Nueva Remisión de Venta</DialogTitle>
            <DialogDescription
              id="create-remision-venta-description"
              className="sr-only"
            >
              Formulario para crear una nueva remisión de venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">Número de Remisión</Label>
                <Input
                  id="numeroRemision"
                  value={formData.numeroRemision}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <select
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData
                    .filter((c: any) => c.estado === "Activo")
                    .map((cliente: any) => (
                      <option key={cliente.id} value={cliente.nombre}>
                        {cliente.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordenVenta">Orden de Venta *</Label>
                <select
                  id="ordenVenta"
                  value={formData.ordenVenta}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenesFiltradas.map((orden: any) => (
                    <option key={orden.id} value={orden.numeroOrden}>
                      {orden.numeroOrden} - {orden.cliente}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
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

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Agregar Productos</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="producto">Producto</Label>
                  <select
                    id="producto"
                    value={selectedProductoId}
                    onChange={(e) => setSelectedProductoId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productosActivos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidadProducto}
                    onChange={(e) =>
                      setCantidadProducto(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Unitario</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioProducto}
                    onChange={(e) =>
                      setPrecioProducto(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <Button
                    type="button"
                    onClick={agregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {productosRemision.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Productos en la Remisión</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="w-20">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosRemision.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell>{item.producto.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            $
                            {item.precio.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            $
                            {item.subtotal.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(item.producto.id)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-medium">
                          $
                          {calcularTotal().toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
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
          if (!open) {
            closeToList();
            resetForm();
          }
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[85vw] max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-remision-venta-description"
        >
          <DialogHeader>
            <DialogTitle>Editar Remisión de Venta</DialogTitle>
            <DialogDescription
              id="edit-remision-venta-description"
              className="sr-only"
            >
              Formulario para editar la remisión de venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numeroRemision">Número de Remisión</Label>
                <Input
                  id="edit-numeroRemision"
                  value={formData.numeroRemision}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado *</Label>
                <select
                  id="edit-estado"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value as
                        | "Pendiente"
                        | "Aprobada"
                        | "Facturada"
                        | "Anulada",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Facturada">Facturada</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fecha">Fecha</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={formData.fecha}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cliente">Cliente *</Label>
                <select
                  id="edit-cliente"
                  value={formData.cliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData
                    .filter((c: any) => c.estado === "Activo")
                    .map((cliente: any) => (
                      <option key={cliente.id} value={cliente.nombre}>
                        {cliente.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ordenVenta">Orden de Venta *</Label>
                <select
                  id="edit-ordenVenta"
                  value={formData.ordenVenta}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenesFiltradas.map((orden: any) => (
                    <option key={orden.id} value={orden.numeroOrden}>
                      {orden.numeroOrden} - {orden.cliente}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observaciones">Observaciones</Label>
              <Input
                id="edit-observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Agregar Productos</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-producto">Producto</Label>
                  <select
                    id="edit-producto"
                    value={selectedProductoId}
                    onChange={(e) => setSelectedProductoId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productosActivos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad">Cantidad</Label>
                  <Input
                    id="edit-cantidad"
                    type="number"
                    min="1"
                    value={cantidadProducto}
                    onChange={(e) =>
                      setCantidadProducto(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-precio">Precio Unitario</Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioProducto}
                    onChange={(e) =>
                      setPrecioProducto(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <Button
                    type="button"
                    onClick={agregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {productosRemision.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Productos en la Remisión</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="w-20">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosRemision.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell>{item.producto.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>
                            $
                            {item.precio.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            $
                            {item.subtotal.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(item.producto.id)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-medium">
                          $
                          {calcularTotal().toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
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
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-7xl max-h-[90vh] overflow-y-auto"
          aria-describedby="view-remision-venta-description"
        >
          <DialogHeader>
            <DialogTitle>Detalle de Remisión de Venta</DialogTitle>
            <DialogDescription
              id="view-remision-venta-description"
              className="sr-only"
            >
              Detalles completos de la remisión de venta
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
                  <p className="text-sm text-gray-600">Orden de Venta</p>
                  <p className="font-semibold">
                    {remisionSeleccionada.ordenVenta}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{remisionSeleccionada.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">
                    {remisionSeleccionada.fecha}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="font-semibold">{remisionSeleccionada.items}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEstado(remisionSeleccionada)}
                      className={`h-7 px-3 ${remisionSeleccionada.estado === "Facturada"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : remisionSeleccionada.estado === "Aprobada"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : remisionSeleccionada.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                    >
                      {remisionSeleccionada.estado}
                    </Button>
                  </div>
                </div>
              </div>

              {remisionSeleccionada.productos &&
                remisionSeleccionada.productos.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Productos</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio Unitario</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remisionSeleccionada.productos.map((item) => (
                            <TableRow key={item.producto.id}>
                              <TableCell>{item.producto.nombre}</TableCell>
                              <TableCell>{item.cantidad}</TableCell>
                              <TableCell>
                                $
                                {item.precio.toLocaleString("es-CO", {
                                  minimumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell>
                                $
                                {item.subtotal.toLocaleString("es-CO", {
                                  minimumFractionDigits: 2,
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold text-blue-600">
                    $
                    {remisionSeleccionada.total.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
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
          className="max-w-md"
          aria-describedby="delete-remision-venta-description"
        >
          <DialogHeader>
            <DialogTitle>Eliminar Remisión</DialogTitle>
            <DialogDescription id="delete-remision-venta-description">
              ¿Estás seguro de que deseas eliminar esta remisión de venta?
            </DialogDescription>
          </DialogHeader>
          {remisionSeleccionada && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Se eliminará la remisión{" "}
                <span className="font-medium text-gray-900">
                  {remisionSeleccionada.numeroRemision}
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
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Cambio de Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-md"
          aria-describedby="confirm-estado-description"
        >
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Deseas cambiar el estado de esta remisión?
            </DialogDescription>
          </DialogHeader>
          {remisionParaCambioEstado && nuevoEstado && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                La remisión{" "}
                <span className="font-medium text-gray-900">
                  {remisionParaCambioEstado.numeroRemision}
                </span>{" "}
                pasará de{" "}
                <span className="font-medium text-gray-900">
                  {remisionParaCambioEstado.estado}
                </span>{" "}
                a <span className="font-medium text-blue-600">{nuevoEstado}</span>.
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

      {/* Modal Opciones de PDF */}
      <Dialog
        open={isPdfOptionsModalOpen}
        onOpenChange={setIsPdfOptionsModalOpen}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-md"
          aria-describedby="pdf-options-description"
        >
          <DialogHeader>
            <DialogTitle>Opciones de PDF</DialogTitle>
            <DialogDescription id="pdf-options-description">
              Selecciona cómo deseas generar el PDF de la remisión.
            </DialogDescription>
          </DialogHeader>
          {remisionParaPdf && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Generar PDF para la remisión{" "}
                <span className="font-medium text-gray-900">
                  {remisionParaPdf.numeroRemision}
                </span>
                .
              </p>
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => {
                    generarPDF(remisionParaPdf, true);
                    setIsPdfOptionsModalOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <Download size={16} className="mr-2" />
                  Incluir Precios
                </Button>
                <Button
                  onClick={() => {
                    generarPDF(remisionParaPdf, false);
                    setIsPdfOptionsModalOpen(false);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 w-full"
                >
                  <Download size={16} className="mr-2" />
                  Sin Precios
                </Button>
              </div>
            </div>
          )}
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

      {/* Modal Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="success-remision-venta-description"
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
            <DialogDescription id="success-remision-venta-description">
              La remisión de venta se ha creado correctamente
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
              La remisión de venta se ha registrado correctamente en el sistema
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