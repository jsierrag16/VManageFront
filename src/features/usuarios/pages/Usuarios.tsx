import { useAuth } from "@/shared/context/AuthContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "@/layouts/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { toast } from 'sonner';
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, User as UserIcon, Mail, Building2, CheckCircle, Filter } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../shared/components/ui/dialog';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { Checkbox } from '../../../shared/components/ui/checkbox';

// Datos de usuarios - ESTOS SON LOS USUARIOS REALES DEL SISTEMA
export const usuariosDataInitial = [
  {
    id: 1,
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    nombre: 'Admin',
    apellido: 'Principal',
    email: 'administrador@gmail.com',
    telefono: '3001234567',
    bodegas: ['Bodega Principal', 'Bodega Secundaria'],
    rol: 'Administrador',
    estado: true,
  },
  {
    id: 2,
    tipoDocumento: 'CC',
    numeroDocumento: '9876543210',
    nombre: 'Juan',
    apellido: 'Vendedor',
    email: 'vendedor@gmail.com',
    telefono: '3102345678',
    bodegas: ['Bodega Secundaria'],
    rol: 'Vendedor',
    estado: true,
  },
  {
    id: 3,
    tipoDocumento: 'CC',
    numeroDocumento: '5551234567',
    nombre: 'María',
    apellido: 'Bodeguero',
    email: 'bodeguero@gmail.com',
    telefono: '3203456789',
    bodegas: ['Bodega Principal'],
    rol: 'Auxiliar de Bodega',
    estado: true,
  },
  {
    id: 4,
    tipoDocumento: 'CC',
    numeroDocumento: '7778889990',
    nombre: 'Carlos',
    apellido: 'Pérez',
    email: 'carlos.perez@gmail.com',
    telefono: '3155551234',
    bodegas: ['Bodega Medellín'],
    rol: 'Vendedor',
    estado: true,
  },
  {
    id: 5,
    tipoDocumento: 'CC',
    numeroDocumento: '4445556660',
    nombre: 'Ana',
    apellido: 'Gómez',
    email: 'ana.gomez@gmail.com',
    telefono: '3127779999',
    bodegas: ['Bodega Secundaria'],
    rol: 'Auxiliar de Bodega',
    estado: true,
  },
  {
    id: 6,
    tipoDocumento: 'CC',
    numeroDocumento: '1112223330',
    nombre: 'Pedro',
    apellido: 'López',
    email: 'pedro.lopez@gmail.com',
    telefono: '3182223333',
    bodegas: ['Bodega Medellín'],
    rol: 'Auxiliar Administrativo',
    estado: false,
  },
];

interface Usuario {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  bodegas: string[];
  rol: string;
  estado: boolean;
}

interface UsuariosProps {
  triggerCreate?: number;
}

