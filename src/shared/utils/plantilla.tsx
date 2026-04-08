// import { useAuth } from "@/shared/context/AuthContext";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import { useEffect, useMemo, useState, useCallback } from "react";
// import { toast } from "sonner";

// // UI
// import { Button } from "@/shared/components/ui/button";
// import { Input } from "@/shared/components/ui/input";
// import { Label } from "@/shared/components/ui/label";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/shared/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/shared/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/shared/components/ui/select";

// // Íconos
// import {
//   Search,
//   Plus,
//   Eye,
//   Edit,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
// } from "lucide-react";

// // Services del módulo
// import {
//   getItems,
//   createItem,
//   updateItem,
//   deleteItem,
//   cambiarEstadoItem,
//   type Item,
// } from "@/features/modulo/services/modulo.services";

// // Catálogos si aplica
// import {
//   getCatalogoUno,
//   getCatalogoDos,
// } from "@/features/modulo/services/modulo-catalogos.service";

// type OpcionCatalogo = {
//   id: number;
//   nombre: string;
// };

// export default function ModuloBase() {
//   // =========================================================
//   // Contexto, navegación y permisos
//   // =========================================================
//   const { tienePermiso } = useAuth();

//   const navigate = useNavigate();
//   const location = useLocation();
//   const params = useParams<{ id: string }>();

//   // =========================================================
//   // Estados del módulo
//   // =========================================================
//   const [searchTerm, setSearchTerm] = useState("");
//   const [estadoFilter, setEstadoFilter] = useState<string>("todos");
//   const [items, setItems] = useState<Item[]>([]);
//   const [isLoadingItems, setIsLoadingItems] = useState(false);

//   const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);
//   const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false);
//   const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
//   const [itemParaCambioEstado, setItemParaCambioEstado] = useState<Item | null>(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // =========================================================
//   // Estados del formulario
//   // =========================================================
//   const [formNombre, setFormNombre] = useState("");
//   const [formDescripcion, setFormDescripcion] = useState("");
//   const [formEstado, setFormEstado] = useState<boolean>(true);

//   // =========================================================
//   // Estados de catálogos
//   // =========================================================
//   const [catalogoUno, setCatalogoUno] = useState<OpcionCatalogo[]>([]);
//   const [catalogoDos, setCatalogoDos] = useState<OpcionCatalogo[]>([]);
//   const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

//   // =========================================================
//   // Permisos
//   // =========================================================
//   const canCreate = tienePermiso("moduloPadre", "submodulo", "crear");
//   const canEdit = tienePermiso("moduloPadre", "submodulo", "editar");
//   const canDelete = tienePermiso("moduloPadre", "submodulo", "eliminar");
//   const canChangeEstado = tienePermiso("moduloPadre", "submodulo", "cambiarEstado");

//   // =========================================================
//   // Estados de errores y touched
//   // =========================================================
//   const [errors, setErrors] = useState({
//     nombre: "",
//     descripcion: "",
//   });

//   const [touched, setTouched] = useState({
//     nombre: false,
//     descripcion: false,
//   });

//   // =========================================================
//   // Estados de proceso async
//   // =========================================================
//   const [isCreatingItem, setIsCreatingItem] = useState(false);
//   const [isUpdatingItem, setIsUpdatingItem] = useState(false);
//   const [isDeletingItem, setIsDeletingItem] = useState(false);
//   const [isChangingEstadoItem, setIsChangingEstadoItem] = useState(false);

//   // =========================================================
//   // Flags de ruta
//   // =========================================================
//   const isCrear = location.pathname.endsWith("/crear");
//   const isVer = location.pathname.endsWith("/ver");
//   const isEditar = location.pathname.endsWith("/editar");
//   const isEliminar = location.pathname.endsWith("/eliminar");

//   // =========================================================
//   // Datos derivados / useMemo
//   // =========================================================
//   const itemSeleccionado = useMemo(() => {
//     if (!params.id) return null;

//     const numericId = Number(params.id);
//     if (!Number.isFinite(numericId)) return null;

//     return items.find((item) => item.id === numericId) ?? null;
//   }, [items, params.id]);

//   const filteredItems = useMemo(() => {
//     return items.filter((item) => {
//       const searchLower = searchTerm.toLowerCase();

//       const matchesSearch =
//         item.nombre.toLowerCase().includes(searchLower) ||
//         item.descripcion.toLowerCase().includes(searchLower);

//       if (estadoFilter === "todos") return matchesSearch;

//       return estadoFilter === "activos"
//         ? matchesSearch && item.estado
//         : matchesSearch && !item.estado;
//     });
//   }, [items, searchTerm, estadoFilter]);

//   const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const currentItems = filteredItems.slice(startIndex, endIndex);

//   // =========================================================
//   // Funciones de carga
//   // =========================================================
//   const loadItems = useCallback(async () => {
//     try {
//       setIsLoadingItems(true);
//       const response = await getItems();
//       setItems(response.data);
//     } catch (error) {
//       console.error("Error cargando registros:", error);
//       toast.error("No se pudieron cargar los registros");
//     } finally {
//       setIsLoadingItems(false);
//     }
//   }, []);

