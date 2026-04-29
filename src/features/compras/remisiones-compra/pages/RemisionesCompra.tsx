import { useState, useMemo, useEffect, useRef } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Ban,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  Barcode,
  Download,
  Loader2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import { Badge } from "../../../../shared/components/ui/badge";
import logoVManage from "../../../../assets/images/VLogo.png";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import type { AppOutletContext } from "../../../../layouts/MainLayout";
import { ESTADO_REMISION_IDS } from "../services/remisiones-compra.mapper";
import {
  cambiarEstadoRemisionCompra,
  createRemisionCompra,
  getCompraById,
  getComprasOptions,
  getRemisionCompraById,
  getRemisionesCompra,
  getSiguienteCodigoRemision,
  updateRemisionCompra,
} from "../services/remisiones-compra.services";
import type {
  CompraDetail,
  CompraOption,
  RemisionCompraUI,
} from "../services/remisiones-compras.types";

type ItemForm = {
  localId: string;
  id_producto: number;
  productoNombre: string;
  cantidad: string;
  precio_unitario: number;
  id_iva: number;
  ivaPorcentaje: number;
  lote: string;
  fecha_vencimiento: string;
  codigo_barras: string;
  nota: string;
};

type FormState = {
  numeroRemision: string;
  id_compra: string;
  ordenCompra: string;
  id_proveedor: string;
  proveedor: string;
  proveedorTipoDocumento: string;
  proveedorNumeroDocumento: string;
  id_bodega: string;
  bodega: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  observaciones: string;
  idFactura: string;
};

const makeLocalId = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    //
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as any;

  console.error("ERROR COMPLETO:", err);
  console.error("ERROR RESPONSE DATA:", err?.response?.data);

  const candidates = [
    err?.response?.data?.message,
    err?.response?.data?.error?.message,
    err?.response?.data?.error,
    err?.response?.data?.detail,
    err?.response?.data?.errors,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string" && value.trim()) return value;
  }

  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message;
  }

  return fallback;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO");
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(value || 0);

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const buildEmptyForm = (): FormState => ({
  numeroRemision: "",
  id_compra: "",
  ordenCompra: "",
  id_proveedor: "",
  proveedor: "",
  proveedorTipoDocumento: "",
  proveedorNumeroDocumento: "",
  id_bodega: "",
  bodega: "",
  fechaCreacion: new Date().toISOString().split("T")[0],
  fechaVencimiento: "",
  observaciones: "",
  idFactura: "",
});

const MAX_OBSERVACIONES_LENGTH = 255;
const MAX_LOTE_LENGTH = 50;
const MAX_CODIGO_BARRAS_LENGTH = 80;
const MAX_NOTA_ITEM_LENGTH = 255;

const loteRegex = /^[a-zA-Z0-9\s._-]+$/;
const codigoBarrasRegex = /^[a-zA-Z0-9._-]+$/;

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const extractNumberFromUnknown = (value: unknown): number | undefined => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

const extractStringFromUnknown = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
};

const extractBodegaIdFromUnknown = (
  value: unknown,
  depth = 0
): number | undefined => {
  if (depth > 5 || value === null || value === undefined) return undefined;

  const direct = extractNumberFromUnknown(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractBodegaIdFromUnknown(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof value !== "object") return undefined;

  const obj = value as Record<string, unknown>;

  const directCandidates: unknown[] = [
    obj.selectedBodegaId,
    obj.idBodega,
    obj.id_bodega,
    obj.idBodegaActiva,
    obj.id_bodega_activa,
    (obj.selectedBodega as any)?.id,
    (obj.selectedBodega as any)?.idBodega,
    (obj.selectedBodega as any)?.id_bodega,
    (obj.bodega as any)?.id,
    (obj.bodega as any)?.idBodega,
    (obj.bodega as any)?.id_bodega,
    (obj.activeBodega as any)?.id,
    (obj.activeBodega as any)?.idBodega,
    (obj.activeBodega as any)?.id_bodega,
  ];

  for (const candidate of directCandidates) {
    const found = extractNumberFromUnknown(candidate);
    if (found) return found;
  }

  for (const candidate of Object.values(obj)) {
    const found = extractBodegaIdFromUnknown(candidate, depth + 1);
    if (found) return found;
  }

  return undefined;
};

const extractBodegaNombreFromUnknown = (
  value: unknown,
  depth = 0
): string | undefined => {
  if (depth > 5 || value === null || value === undefined) return undefined;

  const directString = extractStringFromUnknown(value);
  if (directString) return directString;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractBodegaNombreFromUnknown(item, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof value !== "object") return undefined;

  const obj = value as Record<string, unknown>;

  const directCandidates: unknown[] = [
    obj.selectedBodegaNombre,
    obj.selectedBodegaName,
    obj.bodegaNombreActiva,
    obj.nombre_bodega,
    obj.nombreBodega,
    (obj.selectedBodega as any)?.nombre_bodega,
    (obj.selectedBodega as any)?.nombreBodega,
    (obj.selectedBodega as any)?.nombre,
    (obj.bodega as any)?.nombre_bodega,
    (obj.bodega as any)?.nombreBodega,
    (obj.bodega as any)?.nombre,
    (obj.activeBodega as any)?.nombre_bodega,
    (obj.activeBodega as any)?.nombreBodega,
    (obj.activeBodega as any)?.nombre,
  ];

  for (const candidate of directCandidates) {
    const found = extractStringFromUnknown(candidate);
    if (found) return found;
  }

  for (const candidate of Object.values(obj)) {
    const found = extractBodegaNombreFromUnknown(candidate, depth + 1);
    if (found) return found;
  }

  return undefined;
};

const getStoredBodegaState = () => {
  if (typeof window === "undefined") {
    return {
      id: undefined as number | undefined,
      nombre: "",
    };
  }

  const storages = [window.localStorage, window.sessionStorage];

  let foundId: number | undefined;
  let foundNombre = "";

  for (const storage of storages) {
    const rawSelectedBodega = storage.getItem("selectedBodega");
    const rawSelectedBodegaId =
      storage.getItem("selectedBodegaId") ||
      storage.getItem("idBodegaActiva") ||
      storage.getItem("id_bodega_activa");

    const rawSelectedBodegaNombre =
      storage.getItem("selectedBodegaNombre") ||
      storage.getItem("selectedBodegaName");

    if (!foundId && rawSelectedBodegaId) {
      foundId = extractNumberFromUnknown(rawSelectedBodegaId);
    }

    if (!foundNombre && rawSelectedBodegaNombre) {
      foundNombre = extractStringFromUnknown(rawSelectedBodegaNombre) ?? "";
    }

    if (rawSelectedBodega) {
      const parsed = safeJsonParse(rawSelectedBodega);

      if (parsed !== undefined) {
        if (!foundId) {
          foundId = extractBodegaIdFromUnknown(parsed);
        }

        if (!foundNombre) {
          foundNombre = extractBodegaNombreFromUnknown(parsed) ?? "";
        }
      }
    }

    if (foundId || foundNombre) break;
  }

  return {
    id: foundId,
    nombre: foundNombre,
  };
};

const renderReadonlyBox = (
  value: string,
  emptyLabel = "—"
) => (
  <div className="h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-500 flex items-center">
    {value || emptyLabel}
  </div>
);

type PdfImageInfo = {
  dataUrl: string;
  width: number;
  height: number;
};

const loadImageInfoAsDataUrl = (src: string): Promise<PdfImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => reject(new Error("No se pudo cargar el logo"));
    img.src = src;
  });
};

