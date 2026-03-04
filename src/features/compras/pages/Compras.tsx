import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router-dom";

import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Phone,
  Building2,
  Mail,
  MapPin,
  X,
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
import { Badge } from "../../../shared/components/ui/badge";
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
import { proveedoresData as initialProveedoresData, Proveedor } from "../../../data/proveedores";
import { productosData, Producto } from "../../../data/productos";
import { bodegasData } from "../../../data/bodegas";

import type { AppOutletContext } from "../../../layouts/MainLayout";

interface Compra {
  id: number;
  numeroOrden: string;
  proveedor: string;
  fecha: string;
  fechaEntrega: string;
  estado: "Pendiente" | "Aprobada";
  items: number;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  bodega: string;
  productos?: Array<{
    producto: Producto;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

// Categorías disponibles para proveedores
const CATEGORIAS_PROVEEDOR = [
  "Medicamentos",
  "Equipos Médicos",
  "Material de Curación",
  "Alimentos",
  "Suplementos",
  "Insumos Veterinarios",
  "Otros",
] as const;

export default function Compras() {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("");
  const [compras, setCompras] = useState<Compra[]>(comprasData);
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedoresData);

  // Modales que NO van por URL
  const [isCreateProveedorModalOpen, setIsCreateProveedorModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Router + bodega + flags URL
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  const isCrear = location.pathname.endsWith("/compras/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = () => navigate("/app/compras");

  // Navegación (modales por URL)
  const handleView = (c: Compra) => navigate(`/app/compras/${c.id}/ver`);
  const handleCreate = () => navigate("/app/compras/crear");
  const handleEdit = (c: Compra) => navigate(`/app/compras/${c.id}/editar`);
  const handleDelete = (c: Compra) => navigate(`/app/compras/${c.id}/eliminar`);

  // Compra seleccionada por URL (:id)
  const compraSeleccionada = useMemo(() => {
    if (!params.id) return null;
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return compras.find((c) => c.id === id) ?? null;
  }, [compras, params.id]);

  // Si entran a /ver, /editar o /eliminar con id inválido -> volver
  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!compraSeleccionada) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isEliminar, compraSeleccionada]);

  // Formulario de orden de compra
  const [formData, setFormData] = useState({
    numeroOrden: "",
    proveedor: "",
    fecha: "",
    fechaEntrega: "",
    estado: "Pendiente" as "Pendiente" | "Aprobada",
    items: 0,
    subtotal: 0,
    impuestos: 0,
    observaciones: "",
    bodega: "",
  });

  // Formulario para crear proveedor desde compras
  const [formProvTipoDoc, setFormProvTipoDoc] = useState("NIT");
  const [formProvNumeroDoc, setFormProvNumeroDoc] = useState("");
  const [formProvNombre, setFormProvNombre] = useState("");
  const [formProvEmail, setFormProvEmail] = useState("");
  const [formProvTelefono, setFormProvTelefono] = useState("");
  const [formProvDireccion, setFormProvDireccion] = useState("");
  const [formProvCiudad, setFormProvCiudad] = useState("");
  const [formProvCategoria, setFormProvCategoria] = useState("");
  const [formProvContacto, setFormProvContacto] = useState("");
  const [formProvNotas, setFormProvNotas] = useState("");