//   const loadCatalogos = useCallback(async () => {
//     try {
//       setIsLoadingCatalogos(true);

//       const [uno, dos] = await Promise.all([
//         getCatalogoUno(),
//         getCatalogoDos(),
//       ]);

//       setCatalogoUno(uno);
//       setCatalogoDos(dos);
//     } catch (error) {
//       console.error("Error cargando catálogos:", error);
//       toast.error("No se pudieron cargar los catálogos");
//     } finally {
//       setIsLoadingCatalogos(false);
//     }
//   }, []);

//   const closeToList = () => navigate("/app/modulo");

//   // =========================================================
//   // Efectos
//   // =========================================================
//   useEffect(() => {
//     loadCatalogos();
//     loadItems();
//   }, [loadCatalogos, loadItems]);

//   useEffect(() => {
//     if (!isVer && !isEditar && !isEliminar) return;
//     if (isLoadingItems) return;

//     if (!itemSeleccionado) {
//       closeToList();
//     }
//   }, [isVer, isEditar, isEliminar, itemSeleccionado, isLoadingItems]);

//   useEffect(() => {
//     if (!isEditar) return;
//     if (!itemSeleccionado) return;

//     setFormNombre(itemSeleccionado.nombre);
//     setFormDescripcion(itemSeleccionado.descripcion);
//     setFormEstado(itemSeleccionado.estado);

//     setErrors({
//       nombre: "",
//       descripcion: "",
//     });

//     setTouched({
//       nombre: false,
//       descripcion: false,
//     });
//   }, [isEditar, itemSeleccionado]);

//   useEffect(() => {
//     if (!isCrear) return;

//     setFormNombre("");
//     setFormDescripcion("");
//     setFormEstado(true);

//     setErrors({
//       nombre: "",
//       descripcion: "",
//     });

//     setTouched({
//       nombre: false,
//       descripcion: false,
//     });
//   }, [isCrear]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, estadoFilter]);

//   // =========================================================
//   // Validaciones y helpers
//   // =========================================================
//   const validateNombre = (value: string) => {
//     if (!value.trim()) return "El nombre es requerido";
//     if (value.trim().length < 3) return "Mínimo 3 caracteres";
//     if (value.trim().length > 100) return "Máximo 100 caracteres";
//     return "";
//   };

//   const validateDescripcion = (value: string) => {
//     if (!value.trim()) return "La descripción es requerida";
//     if (value.trim().length < 5) return "Mínimo 5 caracteres";
//     if (value.trim().length > 200) return "Máximo 200 caracteres";
//     return "";
//   };

//   const validateForm = () => {
//     setTouched({
//       nombre: true,
//       descripcion: true,
//     });

//     const nombreError = validateNombre(formNombre);
//     const descripcionError = validateDescripcion(formDescripcion);

//     setErrors({
//       nombre: nombreError,
//       descripcion: descripcionError,
//     });

//     if (nombreError || descripcionError) {
//       toast.error("Por favor corrige los errores en el formulario");
//       return false;
//     }

//     return true;
//   };

//   // =========================================================
//   // Handlers de formulario
//   // =========================================================
//   const handleNombreChange = (value: string) => {
//     setFormNombre(value);

//     if (touched.nombre) {
//       setErrors((prev) => ({
//         ...prev,
//         nombre: validateNombre(value),
//       }));
//     }
//   };

//   const handleDescripcionChange = (value: string) => {
//     setFormDescripcion(value);

//     if (touched.descripcion) {
//       setErrors((prev) => ({
//         ...prev,
//         descripcion: validateDescripcion(value),
//       }));
//     }
//   };

//   const handleNombreBlur = () => {
//     setTouched((prev) => ({ ...prev, nombre: true }));
//     setErrors((prev) => ({
//       ...prev,
//       nombre: validateNombre(formNombre),
//     }));
//   };

//   const handleDescripcionBlur = () => {
//     setTouched((prev) => ({ ...prev, descripcion: true }));
//     setErrors((prev) => ({
//       ...prev,
//       descripcion: validateDescripcion(formDescripcion),
//     }));
//   };

//   // =========================================================
//   // Handlers de navegación
//   // =========================================================
//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//   };

//   const handleView = (item: Item) => {
//     navigate(`/app/modulo/${item.id}/ver`);
//   };

//   const handleCreate = () => {
//     if (!canCreate) {
//       toast.error("No tienes permiso para crear registros");
//       return;
//     }

//     setFormNombre("");
//     setFormDescripcion("");
//     setFormEstado(true);

//     setErrors({
//       nombre: "",
//       descripcion: "",
//     });

//     setTouched({
//       nombre: false,
//       descripcion: false,
//     });

//     navigate("/app/modulo/crear");
//   };

//   const handleEdit = (item: Item) => {
//     if (!canEdit) {
//       toast.error("No tienes permiso para editar registros");
//       return;
//     }

//     navigate(`/app/modulo/${item.id}/editar`);
//   };

