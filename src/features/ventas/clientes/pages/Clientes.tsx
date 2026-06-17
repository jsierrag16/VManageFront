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
  Filter,
} from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { TableLoadingRow } from "@/shared/components/TableLoadingRow";
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
  mapBodegas,
} from "../services/clientes.mapper";
import type {
  ClienteUI,
  TipoClienteOption,
  TipoDocumentoOption,
  MunicipioOption,
  DepartamentoOption,
  BodegaOption,
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
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [bodegas, setBodegas] = useState<BodegaOption[]>([]);
  const [formDepartamentoId, setFormDepartamentoId] = useState("");
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
  const { selectedBodegaId } = useOutletContext<AppOutletContext>();

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
  const [formBodegaId, setFormBodegaId] = useState("");

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
    bodega: "",
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
    bodega: false,
  });

  const validateTipoDoc = (value: string) => {
    if (!value) return "El tipo de documento es requerido";
    return "";
  };

  const validateBodega = (value: string) => {
    if (!value) return "La bodega es requerida";
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

  const handleBodegaChange = (value: string) => {
    setFormBodegaId(value);
    setTouched((prev) => ({ ...prev, bodega: true }));

    if (touched.bodega) {
      setErrors((prev) => ({ ...prev, bodega: validateBodega(value) }));
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

  const handleDepartamentoChange = (value: string) => {
    setFormDepartamentoId(value);
    setFormMunicipioId("");

    if (touched.municipio) {
      setErrors((prev) => ({
        ...prev,
        municipio: validateMunicipio(""),
      }));
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
  const getSelectedBodegaParam = useCallback(() => {
    const id = Number(selectedBodegaId);

    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [selectedBodegaId]);

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);

      const data = await clientesService.getAll({
        q: searchTerm,
        incluirInactivos: true,
        id_bodega: getSelectedBodegaParam(),
      });

      setClientes(data.map(mapClienteApiToUi));
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error("No se pudieron cargar los clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, getSelectedBodegaParam]);

  const loadMeta = useCallback(async () => {
    try {
      const [metaResult, departamentosResult] = await Promise.allSettled([
        clientesService.getMeta(),
        clientesService.getDepartamentos(),
      ]);

      if (metaResult.status === "fulfilled") {
        const meta = metaResult.value;

        setTiposDocumento(mapTiposDocumento(meta.tiposDocumento || []));
        setTiposCliente(mapTiposCliente(meta.tiposCliente || []));
        setBodegas(mapBodegas(meta.bodegas || []));
      } else {
        console.error(metaResult.reason);
        toast.error("No se pudieron cargar los catálogos de clientes");
      }

      if (departamentosResult.status === "fulfilled") {
        setDepartamentos(departamentosResult.value);
      } else {
        console.error(departamentosResult.reason);
        toast.error("No se pudieron cargar los departamentos");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los catálogos");
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  useEffect(() => {
    if (!formDepartamentoId) {
      setMunicipios([]);
      return;
    }

    let cancelled = false;

    const cargarMunicipios = async () => {
      try {
        setIsLoadingMunicipios(true);

        const data = await clientesService.getMunicipiosByDepartamento(
          Number(formDepartamentoId)
        );

        if (!cancelled) {
          setMunicipios(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          toast.error("No se pudieron cargar los municipios");
          setMunicipios([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMunicipios(false);
        }
      }
    };

    void cargarMunicipios();

    return () => {
      cancelled = true;
    };
  }, [formDepartamentoId]);

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
  }, [searchTerm, estadoFilter, selectedBodegaId]);

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
    setFormDepartamentoId("");
    setMunicipios([]);
    setFormTipoClienteId("");
    setFormBodegaId("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      municipio: "",
      bodega: "",
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
      bodega: false,
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
    setFormDepartamentoId(String(clienteSeleccionado.idDepartamento || ""));
    setFormTipoClienteId(String(clienteSeleccionado.idTipoCliente));
    setFormBodegaId(String(clienteSeleccionado.idBodega || ""));

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      municipio: "",
      bodega: "",
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
      bodega: false,
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
      bodega: validateBodega(formBodegaId),
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
      bodega: true,
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
        idBodega: Number(formBodegaId),
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
        idBodega: Number(formBodegaId),
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

  const getDocumentoClienteTexto = (cliente?: ClienteUI | null) => {
    if (!cliente) return "No registrado";

    const tipoDocumento = cliente.tipoDocumento?.trim() || "Documento";
    const numeroDocumento = cliente.numeroDocumento?.trim() || "";

    if (!numeroDocumento) return "No registrado";

    return `${tipoDocumento}: ${numeroDocumento}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const renderClienteForm = (mode: "create" | "edit") => {
    const prefix = mode === "create" ? "create" : "edit";

    return (
      <div className="space-y-5 py-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}-tipo-doc`}>Tipo de Documento *</Label>
            <Select
              value={formTipoDocId}
              onValueChange={handleTipoDocChange}
            >
              <SelectTrigger
                id={`${prefix}-tipo-doc`}
                className={errors.tipoDoc && touched.tipoDoc ? "border-red-500" : ""}
              >
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
              <p className="mt-1 text-sm text-red-500">{errors.tipoDoc}</p>
            )}
          </div>

          <div>
            <Label htmlFor={`${prefix}-numero-doc`}>N° de Documento *</Label>
            <Input
              id={`${prefix}-numero-doc`}
              value={formNumeroDoc}
              onChange={(e) => handleNumeroDocChange(e.target.value)}
              onBlur={handleNumeroDocBlur}
              placeholder="Ej: 1234567890"
              className={errors.numeroDoc && touched.numeroDoc ? "border-red-500" : ""}
            />

            {errors.numeroDoc && touched.numeroDoc && (
              <p className="mt-1 text-sm text-red-500">{errors.numeroDoc}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}-nombre`}>Nombre Completo *</Label>
          <Input
            id={`${prefix}-nombre`}
            value={formNombre}
            onChange={(e) => handleNombreChange(e.target.value)}
            onBlur={handleNombreBlur}
            placeholder="Ej: Juan Pérez García"
            className={errors.nombre && touched.nombre ? "border-red-500" : ""}
          />

          {errors.nombre && touched.nombre && (
            <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}-email`}>Email *</Label>
            <Input
              id={`${prefix}-email`}
              type="email"
              value={formEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="correo@ejemplo.com"
              className={errors.email && touched.email ? "border-red-500" : ""}
            />

            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor={`${prefix}-telefono`}>Teléfono *</Label>
            <Input
              id={`${prefix}-telefono`}
              value={formTelefono}
              onChange={(e) => handleTelefonoChange(e.target.value)}
              onBlur={handleTelefonoBlur}
              placeholder="3001234567"
              className={errors.telefono && touched.telefono ? "border-red-500" : ""}
            />

            {errors.telefono && touched.telefono && (
              <p className="mt-1 text-sm text-red-500">{errors.telefono}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}-tipo-cliente`}>Tipo de Cliente *</Label>
          <Select
            value={formTipoClienteId}
            onValueChange={handleTipoClienteChange}
          >
            <SelectTrigger
              id={`${prefix}-tipo-cliente`}
              className={
                errors.tipoCliente && touched.tipoCliente ? "border-red-500" : ""
              }
            >
              <SelectValue placeholder="Selecciona el tipo de cliente" />
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
            <p className="mt-1 text-sm text-red-500">{errors.tipoCliente}</p>
          )}
        </div>

        <div>
          <Label htmlFor={`${prefix}-bodega`}>Bodega principal *</Label>
          <Select
            value={formBodegaId}
            onValueChange={handleBodegaChange}
          >
            <SelectTrigger
              id={`${prefix}-bodega`}
              className={errors.bodega && touched.bodega ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Selecciona la bodega principal" />
            </SelectTrigger>

            <SelectContent>
              {bodegas.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No hay bodegas disponibles
                </div>
              ) : (
                bodegas.map((bodega) => (
                  <SelectItem key={bodega.id} value={String(bodega.id)}>
                    {bodega.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {errors.bodega && touched.bodega && (
            <p className="mt-1 text-sm text-red-500">{errors.bodega}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}-departamento`}>Departamento *</Label>
            <Select
              value={formDepartamentoId}
              onValueChange={handleDepartamentoChange}
            >
              <SelectTrigger id={`${prefix}-departamento`}>
                <SelectValue placeholder="Selecciona un departamento" />
              </SelectTrigger>

              <SelectContent>
                {departamentos.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No hay departamentos disponibles
                  </div>
                ) : (
                  departamentos.map((departamento) => (
                    <SelectItem
                      key={departamento.id}
                      value={String(departamento.id)}
                    >
                      {departamento.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`${prefix}-municipio`}>Ciudad / Municipio *</Label>
            <Select
              value={formMunicipioId}
              onValueChange={handleMunicipioChange}
              disabled={!formDepartamentoId || isLoadingMunicipios}
            >
              <SelectTrigger
                id={`${prefix}-municipio`}
                className={errors.municipio && touched.municipio ? "border-red-500" : ""}
              >
                <SelectValue
                  placeholder={
                    !formDepartamentoId
                      ? "Selecciona primero un departamento"
                      : isLoadingMunicipios
                        ? "Cargando municipios..."
                        : "Selecciona una ciudad / municipio"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {municipios.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No hay municipios disponibles
                  </div>
                ) : (
                  municipios.map((municipio) => (
                    <SelectItem key={municipio.id} value={String(municipio.id)}>
                      {municipio.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {errors.municipio && touched.municipio && (
              <p className="mt-1 text-sm text-red-500">{errors.municipio}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor={`${prefix}-direccion`}>Dirección *</Label>
          <Input
            id={`${prefix}-direccion`}
            value={formDireccion}
            onChange={(e) => handleDireccionChange(e.target.value)}
            onBlur={handleDireccionBlur}
            placeholder="Ej: Carrera 43A # 12-34"
            className={errors.direccion && touched.direccion ? "border-red-500" : ""}
          />

          {errors.direccion && touched.direccion && (
            <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Clientes</h2>
        <p className="text-gray-600 mt-1">
          Gestiona la información de tus clientes
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14">#</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento / NIT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipo Cliente</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={10} text="Cargando clientes..." />
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
                    <TableCell className="text-gray-600">
                      {startIndex + index + 1}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {cliente.codigo || "—"}
                    </TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {cliente.nombre || "—"}
                    </TableCell>

                    <TableCell className="">
                      <span className="font-medium">{cliente.tipoDocumento || "Documento"}:</span>{" "}
                      <span className="font-mono text-sm">
                        {cliente.numeroDocumento || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {cliente.email || "—"}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {cliente.telefono || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {cliente.tipoCliente}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {cliente.bodega || "Sin bodega"}
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
                      <div className="flex items-center justify-center gap-2">
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
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription id="view-cliente-description">
              Información completa del cliente
            </DialogDescription>
          </DialogHeader>

          {clienteSeleccionado ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-10 gap-y-5 rounded-lg bg-gray-50 p-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-medium text-blue-600">
                    {clienteSeleccionado.codigo || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={
                        clienteSeleccionado.estado === "Activo"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }
                    >
                      {clienteSeleccionado.estado || "Sin estado"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {clienteSeleccionado.nombre || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Tipo de cliente</p>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className="border-purple-200 bg-purple-50 text-purple-700"
                    >
                      {clienteSeleccionado.tipoCliente || "-"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bodega principal</p>
                  <p className="font-medium">
                    {clienteSeleccionado.bodega || "Sin bodega"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Documento / NIT</p>
                  <p className="font-medium">
                    {getDocumentoClienteTexto(clienteSeleccionado)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">
                    {clienteSeleccionado.email || "No registrado"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">
                    {clienteSeleccionado.telefono || "No registrado"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Departamento</p>
                  <p className="font-medium">
                    {clienteSeleccionado.departamento || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Ciudad / Municipio</p>
                  <p className="font-medium">
                    {clienteSeleccionado.ciudad || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium">
                    {clienteSeleccionado.direccion || "No registrada"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró la información del cliente
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
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription id="create-cliente-description">
              Completa la información del nuevo cliente
            </DialogDescription>
          </DialogHeader>

          {renderClienteForm("create")}

          <DialogFooter className="mt-2 border-t pt-4">
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
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription id="edit-cliente-description">
              Modifica la información del cliente
            </DialogDescription>
          </DialogHeader>

          {renderClienteForm("edit")}

          <DialogFooter className="mt-2 border-t pt-4">
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