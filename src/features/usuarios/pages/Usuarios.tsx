import api from "@/shared/services/api";
import { useAuth } from "@/shared/context/AuthContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { AppOutletContext } from "@/layouts/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Mail,
  Building2,
  CheckCircle,
  Filter,
  Loader2,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

/* =========================================================
   TIPOS
========================================================= */

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[];
      items?: T[];
      results?: T[];
      page?: number;
      limit?: number;
      total?: number;
      pages?: number;
    };

type CatalogOption = {
  id: number;
  label: string;
  shortLabel?: string;
};

type ApiUsuario = Record<string, any>;
type ApiRol = Record<string, any>;
type ApiTipoDocumento = Record<string, any>;
type ApiBodega = Record<string, any>;

type UsuarioRow = {
  id: number;
  idTipoDoc: number | null;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  idRol: number | null;
  rol: string;
  estado: boolean;
  bodegasIds: number[];
  bodegas: string[];
};

type FormErrors = {
  tipoDoc: string;
  numeroDoc: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  bodegas: string;
  rol: string;
};

type FormTouched = {
  tipoDoc: boolean;
  numeroDoc: boolean;
  nombre: boolean;
  apellido: boolean;
  email: boolean;
  telefono: boolean;
  bodegas: boolean;
  rol: boolean;
};

/* =========================================================
   ENDPOINTS
========================================================= */

const USUARIO_ENDPOINT = "/usuario";

const ROL_ENDPOINTS = [
  "/rol",
  "/roles",
  "/rol/select",
  "/roles/select",
];

const TIPO_DOCUMENTO_ENDPOINTS = [
  "/tipo-documento",
];

const BODEGA_ENDPOINTS = [
  "/bodega",
  "/bodegas",
];

const BPU_BASE_ENDPOINTS = [
  "/bodegas-por-usuario",
  "/bodegas_por_usuario",
  "/usuario-bodega",
  "/usuario_bodega",
  "/bodega-usuario",
  "/bodega_usuario",
];

/* =========================================================
   HELPERS GENERALES
========================================================= */

function normalizeListResponse<T>(payload: ApiListResponse<T> | any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function uniqueNumbers(values: Array<number | null | undefined>): number[] {
  return Array.from(new Set(values.filter((v): v is number => typeof v === "number" && Number.isFinite(v))));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => typeof v === "string" && v.trim().length > 0))
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function getApiErrorMessage(error: any, fallback = "Ocurrió un error inesperado") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

async function fetchFirstWorkingList<T>(endpoints: string[]): Promise<T[]> {
  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      return normalizeListResponse<T>(response.data);
    } catch (error: any) {
      console.error(`Error cargando catálogo desde ${endpoint}:`, error?.response?.data || error);
      lastError = error;
    }
  }

  throw lastError;
}

/* =========================================================
MAPPERS DE CATÁLOGOS
========================================================= */

function mapRolOption(raw: ApiRol): CatalogOption | null {
  const id = firstNumber(raw?.id_rol, raw?.id, raw?.value);
  const label = firstString(
    raw?.nombre_rol,
    raw?.rol,
    raw?.nombre,
    raw?.descripcion,
    raw?.label
  );

  if (!id || !label) return null;

  return {
    id,
    label,
  };
}

function mapTipoDocumentoOption(raw: ApiTipoDocumento): CatalogOption | null {
  const id = firstNumber(raw?.id_tipo_doc, raw?.id, raw?.value);
  const shortLabel = firstString(
    raw?.abreviatura,
    raw?.abreviacion,
    raw?.sigla,
  );
  const name = firstString(
    raw?.nombre_doc,
    raw?.nombre_tipo_doc,
    raw?.nombre,
  );

  if (!id) return null;

  const label =
    shortLabel && name && normalizeText(shortLabel) !== normalizeText(name)
      ? `${shortLabel} - ${name}`
      : shortLabel || name || `Tipo ${id}`;

  return {
    id,
    label,
    shortLabel: shortLabel || name || `Tipo ${id}`,
  };
}

