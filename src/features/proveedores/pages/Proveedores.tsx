import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { AppOutletContext } from "@/layouts/MainLayout";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Truck,
  Mail,
  MapPin,
  User,
  FileText,
  Phone,
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
import { proveedoresData as initialProveedoresData, Proveedor } from "../../../data/proveedores";

// Categorías disponibles en el sistema
const CATEGORIAS_PROVEEDOR = [
  "Medicamentos",
  "Equipos Médicos",
  "Material de Curación",
  "Alimentos",
  "Suplementos",
  "Insumos Veterinarios",
  "Otros",
] as const;

// Países disponibles
const PAISES = [
  "Colombia",
  "Argentina",
  "Brasil",
  "Chile",
  "Ecuador",
  "México",
  "Perú",
  "Venezuela",
  "Estados Unidos",
  "España",
  "Otro",
] as const;

// Ciudades principales de Colombia
const CIUDADES_COLOMBIA = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Pasto",
  "Manizales",
  "Neiva",
  "Villavicencio",
  "Armenia",
  "Valledupar",
  "Montería",
  "Popayán",
  "Sincelejo",
  "Tunja",
  "Otra",
] as const;

export default function Proveedores() {
  
  // ✅ estados base
  
  const [searchTerm, setSearchTerm] = useState("");
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedoresData);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [proveedorParaCambioEstado, setProveedorParaCambioEstado] = useState<Proveedor | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  
  // ✅ router + bodega + flags URL (igual que Usuarios)
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const { selectedBodegaNombre } = useOutletContext<AppOutletContext>();
  const selectedBodega = selectedBodegaNombre;

  const isCrear = location.pathname.endsWith("/proveedores/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = () => navigate("/app/proveedores");

  
  // ✅ proveedor seleccionado por URL (:id)
  
  const proveedorSeleccionado = useMemo(() => {
    if (!params.id) return null;
    return proveedores.find((p) => p.id === params.id) ?? null;
  }, [proveedores, params.id]);

  // ✅ Si entran a /ver, /editar o /eliminar con id inválido → volver
  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!proveedorSeleccionado) {
      closeToList();
      return;
    }
  }, [isVer, isEditar, isEliminar, proveedorSeleccionado, closeToList]);

  
  // ✅ Form states
  
  const [formTipoDoc, setFormTipoDoc] = useState("NIT");
  const [formNumeroDoc, setFormNumeroDoc] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formCiudad, setFormCiudad] = useState("");
  const [formPais, setFormPais] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formContacto, setFormContacto] = useState("");
  const [formNotas, setFormNotas] = useState("");

  const [errors, setErrors] = useState({
    tipoDoc: "",
    numeroDoc: "",
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    pais: "",
    categoria: "",
    contacto: "",
    notas: "",
  });

  const [touched, setTouched] = useState({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    email: false,
    telefono: false,
    direccion: false,
    ciudad: false,
    pais: false,
    categoria: false,
    contacto: false,
    notas: false,
  });

  
  // ✅ Validaciones (DEBEN IR ANTES de usarse en handlers)
  
  const validateTipoDoc = (value: string) => {
    if (!value) return "El tipo de documento es requerido";
    return "";
  };

  const validateNumeroDoc = (value: string) => {
    if (!value.trim()) return "El número de documento es requerido";
    const validPattern = /^[0-9-]+$/;
    if (!validPattern.test(value)) return "Solo se permiten números y guiones";
    if (value.length < 6) return "Mínimo 6 caracteres";
    if (value.length > 20) return "Máximo 20 caracteres";
    return "";
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) return "El nombre del proveedor es requerido";
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.\-&]+$/;
    if (!validPattern.test(value)) {
      return "Solo se permiten letras, números, espacios, puntos, guiones y &";
    }
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 100) return "Máximo 100 caracteres";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "El email es requerido";
    if (!value.includes("@")) return "El email debe contener un @";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Formato de email inválido";
    return "";
  };

  const validateTelefono = (value: string) => {
    if (!value.trim()) return "El teléfono es requerido";
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) return "Debe tener exactamente 10 números";
    return "";
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

  const validateCiudad = (value: string) => {
    if (!value || value === "") return "La ciudad es requerida";
    return "";
  };

  const validatePais = (value: string) => {
    if (!value.trim()) return "El país es requerido";
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) return "Solo se permiten letras y espacios";
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 50) return "Máximo 50 caracteres";
    return "";
  };

  const validateCategoria = (value: string) => {
    if (!value.trim()) return "La categoría es requerida";
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
    if (!validPattern.test(value)) return "Solo se permiten letras, números y espacios";
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 50) return "Máximo 50 caracteres";
    return "";
  };

  const validateContacto = (value: string) => {
    if (!value.trim()) return "El nombre del contacto es requerido";
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) return "Solo se permiten letras y espacios";
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 100) return "Máximo 100 caracteres";
    return "";
  };

  const validateNotas = (value: string) => {
    if (!value.trim()) return ""; // opcional
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-¿?¡!]+$/;
    if (!validPattern.test(value)) {
      return "Solo se permiten letras, números, espacios y puntuación básica";
    }
    if (value.trim().length > 500) return "Máximo 500 caracteres";
    return "";
  };

  
  // ✅ Handlers con validación en tiempo real (Inputs)
  
  const handleNumeroDocChange = (value: string) => {
    setFormNumeroDoc(value);
    if (touched.numeroDoc) setErrors({ ...errors, numeroDoc: validateNumeroDoc(value) });
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) setErrors({ ...errors, nombre: validateNombre(value) });
  };

  const handleEmailChange = (value: string) => {
    setFormEmail(value);
    if (touched.email) setErrors({ ...errors, email: validateEmail(value) });
  };

  const handleTelefonoChange = (value: string) => {
    setFormTelefono(value);
    if (touched.telefono) setErrors({ ...errors, telefono: validateTelefono(value) });
  };

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);
    if (touched.direccion) setErrors({ ...errors, direccion: validateDireccion(value) });
  };

  const handleContactoChange = (value: string) => {
    setFormContacto(value);
    if (touched.contacto) setErrors({ ...errors, contacto: validateContacto(value) });
  };

  const handleNotasChange = (value: string) => {
    setFormNotas(value);
    if (touched.notas) setErrors({ ...errors, notas: validateNotas(value) });
  };

  const handleTipoDocChange = (value: string) => {
    setFormTipoDoc(value);
    setTouched((t) => ({ ...t, tipoDoc: true }));
    setErrors((e) => ({ ...e, tipoDoc: validateTipoDoc(value) }));
  };

  const handleCiudadChange = (value: string) => {
    setFormCiudad(value);
    setTouched((t) => ({ ...t, ciudad: true }));
    setErrors((e) => ({ ...e, ciudad: validateCiudad(value) }));
  };

  const handlePaisChange = (value: string) => {
    setFormPais(value);
    setTouched((t) => ({ ...t, pais: true }));
    setErrors((e) => ({ ...e, pais: validatePais(value) }));
  };

  const handleCategoriaChange = (value: string) => {
    setFormCategoria(value);
    setTouched((t) => ({ ...t, categoria: true }));
    setErrors((e) => ({ ...e, categoria: validateCategoria(value) }));
  };

  
  // ✅ Handlers onBlur (Inputs)
  
  const handleNumeroDocBlur = () => {
    setTouched({ ...touched, numeroDoc: true });
    setErrors({ ...errors, numeroDoc: validateNumeroDoc(formNumeroDoc) });
  };

  const handleNombreBlur = () => {
    setTouched({ ...touched, nombre: true });
    setErrors({ ...errors, nombre: validateNombre(formNombre) });
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setErrors({ ...errors, email: validateEmail(formEmail) });
  };

  const handleTelefonoBlur = () => {
    setTouched({ ...touched, telefono: true });
    setErrors({ ...errors, telefono: validateTelefono(formTelefono) });
  };

  const handleDireccionBlur = () => {
    setTouched({ ...touched, direccion: true });
    setErrors({ ...errors, direccion: validateDireccion(formDireccion) });
  };

  const handleContactoBlur = () => {
    setTouched({ ...touched, contacto: true });
    setErrors({ ...errors, contacto: validateContacto(formContacto) });
  };

  const handleNotasBlur = () => {
    setTouched({ ...touched, notas: true });
    setErrors({ ...errors, notas: validateNotas(formNotas) });
  };

  // ✅ Al entrar a /editar, precargar el formulario
  useEffect(() => {
    if (!isEditar) return;
    if (!proveedorSeleccionado) return;

    setFormTipoDoc(proveedorSeleccionado.tipoDocumento);
    setFormNumeroDoc(proveedorSeleccionado.numeroDocumento);
    setFormNombre(proveedorSeleccionado.nombre);
    setFormEmail(proveedorSeleccionado.email);
    setFormTelefono(proveedorSeleccionado.telefono);
    setFormDireccion(proveedorSeleccionado.direccion);
    setFormCiudad(proveedorSeleccionado.ciudad);
    setFormPais(proveedorSeleccionado.pais);
    setFormCategoria(proveedorSeleccionado.categoria);
    setFormContacto(proveedorSeleccionado.contacto);
    setFormNotas(proveedorSeleccionado.notas || "");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      ciudad: "",
      pais: "",
      categoria: "",
      contacto: "",
      notas: "",
    });
    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      ciudad: false,
      pais: false,
      categoria: false,
      contacto: false,
      notas: false,
    });
  }, [isEditar, proveedorSeleccionado]);

  // Al entrar a /crear, limpiar el form
  useEffect(() => {
    if (!isCrear) return;

    setFormTipoDoc("NIT");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormEmail("");
    setFormTelefono("");
    setFormDireccion("");
    setFormCiudad("");
    setFormPais("");
    setFormCategoria("");
    setFormContacto("");
    setFormNotas("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      ciudad: "",
      pais: "",
      categoria: "",
      contacto: "",
      notas: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      ciudad: false,
      pais: false,
      categoria: false,
      contacto: false,
      notas: false,
    });
  }, [isCrear]);

  // Filtrado por bodega + búsqueda
  const filteredProveedores = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return proveedores.filter((p) => {
      return (
        p.id.toLowerCase().includes(s) ||
        p.nombre.toLowerCase().includes(s) ||
        p.tipoDocumento.toLowerCase().includes(s) ||
        p.numeroDocumento.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.telefono.toLowerCase().includes(s) ||
        p.categoria.toLowerCase().includes(s) ||
        p.estado.toLowerCase().includes(s)
      );
    });
  }, [proveedores, searchTerm]);

  // Resetear a página 1 cuando cambia filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProveedores = filteredProveedores.slice(startIndex, endIndex);

  // Confirmación cambio de estado
  const handleToggleEstado = (p: Proveedor) => {
    setProveedorParaCambioEstado(p);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (!proveedorParaCambioEstado) return;

    const nuevoEstado =
      proveedorParaCambioEstado.estado === "Activo" ? "Inactivo" : "Activo";

    setProveedores(
      proveedores.map((p) =>
        p.id === proveedorParaCambioEstado.id ? { ...p, estado: nuevoEstado } : p
      )
    );

    toast.success(
      `Proveedor ${nuevoEstado === "Activo" ? "activado" : "desactivado"
      } exitosamente`
    );

    setShowConfirmEstadoModal(false);
    setProveedorParaCambioEstado(null);
  };

  // Navegación (modales por URL)
  const handleView = (p: Proveedor) => {
    navigate(`/app/proveedores/${p.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/proveedores/crear");
  };

  const handleEdit = (p: Proveedor) => {
    navigate(`/app/proveedores/${p.id}/editar`);
  };

  const handleDelete = (p: Proveedor) => {
    navigate(`/app/proveedores/${p.id}/eliminar`);
  };

  // Validación general del formulario
  const validateForm = () => {
    setTouched({
      tipoDoc: true,
      numeroDoc: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      ciudad: true,
      pais: true,
      categoria: true,
      contacto: true,
      notas: true,
    });

    const tipoDocError = validateTipoDoc(formTipoDoc);
    const numeroDocError = validateNumeroDoc(formNumeroDoc);
    const nombreError = validateNombre(formNombre);
    const emailError = validateEmail(formEmail);
    const telefonoError = validateTelefono(formTelefono);
    const direccionError = validateDireccion(formDireccion);
    const ciudadError = validateCiudad(formCiudad);
    const paisError = validatePais(formPais);
    const categoriaError = validateCategoria(formCategoria);
    const contactoError = validateContacto(formContacto);
    const notasError = validateNotas(formNotas);

    setErrors({
      tipoDoc: tipoDocError,
      numeroDoc: numeroDocError,
      nombre: nombreError,
      email: emailError,
      telefono: telefonoError,
      direccion: direccionError,
      ciudad: ciudadError,
      pais: paisError,
      categoria: categoriaError,
      contacto: contactoError,
      notas: notasError,
    });

    if (
      tipoDocError ||
      numeroDocError ||
      nombreError ||
      emailError ||
      telefonoError ||
      direccionError ||
      ciudadError ||
      paisError ||
      categoriaError ||
      contactoError ||
      notasError
    ) {
      toast.error("Por favor corrige los errores en el formulario");
      return false;
    }

    return true;
  };

  // Generar ID consecutivo robusto
  const getNextProveedorId = () => {
    const maxNum = proveedores.reduce((max, p) => {
      const match = /^PROV-(\d+)$/.exec(p.id);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `PROV-${String(maxNum + 1).padStart(3, "0")}`;
  };

  // Crear proveedor
  const confirmCreate = () => {
    if (!validateForm()) return;

    const newProveedor: Proveedor = {
      id: getNextProveedorId(),
      tipoDocumento: formTipoDoc,
      numeroDocumento: formNumeroDoc.trim(),
      nombre: formNombre.trim(),
      email: formEmail.trim(),
      telefono: formTelefono.trim(),
      direccion: formDireccion.trim(),
      ciudad: formCiudad.trim(),
      departamento: "",
      pais: formPais.trim(),
      categoria: formCategoria.trim(),
      contacto: formContacto.trim(),
      notas: formNotas.trim(),
      estado: "Activo",
      fechaRegistro: new Date().toISOString().split("T")[0],
      bodega: selectedBodega,
    };

    setProveedores([...proveedores, newProveedor]);
    closeToList();
    setShowSuccessModal(true);
  };

  // Editar proveedor
  const confirmEdit = () => {
    if (!proveedorSeleccionado || !validateForm()) return;

    setProveedores(
      proveedores.map((p) =>
        p.id === proveedorSeleccionado.id
          ? {
            ...p,
            tipoDocumento: formTipoDoc,
            numeroDocumento: formNumeroDoc.trim(),
            nombre: formNombre.trim(),
            email: formEmail.trim(),
            telefono: formTelefono.trim(),
            direccion: formDireccion.trim(),
            ciudad: formCiudad.trim(),
            pais: formPais.trim(),
            categoria: formCategoria.trim(),
            contacto: formContacto.trim(),
            notas: formNotas.trim(),
          }
          : p
      )
    );

    toast.success("Proveedor actualizado exitosamente");
    closeToList();
  };

  // Eliminar proveedor
  const confirmDelete = () => {
    if (!proveedorSeleccionado) return;

    setProveedores(
      proveedores.filter((p) => p.id !== proveedorSeleccionado.id)
    );

    toast.success("Proveedor eliminado exitosamente");
    closeToList();
  };

  // Paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Proveedores</h2>
        <p className="text-gray-600 mt-1">Administra la información de tus proveedores</p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por nombre, documento, email, categoría o estado (Activo/Inactivo)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Proveedor
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
                <TableHead>Tipo Doc.</TableHead>
                <TableHead>N° Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentProveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No se encontraron proveedores
                  </TableCell>
                </TableRow>
              ) : (
                currentProveedores.map((proveedor, index) => (
                  <TableRow key={proveedor.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {proveedor.nombre}
                    </TableCell>

                    <TableCell>{proveedor.tipoDocumento}</TableCell>

                    <TableCell className="font-mono text-sm">
                      {proveedor.numeroDocumento}
                    </TableCell>

                    <TableCell className="text-gray-700">{proveedor.email}</TableCell>
                    <TableCell className="text-gray-700">{proveedor.telefono}</TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {proveedor.categoria}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(proveedor)}
                        className={`h-7 ${proveedor.estado === "Activo"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                      >
                        {proveedor.estado}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(proveedor)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(proveedor)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(proveedor)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
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
        {filteredProveedores.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProveedores.length)} de{" "}
              {filteredProveedores.length} proveedores
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
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="view-proveedor-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Detalles del Proveedor
            </DialogTitle>
            <DialogDescription id="view-proveedor-description">
              Información completa del proveedor
            </DialogDescription>
          </DialogHeader>

          {proveedorSeleccionado && (
            <div className="space-y-4">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {proveedorSeleccionado.nombre}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-white text-xs">
                    {proveedorSeleccionado.tipoDocumento}:{" "}
                    {proveedorSeleccionado.numeroDocumento}
                  </Badge>

                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                    {proveedorSeleccionado.categoria}
                  </Badge>

                  <Badge
                    className={
                      proveedorSeleccionado.estado === "Activo"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs"
                        : "bg-red-100 text-red-800 hover:bg-red-100 text-xs"
                    }
                  >
                    {proveedorSeleccionado.estado}
                  </Badge>
                </div>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Email</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.email}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.telefono}
                  </p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Contacto Principal</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.contacto}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Ciudad</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.ciudad}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Departamento</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.departamento || "N/A"}
                  </p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Dirección</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {proveedorSeleccionado.direccion}
                  </p>
                </div>
              </div>

              {/* Notas */}
              {proveedorSeleccionado.notas && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <Label className="text-xs text-gray-600">Notas</Label>
                  </div>
                  <p className="text-sm text-gray-700">
                    {proveedorSeleccionado.notas}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Proveedor */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-proveedor-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription id="create-proveedor-description">
              Completa la información del nuevo proveedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
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
                  placeholder="Ej: 900123456-7"
                  className={errors.numeroDoc && touched.numeroDoc ? "border-red-500" : ""}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-sm mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="create-nombre">Nombre o Razón Social *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Distribuciones Médicas S.A.S."
                className={errors.nombre && touched.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
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
                <Label htmlFor="create-ciudad">Ciudad *</Label>
                <Select value={formCiudad} onValueChange={handleCiudadChange}>
                  <SelectTrigger id="create-ciudad">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ciudad && touched.ciudad && (
                  <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-pais">País *</Label>
                <Select value={formPais} onValueChange={handlePaisChange}>
                  <SelectTrigger id="create-pais">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pais && touched.pais && (
                  <p className="text-red-500 text-sm mt-1">{errors.pais}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-categoria">Categoría *</Label>
                <Select value={formCategoria} onValueChange={handleCategoriaChange}>
                  <SelectTrigger id="create-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && touched.categoria && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-contacto">Contacto Principal *</Label>
                <Input
                  id="create-contacto"
                  value={formContacto}
                  onChange={(e) => handleContactoChange(e.target.value)}
                  onBlur={handleContactoBlur}
                  placeholder="Nombre del contacto principal"
                  className={errors.contacto && touched.contacto ? "border-red-500" : ""}
                />
                {errors.contacto && touched.contacto && (
                  <p className="text-red-500 text-sm mt-1">{errors.contacto}</p>
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
                placeholder="Ej: Calle 123 # 45-67"
                className={errors.direccion && touched.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            <div>
              <Label htmlFor="create-notas">Notas (opcional)</Label>
              <Textarea
                id="create-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                onBlur={handleNotasBlur}
                placeholder="Información adicional sobre el proveedor"
                rows={3}
                className={errors.notas && touched.notas ? "border-red-500" : ""}
              />
              {errors.notas && touched.notas && (
                <p className="text-red-500 text-sm mt-1">{errors.notas}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Proveedor */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-proveedor-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription id="edit-proveedor-description">
              Modifica la información del proveedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoDoc}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  onBlur={handleNumeroDocBlur}
                  placeholder="Ej: 900123456-7"
                  className={errors.numeroDoc && touched.numeroDoc ? "border-red-500" : ""}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-sm mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-nombre">Nombre o Razón Social *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Distribuciones Médicas S.A.S."
                className={errors.nombre && touched.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
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
                <Label htmlFor="edit-ciudad">Ciudad *</Label>
                <Select value={formCiudad} onValueChange={handleCiudadChange}>
                  <SelectTrigger id="edit-ciudad">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ciudad && touched.ciudad && (
                  <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-pais">País *</Label>
                <Select value={formPais} onValueChange={handlePaisChange}>
                  <SelectTrigger id="edit-pais">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pais && touched.pais && (
                  <p className="text-red-500 text-sm mt-1">{errors.pais}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-categoria">Categoría *</Label>
                <Select value={formCategoria} onValueChange={handleCategoriaChange}>
                  <SelectTrigger id="edit-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && touched.categoria && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoria}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-contacto">Contacto Principal *</Label>
                <Input
                  id="edit-contacto"
                  value={formContacto}
                  onChange={(e) => handleContactoChange(e.target.value)}
                  onBlur={handleContactoBlur}
                  placeholder="Nombre del contacto principal"
                  className={errors.contacto && touched.contacto ? "border-red-500" : ""}
                />
                {errors.contacto && touched.contacto && (
                  <p className="text-red-500 text-sm mt-1">{errors.contacto}</p>
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
                placeholder="Ej: Calle 123 # 45-67"
                className={errors.direccion && touched.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-notas">Notas (opcional)</Label>
              <Textarea
                id="edit-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                onBlur={handleNotasBlur}
                placeholder="Información adicional sobre el proveedor"
                rows={3}
                className={errors.notas && touched.notas ? "border-red-500" : ""}
              />
              {errors.notas && touched.notas && (
                <p className="text-red-500 text-sm mt-1">{errors.notas}</p>
              )}
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

      {/* Modal Eliminar Proveedor */}
      <Dialog
        open={isEliminar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          aria-describedby="delete-proveedor-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription id="delete-proveedor-description">
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {proveedorSeleccionado && (
            <div className="py-4">
              <p className="text-gray-700">
                Proveedor:{" "}
                <span className="font-semibold">{proveedorSeleccionado.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {proveedorSeleccionado.tipoDocumento}:{" "}
                {proveedorSeleccionado.numeroDocumento}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
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
              ¿Estás seguro de que deseas cambiar el estado de este proveedor?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Proveedor:</span>
              <span className="font-medium">
                {proveedorParaCambioEstado?.nombre}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span
                className={`font-medium ${proveedorParaCambioEstado?.estado === "Activo"
                  ? "text-green-700"
                  : "text-red-700"
                  }`}
              >
                {proveedorParaCambioEstado?.estado}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span
                className={`font-medium ${proveedorParaCambioEstado?.estado === "Inactivo"
                  ? "text-green-700"
                  : "text-red-700"
                  }`}
              >
                {proveedorParaCambioEstado?.estado === "Activo"
                  ? "Inactivo"
                  : "Activo"}
              </span>
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

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="max-w-lg"
          aria-describedby="success-proveedor-description"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription
              id="success-proveedor-description"
              className="sr-only"
            >
              El proveedor se ha registrado correctamente
            </DialogDescription>

            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <DialogTitle className="text-center">
              ¡Registro Exitoso!
            </DialogTitle>

            <DialogDescription className="text-center">
              El proveedor ha sido creado correctamente en el sistema
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