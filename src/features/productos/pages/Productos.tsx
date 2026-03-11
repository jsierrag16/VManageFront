import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  Edit2,
  ArrowRightLeft,
  Boxes,
  Package,
  Tag,
  BadgePercent,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Label } from "../../../shared/components/ui/label";
import { Badge } from "../../../shared/components/ui/badge";
import { Textarea } from "../../../shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { toast } from "sonner";
import {
  productosService,
  type ProductoFormPayload,
  type ProductoUI,
} from "../services/productos.service";
import {
  existenciasService,
  type ExistenciaUI,
} from "../services/existencias.service";
import {
  catalogosService,
  type SelectOption,
} from "../services/catalogos.service";

interface ProductosProps {
  triggerCreate?: number;
  onNavigateToTraslados?: () => void;
}

type ProductFormState = {
  nombre_producto: string;
  descripcion: string;
  id_categoria_producto: string;
  id_iva: string;
};

type LoteResumen = {
  key: string;
  lote: string;
  cantidad: number;
  fechaVencimiento: string | null;
};

type ProductoResumenStock = {
  stockTotal: number;
  lotes: LoteResumen[];
  existencias: ExistenciaUI[];
};

const EMPTY_FORM: ProductFormState = {
  nombre_producto: "",
  descripcion: "",
  id_categoria_producto: "",
  id_iva: "",
};

const trimToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toPositiveInt = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const extractErrorMessage = (
  error: unknown,
  fallback = "Ocurrió un error inesperado"
) => {
  const err = error as any;
  const responseData = err?.response?.data;

  const nestedMessage =
    responseData?.error?.message ??
    responseData?.message ??
    err?.message ??
    fallback;

  if (Array.isArray(nestedMessage)) {
    return nestedMessage.join(", ");
  }

  if (typeof nestedMessage === "string") {
    return nestedMessage;
  }

  return fallback;
};

const buildCreatePayload = (form: ProductFormState): ProductoFormPayload => ({
  nombre_producto: form.nombre_producto.trim(),
  descripcion: trimToUndefined(form.descripcion),
  id_categoria_producto: Number(form.id_categoria_producto),
  id_iva: Number(form.id_iva),
  estado: true,
});

const buildUpdatePayload = (
  form: ProductFormState
): Partial<ProductoFormPayload> => ({
  nombre_producto: form.nombre_producto.trim(),
  descripcion: trimToUndefined(form.descripcion),
  id_categoria_producto: Number(form.id_categoria_producto),
  id_iva: Number(form.id_iva),
});

const formFromProducto = (producto: ProductoUI): ProductFormState => ({
  nombre_producto: producto.nombre || "",
  descripcion: producto.descripcion || "",
  id_categoria_producto: String(producto.idCategoriaProducto),
  id_iva: String(producto.idIva),
});

const formatDate = (value: string | null) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-CO");
};

const sortLotes = (items: LoteResumen[]) => {
  return [...items].sort((a, b) => {
    if (!a.fechaVencimiento && !b.fechaVencimiento) {
      return a.lote.localeCompare(b.lote);
    }
    if (!a.fechaVencimiento) return 1;
    if (!b.fechaVencimiento) return -1;

    return (
      new Date(a.fechaVencimiento).getTime() -
      new Date(b.fechaVencimiento).getTime()
    );
  });
};