function mapBodegaOption(raw: ApiBodega): CatalogOption | null {
  const id = firstNumber(raw?.id_bodega, raw?.id, raw?.value);
  const label = firstString(
    raw?.nombre_bodega,
    raw?.nombre,
    raw?.descripcion,
    raw?.label
  );

  if (!id || !label) return null;

  return {
    id,
    label,
  };
}

/* =========================================================
   MAPPER DE USUARIO
========================================================= */

function mapUsuarioApiToRow(
  raw: ApiUsuario,
  roles: CatalogOption[],
  tiposDocumento: CatalogOption[],
  bodegas: CatalogOption[]
): UsuarioRow {
  const rolesMap = new Map(roles.map((r) => [r.id, r]));
  const tiposMap = new Map(tiposDocumento.map((t) => [t.id, t]));
  const bodegasMap = new Map(bodegas.map((b) => [b.id, b]));

  const id = firstNumber(raw?.id_usuario, raw?.id) ?? 0;

  const idTipoDoc =
    firstNumber(raw?.id_tipo_doc, raw?.tipo_documento?.id_tipo_doc, raw?.tipoDocumento?.id_tipo_doc) ?? null;

  const tipoDocumento =
    firstString(
      raw?.tipo_documento?.abreviatura,
      raw?.tipo_documento?.abreviacion,
      raw?.tipo_documento?.sigla,
      raw?.tipoDocumento?.abreviatura,
      raw?.tipoDocumento?.abreviacion
    ) ||
    tiposMap.get(idTipoDoc ?? -1)?.shortLabel ||
    "—";

  const idRol =
    firstNumber(raw?.id_rol, raw?.roles?.id_rol, raw?.rol?.id_rol, raw?.role?.id_rol) ?? null;

  const rol =
    firstString(
      raw?.roles?.nombre_rol,
      raw?.roles?.rol,
      raw?.roles?.nombre,
      raw?.rol?.nombre_rol,
      raw?.rol?.rol,
      raw?.rol?.nombre,
      raw?.role?.nombre_rol,
      raw?.role?.rol,
      raw?.role?.nombre
    ) ||
    rolesMap.get(idRol ?? -1)?.label ||
    "—";

  const relacionesBodega = Array.isArray(raw?.bodegas_por_usuario)
    ? raw.bodegas_por_usuario
    : Array.isArray(raw?.bodegasPorUsuario)
    ? raw.bodegasPorUsuario
    : [];

  const bodegasIds = uniqueNumbers(
    relacionesBodega.map((item: any) =>
      firstNumber(item?.id_bodega, item?.bodega?.id_bodega, item?.bodega?.id)
    )
  );

  const bodegasLabels = uniqueStrings(
    relacionesBodega.map((item: any) => {
      const idBodega = firstNumber(item?.id_bodega, item?.bodega?.id_bodega, item?.bodega?.id);
      return (
        firstString(item?.bodega?.nombre_bodega, item?.bodega?.nombre) ||
        (idBodega ? bodegasMap.get(idBodega)?.label : "") ||
        ""
      );
    })
  );

  return {
    id,
    idTipoDoc,
    tipoDocumento,
    numeroDocumento: firstString(raw?.num_documento, raw?.numero_documento, raw?.documento),
    nombre: firstString(raw?.nombre),
    apellido: firstString(raw?.apellido),
    email: firstString(raw?.email),
    telefono: firstString(raw?.telefono),
    idRol,
    rol,
    estado: toBoolean(raw?.estado),
    bodegasIds,
    bodegas: bodegasLabels,
  };
}

/* =========================================================
   HELPERS BODEGAS POR USUARIO
========================================================= */

async function createBodegaUsuarioRelation(payload: { id_usuario: number; id_bodega: number }) {
  let lastError: any = null;

  for (const base of BPU_BASE_ENDPOINTS) {
    try {
      await api.post(base, payload);
      return;
    } catch (error: any) {
      if (error?.response?.status === 409) {
        return;
      }
      lastError = error;
    }
  }

  throw lastError;
}