export default function RemisionesCompra() {
  const { selectedBodegaId, selectedBodegaNombre } = useOutletContext<
    AppOutletContext & {
      selectedBodegaId?: number;
      selectedBodegaNombre?: string;
    }
  >();

  const [storedBodega, setStoredBodega] = useState<{
    id?: number;
    nombre: string;
  }>({
    id: undefined,
    nombre: "",
  });

  const [bodegaReady, setBodegaReady] = useState(false);

  useEffect(() => {
    const contextReady =
      Number.isInteger(Number(selectedBodegaId)) ||
      normalizeText(selectedBodegaNombre) === normalizeText("Todas las bodegas");

    if (contextReady) {
      setStoredBodega({
        id: selectedBodegaId,
        nombre: selectedBodegaNombre || "",
      });
      setBodegaReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      const stored = getStoredBodegaState();
      setStoredBodega(stored);
      setBodegaReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedBodegaId, selectedBodegaNombre]);

  const effectiveSelectedBodegaNombre =
    (selectedBodegaNombre || storedBodega.nombre || "").trim();

  const isTodasLasBodegas =
    normalizeText(effectiveSelectedBodegaNombre) ===
    normalizeText("Todas las bodegas");

  const effectiveSelectedBodegaId = isTodasLasBodegas
    ? undefined
    : selectedBodegaId ?? storedBodega.id;

  const hasResolvedBodega =
    bodegaReady &&
    (isTodasLasBodegas ||
      Number.isInteger(Number(effectiveSelectedBodegaId)));

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/remisiones-compra/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");
  const isListRoute = location.pathname === "/app/remisiones-compra";

  const closeToList = () => navigate("/app/remisiones-compra");

  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingDetalleRemision, setLoadingDetalleRemision] = useState(false);
  const [loadingCompraDetalle, setLoadingCompraDetalle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [remisiones, setRemisiones] = useState<RemisionCompraUI[]>([]);
  const [comprasOptions, setComprasOptions] = useState<CompraOption[]>([]);
  const [selectedCompra, setSelectedCompra] = useState<CompraDetail | null>(null);
  const [selectedRemision, setSelectedRemision] =
    useState<RemisionCompraUI | null>(null);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [remisionParaCambioEstado, setRemisionParaCambioEstado] =
    useState<RemisionCompraUI | null>(null);
  const [nuevoEstadoLabel, setNuevoEstadoLabel] = useState<string | null>(null);
  const [lastCreatedCode, setLastCreatedCode] = useState("");

  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState(false);
  const [remisionParaDescargarPdf, setRemisionParaDescargarPdf] =
    useState<RemisionCompraUI | null>(null);

  const [formData, setFormData] = useState<FormState>(buildEmptyForm());

  const [items, setItems] = useState<ItemForm[]>([]);
  const [currentProducto, setCurrentProducto] = useState("");
  const [currentNumeroLote, setCurrentNumeroLote] = useState("");
  const [currentCantidad, setCurrentCantidad] = useState("");
  const [currentFechaVencimiento, setCurrentFechaVencimiento] = useState("");
  const [currentNota, setCurrentNota] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");

  const [reloadListKey, setReloadListKey] = useState(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const triggerListReload = () => {
    setReloadListKey((prev) => prev + 1);
  };

  const loadRemisiones = async () => {
    const data = await getRemisionesCompra(effectiveSelectedBodegaId);
    setRemisiones(data);
  };

  const loadCompras = async () => {
    const data = await getComprasOptions(effectiveSelectedBodegaId);
    setComprasOptions(data);
  };

  const loadSiguienteCodigo = async () => {
    try {
      const codigo = await getSiguienteCodigoRemision();
      setFormData((prev) => ({
        ...prev,
        numeroRemision: codigo || prev.numeroRemision,
      }));
    } catch {
      //
    }
  };

  const loadInitialData = async () => {
    setLoadingPage(true);
    try {
      await loadRemisiones();
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible cargar las remisiones"));
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!bodegaReady) return;
    if (!isListRoute) return;
    if (!hasResolvedBodega) return;

    void loadInitialData();
  }, [
    bodegaReady,
    effectiveSelectedBodegaId,
    effectiveSelectedBodegaNombre,
    hasResolvedBodega,
    isListRoute,
    reloadListKey,
  ]);

  useEffect(() => {
    if (!bodegaReady) return;
    if (!isCrear) return;
    if (!hasResolvedBodega) return;

    const run = async () => {
      const [comprasResult] = await Promise.allSettled([
        loadCompras(),
        loadSiguienteCodigo(),
      ]);

      if (comprasResult.status === "rejected") {
        toast.error("No fue posible cargar las compras");
      }
    };

    void run();
  }, [
    bodegaReady,
    isCrear,
    hasResolvedBodega,
    effectiveSelectedBodegaId,
    effectiveSelectedBodegaNombre,
  ]);

  const resetItemBuilder = () => {
    setCurrentProducto("");
    setCurrentNumeroLote("");
    setCurrentCantidad("");
    setCurrentFechaVencimiento("");
    setCurrentNota("");
    setCodigoBarras("");
  };

  const resetForm = () => {
    setFormData(buildEmptyForm());
    setItems([]);
    setSelectedCompra(null);
    resetItemBuilder();
  };

  useEffect(() => {
    if (!isCrear) return;
    resetForm();
  }, [isCrear]);

  const applyCompraToForm = (
    compra: CompraDetail,
    options?: {
      keepNumeroRemision?: boolean;
      numeroRemisionFallback?: string;
      keepObservaciones?: boolean;
      observaciones?: string;
      keepFechaVencimiento?: boolean;
      fechaVencimiento?: string;
      keepIdFactura?: boolean;
      idFactura?: string;
    }
  ) => {
    setSelectedCompra(compra);

    setFormData((prev) => ({
      ...prev,
      numeroRemision:
        options?.keepNumeroRemision === true
          ? prev.numeroRemision ||
            options?.numeroRemisionFallback ||
            compra.numeroRemisionSugerido ||
            ""
          : compra.numeroRemisionSugerido ||
            prev.numeroRemision ||
            options?.numeroRemisionFallback ||
            "",
      id_compra: String(compra.id),
      ordenCompra: compra.codigo,
      id_proveedor: String(compra.proveedorId),
      proveedor: compra.proveedorNombre,
      proveedorTipoDocumento: compra.proveedorTipoDocumento || "",
      proveedorNumeroDocumento: compra.proveedorNumeroDocumento || "",
      id_bodega: String(compra.idBodega),
      bodega: compra.bodegaNombre,
      fechaVencimiento:
        options?.keepFechaVencimiento === true
          ? options?.fechaVencimiento ?? prev.fechaVencimiento
          : prev.fechaVencimiento,
      observaciones:
        options?.keepObservaciones === true
          ? options?.observaciones ?? prev.observaciones
          : prev.observaciones,
      idFactura:
        options?.keepIdFactura === true
          ? options?.idFactura ?? prev.idFactura
          : prev.idFactura,
    }));
  };

  useEffect(() => {
    if (!isVer && !isEditar && !isAnular) {
      setSelectedRemision(null);
      return;
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      closeToList();
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoadingDetalleRemision(true);
      try {
        const remision = await getRemisionCompraById(id);
        if (cancelled) return;

        setSelectedRemision(remision);

        if (isEditar) {
          setFormData({
            numeroRemision: remision.numeroRemision,
            id_compra: String(remision.ordenCompraId),
            ordenCompra: remision.ordenCompra,
            id_proveedor: String(remision.proveedorId),
            proveedor: remision.proveedor,
            proveedorTipoDocumento: remision.proveedorTipoDocumento || "",
            proveedorNumeroDocumento: remision.proveedorNumeroDocumento || "",
            id_bodega: String(remision.idBodega),
            bodega: remision.bodega,
            fechaCreacion:
              remision.fecha || new Date().toISOString().split("T")[0],
            fechaVencimiento: remision.fechaVencimiento || "",
            observaciones: remision.observaciones || "",
            idFactura: remision.idFactura ? String(remision.idFactura) : "",
          });

          setItems(
            remision.items.map((item) => ({
              localId: makeLocalId(),
              id_producto: item.id_producto,
              productoNombre: item.productoNombre,
              cantidad: String(item.cantidad),
              precio_unitario: item.precio_unitario,
              id_iva: item.id_iva,
              ivaPorcentaje: item.ivaPorcentaje,
              lote: item.lote || "",
              fecha_vencimiento: item.fecha_vencimiento || "",
              codigo_barras: item.codigo_barras || item.cod_barras || "",
              nota: item.nota || "",
            }))
          );

          try {
            const compra = await getCompraById(remision.ordenCompraId);

            if (!cancelled) {
              setSelectedCompra(compra);
              applyCompraToForm(compra, {
                keepNumeroRemision: true,
                numeroRemisionFallback: remision.numeroRemision,
                keepObservaciones: true,
                observaciones: remision.observaciones || "",
                keepFechaVencimiento: true,
                fechaVencimiento: remision.fechaVencimiento || "",
                keepIdFactura: true,
                idFactura: remision.idFactura ? String(remision.idFactura) : "",
              });
            }
          } catch {
            //
          }

          resetItemBuilder();
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "No fue posible cargar la remisión"));
        closeToList();
      } finally {
        if (!cancelled) setLoadingDetalleRemision(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [params.id, isVer, isEditar, isAnular]);

  const filteredRemisiones = useMemo(() => {
    const q = normalizeText(searchTerm);

    return remisiones.filter((remision) => {
      if (!q) return true;

      return [
        remision.numeroRemision,
        remision.ordenCompra,
        remision.proveedor,
        remision.proveedorTipoDocumento,
        remision.proveedorNumeroDocumento,
        remision.estado,
        remision.bodega,
        String(remision.itemsCount),
      ].some((field) => normalizeText(field).includes(q));
    });
  }, [remisiones, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, effectiveSelectedBodegaNombre, effectiveSelectedBodegaId]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRemisiones.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(startIndex, endIndex);

  const stats = useMemo(() => {
    const totalRemisiones = filteredRemisiones.length;
    const pendientes = filteredRemisiones.filter(
      (r) => r.estadoKey === "PENDIENTE"
    ).length;
    const aplicadas = filteredRemisiones.filter(
      (r) => r.estadoKey === "APLICADA"
    ).length;
    const anuladas = filteredRemisiones.filter(
      (r) => r.estadoKey === "ANULADA"
    ).length;

    return { totalRemisiones, pendientes, aplicadas, anuladas };
  }, [filteredRemisiones]);

  const productosDeCompra = useMemo(() => {
    return selectedCompra?.items ?? [];
  }, [selectedCompra]);

  const productosDisponibles = useMemo(() => {
    if (!selectedCompra) return [];

    return selectedCompra.items.filter((productoCompra) => {
      const cantidadYaAgregada = items
        .filter((i) => i.id_producto === productoCompra.idProducto)
        .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

      return cantidadYaAgregada < productoCompra.cantidad;
    });
  }, [selectedCompra, items]);

  const handleView = (r: RemisionCompraUI) => {
    navigate(`/app/remisiones-compra/${r.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/remisiones-compra/crear");
  };

  const handleEdit = (r: RemisionCompraUI) => {
    if (r.afectaExistencias || r.estadoKey === "APLICADA") {
      toast.info("No puedes editar una remisión que ya aplicó existencias");
      return;
    }
    if (r.estadoKey === "ANULADA") {
      toast.info("No puedes editar una remisión anulada");
      return;
    }
    navigate(`/app/remisiones-compra/${r.id}/editar`);
  };

  const handleAnular = (r: RemisionCompraUI) => {
    if (r.estadoKey === "ANULADA") {
      toast.info("La remisión ya está anulada");
      return;
    }
    if (r.afectaExistencias || r.estadoKey === "APLICADA") {
      toast.info("No debes anular una remisión que ya aplicó existencias");
      return;
    }
    navigate(`/app/remisiones-compra/${r.id}/anular`);
  };

  const handleOrdenCompraChange = async (idCompraValue: string) => {
    if (!idCompraValue) return;

    const compraBase = comprasOptions.find((c) => String(c.id) === idCompraValue);
    if (!compraBase) {
      toast.error("No se encontró la compra seleccionada");
      return;
    }

    setLoadingCompraDetalle(true);
    try {
      const compra = await getCompraById(compraBase.id);

      setItems([]);
      resetItemBuilder();
      applyCompraToForm(compra);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No fue posible cargar el detalle de la compra")
      );
    } finally {
      setLoadingCompraDetalle(false);
    }
  };

  const validateTextLimits = () => {
  if (formData.observaciones.trim().length > MAX_OBSERVACIONES_LENGTH) {
    toast.error(`Las observaciones no pueden superar ${MAX_OBSERVACIONES_LENGTH} caracteres`);
    return false;
  }

  // ID Factura es opcional.
  // Si viene vacío, pasa.
  // Si viene lleno, debe ser número entero mayor a 0.
  if (formData.idFactura.trim()) {
    const factura = Number(formData.idFactura);

    if (!Number.isInteger(factura) || factura <= 0) {
      toast.error("El ID de factura debe ser un número entero mayor a 0");
      return false;
    }
  }

  return true;
};

const validateCurrentItemFields = () => {
  const lote = currentNumeroLote.trim();
  const nota = currentNota.trim();
  const barras = codigoBarras.trim();

  if (lote.length > MAX_LOTE_LENGTH) {
    toast.error(`El lote no puede superar ${MAX_LOTE_LENGTH} caracteres`);
    return false;
  }

  if (!loteRegex.test(lote)) {
    toast.error("El lote solo permite letras, números, espacios, punto, guion y guion bajo");
    return false;
  }

  if (barras.length > MAX_CODIGO_BARRAS_LENGTH) {
    toast.error(`El código de barras no puede superar ${MAX_CODIGO_BARRAS_LENGTH} caracteres`);
    return false;
  }

  if (barras && !codigoBarrasRegex.test(barras)) {
    toast.error("El código de barras solo permite letras, números, punto, guion y guion bajo");
    return false;
  }

  if (nota.length > MAX_NOTA_ITEM_LENGTH) {
    toast.error(`La nota del ítem no puede superar ${MAX_NOTA_ITEM_LENGTH} caracteres`);
    return false;
  }

  return true;
};

const handleAddItem = () => {
  if (!selectedCompra) {
    toast.error("Primero debes seleccionar una orden de compra");
    return;
  }

  if (
    !currentProducto ||
    !currentNumeroLote.trim() ||
    !currentCantidad.trim() ||
    !currentFechaVencimiento
  ) {
    toast.error("Completa producto, lote, cantidad y fecha de vencimiento");
    return;
  }

  if (!validateCurrentItemFields()) return;

  const today = new Date().toISOString().split("T")[0];

  if (currentFechaVencimiento < today) {
    toast.error("La fecha de vencimiento del producto no puede ser anterior a hoy");
    return;
  }

  const compraItem = selectedCompra.items.find(
    (item) => String(item.idProducto) === currentProducto
  );

  if (!compraItem) {
    toast.error("El producto seleccionado no pertenece a la compra");
    return;
  }

  const cantidad = Number(currentCantidad);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    toast.error("La cantidad debe ser mayor a 0");
    return;
  }

  const cantidadYaAgregada = items
    .filter((i) => i.id_producto === compraItem.idProducto)
    .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

  const cantidadDisponible = compraItem.cantidad - cantidadYaAgregada;

  if (cantidad > cantidadDisponible) {
    toast.error(
      `La cantidad supera lo disponible en la compra. Máximo disponible: ${cantidadDisponible}`
    );
    return;
  }

  const duplicado = items.some(
    (item) =>
      item.id_producto === compraItem.idProducto &&
      normalizeText(item.lote) === normalizeText(currentNumeroLote) &&
      item.fecha_vencimiento === currentFechaVencimiento
  );

  if (duplicado) {
    toast.error("Ya agregaste ese producto con el mismo lote y vencimiento");
    return;
  }

  const nuevoItem: ItemForm = {
    localId: makeLocalId(),
    id_producto: compraItem.idProducto,
    productoNombre: compraItem.productoNombre,
    cantidad: String(cantidad),
    precio_unitario: compraItem.precioUnitario,
    id_iva: compraItem.idIva,
    ivaPorcentaje: compraItem.ivaPorcentaje,
    lote: currentNumeroLote.trim(),
    fecha_vencimiento: currentFechaVencimiento,
    codigo_barras: codigoBarras.trim(),
    nota: currentNota.trim(),
  };

  setItems((prev) => [...prev, nuevoItem]);
  resetItemBuilder();
  toast.success("Producto agregado a la remisión");
};

  const handleRemoveItem = (localId: string) => {
    setItems((prev) => prev.filter((item) => item.localId !== localId));
    toast.success("Producto eliminado de la remisión");
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const currentId = e.currentTarget.id;
    const targetId = currentId.startsWith("edit-")
      ? "edit-numeroLote"
      : "numeroLote";

    const loteInput = document.getElementById(targetId) as HTMLInputElement | null;
    loteInput?.focus();
  };

const validateBeforeSubmit = () => {
  const today = new Date().toISOString().split("T")[0];

  if (!formData.id_compra) {
    toast.error("Debes seleccionar una orden de compra válida");
    return false;
  }

  if (Number(formData.id_proveedor) <= 0 || Number(formData.id_bodega) <= 0) {
    toast.error("La compra seleccionada no tiene proveedor o bodega válidos");
    return false;
  }

  if (!validateTextLimits()) return false;

  if (formData.fechaVencimiento && formData.fechaVencimiento < today) {
    toast.error("La fecha de vencimiento de la remisión no puede ser anterior a hoy");
    return false;
  }

  if (items.length === 0) {
    toast.error("Debes agregar al menos un producto a la remisión");
    return false;
  }

  for (const item of items) {
    if (!item.lote.trim()) {
      toast.error(`El producto "${item.productoNombre}" debe tener lote`);
      return false;
    }

    if (!item.fecha_vencimiento) {
      toast.error(`El producto "${item.productoNombre}" debe tener fecha de vencimiento`);
      return false;
    }

    if (item.fecha_vencimiento < today) {
      toast.error(
        `La fecha de vencimiento del producto "${item.productoNombre}" no puede ser anterior a hoy`
      );
      return false;
    }

    if (!Number.isFinite(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
      toast.error(`La cantidad del producto "${item.productoNombre}" debe ser mayor a 0`);
      return false;
    }
  }

  return true;
};

  const buildDetallePayload = () => {
    return items.map((item) => ({
      id_producto: item.id_producto,
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      id_iva: item.id_iva,
      lote: item.lote.trim() || "",
      fecha_vencimiento: item.fecha_vencimiento || undefined,
      codigo_barras: item.codigo_barras?.trim() || undefined,
      nota: item.nota?.trim() || undefined,
    }));
  };

  const confirmCreate = async () => {
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    try {
      const created = await createRemisionCompra({
        id_compra: Number(formData.id_compra),
        id_proveedor: Number(formData.id_proveedor),
        id_bodega: Number(formData.id_bodega),
        id_factura: formData.idFactura ? Number(formData.idFactura) : undefined,
        fecha_vencimiento: formData.fechaVencimiento || undefined,
        observaciones: formData.observaciones.trim() || undefined,
        detalle_remision_compra: buildDetallePayload(),
      });

      setLastCreatedCode(created.numeroRemision);
      resetForm();
      setShowSuccessModal(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible crear la remisión"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEdit = async () => {
    if (!selectedRemision) return;
    if (!validateBeforeSubmit()) return;

    if (
      selectedRemision.afectaExistencias ||
      selectedRemision.estadoKey === "APLICADA"
    ) {
      toast.error("No puedes editar una remisión que ya aplicó existencias");
      return;
    }

    if (selectedRemision.estadoKey === "ANULADA") {
      toast.error("No puedes editar una remisión anulada");
      return;
    }

    setSubmitting(true);
    try {
      await updateRemisionCompra(selectedRemision.id, {
        id_factura: formData.idFactura ? Number(formData.idFactura) : null,
        fecha_vencimiento: formData.fechaVencimiento || null,
        observaciones: formData.observaciones.trim() || "",
        detalle_remision_compra: buildDetallePayload(),
      });

      triggerListReload();
      navigate("/app/remisiones-compra", { replace: true });
      toast.success("Remisión de compra actualizada exitosamente");
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible actualizar la remisión"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAnular = async () => {
    if (!selectedRemision) return;

    if (selectedRemision.estadoKey === "ANULADA") {
      toast.error("La remisión ya está anulada");
      return;
    }

    if (
      selectedRemision.afectaExistencias ||
      selectedRemision.estadoKey === "APLICADA"
    ) {
      toast.error("No debes anular una remisión que ya aplicó existencias");
      return;
    }

    setSubmitting(true);
    try {
      await cambiarEstadoRemisionCompra(selectedRemision.id, {
        id_estado_remision_compra: ESTADO_REMISION_IDS.ANULADA,
      });

      triggerListReload();
      navigate("/app/remisiones-compra", { replace: true });
      toast.success("Remisión de compra anulada exitosamente");
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible anular la remisión"));
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estadoKey: string) => {
    const badges = {
      PENDIENTE: {
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
      },
      APLICADA: {
        class: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      ANULADA: {
        class: "bg-red-100 text-red-800 border-red-200",
        icon: Ban,
      },
      OTRO: {
        class: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Clock,
      },
    };

    return badges[estadoKey as keyof typeof badges] || badges.OTRO;
  };

  const handleEstadoClick = (remision: RemisionCompraUI) => {
    if (remision.estadoKey === "ANULADA") {
      toast.info("No puedes cambiar el estado de una remisión anulada");
      return;
    }

    if (remision.estadoKey === "APLICADA" || remision.afectaExistencias) {
      toast.info("Esta remisión ya fue aprobada/confirmada y aplicó existencias");
      return;
    }

    if (remision.estadoKey !== "PENDIENTE") {
      toast.info("Esta remisión no está en un estado válido para aprobar/confirmar");
      return;
    }

    setRemisionParaCambioEstado(remision);
    setNuevoEstadoLabel("Aprobada / Confirmada");
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = async () => {
    if (!remisionParaCambioEstado) return;

    setSubmitting(true);
    try {
      await cambiarEstadoRemisionCompra(remisionParaCambioEstado.id, {
        id_estado_remision_compra: ESTADO_REMISION_IDS.APLICADA,
      });

      setShowConfirmEstadoModal(false);
      setRemisionParaCambioEstado(null);
      setNuevoEstadoLabel(null);

      triggerListReload();
      navigate("/app/remisiones-compra", { replace: true });

      toast.success(
        "Estado actualizado correctamente y existencias aplicadas desde backend"
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible cambiar el estado"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setLastCreatedCode("");
    navigate("/app/remisiones-compra", { replace: true });
  };

  const generateRemisionPDF = async (
    remision: RemisionCompraUI,
    includePrices: boolean = true
  ) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const rightX = pageWidth - marginX;

    const COLORS = {
      primary: [14, 116, 217] as const,
      primarySoft: [239, 246, 255] as const,
      primaryLine: [191, 219, 254] as const,
      text: [51, 65, 85] as const,
      muted: [100, 116, 139] as const,
      card: [248, 250, 252] as const,
      successBg: [220, 252, 231] as const,
      successText: [22, 101, 52] as const,
      dangerBg: [254, 226, 226] as const,
      dangerText: [153, 27, 27] as const,
      warningBg: [255, 247, 237] as const,
      warningText: [180, 83, 9] as const,
      border: [226, 232, 240] as const,
    };

    const formatMoneyPdf = (value: number) =>
      `$${Number(value || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formatDatePdf = (value?: string | null) =>
      value ? new Date(value).toLocaleDateString("es-CO") : "-";

    const getEstadoStyle = (estado: string) => {
      const normalized = (estado || "").toLowerCase();

      if (
        normalized.includes("aplic") ||
        normalized.includes("recibid") ||
        normalized.includes("aprobad") ||
        normalized.includes("confirm")
      ) {
        return {
          bg: [...COLORS.successBg] as const,
          text: [...COLORS.successText] as const,
          label: estado,
        };
      }

      if (normalized.includes("anulad")) {
        return {
          bg: [...COLORS.dangerBg] as const,
          text: [...COLORS.dangerText] as const,
          label: estado,
        };
      }

      return {
        bg: [...COLORS.warningBg] as const,
        text: [...COLORS.warningText] as const,
        label: estado || "Pendiente",
      };
    };

    let logo: PdfImageInfo | null = null;
    try {
      logo = await loadImageInfoAsDataUrl(logoVManage);
    } catch (error) {
      console.warn("No se pudo cargar el logo para el PDF:", error);
    }

    const subtotalGeneral = remision.items.reduce(
      (acc, item) =>
        acc + Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
      0
    );

    const ivaGeneral = remision.items.reduce((acc, item) => {
      const subtotal =
        Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
      return acc + subtotal * (Number(item.ivaPorcentaje || 0) / 100);
    }, 0);

    const totalGeneral = subtotalGeneral + ivaGeneral;

    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 34, "F");

    doc.setFillColor(9, 92, 181);
    doc.rect(0, 34, pageWidth, 1.2, "F");

    if (logo) {
      const maxLogoWidth = 22;
      const maxLogoHeight = 14;
      const scale = Math.min(
        maxLogoWidth / logo.width,
        maxLogoHeight / logo.height
      );

      const drawWidth = logo.width * scale;
      const drawHeight = logo.height * scale;
      const logoX = marginX;
      const logoY = (34 - drawHeight) / 2;

      doc.addImage(logo.dataUrl, "PNG", logoX, logoY, drawWidth, drawHeight);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("REMISIÓN DE COMPRA", pageWidth / 2, 14.8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      includePrices
        ? "VManage • Gestión empresarial"
        : "VManage • Gestión empresarial",
      pageWidth / 2,
      21.8,
      {
        align: "center",
      }
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.text(`Código: ${remision.numeroRemision || "-"}`, rightX, 11.5, {
      align: "right",
    });
    doc.text(`Fecha: ${formatDatePdf(remision.fecha)}`, rightX, 17.8, {
      align: "right",
    });
    doc.text(
      `Vencimiento: ${formatDatePdf(remision.fechaVencimiento)}`,
      rightX,
      24.1,
      { align: "right" }
    );

    doc.setFillColor(...COLORS.card);
    doc.roundedRect(marginX, 42, pageWidth - marginX * 2, 42, 3, 3, "F");

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Información general", marginX + 4, 49);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);

    const proveedorLines = doc.splitTextToSize(remision.proveedor || "-", 64);

    doc.text("Proveedor:", marginX + 4, 56);
    doc.text(proveedorLines, marginX + 28, 56);

    doc.text("Tipo Doc.:", marginX + 4, 65);
    doc.text(remision.proveedorTipoDocumento || "-", marginX + 28, 65);

    doc.text("N° Documento:", marginX + 4, 74);
    doc.text(remision.proveedorNumeroDocumento || "-", marginX + 32, 74);

    doc.text("Bodega:", 112, 56);
    doc.text(remision.bodega || "-", 128, 56);

    doc.text("Orden compra:", 112, 65);
    doc.text(remision.ordenCompra || "-", 136, 65);

    const estadoStyle = getEstadoStyle(remision.estado);
    doc.setFillColor(...(estadoStyle.bg as [number, number, number]));
    doc.roundedRect(112, 69, 44, 9.5, 3, 3, "F");

    doc.setTextColor(...(estadoStyle.text as [number, number, number]));
    doc.setFont("helvetica", "bold");
    doc.text(`Estado: ${estadoStyle.label}`, 134, 75.4, { align: "center" });

    doc.setDrawColor(...COLORS.primaryLine);
    doc.setLineWidth(0.6);
    doc.line(marginX, 90, rightX, 90);

    const tableData =
      remision.items?.map((item) => {
        const subtotal =
          Number(item.cantidad || 0) * Number(item.precio_unitario || 0);

        const detalleProducto = [
          item.productoNombre || "-",
          item.lote ? `Lote: ${item.lote}` : null,
          item.fecha_vencimiento
            ? `Vence: ${new Date(item.fecha_vencimiento).toLocaleDateString(
                "es-CO"
              )}`
            : null,
          item.codigo_barras || item.cod_barras
            ? `Cod. barras: ${item.codigo_barras || item.cod_barras}`
            : null,
          item.nota ? `Nota: ${item.nota}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        if (includePrices) {
          return [
            detalleProducto,
            String(item.cantidad ?? 0),
            `IVA (${Number(item.ivaPorcentaje || 0).toFixed(2)}%)`,
            formatMoneyPdf(item.precio_unitario || 0),
            formatMoneyPdf(subtotal),
          ];
        }

        return [
          detalleProducto,
          String(item.cantidad ?? 0),
          `IVA (${Number(item.ivaPorcentaje || 0).toFixed(2)}%)`,
        ];
      }) || [];

    autoTable(doc, {
      startY: 96,
      margin: { left: marginX, right: marginX },
      head: includePrices
        ? [["Producto", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]]
        : [["Producto", "Cantidad", "IVA"]],
      body: tableData.length
        ? tableData
        : includePrices
          ? [["Sin productos", "-", "-", "-", "-"]]
          : [["Sin productos", "-", "-"]],
      theme: "grid",
      headStyles: {
        fillColor: [...COLORS.primary],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        valign: "middle",
        lineColor: [...COLORS.primary],
        lineWidth: 0.1,
      },
      bodyStyles: {
        fontSize: 8.3,
        textColor: [...COLORS.text],
        lineColor: [...COLORS.border],
        lineWidth: 0.1,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [...COLORS.primarySoft],
      },
      styles: {
        cellPadding: 3.2,
        overflow: "linebreak",
      },
      columnStyles: includePrices
        ? {
            0: { cellWidth: 82 },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 24, halign: "center" },
            3: { cellWidth: 28, halign: "right" },
            4: { cellWidth: 32, halign: "right" },
          }
        : {
            0: { cellWidth: 126 },
            1: { cellWidth: 24, halign: "center" },
            2: { cellWidth: 36, halign: "center" },
          },
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || 96) + 8;

    const observacionesLines = remision.observaciones
      ? doc.splitTextToSize(
          remision.observaciones,
          includePrices ? 95 : pageWidth - marginX * 2 - 8
        )
      : [];

    const observacionesHeight = remision.observaciones
      ? Math.max(24, 12 + observacionesLines.length * 4.5)
      : 0;

    const totalsHeight = includePrices ? 31 : 0;
    const blockHeight = Math.max(observacionesHeight, includePrices ? totalsHeight : 0);

    if (currentY + Math.max(blockHeight, 24) > pageHeight - 24) {
      doc.addPage();
      currentY = 20;
    }

    if (remision.observaciones) {
      const observacionesWidth = includePrices
        ? 108
        : pageWidth - marginX * 2;

      doc.setFillColor(255, 251, 235);
      doc.roundedRect(
        marginX,
        currentY,
        observacionesWidth,
        observacionesHeight,
        3,
        3,
        "F"
      );

      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Observaciones", marginX + 4, currentY + 7);

      doc.setTextColor(87, 83, 78);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.7);
      doc.text(observacionesLines, marginX + 4, currentY + 13);
    }

    if (includePrices) {
      const totalsX = remision.observaciones ? 128 : 124;
      const totalsWidth = remision.observaciones ? 68 : 72;

      doc.setFillColor(...COLORS.card);
      doc.roundedRect(totalsX, currentY, totalsWidth, totalsHeight, 3, 3, "F");

      doc.setTextColor(...COLORS.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      doc.text("Subtotal:", totalsX + 4, currentY + 8);
      doc.text(
        formatMoneyPdf(subtotalGeneral),
        totalsX + totalsWidth - 4,
        currentY + 8,
        { align: "right" }
      );

      doc.text("IVA:", totalsX + 4, currentY + 15);
      doc.text(
        formatMoneyPdf(ivaGeneral),
        totalsX + totalsWidth - 4,
        currentY + 15,
        { align: "right" }
      );

      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(totalsX + 2, currentY + 20, totalsWidth - 4, 9, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("TOTAL", totalsX + 5, currentY + 26);
      doc.text(
        formatMoneyPdf(totalGeneral),
        totalsX + totalsWidth - 4,
        currentY + 26,
        { align: "right" }
      );
    }

    const generatedAt = new Date().toLocaleString("es-CO");
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(marginX, pageHeight - 14, rightX, pageHeight - 14);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text(`Generado el ${generatedAt} • VManage`, marginX, pageHeight - 8);
      doc.text(`Página ${page} de ${totalPages}`, rightX, pageHeight - 8, {
        align: "right",
      });
    }

    doc.save(
      `Remision_Compra_${remision.numeroRemision}_${
        includePrices ? "con_precios" : "sin_precios"
      }.pdf`
    );
  };

  const handleOpenPdfOptions = (remision: RemisionCompraUI) => {
    setRemisionParaDescargarPdf(remision);
    setShowPdfOptionsModal(true);
  };

  const handleDownloadPDF = async (includePrices: boolean) => {
    if (!remisionParaDescargarPdf) return;

    try {
      const detalle =
        remisionParaDescargarPdf.items.length > 0
          ? remisionParaDescargarPdf
          : await getRemisionCompraById(remisionParaDescargarPdf.id);

      await generateRemisionPDF(detalle, includePrices);

      setShowPdfOptionsModal(false);
      setRemisionParaDescargarPdf(null);

      toast.success(
        `PDF de la remisión ${detalle.numeroRemision} descargado exitosamente`
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al descargar la remisión en PDF"));
    }
  };

  const totalFormulario = useMemo(() => {
    return items.reduce((acc, item) => {
      const cantidad = Number(item.cantidad || 0);
      const subtotal = cantidad * item.precio_unitario;
      const iva = subtotal * (item.ivaPorcentaje / 100);
      return acc + subtotal + iva;
    }, 0);
  }, [items]);

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Cargando remisiones de compra...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Remisiones de Compra</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">Gestiona las remisiones de compra en</p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {selectedBodegaNombre}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Remisiones</p>
              <p className="text-3xl mt-2">{stats.totalRemisiones}</p>
            </div>
            <FileText className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendientes</p>
              <p className="text-3xl mt-2">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Aprobadas</p>
              <p className="text-3xl mt-2">{stats.aplicadas}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div className="bg-red-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Anuladas</p>
              <p className="text-3xl mt-2">{stats.anuladas}</p>
            </div>
            <Ban className="text-red-200" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              type="text"
              placeholder="Buscar por remisión, orden, proveedor, documento, estado, bodega o número de items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus size={20} className="mr-2" />
              Nueva Remisión
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Remisión</TableHead>
                <TableHead>Orden de Compra</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron remisiones de compra</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentRemisiones.map((remision, index) => {
                  const accionBloqueada =
                    remision.estadoKey !== "PENDIENTE" || remision.afectaExistencias;

                  return (
                    <TableRow key={remision.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {remision.numeroRemision}
                      </TableCell>
                      <TableCell>{remision.ordenCompra}</TableCell>
                      <TableCell>{remision.proveedor}</TableCell>
                      <TableCell>{formatDate(remision.fecha)}</TableCell>
                      <TableCell>{remision.itemsCount}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEstadoClick(remision)}
                          disabled={remision.estadoKey !== "PENDIENTE"}
                          className={`h-7 ${
                            remision.estadoKey === "APLICADA"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : remision.estadoKey === "PENDIENTE"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-red-100 text-red-800 hover:bg-red-100 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          {remision.estado}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(remision)}
                            className="hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPdfOptions(remision)}
                            className="hover:bg-green-50"
                            title="Descargar"
                          >
                            <Download size={16} className="text-green-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(remision)}
                            className={
                              accionBloqueada
                                ? "cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-yellow-50"
                            }
                            title="Editar"
                            disabled={accionBloqueada}
                          >
                            <Edit
                              size={16}
                              className={
                                accionBloqueada ? "text-gray-400" : "text-yellow-600"
                              }
                            />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnular(remision)}
                            className={
                              accionBloqueada
                                ? "cursor-not-allowed hover:bg-transparent"
                                : "hover:bg-red-50"
                            }
                            title="Anular"
                            disabled={accionBloqueada}
                          >
                            <Ban
                              size={16}
                              className={
                                accionBloqueada ? "text-gray-400" : "text-red-600"
                              }
                            />
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

      <div>
        {filteredRemisiones.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredRemisiones.length)} de{" "}
              {filteredRemisiones.length} remisiones
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev - 1)}
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
                onClick={() => setCurrentPage((prev) => prev + 1)}
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

      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nueva Remisión de Compra</DialogTitle>
            <DialogDescription
              id="create-remision-compra-description"
              className="sr-only"
            >
              Formulario para crear una nueva remisión de compra
            </DialogDescription>
          </DialogHeader>

<div className="space-y-8 py-4">
  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-gray-900">
        Información general
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Selecciona la orden de compra y completa los datos principales de la remisión.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Número de Remisión</Label>
        {renderReadonlyBox(
          formData.numeroRemision,
          "Se genera automáticamente"
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ordenCompra">Orden de Compra *</Label>
        <Select
          value={formData.id_compra}
          onValueChange={handleOrdenCompraChange}
        >
          <SelectTrigger id="ordenCompra" className="h-11">
            <SelectValue placeholder="Seleccionar orden de compra" />
          </SelectTrigger>
          <SelectContent>
            {comprasOptions.map((compra) => (
              <SelectItem key={compra.id} value={String(compra.id)}>
                {compra.codigo} - {compra.proveedorNombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Proveedor</Label>
        {renderReadonlyBox(
          formData.proveedor,
          "Se completa al seleccionar orden de compra"
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Documento</Label>
        {renderReadonlyBox(
          formData.proveedorTipoDocumento,
          "Se completa al seleccionar orden de compra"
        )}
      </div>

      <div className="space-y-2">
        <Label>Número de Documento</Label>
        {renderReadonlyBox(
          formData.proveedorNumeroDocumento,
          "Se completa al seleccionar orden de compra"
        )}
      </div>

      <div className="space-y-2">
        <Label>Bodega</Label>
        {renderReadonlyBox(
          formData.bodega,
          "Se completa al seleccionar orden de compra"
        )}
      </div>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
        <Input
          id="fechaVencimiento"
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={formData.fechaVencimiento}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              fechaVencimiento: e.target.value,
            }))
          }
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idFactura">ID Factura</Label>
        <Input
          id="idFactura"
          type="text"
          inputMode="numeric"
          value={formData.idFactura}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setFormData((prev) => ({ ...prev, idFactura: value }));
          }}
          placeholder="Opcional"
          className="h-11"
        />
      </div>
    </div>

    <div className="mt-6 space-y-2">
      <Label htmlFor="observaciones">Observaciones</Label>
      <Input
        id="observaciones"
        value={formData.observaciones}
        onChange={(e) => {
          const value = e.target.value;

          if (value.length > MAX_OBSERVACIONES_LENGTH) {
            toast.error(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres en observaciones`);
            return;
          }

          setFormData((prev) => ({
            ...prev,
            observaciones: value,
          }));
        }}
        placeholder="Notas adicionales..."
        className="h-11"
      />
    </div>
  </div>

  {selectedCompra && (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">
            Resumen de la compra seleccionada
          </h3>
          <p className="mt-1 text-sm text-blue-800">
            Compra: {selectedCompra.codigo}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            Proveedor: {selectedCompra.proveedorNombre} | Tipo Doc.:{" "}
            {selectedCompra.proveedorTipoDocumento || ""} | N° Doc.:{" "}
            {selectedCompra.proveedorNumeroDocumento || ""} | Bodega:{" "}
            {selectedCompra.bodegaNombre}
          </p>
        </div>

        {loadingCompraDetalle && (
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 size={16} className="animate-spin" />
            Cargando detalle...
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad Compra</TableHead>
              <TableHead>Precio Unitario</TableHead>
              <TableHead>IVA %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosDeCompra.map((item) => (
              <TableRow key={item.idProducto}>
                <TableCell>{item.productoNombre}</TableCell>
                <TableCell>{item.cantidad}</TableCell>
                <TableCell>{formatMoney(item.precioUnitario)}</TableCell>
                <TableCell>{item.ivaPorcentaje}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )}

  <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
    <div className="mb-5 flex items-center gap-2">
      <Package size={20} className="text-blue-600" />
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Productos de la Remisión
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Agrega los productos con su lote, vencimiento y observaciones del ítem.
        </p>
      </div>
    </div>

    <div className="mb-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Barcode size={20} className="text-blue-600" />
        <Label htmlFor="codigoBarras" className="text-blue-900">
          Código de Barras del Ítem
        </Label>
      </div>

      <div className="relative">
        <Input
          id="codigoBarras"
          ref={barcodeInputRef}
          value={codigoBarras}
          onChange={(e) => {
            const value = e.target.value;

            if (value.length > MAX_CODIGO_BARRAS_LENGTH) {
              toast.error(`Máximo ${MAX_CODIGO_BARRAS_LENGTH} caracteres para código de barras`);
              return;
            }

            setCodigoBarras(value);
          }}
          onKeyDown={handleBarcodeKeyDown}
          placeholder="Escanee o escriba el código de barras del lote/ítem..."
          className="h-11 pr-10 bg-white border-blue-300 focus:border-blue-500"
        />
        <Barcode
          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400"
          size={20}
        />
      </div>

      <p className="mt-3 text-xs text-blue-700">
        Opcional. Este código se guarda en el detalle de la remisión y luego en existencias.
      </p>
    </div>

    <div className="rounded-2xl bg-gray-50 p-4 md:p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="producto">Producto *</Label>
          <Select
            value={currentProducto}
            onValueChange={(value: string) => setCurrentProducto(value)}
          >
            <SelectTrigger id="producto" className="h-11">
              <SelectValue placeholder="Seleccionar producto de la compra" />
            </SelectTrigger>
            <SelectContent>
              {productosDisponibles.map((producto) => (
                <SelectItem
                  key={producto.idProducto}
                  value={String(producto.idProducto)}
                >
                  {producto.productoNombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numeroLote">Número de Lote *</Label>
          <Input
            id="numeroLote"
            value={currentNumeroLote}
            onChange={(e) => {
              const value = e.target.value;

              if (value.length > MAX_LOTE_LENGTH) {
                toast.error(`Máximo ${MAX_LOTE_LENGTH} caracteres para el lote`);
                return;
              }

              setCurrentNumeroLote(value);
            }}
            placeholder="Ej: AL-2026-001"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad"
            type="text"
            inputMode="decimal"
            value={currentCantidad}
            onChange={(e) => {
              const value = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");

              const partes = value.split(".");
              if (partes.length > 2) return;

              setCurrentCantidad(value);
            }}
            placeholder="0"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaVencimientoItem">
            Fecha de Vencimiento *
          </Label>
          <Input
            id="fechaVencimientoItem"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={currentFechaVencimiento}
            onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="notaItem">Nota del Ítem</Label>
          <Input
            id="notaItem"
            value={currentNota}
            onChange={(e) => {
              const value = e.target.value;

              if (value.length > MAX_NOTA_ITEM_LENGTH) {
                toast.error(`Máximo ${MAX_NOTA_ITEM_LENGTH} caracteres para la nota`);
                return;
              }

              setCurrentNota(value);
            }}
            placeholder="Opcional"
            className="h-11"
          />
        </div>
      </div>

      <div className="mt-5">
        <Button
          type="button"
          onClick={handleAddItem}
          className="bg-green-600 hover:bg-green-700 w-full h-11"
          disabled={!selectedCompra}
        >
          <Plus size={16} className="mr-2" />
          Agregar Producto
        </Button>
      </div>
    </div>

    <div className="mt-6">
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Cód. Barras</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.localId}>
                  <TableCell>{item.productoNombre}</TableCell>
                  <TableCell>{item.lote}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>{formatMoney(item.precio_unitario)}</TableCell>
                  <TableCell>{item.ivaPorcentaje}%</TableCell>
                  <TableCell>{formatDate(item.fecha_vencimiento)}</TableCell>
                  <TableCell>{item.codigo_barras || "—"}</TableCell>
                  <TableCell>{item.nota || "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.localId)}
                      className="hover:bg-red-50"
                    >
                      <X size={16} className="text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-gray-50">
                <TableCell colSpan={8} className="text-right font-semibold">
                  Total aproximado
                </TableCell>
                <TableCell className="font-semibold">
                  {formatMoney(totalFormulario)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-gray-500">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No hay productos agregados</p>
          <p className="mt-1 text-sm">
            Selecciona la compra y agrega productos desde su detalle
          </p>
        </div>
      )}
    </div>
  </div>
</div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                closeToList();
                resetForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Crear Remisión
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
          aria-describedby="edit-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Remisión de Compra</DialogTitle>
            <DialogDescription
              id="edit-remision-compra-description"
              className="sr-only"
            >
              Formulario para editar la remisión de compra
            </DialogDescription>
          </DialogHeader>

          {loadingDetalleRemision ? (
            <div className="flex items-center justify-center py-16 text-gray-600 gap-2">
              <Loader2 className="animate-spin" size={18} />
              Cargando remisión...
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Remisión</Label>
                  {renderReadonlyBox(formData.numeroRemision)}
                </div>

                <div className="space-y-2">
                  <Label>Orden de Compra</Label>
                  {renderReadonlyBox(formData.ordenCompra)}
                </div>

                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  {renderReadonlyBox(formData.proveedor)}
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  {renderReadonlyBox(formData.proveedorTipoDocumento)}
                </div>

                <div className="space-y-2">
                  <Label>Número de Documento</Label>
                  {renderReadonlyBox(formData.proveedorNumeroDocumento)}
                </div>

                <div className="space-y-2">
                  <Label>Bodega</Label>
                  {renderReadonlyBox(formData.bodega)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fechaCreacion">Fecha de Creación</Label>
                  <Input
                    id="edit-fechaCreacion"
                    type="date"
                    value={formData.fechaCreacion}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fechaVencimiento">
                    Fecha de Vencimiento
                  </Label>
                  <Input
                    id="edit-fechaVencimiento"
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-idFactura">ID Factura</Label>
                  <Input
                    id="edit-idFactura"
                    type="text"
                    inputMode="numeric"
                    value={formData.idFactura}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({ ...prev, idFactura: value }));
                    }}
                    placeholder="Opcional"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-observaciones">Observaciones</Label>
                  <Input
                    id="edit-observaciones"
                    value={formData.observaciones}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value.length > MAX_OBSERVACIONES_LENGTH) {
                        toast.error(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres en observaciones`);
                        return;
                      }

                      setFormData((prev) => ({
                        ...prev,
                        observaciones: value,
                      }));
                    }}
                  />
                </div>
              </div>

              {selectedCompra && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <p className="font-semibold text-blue-900 mb-3">
                    Productos disponibles de la compra {selectedCompra.codigo}
                  </p>
                  <p className="text-sm text-blue-800 mb-3">
                    Proveedor: {selectedCompra.proveedorNombre} | Tipo Doc.:{" "}
                    {selectedCompra.proveedorTipoDocumento || "—"} | N° Doc.:{" "}
                    {selectedCompra.proveedorNumeroDocumento || "—"} | Bodega:{" "}
                    {selectedCompra.bodegaNombre}
                  </p>

                  <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad Compra</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>IVA %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompra.items.map((item) => (
                          <TableRow key={item.idProducto}>
                            <TableCell>{item.productoNombre}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatMoney(item.precioUnitario)}</TableCell>
                            <TableCell>{item.ivaPorcentaje}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-blue-600" />
                  <h3 className="font-semibold">Productos de la Remisión</h3>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-producto">Producto *</Label>
                      <Select
                        value={currentProducto}
                        onValueChange={(value: string) => setCurrentProducto(value)}
                      >
                        <SelectTrigger id="edit-producto">
                          <SelectValue placeholder="Seleccionar producto de la compra" />
                        </SelectTrigger>
                        <SelectContent>
                          {productosDisponibles.map((producto) => (
                            <SelectItem
                              key={producto.idProducto}
                              value={String(producto.idProducto)}
                            >
                              {producto.productoNombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-codigoBarrasItem">Código de Barras</Label>
                      <div className="relative">
                        <Input
                          id="edit-codigoBarrasItem"
                          value={codigoBarras}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value.length > MAX_CODIGO_BARRAS_LENGTH) {
                              toast.error(`Máximo ${MAX_CODIGO_BARRAS_LENGTH} caracteres para código de barras`);
                              return;
                            }

                            setCodigoBarras(value);
                          }}
                          onKeyDown={handleBarcodeKeyDown}
                          placeholder="Escanee o escriba el código de barras..."
                          className="pr-10"
                        />
                        <Barcode
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-numeroLote">Número de Lote *</Label>
                      <Input
                        id="edit-numeroLote"
                        value={currentNumeroLote}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value.length > MAX_LOTE_LENGTH) {
                            toast.error(`Máximo ${MAX_LOTE_LENGTH} caracteres para el lote`);
                            return;
                          }

                          setCurrentNumeroLote(value);
                        }}
                        placeholder="Ej: AL-2026-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-cantidad">Cantidad *</Label>
                      <Input
                        id="edit-cantidad"
                        type="text"
                        inputMode="decimal"
                        value={currentCantidad}
                        onChange={(e) => {
                          const value = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");

                          const partes = value.split(".");
                          if (partes.length > 2) return;

                          setCurrentCantidad(value);
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-fechaVencimientoItem">
                        Fecha de Vencimiento *
                      </Label>
                      <Input
                        id="edit-fechaVencimientoItem"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={currentFechaVencimiento}
                        onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="edit-notaItem">Nota del Ítem</Label>
                      <Input
                        id="edit-notaItem"
                        value={currentNota}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value.length > MAX_NOTA_ITEM_LENGTH) {
                            toast.error(`Máximo ${MAX_NOTA_ITEM_LENGTH} caracteres para la nota`);
                            return;
                          }

                          setCurrentNota(value);
                        }}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-green-600 hover:bg-green-700 w-full"
                    disabled={!selectedCompra}
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar Producto
                  </Button>
                </div>

                {items.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>IVA</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Cód. Barras</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.localId}>
                            <TableCell>{item.productoNombre}</TableCell>
                            <TableCell>{item.lote}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatMoney(item.precio_unitario)}</TableCell>
                            <TableCell>{item.ivaPorcentaje}%</TableCell>
                            <TableCell>{formatDate(item.fecha_vencimiento)}</TableCell>
                            <TableCell>{item.codigo_barras || "—"}</TableCell>
                            <TableCell>{item.nota || "—"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.localId)}
                                className="hover:bg-red-50"
                              >
                                <X size={16} className="text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={8} className="text-right font-semibold">
                            Total aproximado
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatMoney(totalFormulario)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No hay productos agregados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                closeToList();
                resetForm();
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || loadingDetalleRemision}
            >
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isVer}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-4xl"
          aria-describedby="view-remision-compra-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalle de Remisión de Compra</DialogTitle>
            <DialogDescription
              id="view-remision-compra-description"
              className="sr-only"
            >
              Detalles completos de la remisión de compra
            </DialogDescription>
          </DialogHeader>

          {loadingDetalleRemision ? (
            <div className="flex items-center justify-center py-16 text-gray-600 gap-2">
              <Loader2 className="animate-spin" size={18} />
              Cargando detalle...
            </div>
          ) : selectedRemision ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Remisión</p>
                  <p className="font-semibold">{selectedRemision.numeroRemision}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orden de Compra</p>
                  <p className="font-semibold">{selectedRemision.ordenCompra}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="font-semibold">{selectedRemision.proveedor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Documento</p>
                  <p className="font-semibold">
                    {selectedRemision.proveedorTipoDocumento || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Documento</p>
                  <p className="font-semibold">
                    {selectedRemision.proveedorNumeroDocumento || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-semibold">{formatDate(selectedRemision.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-semibold">
                    {formatDate(selectedRemision.fechaVencimiento)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">
                    {selectedRemision.bodega || effectiveSelectedBodegaNombre}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={getEstadoBadge(selectedRemision.estadoKey).class}
                    >
                      {selectedRemision.estado}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Afecta Existencias</p>
                  <p className="font-semibold">
                    {selectedRemision.afectaExistencias ? "Sí" : "No"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-blue-600" />
                  <h3 className="font-semibold">Productos</h3>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>IVA</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Cód. Barras</TableHead>
                        <TableHead>Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRemision.items.map((item, index) => (
                        <TableRow key={`${item.id_producto}-${index}`}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.lote || "—"}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{formatMoney(item.precio_unitario)}</TableCell>
                          <TableCell>{item.ivaPorcentaje}%</TableCell>
                          <TableCell>{formatDate(item.fecha_vencimiento)}</TableCell>
                          <TableCell>
                            {item.codigo_barras || item.cod_barras || "—"}
                          </TableCell>
                          <TableCell>{item.nota || "—"}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="text-right font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatMoney(selectedRemision.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedRemision.observaciones && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Observaciones</p>
                  <p className="mt-1">{selectedRemision.observaciones}</p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              onClick={() => selectedRemision && handleOpenPdfOptions(selectedRemision)}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!selectedRemision || loadingDetalleRemision}
            >
              <Download size={16} className="mr-2" />
              Descargar
            </Button>

            <Button variant="outline" onClick={closeToList}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPdfOptionsModal}
        onOpenChange={(open) => {
          setShowPdfOptionsModal(open);
          if (!open) {
            setRemisionParaDescargarPdf(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar remisión de compra</DialogTitle>
            <DialogDescription>
              Selecciona cómo deseas exportar el PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <Button
              onClick={() => handleDownloadPDF(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download size={16} className="mr-2" />
              Descargar con precios
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDownloadPDF(false)}
            >
              <Download size={16} className="mr-2" />
              Descargar sin precios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="delete-remision-compra-description"
        >
          <DialogHeader>
            <DialogTitle>Anular Remisión de Compra</DialogTitle>
            <DialogDescription id="delete-remision-compra-description">
              ¿Estás seguro de que deseas anular esta remisión de compra? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {selectedRemision && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión:{" "}
                <span className="font-semibold">{selectedRemision.numeroRemision}</span>
              </p>
              <p className="text-sm text-gray-600">
                Proveedor:{" "}
                <span className="font-semibold">{selectedRemision.proveedor}</span>
              </p>
              <p className="text-sm text-gray-600">
                Estado actual:{" "}
                <span className="font-semibold">{selectedRemision.estado}</span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAnular}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting}
            >
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="confirm-estado-description"
        >
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Remisión</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Deseas aprobar/confirmar esta remisión? Solo al confirmar/aprobar se
              deben aplicar existencias desde el backend.
            </DialogDescription>
          </DialogHeader>

          {remisionParaCambioEstado && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión:{" "}
                <span className="font-semibold">
                  {remisionParaCambioEstado.numeroRemision}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Estado actual:{" "}
                <Badge
                  variant="outline"
                  className={getEstadoBadge(remisionParaCambioEstado.estadoKey).class}
                >
                  {remisionParaCambioEstado.estado}
                </Badge>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Nuevo estado:{" "}
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  {nuevoEstadoLabel || "Aprobada / Confirmada"}
                </Badge>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setRemisionParaCambioEstado(null);
                setNuevoEstadoLabel(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmEstado}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="success-remision-description"
        >
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-remision-description">
              La remisión de compra se ha creado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Remisión Creada!
            </h3>

            <p className="text-sm text-gray-600 text-center mb-2">
              La remisión de compra se ha registrado correctamente en el sistema
            </p>

            {lastCreatedCode && (
              <p className="text-sm font-semibold text-blue-700 text-center mb-6">
                Código generado: {lastCreatedCode}
              </p>
            )}

            <Button
              onClick={handleSuccessModalClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
