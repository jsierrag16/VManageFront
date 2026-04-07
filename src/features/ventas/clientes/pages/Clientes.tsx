import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Mail,
  MapPin,
  User,
  Phone,
  Filter,
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
import { toast } from "sonner";
import { clientesService } from "../services/clientes.service";
import {
  mapClienteApiToUi,
  mapFormToClientePayload,
  mapTiposCliente,
  mapTiposDocumento,
  mapMunicipios,
} from "../services/clientes.mapper";
import type {
  ClienteUI,
  TipoClienteOption,
  TipoDocumentoOption,
  MunicipioOption,
} from "../types/clientes.types";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
import type { AppOutletContext } from "../../../../layouts/MainLayout";

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  useOutletContext<AppOutletContext>();

  const isCrear = location.pathname.endsWith("/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = useCallback(() => navigate("/app/clientes"), [navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [clientes, setClientes] = useState<ClienteUI[]>([]);
  const [loading, setLoading] = useState(false);

  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoOption[]>(
    []
  );
  const [tiposCliente, setTiposCliente] = useState<TipoClienteOption[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [clienteParaCambioEstado, setClienteParaCambioEstado] =
    useState<ClienteUI | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // -------------------------
  // Form states
  // -------------------------
  const [formTipoDocId, setFormTipoDocId] = useState("");
  const [formNumeroDoc, setFormNumeroDoc] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formMunicipioId, setFormMunicipioId] = useState("");
  const [formTipoClienteId, setFormTipoClienteId] = useState("");

  // -------------------------
  // Helpers de ubicación
  // -------------------------
  const municipioSeleccionado = useMemo(() => {
    return municipios.find((m) => String(m.id) === formMunicipioId) || null;
  }, [municipios, formMunicipioId]);

  const ciudadSeleccionada = municipioSeleccionado?.nombre ?? "";
  const departamentoSeleccionado = municipioSeleccionado?.departamento ?? "";

  // -------------------------
  // Cliente seleccionado por URL
  // -------------------------
  const clienteSeleccionado = useMemo(() => {
    if (!params.id) return null;
    const numericId = Number(params.id);
    if (Number.isNaN(numericId)) return null;
    return clientes.find((c) => c.id === numericId) ?? null;
  }, [clientes, params.id]);

  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) return;

    if (!clienteSeleccionado) {
      closeToList();
    }
  }, [isVer, isEditar, isEliminar, clienteSeleccionado, closeToList]);

  // -------------------------
  // Validaciones
  // -------------------------
  const [errors, setErrors] = useState({
    tipoDoc: "",
    numeroDoc: "",
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    municipio: "",
    tipoCliente: "",
  });

  const [touched, setTouched] = useState({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    email: false,
    telefono: false,
    direccion: false,
    municipio: false,
    tipoCliente: false,
  });

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
    if (!value.trim()) return "El nombre del cliente es requerido";
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) return "Solo se permiten letras y espacios";
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
    const soloNumeros = value.replace(/\D/g, "");
    if (!/^[0-9]{10}$/.test(soloNumeros)) {
      return "Debe tener exactamente 10 números";
    }
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

  const validateMunicipio = (value: string) => {
    if (!value) return "La ciudad / municipio es requerida";
    return "";
  };

  const validateTipoCliente = (value: string) => {
    if (!value) return "El tipo de cliente es requerido";
    return "";
  };

  // -------------------------
  // Handlers
  // -------------------------
  const handleTipoDocChange = (value: string) => {
    setFormTipoDocId(value);
    if (touched.tipoDoc) {
      setErrors((prev) => ({ ...prev, tipoDoc: validateTipoDoc(value) }));
    }
  };

  const handleNumeroDocChange = (value: string) => {
    setFormNumeroDoc(value);
    if (touched.numeroDoc) {
      setErrors((prev) => ({ ...prev, numeroDoc: validateNumeroDoc(value) }));
    }
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors((prev) => ({ ...prev, nombre: validateNombre(value) }));
    }
  };

  const handleEmailChange = (value: string) => {
    setFormEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleTelefonoChange = (value: string) => {
    const limpio = value.replace(/\D/g, "").slice(0, 10);
    setFormTelefono(limpio);
    if (touched.telefono) {
      setErrors((prev) => ({ ...prev, telefono: validateTelefono(limpio) }));
    }
  };

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);
    if (touched.direccion) {
      setErrors((prev) => ({ ...prev, direccion: validateDireccion(value) }));
    }
  };

  const handleMunicipioChange = (value: string) => {
    setFormMunicipioId(value);
    if (touched.municipio) {
      setErrors((prev) => ({ ...prev, municipio: validateMunicipio(value) }));
    }
  };

  const handleTipoClienteChange = (value: string) => {
    setFormTipoClienteId(value);
    if (touched.tipoCliente) {
      setErrors((prev) => ({ ...prev, tipoCliente: validateTipoCliente(value) }));
    }
  };

  const handleNumeroDocBlur = () => {
    setTouched((prev) => ({ ...prev, numeroDoc: true }));
    setErrors((prev) => ({
      ...prev,
      numeroDoc: validateNumeroDoc(formNumeroDoc),
    }));
  };

  const handleNombreBlur = () => {
    setTouched((prev) => ({ ...prev, nombre: true }));
    setErrors((prev) => ({ ...prev, nombre: validateNombre(formNombre) }));
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmail(formEmail) }));
  };

  const handleTelefonoBlur = () => {
    setTouched((prev) => ({ ...prev, telefono: true }));
    setErrors((prev) => ({ ...prev, telefono: validateTelefono(formTelefono) }));
  };

  const handleDireccionBlur = () => {
    setTouched((prev) => ({ ...prev, direccion: true }));
    setErrors((prev) => ({ ...prev, direccion: validateDireccion(formDireccion) }));
  };

  // -------------------------
  // Carga de datos
  // -------------------------
  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);

      const data = await clientesService.getAll({
        q: searchTerm || undefined,
        incluirInactivos: true,
      });

      setClientes(data.map(mapClienteApiToUi));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadMeta = useCallback(async () => {
    try {
      const meta = await clientesService.getMeta();

      setTiposDocumento(mapTiposDocumento(meta.tiposDocumento || []));
      setTiposCliente(mapTiposCliente(meta.tiposCliente || []));
      setMunicipios(mapMunicipios(meta.municipios || []));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los catálogos");
    }
  }, []);

  useEffect(() => {
    loadMeta();
    loadClientes();
  }, [loadMeta, loadClientes]);

  // -------------------------
  // Filtrar clientes
  // -------------------------
  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      if (estadoFilter === "todos") return true;
      return cliente.estado.toLowerCase() === estadoFilter;
    });
  }, [clientes, estadoFilter]);

  // -------------------------
  // Paginación
  // -------------------------
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  // -------------------------
  // Reset crear
  // -------------------------
  useEffect(() => {
    if (!isCrear) return;

    setFormTipoDocId("");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormEmail("");
    setFormTelefono("");
    setFormDireccion("");
    setFormMunicipioId("");
    setFormTipoClienteId("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      municipio: "",
      tipoCliente: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      municipio: false,
      tipoCliente: false,
    });
  }, [isCrear]);

  // -------------------------
  // Precarga editar
  // -------------------------
  useEffect(() => {
    if (!isEditar) return;
    if (!clienteSeleccionado) return;

    setFormTipoDocId(String(clienteSeleccionado.idTipoDocumento));
    setFormNumeroDoc(clienteSeleccionado.numeroDocumento);
    setFormNombre(clienteSeleccionado.nombre);
    setFormEmail(clienteSeleccionado.email);
    setFormTelefono(clienteSeleccionado.telefono);
    setFormDireccion(clienteSeleccionado.direccion);
    setFormMunicipioId(String(clienteSeleccionado.idMunicipio));
    setFormTipoClienteId(String(clienteSeleccionado.idTipoCliente));

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      municipio: "",
      tipoCliente: "",
    });

    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      municipio: false,
      tipoCliente: false,
    });
  }, [isEditar, clienteSeleccionado]);

  // -------------------------
  // Navegación
  // -------------------------
  const handleView = (cliente: ClienteUI) => {
    navigate(`/app/clientes/${cliente.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/clientes/crear");
  };

  const handleEdit = (cliente: ClienteUI) => {
    navigate(`/app/clientes/${cliente.id}/editar`);
  };

  const handleDelete = (cliente: ClienteUI) => {
    navigate(`/app/clientes/${cliente.id}/eliminar`);
  };

  const handleConfirmEstado = (cliente: ClienteUI) => {
    setClienteParaCambioEstado(cliente);
    setShowConfirmEstadoModal(true);
  };

  // -------------------------
  // Validación general
  // -------------------------
  const validateForm = () => {
    const nextErrors = {
      tipoDoc: validateTipoDoc(formTipoDocId),
      numeroDoc: validateNumeroDoc(formNumeroDoc),
      nombre: validateNombre(formNombre),
      email: validateEmail(formEmail),
      telefono: validateTelefono(formTelefono),
      direccion: validateDireccion(formDireccion),
      municipio: validateMunicipio(formMunicipioId),
      tipoCliente: validateTipoCliente(formTipoClienteId),
    };

    setErrors(nextErrors);
    setTouched({
      tipoDoc: true,
      numeroDoc: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      municipio: true,
      tipoCliente: true,
    });

    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      toast.error("Por favor corrige los campos obligatorios");
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(formNombre)) {
      toast.error("El nombre contiene caracteres no permitidos");
      return false;
    }

    return true;
  };

  // -------------------------
  // CRUD
  // -------------------------
  const confirmCreate = async () => {
    if (!validateForm()) return;

    try {
      const payload = mapFormToClientePayload({
        nombre: formNombre,
        email: formEmail,
        telefono: formTelefono,
        direccion: formDireccion,
        numeroDocumento: formNumeroDoc,
        idTipoCliente: Number(formTipoClienteId),
        idMunicipio: Number(formMunicipioId),
        idTipoDocumento: Number(formTipoDocId),
        estado: true,
      });

      await clientesService.create(payload);
      await loadClientes();

      closeToList();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        "No se pudo crear el cliente"
      );
    }
  };

  const confirmEdit = async () => {
    if (!clienteSeleccionado || !validateForm()) return;

    try {
      const payload = mapFormToClientePayload({
        nombre: formNombre,
        email: formEmail,
        telefono: formTelefono,
        direccion: formDireccion,
        numeroDocumento: formNumeroDoc,
        idTipoCliente: Number(formTipoClienteId),
        idMunicipio: Number(formMunicipioId),
        idTipoDocumento: Number(formTipoDocId),
        estado: clienteSeleccionado.estado === "Activo",
      });

      await clientesService.update(clienteSeleccionado.id, payload);
      await loadClientes();

      closeToList();
      toast.success("Cliente actualizado exitosamente");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        "No se pudo actualizar el cliente"
      );
    }
  };

  const confirmDelete = async () => {
    if (!clienteSeleccionado) return;

    try {
      await clientesService.remove(clienteSeleccionado.id);
      await loadClientes();

      closeToList();
      toast.success("Cliente inactivado exitosamente");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        "No se pudo eliminar el cliente"
      );
    }
  };

  const confirmEstado = async () => {
    if (!clienteParaCambioEstado) return;

    try {
      const nuevoEstado = clienteParaCambioEstado.estado !== "Activo";

      await clientesService.update(clienteParaCambioEstado.id, {
        estado: nuevoEstado,
      });

      await loadClientes();
      setShowConfirmEstadoModal(false);

      toast.success(
        `Estado del cliente cambiado a ${nuevoEstado ? "Activo" : "Inactivo"}`
      );
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
        "No se pudo cambiar el estado"
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Gestión de Clientes</h2>
        <p className="text-gray-600 mt-1">
          Administra la información de tus clientes
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por nombre, documento, email o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

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
        >
          <Plus size={18} className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo Doc.</TableHead>
                <TableHead>N° Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipo Cliente</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-gray-500"
                  >
                    Cargando clientes...
                  </TableCell>
                </TableRow>
              ) : currentClientes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-gray-500"
                  >
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                currentClientes.map((cliente, index) => (
                  <TableRow key={cliente.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {cliente.codigo}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {cliente.nombre}
                    </TableCell>
                    <TableCell>{cliente.tipoDocumento}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {cliente.numeroDocumento}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {cliente.email || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {cliente.telefono || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {cliente.tipoCliente}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmEstado(cliente)}
                        className={`h-7 ${cliente.estado === "Activo"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                      >
                        {cliente.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(cliente)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cliente)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Inactivar"
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
      </div>


      <div>
        {filteredClientes.length > 0 && !loading && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredClientes.length)} de{" "}
              {filteredClientes.length} clientes
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

      {/* Modal Ver */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="view-cliente-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Detalles del Cliente
            </DialogTitle>
            <DialogDescription id="view-cliente-description">
              Información completa del cliente
            </DialogDescription>
          </DialogHeader>

          {clienteSeleccionado && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {clienteSeleccionado.nombre}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-white text-xs">
                    {clienteSeleccionado.tipoDocumento}:{" "}
                    {clienteSeleccionado.numeroDocumento}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                    {clienteSeleccionado.tipoCliente}
                  </Badge>
                  <Badge
                    className={`text-xs hover:bg-current ${clienteSeleccionado.estado === "Activo"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {clienteSeleccionado.estado}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Email</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {clienteSeleccionado.email || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {clienteSeleccionado.telefono || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Ciudad</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {clienteSeleccionado.ciudad || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">
                      Departamento
                    </Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {clienteSeleccionado.departamento || "N/A"}
                  </p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Dirección</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {clienteSeleccionado.direccion || "N/A"}
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

      {/* Modal Crear */}
      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-cliente-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription id="create-cliente-description">
              Completa la información del nuevo cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select
                  value={formTipoDocId}
                  onValueChange={handleTipoDocChange}
                >
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoDoc}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                <Input
                  id="create-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 1234567890"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="create-nombre">Nombre Completo *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Juan Pérez García"
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
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
                  placeholder="correo@ejemplo.com"
                  onBlur={handleEmailBlur}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-tipo-cliente">Tipo de Cliente *</Label>
                <Select
                  value={formTipoClienteId}
                  onValueChange={handleTipoClienteChange}
                >
                  <SelectTrigger id="create-tipo-cliente">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCliente.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoCliente && touched.tipoCliente && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tipoCliente}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-telefono">Teléfono Principal *</Label>
                <Input
                  id="create-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="3001234567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-ciudad">Ciudad / Municipio *</Label>
                <Select
                  value={formMunicipioId}
                  onValueChange={handleMunicipioChange}
                >
                  <SelectTrigger id="create-ciudad">
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((municipio) => (
                      <SelectItem key={municipio.id} value={String(municipio.id)}>
                        {municipio.nombre} - {municipio.departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-xs mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departamento</Label>
                <Input value={departamentoSeleccionado} disabled />
              </div>

              <div>
                <Label>Ciudad</Label>
                <Input value={ciudadSeleccionada} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="create-direccion">Dirección *</Label>
              <Input
                id="create-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Carrera 43A # 12-34"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-cliente-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription id="edit-cliente-description">
              Modifica la información del cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select
                  value={formTipoDocId}
                  onValueChange={handleTipoDocChange}
                >
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoDoc}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 1234567890"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-nombre">Nombre Completo *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Juan Pérez García"
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
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
                  placeholder="correo@ejemplo.com"
                  onBlur={handleEmailBlur}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-tipo-cliente">Tipo de Cliente *</Label>
                <Select
                  value={formTipoClienteId}
                  onValueChange={handleTipoClienteChange}
                >
                  <SelectTrigger id="edit-tipo-cliente">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCliente.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoCliente && touched.tipoCliente && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tipoCliente}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-telefono">Teléfono Principal *</Label>
                <Input
                  id="edit-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="3001234567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-ciudad">Ciudad / Municipio *</Label>
                <Select
                  value={formMunicipioId}
                  onValueChange={handleMunicipioChange}
                >
                  <SelectTrigger id="edit-ciudad">
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((municipio) => (
                      <SelectItem key={municipio.id} value={String(municipio.id)}>
                        {municipio.nombre} - {municipio.departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-xs mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departamento</Label>
                <Input value={departamentoSeleccionado} disabled />
              </div>

              <div>
                <Label>Ciudad</Label>
                <Input value={ciudadSeleccionada} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Carrera 43A # 12-34"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Inactivar */}
      <Dialog
        open={isEliminar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent aria-describedby="delete-cliente-description">
          <DialogHeader>
            <DialogTitle>Inactivar Cliente</DialogTitle>
            <DialogDescription id="delete-cliente-description">
              ¿Estás seguro de que deseas inactivar este cliente?
            </DialogDescription>
          </DialogHeader>

          {clienteSeleccionado && (
            <div className="py-4">
              <p className="text-gray-700">
                Cliente:{" "}
                <span className="font-semibold">
                  {clienteSeleccionado.nombre}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {clienteSeleccionado.tipoDocumento}:{" "}
                {clienteSeleccionado.numeroDocumento}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Inactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="max-w-lg"
          aria-describedby="success-cliente-description"
        >
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">
              ¡Registro Exitoso!
            </DialogTitle>
            <DialogDescription
              id="success-cliente-description"
              className="text-center"
            >
              El cliente ha sido creado correctamente en el sistema
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

      {/* Modal Confirmar Estado */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Cliente</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este cliente?
            </DialogDescription>
          </DialogHeader>

          {clienteParaCambioEstado && (
            <div className="py-4">
              <p className="text-gray-700">
                Cliente:{" "}
                <span className="font-semibold">
                  {clienteParaCambioEstado.nombre}
                </span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {clienteParaCambioEstado.tipoDocumento}:{" "}
                {clienteParaCambioEstado.numeroDocumento}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Estado actual:{" "}
                <span className="font-semibold">
                  {clienteParaCambioEstado.estado}
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
            <Button variant="destructive" onClick={confirmEstado}>
              Cambiar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
