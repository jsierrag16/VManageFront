import { useState, useMemo, Fragment, useEffect } from "react";
import { useOutletContext, useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRightLeft,
  ChevronLeft,
  CheckCircle,
  X,
  Edit2,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Label } from "../../../shared/components/ui/label";
import { Badge } from "../../../shared/components/ui/badge";
import { Textarea } from "../../../shared/components/ui/textarea";
import { toast } from "sonner";
import { Producto } from "../../../data/productos";
import { Building2 } from "lucide-react";
import { useProductos } from "../../../shared/context/ProductosContext";
import type { AppOutletContext } from "@/layouts/MainLayout";

interface ProductosProps {
  triggerCreate?: number;
  onNavigateToTraslados?: () => void;
}

export default function Productos({

}: ProductosProps) {

  // ✅ Bodega viene del Outlet Context (lo que entrega MainLayout)
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const { productos, addProducto, updateProducto } = useProductos(); // 👈 PRIMERO

  const id = params.id;

  const isCrear = location.pathname.endsWith("/productos/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");

  const productoSeleccionado = useMemo(() => {
    if (!id) return null;
    return productos.find((p) => p.id === id) ?? null;
  }, [productos, id]);

  const closeToList = () => navigate("/app/productos");



  const {
    selectedBodegaNombre,
  } = useOutletContext<AppOutletContext>();

  const selectedBodega = selectedBodegaNombre; // para no reescribir todo tu código

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [lotesPages, setLotesPages] = useState<Record<string, number>>({});
  const [modalLotesPage, setModalLotesPage] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [productoParaCambioEstado, setProductoParaCambioEstado] =
    useState<Producto | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const lotesPerPage = 5;

  // Form states - Crear Producto
  const [formProductNombre, setFormProductNombre] = useState("");
  const [formProductCategoria, setFormProductCategoria] = useState("");
  const [formProductDescripcion, setFormProductDescripcion] = useState("");
  const [formProductIva, setFormProductIva] = useState("19");

  // Form states - Editar Producto
  const [editProductId, setEditProductId] = useState("");
  const [editProductNombre, setEditProductNombre] = useState("");
  const [editProductCategoria, setEditProductCategoria] = useState("");
  const [editProductDescripcion, setEditProductDescripcion] = useState("");
  const [editProductIva, setEditProductIva] = useState("19");

  // ✅ Si cambia la bodega global, sincroniza el origen

  useEffect(() => {
    if (!isEditar) return;

    if (!productoSeleccionado) {
      // si la URL tiene un id inválido, volvemos a lista
      navigate("/app/productos");
      return;
    }

    setEditProductId(productoSeleccionado.id);
    setEditProductNombre(productoSeleccionado.nombre);
    setEditProductCategoria(productoSeleccionado.categoria);
    setEditProductDescripcion(productoSeleccionado.descripcion);
    setEditProductIva(productoSeleccionado.iva?.toString() || "19");
  }, [isEditar, productoSeleccionado?.id]);

  // ✅ Filtrar productos por bodega seleccionada + búsqueda
  const filteredProductos = useMemo(() => {
    return productos
      .filter((producto) => {
        const searchLower = searchTerm.toLowerCase();

        // Filtrar lotes por bodega seleccionada (si no es "Todas las bodegas", mostrar solo esa)
        const lotesDeBodega =
          selectedBodega === "Todas las bodegas"
            ? producto.lotes
            : producto.lotes.filter((lote) => lote.bodega === selectedBodega);

        // Calcular stock de esta bodega para búsqueda
        const stockBodega = lotesDeBodega.reduce(
          (sum, lote) => sum + lote.cantidadDisponible,
          0
        );

        // Si no hay término de búsqueda, igual filtramos por bodega (via map final)
        if (!searchTerm.trim()) {
          // OJO: si NO quieres mostrar productos que no tengan lotes en esa bodega, activa esto:
          // return selectedBodega === "Todas las bodegas" ? true : lotesDeBodega.length > 0;
          return true;
        }

        // Buscar en campos del producto
        const productoMatch =
          producto.id.toLowerCase().includes(searchLower) ||
          producto.nombre.toLowerCase().includes(searchLower) ||
          producto.categoria.toLowerCase().includes(searchLower) ||
          producto.descripcion.toLowerCase().includes(searchLower) ||
          producto.stockTotal.toString().includes(searchLower) ||
          stockBodega.toString().includes(searchLower) ||
          (producto.estado ? "activo" : "inactivo").includes(searchLower);

        // Buscar en campos de los lotes de esta bodega
        const lotesMatch =
          lotesDeBodega.length > 0 &&
          lotesDeBodega.some(
            (lote) =>
              lote.numeroLote.toLowerCase().includes(searchLower) ||
              lote.cantidadDisponible.toString().includes(searchLower) ||
              lote.fechaVencimiento.includes(searchLower) ||
              lote.bodega.toLowerCase().includes(searchLower)
          );

        return productoMatch || lotesMatch;
      })
      .map((producto) => {
        const lotesDeBodega =
          selectedBodega === "Todas las bodegas"
            ? producto.lotes
            : producto.lotes.filter((lote) => lote.bodega === selectedBodega);

        const stockBodega = lotesDeBodega.reduce(
          (sum, lote) => sum + lote.cantidadDisponible,
          0
        );

        return {
          ...producto,
          lotes: lotesDeBodega,
          stockTotal: stockBodega,
        };
      });
  }, [productos, searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, endIndex);

  // Paginación de lotes en modal
  const modalLotes = productoSeleccionado?.lotes || [];
  const totalModalLotesPages = Math.ceil(modalLotes.length / lotesPerPage);
  const modalLotesStartIndex = (modalLotesPage - 1) * lotesPerPage;
  const modalLotesEndIndex = modalLotesStartIndex + lotesPerPage;
  const currentModalLotes = modalLotes.slice(
    modalLotesStartIndex,
    modalLotesEndIndex
  );

  // ✅ Esto NO es useMemo, es efecto (reset paginación si cambian filtros)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) newExpanded.delete(productId);
    else newExpanded.add(productId);
    setExpandedRows(newExpanded);
  };

  const handleView = (producto: Producto) => {
    navigate(`/app/productos/${producto.id}/ver`);
  };


  const handleToggleEstado = (productId: string) => {
    const producto = productos.find((p) => p.id === productId);
    if (producto) {
      setProductoParaCambioEstado(producto);
      setShowConfirmEstadoModal(true);
    }
  };

  const handleConfirmEstado = () => {
    if (!productoParaCambioEstado) return;

    updateProducto(productoParaCambioEstado.id, {
      ...productoParaCambioEstado,
      estado: !productoParaCambioEstado.estado,
    });

    toast.success(
      `Producto ${productoParaCambioEstado.estado ? "desactivado" : "activado"
      } exitosamente`
    );

    setShowConfirmEstadoModal(false);
    setProductoParaCambioEstado(null);
  };


  const handleNuevoProducto = () => {
    navigate("/app/productos/crear");
  };

  const handleEditProducto = (producto: Producto) => {
    navigate(`/app/productos/${producto.id}/editar`);
  };

  const handleTrasladar = () => {
    navigate("/app/traslados/crear", {
      state: { bodegaOrigen: selectedBodega }, // ✅ para preseleccionar
    });
  };

  const validateProductForm = () => {
    if (
      !formProductNombre.trim() ||
      !formProductCategoria.trim() ||
      !formProductDescripcion.trim()
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return false;
    }

    if (formProductNombre.trim().length < 3) {
      toast.error("El nombre del producto debe tener al menos 3 caracteres");
      return false;
    }

    if (formProductDescripcion.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(formProductNombre)) {
      toast.error("El nombre contiene caracteres no permitidos");
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(formProductDescripcion)) {
      toast.error("La descripción contiene caracteres no permitidos");
      return false;
    }

    if (/^\d+$/.test(formProductNombre.trim())) {
      toast.error("El nombre del producto no puede contener solo números");
      return false;
    }

    const nombreExiste = productos.some(
      (p) => p.nombre.toLowerCase() === formProductNombre.trim().toLowerCase()
    );

    if (nombreExiste) {
      toast.error("Ya existe un producto con este nombre");
      return false;
    }

    return true;
  };

  const validateEditProductForm = () => {
    if (
      !editProductNombre.trim() ||
      !editProductCategoria.trim() ||
      !editProductDescripcion.trim()
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return false;
    }

    if (editProductNombre.trim().length < 3) {
      toast.error("El nombre del producto debe tener al menos 3 caracteres");
      return false;
    }

    if (editProductDescripcion.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(editProductNombre)) {
      toast.error("El nombre contiene caracteres no permitidos");
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(editProductDescripcion)) {
      toast.error("La descripción contiene caracteres no permitidos");
      return false;
    }

    if (/^\d+$/.test(editProductNombre.trim())) {
      toast.error("El nombre del producto no puede contener solo números");
      return false;
    }

    const nombreExiste = productos.some(
      (p) =>
        p.id !== editProductId &&
        p.nombre.toLowerCase() === editProductNombre.trim().toLowerCase()
    );

    if (nombreExiste) {
      toast.error("Ya existe un producto con este nombre");
      return false;
    }

    return true;
  };

  const confirmCreateProduct = () => {
    if (!validateProductForm()) return;

    const newProduct: Producto = {
      id: `PROD-${String(productos.length + 1).padStart(3, "0")}`,
      nombre: formProductNombre.trim(),
      categoria: formProductCategoria.trim(),
      descripcion: formProductDescripcion.trim(),
      iva: parseFloat(formProductIva),
      stockTotal: 0,
      lotes: [],
      estado: true,
      codigoBarras: "",
    };

    addProducto(newProduct);

    // ✅ Solo mostramos éxito
    setShowSuccessModal(true);
  };


  const confirmEditProduct = () => {
    if (!validateEditProductForm()) return;

    const productoActualizado = productos.find((p) => p.id === editProductId);
    if (productoActualizado) {
      updateProducto(editProductId, {
        ...productoActualizado,
        nombre: editProductNombre.trim(),
        categoria: editProductCategoria.trim(),
        descripcion: editProductDescripcion.trim(),
        iva: parseFloat(editProductIva),
      });
    }

    // (opcional) aquí ya puedes hacer toast/cerrar/modal/navegar
    toast.success("Producto actualizado exitosamente");
    closeToList(); // si estás usando la navegación por ruta
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleLotesPageChange = (productId: string, page: number) => {
    setLotesPages({ ...lotesPages, [productId]: page });
  };

  const handleModalLotesPageChange = (page: number) => setModalLotesPage(page);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // 🔥 volver a la lista
    navigate("/app/productos");
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getVencimientoColor = (fecha: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diasDiferencia = Math.floor(
      (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDiferencia < 0) return "text-red-600 font-semibold";
    if (diasDiferencia <= 30) return "text-orange-600 font-semibold";
    if (diasDiferencia <= 90) return "text-yellow-600";
    return "text-gray-700";
  };

  const getCantidadColor = (cantidad: number) => {
    return cantidad < 50
      ? "text-red-600 font-semibold"
      : "text-gray-900 font-semibold";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Existencias</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Administra el inventario y las existencias de productos
          </p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {selectedBodega}
          </Badge>
        </div>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleNuevoProducto}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Nuevo Producto
        </Button>
        <Button
          onClick={handleTrasladar}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <ArrowRightLeft size={18} className="mr-2" />
          Trasladar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">IVA</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-40">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProductos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                currentProductos.map((producto, index) => {
                  const lotesPage = lotesPages[producto.id] || 1;
                  const totalLotesPages = Math.ceil(
                    producto.lotes.length / lotesPerPage
                  );
                  const lotesStartIndex = (lotesPage - 1) * lotesPerPage;
                  const lotesEndIndex = lotesStartIndex + lotesPerPage;
                  const currentLotes = producto.lotes.slice(
                    lotesStartIndex,
                    lotesEndIndex
                  );

                  return (
                    <Fragment key={producto.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {producto.nombre}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {producto.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-gray-900">
                            {producto.iva || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              producto.stockTotal < 100
                                ? "text-red-600 font-semibold"
                                : "font-semibold text-gray-900"
                            }
                          >
                            {producto.stockTotal}
                          </span>
                          {producto.stockTotal < 100 && (
                            <span className="block text-xs text-red-600">
                              Stock bajo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEstado(producto.id)}
                            className={
                              producto.estado
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {producto.estado ? "Activo" : "Inactivo"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(producto)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProducto(producto)}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Editar producto"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleRow(producto.id)}
                              className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                              title={
                                expandedRows.has(producto.id)
                                  ? "Contraer"
                                  : "Expandir lotes"
                              }
                            >
                              {expandedRows.has(producto.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Fila expandida */}
                      {expandedRows.has(producto.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Lotes Disponibles ({producto.lotes.length}{" "}
                                total{producto.lotes.length !== 1 ? "es" : ""})
                              </h4>
                              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100">
                                      <TableHead className="text-xs">
                                        N° Lote
                                      </TableHead>
                                      <TableHead className="text-xs text-center">
                                        Cantidad por Lote
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Fecha de Vencimiento
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Bodega Asignada
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {producto.lotes.length === 0 ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={4}
                                          className="text-center py-4 text-gray-500 text-sm"
                                        >
                                          No hay lotes registrados
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      currentLotes.map((lote) => (
                                        <TableRow
                                          key={lote.id}
                                          className="text-sm"
                                        >
                                          <TableCell className="font-mono">
                                            {lote.numeroLote}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <span
                                              className={getCantidadColor(
                                                lote.cantidadDisponible
                                              )}
                                            >
                                              {lote.cantidadDisponible}
                                            </span>
                                            {lote.cantidadDisponible < 50 && (
                                              <span className="block text-xs text-red-600">
                                                Stock bajo
                                              </span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={getVencimientoColor(
                                                lote.fechaVencimiento
                                              )}
                                            >
                                              {formatFecha(
                                                lote.fechaVencimiento
                                              )}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {lote.bodega}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>

                                {/* Paginación lotes */}
                                {producto.lotes.length > lotesPerPage && (
                                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                                    <div className="text-xs text-gray-600">
                                      Mostrando {lotesStartIndex + 1} -{" "}
                                      {Math.min(
                                        lotesEndIndex,
                                        producto.lotes.length
                                      )}{" "}
                                      de {producto.lotes.length} lotes
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleLotesPageChange(
                                            producto.id,
                                            lotesPage - 1
                                          )
                                        }
                                        disabled={lotesPage === 1}
                                        className="h-7 text-xs"
                                      >
                                        <ChevronLeft size={14} />
                                        Anterior
                                      </Button>
                                      <div className="flex items-center gap-1">
                                        {Array.from(
                                          { length: totalLotesPages },
                                          (_, i) => i + 1
                                        ).map((page) => (
                                          <Button
                                            key={page}
                                            variant={
                                              lotesPage === page
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              handleLotesPageChange(
                                                producto.id,
                                                page
                                              )
                                            }
                                            className="h-7 w-7 p-0 text-xs"
                                          >
                                            {page}
                                          </Button>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleLotesPageChange(
                                            producto.id,
                                            lotesPage + 1
                                          )
                                        }
                                        disabled={lotesPage === totalLotesPages}
                                        className="h-7 text-xs"
                                      >
                                        Siguiente
                                        <ChevronRight size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                )}
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

        {/* Paginación principal */}
        {filteredProductos.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredProductos.length)} de{" "}
              {filteredProductos.length} productos
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

      {/* Modal Ver Detalles */}
      <Dialog
        open={isVer}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-7xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          onPointerDownOutside={(e: any) => e.preventDefault()}
          aria-describedby="dialog-description"
        >

          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription id="dialog-description">
              Información completa del producto y sus existencias
            </DialogDescription>
          </DialogHeader>

          {productoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-mono font-semibold">{productoSeleccionado.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={
                        productoSeleccionado.estado
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {productoSeleccionado.estado ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Nombre</Label>
                <p className="font-semibold">{productoSeleccionado.nombre}</p>
              </div>

              <div>
                <Label className="text-gray-500">Categoría</Label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {productoSeleccionado.categoria}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Descripción</Label>
                <p className="text-gray-700">{productoSeleccionado.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">IVA</Label>
                  <p className="font-semibold text-lg">
                    {productoSeleccionado.iva || 0}%
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Stock Total</Label>
                  <p className="font-semibold text-lg">
                    {productoSeleccionado.stockTotal} unidades
                  </p>
                </div>
              </div>

              {/* Lista de lotes */}
              <div>
                <Label className="text-gray-500 mb-2 block">
                  Lotes Disponibles ({modalLotes.length} total
                  {modalLotes.length !== 1 ? "es" : ""})
                </Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">N° Lote</TableHead>
                        <TableHead className="text-xs text-center">
                          Cantidad
                        </TableHead>
                        <TableHead className="text-xs">Vencimiento</TableHead>
                        <TableHead className="text-xs">Bodega</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalLotes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-4 text-gray-500 text-sm"
                          >
                            No hay lotes registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentModalLotes.map((lote) => (
                          <TableRow key={lote.id} className="text-sm">
                            <TableCell className="font-mono">
                              {lote.numeroLote}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={getCantidadColor(
                                  lote.cantidadDisponible
                                )}
                              >
                                {lote.cantidadDisponible}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={getVencimientoColor(
                                  lote.fechaVencimiento
                                )}
                              >
                                {formatFecha(lote.fechaVencimiento)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {lote.bodega}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Paginación de lotes en modal */}
                  {modalLotes.length > lotesPerPage && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-600">
                        Mostrando {modalLotesStartIndex + 1} -{" "}
                        {Math.min(modalLotesEndIndex, modalLotes.length)} de{" "}
                        {modalLotes.length} lotes
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleModalLotesPageChange(modalLotesPage - 1)
                          }
                          disabled={modalLotesPage === 1}
                          className="h-7 text-xs"
                        >
                          <ChevronLeft size={14} />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalModalLotesPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                modalLotesPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handleModalLotesPageChange(page)}
                              className="h-7 w-7 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleModalLotesPageChange(modalLotesPage + 1)
                          }
                          disabled={modalLotesPage === totalModalLotesPages}
                          className="h-7 text-xs"
                        >
                          Siguiente
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeToList} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Producto */}
      <Dialog
        open={isCrear}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="create-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription id="create-product-description">
              Registra un nuevo producto en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="product-nombre">Nombre del Producto *</Label>
              <Input
                id="product-nombre"
                value={formProductNombre}
                onChange={(e) => setFormProductNombre(e.target.value)}
                placeholder="Ej: Paracetamol 500mg"
              />
            </div>

            <div>
              <Label htmlFor="product-categoria">Categoría *</Label>
              <Select
                value={formProductCategoria}
                onValueChange={setFormProductCategoria}
              >
                <SelectTrigger id="product-categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                  <SelectItem value="Equipos Médicos">Equipos Médicos</SelectItem>
                  <SelectItem value="Material de Curación">
                    Material de Curación
                  </SelectItem>
                  <SelectItem value="Alimentos">Alimentos</SelectItem>
                  <SelectItem value="Suplementos">Suplementos</SelectItem>
                  <SelectItem value="Insumos Veterinarios">
                    Insumos Veterinarios
                  </SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product-descripcion">Descripción *</Label>
              <Textarea
                id="product-descripcion"
                value={formProductDescripcion}
                onChange={(e) => setFormProductDescripcion(e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="product-iva">IVA (%) *</Label>
              <Select value={formProductIva} onValueChange={setFormProductIva}>
                <SelectTrigger id="product-iva">
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="19">19%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreateProduct}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Producto */}
      <Dialog
        open={isEditar}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="edit-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription id="edit-product-description">
              Modifica la información del producto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-nombre">Nombre del Producto *</Label>
              <Input
                id="edit-product-nombre"
                value={editProductNombre}
                onChange={(e) => setEditProductNombre(e.target.value)}
                placeholder="Ej: Paracetamol 500mg"
              />
            </div>

            <div>
              <Label htmlFor="edit-product-categoria">Categoría *</Label>
              <Select
                value={editProductCategoria}
                onValueChange={setEditProductCategoria}
              >
                <SelectTrigger id="edit-product-categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                  <SelectItem value="Equipos Médicos">Equipos Médicos</SelectItem>
                  <SelectItem value="Material de Curación">
                    Material de Curación
                  </SelectItem>
                  <SelectItem value="Alimentos">Alimentos</SelectItem>
                  <SelectItem value="Suplementos">Suplementos</SelectItem>
                  <SelectItem value="Insumos Veterinarios">
                    Insumos Veterinarios
                  </SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-product-descripcion">Descripción *</Label>
              <Textarea
                id="edit-product-descripcion"
                value={editProductDescripcion}
                onChange={(e) => setEditProductDescripcion(e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-product-iva">IVA (%) *</Label>
              <Select value={editProductIva} onValueChange={setEditProductIva}>
                <SelectTrigger id="edit-product-iva">
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="19">19%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEditProduct}
              className="bg-green-600 hover:bg-green-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent
          className="max-w-lg"
          aria-describedby="confirm-estado-description"
        >
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este producto?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Producto:</span>
              <span className="font-medium">
                {productoParaCambioEstado?.nombre}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <Badge
                variant="outline"
                className={
                  productoParaCambioEstado?.estado
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {productoParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <Badge
                variant="outline"
                className={
                  !productoParaCambioEstado?.estado
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {!productoParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmEstadoModal(false)}
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

      {/* Modal Registro Exitoso */}
      <Dialog
        open={showSuccessModal}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) handleSuccessModalClose();
        }}
      >
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          aria-describedby="success-description"
        >
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription id="success-description" className="sr-only">
              La operación se ha completado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Registro Exitoso!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              La operación se ha completado correctamente
            </p>
            <Button
              onClick={handleSuccessModalClose}
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
