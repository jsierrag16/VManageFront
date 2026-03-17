import { useAuth } from "@/shared/context/AuthContext";
import { solicitarRestablecimientoContrasena } from "@/features/auth/services/auth.services";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "@/layouts/MainLayout";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Mail,
  Building2,
  CheckCircle,
  Filter,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  getTiposDocumentoCatalogo,
  getRolesCatalogo,
  getBodegasCatalogo,
  getGenerosCatalogo,
} from "@/features/usuarios/services/usuarios-catalogos.service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Checkbox } from "../../../shared/components/ui/checkbox";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  cambiarEstadoUsuario,
  asignarBodegaAUsuario,
  quitarBodegaAUsuario,
  type Usuario,
} from "@/features/usuarios/services/usuarios.services";

type OpcionCatalogo = {
  id: number;
  nombre: string;
};

export default function Usuarios() {
  // =========================================================
  // Contexto, navegación y permisos
  // =========================================================
  const { tienePermiso, usuario, refreshUsuario } = useAuth();
  const loggedUserId = usuario?.id ?? null;

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // =========================================================
  // Estados del módulo
  // =========================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false);
  const [isCreatingUsuario, setIsCreatingUsuario] = useState(false);
  const [isUpdatingUsuario, setIsUpdatingUsuario] = useState(false);
  const [isDeletingUsuario, setIsDeletingUsuario] = useState(false);
  const [isChangingEstadoUsuario, setIsChangingEstadoUsuario] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [usuarioParaCambioEstado, setUsuarioParaCambioEstado] = useState<Usuario | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isConfirmReset, setIsConfirmReset] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // =========================================================
  // Estados del formulario
  // =========================================================
  const [formGeneroId, setFormGeneroId] = useState<number | "">("");
  const [formTipoDocId, setFormTipoDocId] = useState<number | "">("");
  const [formNumeroDoc, setFormNumeroDoc] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formApellido, setFormApellido] = useState("");
  const [formFechaNacimiento, setFormFechaNacimiento] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formBodegasIds, setFormBodegasIds] = useState<number[]>([]);
  const [formRolId, setFormRolId] = useState<number | "">("");

  // =========================================================
  // Estados de catálogos
  // =========================================================
  const [generosCatalogo, setGenerosCatalogo] = useState<OpcionCatalogo[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<OpcionCatalogo[]>([]);
  const [rolesCatalogo, setRolesCatalogo] = useState<OpcionCatalogo[]>([]);
  const [bodegasCatalogo, setBodegasCatalogo] = useState<OpcionCatalogo[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  // =========================================================
  // Permisos
  // =========================================================
  const canCreateUsuarios = tienePermiso("administracion", "usuarios", "crear");
  const canEditUsuarios = tienePermiso("administracion", "usuarios", "editar");
  const canChangeEstadoUsuarios = tienePermiso("administracion", "usuarios", "cambiarEstado");
  const canResetPasswordUsuarios = tienePermiso("administracion", "usuarios", "restablecerContrasena");
  const canDeleteUsuarios = tienePermiso("administracion", "usuarios", "eliminar");

  // =========================================================
  // Estados de errores y touched
  // =========================================================
  const [errors, setErrors] = useState({
    tipoDoc: "",
    numeroDoc: "",
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    email: "",
    telefono: "",
    bodegas: "",
    rol: "",
  });

  const [touched, setTouched] = useState({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    fechaNacimiento: false,
    apellido: false,
    email: false,
    telefono: false,
    bodegas: false,
    rol: false,
  });

  // =========================================================
  // Flags de ruta
  // =========================================================
  const isCrear = location.pathname.endsWith("/usuarios/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  // =========================================================
  // Datos derivados / useMemo
  // =========================================================
  const usuarioSeleccionado = useMemo(() => {
    if (!params.id) return null;
    const numericId = Number(params.id);
    if (!Number.isFinite(numericId)) return null;
    return usuarios.find((u) => u.id === numericId) ?? null;
  }, [usuarios, params.id]);

  const isSelfEdit = !!loggedUserId && usuarioSeleccionado?.id === loggedUserId;

  const filteredUsuarios = useMemo(() => {
    return usuarios
      .filter((u) => {
        if (selectedBodega === "Todas las bodegas") return true;
        return u.bodegas.includes(selectedBodega);
      })
      .filter((u) => {
        const searchLower = searchTerm.toLowerCase();

        return (
          u.nombre.toLowerCase().includes(searchLower) ||
          u.apellido.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.tipoDocumento.toLowerCase().includes(searchLower) ||
          u.numeroDocumento.toLowerCase().includes(searchLower) ||
          u.telefono.toLowerCase().includes(searchLower) ||
          u.bodegas.some((b) => b.toLowerCase().includes(searchLower)) ||
          u.rol.toLowerCase().includes(searchLower)
        );
      })
      .filter((u) => {
        if (estadoFilter === "todos") return true;
        return u.estado === (estadoFilter === "activos");
      });
  }, [usuarios, selectedBodega, searchTerm, estadoFilter]);

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // =========================================================
  // Funciones de carga
  // =========================================================
  const loadUsuarios = useCallback(async () => {
    try {
      setIsLoadingUsuarios(true);
      const response = await getUsuarios();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setIsLoadingUsuarios(false);
    }
  }, []);

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      const [tipos, roles, bodegas, generos] = await Promise.all([
        getTiposDocumentoCatalogo(),
        getRolesCatalogo(),
        getBodegasCatalogo(),
        getGenerosCatalogo(),
      ]);

      setTiposDocumento(tipos);
      setRolesCatalogo(roles);
      setBodegasCatalogo(bodegas);
      setGenerosCatalogo(generos);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      toast.error("No se pudieron cargar los catálogos");
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const closeToList = () => navigate("/app/usuarios");

  // =========================================================
  // Efectos
  // =========================================================
  useEffect(() => {
    loadCatalogos();
    loadUsuarios();
  }, [loadCatalogos, loadUsuarios]);

  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!usuarioSeleccionado) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isEliminar, usuarioSeleccionado, closeToList]);

  useEffect(() => {
    if (!isEditar) return;
    if (!usuarioSeleccionado) return;

    setFormTipoDocId(usuarioSeleccionado.idTipoDocumento);
    setFormNumeroDoc(usuarioSeleccionado.numeroDocumento);
    setFormNombre(usuarioSeleccionado.nombre);
    setFormApellido(usuarioSeleccionado.apellido);
    setFormFechaNacimiento(formatDateForInput(usuarioSeleccionado.fechaNacimiento));
    setFormEmail(usuarioSeleccionado.email);
    setFormGeneroId(usuarioSeleccionado.idGenero ?? "");
    setFormTelefono(usuarioSeleccionado.telefono);
    setFormBodegasIds(usuarioSeleccionado.bodegasIds);
    setFormRolId(usuarioSeleccionado.idRol);

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      apellido: false,
      fechaNacimiento: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }, [isEditar, usuarioSeleccionado]);

  useEffect(() => {
    if (!isCrear) return;

    setFormTipoDocId("");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormApellido("");
    setFormFechaNacimiento("");
    setFormEmail("");
    setFormGeneroId("");
    setFormTelefono("");
    setFormBodegasIds([]);
    setFormRolId("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      apellido: false,
      fechaNacimiento: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }, [isCrear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, selectedBodega]);

  // =========================================================
  // Validaciones y helpers
  // =========================================================
  const validateTipoDocField = (value: number | "") => {
    if (!value) {
      return "El tipo de documento es requerido";
    }
    return "";
  };

  const validateNumeroDocumento = (value: string) => {
    if (!value.trim()) {
      return "El número de documento es requerido";
    }
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(value)) {
      return "Solo se permiten números";
    }
    if (value.length < 6) {
      return "Mínimo 6 dígitos";
    }
    if (value.length > 15) {
      return "Máximo 15 dígitos";
    }
    return "";
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return "El nombre es requerido";
    }
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetras.test(value)) {
      return "Solo se permiten letras";
    }
    if (value.trim().length < 2) {
      return "Mínimo 2 caracteres";
    }
    if (value.trim().length > 50) {
      return "Máximo 50 caracteres";
    }
    return "";
  };

  const validateApellido = (value: string) => {
    if (!value.trim()) {
      return "El apellido es requerido";
    }
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetras.test(value)) {
      return "Solo se permiten letras";
    }
    if (value.trim().length < 2) {
      return "Mínimo 2 caracteres";
    }
    if (value.trim().length > 50) {
      return "Máximo 50 caracteres";
    }
    return "";
  };

  const formatDateForInput = (value?: string | Date | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const validateFechaNacimientoField = (value: string) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "La fecha de nacimiento no es válida";
    }

    return "";
  };

  const validateEmailField = (value: string) => {
    if (!value.trim()) {
      return "El email es requerido";
    }
    if (!value.includes("@")) {
      return "El email debe contener un @";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Formato de email inválido";
    }
    return "";
  };

  const validateTelefonoField = (value: string) => {
    if (!value.trim()) {
      return "El teléfono es requerido";
    }
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) {
      return "Debe tener exactamente 10 números";
    }
    return "";
  };

  const validateBodegasField = (value: number[]) => {
    if (value.length === 0) {
      return "Debes seleccionar al menos una bodega";
    }
    return "";
  };

  const validateRolField = (value: number | "") => {
    if (!value) {
      return "El rol es requerido";
    }
    return "";
  };

  const validateForm = () => {
    setTouched({
      tipoDoc: true,
      numeroDoc: true,
      nombre: true,
      apellido: true,
      fechaNacimiento: true,
      email: true,
      telefono: true,
      bodegas: true,
      rol: true,
    });

    const tipoDocError = validateTipoDocField(formTipoDocId);
    const numeroDocError = validateNumeroDocumento(formNumeroDoc);
    const nombreError = validateNombre(formNombre);
    const apellidoError = validateApellido(formApellido);
    const fechaNacimientoError = validateFechaNacimientoField(formFechaNacimiento);
    const emailError = validateEmailField(formEmail);
    const telefonoError = validateTelefonoField(formTelefono);
    const bodegasError = validateBodegasField(formBodegasIds);
    const rolError = validateRolField(formRolId);

    setErrors({
      tipoDoc: tipoDocError,
      numeroDoc: numeroDocError,
      nombre: nombreError,
      apellido: apellidoError,
      fechaNacimiento: fechaNacimientoError,
      email: emailError,
      telefono: telefonoError,
      bodegas: bodegasError,
      rol: rolError,
    });

    if (
      tipoDocError ||
      numeroDocError ||
      nombreError ||
      apellidoError ||
      fechaNacimientoError ||
      emailError ||
      telefonoError ||
      bodegasError ||
      rolError
    ) {
      toast.error("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case "Administrador":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Vendedor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Auxiliar Administrativo":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "Auxiliar de Bodega":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Conductor":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // =========================================================
  // Handlers de formulario
  // =========================================================
  const handleNumeroDocChange = (value: string) => {
    const limpio = value.replace(/\D/g, "").slice(0, 15);
    setFormNumeroDoc(limpio);

    if (touched.numeroDoc) {
      setErrors({ ...errors, numeroDoc: validateNumeroDocumento(limpio) });
    }
  };

  const handleNombreChange = (value: string) => {
    const limpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").slice(0, 50);
    setFormNombre(limpio);

    if (touched.nombre) {
      setErrors({ ...errors, nombre: validateNombre(limpio) });
    }
  };

  const handleApellidoChange = (value: string) => {
    const limpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").slice(0, 50);
    setFormApellido(limpio);

    if (touched.apellido) {
      setErrors({ ...errors, apellido: validateApellido(limpio) });
    }
  };

  const handleFechaNacimientoChange = (value: string) => {
    setFormFechaNacimiento(value);
    if (touched.fechaNacimiento) {
      setErrors({
        ...errors,
        fechaNacimiento: validateFechaNacimientoField(value),
      });
    }
  };

  const handleEmailChange = (value: string) => {
    setFormEmail(value);
    if (touched.email) {
      setErrors({ ...errors, email: validateEmailField(value) });
    }
  };

  const handleTelefonoChange = (value: string) => {
    setFormTelefono(value);
    if (touched.telefono) {
      setErrors({ ...errors, telefono: validateTelefonoField(value) });
    }
  };

  const handleRolChange = (value: number | "") => {
    setFormRolId(value);
    if (touched.rol) {
      setErrors({ ...errors, rol: validateRolField(value) });
    }
  };

  const handleTipoDocChange = (value: number | "") => {
    setFormTipoDocId(value);
    if (touched.tipoDoc) {
      setErrors({ ...errors, tipoDoc: validateTipoDocField(value) });
    }
  };

  const handleNumeroDocBlur = () => {
    setTouched({ ...touched, numeroDoc: true });
    setErrors({ ...errors, numeroDoc: validateNumeroDocumento(formNumeroDoc) });
  };

  const handleNombreBlur = () => {
    setTouched({ ...touched, nombre: true });
    setErrors({ ...errors, nombre: validateNombre(formNombre) });
  };

  const handleApellidoBlur = () => {
    setTouched({ ...touched, apellido: true });
    setErrors({ ...errors, apellido: validateApellido(formApellido) });
  };

  const handleFechaNacimientoBlur = () => {
    setTouched({ ...touched, fechaNacimiento: true });
    setErrors({
      ...errors,
      fechaNacimiento: validateFechaNacimientoField(formFechaNacimiento),
    });
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setErrors({ ...errors, email: validateEmailField(formEmail) });
  };

  const handleTelefonoBlur = () => {
    setTouched({ ...touched, telefono: true });
    setErrors({ ...errors, telefono: validateTelefonoField(formTelefono) });
  };

  const toggleBodega = (idBodega: number) => {
    const newBodegas = formBodegasIds.includes(idBodega)
      ? formBodegasIds.filter((id) => id !== idBodega)
      : [...formBodegasIds, idBodega];

    setFormBodegasIds(newBodegas);

    if (touched.bodegas) {
      setErrors({ ...errors, bodegas: validateBodegasField(newBodegas) });
    }
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

  const handleView = (u: Usuario) => {
    navigate(`/app/usuarios/${u.id}/ver`);
  };

  const handleCreate = () => {
    if (!canCreateUsuarios) {
      toast.error("No tienes permiso para crear usuarios");
      return;
    }

    setFormTipoDocId("");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormApellido("");
    setFormFechaNacimiento("");
    setFormEmail("");
    setFormTelefono("");
    setFormBodegasIds([]);
    setFormRolId("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      apellido: false,
      fechaNacimiento: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });

    navigate("/app/usuarios/crear");
  };

  const handleEdit = (u: Usuario) => {
    if (!canCreateUsuarios) {
      toast.error("No tienes permiso para crear usuarios");
      return;
    }
    navigate(`/app/usuarios/${u.id}/editar`);
  };

  const handleDelete = (u: Usuario) => {
    if (!canDeleteUsuarios) {
      toast.error("No tienes permiso para eliminar usuarios");
      return;
    }
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      return;
    }

    navigate(`/app/usuarios/${u.id}/eliminar`);
  };

  // =========================================================
  // Handlers de acciones / modales
  // =========================================================
  const handleOpenResetDialog = (u: Usuario) => {
    if (!canResetPasswordUsuarios) {
      toast.error("No tienes permiso para restablecer contraseñas");
      return;
    }

    const email = (u.email ?? "").trim();

    if (!email) {
      toast.error("No hay correo para enviar el cambio de contraseña.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("El correo no es válido.");
      return;
    }

    setResetEmail(email);
    setIsConfirmReset(true);
  };

  const handleSendPasswordReset = async () => {
    if (!canResetPasswordUsuarios) {
      toast.error("No tienes permiso para restablecer contraseñas");
      return;
    }

    try {
      setSendingReset(true);

      await solicitarRestablecimientoContrasena(resetEmail);

      toast.success(
        `Si el correo existe, se generó el enlace de restablecimiento para ${resetEmail}`
      );
      setIsConfirmReset(false);
    } catch (error) {
      console.error("Error enviando restablecimiento:", error);
      toast.error("No se pudo generar el enlace. Intenta de nuevo.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleOpenCreateConfirm = () => {
    if (isCreatingUsuario) return;
    if (!validateForm()) return;

    if (!formTipoDocId) {
      toast.error("Debes seleccionar tipo de documento");
      return;
    }

    if (!formRolId) {
      toast.error("Debes seleccionar rol");
      return;
    }

    setIsConfirmCreateOpen(true);
  };

  const handleConfirmCreateModalChange = (open: boolean) => {
    if (isCreatingUsuario) return;
    setIsConfirmCreateOpen(open);
  };

  const handleOpenEditConfirm = () => {
    if (isUpdatingUsuario) return;
    if (!usuarioSeleccionado) return;
    if (!validateForm()) return;

    if (!formTipoDocId) {
      toast.error("Debes seleccionar tipo de documento");
      return;
    }

    if (!formRolId) {
      toast.error("Debes seleccionar rol");
      return;
    }

    setIsConfirmEditOpen(true);
  };

  const toggleEstado = (u: Usuario) => {
    if (!canChangeEstadoUsuarios) {
      toast.error("No tienes permiso para cambiar el estado de usuarios");
      return;
    }
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes inhabilitar tu propio usuario");
      return;
    }
    setUsuarioParaCambioEstado(u);
    setShowConfirmEstadoModal(true);
  };

  // =========================================================
  // Confirmaciones / acciones async
  // =========================================================
  const confirmCreate = async () => {
    if (isCreatingUsuario) return;
    if (!validateForm()) return;

    if (!formTipoDocId) {
      toast.error("Debes seleccionar tipo de documento");
      return;
    }

    if (!formRolId) {
      toast.error("Debes seleccionar rol");
      return;
    }

    try {
      setIsCreatingUsuario(true);

      const response = await createUsuario({
        nombre: formNombre.trim(),
        apellido: formApellido.trim(),
        id_tipo_doc: formTipoDocId,
        num_documento: formNumeroDoc.trim(),
        email: formEmail.trim().toLowerCase(),
        id_rol: formRolId,
        id_genero: formGeneroId === "" ? undefined : Number(formGeneroId),
        fecha_nacimiento: formFechaNacimiento || undefined,
        estado: true,
        telefono: formTelefono.trim() || undefined,
      });

      const idUsuarioCreado = response.usuario.id_usuario;

      if (formBodegasIds.length > 0) {
        await Promise.all(
          formBodegasIds.map((idBodega) =>
            asignarBodegaAUsuario({
              id_usuario: idUsuarioCreado,
              id_bodega: idBodega,
            })
          )
        );
      }

      await loadUsuarios();

      setIsConfirmCreateOpen(false);
      closeToList();
      setShowSuccessModal(true);

      toast.success(
        "Usuario creado correctamente. Se envió el enlace para definir la contraseña."
      );
    } catch (error: any) {
      console.error("Error creando usuario:", error);

      const status = error?.response?.status;
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo crear el usuario";

      if (status === 409) {
        toast.error(message || "Ya existe un usuario con ese correo o documento");
        return;
      }

      toast.error(message);
    } finally {
      setIsCreatingUsuario(false);
    }
  };

  const confirmEdit = async () => {
    if (isUpdatingUsuario) return;
    if (!usuarioSeleccionado || !validateForm()) return;

    try {
      setIsUpdatingUsuario(true);

      if (!formTipoDocId) {
        toast.error("Debes seleccionar tipo de documento");
        return;
      }

      if (!formRolId) {
        toast.error("Debes seleccionar rol");
        return;
      }

      const isSelf = !!loggedUserId && usuarioSeleccionado.id === loggedUserId;

      await updateUsuario(usuarioSeleccionado.id, {
        nombre: formNombre.trim(),
        apellido: formApellido.trim(),
        id_tipo_doc: formTipoDocId,
        num_documento: formNumeroDoc.trim(),
        email: formEmail.trim(),
        telefono: formTelefono.trim() || undefined,
        fecha_nacimiento: formFechaNacimiento || undefined,
        id_genero: formGeneroId === "" ? undefined : Number(formGeneroId),
        ...(isSelf ? {} : { id_rol: formRolId }),
      });

      const actuales = usuarioSeleccionado.bodegasIds;
      const nuevas = formBodegasIds;

      const bodegasPorAgregar = nuevas.filter((id) => !actuales.includes(id));
      const bodegasPorQuitar = actuales.filter((id) => !nuevas.includes(id));

      await Promise.all([
        ...bodegasPorAgregar.map((idBodega) =>
          asignarBodegaAUsuario({
            id_usuario: usuarioSeleccionado.id,
            id_bodega: idBodega,
          })
        ),
        ...bodegasPorQuitar.map((idBodega) =>
          quitarBodegaAUsuario(usuarioSeleccionado.id, idBodega)
        ),
      ]);

      if (isSelf) {
        await refreshUsuario();
      }
      await loadUsuarios();

      setIsConfirmEditOpen(false);

      if (isSelf && formRolId !== usuarioSeleccionado.idRol) {
        toast.warning("No puedes cambiar tu propio rol mientras estás logueado");
      } else {
        toast.success("Usuario actualizado exitosamente");
      }

      closeToList();
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo actualizar el usuario"
      );
    } finally {
      setIsUpdatingUsuario(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDeleteUsuarios) {
      toast.error("No tienes permiso para eliminar usuarios");
      return;
    }

    if (isDeletingUsuario) return;
    if (!usuarioSeleccionado) return;

    if (loggedUserId && usuarioSeleccionado.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      closeToList();
      return;
    }

    try {
      setIsDeletingUsuario(true);

      await deleteUsuario(usuarioSeleccionado.id);
      await loadUsuarios();
      toast.success("Usuario eliminado exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo eliminar el usuario"
      );
    } finally {
      setIsDeletingUsuario(false);
    }
  };

  const handleConfirmEstado = async () => {
    if (!canChangeEstadoUsuarios) {
      toast.error("No tienes permiso para cambiar el estado de usuarios");
      return;
    }

    if (isChangingEstadoUsuario) return;
    if (!usuarioParaCambioEstado) return;

    if (loggedUserId && usuarioParaCambioEstado.id === loggedUserId) {
      toast.error("No puedes inhabilitar tu propio usuario");
      setShowConfirmEstadoModal(false);
      setUsuarioParaCambioEstado(null);
      return;
    }

    try {
      setIsChangingEstadoUsuario(true);

      await cambiarEstadoUsuario(
        usuarioParaCambioEstado.id,
        !usuarioParaCambioEstado.estado
      );

      await loadUsuarios();

      toast.success(
        `Usuario ${usuarioParaCambioEstado.estado ? "desactivado" : "activado"} exitosamente`
      );
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "No se pudo cambiar el estado del usuario"
      );
    } finally {
      setIsChangingEstadoUsuario(false);
      setShowConfirmEstadoModal(false);
      setUsuarioParaCambioEstado(null);
    }
  };

  const formatFechaDisplay = (value?: string | Date | null) => {
    if (!value) return "No registrada";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No registrada";

    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUsuarioFoto = (u: any) => {
    return u?.avatarUrl || u?.imgUrl || u?.img_url || u?.raw?.img_url || "";
  };

  const getUsuarioIniciales = (u: any) => {
    const nombre = u?.nombre?.charAt(0) || "";
    const apellido = u?.apellido?.charAt(0) || "";
    return `${nombre}${apellido}` || "U";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Usuarios</h2>
        <p className="text-gray-600 mt-1">
          Administra los usuarios del sistema
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar usuarios..."
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
            variant={estadoFilter === 'todos' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('todos')}
            className={`h-8 ${estadoFilter === 'todos'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'hover:bg-gray-200'
              }`}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'activos' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('activos')}
            className={`h-8 ${estadoFilter === 'activos'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'hover:bg-gray-200'
              }`}
          >
            Activos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'inactivos' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('inactivos')}
            className={`h-8 ${estadoFilter === 'inactivos'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'hover:bg-gray-200'
              }`}
          >
            Inactivos
          </Button>
        </div>

        {canCreateUsuarios && (
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoadingUsuarios && (
        <div className="mb-3 text-sm text-gray-500">Cargando usuarios...</div>
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Bodega Asignada</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-40">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                currentUsuarios.map((usuario, index) => {
                  const isSelfRow = !!loggedUserId && usuario.id === loggedUserId;

                  return (
                    <TableRow key={usuario.id} className="hover:bg-gray-50">
                      <TableCell>{startIndex + index + 1}</TableCell>

                      <TableCell className="font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {usuario.email}
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {usuario.telefono}
                      </TableCell>

                      <TableCell className="max-w-[240px] whitespace-normal break-words">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 whitespace-normal"
                        >
                          {usuario.bodegas.slice(0, 2).join(", ")}
                          {usuario.bodegas.length > 2 && (
                            <>
                              <br />
                              {usuario.bodegas.slice(2).join(", ")}
                            </>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRolBadgeColor(usuario.rol)}
                        >
                          {usuario.rol}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelfRow || !canChangeEstadoUsuarios}
                          onClick={() => {
                            if (isSelfRow) {
                              toast.error("No puedes inhabilitar tu propio usuario");
                              return;
                            }
                            toggleEstado(usuario);
                          }}
                          className={`${usuario.estado
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                            } ${isSelfRow ? "opacity-40 cursor-not-allowed" : ""}`}
                          title={isSelfRow ? "No puedes cambiar tu propio estado" : "Cambiar estado"}
                        >
                          {usuario.estado ? "Activo" : "Inactivo"}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {canResetPasswordUsuarios && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenResetDialog(usuario)}
                              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              title="Enviar link de contraseña"
                            >
                              <Mail size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(usuario)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </Button>
                          {canEditUsuarios && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(usuario)}
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {canDeleteUsuarios && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(usuario)}
                              disabled={isSelfRow}
                              className={`h-8 w-8 ${isSelfRow
                                ? "opacity-40 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                }`}
                              title={
                                isSelfRow
                                  ? "No puedes eliminar tu propio usuario"
                                  : "Eliminar"
                              }
                            >
                              <Trash2 size={16} />
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

      {/* Paginación */}
      {filteredUsuarios.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredUsuarios.length)} de{' '}
            {filteredUsuarios.length} usuarios
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

      {/* Modal Ver Usuarios */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-4xl !p-0 overflow-hidden"
          aria-describedby="view-usuario-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {usuarioSeleccionado && (
            <div className="max-h-[85vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
                <DialogHeader className="pr-8">
                  <DialogTitle className="flex items-center gap-2 text-gray-900">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    Perfil del Usuario
                  </DialogTitle>
                  <DialogDescription
                    id="view-usuario-description"
                    className="text-gray-500"
                  >
                    Información completa del usuario
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                          {getUsuarioFoto(usuarioSeleccionado) ? (
                            <img
                              src={getUsuarioFoto(usuarioSeleccionado)}
                              alt={`${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellido}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-semibold">
                              {getUsuarioIniciales(usuarioSeleccionado)}
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="mt-3 text-gray-900 text-center text-lg font-semibold">
                        {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                      </h3>

                      <div className="mt-4 w-full">
                        <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200">
                          <Building2 size={16} />
                          <span className="text-sm font-medium">
                            {usuarioSeleccionado.rol}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Badge
                          className={`h-8 px-3 text-sm ${usuarioSeleccionado.estado
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                            }`}
                        >
                          {usuarioSeleccionado.estado ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      {Array.isArray(usuarioSeleccionado.bodegas) &&
                        usuarioSeleccionado.bodegas.length > 0 && (
                          <div className="mt-4 w-full">
                            <p className="text-xs text-gray-500 mb-2 text-center">
                              Bodegas asignadas
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {usuarioSeleccionado.bodegas.map((bodega) => (
                                <span
                                  key={bodega}
                                  className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                  {bodega}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-gray-900 mb-6">Información Personal</h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Nombre
                          </Label>
                          <Input
                            value={usuarioSeleccionado.nombre}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Apellido
                          </Label>
                          <Input
                            value={usuarioSeleccionado.apellido}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            Correo Electrónico
                          </Label>
                          <Input
                            value={usuarioSeleccionado.email ?? ""}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 size={16} className="text-gray-400" />
                            Teléfono
                          </Label>
                          <Input
                            value={usuarioSeleccionado.telefono || "No registrado"}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Tipo de Documento
                          </Label>
                          <Input
                            value={usuarioSeleccionado.tipoDocumento}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Documento de Identidad
                          </Label>
                          <Input
                            value={usuarioSeleccionado.numeroDocumento}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Fecha de nacimiento
                          </Label>
                          <Input
                            value={formatFechaDisplay(usuarioSeleccionado.fechaNacimiento)}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <UserIcon size={16} className="text-gray-400" />
                            Género
                          </Label>
                          <Input
                            value={usuarioSeleccionado.genero || "No definido"}
                            disabled
                            className="bg-gray-50 border-gray-300 text-gray-700"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button variant="outline" onClick={closeToList} className="gap-2 h-11">
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Crear Usuario */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (isCreatingUsuario) return;
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-4xl"
          onInteractOutside={(e) => {
            if (isCreatingUsuario) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isCreatingUsuario) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription id="create-usuario-description">
              Completa la información del nuevo usuario del sistema
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            {isCreatingUsuario && (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3 rounded-xl border bg-white px-6 py-5 shadow-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="text-sm font-medium text-gray-900">
                    Creando usuario...
                  </div>
                  <div className="text-xs text-gray-500">
                    Por favor espera un momento
                  </div>
                </div>
              </div>
            )}

            <div
              className={`space-y-4 ${isLoadingCatalogos || isCreatingUsuario
                ? "opacity-60 pointer-events-none"
                : ""
                }`}
            >
              {isLoadingCatalogos && (
                <div className="text-sm text-gray-500">Cargando opciones...</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                  <Select
                    value={formTipoDocId === "" ? "" : String(formTipoDocId)}
                    onValueChange={(value) => {
                      const parsed = value ? Number(value) : "";
                      handleTipoDocChange(parsed);
                      setTouched((prev) => ({ ...prev, tipoDoc: true }));
                    }}
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                  >
                    <SelectTrigger
                      id="create-tipo-doc"
                      className={errors.tipoDoc && touched.tipoDoc ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona un tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDocumento.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.tipoDoc && touched.tipoDoc && (
                    <p className="text-red-500 text-sm mt-1">{errors.tipoDoc}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                  <Input
                    id="create-numero-doc"
                    value={formNumeroDoc}
                    onChange={(e) => handleNumeroDocChange(e.target.value)}
                    onBlur={handleNumeroDocBlur}
                    maxLength={15}
                    placeholder="Ej: 1234567890"
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                    className={errors.numeroDoc && touched.numeroDoc ? "border-red-500" : ""}
                  />
                  {errors.numeroDoc && touched.numeroDoc && (
                    <p className="text-red-500 text-sm mt-1">{errors.numeroDoc}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-nombre">Nombre *</Label>
                  <Input
                    id="create-nombre"
                    value={formNombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    onBlur={handleNombreBlur}
                    placeholder="Ej: Juan"
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                    className={errors.nombre && touched.nombre ? "border-red-500" : ""}
                  />
                  {errors.nombre && touched.nombre && (
                    <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-apellido">Apellido *</Label>
                  <Input
                    id="create-apellido"
                    value={formApellido}
                    onChange={(e) => handleApellidoChange(e.target.value)}
                    onBlur={handleApellidoBlur}
                    placeholder="Ej: Pérez"
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                    className={errors.apellido && touched.apellido ? "border-red-500" : ""}
                  />
                  {errors.apellido && touched.apellido && (
                    <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-fecha-nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="create-fecha-nacimiento"
                    type="date"
                    value={formFechaNacimiento}
                    onChange={(e) => setFormFechaNacimiento(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="create-genero">Género</Label>
                  <Select
                    value={formGeneroId === "" ? "" : String(formGeneroId)}
                    onValueChange={(value) =>
                      setFormGeneroId(value ? Number(value) : "")
                    }
                  >
                    <SelectTrigger id="create-genero">
                      <SelectValue placeholder="Selecciona un género" />
                    </SelectTrigger>
                    <SelectContent>
                      {generosCatalogo.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="correo@ejemplo.com"
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                    className={errors.email && touched.email ? "border-red-500" : ""}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-telefono">Teléfono *</Label>
                  <Input
                    id="create-telefono"
                    value={formTelefono}
                    onChange={(e) => handleTelefonoChange(e.target.value)}
                    onBlur={handleTelefonoBlur}
                    maxLength={10}
                    placeholder="3001234567"
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                    className={errors.telefono && touched.telefono ? "border-red-500" : ""}
                  />
                  {errors.telefono && touched.telefono && (
                    <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-bodega">Bodegas Asignadas *</Label>
                  <div className="space-y-2 mt-2 border border-gray-200 rounded-md p-3">
                    {bodegasCatalogo.map((bodega) => (
                      <div key={bodega.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-bodega-${bodega.id}`}
                          checked={formBodegasIds.includes(bodega.id)}
                          disabled={isCreatingUsuario || isLoadingCatalogos}
                          onCheckedChange={() => {
                            if (isCreatingUsuario || isLoadingCatalogos) return;
                            toggleBodega(bodega.id);
                          }}
                        />
                        <label
                          htmlFor={`create-bodega-${bodega.id}`}
                          className={`text-sm ${isCreatingUsuario || isLoadingCatalogos
                            ? "cursor-not-allowed opacity-70"
                            : "cursor-pointer"
                            }`}
                        >
                          {bodega.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.bodegas && touched.bodegas && (
                    <p className="text-red-500 text-sm mt-1">{errors.bodegas}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="create-rol">Rol *</Label>
                  <Select
                    value={formRolId === "" ? "" : String(formRolId)}
                    onValueChange={(value) => {
                      const parsed = value ? Number(value) : "";
                      handleRolChange(parsed);
                      setTouched((prev) => ({ ...prev, rol: true }));
                    }}
                    disabled={isCreatingUsuario || isLoadingCatalogos}
                  >
                    <SelectTrigger
                      id="create-rol"
                      className={errors.rol && touched.rol ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesCatalogo.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.rol && touched.rol && (
                    <p className="text-red-500 text-sm mt-1">{errors.rol}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeToList}
              disabled={isCreatingUsuario}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleOpenCreateConfirm}
              className="bg-blue-600 hover:bg-blue-700 min-w-[150px]"
              disabled={isCreatingUsuario}
            >
              {isCreatingUsuario ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuario */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-usuario-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription id="edit-usuario-description">
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select
                  value={formTipoDocId === "" ? "" : String(formTipoDocId)}
                  onValueChange={(value) => {
                    const parsed = value ? Number(value) : "";
                    handleTipoDocChange(parsed);
                    setTouched((prev) => ({ ...prev, tipoDoc: true }));
                  }}
                >
                  <SelectTrigger
                    id="edit-tipo-doc"
                    className={errors.tipoDoc && touched.tipoDoc ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoDoc}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  onBlur={handleNumeroDocBlur}
                  maxLength={15}
                  placeholder="Ej: 1234567890"
                  className={errors.numeroDoc && touched.numeroDoc ? "border-red-500" : ""}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-sm mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={formNombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  onBlur={handleNombreBlur}
                  placeholder="Ej: Juan"
                  className={errors.nombre && touched.nombre ? "border-red-500" : ""}
                />
                {errors.nombre && touched.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  value={formApellido}
                  onChange={(e) => handleApellidoChange(e.target.value)}
                  onBlur={handleApellidoBlur}
                  placeholder="Ej: Pérez"
                  className={errors.apellido && touched.apellido ? "border-red-500" : ""}
                />
                {errors.apellido && touched.apellido && (
                  <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-fecha-nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="edit-fecha-nacimiento"
                  type="date"
                  value={formFechaNacimiento}
                  onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                  onBlur={handleFechaNacimientoBlur}
                />
              </div>

              <div>
                <Label htmlFor="edit-genero">Género</Label>
                <Select
                  value={formGeneroId === "" ? "" : String(formGeneroId)}
                  onValueChange={(value) =>
                    setFormGeneroId(value ? Number(value) : "")
                  }
                >
                  <SelectTrigger id="edit-genero">
                    <SelectValue placeholder="Selecciona un género" />
                  </SelectTrigger>
                  <SelectContent>
                    {generosCatalogo.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="correo@ejemplo.com"
                  className={errors.email && touched.email ? "border-red-500" : ""}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-telefono">Teléfono *</Label>
                <Input
                  id="edit-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  onBlur={handleTelefonoBlur}
                  maxLength={10}
                  placeholder="3001234567"
                  className={errors.telefono && touched.telefono ? "border-red-500" : ""}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-bodega">Bodegas Asignadas *</Label>
                <div className="space-y-2 mt-2 border border-gray-200 rounded-md p-3">
                  {bodegasCatalogo.map((bodega) => (
                    <div key={bodega.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-bodega-${bodega.id}`}
                        checked={formBodegasIds.includes(bodega.id)}
                        onCheckedChange={() => toggleBodega(bodega.id)}
                      />
                      <label
                        htmlFor={`edit-bodega-${bodega.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {bodega.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.bodegas && touched.bodegas && (
                  <p className="text-red-500 text-sm mt-1">{errors.bodegas}</p>
                )}
              </div>

              <Select
                value={formRolId === "" ? "" : String(formRolId)}
                onValueChange={(value) => {
                  const parsed = value ? Number(value) : "";
                  handleRolChange(parsed);
                  setTouched((prev) => ({ ...prev, rol: true }));
                }}
                disabled={isSelfEdit}
              >
                <SelectTrigger
                  id="edit-rol"
                  className={`${errors.rol && touched.rol && !isSelfEdit ? "border-red-500" : ""} ${isSelfEdit ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                >
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesCatalogo.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={handleOpenEditConfirm}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isUpdatingUsuario}
            >
              {isUpdatingUsuario ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL RESET PASSWORD (igual a Profile) */}
      <Dialog
        open={isConfirmReset}
        modal
        onOpenChange={(open) => {
          if (!open && !sendingReset) setIsConfirmReset(false);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            // ✅ permitir ESC para cerrar (como pediste)
            if (sendingReset) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Enviar cambio de contraseña</DialogTitle>
            <DialogDescription>
              Se enviará un enlace de cambio de contraseña al correo:{" "}
              <span className="font-semibold text-gray-900">{resetEmail}</span>
              <br />
              ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmReset(false)}
              disabled={sendingReset}
            >
              Cancelar
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendPasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Usuario */}
      <Dialog
        open={isEliminar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="delete-usuario-description">
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription id="delete-usuario-description">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {usuarioSeleccionado && (
            <div className="py-4">
              <p className="text-gray-700">
                Usuario:{" "}
                <span className="font-semibold">
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Email: {usuarioSeleccionado.email}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={
                isDeletingUsuario ||
                (!!loggedUserId && usuarioSeleccionado?.id === loggedUserId)
              }
              title={
                !!loggedUserId && usuarioSeleccionado?.id === loggedUserId
                  ? "No puedes eliminar tu propio usuario"
                  : isDeletingUsuario
                    ? "Eliminando usuario..."
                    : "Eliminar"
              }
            >
              {isDeletingUsuario ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-lg" aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este usuario?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usuario:</span>
              <span className="font-medium">{usuarioParaCambioEstado?.nombre} {usuarioParaCambioEstado?.apellido}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span className={`font-medium ${usuarioParaCambioEstado?.estado ? 'text-green-700' : 'text-red-700'}`}>
                {usuarioParaCambioEstado?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span className={`font-medium ${!usuarioParaCambioEstado?.estado ? 'text-green-700' : 'text-red-700'}`}>
                {!usuarioParaCambioEstado?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmEstadoModal(false)}
              disabled={isChangingEstadoUsuario}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isChangingEstadoUsuario}
            >
              {isChangingEstadoUsuario ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg" aria-describedby="success-usuario-description">
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription id="success-usuario-description" className="sr-only">
              El usuario se ha registrado correctamente
            </DialogDescription>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>
            <DialogDescription className="text-center">
              El usuario ha sido creado correctamente en el sistema
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button onClick={handleSuccessModalClose} className="bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmCreateOpen}
        modal
        onOpenChange={handleConfirmCreateModalChange}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar creación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas crear el usuario ingresado?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <p>
              <span className="font-medium text-gray-700">Nombre:</span>{" "}
              {formNombre} {formApellido}
            </p>
            <p>
              <span className="font-medium text-gray-700">Documento:</span>{" "}
              {formNumeroDoc}
            </p>
            <p>
              <span className="font-medium text-gray-700">Correo:</span>{" "}
              {formEmail}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmCreateOpen(false)}
              disabled={isCreatingUsuario}
            >
              Cancelar
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              onClick={confirmCreate}
              disabled={isCreatingUsuario}
            >
              {isCreatingUsuario ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmEditOpen}
        modal
        onOpenChange={(open: boolean) => {
          if (!open && !isUpdatingUsuario) setIsConfirmEditOpen(false);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar edición</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas guardar los cambios del usuario?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmEditOpen(false)}
              disabled={isUpdatingUsuario}
            >
              Cancelar
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={confirmEdit}
              disabled={isUpdatingUsuario}
            >
              {isUpdatingUsuario ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}