export default function Usuarios({ }: UsuariosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosDataInitial);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [usuarioParaCambioEstado, setUsuarioParaCambioEstado] = useState<Usuario | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isConfirmReset, setIsConfirmReset] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");


  // Form states
  const [formTipoDoc, setFormTipoDoc] = useState('CC');
  const [formNumeroDoc, setFormNumeroDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formBodegas, setFormBodegas] = useState<string[]>([]);
  const [formRol, setFormRol] = useState('');

  // Estados para validaciones en tiempo real
  const [errors, setErrors] = useState({
    numeroDoc: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    bodegas: '',
    rol: ''
  });
  const [touched, setTouched] = useState({
    numeroDoc: false,
    nombre: false,
    apellido: false,
    email: false,
    telefono: false,
    bodegas: false,
    rol: false
  });

  const { usuario } = useAuth();
  const loggedUserId = usuario?.id ?? null;

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  // ✅ Bodega desde MainLayout (igual que Productos)
  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  // ✅ flags por URL (igual que Productos)
  const isCrear = location.pathname.endsWith("/usuarios/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const usuarioSeleccionado = useMemo(() => {
    if (!params.id) return null;
    const numericId = Number(params.id);
    if (!Number.isFinite(numericId)) return null;
    return usuarios.find((u) => u.id === numericId) ?? null;
  }, [usuarios, params.id]);

  const isSelfEdit = !!loggedUserId && usuarioSeleccionado?.id === loggedUserId;

  // ✅ volver al listado (igual que Productos)
  const closeToList = () => navigate("/app/usuarios");

  // ✅ Si entran a /ver, /editar o /eliminar con un id inválido, volvemos al listado
  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!usuarioSeleccionado) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isEliminar, usuarioSeleccionado, closeToList]);

  // ✅ Cuando estoy en /editar, precargar el formulario con el usuario seleccionado
  useEffect(() => {
    if (!isEditar) return;
    if (!usuarioSeleccionado) return;

    setFormTipoDoc(usuarioSeleccionado.tipoDocumento);
    setFormNumeroDoc(usuarioSeleccionado.numeroDocumento);
    setFormNombre(usuarioSeleccionado.nombre);
    setFormApellido(usuarioSeleccionado.apellido);
    setFormEmail(usuarioSeleccionado.email);
    setFormTelefono(usuarioSeleccionado.telefono);
    setFormBodegas(usuarioSeleccionado.bodegas);
    setFormRol(usuarioSeleccionado.rol);

    // (opcional pero recomendado) limpiar validaciones al abrir editar
    setErrors({
      numeroDoc: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });
    setTouched({
      numeroDoc: false,
      nombre: false,
      apellido: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }, [isEditar, usuarioSeleccionado]);

  // ✅ Al entrar a /crear, dejar el form limpio
  useEffect(() => {
    if (!isCrear) return;

    setFormTipoDoc("CC");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormApellido("");
    setFormEmail("");
    setFormTelefono("");
    setFormBodegas([]);
    setFormRol("");

    setErrors({
      numeroDoc: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });
    setTouched({
      numeroDoc: false,
      nombre: false,
      apellido: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }, [isCrear]);

  // Funciones de validación individuales
  const validateNumeroDocumento = (value: string) => {
    if (!value.trim()) {
      return 'El número de documento es requerido';
    }
    // Solo números, sin guiones ni otros caracteres
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(value)) {
      return 'Solo se permiten números';
    }
    if (value.length < 6) {
      return 'Mínimo 6 dígitos';
    }
    if (value.length > 15) {
      return 'Máximo 15 dígitos';
    }
    return '';
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return 'El nombre es requerido';
    }
    // Solo letras y espacios (permite acentos y ñ)
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetras.test(value)) {
      return 'Solo se permiten letras';
    }
    if (value.trim().length < 2) {
      return 'Mínimo 2 caracteres';
    }
    if (value.trim().length > 50) {
      return 'Máximo 50 caracteres';
    }
    return '';
  };

  const validateApellido = (value: string) => {
    if (!value.trim()) {
      return 'El apellido es requerido';
    }
    // Solo letras y espacios (permite acentos y ñ)
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetras.test(value)) {
      return 'Solo se permiten letras';
    }
    if (value.trim().length < 2) {
      return 'Mínimo 2 caracteres';
    }
    if (value.trim().length > 50) {
      return 'Máximo 50 caracteres';
    }
    return '';
  };

  const validateEmailField = (value: string) => {
    if (!value.trim()) {
      return 'El email es requerido';
    }
    // Debe contener un @
    if (!value.includes('@')) {
      return 'El email debe contener un @';
    }
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Formato de email inválido';
    }
    return '';
  };

  const validateTelefonoField = (value: string) => {
    if (!value.trim()) {
      return 'El teléfono es requerido';
    }
    // Exactamente 10 números seguidos
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) {
      return 'Debe tener exactamente 10 números';
    }
    return '';
  };

  const validateBodegasField = (value: string[]) => {
    if (value.length === 0) {
      return 'Debes seleccionar al menos una bodega';
    }
    return '';
  };

  const validateRolField = (value: string) => {
    if (!value) {
      return 'El rol es requerido';
    }
    return '';
  };

  // Handlers con validación en tiempo real
  const handleOpenResetDialog = (u: Usuario) => {
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
    try {
      setSendingReset(true);

      // ✅ Aquí conectas tu backend:
      // await authService.sendPasswordReset({ email: resetEmail });

      await new Promise((r) => setTimeout(r, 700));

      toast.success(`Se envió el correo de cambio de contraseña a ${resetEmail}`);
      setIsConfirmReset(false);
    } catch {
      toast.error("No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setSendingReset(false);
    }
  };
  const handleNumeroDocChange = (value: string) => {
    setFormNumeroDoc(value);
    if (touched.numeroDoc) {
      setErrors({ ...errors, numeroDoc: validateNumeroDocumento(value) });
    }
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors({ ...errors, nombre: validateNombre(value) });
    }
  };

  const handleApellidoChange = (value: string) => {
    setFormApellido(value);
    if (touched.apellido) {
      setErrors({ ...errors, apellido: validateApellido(value) });
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

  const handleRolChange = (value: string) => {
    setFormRol(value);
    if (touched.rol) {
      setErrors({ ...errors, rol: validateRolField(value) });
    }
  };

  // Handlers onBlur
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

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setErrors({ ...errors, email: validateEmailField(formEmail) });
  };

  const handleTelefonoBlur = () => {
    setTouched({ ...touched, telefono: true });
    setErrors({ ...errors, telefono: validateTelefonoField(formTelefono) });
  };

  const handleRolBlur = () => {
    setTouched({ ...touched, rol: true });
    setErrors({ ...errors, rol: validateRolField(formRol) });
  };

  // Lista de bodegas disponibles
  const bodegasDisponibles = ['Bodega Principal', 'Bodega Secundaria', 'Bodega Medellín', 'Bodega Cali'];

  // Lista de roles disponibles (congruente con módulo de Roles)
  const rolesDisponibles = [
    'Administrador',
    'Vendedor',
    'Auxiliar Administrativo',
    'Auxiliar de Bodega',
    'Conductor',
  ];

  const filteredUsuarios = useMemo(() => {
    return usuarios
      .filter((u) => {
        // ✅ Si es "Todas las bodegas" (cuando exista), no filtramos por bodega
        if (selectedBodega === "Todas las bodegas") return true;

        // ✅ Si no, el usuario debe tener esa bodega asignada
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


  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, selectedBodega]);

  const handleView = (u: Usuario) => {
    navigate(`/app/usuarios/${u.id}/ver`);
  };

  const handleCreate = () => {
    setFormTipoDoc("CC");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormApellido("");
    setFormEmail("");
    setFormTelefono("");
    setFormBodegas([]);
    setFormRol("");
    setErrors({
      numeroDoc: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      bodegas: "",
      rol: "",
    });
    setTouched({
      numeroDoc: false,
      nombre: false,
      apellido: false,
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });

    navigate("/app/usuarios/crear");
  };

  const handleEdit = (u: Usuario) => {
    navigate(`/app/usuarios/${u.id}/editar`);
  };

  const handleDelete = (u: Usuario) => {
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      return;
    }

    navigate(`/app/usuarios/${u.id}/eliminar`);
  };
  const validateForm = () => {
    // Marcar todos los campos como tocados
    setTouched({
      numeroDoc: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      bodegas: true,
      rol: true
    });

    // Validar con las funciones individuales
    const numeroDocError = validateNumeroDocumento(formNumeroDoc);
    const nombreError = validateNombre(formNombre);
    const apellidoError = validateApellido(formApellido);
    const emailError = validateEmailField(formEmail);
    const telefonoError = validateTelefonoField(formTelefono);
    const bodegasError = validateBodegasField(formBodegas);
    const rolError = validateRolField(formRol);

    setErrors({
      numeroDoc: numeroDocError,
      nombre: nombreError,
      apellido: apellidoError,
      email: emailError,
      telefono: telefonoError,
      bodegas: bodegasError,
      rol: rolError
    });

    // Si hay algún error, no permitir continuar
    if (numeroDocError || nombreError || apellidoError || emailError || telefonoError || bodegasError || rolError) {
      toast.error('Por favor corrige los errores en el formulario');
      return false;
    }

    return true;
  };

  const confirmCreate = () => {
    if (!validateForm()) return;

    const newUsuario: Usuario = {
      id: Math.max(...usuarios.map((u) => u.id), 0) + 1,
      tipoDocumento: formTipoDoc,
      numeroDocumento: formNumeroDoc.trim(),
      nombre: formNombre.trim(),
      apellido: formApellido.trim(),
      email: formEmail.trim(),
      telefono: formTelefono.trim(),
      bodegas: formBodegas,
      rol: formRol,
      estado: true,
    };

    setUsuarios([...usuarios, newUsuario]);

    closeToList();
    setShowSuccessModal(true);
  };

  const confirmEdit = () => {
    if (!usuarioSeleccionado || !validateForm()) return;

    const isSelf = !!loggedUserId && usuarioSeleccionado.id === loggedUserId;

    setUsuarios(
      usuarios.map((u) =>
        u.id === usuarioSeleccionado.id
          ? {
            ...u,
            tipoDocumento: formTipoDoc,
            numeroDocumento: formNumeroDoc.trim(),
            nombre: formNombre.trim(),
            apellido: formApellido.trim(),
            email: formEmail.trim(),
            telefono: formTelefono.trim(),
            bodegas: formBodegas,
            // ✅ si es tu propio usuario, NO permitimos cambiar rol
            rol: isSelf ? u.rol : formRol,
          }
          : u
      )
    );

    if (isSelf && formRol !== usuarioSeleccionado.rol) {
      toast.warning("No puedes cambiar tu propio rol mientras estás logueado");
    } else {
      toast.success("Usuario actualizado exitosamente");
    }

    closeToList();
  };

  const confirmDelete = () => {
    if (!usuarioSeleccionado) return;

    if (loggedUserId && usuarioSeleccionado.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      closeToList();
      return;
    }

    setUsuarios(usuarios.filter((u) => u.id !== usuarioSeleccionado.id));

    toast.success("Usuario eliminado exitosamente");
    closeToList();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const toggleEstado = (u: Usuario) => {
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes inhabilitar tu propio usuario");
      return;
    }
    setUsuarioParaCambioEstado(u);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (!usuarioParaCambioEstado) return;

    if (loggedUserId && usuarioParaCambioEstado.id === loggedUserId) {
      toast.error("No puedes inhabilitar tu propio usuario");
      setShowConfirmEstadoModal(false);
      setUsuarioParaCambioEstado(null);
      return;
    }

    setUsuarios(
      usuarios.map((u) =>
        u.id === usuarioParaCambioEstado.id ? { ...u, estado: !u.estado } : u
      )
    );

    toast.success(
      `Usuario ${!usuarioParaCambioEstado.estado ? "activado" : "desactivado"} exitosamente`
    );

    setShowConfirmEstadoModal(false);
    setUsuarioParaCambioEstado(null);
  };

  const toggleBodega = (bodega: string) => {
    const newBodegas = formBodegas.includes(bodega)
      ? formBodegas.filter((b) => b !== bodega)
      : [...formBodegas, bodega];

    setFormBodegas(newBodegas);

    // Validar en tiempo real si ya se tocó el campo
    if (touched.bodegas) {
      setErrors({ ...errors, bodegas: validateBodegasField(newBodegas) });
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Vendedor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Auxiliar Administrativo':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Auxiliar de Bodega':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Conductor':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Table */}
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
                          disabled={isSelfRow}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResetDialog(usuario)}
                            className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Enviar link de contraseña"
                          >
                            <Mail size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(usuario)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(usuario)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>

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

      {/* Modal Ver Detalles */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl"
          aria-describedby="view-usuario-description"
          onInteractOutside={(e) => e.preventDefault()} // ✅ NO cerrar al click por fuera
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              Detalles del Usuario
            </DialogTitle>
            <DialogDescription id="view-usuario-description">
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>

          {usuarioSeleccionado && (
            <div className="space-y-6">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                    </h3>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-white">
                        {usuarioSeleccionado.tipoDocumento}:{" "}
                        {usuarioSeleccionado.numeroDocumento}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={getRolBadgeColor(usuarioSeleccionado.rol)}
                      >
                        {usuarioSeleccionado.rol}
                      </Badge>

                      <Badge
                        className={
                          usuarioSeleccionado.estado
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {usuarioSeleccionado.estado ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Información de Contacto
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Label className="text-xs text-gray-500 mb-1">Email</Label>
                    <p className="font-medium text-gray-900">
                      {usuarioSeleccionado.email}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Label className="text-xs text-gray-500 mb-1">Teléfono</Label>
                    <p className="font-medium text-gray-900">
                      {usuarioSeleccionado.telefono}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Asignación */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Asignación de Bodega
                </h4>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <Label className="text-xs text-gray-500 mb-1">
                    Bodegas Asignadas
                  </Label>
                  <p className="font-medium text-gray-900">
                    {usuarioSeleccionado.bodegas.join(", ")}
                  </p>
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

      {/* Modal Crear Usuario */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-usuario-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription id="create-usuario-description">
              Completa la información del nuevo usuario del sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={setFormTipoDoc}>
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                <Input
                  id="create-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  onBlur={handleNumeroDocBlur}
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
                <Label htmlFor="create-nombre">Nombre *</Label>
                <Input
                  id="create-nombre"
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
                <Label htmlFor="create-apellido">Apellido *</Label>
                <Input
                  id="create-apellido"
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
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
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
                <Label htmlFor="create-telefono">Teléfono *</Label>
                <Input
                  maxLength={10}
                  id="create-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  onBlur={handleTelefonoBlur}
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
                <Label htmlFor="create-bodega">Bodegas Asignadas *</Label>
                <div className="space-y-2 mt-2 border border-gray-200 rounded-md p-3">
                  {bodegasDisponibles.map((bodega) => (
                    <div key={bodega} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-bodega-${bodega}`}
                        checked={formBodegas.includes(bodega)}
                        onCheckedChange={() => toggleBodega(bodega)}
                      />
                      <label
                        htmlFor={`create-bodega-${bodega}`}
                        className="text-sm cursor-pointer"
                      >
                        {bodega}
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
                <Select value={formRol} onValueChange={handleRolChange} onBlur={handleRolBlur}>
                  <SelectTrigger id="create-rol">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesDisponibles.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
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

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Usuario
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
              <div>
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={setFormTipoDoc}>
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  onBlur={handleNumeroDocBlur}
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
                  {bodegasDisponibles.map((bodega) => (
                    <div key={bodega} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-bodega-${bodega}`}
                        checked={formBodegas.includes(bodega)}
                        onCheckedChange={() => toggleBodega(bodega)}
                      />
                      <label
                        htmlFor={`edit-bodega-${bodega}`}
                        className="text-sm cursor-pointer"
                      >
                        {bodega}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.bodegas && touched.bodegas && (
                  <p className="text-red-500 text-sm mt-1">{errors.bodegas}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-rol">Rol *</Label>

                <Select
                  value={formRol}
                  onValueChange={handleRolChange}
                  onBlur={handleRolBlur}
                  disabled={isSelfEdit}
                >
                  <SelectTrigger id="edit-rol" className={isSelfEdit ? "opacity-60 cursor-not-allowed" : ""}>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>

                  <SelectContent>
                    {rolesDisponibles.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isSelfEdit && (
                  <p className="text-xs text-amber-700 mt-1">
                    No puedes cambiar tu propio rol mientras estás logueado.
                  </p>
                )}

                {errors.rol && touched.rol && !isSelfEdit && (
                  <p className="text-red-500 text-sm mt-1">{errors.rol}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button onClick={confirmEdit} className="bg-orange-600 hover:bg-orange-700">
              Guardar Cambios
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
        <DialogContent aria-describedby="delete-usuario-description">
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
              disabled={!!loggedUserId && usuarioSeleccionado?.id === loggedUserId}
              title={
                !!loggedUserId && usuarioSeleccionado?.id === loggedUserId
                  ? "No puedes eliminar tu propio usuario"
                  : "Eliminar"
              }
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent className="max-w-lg" aria-describedby="confirm-estado-description">
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
            <Button variant="outline" onClick={() => setShowConfirmEstadoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado} className="bg-blue-600 hover:bg-blue-700">
              Confirmar
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
    </div >
  );
}