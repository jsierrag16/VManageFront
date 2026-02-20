import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
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
import {
  rolesData as initialRolesData,
  Rol,
  Permisos,
  createEmptyPermisos,
} from "../../../data/roles";
import { PermisosForm } from "../components/PermisosForm";
import { useAuth } from "../../../shared/context/AuthContext";


// Función para obtener el color del rol
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
  const { tienePermiso } = useAuth();


  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [roles, setRoles] = useState<Rol[]>(initialRolesData);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [rolParaCambioEstado, setRolParaCambioEstado] = useState<Rol | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPermisos, setFormPermisos] = useState<Permisos>(createEmptyPermisos());

  const [errors, setErrors] = useState({ nombre: '', descripcion: '' });
  const [touched, setTouched] = useState({ nombre: false, descripcion: false });

  // ✅ ID desde la URL
  const id = params.id;

  // ✅ flags por URL (igual que Productos/Usuarios)
  const isCrear = location.pathname.endsWith("/roles/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const rolSeleccionado = useMemo(() => {
    if (!id) return null;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;
    return roles.find((r) => r.id === numericId) ?? null;
  }, [roles, id]);
  // ✅ volver al listado
  const closeToList = () => navigate("/app/roles");

  useEffect(() => {
    if (!isEditar) return;

    if (!rolSeleccionado) {
      closeToList();
      return;
    }

    setFormNombre(rolSeleccionado.nombre);
    setFormDescripcion(rolSeleccionado.descripcion);
    setFormPermisos(rolSeleccionado.permisos);
    setErrors({ nombre: "", descripcion: "" });
    setTouched({ nombre: false, descripcion: false });
  }, [isEditar, rolSeleccionado]);

  useEffect(() => {
    if (!isCrear) return;

    setFormNombre("");
    setFormDescripcion("");
    setFormPermisos(createEmptyPermisos());
    setErrors({ nombre: "", descripcion: "" });
    setTouched({ nombre: false, descripcion: false });
  }, [isCrear]);

  // Función para validar caracteres inapropiados
  const hasInvalidCharacters = (value: string) => {
    // Permitir solo letras, números, espacios y algunos caracteres especiales básicos
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-_]*$/;
    return !validPattern.test(value);
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return 'El nombre del rol es requerido';
    }
    if (value.trim().length < 3) {
      return 'Mínimo 3 caracteres';
    }
    if (value.trim().length > 50) {
      return 'Máximo 50 caracteres';
    }
    if (hasInvalidCharacters(value)) {
      return 'Caracteres no permitidos detectados';
    }
    return '';
  };

  const validateDescripcion = (value: string) => {
    if (!value.trim()) {
      return 'La descripción es requerida';
    }
    if (value.trim().length < 10) {
      return 'Mínimo 10 caracteres';
    }
    if (value.trim().length > 200) {
      return 'Máximo 200 caracteres';
    }
    if (hasInvalidCharacters(value)) {
      return 'Caracteres no permitidos detectados';
    }
    return '';
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors({ ...errors, nombre: validateNombre(value) });
    }
  };

  const handleDescripcionChange = (value: string) => {
    setFormDescripcion(value);
    if (touched.descripcion) {
      setErrors({ ...errors, descripcion: validateDescripcion(value) });
    }
  };

  const handleNombreBlur = () => {
    setTouched({ ...touched, nombre: true });
    setErrors({ ...errors, nombre: validateNombre(formNombre) });
  };

  const handleDescripcionBlur = () => {
    setTouched({ ...touched, descripcion: true });
    setErrors({ ...errors, descripcion: validateDescripcion(formDescripcion) });
  };

  // Verificar permisos del usuario
  const puedeCrear = tienePermiso("configuracion", "roles", "crear");
  const puedeEditar = tienePermiso("configuracion", "roles", "editar");
  const puedeEliminar = tienePermiso("configuracion", "roles", "eliminar");
  const puedeInhabilitar = tienePermiso("configuracion", "roles", "inhabilitar");

  // Filtrar roles
  const filteredRoles = useMemo(() => {
    return roles.filter((rol) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        rol.nombre.toLowerCase().includes(searchLower) ||
        rol.descripcion.toLowerCase().includes(searchLower);

      // Filtrar por estado
      let matchesEstado = true;
      if (estadoFilter === "activo") {
        matchesEstado = rol.estado === true;
      } else if (estadoFilter === "inactivo") {
        matchesEstado = rol.estado === false;
      }
      // Si es "todos", no filtramos por estado

      return matchesSearch && matchesEstado;
    });
  }, [roles, searchTerm, estadoFilter]);

  // Paginación
  const totalPages = Math.ceil(
    filteredRoles.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoles = filteredRoles.slice(
    startIndex,
    endIndex,
  );

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleView = (rol: Rol) => {
    navigate(`/app/roles/${rol.id}/ver`);
  };

  const handleCreate = () => {
    // limpiar form (igual que antes)
    setFormNombre("");
    setFormDescripcion("");
    setFormPermisos(createEmptyPermisos());
    setErrors({ nombre: "", descripcion: "" });
    setTouched({ nombre: false, descripcion: false });

    navigate("/app/roles/crear");
  };

  const handleEdit = (rol: Rol) => {
    navigate(`/app/roles/${rol.id}/editar`);
  };

  const handleDelete = (rol: Rol) => {
    navigate(`/app/roles/${rol.id}/eliminar`);
  };

  const confirmCreate = () => {
    setTouched({ nombre: true, descripcion: true });

    const nombreError = validateNombre(formNombre);
    const descripcionError = validateDescripcion(formDescripcion);

    setErrors({ nombre: nombreError, descripcion: descripcionError });

    if (nombreError || descripcionError) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    const newRol: Rol = {
      id: Math.max(...roles.map((r) => r.id), 0) + 1,
      nombre: formNombre,
      descripcion: formDescripcion,
      permisos: formPermisos,
      usuariosAsignados: 0,
      estado: true,
    };

    setRoles([...roles, newRol]);
    toast.success("Rol creado exitosamente");
    closeToList();
  };

  const confirmEdit = () => {
    if (!rolSeleccionado) return;

    setTouched({ nombre: true, descripcion: true });

    const nombreError = validateNombre(formNombre);
    const descripcionError = validateDescripcion(formDescripcion);

    setErrors({ nombre: nombreError, descripcion: descripcionError });

    if (nombreError || descripcionError) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setRoles(
      roles.map((rol) =>
        rol.id === rolSeleccionado.id
          ? { ...rol, nombre: formNombre, descripcion: formDescripcion, permisos: formPermisos }
          : rol
      )
    );

    toast.success("Rol actualizado exitosamente");
    closeToList();
  };

  const confirmDelete = () => {
    if (!rolSeleccionado) return;

    if (rolSeleccionado.usuariosAsignados > 0) {
      toast.error("No se puede eliminar un rol que tiene usuarios asignados");
      return;
    }

    setRoles(roles.filter((rol) => rol.id !== rolSeleccionado.id));
    toast.success("Rol eliminado exitosamente");
    closeToList();
  };

  // Función para cambiar el estado del rol
  const handleToggleEstado = (rol: Rol) => {
    setRolParaCambioEstado(rol);
    setShowConfirmEstadoModal(true);
  };

  const confirmToggleEstado = () => {
    if (!rolParaCambioEstado) return;

    const nuevoEstado = !rolParaCambioEstado.estado;
    setRoles(
      roles.map((r) =>
        r.id === rolParaCambioEstado.id ? { ...r, estado: nuevoEstado } : r
      )
    );
    setShowConfirmEstadoModal(false);
    toast.success(
      `Rol ${nuevoEstado ? "activado" : "desactivado"} exitosamente`
    );
  };

  // Función para actualizar permisos individuales
  const updatePermiso = (path: string[], value: boolean) => {
    const newPermisos = JSON.parse(
      JSON.stringify(formPermisos),
    );
    let current: any = newPermisos;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setFormPermisos(newPermisos);
  };

  // Función para seleccionar/deseleccionar todos los permisos de un módulo
  const toggleModulePermissions = (module: string) => {
    const newPermisos = JSON.parse(JSON.stringify(formPermisos));

    // Verificar si todos los permisos del módulo están activos
    const allChecked = isModuleFullyChecked(module);

    // Alternar todos los permisos del módulo
    if (module === "dashboard") {
      newPermisos.dashboard.acceder = !allChecked;
    } else if (module === "inventario") {
      newPermisos.inventario.existencias.crear = !allChecked;
      newPermisos.inventario.productos.crear = !allChecked;
      newPermisos.inventario.productos.darDeBaja = !allChecked;
      newPermisos.inventario.traslados.crear = !allChecked;
      newPermisos.inventario.bodegas.crear = !allChecked;
      newPermisos.inventario.bodegas.editar = !allChecked;
      newPermisos.inventario.bodegas.eliminar = !allChecked;
    } else if (module === "compras") {
      newPermisos.compras.proveedores.crear = !allChecked;
      newPermisos.compras.proveedores.editar = !allChecked;
      newPermisos.compras.proveedores.eliminar = !allChecked;
      newPermisos.compras.ordenesCompra.crear = !allChecked;
      newPermisos.compras.ordenesCompra.editar = !allChecked;
      newPermisos.compras.ordenesCompra.eliminar = !allChecked;
      newPermisos.compras.ordenesCompra.cambiarEstado = !allChecked;
      newPermisos.compras.remisionesCompra.crear = !allChecked;
      newPermisos.compras.remisionesCompra.editar = !allChecked;
      newPermisos.compras.remisionesCompra.eliminar = !allChecked;
      newPermisos.compras.remisionesCompra.cambiarEstado = !allChecked;
    } else if (module === "ventas") {
      newPermisos.ventas.clientes.crear = !allChecked;
      newPermisos.ventas.clientes.editar = !allChecked;
      newPermisos.ventas.clientes.eliminar = !allChecked;
      newPermisos.ventas.ordenes.crear = !allChecked;
      newPermisos.ventas.ordenes.editar = !allChecked;
      newPermisos.ventas.ordenes.eliminar = !allChecked;
      newPermisos.ventas.remisionesVenta.crear = !allChecked;
      newPermisos.ventas.remisionesVenta.editar = !allChecked;
      newPermisos.ventas.remisionesVenta.eliminar = !allChecked;
      newPermisos.ventas.pagosAbonos.crear = !allChecked;
      newPermisos.ventas.pagosAbonos.editar = !allChecked;
      newPermisos.ventas.pagosAbonos.eliminar = !allChecked;
    } else if (module === "configuracion") {
      newPermisos.configuracion.roles.crear = !allChecked;
      newPermisos.configuracion.roles.editar = !allChecked;
      newPermisos.configuracion.roles.inhabilitar = !allChecked;
    } else if (module === "usuarios") {
      newPermisos.usuarios.crear = !allChecked;
      newPermisos.usuarios.editar = !allChecked;
      newPermisos.usuarios.eliminar = !allChecked;
      newPermisos.usuarios.cambiarEstado = !allChecked;
    }

    setFormPermisos(newPermisos);
  };

  // Función para verificar si todos los permisos de un módulo están activos
  const isModuleFullyChecked = (module: string): boolean => {
    if (module === "dashboard") {
      return formPermisos.dashboard.acceder;
    } else if (module === "inventario") {
      return (
        formPermisos.inventario.existencias.crear &&
        formPermisos.inventario.productos.crear &&
        formPermisos.inventario.productos.darDeBaja &&
        formPermisos.inventario.traslados.crear &&
        formPermisos.inventario.bodegas.crear &&
        formPermisos.inventario.bodegas.editar &&
        formPermisos.inventario.bodegas.eliminar
      );
    } else if (module === "compras") {
      return (
        formPermisos.compras.proveedores.crear &&
        formPermisos.compras.proveedores.editar &&
        formPermisos.compras.proveedores.eliminar &&
        formPermisos.compras.ordenesCompra.crear &&
        formPermisos.compras.ordenesCompra.editar &&
        formPermisos.compras.ordenesCompra.eliminar &&
        formPermisos.compras.ordenesCompra.cambiarEstado &&
        formPermisos.compras.remisionesCompra.crear &&
        formPermisos.compras.remisionesCompra.editar &&
        formPermisos.compras.remisionesCompra.eliminar &&
        formPermisos.compras.remisionesCompra.cambiarEstado
      );
    } else if (module === "ventas") {
      return (
        formPermisos.ventas.clientes.crear &&
        formPermisos.ventas.clientes.editar &&
        formPermisos.ventas.clientes.eliminar &&
        formPermisos.ventas.ordenes.crear &&
        formPermisos.ventas.ordenes.editar &&
        formPermisos.ventas.ordenes.eliminar &&
        formPermisos.ventas.remisionesVenta.crear &&
        formPermisos.ventas.remisionesVenta.editar &&
        formPermisos.ventas.remisionesVenta.eliminar &&
        formPermisos.ventas.pagosAbonos.crear &&
        formPermisos.ventas.pagosAbonos.editar &&
        formPermisos.ventas.pagosAbonos.eliminar
      );
    } else if (module === "configuracion") {
      return (
        formPermisos.configuracion.roles.crear &&
        formPermisos.configuracion.roles.editar &&
        formPermisos.configuracion.roles.inhabilitar
      );
    } else if (module === "usuarios") {
      return (
        formPermisos.usuarios.crear &&
        formPermisos.usuarios.editar &&
        formPermisos.usuarios.eliminar &&
        formPermisos.usuarios.inhabilitar
      );
    }
    return false;
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

        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!puedeCrear}
        >
          <Plus size={18} className="mr-2" />
          Crear Rol
        </Button>
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
                          className={`${getRolColor(rol.nombre)} hover:${getRolColor(rol.nombre)}`}
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
                        disabled={!puedeInhabilitar}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rol)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                          disabled={!puedeEditar}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rol)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                          disabled={rol.usuariosAsignados > 0 || !puedeEliminar}
                        >
                          <Trash2 size={16} />
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
      </div>

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
          onInteractOutside={(e) => e.preventDefault()}   // ✅ no cerrar por fuera
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
                    <Badge
                      className={`${getRolColor(rolSeleccionado.nombre)} hover:${getRolColor(
                        rolSeleccionado.nombre
                      )}`}
                    >
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
                      <p>
                        • Acceder:{" "}
                        {rolSeleccionado.permisos.dashboard.acceder ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>

                  {/* Inventario */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Inventario</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Existencias:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.inventario.existencias.crear ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Productos:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.inventario.productos.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Dar de Baja:{" "}
                        {rolSeleccionado.permisos.inventario.productos.darDeBaja ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Traslados:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.inventario.traslados.crear ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Bodegas:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.inventario.bodegas.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.inventario.bodegas.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.inventario.bodegas.eliminar ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>

                  {/* Compras */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Compras</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Proveedores:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.compras.proveedores.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.compras.proveedores.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.compras.proveedores.eliminar ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Órdenes de Compra:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.compras.ordenesCompra.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.compras.ordenesCompra.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.compras.ordenesCompra.eliminar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Cambiar Estado:{" "}
                        {rolSeleccionado.permisos.compras.ordenesCompra.cambiarEstado ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Remisiones de Compra:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.compras.remisionesCompra.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.compras.remisionesCompra.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.compras.remisionesCompra.eliminar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Cambiar Estado:{" "}
                        {rolSeleccionado.permisos.compras.remisionesCompra.cambiarEstado ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>

                  {/* Ventas */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Ventas</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Clientes:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.ventas.clientes.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.ventas.clientes.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.ventas.clientes.eliminar ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Órdenes:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.ventas.ordenes.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.ventas.ordenes.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.ventas.ordenes.eliminar ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Remisiones de Venta:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.ventas.remisionesVenta.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.ventas.remisionesVenta.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.ventas.remisionesVenta.eliminar ? "✓" : "✗"}
                      </p>

                      <p className="font-medium">Pagos y Abonos:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.ventas.pagosAbonos.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.ventas.pagosAbonos.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Eliminar:{" "}
                        {rolSeleccionado.permisos.ventas.pagosAbonos.eliminar ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>

                  {/* Configuración */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Configuración</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">Roles:</p>
                      <p className="pl-2">
                        • Crear:{" "}
                        {rolSeleccionado.permisos.configuracion.roles.crear ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Editar:{" "}
                        {rolSeleccionado.permisos.configuracion.roles.editar ? "✓" : "✗"}
                      </p>
                      <p className="pl-2">
                        • Inhabilitar:{" "}
                        {rolSeleccionado.permisos.configuracion.roles.inhabilitar ? "✓" : "✗"}
                      </p>
                    </div>
                  </div>

                  {/* Usuarios */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <h5 className="font-semibold text-sm mb-2">Usuarios</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>• Crear: {rolSeleccionado.permisos.usuarios.crear ? "✓" : "✗"}</p>
                      <p>• Editar: {rolSeleccionado.permisos.usuarios.editar ? "✓" : "✗"}</p>
                      <p>• Eliminar: {rolSeleccionado.permisos.usuarios.eliminar ? "✓" : "✗"}</p>
                      <p>
                        • Cambiar Estado:{" "}
                        {rolSeleccionado.permisos.usuarios.inhabilitar ? "✓" : "✗"}
                      </p>
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
            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Rol
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
              disabled={!!rolSeleccionado && (rolSeleccionado.usuariosAsignados > 0 || !puedeEliminar)}
            >
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
        <DialogContent aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Rol</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este rol?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {rolParaCambioEstado && (
            <div className="py-4">
              <p className="text-gray-700">
                Rol:{" "}
                <span className="font-semibold">
                  {rolParaCambioEstado.nombre}
                </span>
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
              disabled={!rolParaCambioEstado || !puedeInhabilitar}
              className={
                rolParaCambioEstado && rolParaCambioEstado.estado
                  ? "bg-red-600 hover:bg-red-700"     // si está activo, vas a DESACTIVAR
                  : "bg-green-600 hover:bg-green-700" // si está inactivo, vas a ACTIVAR
              }
            >
              {rolParaCambioEstado && rolParaCambioEstado.estado ? "Desactivar" : "Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}