import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";

import {
  Search,
  Plus,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Building2,
  X,
  Clock,
  Trash2,
  Edit,
  PlusCircle,
  Truck,
  XCircle,
  Ban,
  Loader2,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";

import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";
import type { AppOutletContext } from "@/layouts/MainLayout";

import {
  getTraslados,
  getTrasladoById,
  createTraslado,
  updateTraslado,
  getExistenciasDisponibles,
  getBodegasCatalogo,
} from "@/features/existencias/traslados/services/traslados.services";

import {
  trasladoBackendToUI,
  existenciasDisponiblesBackendToUI,
  bodegaCatalogoBackendToOption,
  trasladoFormToCreatePayload,
  trasladoFormToUpdatePayload,
  estadoTrasladoUIToBackend,
  type TrasladoUI,
  type TrasladoItemUI,
  type ExistenciaDisponibleUI,
  type EstadoTrasladoUI,
  type OpcionCatalogo,
} from "@/features/existencias/traslados/services/traslados.mapper";

interface TrasladosProps {
  onTrasladoCreated?: () => void;
  triggerCreate?: number;
}

export default function Traslados({
  onTrasladoCreated,
  triggerCreate,
}: TrasladosProps) {
  // =========================================================
  // Contexto, navegación y permisos
  // =========================================================
  const { usuario, tienePermiso } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // =========================================================
  // Estados del módulo
  // =========================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [traslados, setTraslados] = useState<TrasladoUI[]>([]);
  const [existenciasDisponibles, setExistenciasDisponibles] = useState<
    ExistenciaDisponibleUI[]
  >([]);
  const [bodegasCatalogo, setBodegasCatalogo] = useState<OpcionCatalogo[]>([]);

  const [isLoadingTraslados, setIsLoadingTraslados] = useState(false);
  const [isLoadingExistencias, setIsLoadingExistencias] = useState(false);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);

  const [trasladoParaCambioEstado, setTrasladoParaCambioEstado] =
    useState<TrasladoUI | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoTrasladoUI | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =========================================================
  // Estados del formulario
  // =========================================================
  const [formBodegaOrigenId, setFormBodegaOrigenId] = useState<number | "">("");
  const [formBodegaDestinoId, setFormBodegaDestinoId] = useState<number | "">("");

  const [formObservaciones, setFormObservaciones] = useState("");
  const [trasladoItems, setTrasladoItems] = useState<TrasladoItemUI[]>([]);

  const [currentProductoId, setCurrentProductoId] = useState<number | "">("");
  const [currentExistenciaId, setCurrentExistenciaId] = useState<number | "">("");
  const [currentCantidad, setCurrentCantidad] = useState("");

  // =========================================================
  // Estados de catálogos
  // =========================================================
  const [isHydratingForm, setIsHydratingForm] = useState(false);

  // =========================================================
  // Permisos
  // =========================================================
  const canCreateTraslados = tienePermiso("existencias", "traslados", "crear");
  const canEditTraslados = tienePermiso("existencias", "traslados", "editar");
  const canChangeEstadoTraslados = tienePermiso(
    "existencias",
    "traslados",
    "cambiarEstado"
  );
  const canAnularTraslados = tienePermiso("existencias", "traslados", "anular");

  // =========================================================
  // Estados de errores y touched
  // =========================================================
  const [errors, setErrors] = useState({
    bodegaOrigen: "",
    bodegaDestino: "",
    observaciones: "",
    currentProducto: "",
    currentLote: "",
    currentCantidad: "",
    motivoAnulacion: "",
  });

  const [touched, setTouched] = useState({
    bodegaOrigen: false,
    bodegaDestino: false,
    observaciones: false,
    currentProducto: false,
    currentLote: false,
    currentCantidad: false,
    motivoAnulacion: false,
  });

  // =========================================================
  // Estados de proceso async
  // =========================================================
  const [isCreatingTraslado, setIsCreatingTraslado] = useState(false);
  const [isUpdatingTraslado, setIsUpdatingTraslado] = useState(false);
  const [isChangingEstadoTraslado, setIsChangingEstadoTraslado] = useState(false);
  const [isAnulandoTraslado, setIsAnulandoTraslado] = useState(false);

  // =========================================================
  // Flags de ruta
  // =========================================================
  const id = params.id ? Number(params.id) : null;

  const isCrear = location.pathname.endsWith("/traslados/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  // =========================================================
  // Datos derivados / useMemo
  // =========================================================
  const trasladoSeleccionado = useMemo(() => {
    if (!id || Number.isNaN(id)) return null;
    return traslados.find((traslado) => traslado.id === id) ?? null;
  }, [traslados, id]);

  const bodegaSeleccionadaInfo = useMemo(() => {
    if (!selectedBodega || selectedBodega === "Todas las bodegas") return null;

    const match = bodegasCatalogo.find(
      (bodega) => bodega.nombre === selectedBodega
    );

    return match
      ? {
        id: match.id,
        nombre: match.nombre,
      }
      : null;
  }, [bodegasCatalogo, selectedBodega]);

  const selectedBodegaId = bodegaSeleccionadaInfo?.id ?? null;

  const productosDisponibles = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string }>();

    existenciasDisponibles.forEach((existencia) => {
      if (existencia.cantidadDisponible > 0) {
        map.set(existencia.idProducto, {
          id: existencia.idProducto,
          nombre: existencia.nombreProducto,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [existenciasDisponibles]);

  const lotesDisponibles = useMemo(() => {
    if (!currentProductoId) return [];

    return existenciasDisponibles
      .filter(
        (existencia) =>
          existencia.idProducto === Number(currentProductoId) &&
          existencia.cantidadDisponible > 0
      )
      .sort((a, b) => a.lote.localeCompare(b.lote));
  }, [currentProductoId, existenciasDisponibles]);

  const existenciaSeleccionada = useMemo(() => {
    if (!currentExistenciaId) return null;

    return (
      lotesDisponibles.find(
        (existencia) => existencia.idExistencia === Number(currentExistenciaId)
      ) ?? null
    );
  }, [currentExistenciaId, lotesDisponibles]);

  const cantidadMaxima = useMemo(() => {
    return existenciaSeleccionada?.cantidadDisponible ?? 0;
  }, [existenciaSeleccionada]);

  const filteredTraslados = useMemo(() => {
    return traslados.filter((traslado) => {
      const searchLower = searchTerm.toLowerCase().trim();

      if (selectedBodega && selectedBodega !== "Todas las bodegas") {
        const coincideBodega =
          traslado.bodegaOrigen === selectedBodega ||
          traslado.bodegaDestino === selectedBodega;

        if (!coincideBodega) return false;
      }

      if (fechaInicio) {
        const fechaTraslado = traslado.fecha.split("T")[0];
        if (fechaTraslado < fechaInicio) return false;
      }

      if (fechaFin) {
        const fechaTraslado = traslado.fecha.split("T")[0];
        if (fechaTraslado > fechaFin) return false;
      }

      if (!searchLower) return true;

      const totalUnidades = calcularTotalItems(traslado.items);

      const itemsMatch = traslado.items.some(
        (item) =>
          item.productoNombre.toLowerCase().includes(searchLower) ||
          item.loteNumero.toLowerCase().includes(searchLower)
      );

      return (
        traslado.codigo.toLowerCase().includes(searchLower) ||
        traslado.fecha.toLowerCase().includes(searchLower) ||
        formatFecha(traslado.fecha).toLowerCase().includes(searchLower) ||
        traslado.bodegaOrigen.toLowerCase().includes(searchLower) ||
        traslado.bodegaDestino.toLowerCase().includes(searchLower) ||
        traslado.estado.toLowerCase().includes(searchLower) ||
        traslado.responsable.toLowerCase().includes(searchLower) ||
        totalUnidades.toString().includes(searchLower) ||
        itemsMatch
      );
    });
  }, [traslados, searchTerm, fechaInicio, fechaFin, selectedBodega]);

  const totalPages = Math.ceil(filteredTraslados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTraslados = filteredTraslados.slice(startIndex, endIndex);

  // =========================================================
  // Funciones de carga
  // =========================================================
  const loadTraslados = useCallback(async () => {
    try {
      setIsLoadingTraslados(true);

      const listado = await getTraslados(selectedBodegaId ?? undefined);

      const detalles = await Promise.all(
        listado.map(async (traslado) => {
          try {
            return await getTrasladoById(traslado.id_traslado);
          } catch {
            return traslado;
          }
        })
      );

      const mapped = detalles.map(trasladoBackendToUI);
      setTraslados(mapped);
    } catch (error) {
      console.error("Error cargando traslados:", error);
      toast.error("No se pudieron cargar los traslados");
    } finally {
      setIsLoadingTraslados(false);
    }
  }, [selectedBodegaId]);

  const loadExistencias = useCallback(async (idBodega?: number) => {
    try {
      if (!idBodega) {
        setExistenciasDisponibles([]);
        return;
      }

      setIsLoadingExistencias(true);

      const response = await getExistenciasDisponibles(idBodega);
      setExistenciasDisponibles(existenciasDisponiblesBackendToUI(response));
    } catch (error) {
      console.error("Error cargando existencias:", error);
      toast.error("No se pudieron cargar las existencias disponibles");
    } finally {
      setIsLoadingExistencias(false);
    }
  }, []);

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      const bodegas = await getBodegasCatalogo();
      setBodegasCatalogo(bodegas.map(bodegaCatalogoBackendToOption));
    } catch (error) {
      console.error("Error cargando bodegas:", error);
      toast.error("No se pudieron cargar las bodegas");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const closeToList = useCallback(() => {
    navigate("/app/traslados");
  }, [navigate]);

  const resetForm = useCallback(() => {
    const origenInicialId =
      selectedBodega && selectedBodega !== "Todas las bodegas"
        ? (bodegaSeleccionadaInfo?.id ?? "")
        : "";

    setFormBodegaOrigenId(origenInicialId);
    setFormBodegaDestinoId("");
    setFormObservaciones("");
    setTrasladoItems([]);
    setCurrentProductoId("");
    setCurrentExistenciaId("");
    setCurrentCantidad("");
    setExistenciasDisponibles([]);

    setErrors({
      bodegaOrigen: "",
      bodegaDestino: "",
      observaciones: "",
      currentProducto: "",
      currentLote: "",
      currentCantidad: "",
      motivoAnulacion: "",
    });

    setTouched({
      bodegaOrigen: false,
      bodegaDestino: false,
      observaciones: false,
      currentProducto: false,
      currentLote: false,
      currentCantidad: false,
      motivoAnulacion: false,
    });
  }, [selectedBodega, bodegaSeleccionadaInfo]);

  // =========================================================
  // Efectos
  // =========================================================
  useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    if (!isCrear && !isEditar) return;

    if (!formBodegaOrigenId) {
      setExistenciasDisponibles([]);
      return;
    }

    void loadExistencias(Number(formBodegaOrigenId));
  }, [isCrear, isEditar, formBodegaOrigenId, loadExistencias]);

  useEffect(() => {
    void loadTraslados();
  }, [loadTraslados]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fechaInicio, fechaFin, selectedBodega]);

  useEffect(() => {
    if (!isCrear) return;
    if (isLoadingCatalogos) return;

    setIsHydratingForm(true);
    resetForm();
    setIsHydratingForm(false);
  }, [isCrear, resetForm, isLoadingCatalogos]);

  useEffect(() => {
    if (!isEditar) return;
    if (isLoadingTraslados) return;

    if (!trasladoSeleccionado) {
      toast.error("Traslado no encontrado");
      closeToList();
      return;
    }

    if (trasladoSeleccionado.estado !== "Pendiente") {
      toast.error("Solo puedes editar traslados en estado Pendiente");
      closeToList();
      return;
    }

    setIsHydratingForm(true);

    setFormBodegaOrigenId(trasladoSeleccionado.idBodegaOrigen);
    setFormBodegaDestinoId(trasladoSeleccionado.idBodegaDestino);
    setFormObservaciones(trasladoSeleccionado.observaciones || "");
    setTrasladoItems(trasladoSeleccionado.items);
    setCurrentProductoId("");
    setCurrentExistenciaId("");
    setCurrentCantidad("");

    setErrors({
      bodegaOrigen: "",
      bodegaDestino: "",
      observaciones: "",
      currentProducto: "",
      currentLote: "",
      currentCantidad: "",
      motivoAnulacion: "",
    });

    setTouched({
      bodegaOrigen: false,
      bodegaDestino: false,
      observaciones: false,
      currentProducto: false,
      currentLote: false,
      currentCantidad: false,
      motivoAnulacion: false,
    });

    setIsHydratingForm(false);
  }, [isEditar, trasladoSeleccionado, isLoadingTraslados, closeToList]);

  useEffect(() => {
    if (!isVer && !isAnular) return;
    if (isLoadingTraslados) return;

    if (!trasladoSeleccionado) {
      toast.error("Traslado no encontrado");
      closeToList();
      return;
    }

    if (isAnular) {
      if (trasladoSeleccionado.estado !== "Pendiente") {
        toast.error("Solo puedes anular traslados en estado Pendiente");
        closeToList();
        return;
      }

      setFormObservaciones("");
    }
  }, [isVer, isAnular, trasladoSeleccionado, isLoadingTraslados, closeToList]);

  useEffect(() => {
    if (!triggerCreate) return;

    if (!location.pathname.endsWith("/traslados/crear")) {
      navigate("/app/traslados/crear");
    }
  }, [triggerCreate, navigate, location.pathname]);

  // =========================================================
  // Validaciones y helpers
  // =========================================================
  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return fecha;

    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calcularTotalItems = (items: TrasladoItemUI[]) =>
    items.reduce((sum, item) => sum + Number(item.cantidad), 0);

  const getEstadoBadge = (estado: EstadoTrasladoUI) => {
    const badges: Record<EstadoTrasladoUI, { class: string; icon: any }> = {
      Pendiente: {
        class: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        icon: Clock,
      },
      Enviado: {
        class: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        icon: Truck,
      },
      Recibido: {
        class: "bg-green-100 text-green-800 hover:bg-green-200",
        icon: CheckCircle,
      },
      Anulado: {
        class: "bg-red-100 text-red-800 hover:bg-red-200",
        icon: XCircle,
      },
    };

    return badges[estado];
  };

  const getSiguienteEstado = (
    estadoActual: EstadoTrasladoUI
  ): EstadoTrasladoUI | null => {
    const flujo: Record<EstadoTrasladoUI, EstadoTrasladoUI | null> = {
      Pendiente: "Enviado",
      Enviado: "Recibido",
      Recibido: null,
      Anulado: null,
    };

    return flujo[estadoActual];
  };

  const validateBodegaOrigen = (value: number | "") => {
    if (!value) return "La bodega de origen es requerida";
    return "";
  };

  const validateBodegaDestino = (
    value: number | "",
    bodegaOrigenId: number | ""
  ) => {
    if (!value) return "La bodega de destino es requerida";
    if (value === bodegaOrigenId) {
      return "La bodega de destino debe ser diferente a la de origen";
    }
    return "";
  };

  const validateObservaciones = (value: string) => {
    if (!value.trim()) return "";
    if (value.trim().length > 255) return "Máximo 255 caracteres";

    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-¿?¡!]+$/;
    if (!validPattern.test(value)) {
      return "Solo se permiten letras, números, espacios y puntuación básica";
    }

    return "";
  };

  const validateCurrentProducto = (value: number | "") => {
    if (!value) return "El producto es requerido";
    return "";
  };

  const validateCurrentLote = (value: number | "") => {
    if (!value) return "El lote es requerido";
    return "";
  };

  const validateCurrentCantidad = (value: string, maxCantidad: number) => {
    if (!value.trim()) return "La cantidad es requerida";

    const soloNumeros = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!soloNumeros.test(value)) {
      return "Solo se permiten números válidos";
    }

    const cantidad = Number(value);
    if (cantidad <= 0) return "La cantidad debe ser mayor a 0";
    if (cantidad > maxCantidad) {
      return `Máximo ${maxCantidad} unidades disponibles`;
    }

    return "";
  };

  const validateForm = () => {
    setTouched((prev) => ({
      ...prev,
      bodegaOrigen: true,
      bodegaDestino: true,
      observaciones: true,
    }));

    const bodegaOrigenError = validateBodegaOrigen(formBodegaOrigenId);
    const bodegaDestinoError = validateBodegaDestino(
      formBodegaDestinoId,
      formBodegaOrigenId
    );
    const observacionesError = validateObservaciones(formObservaciones);

    setErrors((prev) => ({
      ...prev,
      bodegaOrigen: bodegaOrigenError,
      bodegaDestino: bodegaDestinoError,
      observaciones: observacionesError,
    }));

    if (bodegaOrigenError || bodegaDestinoError || observacionesError) {
      toast.error("Por favor corrige los errores del formulario");
      return false;
    }

    if (trasladoItems.length === 0) {
      toast.error("Debes agregar al menos un producto al traslado");
      return false;
    }

    return true;
  };

  const buildNotaAnulacion = (notaActual: string, motivo: string) => {
    const notaAnulada = `[ANULADO] ${motivo.trim()}`;
    const finalNote = [notaActual.trim(), notaAnulada]
      .filter(Boolean)
      .join(" | ")
      .slice(0, 255);

    return finalNote;
  };

  // =========================================================
  // Handlers de formulario
  // =========================================================
  const handleBodegaDestinoChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    setFormBodegaDestinoId(parsed);
    setTouched((prev) => ({ ...prev, bodegaDestino: true }));

    setErrors((prev) => ({
      ...prev,
      bodegaDestino: validateBodegaDestino(parsed, formBodegaOrigenId),
    }));
  };

  const handleObservacionesChange = (value: string) => {
    setFormObservaciones(value);

    if (touched.observaciones) {
      setErrors((prev) => ({
        ...prev,
        observaciones: validateObservaciones(value),
      }));
    }
  };

  const handleCurrentProductoChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    setCurrentProductoId(parsed);
    setCurrentExistenciaId("");
    setCurrentCantidad("");

    setTouched((prev) => ({ ...prev, currentProducto: true }));

    setErrors((prev) => ({
      ...prev,
      currentProducto: validateCurrentProducto(parsed),
      currentLote: "",
      currentCantidad: "",
    }));
  };

  const handleCurrentLoteChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    setCurrentExistenciaId(parsed);
    setCurrentCantidad("");

    setTouched((prev) => ({ ...prev, currentLote: true }));

    setErrors((prev) => ({
      ...prev,
      currentLote: validateCurrentLote(parsed),
      currentCantidad: "",
    }));
  };

  const handleCurrentCantidadChange = (value: string) => {
    setCurrentCantidad(value);

    if (touched.currentCantidad) {
      setErrors((prev) => ({
        ...prev,
        currentCantidad: validateCurrentCantidad(value, cantidadMaxima),
      }));
    }
  };

  const handleObservacionesBlur = () => {
    setTouched((prev) => ({ ...prev, observaciones: true }));
    setErrors((prev) => ({
      ...prev,
      observaciones: validateObservaciones(formObservaciones),
    }));
  };

  const handleCurrentCantidadBlur = () => {
    setTouched((prev) => ({ ...prev, currentCantidad: true }));
    setErrors((prev) => ({
      ...prev,
      currentCantidad: validateCurrentCantidad(currentCantidad, cantidadMaxima),
    }));
  };

  const handleBodegaOrigenChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    setFormBodegaOrigenId(parsed);

    if (formBodegaDestinoId && parsed === formBodegaDestinoId) {
      setFormBodegaDestinoId("");
    }

    setTrasladoItems([]);
    setCurrentProductoId("");
    setCurrentExistenciaId("");
    setCurrentCantidad("");
    setExistenciasDisponibles([]);

    setTouched((prev) => ({
      ...prev,
      bodegaOrigen: true,
    }));

    setErrors((prev) => ({
      ...prev,
      bodegaOrigen: validateBodegaOrigen(parsed),
      bodegaDestino: validateBodegaDestino(formBodegaDestinoId, parsed),
      currentProducto: "",
      currentLote: "",
      currentCantidad: "",
    }));
  };

  // =========================================================
  // Handlers de navegación
  // =========================================================
  const handleNuevoTraslado = () => {
    if (!canCreateTraslados) {
      toast.error("No tienes permiso para crear traslados");
      return;
    }
    navigate("/app/traslados/crear");
  };

  const handleView = (traslado: TrasladoUI) => {
    navigate(`/app/traslados/${traslado.id}/ver`);
  };

  const handleEdit = (traslado: TrasladoUI) => {
    if (!canEditTraslados) {
      toast.error("No tienes permiso para editar traslados");
      return;
    }

    if (traslado.estado !== "Pendiente") {
      toast.error("Solo puedes editar traslados en estado Pendiente");
      return;
    }

    navigate(`/app/traslados/${traslado.id}/editar`);
  };

  const handleOpenAnular = (traslado: TrasladoUI) => {
    if (!canAnularTraslados) {
      toast.error("No tienes permiso para anular traslados");
      return;
    }

    if (traslado.estado !== "Pendiente") {
      toast.error("Solo puedes anular traslados en estado Pendiente");
      return;
    }

    navigate(`/app/traslados/${traslado.id}/anular`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    closeToList();
  };

  const handleCloseCreateModal = () => {
    resetForm();
    closeToList();
  };

  // =========================================================
  // Handlers de acciones / modales
  // =========================================================
  const handleAddItem = () => {
    const productoError = validateCurrentProducto(currentProductoId);
    const loteError = validateCurrentLote(currentExistenciaId);
    const cantidadError = validateCurrentCantidad(currentCantidad, cantidadMaxima);

    setTouched((prev) => ({
      ...prev,
      currentProducto: true,
      currentLote: true,
      currentCantidad: true,
    }));

    setErrors((prev) => ({
      ...prev,
      currentProducto: productoError,
      currentLote: loteError,
      currentCantidad: cantidadError,
    }));

    if (productoError || loteError || cantidadError) {
      toast.error("Completa correctamente el producto a agregar");
      return;
    }

    if (!existenciaSeleccionada) {
      toast.error("Debes seleccionar una existencia válida");
      return;
    }

    const yaExiste = trasladoItems.some(
      (item) => item.idExistencia === existenciaSeleccionada.idExistencia
    );

    if (yaExiste) {
      toast.error(
        "Este lote ya fue agregado al traslado. Elimínalo primero si deseas modificarlo."
      );
      return;
    }

    const newItem: TrasladoItemUI = {
      idExistencia: existenciaSeleccionada.idExistencia,
      idProducto: existenciaSeleccionada.idProducto,
      productoNombre: existenciaSeleccionada.nombreProducto,
      loteNumero: existenciaSeleccionada.lote,
      cantidad: Number(currentCantidad),
      idBodega: existenciaSeleccionada.idBodega,
      bodegaNombre: existenciaSeleccionada.nombreBodega,
      fechaVencimiento: existenciaSeleccionada.fechaVencimiento,
    };

    setTrasladoItems((prev) => [...prev, newItem]);
    setCurrentProductoId("");
    setCurrentExistenciaId("");
    setCurrentCantidad("");

    setErrors((prev) => ({
      ...prev,
      currentProducto: "",
      currentLote: "",
      currentCantidad: "",
    }));

    setTouched((prev) => ({
      ...prev,
      currentProducto: false,
      currentLote: false,
      currentCantidad: false,
    }));

    toast.success("Producto agregado al traslado");
  };

  const handleRemoveItem = (index: number) => {
    setTrasladoItems((prev) => prev.filter((_, i) => i !== index));
    toast.success("Producto eliminado del traslado");
  };

  const handleEstadoClick = (traslado: TrasladoUI) => {
    if (!canChangeEstadoTraslados) {
      toast.error("No tienes permiso para cambiar el estado de traslados");
      return;
    }

    const siguienteEstado = getSiguienteEstado(traslado.estado);

    if (!siguienteEstado) {
      if (traslado.estado === "Recibido") {
        toast.info("Este traslado ya está en estado final (Recibido)");
      } else if (traslado.estado === "Anulado") {
        toast.info("Los traslados anulados no pueden cambiar de estado");
      }
      return;
    }

    setTrasladoParaCambioEstado(traslado);
    setNuevoEstado(siguienteEstado);
    setShowConfirmEstadoModal(true);
  };

  // =========================================================
  // Confirmaciones / acciones async
  // =========================================================
  const confirmCreateTraslado = async () => {
    if (!canCreateTraslados) {
      toast.error("No tienes permiso para crear traslados");
      return;
    }

    if (isCreatingTraslado) return;
    if (!validateForm()) return;

    if (!formBodegaOrigenId || !formBodegaDestinoId) {
      toast.error("Debes seleccionar bodegas válidas");
      return;
    }

    const payload = trasladoFormToCreatePayload({
      idBodegaOrigen: Number(formBodegaOrigenId),
      idBodegaDestino: Number(formBodegaDestinoId),
      nota: formObservaciones,
      detalle: trasladoItems.map((item) => ({
        idExistencia: item.idExistencia,
        cantidad: item.cantidad,
      })),
    });

    try {
      setIsCreatingTraslado(true);

      await createTraslado(payload);
      await loadTraslados();

      if (formBodegaOrigenId) {
        await loadExistencias(Number(formBodegaOrigenId));
      }

      setShowSuccessModal(true);
      onTrasladoCreated?.();
    } catch (error: any) {
      console.error("Payload enviado al crear traslado:", payload);
      console.error(
        "Respuesta backend al crear traslado (completa):",
        JSON.stringify(error?.response?.data, null, 2)
      );
      console.error(
        "Error interno backend:",
        JSON.stringify(error?.response?.data?.error, null, 2)
      );
      console.error(
        "Mensaje backend:",
        error?.response?.data?.error?.message
      );
      console.error("Error creando traslado:", error);

      const rawMessage =
        error?.response?.data?.error?.message ??
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        "No se pudo crear el traslado";

      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : String(rawMessage);

      toast.error(message);
    } finally {
      setIsCreatingTraslado(false);
    }
  };

  const confirmEditTraslado = async () => {
    if (!canEditTraslados) {
      toast.error("No tienes permiso para editar traslados");
      return;
    }

    if (isUpdatingTraslado) return;
    if (!trasladoSeleccionado) return;
    if (!validateForm()) return;

    if (!formBodegaOrigenId || !formBodegaDestinoId) {
      toast.error("Debes seleccionar bodegas válidas");
      return;
    }

    try {
      setIsUpdatingTraslado(true);

      const payload = trasladoFormToUpdatePayload({
        idBodegaOrigen: Number(formBodegaOrigenId),
        idBodegaDestino: Number(formBodegaDestinoId),
        nota: formObservaciones,
        detalle: trasladoItems.map((item) => ({
          idExistencia: item.idExistencia,
          cantidad: item.cantidad,
        })),
      });

      await updateTraslado(trasladoSeleccionado.id, payload);
      await loadTraslados();

      if (formBodegaOrigenId) {
        await loadExistencias(Number(formBodegaOrigenId));
      }

      toast.success("Traslado actualizado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error actualizando traslado:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo actualizar el traslado"
      );
    } finally {
      setIsUpdatingTraslado(false);
    }
  };

  const handleConfirmEstado = async () => {
    if (!canChangeEstadoTraslados) {
      toast.error("No tienes permiso para cambiar el estado de traslados");
      return;
    }

    if (isChangingEstadoTraslado) return;
    if (!trasladoParaCambioEstado || !nuevoEstado) return;

    try {
      setIsChangingEstadoTraslado(true);

      await updateTraslado(trasladoParaCambioEstado.id, {
        id_estado_traslado: estadoTrasladoUIToBackend(nuevoEstado),
      });

      await loadTraslados();

      if (formBodegaOrigenId) {
        await loadExistencias(Number(formBodegaOrigenId));
      }

      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error: any) {
      console.error("Error cambiando estado del traslado:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo cambiar el estado del traslado"
      );
    } finally {
      setIsChangingEstadoTraslado(false);
      setShowConfirmEstadoModal(false);
      setTrasladoParaCambioEstado(null);
      setNuevoEstado(null);
    }
  };

  const confirmAnular = async () => {
    if (!canAnularTraslados) {
      toast.error("No tienes permiso para anular traslados");
      return;
    }

    if (isAnulandoTraslado) return;
    if (!trasladoSeleccionado) return;

    const motivo = formObservaciones.trim();

    if (!motivo) {
      toast.error("Debes indicar el motivo de la anulación");
      return;
    }

    try {
      setIsAnulandoTraslado(true);

      await updateTraslado(trasladoSeleccionado.id, {
        id_estado_traslado: 4,
        nota: buildNotaAnulacion(trasladoSeleccionado.observaciones, motivo),
      });

      await loadTraslados();

      toast.success("Traslado anulado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error anulando traslado:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo anular el traslado"
      );
    } finally {
      setIsAnulandoTraslado(false);
    }
  };

  // =========================================================
  // Return
  // =========================================================
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Gestión de Traslados</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Administra los traslados de productos entre bodegas
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar traslados por fecha, bodegas, unidades, estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {canCreateTraslados && (
          <Button
            onClick={handleNuevoTraslado}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Traslado
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
            <Input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fecha-fin">Fecha Fin</Label>
            <Input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Bodega Origen</TableHead>
                <TableHead>Bodega Destino</TableHead>
                <TableHead className="text-center">Total Unidades</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingTraslados ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando traslados...
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentTraslados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron traslados</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentTraslados.map((traslado, index) => {
                  const estadoBadge = getEstadoBadge(traslado.estado);
                  const Icon = estadoBadge.icon;
                  const siguienteEstado = getSiguienteEstado(traslado.estado);
                  const totalUnidades = calcularTotalItems(traslado.items);

                  return (
                    <TableRow key={traslado.id} className="hover:bg-gray-50">
                      <TableCell>{startIndex + index + 1}</TableCell>

                      <TableCell className="font-medium">
                        {formatFecha(traslado.fecha)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-blue-600" />
                          {traslado.bodegaOrigen}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-green-600" />
                          {traslado.bodegaDestino}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        {totalUnidades}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => siguienteEstado && handleEstadoClick(traslado)}
                          disabled={!siguienteEstado || !canChangeEstadoTraslados}
                          className={`h-7 px-3 ${estadoBadge.class} ${!siguienteEstado || !canChangeEstadoTraslados
                            ? "opacity-100 cursor-default"
                            : ""
                            }`}
                        >
                          <Icon size={14} className="mr-1" />
                          {traslado.estado}
                        </Button>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(traslado)}
                            className="hover:bg-blue-50"
                            title="Ver"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>

                          {canEditTraslados && traslado.estado === "Pendiente" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(traslado)}
                              className="hover:bg-yellow-50"
                              title="Editar"
                            >
                              <Edit size={16} className="text-yellow-600" />
                            </Button>
                          )}

                          {canAnularTraslados && traslado.estado === "Pendiente" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAnular(traslado)}
                              className="hover:bg-red-50"
                              title="Anular"
                            >
                              <Ban size={16} className="text-red-600" />
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
      </div>


      <div>
        {!isLoadingTraslados && filteredTraslados.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredTraslados.length)} de{" "}
              {filteredTraslados.length} traslados
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || totalPages === 0}
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
                      className={
                        currentPage === page
                          ? "bg-purple-600 hover:bg-purple-700"
                          : ""
                      }
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
                disabled={currentPage === totalPages || totalPages === 0}
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
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="traslado-details-description"
        >
          <DialogHeader>
            <DialogTitle>Detalles del Traslado</DialogTitle>
            <DialogDescription id="traslado-details-description">
              Información completa del traslado de productos entre bodegas
            </DialogDescription>
          </DialogHeader>

          {!trasladoSeleccionado ? (
            <div className="py-8 text-center text-gray-500">
              Cargando traslado...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Código</Label>
                  <p className="font-medium">{trasladoSeleccionado.codigo}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha</Label>
                  <p className="font-medium">
                    {formatFecha(trasladoSeleccionado.fecha)}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Bodega Origen</Label>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <p className="font-medium">{trasladoSeleccionado.bodegaOrigen}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Bodega Destino</Label>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-green-600" />
                    <p className="font-medium">
                      {trasladoSeleccionado.bodegaDestino}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Responsable</Label>
                  <p className="font-medium">{trasladoSeleccionado.responsable}</p>
                </div>

                <div className="mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const siguienteEstado = getSiguienteEstado(
                        trasladoSeleccionado.estado
                      );
                      if (siguienteEstado) handleEstadoClick(trasladoSeleccionado);
                    }}
                    disabled={
                      !getSiguienteEstado(trasladoSeleccionado.estado) ||
                      !canChangeEstadoTraslados
                    }
                    className={`h-7 px-3 ${getEstadoBadge(trasladoSeleccionado.estado).class
                      } ${!getSiguienteEstado(trasladoSeleccionado.estado) ||
                        !canChangeEstadoTraslados
                        ? "opacity-100 cursor-default"
                        : ""
                      }`}
                  >
                    {(() => {
                      const EstadoIcon = getEstadoBadge(
                        trasladoSeleccionado.estado
                      ).icon;
                      return <EstadoIcon size={14} className="mr-1" />;
                    })()}
                    {trasladoSeleccionado.estado}
                  </Button>
                </div>
              </div>

              {trasladoSeleccionado.observaciones && (
                <div>
                  <Label className="text-gray-600">Observaciones</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {trasladoSeleccionado.observaciones}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-gray-900 mb-3 block">
                  Productos del Traslado
                </Label>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {trasladoSeleccionado.items.map((item, index) => (
                      <TableRow key={`${item.idExistencia}-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.productoNombre}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {item.loteNumero}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.cantidad}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <Label className="text-gray-600">Total de Unidades</Label>
                    <p className="text-xl font-bold text-purple-600">
                      {calcularTotalItems(trasladoSeleccionado.items)}
                    </p>
                  </div>
                </div>
              </div>
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
        open={isCrear || isEditar}
        onOpenChange={(open) => {
          if (!open) handleCloseCreateModal();
        }}
      >
        <DialogContent
          className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="traslado-create-description"
        >
          <DialogHeader>
            <DialogTitle>
              {isEditar ? "Editar Traslado" : "Nuevo Traslado"}
            </DialogTitle>
            <DialogDescription id="traslado-create-description">
              {isEditar
                ? "Modifica la información del traslado antes de enviarlo"
                : "Completa la información para trasladar productos entre bodegas"}
            </DialogDescription>
          </DialogHeader>

          {isHydratingForm ? (
            <div className="py-8 text-center text-gray-500">
              Cargando formulario...
            </div>
          ) : (
            <div className="space-y-6">
              {isEditar && trasladoSeleccionado && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Estás editando el traslado{" "}
                  <span className="font-semibold">{trasladoSeleccionado.codigo}</span>.
                  Solo se permite editar mientras esté en estado Pendiente.
                </div>
              )}

              {trasladoItems.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Ya agregaste productos. Para cambiar la bodega de origen o destino,
                  primero elimina los productos del traslado.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="traslado-origen">Bodega Origen *</Label>
                  <Select
                    value={formBodegaOrigenId === "" ? "" : String(formBodegaOrigenId)}
                    onValueChange={handleBodegaOrigenChange}
                    disabled={trasladoItems.length > 0 || isLoadingCatalogos}
                  >
                    <SelectTrigger id="traslado-origen">
                      <SelectValue placeholder="Selecciona bodega origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasCatalogo.map((bodega) => (
                        <SelectItem key={bodega.id} value={String(bodega.id)}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bodegaOrigen && touched.bodegaOrigen && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.bodegaOrigen}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="traslado-destino">Bodega Destino *</Label>
                  <Select
                    value={
                      formBodegaDestinoId === "" ? "" : String(formBodegaDestinoId)
                    }
                    onValueChange={handleBodegaDestinoChange}
                    disabled={trasladoItems.length > 0 || isLoadingCatalogos}
                  >
                    <SelectTrigger id="traslado-destino">
                      <SelectValue placeholder="Selecciona bodega destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasCatalogo
                        .filter((bodega) => bodega.id !== formBodegaOrigenId)
                        .map((bodega) => (
                          <SelectItem key={bodega.id} value={String(bodega.id)}>
                            {bodega.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.bodegaDestino && touched.bodegaDestino && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.bodegaDestino}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Agregar Productos al Traslado
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="current-producto">Producto *</Label>
                      <Select
                        value={currentProductoId === "" ? "" : String(currentProductoId)}
                        onValueChange={handleCurrentProductoChange}
                        disabled={isLoadingExistencias}
                      >
                        <SelectTrigger id="current-producto">
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productosDisponibles.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-gray-500">
                              No hay productos disponibles en la bodega activa
                            </div>
                          ) : (
                            productosDisponibles.map((producto) => (
                              <SelectItem
                                key={producto.id}
                                value={String(producto.id)}
                              >
                                {producto.nombre}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.currentProducto && touched.currentProducto && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.currentProducto}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="current-lote">Lote *</Label>
                      <Select
                        value={
                          currentExistenciaId === "" ? "" : String(currentExistenciaId)
                        }
                        onValueChange={handleCurrentLoteChange}
                        disabled={!currentProductoId}
                      >
                        <SelectTrigger id="current-lote">
                          <SelectValue placeholder="Selecciona un lote" />
                        </SelectTrigger>
                        <SelectContent>
                          {lotesDisponibles.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-gray-500">
                              No hay lotes disponibles
                            </div>
                          ) : (
                            lotesDisponibles.map((existencia) => (
                              <SelectItem
                                key={existencia.idExistencia}
                                value={String(existencia.idExistencia)}
                              >
                                {existencia.lote} - Disp: {existencia.cantidadDisponible}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.currentLote && touched.currentLote && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.currentLote}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="current-cantidad">Cantidad *</Label>
                      <Input
                        id="current-cantidad"
                        type="text"
                        value={currentCantidad}
                        onChange={(e) => handleCurrentCantidadChange(e.target.value)}
                        onBlur={handleCurrentCantidadBlur}
                        placeholder="Ej: 50"
                        disabled={!currentExistenciaId}
                        className={
                          errors.currentCantidad && touched.currentCantidad
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {currentExistenciaId && !errors.currentCantidad && (
                        <p className="text-xs text-gray-500 mt-1">
                          Máx: {cantidadMaxima}
                        </p>
                      )}
                      {errors.currentCantidad && touched.currentCantidad && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.currentCantidad}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddItem}
                    className="w-full bg-green-600 hover:bg-green-700"
                    type="button"
                    disabled={!formBodegaOrigenId}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                {trasladoItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="w-20 text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trasladoItems.map((item, index) => (
                          <TableRow key={`${item.idExistencia}-${index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {item.productoNombre}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {item.loteNumero}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.cantidad}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="bg-gray-50 px-4 py-2 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        Total de productos:
                      </span>
                      <span className="font-bold text-purple-600 text-sm">
                        {trasladoItems.length}
                      </span>
                    </div>

                    <div className="bg-gray-50 px-4 py-2 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        Total de unidades:
                      </span>
                      <span className="font-bold text-purple-600 text-sm">
                        {calcularTotalItems(trasladoItems)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-full">
                    <Package size={16} className="text-blue-600" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] text-blue-900">Responsable</p>
                    <p className="font-medium text-blue-700 text-xs">
                      {usuario?.nombre || "Usuario"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="traslado-observaciones">Observaciones</Label>
                <Textarea
                  id="traslado-observaciones"
                  value={formObservaciones}
                  onChange={(e) => handleObservacionesChange(e.target.value)}
                  placeholder="Escribe cualquier observación sobre el traslado (opcional)"
                  rows={3}
                  onBlur={handleObservacionesBlur}
                />
                {errors.observaciones && touched.observaciones && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.observaciones}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateModal}>
              Cancelar
            </Button>

            <Button
              onClick={isEditar ? confirmEditTraslado : confirmCreateTraslado}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isCreatingTraslado || isUpdatingTraslado}
            >
              {isEditar
                ? isUpdatingTraslado
                  ? "Guardando..."
                  : "Guardar cambios"
                : isCreatingTraslado
                  ? "Creando..."
                  : "Crear Traslado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={(open) => {
          setShowConfirmEstadoModal(open);
          if (!open) {
            setTrasladoParaCambioEstado(null);
            setNuevoEstado(null);
          }
        }}
      >
        <DialogContent
          className="max-w-md"
          aria-describedby="confirm-estado-description"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este traslado?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <Badge
                variant="outline"
                className={getEstadoBadge(
                  trasladoParaCambioEstado?.estado || "Enviado"
                ).class}
              >
                {trasladoParaCambioEstado?.estado}
              </Badge>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <Badge
                variant="outline"
                className={getEstadoBadge(nuevoEstado || "Enviado").class}
              >
                {nuevoEstado}
              </Badge>
            </div>

            {nuevoEstado === "Recibido" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800">
                  <CheckCircle size={16} className="inline mr-2" />
                  Al confirmar, se actualizará el inventario de las bodegas.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setTrasladoParaCambioEstado(null);
                setNuevoEstado(null);
              }}
              disabled={isChangingEstadoTraslado}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isChangingEstadoTraslado}
            >
              {isChangingEstadoTraslado ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent className="max-w-md" aria-describedby="anular-description">
          <DialogHeader>
            <DialogTitle>Anular Traslado</DialogTitle>
            <DialogDescription id="anular-description">
              Esta acción marcará el traslado como anulado. Por favor indica el
              motivo.
            </DialogDescription>
          </DialogHeader>

          {!trasladoSeleccionado ? (
            <div className="py-6 text-center text-gray-500">
              Cargando traslado...
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <Ban className="text-yellow-600 mt-0.5" size={18} />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">
                    Esta acción no se puede deshacer
                  </p>
                  <p>
                    El traslado quedará marcado como anulado y no podrá cambiar de
                    estado.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="motivo-anulacion">Motivo de Anulación *</Label>
                <Textarea
                  id="motivo-anulacion"
                  value={formObservaciones}
                  onChange={(e) => handleObservacionesChange(e.target.value)}
                  placeholder="Describe el motivo de la anulación..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Volver
            </Button>

            <Button
              onClick={confirmAnular}
              className="bg-red-600 hover:bg-red-700"
              disabled={isAnulandoTraslado}
            >
              <Ban size={16} className="mr-2" />
              {isAnulandoTraslado ? "Anulando..." : "Anular Traslado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="success-description"
        >
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-description">
              El traslado se ha creado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Traslado Creado!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-6">
              El traslado se ha registrado correctamente en el sistema
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