async function deleteBodegaUsuarioRelation(idUsuario: number, idBodega: number) {
  let lastError: any = null;

  const strategies = [
    () => api.delete(`${BPU_BASE_ENDPOINTS[0]}/${idUsuario}/${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[1]}/${idUsuario}/${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[2]}/${idUsuario}/${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[3]}/${idUsuario}/${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[4]}/${idUsuario}/${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[5]}/${idUsuario}/${idBodega}`),

    () => api.delete(`${BPU_BASE_ENDPOINTS[0]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[1]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[2]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[3]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[4]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),
    () => api.delete(`${BPU_BASE_ENDPOINTS[5]}?id_usuario=${idUsuario}&id_bodega=${idBodega}`),

    () => api.delete(BPU_BASE_ENDPOINTS[0], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
    () => api.delete(BPU_BASE_ENDPOINTS[1], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
    () => api.delete(BPU_BASE_ENDPOINTS[2], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
    () => api.delete(BPU_BASE_ENDPOINTS[3], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
    () => api.delete(BPU_BASE_ENDPOINTS[4], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
    () => api.delete(BPU_BASE_ENDPOINTS[5], { data: { id_usuario: idUsuario, id_bodega: idBodega } }),
  ];

  for (const strategy of strategies) {
    try {
      await strategy();
      return;
    } catch (error: any) {
      lastError = error;
    }
  }

  throw lastError;
}

async function syncBodegasUsuario(
  idUsuario: number,
  actuales: number[],
  deseadas: number[]
) {
  const actualesSet = new Set(actuales);
  const deseadasSet = new Set(deseadas);

  const porCrear = deseadas.filter((id) => !actualesSet.has(id));
  const porEliminar = actuales.filter((id) => !deseadasSet.has(id));

  for (const idBodega of porEliminar) {
    await deleteBodegaUsuarioRelation(idUsuario, idBodega);
  }

  for (const idBodega of porCrear) {
    await createBodegaUsuarioRelation({
      id_usuario: idUsuario,
      id_bodega: idBodega,
    });
  }
}

/* =========================================================
   VALIDACIONES
========================================================= */

function validateTipoDoc(value: string) {
  if (!value) return "Debes seleccionar el tipo de documento";
  return "";
}

function validateNumeroDocumento(value: string) {
  if (!value.trim()) return "El número de documento es requerido";
  if (!/^[0-9]+$/.test(value)) return "Solo se permiten números";
  if (value.trim().length < 6) return "Mínimo 6 dígitos";
  if (value.trim().length > 20) return "Máximo 20 dígitos";
  return "";
}

function validateNombre(value: string) {
  if (!value.trim()) return "El nombre es requerido";
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras";
  if (value.trim().length < 2) return "Mínimo 2 caracteres";
  if (value.trim().length > 100) return "Máximo 100 caracteres";
  return "";
}

function validateApellido(value: string) {
  if (!value.trim()) return "El apellido es requerido";
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras";
  if (value.trim().length < 2) return "Mínimo 2 caracteres";
  if (value.trim().length > 100) return "Máximo 100 caracteres";
  return "";
}

function validateEmailField(value: string) {
  if (!value.trim()) return "El correo es requerido";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Formato de correo inválido";
  if (value.trim().length > 100) return "Máximo 100 caracteres";
  return "";
}

function validateTelefonoField(value: string) {
  if (!value.trim()) return "";
  if (!/^[0-9]+$/.test(value)) return "Solo se permiten números";
  if (value.trim().length < 7) return "Mínimo 7 dígitos";
  if (value.trim().length > 30) return "Máximo 30 dígitos";
  return "";
}

function validateBodegasField(value: number[]) {
  if (value.length === 0) return "Debes seleccionar al menos una bodega";
  return "";
}

function validateRolField(value: string) {
  if (!value) return "Debes seleccionar un rol";
  return "";
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Usuarios() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const loggedUserId =
    firstNumber((usuario as any)?.id, (usuario as any)?.id_usuario) ?? null;

  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<CatalogOption[]>([]);
  const [roles, setRoles] = useState<CatalogOption[]>([]);
  const [bodegas, setBodegas] = useState<CatalogOption[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingEstado, setIsChangingEstado] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [usuarioParaCambioEstado, setUsuarioParaCambioEstado] = useState<UsuarioRow | null>(null);

  // Formulario
  const [formTipoDocId, setFormTipoDocId] = useState("");
  const [formNumeroDoc, setFormNumeroDoc] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formApellido, setFormApellido] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formBodegasIds, setFormBodegasIds] = useState<number[]>([]);
  const [formRolId, setFormRolId] = useState("");

  const [errors, setErrors] = useState<FormErrors>({
    tipoDoc: "",
    numeroDoc: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    bodegas: "",
    rol: "",
  });

  const [touched, setTouched] = useState<FormTouched>({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    apellido: false,
    email: false,
    telefono: false,
    bodegas: false,
    rol: false,
  });

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

  const closeToList = () => navigate("/app/usuarios");

  const rolesMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const tiposMap = useMemo(() => new Map(tiposDocumento.map((t) => [t.id, t])), [tiposDocumento]);
  const bodegasMap = useMemo(() => new Map(bodegas.map((b) => [b.id, b])), [bodegas]);

  async function cargarCatalogos() {
    const [tiposRaw, rolesRaw, bodegasRaw] = await Promise.all([
      fetchFirstWorkingList<ApiTipoDocumento>(TIPO_DOCUMENTO_ENDPOINTS),
      fetchFirstWorkingList<ApiRol>(ROL_ENDPOINTS),
      fetchFirstWorkingList<ApiBodega>(BODEGA_ENDPOINTS),
    ]);

    const tiposMapeados = tiposRaw
      .map(mapTipoDocumentoOption)
      .filter((item): item is CatalogOption => !!item)
      .sort((a, b) => a.label.localeCompare(b.label));

    const rolesMapeados = rolesRaw
      .map(mapRolOption)
      .filter((item): item is CatalogOption => !!item)
      .sort((a, b) => a.label.localeCompare(b.label));

    const bodegasMapeadas = bodegasRaw
      .map(mapBodegaOption)
      .filter((item): item is CatalogOption => !!item)
      .sort((a, b) => a.label.localeCompare(b.label));

    if (tiposMapeados.length === 0) {
      throw new Error("No se cargaron tipos de documento desde /tipo-documento");
    }

    setTiposDocumento(tiposMapeados);
    setRoles(rolesMapeados);
    setBodegas(bodegasMapeadas);

    return {
      tiposDocumento: tiposMapeados,
      roles: rolesMapeados,
      bodegas: bodegasMapeadas,
    };
  }

  async function cargarUsuarios(
    cat?: {
      tiposDocumento: CatalogOption[];
      roles: CatalogOption[];
      bodegas: CatalogOption[];
    }
  ) {
    const response = await api.get(USUARIO_ENDPOINT);
    const rawUsers = normalizeListResponse<ApiUsuario>(response.data);

    const catalogos = cat ?? {
      tiposDocumento,
      roles,
      bodegas,
    };

    const usuariosMapeados = rawUsers
      .map((raw) =>
        mapUsuarioApiToRow(
          raw,
          catalogos.roles,
          catalogos.tiposDocumento,
          catalogos.bodegas
        )
      )
      .sort((a, b) => b.id - a.id);

    setUsuarios(usuariosMapeados);
  }

  async function cargarTodo() {
    setIsLoadingInitial(true);
    try {
      const catalogos = await cargarCatalogos();
      await cargarUsuarios(catalogos);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "No se pudo cargar el módulo de usuarios"));
    } finally {
      setIsLoadingInitial(false);
    }
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  useEffect(() => {
    if (isLoadingInitial) return;
    if (!isVer && !isEditar && !isEliminar) return;

    if (!usuarioSeleccionado) {
      closeToList();
    }
  }, [isLoadingInitial, isVer, isEditar, isEliminar, usuarioSeleccionado]);

  function resetForm() {
    setFormTipoDocId("");
    setFormNumeroDoc("");
    setFormNombre("");
    setFormApellido("");
    setFormEmail("");
    setFormTelefono("");
    setFormBodegasIds([]);
    setFormRolId("");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
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
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }

  useEffect(() => {
    if (!isCrear) return;
    resetForm();
  }, [isCrear]);

  useEffect(() => {
    if (!isEditar || !usuarioSeleccionado) return;

    setFormTipoDocId(usuarioSeleccionado.idTipoDoc ? String(usuarioSeleccionado.idTipoDoc) : "");
    setFormNumeroDoc(usuarioSeleccionado.numeroDocumento);
    setFormNombre(usuarioSeleccionado.nombre);
    setFormApellido(usuarioSeleccionado.apellido);
    setFormEmail(usuarioSeleccionado.email);
    setFormTelefono(usuarioSeleccionado.telefono ?? "");
    setFormBodegasIds(usuarioSeleccionado.bodegasIds);
    setFormRolId(usuarioSeleccionado.idRol ? String(usuarioSeleccionado.idRol) : "");

    setErrors({
      tipoDoc: "",
      numeroDoc: "",
      nombre: "",
      apellido: "",
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
      email: false,
      telefono: false,
      bodegas: false,
      rol: false,
    });
  }, [isEditar, usuarioSeleccionado]);

  function validateForm() {
    const nextTouched: FormTouched = {
      tipoDoc: true,
      numeroDoc: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      bodegas: true,
      rol: true,
    };

    const nextErrors: FormErrors = {
      tipoDoc: validateTipoDoc(formTipoDocId),
      numeroDoc: validateNumeroDocumento(formNumeroDoc),
      nombre: validateNombre(formNombre),
      apellido: validateApellido(formApellido),
      email: validateEmailField(formEmail),
      telefono: validateTelefonoField(formTelefono),
      bodegas: validateBodegasField(formBodegasIds),
      rol: validateRolField(formRolId),
    };

    setTouched(nextTouched);
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      toast.error("Por favor corrige los errores del formulario");
      return false;
    }

    return true;
  }

  const filteredUsuarios = useMemo(() => {
    return usuarios
      .filter((u) => {
        if (estadoFilter === "todos") return true;
        return estadoFilter === "activos" ? u.estado : !u.estado;
      })
      .filter((u) => {
        const q = normalizeText(searchTerm);
        if (!q) return true;

        return [
          u.nombre,
          u.apellido,
          `${u.nombre} ${u.apellido}`,
          u.email,
          u.telefono,
          u.numeroDocumento,
          u.tipoDocumento,
          u.rol,
          ...u.bodegas,
        ].some((field) => normalizeText(field || "").includes(q));
      });
  }, [usuarios, estadoFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  function handleNumeroDocChange(value: string) {
    setFormNumeroDoc(value);
    if (touched.numeroDoc) {
      setErrors((prev) => ({ ...prev, numeroDoc: validateNumeroDocumento(value) }));
    }
  }

  function handleNombreChange(value: string) {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors((prev) => ({ ...prev, nombre: validateNombre(value) }));
    }
  }

  function handleApellidoChange(value: string) {
    setFormApellido(value);
    if (touched.apellido) {
      setErrors((prev) => ({ ...prev, apellido: validateApellido(value) }));
    }
  }

  function handleEmailChange(value: string) {
    setFormEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmailField(value) }));
    }
  }

  function handleTelefonoChange(value: string) {
    setFormTelefono(value);
    if (touched.telefono) {
      setErrors((prev) => ({ ...prev, telefono: validateTelefonoField(value) }));
    }
  }

  function handleTipoDocChange(value: string) {
    setFormTipoDocId(value);
    setTouched((prev) => ({ ...prev, tipoDoc: true }));
    setErrors((prev) => ({ ...prev, tipoDoc: validateTipoDoc(value) }));
  }

  function handleRolChange(value: string) {
    setFormRolId(value);
    setTouched((prev) => ({ ...prev, rol: true }));
    setErrors((prev) => ({ ...prev, rol: validateRolField(value) }));
  }

  function handleNumeroDocBlur() {
    setTouched((prev) => ({ ...prev, numeroDoc: true }));
    setErrors((prev) => ({ ...prev, numeroDoc: validateNumeroDocumento(formNumeroDoc) }));
  }

  function handleNombreBlur() {
    setTouched((prev) => ({ ...prev, nombre: true }));
    setErrors((prev) => ({ ...prev, nombre: validateNombre(formNombre) }));
  }

  function handleApellidoBlur() {
    setTouched((prev) => ({ ...prev, apellido: true }));
    setErrors((prev) => ({ ...prev, apellido: validateApellido(formApellido) }));
  }

  function handleEmailBlur() {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmailField(formEmail) }));
  }

  function handleTelefonoBlur() {
    setTouched((prev) => ({ ...prev, telefono: true }));
    setErrors((prev) => ({ ...prev, telefono: validateTelefonoField(formTelefono) }));
  }

  function toggleBodega(idBodega: number) {
    const next = formBodegasIds.includes(idBodega)
      ? formBodegasIds.filter((id) => id !== idBodega)
      : [...formBodegasIds, idBodega];

    setFormBodegasIds(next);
    setTouched((prev) => ({ ...prev, bodegas: true }));
    setErrors((prev) => ({ ...prev, bodegas: validateBodegasField(next) }));
  }

  function handleView(u: UsuarioRow) {
    navigate(`/app/usuarios/${u.id}/ver`);
  }

  function handleCreate() {
    resetForm();
    navigate("/app/usuarios/crear");
  }

  function handleEdit(u: UsuarioRow) {
    navigate(`/app/usuarios/${u.id}/editar`);
  }

  function handleDelete(u: UsuarioRow) {
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      return;
    }

    navigate(`/app/usuarios/${u.id}/eliminar`);
  }

  async function confirmCreate() {
    if (isSaving) return;
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const payload = {
        nombre: formNombre.trim(),
        apellido: formApellido.trim(),
        id_tipo_doc: Number(formTipoDocId),
        num_documento: formNumeroDoc.trim(),
        email: formEmail.trim(),
        id_rol: Number(formRolId),
        telefono: formTelefono.trim() || undefined,
        estado: true,
      };

      const response = await api.post(USUARIO_ENDPOINT, payload);
      const created = response.data;

      const idUsuarioCreado =
        firstNumber(
          created?.id_usuario,
          created?.usuario?.id_usuario,
          created?.data?.id_usuario
        ) ?? null;

      if (!idUsuarioCreado) {
        throw new Error("No se recibió el id del usuario creado");
      }

      await syncBodegasUsuario(idUsuarioCreado, [], formBodegasIds);

      // Recarga completa para asegurar catálogo + lista actualizada
      await cargarTodo();

      // Lleva el listado a la primera página
      setCurrentPage(1);

      // Opcional pero recomendado para que sí lo veas de inmediato
      setSearchTerm("");
      setEstadoFilter("todos");

      closeToList();
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "No se pudo crear el usuario"));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmEdit() {
    if (!usuarioSeleccionado || isSaving) return;
    if (!validateForm()) return;

    if (isSelfEdit && Number(formRolId) !== usuarioSeleccionado.idRol) {
      toast.error("No puedes cambiar tu propio rol mientras estás logueado");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        nombre: formNombre.trim(),
        apellido: formApellido.trim(),
        id_tipo_doc: Number(formTipoDocId),
        num_documento: formNumeroDoc.trim(),
        email: formEmail.trim(),
        id_rol: isSelfEdit ? usuarioSeleccionado.idRol : Number(formRolId),
        telefono: formTelefono.trim() || null,
      };

      await api.patch(`${USUARIO_ENDPOINT}/${usuarioSeleccionado.id}`, payload);

      await syncBodegasUsuario(
        usuarioSeleccionado.id,
        usuarioSeleccionado.bodegasIds,
        formBodegasIds
      );

      await cargarUsuarios();

      toast.success("Usuario actualizado exitosamente");
      closeToList();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "No se pudo actualizar el usuario"));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!usuarioSeleccionado || isDeleting) return;

    if (loggedUserId && usuarioSeleccionado.id === loggedUserId) {
      toast.error("No puedes eliminar tu propio usuario");
      closeToList();
      return;
    }

    setIsDeleting(true);

    try {
      if (usuarioSeleccionado.bodegasIds.length > 0) {
        await syncBodegasUsuario(usuarioSeleccionado.id, usuarioSeleccionado.bodegasIds, []);
      }

      await api.delete(`${USUARIO_ENDPOINT}/${usuarioSeleccionado.id}`);
      await cargarUsuarios();

      toast.success("Usuario eliminado exitosamente");
      closeToList();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "No se pudo eliminar el usuario"));
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleEstado(u: UsuarioRow) {
    if (loggedUserId && u.id === loggedUserId) {
      toast.error("No puedes cambiar tu propio estado");
      return;
    }

    setUsuarioParaCambioEstado(u);
    setShowConfirmEstadoModal(true);
  }

  async function handleConfirmEstado() {
    if (!usuarioParaCambioEstado || isChangingEstado) return;

    if (loggedUserId && usuarioParaCambioEstado.id === loggedUserId) {
      toast.error("No puedes cambiar tu propio estado");
      setShowConfirmEstadoModal(false);
      setUsuarioParaCambioEstado(null);
      return;
    }

    setIsChangingEstado(true);

    try {
      await api.patch(`${USUARIO_ENDPOINT}/${usuarioParaCambioEstado.id}`, {
        estado: !usuarioParaCambioEstado.estado,
      });

      await cargarUsuarios();

      toast.success(
        `Usuario ${usuarioParaCambioEstado.estado ? "desactivado" : "activado"} exitosamente`
      );

      setShowConfirmEstadoModal(false);
      setUsuarioParaCambioEstado(null);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "No se pudo cambiar el estado"));
    } finally {
      setIsChangingEstado(false);
    }
  }

  function getRolBadgeColor(rolNombre: string) {
    const rol = normalizeText(rolNombre);

    if (rol.includes("admin")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (rol.includes("vendedor")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rol.includes("bodega")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (rol.includes("conductor")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (rol.includes("auxiliar")) return "bg-cyan-100 text-cyan-800 border-cyan-200";

    return "bg-gray-100 text-gray-800 border-gray-200";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Gestión de Usuarios</h2>
        <p className="text-gray-600 mt-1">
          Administra los usuarios del sistema
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar usuarios..."
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
            className={`h-8 ${
              estadoFilter === "todos"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "hover:bg-gray-200"
            }`}
          >
            Todos
          </Button>

          <Button
            size="sm"
            variant={estadoFilter === "activos" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("activos")}
            className={`h-8 ${
              estadoFilter === "activos"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "hover:bg-gray-200"
            }`}
          >
            Activos
          </Button>

          <Button
            size="sm"
            variant={estadoFilter === "inactivos" ? "default" : "ghost"}
            onClick={() => setEstadoFilter("inactivos")}
            className={`h-8 ${
              estadoFilter === "inactivos"
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
          disabled={isLoadingInitial}
        >
          <Plus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Bodegas Asignadas</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-40">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingInitial ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando usuarios...
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                currentUsuarios.map((item, index) => {
                  const isSelfRow = !!loggedUserId && item.id === loggedUserId;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{startIndex + index + 1}</TableCell>

                      <TableCell className="font-medium text-gray-900">
                        {item.nombre} {item.apellido}
                      </TableCell>

                      <TableCell className="text-gray-700">{item.email}</TableCell>

                      <TableCell className="text-gray-700">
                        {item.telefono || "—"}
                      </TableCell>

                      <TableCell className="max-w-[260px] whitespace-normal break-words">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 whitespace-normal"
                        >
                          {item.bodegas.length > 0 ? item.bodegas.join(", ") : "Sin bodegas"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRolBadgeColor(item.rol)}
                        >
                          {item.rol}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelfRow || isChangingEstado}
                          onClick={() => toggleEstado(item)}
                          className={`${
                            item.estado
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          } ${isSelfRow ? "opacity-40 cursor-not-allowed" : ""}`}
                          title={
                            isSelfRow
                              ? "No puedes cambiar tu propio estado"
                              : "Cambiar estado"
                          }
                        >
                          {item.estado ? "Activo" : "Inactivo"}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(item)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={isSelfRow}
                            className={`h-8 w-8 ${
                              isSelfRow
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

      {filteredUsuarios.length > 0 && !isLoadingInitial && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredUsuarios.length)} de{" "}
            {filteredUsuarios.length} usuarios
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* VER */}
      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl"
          aria-describedby="view-usuario-description"
          onInteractOutside={(e) => e.preventDefault()}
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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                    </h3>

                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="outline" className="bg-white">
                        {usuarioSeleccionado.tipoDocumento}: {usuarioSeleccionado.numeroDocumento}
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

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Información de Contacto
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Label className="text-xs text-gray-500 mb-1">Correo</Label>
                    <p className="font-medium text-gray-900">{usuarioSeleccionado.email}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <Label className="text-xs text-gray-500 mb-1">Teléfono</Label>
                    <p className="font-medium text-gray-900">
                      {usuarioSeleccionado.telefono || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Asignación de Bodegas
                </h4>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <Label className="text-xs text-gray-500 mb-1">Bodegas Asignadas</Label>
                  <p className="font-medium text-gray-900">
                    {usuarioSeleccionado.bodegas.length > 0
                      ? usuarioSeleccionado.bodegas.join(", ")
                      : "Sin bodegas asignadas"}
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

      {/* CREAR */}
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
              Completa la información del nuevo usuario. La contraseña no se define aquí.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDocId} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue placeholder="Selecciona tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.label}
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
                <Label htmlFor="create-email">Correo *</Label>
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
                <Label htmlFor="create-telefono">Teléfono</Label>
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
                <Label htmlFor="create-bodega">Bodegas Asignadas *</Label>
                <div className="space-y-2 mt-2 border border-gray-200 rounded-md p-3">
                  {bodegas.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay bodegas disponibles</p>
                  ) : (
                    bodegas.map((bodega) => (
                      <div key={bodega.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-bodega-${bodega.id}`}
                          checked={formBodegasIds.includes(bodega.id)}
                          onCheckedChange={() => toggleBodega(bodega.id)}
                        />
                        <label
                          htmlFor={`create-bodega-${bodega.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {bodega.label}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {errors.bodegas && touched.bodegas && (
                  <p className="text-red-500 text-sm mt-1">{errors.bodegas}</p>
                )}
              </div>

              <div>
                <Label htmlFor="create-rol">Rol *</Label>
                <Select value={formRolId} onValueChange={handleRolChange}>
                  <SelectTrigger id="create-rol">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>
                        {rol.label}
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
            <Button variant="outline" onClick={closeToList} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDITAR */}
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
                <Select value={formTipoDocId} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue placeholder="Selecciona tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.label}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="edit-email">Correo *</Label>
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
                <Label htmlFor="edit-telefono">Teléfono</Label>
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
                  {bodegas.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay bodegas disponibles</p>
                  ) : (
                    bodegas.map((bodega) => (
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
                          {bodega.label}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {errors.bodegas && touched.bodegas && (
                  <p className="text-red-500 text-sm mt-1">{errors.bodegas}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-rol">Rol *</Label>
                <Select
                  value={formRolId}
                  onValueChange={handleRolChange}
                  disabled={isSelfEdit}
                >
                  <SelectTrigger
                    id="edit-rol"
                    className={isSelfEdit ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>
                        {rol.label}
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
            <Button variant="outline" onClick={closeToList} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ELIMINAR */}
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
                Correo: {usuarioSeleccionado.email}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!!loggedUserId && usuarioSeleccionado?.id === loggedUserId || isDeleting}
              title={
                !!loggedUserId && usuarioSeleccionado?.id === loggedUserId
                  ? "No puedes eliminar tu propio usuario"
                  : "Eliminar"
              }
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAMBIO DE ESTADO */}
      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
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
              <span className="font-medium">
                {usuarioParaCambioEstado?.nombre} {usuarioParaCambioEstado?.apellido}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado actual:</span>
              <span
                className={`font-medium ${
                  usuarioParaCambioEstado?.estado ? "text-green-700" : "text-red-700"
                }`}
              >
                {usuarioParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo estado:</span>
              <span
                className={`font-medium ${
                  !usuarioParaCambioEstado?.estado ? "text-green-700" : "text-red-700"
                }`}
              >
                {!usuarioParaCambioEstado?.estado ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmEstadoModal(false)}
              disabled={isChangingEstado}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isChangingEstado}
            >
              {isChangingEstado && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ÉXITO CREACIÓN */}
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
              El usuario ha sido creado correctamente en el sistema.
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
