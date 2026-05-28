import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Loader2,
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
import {
  createProveedor,
  disableProveedor,
  enableProveedor,
  getMunicipiosOptions,
  getProveedorById,
  getProveedores,
  getTiposDocumentoOptions,
  getTiposProveedorOptions,
  updateProveedor,
  getDepartamentosOptions,
  getPaisesOptions,
  type DepartamentoOption,
  type PaisOption,
  type CatalogOption,
  type MunicipioOption,
  type ProveedorItem,
  type SaveProveedorPayload,
} from "../services/proveedores.services";

type FormState = {
  tipoDocId: string;
  numeroDoc: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  municipioId: string;
  tipoProveedorId: string;
  contacto: string;
};

type FormErrors = Record<keyof FormState, string>;
type FormTouched = Record<keyof FormState, boolean>;

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM: FormState = {
  tipoDocId: "",
  numeroDoc: "",
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  municipioId: "",
  tipoProveedorId: "",
  contacto: "",
};

const EMPTY_ERRORS: FormErrors = {
  tipoDocId: "",
  numeroDoc: "",
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  municipioId: "",
  tipoProveedorId: "",
  contacto: "",
};

const EMPTY_TOUCHED: FormTouched = {
  tipoDocId: false,
  numeroDoc: false,
  nombre: false,
  email: false,
  telefono: false,
  direccion: false,
  municipioId: false,
  tipoProveedorId: false,
  contacto: false,
};

const getErrorMessage = (error: any, fallback: string) => {
  const message =
    error?.response?.data?.message ??
    error?.response?.data?.error?.message ??
    error?.response?.data?.error ??
    error?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message.trim();

  return fallback;
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const validators: Record<keyof FormState, (value: string) => string> = {
  tipoDocId: (value) => (!value ? "El tipo de documento es requerido" : ""),

  numeroDoc: (value) => {
    if (!value.trim()) return "El número de documento es requerido";
    if (!/^[a-zA-Z0-9-]+$/.test(value.trim())) {
      return "Solo se permiten letras, números y guiones";
    }
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 50) return "Máximo 50 caracteres";
    return "";
  },

  nombre: (value) => {
    if (!value.trim()) return "El nombre o razón social es requerido";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.&,-]+$/.test(value.trim())) {
      return "Solo se permiten letras, números, espacios y . , - &";
    }
    if (value.trim().length < 3) return "Mínimo 3 caracteres";
    if (value.trim().length > 150) return "Máximo 150 caracteres";
    return "";
  },

  // 🔥 AHORA OBLIGATORIO
  email: (value) => {
    if (!value.trim()) return "El email es requerido";
    if (value.trim().length > 100) return "Máximo 100 caracteres";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Formato de email inválido";
    return "";
  },

  // 🔥 AHORA OBLIGATORIO
  telefono: (value) => {
    if (!value.trim()) return "El teléfono es requerido";
    if (value.trim().length > 20) return "Máximo 20 caracteres";
    if (!/^[0-9+\-\s()]+$/.test(value.trim())) {
      return "Solo se permiten números, espacios, +, -, y paréntesis";
    }
    return "";
  },

  direccion: (value) => {
    if (!value.trim()) return "";
    if (value.trim().length > 255) return "Máximo 255 caracteres";
    return "";
  },

  municipioId: (value) => (!value ? "El municipio es requerido" : ""),

  tipoProveedorId: (value) => (!value ? "El tipo de proveedor es requerido" : ""),

  // 🔥 AHORA OBLIGATORIO
  contacto: (value) => {
    if (!value.trim()) return "El contacto es requerido";
    if (value.trim().length > 255) return "Máximo 255 caracteres";
    return "";
  },
};

