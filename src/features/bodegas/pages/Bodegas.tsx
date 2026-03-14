import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/context/AuthContext";

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
import { Label } from "../../../shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import {
  getBodegas,
  getDepartamentos,
  getMunicipios,
  createBodega,
  updateBodega,
  deleteBodega,
  toggleEstadoBodega,
  type Bodega,
  type CreateBodegaPayload,
  type UpdateBodegaPayload,
  type DepartamentoOption,
  type MunicipioOption,
} from "../services/bodegas.services";

interface BodegasProps {
  triggerCreate?: number;
}

export default function Bodegas({ triggerCreate }: BodegasProps) {
  // =========================================================
  // Contexto, navegación y permisos
  // =========================================================
  const { tienePermiso } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  // =========================================================
  // Estados del módulo
  // =========================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [bodegaParaCambioEstado, setBodegaParaCambioEstado] =
    useState<Bodega | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =========================================================
  // Estados del formulario
  // =========================================================
  const [formNombre, setFormNombre] = useState("");
  const [formDepartamentoId, setFormDepartamentoId] = useState<number | "">("");
  const [formMunicipioId, setFormMunicipioId] = useState<number | "">("");
  const [formDepartamento, setFormDepartamento] = useState("");
  const [formMunicipio, setFormMunicipio] = useState("");
  const [formDireccion, setFormDireccion] = useState("");

  // =========================================================
  // Estados de catálogos
  // =========================================================
  const [departamentosCatalogo, setDepartamentosCatalogo] = useState<DepartamentoOption[]>([]);
  const [municipiosCatalogo, setMunicipiosCatalogo] = useState<MunicipioOption[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  // =========================================================
  // Permisos
  // =========================================================
  const canCreateBodegas = tienePermiso("existencias", "bodegas", "crear");
  const canEditBodegas = tienePermiso("existencias", "bodegas", "editar");
  const canDeleteBodegas = tienePermiso("existencias", "bodegas", "eliminar");
  const canChangeEstadoBodegas = tienePermiso("existencias", "bodegas", "cambiarEstado");

  // =========================================================
  // Estados de errores y touched
  // =========================================================
  const [errors, setErrors] = useState({
    nombre: "",
    departamento: "",
    municipio: "",
    direccion: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
    departamento: false,
    municipio: false,
    direccion: false,
  });

  // =========================================================
  // Estados de proceso async
  // =========================================================
  const [isCreatingBodega, setIsCreatingBodega] = useState(false);
  const [isUpdatingBodega, setIsUpdatingBodega] = useState(false);
  const [isDeletingBodega, setIsDeletingBodega] = useState(false);
  const [isChangingEstadoBodega, setIsChangingEstadoBodega] = useState(false);

  // =========================================================
  // Flags de ruta
  // =========================================================
  const isCrear = location.pathname.endsWith("/bodegas/crear");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const editId = params.id ? Number(params.id) : null;

  // =========================================================
  // Datos derivados / useMemo
  // =========================================================
  const bodegaActual = useMemo(() => {
    if (!editId) return null;
    return bodegas.find((b) => b.id === editId) ?? null;
  }, [bodegas, editId]);

  const filteredBodegas = useMemo(() => {
    return bodegas.filter((bodega) => {
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        bodega.nombre.toLowerCase().includes(searchLower) ||
        bodega.departamento.toLowerCase().includes(searchLower) ||
        bodega.municipio.toLowerCase().includes(searchLower) ||
        bodega.direccion.toLowerCase().includes(searchLower);

      let matchesEstado = true;

      if (estadoFilter === "activas") {
        matchesEstado = bodega.estado === true;
      } else if (estadoFilter === "inactivas") {
        matchesEstado = bodega.estado === false;
      }

      return matchesSearch && matchesEstado;
    });
  }, [bodegas, searchTerm, estadoFilter]);

  const totalPages = Math.ceil(filteredBodegas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBodegas = filteredBodegas.slice(startIndex, endIndex);

  const municipiosDisponibles = municipiosCatalogo;

  // =========================================================
  // Funciones de carga
  // =========================================================
  const loadBodegas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getBodegas();
      setBodegas(response.data);
    } catch (error) {
      console.error("Error cargando bodegas:", error);
      toast.error("No se pudieron cargar las bodegas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDepartamentos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);
      const data = await getDepartamentos();
      setDepartamentosCatalogo(data);
    } catch (error) {
      console.error("Error cargando departamentos:", error);
      toast.error("No se pudieron cargar los departamentos");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const loadMunicipios = useCallback(async (idDepartamento: number) => {
    try {
      setIsLoadingCatalogos(true);
      const data = await getMunicipios(idDepartamento);
      setMunicipiosCatalogo(data);
    } catch (error) {
      console.error("Error cargando municipios:", error);
      toast.error("No se pudieron cargar los municipios");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormNombre("");
    setFormDepartamento("");
    setFormMunicipio("");
    setFormDepartamentoId("");
    setFormMunicipioId("");
    setFormDireccion("");
    setMunicipiosCatalogo([]);

    setErrors({
      nombre: "",
      departamento: "",
      municipio: "",
      direccion: "",
    });

    setTouched({
      nombre: false,
      departamento: false,
      municipio: false,
      direccion: false,
    });
  }, []);

  // =========================================================
  // Handlers de navegación base
  // =========================================================
  const goList = useCallback(() => navigate("/app/bodegas"), [navigate]);
  const goCreate = useCallback(() => navigate("/app/bodegas/crear"), [navigate]);
  const goEdit = useCallback((id: number) => navigate(`/app/bodegas/${id}/editar`), [navigate]);
  const goDelete = useCallback((id: number) => navigate(`/app/bodegas/${id}/eliminar`), [navigate]);

  // =========================================================
  // Efectos
  // =========================================================
  useEffect(() => {
    void Promise.all([loadBodegas(), loadDepartamentos()]);
  }, [loadBodegas, loadDepartamentos]);

  useEffect(() => {
    if (!triggerCreate) return;

    resetForm();
    goCreate();
  }, [triggerCreate, resetForm, goCreate]);

  useEffect(() => {
    if (!isCrear) return;
    resetForm();
  }, [isCrear, resetForm]);

  useEffect(() => {
    if (!isEditar) return;
    if (isLoading) return;

    if (!bodegaActual) {
      toast.error("Bodega no encontrada");
      goList();
      return;
    }

    const idDepartamento = bodegaActual.raw.municipios?.id_departamento ?? "";

    setFormNombre(bodegaActual.nombre);
    setFormDepartamento(bodegaActual.departamento);
    setFormMunicipio(bodegaActual.municipio);
    setFormDepartamentoId(idDepartamento);
    setFormMunicipioId(bodegaActual.idMunicipio);
    setFormDireccion(bodegaActual.direccion);

    setErrors({
      nombre: "",
      departamento: "",
      municipio: "",
      direccion: "",
    });

    setTouched({
      nombre: false,
      departamento: false,
      municipio: false,
      direccion: false,
    });
  }, [isEditar, isLoading, bodegaActual, goList]);

  useEffect(() => {
    if (!isEliminar) return;
    if (isLoading) return;

    if (!bodegaActual) {
      goList();
    }
  }, [isEliminar, isLoading, bodegaActual, goList]);

  useEffect(() => {
    if (!formDepartamentoId) {
      setMunicipiosCatalogo([]);
      return;
    }

    void loadMunicipios(Number(formDepartamentoId));
  }, [formDepartamentoId, loadMunicipios]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  // =========================================================
  // Validaciones y helpers
  // =========================================================
  const validateNombre = (value: string) => {
    if (!value.trim()) return "El nombre de la bodega es requerido";

    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-]+$/;
    if (!validPattern.test(value)) {
      return "Solo se permiten letras, números, espacios y guiones";
    }

    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 100) return "Máximo 100 caracteres";

    return "";
  };

  const validateDepartamento = (value: string) => {
    return !value ? "El departamento es requerido" : "";
  };

  const validateMunicipio = (value: string) => {
    return !value ? "El municipio es requerido" : "";
  };

  const validateDireccion = (value: string) => {
    if (!value.trim()) return "La dirección es requerida";

    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-,#.]+$/;
    if (!validPattern.test(value)) {
      return "Solo se permiten letras, números, espacios, guiones, comas, puntos y #";
    }

    if (value.trim().length < 5) return "Mínimo 5 caracteres";
    if (value.trim().length > 200) return "Máximo 200 caracteres";

    return "";
  };

  const validateForm = () => {
    setTouched({
      nombre: true,
      departamento: true,
      municipio: true,
      direccion: true,
    });

    const nombreError = validateNombre(formNombre);
    const departamentoError = validateDepartamento(formDepartamento);
    const municipioError = validateMunicipio(formMunicipio);
    const direccionError = validateDireccion(formDireccion);

    setErrors({
      nombre: nombreError,
      departamento: departamentoError,
      municipio: municipioError,
      direccion: direccionError,
    });

    if (nombreError || departamentoError || municipioError || direccionError) {
      toast.error("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  // =========================================================
  // Handlers de formulario
  // =========================================================
  const handleNombreChange = (value: string) => {
    setFormNombre(value);

    if (touched.nombre) {
      setErrors((prev) => ({
        ...prev,
        nombre: validateNombre(value),
      }));
    }
  };

  const handleDepartamentoChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    const departamentoSeleccionado =
      departamentosCatalogo.find((d) => d.id === parsed) ?? null;

    setFormDepartamentoId(parsed);
    setFormDepartamento(departamentoSeleccionado?.nombre ?? "");
    setFormMunicipioId("");
    setFormMunicipio("");
    setMunicipiosCatalogo([]);

    if (touched.departamento) {
      setErrors((prev) => ({
        ...prev,
        departamento: validateDepartamento(departamentoSeleccionado?.nombre ?? ""),
      }));
    }

    if (touched.municipio) {
      setErrors((prev) => ({
        ...prev,
        municipio: validateMunicipio(""),
      }));
    }
  };

  const handleMunicipioChange = (value: string) => {
    const parsed = value ? Number(value) : "";

    const municipioSeleccionado =
      municipiosCatalogo.find((m) => m.id === parsed) ?? null;

    setFormMunicipioId(parsed);
    setFormMunicipio(municipioSeleccionado?.nombre ?? "");

    if (touched.municipio) {
      setErrors((prev) => ({
        ...prev,
        municipio: validateMunicipio(municipioSeleccionado?.nombre ?? ""),
      }));
    }
  };

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);

    if (touched.direccion) {
      setErrors((prev) => ({
        ...prev,
        direccion: validateDireccion(value),
      }));
    }
  };

  const handleNombreBlur = () => {
    setTouched((prev) => ({ ...prev, nombre: true }));
    setErrors((prev) => ({ ...prev, nombre: validateNombre(formNombre) }));
  };

  const handleDepartamentoBlur = () => {
    setTouched((prev) => ({ ...prev, departamento: true }));
    setErrors((prev) => ({
      ...prev,
      departamento: validateDepartamento(formDepartamento),
    }));
  };

  const handleMunicipioBlur = () => {
    setTouched((prev) => ({ ...prev, municipio: true }));
    setErrors((prev) => ({
      ...prev,
      municipio: validateMunicipio(formMunicipio),
    }));
  };

  const handleDireccionBlur = () => {
    setTouched((prev) => ({ ...prev, direccion: true }));
    setErrors((prev) => ({
      ...prev,
      direccion: validateDireccion(formDireccion),
    }));
  };

  // =========================================================
  // Handlers de navegación
  // =========================================================
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const onClickCreate = () => {
    if (!canCreateBodegas) {
      toast.error("No tienes permiso para crear bodegas");
      return;
    }

    resetForm();
    goCreate();
  };

  const onClickEdit = (bodega: Bodega) => {
    if (!canEditBodegas) {
      toast.error("No tienes permiso para editar bodegas");
      return;
    }

    goEdit(bodega.id);
  };

  const onClickDelete = (bodega: Bodega) => {
    if (!canDeleteBodegas) {
      toast.error("No tienes permiso para eliminar bodegas");
      return;
    }

    if (bodega.tieneUsuariosAsignados) {
      toast.error("No se puede eliminar una bodega con usuarios asignados");
      return;
    }

    goDelete(bodega.id);
  };

  // =========================================================
  // Handlers de acciones / modales
  // =========================================================
  const onClickToggleEstado = (bodega: Bodega) => {
    if (!canChangeEstadoBodegas) {
      toast.error("No tienes permiso para cambiar el estado de bodegas");
      return;
    }

    if (bodega.tieneUsuariosAsignados && bodega.estado) {
      toast.error("No se puede inactivar una bodega con usuarios asignados");
      return;
    }

    setBodegaParaCambioEstado(bodega);
    setShowConfirmEstadoModal(true);
  };

  // =========================================================
  // Confirmaciones / acciones async
  // =========================================================
  const confirmCreate = async () => {
    if (!canCreateBodegas) {
      toast.error("No tienes permiso para crear bodegas");
      return;
    }

    if (isCreatingBodega) return;
    if (!validateForm()) return;

    if (!formMunicipioId) {
      toast.error("Debes seleccionar un municipio válido");
      return;
    }

    try {
      setIsCreatingBodega(true);

      const payload: CreateBodegaPayload = {
        nombre_bodega: formNombre.trim(),
        direccion: formDireccion.trim(),
        id_municipio: Number(formMunicipioId),
        estado: true,
      };

      await createBodega(payload);
      await loadBodegas();

      setShowSuccessModal(true);
      goList();
    } catch (error: any) {
      console.error("Error creando bodega:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo crear la bodega"
      );
    } finally {
      setIsCreatingBodega(false);
    }
  };

  const confirmEdit = async () => {
    if (!canEditBodegas) {
      toast.error("No tienes permiso para editar bodegas");
      return;
    }

    if (isUpdatingBodega) return;
    if (!bodegaActual) {
      toast.error("No hay bodega seleccionada para editar");
      return;
    }

    if (!validateForm()) return;

    if (!formMunicipioId) {
      toast.error("Debes seleccionar un municipio válido");
      return;
    }

    try {
      setIsUpdatingBodega(true);

      const payload: UpdateBodegaPayload = {
        nombre_bodega: formNombre.trim(),
        direccion: formDireccion.trim(),
        id_municipio: Number(formMunicipioId),
        estado: bodegaActual.estado,
      };

      await updateBodega(bodegaActual.id, payload);
      await loadBodegas();

      toast.success("Bodega actualizada exitosamente");
      goList();
    } catch (error: any) {
      console.error("Error actualizando bodega:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo actualizar la bodega"
      );
    } finally {
      setIsUpdatingBodega(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDeleteBodegas) {
      toast.error("No tienes permiso para eliminar bodegas");
      return;
    }

    if (isDeletingBodega) return;
    if (!bodegaActual) return;

    if (bodegaActual.tieneUsuariosAsignados) {
      toast.error("No se puede eliminar una bodega con usuarios asignados");
      return;
    }

    try {
      setIsDeletingBodega(true);

      await deleteBodega(bodegaActual.id);
      await loadBodegas();

      toast.success("Bodega eliminada exitosamente");
      goList();
    } catch (error: any) {
      console.error("Error eliminando bodega:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo eliminar la bodega"
      );
    } finally {
      setIsDeletingBodega(false);
    }
  };

  const confirmToggleEstado = async () => {
    if (!canChangeEstadoBodegas) {
      toast.error("No tienes permiso para cambiar el estado de bodegas");
      return;
    }

    if (isChangingEstadoBodega) return;
    if (!bodegaParaCambioEstado) return;

    if (bodegaParaCambioEstado.tieneUsuariosAsignados && bodegaParaCambioEstado.estado) {
      toast.error("No se puede inactivar una bodega con usuarios asignados");
      setShowConfirmEstadoModal(false);
      setBodegaParaCambioEstado(null);
      return;
    }

    try {
      setIsChangingEstadoBodega(true);

      const updated = await toggleEstadoBodega(
        bodegaParaCambioEstado.id,
        bodegaParaCambioEstado.estado
      );

      await loadBodegas();

      toast.success(
        `Bodega ${updated.estado ? "activada" : "desactivada"} exitosamente`
      );
    } catch (error: any) {
      console.error("Error cambiando estado de bodega:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo cambiar el estado"
      );
    } finally {
      setIsChangingEstadoBodega(false);
      setShowConfirmEstadoModal(false);
      setBodegaParaCambioEstado(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Bodegas</h2>
        <p className="text-gray-600 mt-1">
          Administra las bodegas y centros de almacenamiento
        </p>
      </div>

      {/* Search + filtros + botón */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar bodegas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro Estado */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
          <Filter size={16} className="text-gray-500 ml-2" />
          <Button
            size="sm"
            variant={estadoFilter === "todos" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("todos")}
            className={`h-8 ${estadoFilter === "todos"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "hover:bg-gray-200"
              }`}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === "activas" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("activas")}
            className={`h-8 ${estadoFilter === "activas"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "hover:bg-gray-200"
              }`}
          >
            Activas
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === "inactivas" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("inactivas")}
            className={`h-8 ${estadoFilter === "inactivas"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "hover:bg-gray-200"
              }`}
          >
            Inactivas
          </Button>
        </div>

        {canCreateBodegas && (
          <Button
            onClick={onClickCreate}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            <Plus size={18} className="mr-2" />
            Nueva Bodega
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                    Cargando bodegas...
                  </TableCell>
                </TableRow>
              ) : currentBodegas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron bodegas
                  </TableCell>
                </TableRow>
              ) : (
                currentBodegas.map((bodega, index) => (
                  <TableRow key={bodega.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {bodega.nombre}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {bodega.municipio}, {bodega.departamento}
                    </TableCell>

                    <TableCell className="text-gray-700">{bodega.direccion}</TableCell>

                    <TableCell className="text-center">
                      {canChangeEstadoBodegas && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onClickToggleEstado(bodega)}
                          disabled={
                            isChangingEstadoBodega ||
                            (bodega.tieneUsuariosAsignados && bodega.estado)
                          }
                          className={
                            bodega.tieneUsuariosAsignados && bodega.estado
                              ? "bg-green-100 text-gray-400 cursor-not-allowed"
                              : bodega.estado
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                          title={
                            bodega.tieneUsuariosAsignados && bodega.estado
                              ? "No se puede inactivar porque tiene usuarios asignados"
                              : bodega.estado
                                ? "Inactivar"
                                : "Activar"
                          }
                        >
                          {bodega.estado ? "Activa" : "Inactiva"}
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {canEditBodegas && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onClickEdit(bodega)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>
                        )}

                        {canDeleteBodegas && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onClickDelete(bodega)}
                            disabled={bodega.tieneUsuariosAsignados}
                            className={`h-8 w-8 ${bodega.tieneUsuariosAsignados
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              }`}
                            title={
                              bodega.tieneUsuariosAsignados
                                ? "No se puede eliminar porque tiene usuarios asignados"
                                : "Eliminar"
                            }
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación */}
      {!isLoading && filteredBodegas.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} -{" "}
            {Math.min(endIndex, filteredBodegas.length)} de{" "}
            {filteredBodegas.length} bodegas
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL CREAR */}
      <Dialog
        open={isCrear}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) goList();
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Crear Nueva Bodega</DialogTitle>
            <DialogDescription>
              Completa la información para registrar una nueva bodega en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="create-nombre">Nombre de la Bodega *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Bodega Principal"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-departamento">Departamento *</Label>
                <Select
                  value={formDepartamentoId === "" ? "" : String(formDepartamentoId)}
                  onValueChange={handleDepartamentoChange}
                  onOpenChange={(open: boolean) => !open && handleDepartamentoBlur()}
                  disabled={isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="create-departamento"
                    className={
                      errors.departamento && touched.departamento
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentosCatalogo.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamento && touched.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-municipio">Municipio *</Label>
                <Select
                  value={formMunicipioId === "" ? "" : String(formMunicipioId)}
                  onValueChange={handleMunicipioChange}
                  onOpenChange={(open: boolean) => !open && handleMunicipioBlur()}
                  disabled={!formDepartamentoId || isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="create-municipio"
                    className={
                      errors.municipio && touched.municipio ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosDisponibles.map((municipio) => (
                      <SelectItem key={municipio.id} value={String(municipio.id)}>
                        {municipio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-sm mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="create-direccion">Dirección *</Label>
              <Input
                id="create-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                onBlur={handleDireccionBlur}
                placeholder="Ej: Calle 80 #45-23"
                className={errors.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={goList} disabled={isCreatingBodega}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isCreatingBodega}
            >
              {isCreatingBodega ? "Creando..." : "Crear Bodega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog
        open={isEditar}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) goList();
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Bodega</DialogTitle>
            <DialogDescription>Modifica la información de la bodega</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre de la Bodega *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Bodega Principal"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-departamento">Departamento *</Label>
                <Select
                  value={formDepartamentoId === "" ? "" : String(formDepartamentoId)}
                  onValueChange={handleDepartamentoChange}
                  onOpenChange={(open: boolean) => !open && handleDepartamentoBlur()}
                  disabled={isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="edit-departamento"
                    className={
                      errors.departamento && touched.departamento
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentosCatalogo.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamento && touched.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-municipio">Municipio *</Label>
                <Select
                  value={formMunicipioId === "" ? "" : String(formMunicipioId)}
                  onValueChange={handleMunicipioChange}
                  onOpenChange={(open: boolean) => !open && handleMunicipioBlur()}
                  disabled={!formDepartamentoId || isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="edit-municipio"
                    className={
                      errors.municipio && touched.municipio ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosDisponibles.map((municipio) => (
                      <SelectItem key={municipio.id} value={String(municipio.id)}>
                        {municipio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-sm mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                onBlur={handleDireccionBlur}
                placeholder="Ej: Calle 80 #45-23"
                className={errors.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={goList} disabled={isUpdatingBodega}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isUpdatingBodega}
            >
              {isUpdatingBodega ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog
        open={isEliminar}
        modal
        onOpenChange={(open: boolean) => {
          if (!open) goList();
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Eliminar Bodega</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta bodega? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>

          {bodegaActual && (
            <div className="py-4">
              <p className="text-gray-700">
                Bodega: <span className="font-semibold">{bodegaActual.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Ubicación: {bodegaActual.municipio}, {bodegaActual.departamento}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={goList} disabled={isDeletingBodega}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeletingBodega || !!bodegaActual?.tieneUsuariosAsignados}
            >
              {isDeletingBodega ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAR ESTADO */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={(open) => {
          setShowConfirmEstadoModal(open);
          if (!open) setBodegaParaCambioEstado(null);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar el estado de esta bodega?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bodega:</span>
              <span className="font-medium">{bodegaParaCambioEstado?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span
                className={`font-medium ${bodegaParaCambioEstado?.estado ? "text-green-700" : "text-red-700"
                  }`}
              >
                {bodegaParaCambioEstado?.estado ? "Activa" : "Inactiva"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span
                className={`font-medium ${!bodegaParaCambioEstado?.estado ? "text-green-700" : "text-red-700"
                  }`}
              >
                {!bodegaParaCambioEstado?.estado ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setBodegaParaCambioEstado(null);
              }}
              disabled={isChangingEstadoBodega}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmToggleEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                isChangingEstadoBodega ||
                !bodegaParaCambioEstado ||
                (bodegaParaCambioEstado.estado &&
                  bodegaParaCambioEstado.tieneUsuariosAsignados)
              }
            >
              {isChangingEstadoBodega ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ÉXITO */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription className="sr-only">
              La bodega se ha registrado correctamente
            </DialogDescription>

            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>
            <DialogDescription className="text-center">
              La bodega ha sido creada correctamente en el sistema
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-center">
            <Button
              onClick={handleSuccessModalClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