  // Manejo de productos en la orden
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);
  const [productosOrden, setProductosOrden] = useState<
    Array<{ producto: Producto; cantidad: number; precio: number; subtotal: number }>
  >([]);

  // Productos activos
  const productosActivos = useMemo(() => {
    return productosData.filter((p) => p.estado);
  }, []);

  // Proveedores activos
  const proveedoresActivos = useMemo(() => {
    return proveedores.filter((p) => p.estado === "Activo");
  }, [proveedores]);

  // Generar número de orden consecutivo
  const generarNumeroOrden = () => {
    const maxNum = compras.reduce((max, c) => {
      const match = /^OC-(\d+)$/.exec(c.numeroOrden);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `OC-${String(maxNum + 1).padStart(3, "0")}`;
  };

  // Fecha actual YYYY-MM-DD
  const getFechaActual = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Filtrado por bodega + búsqueda
  const filteredCompras = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return compras
      .filter((c) => {
        if (selectedBodega === "Todas las bodegas") return true;
        return c.bodega === selectedBodega;
      })
      .filter((c) => {
        return (
          c.numeroOrden.toLowerCase().includes(s) ||
          c.proveedor.toLowerCase().includes(s) ||
          c.estado.toLowerCase().includes(s) ||
          String(c.items).includes(s)
        );
      });
  }, [compras, searchTerm, selectedBodega]);

  // Resetear página cuando cambia filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompras = filteredCompras.slice(startIndex, endIndex);

  // Estadísticas
  const stats = useMemo(() => {
    const totalCompras = compras.length;
    const pendientes = compras.filter((c) => c.estado === "Pendiente").length;
    const aprobadas = compras.filter((c) => c.estado === "Aprobada").length;
    return { totalCompras, pendientes, aprobadas };
  }, [compras]);

  // Totales dinámicos
  const calcularTotales = useMemo(() => {
    const subtotal = productosOrden.reduce((sum, item) => sum + item.subtotal, 0);
    const impuestos = subtotal * 0.19;
    const total = subtotal + impuestos;
    const items = productosOrden.length;
    return { subtotal, impuestos, total, items };
  }, [productosOrden]);

  // Cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Clase badge por estado
  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Aprobada":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Descargar PDF
  const handleDownloadPDF = (compra: Compra) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE COMPRA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`N° Orden: ${compra.numeroOrden}`, 20, 40);
    doc.text(`Proveedor: ${compra.proveedor}`, 20, 46);
    doc.text(`Bodega: ${compra.bodega}`, 20, 52);

    doc.text(`Fecha: ${new Date(compra.fecha).toLocaleDateString("es-CO")}`, 120, 40);
    doc.text(
      `Fecha Entrega: ${new Date(compra.fechaEntrega).toLocaleDateString("es-CO")}`,
      120,
      46
    );
    doc.text(`Estado: ${compra.estado}`, 120, 52);

    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    if (compra.productos && compra.productos.length > 0) {
      const tableData = compra.productos.map((item) => [
        item.producto.nombre,
        String(item.cantidad),
        `$${item.precio.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
        `$${item.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY: 65,
        head: [["Producto", "Cantidad", "Precio Unit.", "Subtotal"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        },
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    const totalesY = finalY + 10;

    doc.text("Subtotal:", 130, totalesY);
    doc.text(
      `$${compra.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
      190,
      totalesY,
      { align: "right" }
    );

    doc.text("Impuestos (19%):", 130, totalesY + 6);
    doc.text(
      `$${compra.impuestos.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
      190,
      totalesY + 6,
      { align: "right" }
    );

    doc.setLineWidth(0.3);
    doc.line(130, totalesY + 10, 190, totalesY + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 130, totalesY + 16);
    doc.text(
      `$${compra.total.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
      190,
      totalesY + 16,
      { align: "right" }
    );

    if (compra.observaciones) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Observaciones:", 20, totalesY + 30);
      const splitObs = doc.splitTextToSize(compra.observaciones, 170);
      doc.text(splitObs, 20, totalesY + 36);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Generado el ${new Date().toLocaleString("es-CO")}`, 105, pageHeight - 10, {
      align: "center",
    });

    doc.save(`Orden_Compra_${compra.numeroOrden}.pdf`);
    toast.success("PDF descargado exitosamente");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Órdenes de Compra</h2>
        <p className="text-gray-600 mt-1">Gestiona las órdenes de compra de productos</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCompras}</p>
            </div>
            <ShoppingCart className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.aprobadas}</p>
            </div>
            <CheckCircle2 className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y botón crear */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número de orden, proveedor, estado o número de items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700">
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
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Fecha Entrega</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de compra</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentCompras.map((compra, index) => (
                  <TableRow key={compra.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{compra.numeroOrden}</TableCell>
                    <TableCell>{compra.proveedor}</TableCell>
                    <TableCell>{new Date(compra.fecha).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{new Date(compra.fechaEntrega).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEstadoBadgeClass(compra.estado)}>
                        {compra.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{compra.items}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(compra)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(compra)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(compra)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(compra)}
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
        {filteredCompras.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredCompras.length)} de{' '}
              {filteredCompras.length} órdenes
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
                    variant={currentPage === page ? 'default' : 'outline'}
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

      {/* Modal Crear Orden de Compra */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[98vw] w-[1600px] max-h-[92vh] overflow-y-auto" aria-describedby="create-order-description">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription id="create-order-description">
              Completa la información para crear una nueva orden de compra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 px-2">
            <div className="grid grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numeroOrden">Número de Orden *</Label>
                <Input
                  id="numeroOrden"
                  value={formData.numeroOrden}
                  disabled
                  className="bg-gray-100 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaEntrega">Fecha de Entrega *</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={formData.fechaEntrega}
                  onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodega">Bodega *</Label>
                <Select value={formData.bodega} onValueChange={(value) => setFormData({ ...formData, bodega: value })}>
                  <SelectTrigger id="bodega" className="h-12">
                    <SelectValue placeholder="Selecciona una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <div className="flex gap-4">
                <Select value={formData.proveedor} onValueChange={(value) => setFormData({ ...formData, proveedor: value })}>
                  <SelectTrigger id="proveedor" className="flex-1 h-12">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedoresActivos.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-gray-500">
                        No hay proveedores activos disponibles
                      </div>
                    ) : (
                      proveedoresActivos.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={proveedor.nombre}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetProveedorForm();
                    setIsCreateProveedorModalOpen(true);
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 h-12"
                >
                  <Plus size={18} className="mr-2" />
                  Nuevo Proveedor
                </Button>
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-6 mt-6">
              <Label className="text-lg mb-4 block">Productos de la Orden</Label>

              {/* Formulario para agregar productos */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="producto">Producto</Label>
                  <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
                    <SelectTrigger id="producto" className="h-12">
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
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-12"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="precio">Precio Unitario</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-12"
                  />
                </div>
                <div className="col-span-3 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700 h-12"
                  >
                    <Plus size={18} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Tabla de productos agregados */}
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
                          <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                          <TableCell className="text-center">{item.cantidad}</TableCell>
                          <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarProducto(item.producto.id)}
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

              {/* Totales calculados automáticamente */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calcularTotales.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos (19%):</span>
                  <span className="font-medium">${calcularTotales.impuestos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">${calcularTotales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Escribe cualquier observación sobre la orden de compra..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Proveedor (anidado) */}
      <Dialog open={isCreateProveedorModalOpen} onOpenChange={setIsCreateProveedorModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="create-provider-description">
          <button
            onClick={() => setIsCreateProveedorModalOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription id="create-provider-description">
              Completa la información para registrar un nuevo proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prov-tipo-doc">Tipo de Documento *</Label>
                <Select value={formProvTipoDoc} onValueChange={setFormProvTipoDoc}>
                  <SelectTrigger id="prov-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prov-numero-doc">Número de Documento *</Label>
                <Input
                  id="prov-numero-doc"
                  value={formProvNumeroDoc}
                  onChange={(e) => setFormProvNumeroDoc(e.target.value)}
                  placeholder="Ej: 900123456-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prov-nombre">Nombre o Razón Social *</Label>
              <Input
                id="prov-nombre"
                value={formProvNombre}
                onChange={(e) => setFormProvNombre(e.target.value)}
                placeholder="Ej: Distribuidora del Norte S.A."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prov-email">Email *</Label>
                <Input
                  id="prov-email"
                  type="email"
                  value={formProvEmail}
                  onChange={(e) => setFormProvEmail(e.target.value)}
                  placeholder="Ej: ventas@distribuidora.com"
                />
              </div>
              <div>
                <Label htmlFor="prov-telefono">Teléfono *</Label>
                <Input
                  id="prov-telefono"
                  value={formProvTelefono}
                  onChange={(e) => setFormProvTelefono(e.target.value)}
                  placeholder="Ej: 3101234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prov-direccion">Dirección *</Label>
                <Input
                  id="prov-direccion"
                  value={formProvDireccion}
                  onChange={(e) => setFormProvDireccion(e.target.value)}
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>
              <div>
                <Label htmlFor="prov-ciudad">Ciudad *</Label>
                <Input
                  id="prov-ciudad"
                  value={formProvCiudad}
                  onChange={(e) => setFormProvCiudad(e.target.value)}
                  placeholder="Ej: Bogotá"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prov-categoria">Categoría *</Label>
                <Select value={formProvCategoria} onValueChange={setFormProvCategoria}>
                  <SelectTrigger id="prov-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prov-contacto">Persona de Contacto *</Label>
                <Input
                  id="prov-contacto"
                  value={formProvContacto}
                  onChange={(e) => setFormProvContacto(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prov-notas">Notas Adicionales</Label>
              <Textarea
                id="prov-notas"
                value={formProvNotas}
                onChange={(e) => setFormProvNotas(e.target.value)}
                placeholder="Información adicional sobre el proveedor..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProveedorModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProveedor} className="bg-blue-600 hover:bg-blue-700">
              Crear Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" aria-describedby="view-order-description">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden de Compra</DialogTitle>
            <DialogDescription id="view-order-description">
              Información completa de la orden de compra
            </DialogDescription>
          </DialogHeader>
          {selectedCompra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">N° de Orden</Label>
                  <p className="font-medium">{selectedCompra.numeroOrden}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <Badge variant="outline" className={getEstadoBadgeClass(selectedCompra.estado)}>
                    {selectedCompra.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-600">Proveedor</Label>
                  <p className="font-medium">{selectedCompra.proveedor}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Bodega</Label>
                  <p className="font-medium">{selectedCompra.bodega}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha de Orden</Label>
                  <p className="font-medium">{new Date(selectedCompra.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha de Entrega</Label>
                  <p className="font-medium">{new Date(selectedCompra.fechaEntrega).toLocaleDateString('es-CO')}</p>
                </div>
              </div>

              {/* Tabla de productos */}
              {selectedCompra.productos && selectedCompra.productos.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-gray-600 mb-2 block">Productos</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompra.productos.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                            <TableCell className="text-center">{item.cantidad}</TableCell>
                            <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° de Items:</span>
                    <span className="font-medium">{selectedCompra.items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${selectedCompra.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impuestos (19%):</span>
                    <span className="font-medium">${selectedCompra.impuestos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2 mt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-blue-600">${selectedCompra.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedCompra.observaciones && (
                <div>
                  <Label className="text-gray-600">Observaciones</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedCompra.observaciones}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cerrar
            </Button>
            {selectedCompra && (
              <Button
                onClick={() => handleDownloadPDF(selectedCompra)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[98vw] w-[1600px] max-h-[92vh] overflow-y-auto" aria-describedby="edit-order-description">
          <DialogHeader>
            <DialogTitle>Editar Orden de Compra</DialogTitle>
            <DialogDescription id="edit-order-description">
              Modifica la información de la orden de compra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 px-2">
            <div className="grid grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-numeroOrden">Número de Orden *</Label>
                <Input
                  id="edit-numeroOrden"
                  value={formData.numeroOrden}
                  disabled
                  className="bg-gray-100 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fecha">Fecha *</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fechaEntrega">Fecha de Entrega *</Label>
                <Input
                  id="edit-fechaEntrega"
                  type="date"
                  value={formData.fechaEntrega}
                  onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado *</Label>
                <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger id="edit-estado" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobada">Aprobada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-proveedor">Proveedor *</Label>
                <Select value={formData.proveedor} onValueChange={(value) => setFormData({ ...formData, proveedor: value })}>
                  <SelectTrigger id="edit-proveedor" className="h-12">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedoresActivos.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.nombre}>
                        {proveedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bodega">Bodega *</Label>
                <Select value={formData.bodega} onValueChange={(value) => setFormData({ ...formData, bodega: value })}>
                  <SelectTrigger id="edit-bodega" className="h-12">
                    <SelectValue placeholder="Selecciona una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.estado)
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
            <div className="border-t pt-6 mt-6">
              <Label className="text-lg mb-4 block">Productos de la Orden</Label>

              {/* Formulario para agregar productos */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="edit-producto">Producto</Label>
                  <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
                    <SelectTrigger id="edit-producto" className="h-12">
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
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-cantidad">Cantidad</Label>
                  <Input
                    id="edit-cantidad"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                    min="1"
                    className="h-12"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="edit-precio">Precio Unitario</Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-12"
                  />
                </div>
                <div className="col-span-3 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700 h-12"
                  >
                    <Plus size={18} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Tabla de productos agregados */}
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
                          <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                          <TableCell className="text-center">{item.cantidad}</TableCell>
                          <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarProducto(item.producto.id)}
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

              {/* Totales calculados automáticamente */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calcularTotales.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos (19%):</span>
                  <span className="font-medium">${calcularTotales.impuestos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-yellow-600">${calcularTotales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-observaciones">Observaciones</Label>
              <Textarea
                id="edit-observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Escribe cualquier observación sobre la orden de compra..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-yellow-600 hover:bg-yellow-700">
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md" aria-describedby="delete-order-description">
          <DialogHeader>
            <DialogTitle>Eliminar Orden de Compra</DialogTitle>
            <DialogDescription id="delete-order-description">
              ¿Estás seguro de que deseas eliminar esta orden de compra?
            </DialogDescription>
          </DialogHeader>
          {selectedCompra && (
            <div className="py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Esta acción no se puede deshacer. La orden <strong>{selectedCompra.numeroOrden}</strong> será eliminada permanentemente.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Proveedor:</strong> {selectedCompra.proveedor}</p>
                <p><strong>Total:</strong> ${selectedCompra.total.toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="success-order-description">
          <button
            onClick={() => setShowSuccessModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-order-description">
              La orden de compra se ha creado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Orden Creada!</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              La orden de compra se ha registrado correctamente en el sistema
            </p>
            <Button onClick={() => setShowSuccessModal(false)} className="w-full bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}