//   const handleDelete = (item: Item) => {
//     if (!canDelete) {
//       toast.error("No tienes permiso para eliminar registros");
//       return;
//     }

//     navigate(`/app/modulo/${item.id}/eliminar`);
//   };

//   // =========================================================
//   // Handlers de acciones / modales
//   // =========================================================
//   const handleOpenCreateConfirm = () => {
//     if (!canCreate) {
//       toast.error("No tienes permiso para crear registros");
//       return;
//     }

//     if (isCreatingItem) return;
//     if (!validateForm()) return;

//     setIsConfirmCreateOpen(true);
//   };

//   const handleOpenEditConfirm = () => {
//     if (!canEdit) {
//       toast.error("No tienes permiso para editar registros");
//       return;
//     }

//     if (isUpdatingItem) return;
//     if (!itemSeleccionado) return;
//     if (!validateForm()) return;

//     setIsConfirmEditOpen(true);
//   };

//   const toggleEstado = (item: Item) => {
//     if (!canChangeEstado) {
//       toast.error("No tienes permiso para cambiar el estado");
//       return;
//     }

//     setItemParaCambioEstado(item);
//     setShowConfirmEstadoModal(true);
//   };

//   const handleCloseConfirmEstadoModal = () => {
//     setShowConfirmEstadoModal(false);
//     setItemParaCambioEstado(null);
//   };

//   // =========================================================
//   // Confirmaciones / acciones async
//   // =========================================================
//   const confirmCreate = async () => {
//     if (!canCreate) {
//       toast.error("No tienes permiso para crear registros");
//       return;
//     }

//     if (isCreatingItem) return;
//     if (!validateForm()) return;

//     try {
//       setIsCreatingItem(true);

//       await createItem({
//         nombre: formNombre.trim(),
//         descripcion: formDescripcion.trim(),
//         estado: true,
//       });

//       await loadItems();
//       setIsConfirmCreateOpen(false);
//       toast.success("Registro creado exitosamente");
//       closeToList();
//     } catch (error: any) {
//       console.error("Error creando registro:", error);

//       const message =
//         error?.response?.data?.message || "No se pudo crear el registro";

//       toast.error(Array.isArray(message) ? message.join(", ") : message);
//     } finally {
//       setIsCreatingItem(false);
//     }
//   };

//   const confirmEdit = async () => {
//     if (!canEdit) {
//       toast.error("No tienes permiso para editar registros");
//       return;
//     }

//     if (isUpdatingItem) return;
//     if (!itemSeleccionado) return;
//     if (!validateForm()) return;

//     try {
//       setIsUpdatingItem(true);

//       await updateItem(itemSeleccionado.id, {
//         nombre: formNombre.trim(),
//         descripcion: formDescripcion.trim(),
//         estado: formEstado,
//       });

//       await loadItems();
//       setIsConfirmEditOpen(false);
//       toast.success("Registro actualizado exitosamente");
//       closeToList();
//     } catch (error: any) {
//       console.error("Error actualizando registro:", error);

//       const message =
//         error?.response?.data?.message || "No se pudo actualizar el registro";

//       toast.error(Array.isArray(message) ? message.join(", ") : message);
//     } finally {
//       setIsUpdatingItem(false);
//     }
//   };

//   const confirmDelete = async () => {
//     if (!canDelete) {
//       toast.error("No tienes permiso para eliminar registros");
//       return;
//     }

//     if (isDeletingItem) return;
//     if (!itemSeleccionado) return;

//     try {
//       setIsDeletingItem(true);

//       await deleteItem(itemSeleccionado.id);
//       await loadItems();

//       toast.success("Registro eliminado exitosamente");
//       closeToList();
//     } catch (error: any) {
//       console.error("Error eliminando registro:", error);

//       const message =
//         error?.response?.data?.message || "No se pudo eliminar el registro";

//       toast.error(Array.isArray(message) ? message.join(", ") : message);
//     } finally {
//       setIsDeletingItem(false);
//     }
//   };

//   const handleConfirmEstado = async () => {
//     if (!canChangeEstado) {
//       toast.error("No tienes permiso para cambiar el estado");
//       return;
//     }

//     if (isChangingEstadoItem) return;
//     if (!itemParaCambioEstado) return;

//     try {
//       setIsChangingEstadoItem(true);

//       await cambiarEstadoItem(
//         itemParaCambioEstado.id,
//         !itemParaCambioEstado.estado
//       );

//       await loadItems();

//       toast.success(
//         `Registro ${itemParaCambioEstado.estado ? "desactivado" : "activado"} exitosamente`
//       );
//     } catch (error: any) {
//       console.error("Error cambiando estado:", error);

//       const message =
//         error?.response?.data?.message || "No se pudo cambiar el estado";

//       toast.error(Array.isArray(message) ? message.join(", ") : message);
//     } finally {
//       setIsChangingEstadoItem(false);
//       handleCloseConfirmEstadoModal();
//     }
//   };

//   // =========================================================
//   // return
//   // =========================================================
//   return <div>{/* Tu UI aquí */}</div>;
// }