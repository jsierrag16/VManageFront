import { useState, useMemo, Fragment, useEffect, useCallback } from "react";
import {
  useOutletContext,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
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
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import { Label } from "../../../../shared/components/ui/label";
import { Badge } from "../../../../shared/components/ui/badge";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import type { AppOutletContext } from "@/layouts/MainLayout";

import {
  createProducto,
  updateProducto,
  cambiarEstadoProducto,
  getProductosVista,
} from "../services/productos.services";
import {
  getCategoriasProducto,
  getIvas,
} from "../services/productos-catalogos.service";
import {
  productoFormToCreatePayload,
  productoFormToUpdatePayload,
  categoriaProductoBackendToOption,
  ivaBackendToOption,
  productosVistaBackendToUI,
  type ProductoVistaUI,
  type OpcionCatalogo,
} from "../services/productos.mapper";

interface ProductosProps {
  triggerCreate?: number;
  onNavigateToTraslados?: () => void;
}

export default function Productos({
  triggerCreate,
  onNavigateToTraslados,
}: ProductosProps) {
  
  // =========================================================
  // Contexto, navegación y permisos
  // =========================================================
  const { tienePermiso } = useAuth();

  const location = useLocation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { selectedBodegaNombre, selectedBodegaId } =
    useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // =========================================================
  // Estados del módulo
  // =========================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lotesPages, setLotesPages] = useState<Record<string, number>>({});
  const [modalLotesPage, setModalLotesPage] = useState(1);

  const [productos, setProductos] = useState<ProductoVistaUI[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [productoParaCambioEstado, setProductoParaCambioEstado] =
    useState<ProductoVistaUI | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const lotesPerPage = 5;

  // =========================================================
  // Estados del formulario
  // =========================================================
  const [formNombre, setFormNombre] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState<number | "">("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formIvaId, setFormIvaId] = useState<number | "">("");

  // =========================================================
  // Estados de catálogos
  // =========================================================
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<OpcionCatalogo[]>([]);
  const [ivasCatalogo, setIvasCatalogo] = useState<OpcionCatalogo[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  // =========================================================
  // Permisos
  // =========================================================
  const canCreateProductos = tienePermiso("existencias", "productos", "crear");
  const canEditProductos = tienePermiso("existencias", "productos", "editar");
  const canChangeEstadoProductos = tienePermiso(
    "existencias",
    "productos",
    "cambiarEstado"
  );
  const canCreateTraslados = tienePermiso("existencias", "traslados", "crear");

  // =========================================================
  // Estados de errores y touched
  // =========================================================
  const [errors, setErrors] = useState({
    nombre: "",
    categoria: "",
    descripcion: "",
    iva: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
    categoria: false,
    descripcion: false,
    iva: false,
  });

  // =========================================================
  // Estados de proceso async
  // =========================================================
  const [isCreatingProducto, setIsCreatingProducto] = useState(false);
  const [isUpdatingProducto, setIsUpdatingProducto] = useState(false);
  const [isChangingEstadoProducto, setIsChangingEstadoProducto] =
    useState(false);

  // =========================================================
  // Flags de ruta
  // =========================================================
  const id = params.id ? Number(params.id) : null;

  const isCrear = location.pathname.endsWith("/productos/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");

  // =========================================================
  // Datos derivados / useMemo
  // =========================================================

  const productoSeleccionado = useMemo(() => {
    if (!id || Number.isNaN(id)) return null;
    return productos.find((p) => p.id === id) ?? null;
  }, [productos, id]);

  const filteredProductos = useMemo(() => {
    return productos
      .filter((producto) => {
        const searchLower = searchTerm.toLowerCase();

        const lotesDeBodega =
          selectedBodega === "Todas las bodegas"
            ? producto.lotes
            : producto.lotes.filter((lote) => lote.bodega === selectedBodega);

        const stockBodega = lotesDeBodega.reduce(
          (sum, lote) => sum + lote.cantidadDisponible,
          0
        );

        if (!searchTerm.trim()) {
          return true;
        }

        const productoMatch =
          producto.nombre.toLowerCase().includes(searchLower) ||
          producto.categoria.toLowerCase().includes(searchLower) ||
          producto.descripcion.toLowerCase().includes(searchLower) ||
          producto.stockTotal.toString().includes(searchLower) ||
          stockBodega.toString().includes(searchLower) ||
          (producto.estado ? "activo" : "inactivo").includes(searchLower);

        const lotesMatch =
          lotesDeBodega.length > 0 &&
          lotesDeBodega.some(
            (lote) =>
              lote.numeroLote.toLowerCase().includes(searchLower) ||
              lote.cantidadDisponible.toString().includes(searchLower) ||
              lote.fechaVencimiento.toLowerCase().includes(searchLower) ||
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

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, endIndex);

  const modalLotes = productoSeleccionado?.lotes || [];
  const totalModalLotesPages = Math.ceil(modalLotes.length / lotesPerPage);
  const modalLotesStartIndex = (modalLotesPage - 1) * lotesPerPage;
  const modalLotesEndIndex = modalLotesStartIndex + lotesPerPage;
  const currentModalLotes = modalLotes.slice(
    modalLotesStartIndex,
    modalLotesEndIndex
  );

  // =========================================================
  // Funciones de carga
  // =========================================================
  const loadProductos = useCallback(async () => {
    try {
      setIsLoadingProductos(true);

      const response =
        selectedBodegaNombre !== "Todas las bodegas" && selectedBodegaId
          ? await getProductosVista("active", selectedBodegaId)
          : await getProductosVista("all");

      const mapped = productosVistaBackendToUI(response);
      setProductos(mapped);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("No se pudieron cargar los productos");
    } finally {
      setIsLoadingProductos(false);
    }
  }, [selectedBodegaNombre, selectedBodegaId]);

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      const [categorias, ivas] = await Promise.all([
        getCategoriasProducto(),
        getIvas(),
      ]);

      setCategoriasCatalogo(categorias.map(categoriaProductoBackendToOption));
      setIvasCatalogo(ivas.map(ivaBackendToOption));
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      toast.error("No se pudieron cargar los catálogos");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const closeToList = useCallback(() => {
    navigate("/app/productos");
  }, [navigate]);

  const resetForm = useCallback(() => {
    setFormNombre("");
    setFormCategoriaId("");
    setFormDescripcion("");
    setFormIvaId("");

    setErrors({
      nombre: "",
      categoria: "",
      descripcion: "",
      iva: "",
    });

    setTouched({
      nombre: false,
      categoria: false,
      descripcion: false,
      iva: false,
    });
  }, []);

  // =========================================================
  // Efectos
  // =========================================================
  useEffect(() => {
    loadProductos();
    loadCatalogos();
  }, [loadProductos, loadCatalogos]);

  useEffect(() => {
    if (!triggerCreate) return;
    resetForm();
    navigate("/app/productos/crear");
  }, [triggerCreate, resetForm, navigate]);

  useEffect(() => {
    if (!isEditar) return;

    if (!productoSeleccionado) {
      navigate("/app/productos");
      return;
    }

    setFormNombre(productoSeleccionado.nombre);
    setFormCategoriaId(productoSeleccionado.raw.id_categoria_producto);
    setFormDescripcion(productoSeleccionado.descripcion);
    setFormIvaId(productoSeleccionado.raw.id_iva);

    setErrors({
      nombre: "",
      categoria: "",
      descripcion: "",
      iva: "",
    });

    setTouched({
      nombre: false,
      categoria: false,
      descripcion: false,
      iva: false,
    });
  }, [isEditar, productoSeleccionado, navigate]);

  useEffect(() => {
    if (!isCrear) return;
    resetForm();
  }, [isCrear, resetForm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  useEffect(() => {
    setModalLotesPage(1);
  }, [productoSeleccionado?.id]);

  // =========================================================
  // Validaciones y helpers
  // =========================================================
  const validateNombre = (value: string) => {
    if (!value.trim()) return "El nombre del producto es requerido";
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 150) return "Máximo 150 caracteres";

    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s().,%+\-/]+$/;
    if (!validPattern.test(value)) {
      return "El nombre contiene caracteres no permitidos";
    }

    return "";
  };

  const validateCategoria = (value: number | "") => {
    if (!value) return "La categoría es requerida";
    return "";
  };

  const validateDescripcion = (value: string) => {
    if (!value.trim()) return "La descripción es requerida";
    if (value.trim().length < 10) return "Mínimo 10 caracteres";
    if (value.trim().length > 255) return "Máximo 255 caracteres";

    if (/[<>{}[\]\\]/.test(value)) {
      return "La descripción contiene caracteres no permitidos";
    }

    return "";
  };

  const validateIva = (value: number | "") => {
    if (!value) return "El IVA es requerido";
    return "";
  };

  const validateUniqueNombre = (value: string) => {
    const existe = productos.some((producto) => {
      if (isEditar && productoSeleccionado && producto.id === productoSeleccionado.id) {
        return false;
      }

      return producto.nombre.trim().toLowerCase() === value.trim().toLowerCase();
    });

    return existe ? "Ya existe un producto con este nombre" : "";
  };

  const validateForm = () => {
    setTouched({
      nombre: true,
      categoria: true,
      descripcion: true,
      iva: true,
    });

    const nombreErrorBase = validateNombre(formNombre);
    const nombreErrorUnique = nombreErrorBase ? "" : validateUniqueNombre(formNombre);
    const nombreError = nombreErrorBase || nombreErrorUnique;

    const categoriaError = validateCategoria(formCategoriaId);
    const descripcionError = validateDescripcion(formDescripcion);
    const ivaError = validateIva(formIvaId);

    setErrors({
      nombre: nombreError,
      categoria: categoriaError,
      descripcion: descripcionError,
      iva: ivaError,
    });

    if (nombreError || categoriaError || descripcionError || ivaError) {
      toast.error("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return "Sin fecha";

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getVencimientoColor = (fecha: string) => {
    if (!fecha) return "text-gray-700";

    const hoy = new Date();
    const vencimiento = new Date(fecha);

    if (Number.isNaN(vencimiento.getTime())) return "text-gray-700";

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

  const getEstadoBadgeClass = (estado: boolean) => {
    return estado
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  // =========================================================
  // Handlers de formulario
  // =========================================================
  const handleNombreChange = (value: string) => {
    setFormNombre(value);

    if (touched.nombre) {
      const nombreErrorBase = validateNombre(value);
      const nombreErrorUnique = nombreErrorBase ? "" : validateUniqueNombre(value);

      setErrors((prev) => ({
        ...prev,
        nombre: nombreErrorBase || nombreErrorUnique,
      }));
    }
  };

  const handleCategoriaChange = (value: string) => {
    const parsed = value ? Number(value) : "";
    setFormCategoriaId(parsed);

    if (touched.categoria) {
      setErrors((prev) => ({
        ...prev,
        categoria: validateCategoria(parsed),
      }));
    }
  };

  const handleDescripcionChange = (value: string) => {
    setFormDescripcion(value);

    if (touched.descripcion) {
      setErrors((prev) => ({
        ...prev,
        descripcion: validateDescripcion(value),
      }));
    }
  };

  const handleIvaChange = (value: string) => {
    const parsed = value ? Number(value) : "";
    setFormIvaId(parsed);

    if (touched.iva) {
      setErrors((prev) => ({
        ...prev,
        iva: validateIva(parsed),
      }));
    }
  };

  const handleNombreBlur = () => {
    setTouched((prev) => ({ ...prev, nombre: true }));

    const nombreErrorBase = validateNombre(formNombre);
    const nombreErrorUnique = nombreErrorBase ? "" : validateUniqueNombre(formNombre);

    setErrors((prev) => ({
      ...prev,
      nombre: nombreErrorBase || nombreErrorUnique,
    }));
  };

  const handleCategoriaBlur = () => {
    setTouched((prev) => ({ ...prev, categoria: true }));
    setErrors((prev) => ({
      ...prev,
      categoria: validateCategoria(formCategoriaId),
    }));
  };

  const handleDescripcionBlur = () => {
    setTouched((prev) => ({ ...prev, descripcion: true }));
    setErrors((prev) => ({
      ...prev,
      descripcion: validateDescripcion(formDescripcion),
    }));
  };

  const handleIvaBlur = () => {
    setTouched((prev) => ({ ...prev, iva: true }));
    setErrors((prev) => ({
      ...prev,
      iva: validateIva(formIvaId),
    }));
  };

  // =========================================================
  // Handlers de navegación
  // =========================================================
  const handleView = (producto: ProductoVistaUI) => {
    navigate(`/app/productos/${producto.id}/ver`);
  };

  const handleNuevoProducto = () => {
    if (!canCreateProductos) {
      toast.error("No tienes permiso para crear productos");
      return;
    }

    resetForm();
    navigate("/app/productos/crear");
  };

  const handleEditProducto = (producto: ProductoVistaUI) => {
    if (!canEditProductos) {
      toast.error("No tienes permiso para editar productos");
      return;
    }

    navigate(`/app/productos/${producto.id}/editar`);
  };

  const handleTrasladar = () => {
    if (!canCreateTraslados) {
      toast.error("No tienes permiso para crear traslados");
      return;
    }

    if (onNavigateToTraslados) {
      onNavigateToTraslados();
      return;
    }

    navigate("/app/traslados/crear", {
      state: { bodegaOrigen: selectedBodega },
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLotesPageChange = (productId: number, page: number) => {
    setLotesPages((prev) => ({
      ...prev,
      [String(productId)]: page,
    }));
  };

  const handleModalLotesPageChange = (page: number) => {
    setModalLotesPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate("/app/productos");
  };

  // =========================================================
  // Handlers de acciones / modales
  // =========================================================
  const toggleRow = (productId: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }

    setExpandedRows(newExpanded);
  };

  const handleToggleEstado = (producto: ProductoVistaUI) => {
    if (!canChangeEstadoProductos) {
      toast.error("No tienes permiso para cambiar el estado de productos");
      return;
    }

    setProductoParaCambioEstado(producto);
    setShowConfirmEstadoModal(true);
  };

  // =========================================================
  // Confirmaciones / acciones async
  // =========================================================
  const confirmCreateProduct = async () => {
    if (!canCreateProductos) {
      toast.error("No tienes permiso para crear productos");
      return;
    }

    if (isCreatingProducto) return;
    if (!validateForm()) return;
    if (!formCategoriaId || !formIvaId) {
      toast.error("Debes seleccionar categoría e IVA");
      return;
    }

    try {
      setIsCreatingProducto(true);

      const payload = productoFormToCreatePayload({
        nombre: formNombre,
        descripcion: formDescripcion,
        idCategoria: Number(formCategoriaId),
        idIva: Number(formIvaId),
        estado: true,
      });

      await createProducto(payload);
      await loadProductos();

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error creando producto:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo crear el producto"
      );
    } finally {
      setIsCreatingProducto(false);
    }
  };

  const confirmEditProduct = async () => {
    if (!canEditProductos) {
      toast.error("No tienes permiso para editar productos");
      return;
    }

    if (isUpdatingProducto) return;
    if (!productoSeleccionado) return;
    if (!validateForm()) return;
    if (!formCategoriaId || !formIvaId) {
      toast.error("Debes seleccionar categoría e IVA");
      return;
    }

    try {
      setIsUpdatingProducto(true);

      const payload = productoFormToUpdatePayload({
        nombre: formNombre,
        descripcion: formDescripcion,
        idCategoria: Number(formCategoriaId),
        idIva: Number(formIvaId),
        estado: productoSeleccionado.estado,
      });

      await updateProducto(productoSeleccionado.id, payload);
      await loadProductos();

      toast.success("Producto actualizado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error actualizando producto:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo actualizar el producto"
      );
    } finally {
      setIsUpdatingProducto(false);
    }
  };

  const handleConfirmEstado = async () => {
    if (!canChangeEstadoProductos) {
      toast.error("No tienes permiso para cambiar el estado de productos");
      return;
    }

    if (isChangingEstadoProducto) return;
    if (!productoParaCambioEstado) return;

    try {
      setIsChangingEstadoProducto(true);

      await cambiarEstadoProducto(
        productoParaCambioEstado.id,
        !productoParaCambioEstado.estado
      );

      await loadProductos();

      toast.success(
        `Producto ${productoParaCambioEstado.estado ? "desactivado" : "activado"
        } exitosamente`
      );
    } catch (error: any) {
      console.error("Error cambiando estado del producto:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo cambiar el estado del producto"
      );
    } finally {
      setIsChangingEstadoProducto(false);
      setShowConfirmEstadoModal(false);
      setProductoParaCambioEstado(null);
    }
  };

  // =========================================================
  // Return
  // =========================================================
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

        {canCreateProductos && (
          <Button
            onClick={handleNuevoProducto}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Producto
          </Button>
        )}

        {canCreateTraslados && (
          <Button
            onClick={handleTrasladar}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ArrowRightLeft size={18} className="mr-2" />
            Trasladar
          </Button>
        )}
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
              {isLoadingProductos ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    Cargando productos...
                  </TableCell>
                </TableRow>
              ) : currentProductos.length === 0 ? (
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
                  const lotesPage = lotesPages[String(producto.id)] || 1;
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
                          {canChangeEstadoProductos ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleEstado(producto)}
                              className={
                                producto.estado
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }
                            >
                              {producto.estado ? "Activo" : "Inactivo"}
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className={getEstadoBadgeClass(producto.estado)}
                            >
                              {producto.estado ? "Activo" : "Inactivo"}
                            </Badge>
                          )}
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

                            {canEditProductos && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProducto(producto)}
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Editar producto"
                              >
                                <Edit2 size={16} />
                              </Button>
                            )}

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
                          <TableCell colSpan={7} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Lotes Disponibles ({producto.lotes.length} total
                                {producto.lotes.length !== 1 ? "es" : ""})
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
                                              {formatFecha(lote.fechaVencimiento)}
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
      </div>

      {/* Paginación principal */}
      <div>
        {!isLoadingProductos && filteredProductos.length > 0 && (
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
                  <p className="font-semibold">{productoSeleccionado.id}</p>
                </div>

                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={getEstadoBadgeClass(productoSeleccionado.estado)}
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
          className="max-w-2xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="create-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
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
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Paracetamol 500mg"
                className={errors.nombre && touched.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product-categoria">Categoría *</Label>
              <Select
                value={formCategoriaId === "" ? "" : String(formCategoriaId)}
                onValueChange={handleCategoriaChange}
                onOpenChange={(open: boolean) => !open && handleCategoriaBlur()}
                disabled={isLoadingCatalogos}
              >
                <SelectTrigger
                  id="product-categoria"
                  className={
                    errors.categoria && touched.categoria ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasCatalogo.map((categoria) => (
                    <SelectItem key={categoria.id} value={String(categoria.id)}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && touched.categoria && (
                <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product-descripcion">Descripción *</Label>
              <Textarea
                id="product-descripcion"
                value={formDescripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                onBlur={handleDescripcionBlur}
                placeholder="Descripción detallada del producto"
                rows={4}
                className={
                  errors.descripcion && touched.descripcion ? "border-red-500" : ""
                }
              />
              {errors.descripcion && touched.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product-iva">IVA (%) *</Label>
              <Select
                value={formIvaId === "" ? "" : String(formIvaId)}
                onValueChange={handleIvaChange}
                onOpenChange={(open: boolean) => !open && handleIvaBlur()}
                disabled={isLoadingCatalogos}
              >
                <SelectTrigger
                  id="product-iva"
                  className={errors.iva && touched.iva ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  {ivasCatalogo.map((iva) => (
                    <SelectItem key={iva.id} value={String(iva.id)}>
                      {iva.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.iva && touched.iva && (
                <p className="text-red-500 text-sm mt-1">{errors.iva}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeToList}
              disabled={isCreatingProducto}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCreateProduct}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCreatingProducto}
            >
              {isCreatingProducto ? "Creando..." : "Crear Producto"}
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
          className="max-w-2xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="edit-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
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
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Paracetamol 500mg"
                className={errors.nombre && touched.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-product-categoria">Categoría *</Label>
              <Select
                value={formCategoriaId === "" ? "" : String(formCategoriaId)}
                onValueChange={handleCategoriaChange}
                onOpenChange={(open: boolean) => !open && handleCategoriaBlur()}
                disabled={isLoadingCatalogos}
              >
                <SelectTrigger
                  id="edit-product-categoria"
                  className={
                    errors.categoria && touched.categoria ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasCatalogo.map((categoria) => (
                    <SelectItem key={categoria.id} value={String(categoria.id)}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && touched.categoria && (
                <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-product-descripcion">Descripción *</Label>
              <Textarea
                id="edit-product-descripcion"
                value={formDescripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                onBlur={handleDescripcionBlur}
                placeholder="Descripción detallada del producto"
                rows={4}
                className={
                  errors.descripcion && touched.descripcion ? "border-red-500" : ""
                }
              />
              {errors.descripcion && touched.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-product-iva">IVA (%) *</Label>
              <Select
                value={formIvaId === "" ? "" : String(formIvaId)}
                onValueChange={handleIvaChange}
                onOpenChange={(open: boolean) => !open && handleIvaBlur()}
                disabled={isLoadingCatalogos}
              >
                <SelectTrigger
                  id="edit-product-iva"
                  className={errors.iva && touched.iva ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  {ivasCatalogo.map((iva) => (
                    <SelectItem key={iva.id} value={String(iva.id)}>
                      {iva.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.iva && touched.iva && (
                <p className="text-red-500 text-sm mt-1">{errors.iva}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeToList}
              disabled={isUpdatingProducto}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmEditProduct}
              className="bg-green-600 hover:bg-green-700"
              disabled={isUpdatingProducto}
            >
              {isUpdatingProducto ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={(open) => {
          setShowConfirmEstadoModal(open);
          if (!open) setProductoParaCambioEstado(null);
        }}
      >
        <DialogContent
          className="max-w-lg"
          aria-describedby="confirm-estado-description"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
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
                className={getEstadoBadgeClass(!!productoParaCambioEstado?.estado)}
              >
                {productoParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </Badge>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <Badge
                variant="outline"
                className={getEstadoBadgeClass(!productoParaCambioEstado?.estado)}
              >
                {!productoParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setProductoParaCambioEstado(null);
              }}
              disabled={isChangingEstadoProducto}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isChangingEstadoProducto}
            >
              {isChangingEstadoProducto ? "Procesando..." : "Confirmar"}
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
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