export default function Proveedores() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/proveedores/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isEliminar = location.pathname.endsWith("/eliminar");

  const closeToList = useCallback(() => {
    navigate("/app/proveedores");
  }, [navigate]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [proveedores, setProveedores] = useState<ProveedorItem[]>([]);
  const [proveedorDetalle, setProveedorDetalle] = useState<ProveedorItem | null>(null);
  const [proveedorParaCambioEstado, setProveedorParaCambioEstado] =
    useState<ProveedorItem | null>(null);

  const [tiposDocumento, setTiposDocumento] = useState<CatalogOption[]>([]);
  const [tiposProveedor, setTiposProveedor] = useState<CatalogOption[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);

  const [paises, setPaises] = useState<PaisOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);

  const [paisSeleccionado, setPaisSeleccionado] = useState("");
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");

  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [touched, setTouched] = useState<FormTouched>(EMPTY_TOUCHED);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 1,
  });

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paisColombia = useMemo(() => {
    return (
      paises.find((pais) => normalizeText(pais.label) === "colombia") ?? null
    );
  }, [paises]);

  const departamentosDisponibles = useMemo(() => {
    if (!paisSeleccionado) return [];

    return departamentos.filter(
      (departamento) => String(departamento.idPais) === String(paisSeleccionado)
    );
  }, [departamentos, paisSeleccionado]);

  const handlePaisChange = (value: string) => {
    setPaisSeleccionado(value);
    setDepartamentoSeleccionado("");
    setMunicipios([]);

    setFieldValue("municipioId", "");

    setTouched((prev) => ({
      ...prev,
      municipioId: false,
    }));

    setErrors((prev) => ({
      ...prev,
      municipioId: "",
    }));
  };

  const handleDepartamentoChange = (value: string) => {
    setDepartamentoSeleccionado(value);
    setMunicipios([]);

    setFieldValue("municipioId", "");

    setTouched((prev) => ({
      ...prev,
      municipioId: false,
    }));

    setErrors((prev) => ({
      ...prev,
      municipioId: "",
    }));
  };

  const handleMunicipioChange = (value: string) => {
    setFieldValue("municipioId", value);

    setTouched((prev) => ({
      ...prev,
      municipioId: true,
    }));

    setErrors((prev) => ({
      ...prev,
      municipioId: validators.municipioId(value),
    }));
  };

  const tipoDocMap = useMemo(
    () =>
      Object.fromEntries(
        tiposDocumento.map((item) => [Number(item.value), item.label])
      ) as Record<number, string>,
    [tiposDocumento]
  );

  const tipoProveedorMap = useMemo(
    () =>
      Object.fromEntries(
        tiposProveedor.map((item) => [Number(item.value), item.label])
      ) as Record<number, string>,
    [tiposProveedor]
  );

  const getTipoDocumentoLabel = useCallback(
    (proveedor: ProveedorItem) =>
      proveedor.tipoDocumento || tipoDocMap[proveedor.idTipoDocumento] || "—",
    [tipoDocMap]
  );

  const getTipoProveedorLabel = useCallback(
    (proveedor: ProveedorItem) =>
      proveedor.tipoProveedor || tipoProveedorMap[proveedor.idTipoProveedor] || "—",
    [tipoProveedorMap]
  );

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors(EMPTY_ERRORS);
    setTouched(EMPTY_TOUCHED);
  }, []);

  const setFieldValue = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validators[field](value),
      }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validators[field](form[field]),
    }));
  };

  const validateForm = () => {
    const nextTouched: FormTouched = {
      tipoDocId: true,
      numeroDoc: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      municipioId: true,
      tipoProveedorId: true,
      contacto: true,
    };

    const nextErrors: FormErrors = {
      tipoDocId: validators.tipoDocId(form.tipoDocId),
      numeroDoc: validators.numeroDoc(form.numeroDoc),
      nombre: validators.nombre(form.nombre),
      email: validators.email(form.email),
      telefono: validators.telefono(form.telefono),
      direccion: validators.direccion(form.direccion),
      municipioId: validators.municipioId(form.municipioId),
      tipoProveedorId: validators.tipoProveedorId(form.tipoProveedorId),
      contacto: validators.contacto(form.contacto),
    };

    setTouched(nextTouched);
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      toast.error("Por favor corrige los errores del formulario");
      return false;
    }

    return true;
  };

  const buildPayload = (): SaveProveedorPayload => ({
    num_documento: form.numeroDoc.trim(),
    nombre_empresa: form.nombre.trim(),
    email: form.email.trim(),
    telefono: form.telefono.trim(),
    direccion: form.direccion.trim() || undefined,
    nombre_contacto: form.contacto.trim(),
    id_tipo_proveedor: Number(form.tipoProveedorId),
    id_tipo_doc: Number(form.tipoDocId),
    id_municipio: Number(form.municipioId),
  });

  const getSearchFilters = useCallback((term: string) => {
    const normalized = term.trim().toLowerCase();

    if (!normalized) return {};

    if (["activo", "activos"].includes(normalized)) {
      return { estado: "true" as const };
    }

    if (["inactivo", "inactivos", "desactivado", "desactivados"].includes(normalized)) {
      return { estado: "false" as const };
    }

    return { q: term.trim() };
  }, []);

  const loadCatalogos = useCallback(async () => {
    try {
      setIsLoadingCatalogos(true);

      const [
        tiposDocRes,
        tiposProveedorRes,
        paisesRes,
        departamentosRes,
      ] = await Promise.allSettled([
        getTiposDocumentoOptions(),
        getTiposProveedorOptions(),
        getPaisesOptions(),
        getDepartamentosOptions(),
      ]);

      if (tiposDocRes.status === "fulfilled") {
        setTiposDocumento(tiposDocRes.value);
      } else {
        console.error("Error cargando tipos de documento:", tiposDocRes.reason);
        toast.error("No se pudieron cargar los tipos de documento");
      }

      if (tiposProveedorRes.status === "fulfilled") {
        setTiposProveedor(tiposProveedorRes.value);
      } else {
        console.error("Error cargando tipos de proveedor:", tiposProveedorRes.reason);
        toast.error("No se pudieron cargar los tipos de proveedor");
      }

      if (paisesRes.status === "fulfilled") {
        setPaises(paisesRes.value);
      } else {
        console.error("Error cargando países:", paisesRes.reason);
        toast.error("No se pudieron cargar los países");
      }

      if (departamentosRes.status === "fulfilled") {
        setDepartamentos(departamentosRes.value);
      } else {
        console.error("Error cargando departamentos:", departamentosRes.reason);
        toast.error("No se pudieron cargar los departamentos");
      }
    } finally {
      setIsLoadingCatalogos(false);
    }
  }, []);

  const loadProveedores = useCallback(
    async (page: number, term: string) => {
      try {
        setIsLoadingList(true);

        const response = await getProveedores({
          page,
          limit: ITEMS_PER_PAGE,
          ...getSearchFilters(term),
        });

        setProveedores(response.data);
        setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total,
          pages: response.pages,
        });

        if (response.pages > 0 && page > response.pages) {
          setCurrentPage(response.pages);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "No se pudieron cargar los proveedores"));
      } finally {
        setIsLoadingList(false);
      }
    },
    [getSearchFilters]
  );

  const loadProveedorDetalle = useCallback(
    async (id: number) => {
      try {
        setIsLoadingDetalle(true);
        const data = await getProveedorById(id);
        setProveedorDetalle(data);
      } catch (error) {
        setProveedorDetalle(null);
        toast.error(getErrorMessage(error, "No se pudo cargar el proveedor"));
        closeToList();
      } finally {
        setIsLoadingDetalle(false);
      }
    },
    [closeToList]
  );

  useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    if (!departamentoSeleccionado) {
      setMunicipios([]);
      return;
    }

    let cancelled = false;

    const cargarMunicipiosPorDepartamento = async () => {
      try {
        setIsLoadingMunicipios(true);

        const data = await getMunicipiosOptions({
          idDepartamento: Number(departamentoSeleccionado),
        });

        if (!cancelled) {
          setMunicipios(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error cargando municipios:", error);
          toast.error("No se pudieron cargar los municipios");
          setMunicipios([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMunicipios(false);
        }
      }
    };

    void cargarMunicipiosPorDepartamento();

    return () => {
      cancelled = true;
    };
  }, [departamentoSeleccionado]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    void loadProveedores(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, loadProveedores]);

  useEffect(() => {
    if (!isVer && !isEditar && !isEliminar) {
      setProveedorDetalle(null);
      return;
    }

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      closeToList();
      return;
    }

    void loadProveedorDetalle(id);
  }, [isVer, isEditar, isEliminar, params.id, loadProveedorDetalle, closeToList]);

  useEffect(() => {
    if (!isCrear) return;

    resetForm();
    setPaisSeleccionado(paisColombia?.value ?? "");
    setDepartamentoSeleccionado("");
    setMunicipios([]);
  }, [isCrear, resetForm, paisColombia?.value]);

  useEffect(() => {
    if (!isEditar || !proveedorDetalle) return;

    setForm({
      tipoDocId: String(proveedorDetalle.idTipoDocumento || ""),
      numeroDoc: proveedorDetalle.numeroDocumento || "",
      nombre: proveedorDetalle.nombre || "",
      email: proveedorDetalle.email || "",
      telefono: proveedorDetalle.telefono || "",
      direccion: proveedorDetalle.direccion || "",
      municipioId: String(proveedorDetalle.idMunicipio || ""),
      tipoProveedorId: String(proveedorDetalle.idTipoProveedor || ""),
      contacto: proveedorDetalle.contacto || "",
    });

    setPaisSeleccionado(String(proveedorDetalle.idPais || ""));
    setDepartamentoSeleccionado(String(proveedorDetalle.idDepartamento || ""));

    setErrors(EMPTY_ERRORS);
    setTouched(EMPTY_TOUCHED);
  }, [isEditar, proveedorDetalle]);

  const totalPages = Math.max(pagination.pages || 1, 1);
  const startIndex =
    pagination.total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex =
    pagination.total === 0 ? 0 : startIndex + proveedores.length - 1;

  const handleView = (proveedor: ProveedorItem) => {
    navigate(`/app/proveedores/${proveedor.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/proveedores/crear");
  };

  const handleEdit = (proveedor: ProveedorItem) => {
    navigate(`/app/proveedores/${proveedor.id}/editar`);
  };

  const handleDelete = (proveedor: ProveedorItem) => {
    navigate(`/app/proveedores/${proveedor.id}/eliminar`);
  };

  const handleToggleEstado = (proveedor: ProveedorItem) => {
    setProveedorParaCambioEstado(proveedor);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = async () => {
    if (!proveedorParaCambioEstado || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (proveedorParaCambioEstado.estado === "Activo") {
        await disableProveedor(proveedorParaCambioEstado.id);
        toast.success("Proveedor desactivado exitosamente");
      } else {
        await enableProveedor(proveedorParaCambioEstado.id);
        toast.success("Proveedor activado exitosamente");
      }

      setShowConfirmEstadoModal(false);
      setProveedorParaCambioEstado(null);

      await loadProveedores(currentPage, debouncedSearch);

      if (proveedorDetalle?.id === proveedorParaCambioEstado.id) {
        await loadProveedorDetalle(proveedorParaCambioEstado.id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cambiar el estado del proveedor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCreate = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await createProveedor({
        ...buildPayload(),
        estado: true,
      });

      resetForm();
      setSearchTerm("");
      setDebouncedSearch("");
      setCurrentPage(1);
      await loadProveedores(1, "");

      closeToList();
      setShowSuccessModal(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el proveedor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEdit = async () => {
    if (!proveedorDetalle || isSubmitting) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await updateProveedor(proveedorDetalle.id, buildPayload());

      toast.success("Proveedor actualizado exitosamente");
      await loadProveedores(currentPage, debouncedSearch);
      closeToList();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el proveedor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!proveedorDetalle || isSubmitting) return;

    try {
      setIsSubmitting(true);

      await disableProveedor(proveedorDetalle.id);

      toast.success("Proveedor desactivado exitosamente");
      await loadProveedores(currentPage, debouncedSearch);
      closeToList();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo desactivar el proveedor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetalleBody = () => {
    if (isLoadingDetalle) {
      return (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando proveedor...
        </div>
      );
    }

    if (!proveedorDetalle) {
      return (
        <div className="py-8 text-center text-gray-500">
          No se encontró la información del proveedor
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-x-10 gap-y-5 rounded-lg bg-gray-50 p-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600">Proveedor</p>
            <p className="font-medium text-blue-600">
              {proveedorDetalle.nombre || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={
                  proveedorDetalle.estado === "Activo"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }
              >
                {proveedorDetalle.estado || "Sin estado"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tipo de documento</p>
            <p className="font-medium">
              {getTipoDocumentoLabel(proveedorDetalle) || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Documento / NIT</p>
            <p className="font-medium">
              {proveedorDetalle.numeroDocumento || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tipo de proveedor</p>
            <p className="font-medium">
              {getTipoProveedorLabel(proveedorDetalle) || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Contacto principal</p>
            <p className="font-medium">
              {proveedorDetalle.contacto || "No registrado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">
              {proveedorDetalle.email || "No registrado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Teléfono</p>
            <p className="font-medium">
              {proveedorDetalle.telefono || "No registrado"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">País</p>
            <p className="font-medium">
              {proveedorDetalle.pais || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Departamento</p>
            <p className="font-medium">
              {proveedorDetalle.departamento || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Ciudad / Municipio</p>
            <p className="font-medium">
              {proveedorDetalle.ciudad || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Dirección</p>
            <p className="font-medium">
              {proveedorDetalle.direccion || "No registrada"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Proveedores</h2>
        <p className="text-gray-600 mt-1">
          Gestiona la información de tus proveedores
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Buscar por nombre, documento, email, teléfono, contacto o estado..."
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
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead className="text-center">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Documento / NIT</TableHead>
                <TableHead>Ciudad / Municipio</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Teléfono</TableHead>
                <TableHead className="text-center">Tipo Proveedor</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-32 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingList ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando proveedores...
                    </div>
                  </TableCell>
                </TableRow>
              ) : proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                    No se encontraron proveedores
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((proveedor, index) => (
                  <TableRow key={proveedor.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>

                    <TableCell className="text-center font-mono text-sm">
                      {proveedor.codigo || "—"}
                    </TableCell>

                    <TableCell className="font-medium text-gray-900">
                      {proveedor.nombre || "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-medium">
                        {getTipoDocumentoLabel(proveedor)}:
                      </span>{" "}
                      <span className="font-mono text-sm">
                        {proveedor.numeroDocumento || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {proveedor.ciudad || "—"}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {proveedor.email || "—"}
                    </TableCell>

                    <TableCell className="text-center text-gray-700">
                      {proveedor.telefono || "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700"
                      >
                        {getTipoProveedorLabel(proveedor)}
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
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(proveedor)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(proveedor)}
                          className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(proveedor)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Desactivar"
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
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex} - {endIndex} de {pagination.total} proveedores
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1 || isLoadingList}
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
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                    disabled={isLoadingList}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages || isLoadingList}
                className="h-8"
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
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="view-proveedor-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalles del Proveedor</DialogTitle>
            <DialogDescription id="view-proveedor-description">
              Información completa del proveedor
            </DialogDescription>
          </DialogHeader>

          {renderDetalleBody()}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Select
                  value={form.tipoDocId}
                  onValueChange={(value) => {
                    setFieldValue("tipoDocId", value);
                    setTouched((prev) => ({ ...prev, tipoDocId: true }));
                    setErrors((prev) => ({
                      ...prev,
                      tipoDocId: validators.tipoDocId(value),
                    }));
                  }}
                  disabled={isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="create-tipo-doc"
                    className={errors.tipoDocId && touched.tipoDocId ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingCatalogos
                          ? "Cargando tipos..."
                          : "Selecciona un tipo de documento"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoDocId && touched.tipoDocId && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoDocId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                <Input
                  id="create-numero-doc"
                  value={form.numeroDoc}
                  onChange={(e) => setFieldValue("numeroDoc", e.target.value)}
                  onBlur={() => handleBlur("numeroDoc")}
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
                value={form.nombre}
                onChange={(e) => setFieldValue("nombre", e.target.value)}
                onBlur={() => handleBlur("nombre")}
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
                  value={form.email}
                  onChange={(e) => setFieldValue("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
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
                  value={form.telefono}
                  onChange={(e) => setFieldValue("telefono", e.target.value)}
                  onBlur={() => handleBlur("telefono")}
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
                <Label htmlFor="create-tipo-proveedor">Tipo de Proveedor *</Label>
                <Select
                  value={form.tipoProveedorId}
                  onValueChange={(value) => {
                    setFieldValue("tipoProveedorId", value);
                    setTouched((prev) => ({ ...prev, tipoProveedorId: true }));
                    setErrors((prev) => ({
                      ...prev,
                      tipoProveedorId: validators.tipoProveedorId(value),
                    }));
                  }}
                  disabled={isLoadingCatalogos}
                >
                  <SelectTrigger
                    id="create-tipo-proveedor"
                    className={
                      errors.tipoProveedorId && touched.tipoProveedorId
                        ? "border-red-500"
                        : ""
                    }
                  >
                    <SelectValue
                      placeholder={
                        isLoadingCatalogos
                          ? "Cargando tipos..."
                          : "Selecciona un tipo de proveedor"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposProveedor.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoProveedorId && touched.tipoProveedorId && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoProveedorId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-contacto">Contacto Principal *</Label>
                <Input
                  id="create-contacto"
                  value={form.contacto}
                  onChange={(e) => setFieldValue("contacto", e.target.value)}
                  onBlur={() => handleBlur("contacto")}
                  placeholder="Nombre del contacto principal"
                  className={errors.contacto && touched.contacto ? "border-red-500" : ""}
                />
                {errors.contacto && touched.contacto && (
                  <p className="text-red-500 text-sm mt-1">{errors.contacto}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="create-pais">País *</Label>
                <Select
                  value={paisSeleccionado}
                  onValueChange={handlePaisChange}
                  disabled={isLoadingCatalogos}
                >
                  <SelectTrigger id="create-pais">
                    <SelectValue
                      placeholder={
                        isLoadingCatalogos ? "Cargando países..." : "Selecciona un país"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {paises.map((pais) => (
                      <SelectItem key={pais.value} value={pais.value}>
                        {pais.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="create-departamento">Departamento *</Label>
                <Select
                  value={departamentoSeleccionado}
                  onValueChange={handleDepartamentoChange}
                  disabled={isLoadingCatalogos || !paisSeleccionado}
                >
                  <SelectTrigger id="create-departamento">
                    <SelectValue
                      placeholder={
                        !paisSeleccionado
                          ? "Selecciona primero un país"
                          : "Selecciona un departamento"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {departamentosDisponibles.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No hay departamentos disponibles
                      </div>
                    ) : (
                      departamentosDisponibles.map((departamento) => (
                        <SelectItem key={departamento.value} value={departamento.value}>
                          {departamento.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="create-municipio">Ciudad / Municipio *</Label>
                <Select
                  value={form.municipioId}
                  onValueChange={handleMunicipioChange}
                  disabled={
                    isLoadingCatalogos ||
                    isLoadingMunicipios ||
                    !paisSeleccionado ||
                    !departamentoSeleccionado
                  }
                >
                  <SelectTrigger
                    id="create-municipio"
                    className={
                      errors.municipioId && touched.municipioId ? "border-red-500" : ""
                    }
                  >
                    <SelectValue
                      placeholder={
                        !departamentoSeleccionado
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
                        <SelectItem key={municipio.value} value={municipio.value}>
                          {municipio.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {errors.municipioId && touched.municipioId && (
                  <p className="mt-1 text-sm text-red-500">{errors.municipioId}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="create-direccion">Dirección</Label>
              <Input
                id="create-direccion"
                value={form.direccion}
                onChange={(e) => setFieldValue("direccion", e.target.value)}
                onBlur={() => handleBlur("direccion")}
                placeholder="Ej: Calle 123 # 45-67"
                className={errors.direccion && touched.direccion ? "border-red-500" : ""}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
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
              disabled={isSubmitting || isLoadingCatalogos}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          {isLoadingDetalle ? (
            <div className="py-10 flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando proveedor...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                  <Select
                    value={form.tipoDocId}
                    onValueChange={(value) => {
                      setFieldValue("tipoDocId", value);
                      setTouched((prev) => ({ ...prev, tipoDocId: true }));
                      setErrors((prev) => ({
                        ...prev,
                        tipoDocId: validators.tipoDocId(value),
                      }));
                    }}
                    disabled={isLoadingCatalogos}
                  >
                    <SelectTrigger
                      id="edit-tipo-doc"
                      className={errors.tipoDocId && touched.tipoDocId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona un tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDocumento.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipoDocId && touched.tipoDocId && (
                    <p className="text-red-500 text-sm mt-1">{errors.tipoDocId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                  <Input
                    id="edit-numero-doc"
                    value={form.numeroDoc}
                    onChange={(e) => setFieldValue("numeroDoc", e.target.value)}
                    onBlur={() => handleBlur("numeroDoc")}
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
                  value={form.nombre}
                  onChange={(e) => setFieldValue("nombre", e.target.value)}
                  onBlur={() => handleBlur("nombre")}
                  placeholder="Ej: Distribuciones Médicas S.A.S."
                  className={errors.nombre && touched.nombre ? "border-red-500" : ""}
                />
                {errors.nombre && touched.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setFieldValue("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="correo@ejemplo.com"
                    className={errors.email && touched.email ? "border-red-500" : ""}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input
                    id="edit-telefono"
                    value={form.telefono}
                    onChange={(e) => setFieldValue("telefono", e.target.value)}
                    onBlur={() => handleBlur("telefono")}
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
                  <Label htmlFor="edit-tipo-proveedor">Tipo de Proveedor *</Label>
                  <Select
                    value={form.tipoProveedorId}
                    onValueChange={(value) => {
                      setFieldValue("tipoProveedorId", value);
                      setTouched((prev) => ({ ...prev, tipoProveedorId: true }));
                      setErrors((prev) => ({
                        ...prev,
                        tipoProveedorId: validators.tipoProveedorId(value),
                      }));
                    }}
                    disabled={isLoadingCatalogos}
                  >
                    <SelectTrigger
                      id="edit-tipo-proveedor"
                      className={
                        errors.tipoProveedorId && touched.tipoProveedorId
                          ? "border-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Selecciona un tipo de proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposProveedor.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipoProveedorId && touched.tipoProveedorId && (
                    <p className="text-red-500 text-sm mt-1">{errors.tipoProveedorId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-contacto">Contacto Principal</Label>
                  <Input
                    id="edit-contacto"
                    value={form.contacto}
                    onChange={(e) => setFieldValue("contacto", e.target.value)}
                    onBlur={() => handleBlur("contacto")}
                    placeholder="Nombre del contacto principal"
                    className={errors.contacto && touched.contacto ? "border-red-500" : ""}
                  />
                  {errors.contacto && touched.contacto && (
                    <p className="text-red-500 text-sm mt-1">{errors.contacto}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="edit-pais">País *</Label>
                  <Select
                    value={paisSeleccionado}
                    onValueChange={handlePaisChange}
                    disabled={isLoadingCatalogos}
                  >
                    <SelectTrigger id="edit-pais">
                      <SelectValue
                        placeholder={
                          isLoadingCatalogos ? "Cargando países..." : "Selecciona un país"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {paises.map((pais) => (
                        <SelectItem key={pais.value} value={pais.value}>
                          {pais.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-departamento">Departamento *</Label>
                  <Select
                    value={departamentoSeleccionado}
                    onValueChange={handleDepartamentoChange}
                    disabled={isLoadingCatalogos || !paisSeleccionado}
                  >
                    <SelectTrigger id="edit-departamento">
                      <SelectValue
                        placeholder={
                          !paisSeleccionado
                            ? "Selecciona primero un país"
                            : "Selecciona un departamento"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {departamentosDisponibles.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay departamentos disponibles
                        </div>
                      ) : (
                        departamentosDisponibles.map((departamento) => (
                          <SelectItem key={departamento.value} value={departamento.value}>
                            {departamento.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-municipio">Ciudad / Municipio *</Label>
                  <Select
                    value={form.municipioId}
                    onValueChange={handleMunicipioChange}
                    disabled={
                      isLoadingCatalogos ||
                      isLoadingMunicipios ||
                      !paisSeleccionado ||
                      !departamentoSeleccionado
                    }
                  >
                    <SelectTrigger
                      id="edit-municipio"
                      className={
                        errors.municipioId && touched.municipioId ? "border-red-500" : ""
                      }
                    >
                      <SelectValue
                        placeholder={
                          !departamentoSeleccionado
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
                          <SelectItem key={municipio.value} value={municipio.value}>
                            {municipio.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {errors.municipioId && touched.municipioId && (
                    <p className="mt-1 text-sm text-red-500">{errors.municipioId}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input
                  id="edit-direccion"
                  value={form.direccion}
                  onChange={(e) => setFieldValue("direccion", e.target.value)}
                  onBlur={() => handleBlur("direccion")}
                  placeholder="Ej: Calle 123 # 45-67"
                  className={errors.direccion && touched.direccion ? "border-red-500" : ""}
                />
                {errors.direccion && touched.direccion && (
                  <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting || isLoadingDetalle || isLoadingCatalogos}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Desactivar Proveedor</DialogTitle>
            <DialogDescription id="delete-proveedor-description">
              ¿Estás seguro de que deseas desactivar este proveedor?
            </DialogDescription>
          </DialogHeader>

          {proveedorDetalle && (
            <div className="py-4">
              <p className="text-gray-700">
                Proveedor: <span className="font-semibold">{proveedorDetalle.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {getTipoDocumentoLabel(proveedorDetalle)}: {proveedorDetalle.numeroDocumento}
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
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <span className="font-medium">{proveedorParaCambioEstado?.nombre}</span>
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
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>

            <DialogDescription className="text-center">
              El proveedor ha sido creado correctamente en el sistema
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-center">
            <Button
              onClick={() => setShowSuccessModal(false)}
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
