import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Filter,
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
import { Label } from "../../../shared/components/ui/label";
import { Badge } from "../../../shared/components/ui/badge";
import { Textarea } from "../../../shared/components/ui/textarea";
import { toast } from "sonner";
import { Rol, Permisos, createEmptyPermisos } from "../../../data/roles";
import {
  getRoles,
  createRol,
  updateRol,
  deleteRol,
} from "../services/roles.services";
import { getPermisos, PermisoBackend } from "../services/permisos.service";
import {
  rolBackendToUI,
  permisosFrontendToIds,
} from "../services/roles.mapper";
import { PermisosForm } from "../components/PermisosForm";
import { useAuth } from "../../../shared/context/AuthContext";

// =========================================================
// Helper visual
// =========================================================
const getRolColor = (nombre: string) => {
  const colors: Record<string, string> = {
    Administrador: "bg-purple-100 text-purple-800",
    Vendedor: "bg-yellow-100 text-yellow-800",
    "Auxiliar Administrativo": "bg-cyan-100 text-cyan-800",
    "Auxiliar de Bodega": "bg-orange-100 text-orange-800",
    Conductor: "bg-indigo-100 text-indigo-800",
  };

  return colors[nombre] || "bg-gray-100 text-gray-800";
};

export default function Roles() {
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
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [rolParaCambioEstado, setRolParaCambioEstado] = useState<Rol | null>(null);
  const [isCreatingRol, setIsCreatingRol] = useState(false);
  const [isUpdatingRol, setIsUpdatingRol] = useState(false);
  const [isDeletingRol, setIsDeletingRol] = useState(false);
  const [isChangingEstadoRol, setIsChangingEstadoRol] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =========================================================
  // Estados del formulario
  // =========================================================
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPermisos, setFormPermisos] = useState<Permisos>(createEmptyPermisos());

  // =========================================================
  // Estados de catálogos
  // =========================================================
  const [catalogoPermisos, setCatalogoPermisos] = useState<PermisoBackend[]>([]);

  // =========================================================
  // Permisos
  // =========================================================
  const puedeCrear = tienePermiso("administracion", "roles", "crear");
  const puedeEditar = tienePermiso("administracion", "roles", "editar");
  const puedeEliminar = tienePermiso("administracion", "roles", "eliminar");
  const puedeCambiarEstado = tienePermiso("administracion", "roles", "cambiarEstado");

  // =========================================================
  // Estados de errores y touched
  // =========================================================
  const [errors, setErrors] = useState({
    nombre: "",
    descripcion: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
    descripcion: false,
  });

  // =========================================================
  // Flags de ruta
  // =========================================================
  const id = params.id;

  const isCrear = location.pathname.endsWith("/roles/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  // =========================================================
  // Datos derivados / useMemo
  // =========================================================
  const rolSeleccionado = useMemo(() => {
    if (!id) return null;

    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;

    return roles.find((r) => r.id === numericId) ?? null;
  }, [roles, id]);

  const filteredRoles = useMemo(() => {
    return roles.filter((rol) => {
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        rol.nombre.toLowerCase().includes(searchLower) ||
        rol.descripcion.toLowerCase().includes(searchLower);

      if (estadoFilter === "todos") return matchesSearch;
      return estadoFilter === "activo"
        ? matchesSearch && rol.estado
        : matchesSearch && !rol.estado;
    });
  }, [roles, searchTerm, estadoFilter]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoles = filteredRoles.slice(startIndex, endIndex);

  // =========================================================
  // Funciones de carga
  // =========================================================
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [rolesResp, permisosResp] = await Promise.all([
        getRoles(true),
        getPermisos(),
      ]);

      setRoles(rolesResp.map(rolBackendToUI));
      setCatalogoPermisos(permisosResp);
    } catch (error) {
      console.error("Error cargando roles:", error);
      toast.error("No se pudieron cargar los roles y permisos");
    } finally {
      setLoading(false);
    }
  }, []);

  const closeToList = () => navigate("/app/roles");

  // =========================================================
  // Efectos
  // =========================================================
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;
    if (loading) return;

    if (!rolSeleccionado) {
      closeToList();
    }
  }, [isVer, isEditar, isEliminar, rolSeleccionado, loading]);

  useEffect(() => {
    if (!isEditar) return;
    if (!rolSeleccionado) return;

    setFormNombre(rolSeleccionado.nombre);
    setFormDescripcion(rolSeleccionado.descripcion);
    setFormPermisos(rolSeleccionado.permisos);

    setErrors({
      nombre: "",
      descripcion: "",
    });

    setTouched({
      nombre: false,
      descripcion: false,
    });
  }, [isEditar, rolSeleccionado]);

  useEffect(() => {
    if (!isCrear) return;

    setFormNombre("");
    setFormDescripcion("");
    setFormPermisos(createEmptyPermisos());

    setErrors({
      nombre: "",
      descripcion: "",
    });

    setTouched({
      nombre: false,
      descripcion: false,
    });
  }, [isCrear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  // =========================================================
  // Validaciones y helpers
  // =========================================================
  const hasInvalidCharacters = (value: string) => {
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-_]*$/;
    return !validPattern.test(value);
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return "El nombre del rol es requerido";
    }
    if (value.trim().length < 3) {
      return "Mínimo 3 caracteres";
    }
    if (value.trim().length > 50) {
      return "Máximo 50 caracteres";
    }
    if (hasInvalidCharacters(value)) {
      return "Caracteres no permitidos detectados";
    }
    return "";
  };

  const validateDescripcion = (value: string) => {
    if (!value.trim()) {
      return "La descripción es requerida";
    }
    if (value.trim().length < 10) {
      return "Mínimo 10 caracteres";
    }
    if (value.trim().length > 200) {
      return "Máximo 200 caracteres";
    }
    if (hasInvalidCharacters(value)) {
      return "Caracteres no permitidos detectados";
    }
    return "";
  };

  const validateForm = () => {
    setTouched({
      nombre: true,
      descripcion: true,
    });

    const nombreError = validateNombre(formNombre);
    const descripcionError = validateDescripcion(formDescripcion);

    setErrors({
      nombre: nombreError,
      descripcion: descripcionError,
    });

    if (nombreError || descripcionError) {
      toast.error("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  const isModuleFullyChecked = (module: string): boolean => {
    if (module === "dashboard") {
      return formPermisos.dashboard.acceder;
    }

    if (module === "existencias") {
      return (
        formPermisos.existencias.productos.ver &&
        formPermisos.existencias.productos.crear &&
        formPermisos.existencias.productos.editar &&
        formPermisos.existencias.productos.cambiarEstado &&
        formPermisos.existencias.traslados.ver &&
        formPermisos.existencias.traslados.crear &&
        formPermisos.existencias.traslados.editar &&
        formPermisos.existencias.traslados.cambiarEstado &&
        formPermisos.existencias.traslados.anular &&
        formPermisos.existencias.bodegas.ver &&
        formPermisos.existencias.bodegas.crear &&
        formPermisos.existencias.bodegas.editar &&
        formPermisos.existencias.bodegas.cambiarEstado &&
        formPermisos.existencias.bodegas.eliminar
      );
    }

    if (module === "compras") {
      return (
        formPermisos.compras.proveedores.ver &&
        formPermisos.compras.proveedores.crear &&
        formPermisos.compras.proveedores.editar &&
        formPermisos.compras.proveedores.cambiarEstado &&
        formPermisos.compras.proveedores.eliminar &&
        formPermisos.compras.ordenesCompra.ver &&
        formPermisos.compras.ordenesCompra.crear &&
        formPermisos.compras.ordenesCompra.descargar &&
        formPermisos.compras.ordenesCompra.editar &&
        formPermisos.compras.ordenesCompra.cambiarEstado &&
        formPermisos.compras.ordenesCompra.anular &&
        formPermisos.compras.remisionesCompra.ver &&
        formPermisos.compras.remisionesCompra.crear &&
        formPermisos.compras.remisionesCompra.descargar &&
        formPermisos.compras.remisionesCompra.editar &&
        formPermisos.compras.remisionesCompra.cambiarEstado &&
        formPermisos.compras.remisionesCompra.anular
      );
    }

    if (module === "ventas") {
      return (
        formPermisos.ventas.clientes.ver &&
        formPermisos.ventas.clientes.crear &&
        formPermisos.ventas.clientes.editar &&
        formPermisos.ventas.clientes.cambiarEstado &&
        formPermisos.ventas.clientes.eliminar &&
        formPermisos.ventas.cotizaciones.ver &&
        formPermisos.ventas.cotizaciones.crear &&
        formPermisos.ventas.cotizaciones.descargar &&
        formPermisos.ventas.cotizaciones.editar &&
        formPermisos.ventas.cotizaciones.cambiarEstado &&
        formPermisos.ventas.cotizaciones.anular &&
        formPermisos.ventas.ordenesVenta.ver &&
        formPermisos.ventas.ordenesVenta.crear &&
        formPermisos.ventas.ordenesVenta.descargar &&
        formPermisos.ventas.ordenesVenta.editar &&
        formPermisos.ventas.ordenesVenta.cambiarEstado &&
        formPermisos.ventas.ordenesVenta.anular &&
        formPermisos.ventas.remisionesVenta.ver &&
        formPermisos.ventas.remisionesVenta.crear &&
        formPermisos.ventas.remisionesVenta.descargar &&
        formPermisos.ventas.remisionesVenta.editar &&
        formPermisos.ventas.remisionesVenta.cambiarEstado &&
        formPermisos.ventas.remisionesVenta.anular &&
        formPermisos.ventas.pagos.ver &&
        formPermisos.ventas.pagos.crear &&
        formPermisos.ventas.pagos.agregarAbonos &&
        formPermisos.ventas.pagos.anular
      );
    }

    if (module === "administracion") {
      return (
        formPermisos.administracion.roles.ver &&
        formPermisos.administracion.roles.crear &&
        formPermisos.administracion.roles.editar &&
        formPermisos.administracion.roles.cambiarEstado &&
        formPermisos.administracion.roles.eliminar &&
        formPermisos.administracion.usuarios.ver &&
        formPermisos.administracion.usuarios.crear &&
        formPermisos.administracion.usuarios.editar &&
        formPermisos.administracion.usuarios.eliminar &&
        formPermisos.administracion.usuarios.cambiarEstado &&
        formPermisos.administracion.usuarios.restablecerContrasena
      );
    }

    return false;
  };

  // =========================================================
  // Handlers de formulario
  // =========================================================
  const handleNombreChange = (value: string) => {
    setFormNombre(value);

    if (touched.nombre) {
      setErrors({
        ...errors,
        nombre: validateNombre(value),
      });
    }
  };

  const handleDescripcionChange = (value: string) => {
    setFormDescripcion(value);

    if (touched.descripcion) {
      setErrors({
        ...errors,
        descripcion: validateDescripcion(value),
      });
    }
  };

  const handleNombreBlur = () => {
    setTouched({
      ...touched,
      nombre: true,
    });

    setErrors({
      ...errors,
      nombre: validateNombre(formNombre),
    });
  };

  const handleDescripcionBlur = () => {
    setTouched({
      ...touched,
      descripcion: true,
    });

    setErrors({
      ...errors,
      descripcion: validateDescripcion(formDescripcion),
    });
  };

  const updatePermiso = (path: string[], value: boolean) => {
    const newPermisos = JSON.parse(JSON.stringify(formPermisos));

    let current: any = newPermisos;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setFormPermisos(newPermisos);
  };

  const toggleModulePermissions = (module: string) => {
    const newPermisos = JSON.parse(JSON.stringify(formPermisos));
    const allChecked = isModuleFullyChecked(module);

    if (module === "dashboard") {
      newPermisos.dashboard.acceder = !allChecked;
    }

    if (module === "existencias") {
      newPermisos.existencias.productos.ver = !allChecked;
      newPermisos.existencias.productos.crear = !allChecked;
      newPermisos.existencias.productos.editar = !allChecked;
      newPermisos.existencias.productos.cambiarEstado = !allChecked;

      newPermisos.existencias.traslados.ver = !allChecked;
      newPermisos.existencias.traslados.crear = !allChecked;
      newPermisos.existencias.traslados.editar = !allChecked;
      newPermisos.existencias.traslados.cambiarEstado = !allChecked;
      newPermisos.existencias.traslados.anular = !allChecked;

      newPermisos.existencias.bodegas.ver = !allChecked;
      newPermisos.existencias.bodegas.crear = !allChecked;
      newPermisos.existencias.bodegas.editar = !allChecked;
      newPermisos.existencias.bodegas.cambiarEstado = !allChecked;
      newPermisos.existencias.bodegas.eliminar = !allChecked;
    }

    if (module === "compras") {
      newPermisos.compras.proveedores.ver = !allChecked;
      newPermisos.compras.proveedores.crear = !allChecked;
      newPermisos.compras.proveedores.editar = !allChecked;
      newPermisos.compras.proveedores.cambiarEstado = !allChecked;
      newPermisos.compras.proveedores.eliminar = !allChecked;

      newPermisos.compras.ordenesCompra.ver = !allChecked;
      newPermisos.compras.ordenesCompra.crear = !allChecked;
      newPermisos.compras.ordenesCompra.descargar = !allChecked;
      newPermisos.compras.ordenesCompra.editar = !allChecked;
      newPermisos.compras.ordenesCompra.cambiarEstado = !allChecked;
      newPermisos.compras.ordenesCompra.anular = !allChecked;

      newPermisos.compras.remisionesCompra.ver = !allChecked;
      newPermisos.compras.remisionesCompra.crear = !allChecked;
      newPermisos.compras.remisionesCompra.descargar = !allChecked;
      newPermisos.compras.remisionesCompra.editar = !allChecked;
      newPermisos.compras.remisionesCompra.cambiarEstado = !allChecked;
      newPermisos.compras.remisionesCompra.anular = !allChecked;
    }

    if (module === "ventas") {
      newPermisos.ventas.clientes.ver = !allChecked;
      newPermisos.ventas.clientes.crear = !allChecked;
      newPermisos.ventas.clientes.editar = !allChecked;
      newPermisos.ventas.clientes.cambiarEstado = !allChecked;
      newPermisos.ventas.clientes.eliminar = !allChecked;

      newPermisos.ventas.cotizaciones.ver = !allChecked;
      newPermisos.ventas.cotizaciones.crear = !allChecked;
      newPermisos.ventas.cotizaciones.descargar = !allChecked;
      newPermisos.ventas.cotizaciones.editar = !allChecked;
      newPermisos.ventas.cotizaciones.cambiarEstado = !allChecked;
      newPermisos.ventas.cotizaciones.anular = !allChecked;

      newPermisos.ventas.ordenesVenta.ver = !allChecked;
      newPermisos.ventas.ordenesVenta.crear = !allChecked;
      newPermisos.ventas.ordenesVenta.descargar = !allChecked;
      newPermisos.ventas.ordenesVenta.editar = !allChecked;
      newPermisos.ventas.ordenesVenta.cambiarEstado = !allChecked;
      newPermisos.ventas.ordenesVenta.anular = !allChecked;

      newPermisos.ventas.remisionesVenta.ver = !allChecked;
      newPermisos.ventas.remisionesVenta.crear = !allChecked;
      newPermisos.ventas.remisionesVenta.descargar = !allChecked;
      newPermisos.ventas.remisionesVenta.editar = !allChecked;
      newPermisos.ventas.remisionesVenta.cambiarEstado = !allChecked;
      newPermisos.ventas.remisionesVenta.anular = !allChecked;

      newPermisos.ventas.pagos.ver = !allChecked;
      newPermisos.ventas.pagos.crear = !allChecked;
      newPermisos.ventas.pagos.agregarAbonos = !allChecked;
      newPermisos.ventas.pagos.anular = !allChecked;
    }

    if (module === "administracion") {
      newPermisos.administracion.roles.ver = !allChecked;
      newPermisos.administracion.roles.crear = !allChecked;
      newPermisos.administracion.roles.editar = !allChecked;
      newPermisos.administracion.roles.cambiarEstado = !allChecked;
      newPermisos.administracion.roles.eliminar = !allChecked;

      newPermisos.administracion.usuarios.ver = !allChecked;
      newPermisos.administracion.usuarios.crear = !allChecked;
      newPermisos.administracion.usuarios.editar = !allChecked;
      newPermisos.administracion.usuarios.eliminar = !allChecked;
      newPermisos.administracion.usuarios.cambiarEstado = !allChecked;
      newPermisos.administracion.usuarios.restablecerContrasena = !allChecked;
    }

    setFormPermisos(newPermisos);
  };

  // =========================================================
  // Handlers de navegación
  // =========================================================
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleView = (rol: Rol) => {
    navigate(`/app/roles/${rol.id}/ver`);
  };

  const handleCreate = () => {
    if (!puedeCrear) {
      toast.error("No tienes permiso para crear roles");
      return;
    }

    setFormNombre("");
    setFormDescripcion("");
    setFormPermisos(createEmptyPermisos());

    setErrors({
      nombre: "",
      descripcion: "",
    });

    setTouched({
      nombre: false,
      descripcion: false,
    });

    navigate("/app/roles/crear");
  };

  const handleEdit = (rol: Rol) => {
    if (!puedeEditar) {
      toast.error("No tienes permiso para editar roles");
      return;
    }

    navigate(`/app/roles/${rol.id}/editar`);
  };

  const handleDelete = (rol: Rol) => {
    if (!puedeEliminar) {
      toast.error("No tienes permiso para eliminar roles");
      return;
    }

    navigate(`/app/roles/${rol.id}/eliminar`);
  };

  // =========================================================
  // Handlers de acciones / modales
  // =========================================================
  const handleToggleEstado = (rol: Rol) => {
    if (!puedeCambiarEstado) {
      toast.error("No tienes permiso para cambiar el estado de roles");
      return;
    }

    setRolParaCambioEstado(rol);
    setShowConfirmEstadoModal(true);
  };

  // =========================================================
  // Confirmaciones / acciones async
  // =========================================================

  const confirmCreate = async () => {
    if (!puedeCrear) {
      toast.error("No tienes permiso para crear roles");
      return;
    }

    if (isCreatingRol) return;
    if (!validateForm()) return;

    try {
      setIsCreatingRol(true);

      const ids_permisos = permisosFrontendToIds(formPermisos, catalogoPermisos);

      await createRol({
        nombre_rol: formNombre.trim(),
        descripcion: formDescripcion.trim(),
        estado: true,
        ids_permisos,
      });

      await cargarDatos();
      toast.success("Rol creado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error creando rol:", error);

      const message =
        error?.response?.data?.message || "No se pudo crear el rol";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsCreatingRol(false);
    }
  };

  const confirmEdit = async () => {
    if (!puedeEditar) {
      toast.error("No tienes permiso para editar roles");
      return;
    }

    if (isUpdatingRol) return;
    if (!rolSeleccionado) return;
    if (!validateForm()) return;

    try {
      setIsUpdatingRol(true);

      const ids_permisos = permisosFrontendToIds(formPermisos, catalogoPermisos);

      await updateRol(rolSeleccionado.id, {
        nombre_rol: formNombre.trim(),
        descripcion: formDescripcion.trim(),
        estado: rolSeleccionado.estado,
        ids_permisos,
      });

      await cargarDatos();
      toast.success("Rol actualizado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error actualizando rol:", error);

      const message =
        error?.response?.data?.message || "No se pudo actualizar el rol";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsUpdatingRol(false);
    }
  };

  const confirmDelete = async () => {
    if (!puedeEliminar) {
      toast.error("No tienes permiso para eliminar roles");
      return;
    }

    if (isDeletingRol) return;
    if (!rolSeleccionado) return;

    try {
      setIsDeletingRol(true);

      await deleteRol(rolSeleccionado.id);
      await cargarDatos();

      toast.success("Rol eliminado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error eliminando rol:", error);

      const message =
        error?.response?.data?.message || "No se pudo eliminar el rol";

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsDeletingRol(false);
    }
  };

  const confirmToggleEstado = async () => {
    if (!puedeCambiarEstado) {
      toast.error("No tienes permiso para cambiar el estado de roles");
      return;
    }

    if (isChangingEstadoRol) return;
    if (!rolParaCambioEstado) return;

    const nuevoEstado = !rolParaCambioEstado.estado;

    try {
      setIsChangingEstadoRol(true);

      await updateRol(rolParaCambioEstado.id, {
        estado: nuevoEstado,
      });

      await cargarDatos();

      toast.success(
        `Rol ${rolParaCambioEstado.estado ? "desactivado" : "activado"} exitosamente`
      );
    } catch (error: any) {
      console.error("Error cambiando estado del rol:", error);

      const message =
        error?.response?.data?.message ||
        `No se pudo ${nuevoEstado ? "activar" : "desactivar"} el rol`;

      toast.error(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setIsChangingEstadoRol(false);
      setShowConfirmEstadoModal(false);
      setRolParaCambioEstado(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Roles</h2>
        <p className="text-gray-600 mt-1">
          Administra los roles y permisos del sistema
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar roles por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro de Estado */}
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
            Todos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === "activo" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("activo")}
            className={`h-8 ${estadoFilter === "activo"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "hover:bg-gray-200"
              }`}
          >
            Activos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === "inactivo" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("inactivo")}
            className={`h-8 ${estadoFilter === "inactivo"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "hover:bg-gray-200"
              }`}
          >
            Inactivos
          </Button>
        </div>

        {puedeCrear && (
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!puedeCrear}
          >
            <Plus size={18} className="mr-2" />
            Crear Rol
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
                <TableHead>Nombre del Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">
                  Estado
                </TableHead>
                <TableHead className="text-right w-40">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRoles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No se encontraron roles
                  </TableCell>
                </TableRow>
              ) : (
                currentRoles.map((rol, index) => (
                  <TableRow
                    key={rol.id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield
                          size={18}
                          className="text-gray-500"
                        />
                        <Badge
                          className={getRolColor(rol.nombre)}
                        >
                          {rol.nombre}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 max-w-md">
                      {rol.descripcion}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(rol)}
                        disabled={rol.usuariosAsignados > 0 || !puedeCambiarEstado}
                        className={`h-7 ${rol.estado
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                      >
                        {rol.estado ? "Activo" : "Inactivo"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(rol)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>

                        {puedeEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rol)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {puedeEliminar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rol)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar"
                            disabled={rol.usuariosAsignados > 0}
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
      {filteredRoles.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} -{" "}
            {Math.min(endIndex, filteredRoles.length)} de{" "}
            {filteredRoles.length} roles
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(currentPage - 1)
              }
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  variant={
                    currentPage === page
                      ? "default"
                      : "outline"
                  }
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
              onClick={() =>
                handlePageChange(currentPage + 1)
              }
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="view-rol-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalles del Rol</DialogTitle>
            <DialogDescription id="view-rol-description">
              Información completa del rol y sus permisos
            </DialogDescription>
          </DialogHeader>

          {rolSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Nombre del Rol</Label>
                  <div className="mt-1">
                    <Badge className={getRolColor(rolSeleccionado.nombre)}>
                      {rolSeleccionado.nombre}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge
                      className={
                        rolSeleccionado.estado
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {rolSeleccionado.estado ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Descripción</Label>
                <p className="text-gray-700">{rolSeleccionado.descripcion}</p>
              </div>

              <div>
                <Label className="text-gray-500">Usuarios Asignados</Label>
                <p className="font-semibold text-lg">{rolSeleccionado.usuariosAsignados}</p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-gray-700 text-base mb-4 block">
                  Permisos Asignados
                </Label>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dashboard */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Dashboard</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>• Acceder: {rolSeleccionado.permisos.dashboard.acceder ? "✓" : "✗"}</p>
                    </div>
                  </div>

                  {/* Existencias */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Existencias</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Productos:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.existencias.productos.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.existencias.productos.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.existencias.productos.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.existencias.productos.cambiarEstado ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Traslados:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.existencias.traslados.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.existencias.traslados.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.existencias.traslados.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.existencias.traslados.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.existencias.traslados.anular ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Bodegas:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.existencias.bodegas.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.existencias.bodegas.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.existencias.bodegas.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.existencias.bodegas.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Eliminar: {rolSeleccionado.permisos.existencias.bodegas.eliminar ? "✓" : "✗"}</p>
                    </div>
                  </div>

                  {/* Compras */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Compras</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Proveedores:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.compras.proveedores.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.compras.proveedores.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.compras.proveedores.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.compras.proveedores.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Eliminar: {rolSeleccionado.permisos.compras.proveedores.eliminar ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Órdenes de Compra:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.compras.ordenesCompra.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.compras.ordenesCompra.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Descargar: {rolSeleccionado.permisos.compras.ordenesCompra.descargar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.compras.ordenesCompra.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.compras.ordenesCompra.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.compras.ordenesCompra.anular ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Remisiones de Compra:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.compras.remisionesCompra.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.compras.remisionesCompra.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Descargar: {rolSeleccionado.permisos.compras.remisionesCompra.descargar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.compras.remisionesCompra.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.compras.remisionesCompra.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.compras.remisionesCompra.anular ? "✓" : "✗"}</p>
                    </div>
                  </div>

                  {/* Ventas */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Ventas</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Clientes:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.ventas.clientes.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.ventas.clientes.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.ventas.clientes.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.ventas.clientes.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Eliminar: {rolSeleccionado.permisos.ventas.clientes.eliminar ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Cotizaciones:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.ventas.cotizaciones.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.ventas.cotizaciones.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Descargar: {rolSeleccionado.permisos.ventas.cotizaciones.descargar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.ventas.cotizaciones.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.ventas.cotizaciones.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.ventas.cotizaciones.anular ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Órdenes de Venta:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.ventas.ordenesVenta.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.ventas.ordenesVenta.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Descargar: {rolSeleccionado.permisos.ventas.ordenesVenta.descargar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.ventas.ordenesVenta.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.ventas.ordenesVenta.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.ventas.ordenesVenta.anular ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Remisiones de Venta:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.ventas.remisionesVenta.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.ventas.remisionesVenta.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Descargar: {rolSeleccionado.permisos.ventas.remisionesVenta.descargar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.ventas.remisionesVenta.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.ventas.remisionesVenta.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.ventas.remisionesVenta.anular ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Pagos:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.ventas.pagos.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.ventas.pagos.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Agregar Abonos: {rolSeleccionado.permisos.ventas.pagos.agregarAbonos ? "✓" : "✗"}</p>
                      <p className="pl-2">• Anular: {rolSeleccionado.permisos.ventas.pagos.anular ? "✓" : "✗"}</p>
                    </div>
                  </div>

                  {/* Administración */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Administración</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Roles:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.administracion.roles.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.administracion.roles.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.administracion.roles.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.administracion.roles.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Eliminar: {rolSeleccionado.permisos.administracion.roles.eliminar ? "✓" : "✗"}</p>

                      <p className="font-medium mt-2">Usuarios:</p>
                      <p className="pl-2">• Ver: {rolSeleccionado.permisos.administracion.usuarios.ver ? "✓" : "✗"}</p>
                      <p className="pl-2">• Crear: {rolSeleccionado.permisos.administracion.usuarios.crear ? "✓" : "✗"}</p>
                      <p className="pl-2">• Editar: {rolSeleccionado.permisos.administracion.usuarios.editar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Eliminar: {rolSeleccionado.permisos.administracion.usuarios.eliminar ? "✓" : "✗"}</p>
                      <p className="pl-2">• Cambiar Estado: {rolSeleccionado.permisos.administracion.usuarios.cambiarEstado ? "✓" : "✗"}</p>
                      <p className="pl-2">• Restablecer Contraseña: {rolSeleccionado.permisos.administracion.usuarios.restablecerContrasena ? "✓" : "✗"}</p>
                    </div>
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

      {/* Modal Crear Rol */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="rol-create-description"
          onInteractOutside={(e) => e.preventDefault()} // ✅ no cerrar por fuera
        >
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription id="rol-create-description">
              Completa la información del nuevo rol y asigna los permisos correspondientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Rol *</Label>
              <Input
                id="nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Gerente de Ventas"
                className={errors.nombre ? "border-red-500" : ""}
                onBlur={handleNombreBlur}
              />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formDescripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                placeholder="Describe las responsabilidades de este rol"
                rows={3}
                className={errors.descripcion ? "border-red-500" : ""}
                onBlur={handleDescripcionBlur}
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Label className="text-base mb-4 block">Configuración de Permisos</Label>

              <PermisosForm
                formPermisos={formPermisos}
                updatePermiso={updatePermiso}
                toggleModulePermissions={toggleModulePermissions}
                isModuleFullyChecked={isModuleFullyChecked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button onClick={confirmCreate}
              disabled={isCreatingRol}
              className="bg-blue-600 hover:bg-blue-700">
              {isCreatingRol ? "Creando..." : "Crear Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Rol */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="rol-edit-description"
          onInteractOutside={(e) => e.preventDefault()} // ✅ no cerrar por fuera
        >
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription id="rol-edit-description">
              Modifica la información del rol y actualiza los permisos según sea necesario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre del Rol *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Gerente de Ventas"
                className={errors.nombre ? "border-red-500" : ""}
                onBlur={handleNombreBlur}
              />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <Label htmlFor="edit-descripcion">Descripción *</Label>
              <Textarea
                id="edit-descripcion"
                value={formDescripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                placeholder="Describe las responsabilidades de este rol"
                rows={3}
                className={errors.descripcion ? "border-red-500" : ""}
                onBlur={handleDescripcionBlur}
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Label className="text-base mb-4 block">Configuración de Permisos</Label>

              <PermisosForm
                formPermisos={formPermisos}
                updatePermiso={updatePermiso}
                toggleModulePermissions={toggleModulePermissions}
                isModuleFullyChecked={isModuleFullyChecked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button onClick={confirmEdit} className="bg-blue-600 hover:bg-blue-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Rol */}
      <Dialog
        open={isEliminar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          aria-describedby="delete-rol-description"
          onInteractOutside={(e) => e.preventDefault()} // ✅ no cerrar por fuera
        >
          <DialogHeader>
            <DialogTitle>Eliminar Rol</DialogTitle>
            <DialogDescription id="delete-rol-description">
              ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {rolSeleccionado && (
            <div className="py-4">
              <p className="text-gray-700">
                Rol: <span className="font-semibold">{rolSeleccionado.nombre}</span>
              </p>

              {rolSeleccionado.usuariosAsignados > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ No se puede eliminar:</strong> Este rol tiene{" "}
                    {rolSeleccionado.usuariosAsignados} usuario(s) asignado(s). Debes reasignar los
                    usuarios antes de eliminar el rol.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeletingRol || !!rolSeleccionado && rolSeleccionado.usuariosAsignados > 0}
            >
              {isDeletingRol ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Cambio de Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={(open) => {
          setShowConfirmEstadoModal(open);
          if (!open) setRolParaCambioEstado(null);
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Rol</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este rol?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {rolParaCambioEstado && rolParaCambioEstado.estado && rolParaCambioEstado.usuariosAsignados > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">
                <strong>⚠️ No se puede desactivar:</strong> Este rol tiene{" "}
                {rolParaCambioEstado.usuariosAsignados} usuario(s) asignado(s).
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmEstadoModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmToggleEstado}
              disabled={
                isChangingEstadoRol ||
                !rolParaCambioEstado ||
                (rolParaCambioEstado.estado && rolParaCambioEstado.usuariosAsignados > 0)
              }
            >
              {isChangingEstadoRol ? "Procesando..." : rolParaCambioEstado?.estado ? "Desactivar" : "Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}