export default function Productos({
  onNavigateToTraslados,
}: ProductosProps) {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const id = params.id ? Number(params.id) : null;

  const isCrear = location.pathname.endsWith("/productos/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");

  const [productos, setProductos] = useState<ProductoUI[]>([]);
  const [existencias, setExistencias] = useState<ExistenciaUI[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoUI | null>(null);

  const [categorias, setCategorias] = useState<SelectOption[]>([]);
  const [ivas, setIvas] = useState<SelectOption[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "La operación se ha completado correctamente"
  );

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [productoParaCambioEstado, setProductoParaCambioEstado] =
    useState<ProductoUI | null>(null);

  const [createForm, setCreateForm] = useState<ProductFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ProductFormState>(EMPTY_FORM);

  const closeToList = () => navigate("/app/productos");

  const totalPagesSafe = useMemo(() => Math.max(totalPages, 1), [totalPages]);

  const resumenExistenciasPorProducto = useMemo(() => {
    const map = new Map<number, ProductoResumenStock>();

    for (const item of existencias) {
      if (!item.idProducto) continue;

      const actual = map.get(item.idProducto) ?? {
        stockTotal: 0,
        lotes: [],
        existencias: [],
      };

      actual.stockTotal += Number(item.cantidad) || 0;
      actual.existencias.push(item);

      const loteKey = `${item.lote || "SIN_LOTE"}|${
        item.fechaVencimiento || "SIN_FECHA"
      }`;

      const loteExistente = actual.lotes.find((lot) => lot.key === loteKey);

      if (loteExistente) {
        loteExistente.cantidad += Number(item.cantidad) || 0;
      } else {
        actual.lotes.push({
          key: loteKey,
          lote: item.lote || "Sin lote",
          cantidad: Number(item.cantidad) || 0,
          fechaVencimiento: item.fechaVencimiento,
        });
      }

      map.set(item.idProducto, actual);
    }

    for (const [productoId, resumen] of map.entries()) {
      map.set(productoId, {
        ...resumen,
        lotes: sortLotes(resumen.lotes),
      });
    }

    return map;
  }, [existencias]);

  const productosConResumen = useMemo(() => {
    return productos.map((producto) => {
      const resumen = resumenExistenciasPorProducto.get(producto.id);

      return {
        ...producto,
        stockTotal: resumen?.stockTotal ?? 0,
        lotes: resumen?.lotes ?? [],
        existencias: resumen?.existencias ?? [],
      };
    });
  }, [productos, resumenExistenciasPorProducto]);

  const resumenProductoSeleccionado = useMemo(() => {
    if (!productoSeleccionado) {
      return {
        stockTotal: 0,
        lotes: [] as LoteResumen[],
        existencias: [] as ExistenciaUI[],
      };
    }

    return (
      resumenExistenciasPorProducto.get(productoSeleccionado.id) ?? {
        stockTotal: 0,
        lotes: [],
        existencias: [],
      }
    );
  }, [productoSeleccionado, resumenExistenciasPorProducto]);

  const loadCatalogos = useCallback(async () => {
    setIsLoadingCatalogos(true);

    try {
      const [categoriasResp, ivasResp] = await Promise.all([
        catalogosService.getCategoriasProducto(),
        catalogosService.getIvas(),
      ]);

      setCategorias(categoriasResp);
      setIvas(ivasResp);
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          "No se pudieron cargar categorías o IVA"
        )
      );
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const loadProductos = useCallback(
    async (page = currentPage, q = debouncedSearchTerm) => {
      setIsLoading(true);

      try {
        const [productosResp, existenciasResp] = await Promise.all([
          productosService.findAll({
            page,
            limit: itemsPerPage,
            q: q || undefined,
            includeRefs: true,
          }),
          existenciasService.findAll().catch((error) => {
            toast.error(
              extractErrorMessage(
                error,
                "No se pudieron cargar las existencias de la bodega activa"
              )
            );
            return [];
          }),
        ]);

        setProductos(productosResp.data);
        setTotalItems(productosResp.total);
        setTotalPages(Math.max(productosResp.pages, 1));
        setExistencias(existenciasResp);
      } catch (error) {
        toast.error(
          extractErrorMessage(error, "No se pudieron cargar los productos")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, debouncedSearchTerm]
  );

  const loadProductoById = useCallback(async (productId: number) => {
    setIsLoadingSelected(true);

    try {
      const producto = await productosService.findOne(productId, true);
      setProductoSeleccionado(producto);
      return producto;
    } catch (error) {
      toast.error(extractErrorMessage(error, "No se pudo cargar el producto"));
      return null;
    } finally {
      setIsLoadingSelected(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadProductos(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, loadProductos]);

  useEffect(() => {
    if (!isVer && !isEditar) {
      setProductoSeleccionado(null);
      return;
    }

    if (!id || Number.isNaN(id)) {
      closeToList();
      return;
    }

    loadProductoById(id).then((producto) => {
      if (!producto) return;

      if (isEditar) {
        setEditForm(formFromProducto(producto));
      }
    });
  }, [id, isVer, isEditar, loadProductoById]);

  const validateProductForm = (form: ProductFormState) => {
    if (!form.nombre_producto.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return false;
    }

    if (form.nombre_producto.trim().length < 3) {
      toast.error("El nombre del producto debe tener al menos 3 caracteres");
      return false;
    }

    if (form.nombre_producto.trim().length > 150) {
      toast.error("El nombre del producto no puede superar 150 caracteres");
      return false;
    }

    if (form.descripcion.trim().length > 255) {
      toast.error("La descripción no puede superar 255 caracteres");
      return false;
    }

    const categoriaId = toPositiveInt(form.id_categoria_producto);
    if (!categoriaId) {
      toast.error("Debes seleccionar una categoría");
      return false;
    }

    const ivaId = toPositiveInt(form.id_iva);
    if (!ivaId) {
      toast.error("Debes seleccionar un IVA");
      return false;
    }

    return true;
  };

  const confirmCreateProduct = async () => {
    if (!validateProductForm(createForm)) return;

    setIsSubmitting(true);

    try {
      await productosService.create(buildCreatePayload(createForm));

      setCreateForm(EMPTY_FORM);
      setSuccessMessage("Producto creado exitosamente");
      setShowSuccessModal(true);

      await loadProductos(1, debouncedSearchTerm);
      setCurrentPage(1);
    } catch (error) {
      toast.error(extractErrorMessage(error, "No se pudo crear el producto"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEditProduct = async () => {
    if (!id || Number.isNaN(id)) {
      toast.error("ID de producto inválido");
      return;
    }

    if (!validateProductForm(editForm)) return;

    setIsSubmitting(true);

    try {
      await productosService.update(id, buildUpdatePayload(editForm));
      toast.success("Producto actualizado exitosamente");
      await loadProductos(currentPage, debouncedSearchTerm);
      closeToList();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "No se pudo actualizar el producto")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (productoId: number) => {
    navigate(`/app/productos/${productoId}/ver`);
  };

  const handleNuevoProducto = () => {
    setCreateForm(EMPTY_FORM);
    navigate("/app/productos/crear");
  };

  const handleEditProducto = (productoId: number) => {
    navigate(`/app/productos/${productoId}/editar`);
  };

  const handleToggleEstado = (producto: ProductoUI) => {
    setProductoParaCambioEstado(producto);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = async () => {
    if (!productoParaCambioEstado) return;

    setIsSubmitting(true);

    try {
      if (productoParaCambioEstado.estado) {
        await productosService.disable(productoParaCambioEstado.id);
      } else {
        await productosService.enable(productoParaCambioEstado.id);
      }

      toast.success(
        `Producto ${
          productoParaCambioEstado.estado ? "desactivado" : "activado"
        } exitosamente`
      );

      setShowConfirmEstadoModal(false);
      setProductoParaCambioEstado(null);

      await loadProductos(currentPage, debouncedSearchTerm);

      if (productoSeleccionado?.id === productoParaCambioEstado.id && id) {
        await loadProductoById(id);
      }
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "No se pudo cambiar el estado del producto")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPagesSafe) return;
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    closeToList();
  };

  const handleTrasladosClick = () => {
    if (onNavigateToTraslados) {
      onNavigateToTraslados();
      return;
    }

    toast.info("El módulo de traslados aún no está conectado");
  };

  const renderPaginationButtons = () => {
    return Array.from({ length: totalPagesSafe }, (_, i) => i + 1).map(
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
    );
  };

  const renderLotesCell = (lotes: LoteResumen[]) => {
    if (lotes.length === 0) {
      return <span className="text-gray-400">Sin existencias</span>;
    }

    return (
      <div className="space-y-1 min-w-[220px]">
        {lotes.slice(0, 2).map((lote) => (
          <div
            key={lote.key}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs text-gray-900">
                {lote.lote}
              </span>
              <Badge variant="outline">{lote.cantidad}</Badge>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Vence: {formatDate(lote.fechaVencimiento)}
            </p>
          </div>
        ))}

        {lotes.length > 2 && (
          <div className="text-xs text-gray-500">
            +{lotes.length - 2} lote(s) más
          </div>
        )}
      </div>
    );
  };

  const renderProductForm = (
    form: ProductFormState,
    setForm: Dispatch<SetStateAction<ProductFormState>>,
    prefix: "create" | "edit"
  ) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor={`${prefix}-nombre`}>Nombre del Producto *</Label>
          <Input
            id={`${prefix}-nombre`}
            value={form.nombre_producto}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                nombre_producto: e.target.value,
              }))
            }
            placeholder="Ej: Paracetamol 500mg"
          />
        </div>

        <div>
          <Label>Categoría *</Label>
          <Select
            value={form.id_categoria_producto}
            onValueChange={(value) => 
              setForm((prev) => ({
                ...prev,
                id_categoria_producto: value,
              }))
            }
            disabled={categorias.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.length > 0 ? (
                categorias.map((categoria) => (
                  <SelectItem key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No hay categorías disponibles
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>IVA *</Label>
          <Select
            value={form.id_iva}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                id_iva: value,
              }))
            }
            disabled={ivas.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un IVA" />
            </SelectTrigger>
            <SelectContent>
              {ivas.length > 0 ? (
                ivas.map((iva) => (
                  <SelectItem key={iva.value} value={iva.value}>
                    {iva.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No hay IVA disponible
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`${prefix}-descripcion`}>Descripción</Label>
          <Textarea
            id={`${prefix}-descripcion`}
            value={form.descripcion}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                descripcion: e.target.value,
              }))
            }
            placeholder="Descripción detallada del producto"
            rows={4}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Gestión de Productos</h2>
        <p className="text-gray-600 mt-1">
          Administra productos y visualiza existencias por lote desde la bodega activa
        </p>
      </div>

    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          placeholder="Buscar por nombre, descripción o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button
        variant="outline"
        onClick={handleTrasladosClick}
        className="border-violet-200 text-violet-700 hover:bg-violet-50 whitespace-nowrap"
      >
        <ArrowRightLeft size={18} className="mr-2" />
        Traslados
      </Button>

      <Button
        onClick={handleNuevoProducto}
        className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
      >
        <Plus size={18} className="mr-2" />
        Crear producto
      </Button>
    </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">IVA</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Lotes / cantidades</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-40">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    Cargando productos...
                  </TableCell>
                </TableRow>
              ) : productosConResumen.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                productosConResumen.map((producto) => (
                  <TableRow key={producto.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{producto.id}</TableCell>

                    <TableCell>
                      {producto.codigoProducto || (
                        <span className="text-gray-400">Sin código</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[220px]">
                        <p className="font-medium text-gray-900">
                          {producto.nombre}
                        </p>
                        {producto.descripcion && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {producto.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {producto.categoriaNombre}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                        {producto.ivaLabel}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {producto.stockTotal}
                      </Badge>
                    </TableCell>

                    <TableCell>{renderLotesCell(producto.lotes)}</TableCell>

                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleEstado(producto)}
                        disabled={isSubmitting}
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
                          onClick={() => handleView(producto.id)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProducto(producto.id)}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Editar producto"
                        >
                          <Edit2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}{" "}
              productos
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
                {renderPaginationButtons()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPagesSafe}
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
        open={isVer}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          onPointerDownOutside={(e: any) => e.preventDefault()}
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Detalle del producto</DialogTitle>
            <DialogDescription id="dialog-description">
              Resumen limpio del producto y sus lotes en la bodega activa
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelected ? (
            <div className="py-8 text-center text-gray-500">
              Cargando producto...
            </div>
          ) : productoSeleccionado ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {productoSeleccionado.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {productoSeleccionado.codigoProducto || "Sin código"}
                    </p>
                  </div>

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

                {productoSeleccionado.descripcion && (
                  <p className="text-sm text-gray-600 mt-4 leading-6">
                    {productoSeleccionado.descripcion}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Boxes size={16} />
                    <span className="text-sm">Stock total</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {resumenProductoSeleccionado.stockTotal}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Package size={16} />
                    <span className="text-sm">Lotes</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {resumenProductoSeleccionado.lotes.length}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Tag size={16} />
                    <span className="text-sm">Categoría</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {productoSeleccionado.categoriaNombre}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <BadgePercent size={16} />
                    <span className="text-sm">IVA</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {productoSeleccionado.ivaLabel}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    Lotes registrados
                  </h4>
                  <Badge variant="outline">
                    {resumenProductoSeleccionado.existencias.length} existencia(s)
                  </Badge>
                </div>

                {resumenProductoSeleccionado.lotes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Este producto no tiene existencias registradas en la bodega activa.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resumenProductoSeleccionado.lotes.map((lote) => (
                      <div
                        key={lote.key}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {lote.lote}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Vence: {formatDate(lote.fechaVencimiento)}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            {lote.cantidad}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró información del producto
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeToList} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCrear}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-3xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="create-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle>Crear producto</DialogTitle>
            <DialogDescription id="create-product-description">
              Registra un nuevo producto en el sistema
            </DialogDescription>
          </DialogHeader>

          {isLoadingCatalogos ? (
            <div className="py-8 text-center text-gray-500">
              Cargando categorías e IVA...
            </div>
          ) : (
            <>
              {renderProductForm(createForm, setCreateForm, "create")}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeToList}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmCreateProduct}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    isSubmitting || categorias.length === 0 || ivas.length === 0
                  }
                >
                  {isSubmitting ? "Creando..." : "Crear producto"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditar}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-3xl"
          onPointerDownOutside={(e: any) => e.preventDefault()}
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
          aria-describedby="edit-product-description"
        >
          <button
            type="button"
            onClick={closeToList}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription id="edit-product-description">
              Modifica la información del producto
            </DialogDescription>
          </DialogHeader>

          {isLoadingSelected || isLoadingCatalogos ? (
            <div className="py-8 text-center text-gray-500">
              Cargando información...
            </div>
          ) : (
            <>
              {renderProductForm(editForm, setEditForm, "edit")}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeToList}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmEditProduct}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={
                    isSubmitting || categorias.length === 0 || ivas.length === 0
                  }
                >
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent
          className="max-w-lg"
          aria-describedby="confirm-estado-description"
        >
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este producto?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm gap-4">
              <span className="text-gray-600">Producto:</span>
              <span className="font-medium text-right">
                {productoParaCambioEstado?.nombre}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado actual:</span>
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
              <span className="text-gray-600">Nuevo estado:</span>
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader>
            <DialogTitle className="sr-only">Operación exitosa</DialogTitle>
            <DialogDescription id="success-description" className="sr-only">
              La operación se ha completado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Registro exitoso!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-6">
              {successMessage}
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
