import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";

import {
  Search,
  Eye,
  Edit,
  Trash2,
  Ban,
  Plus,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Badge } from "../../../../shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { Label } from "../../../../shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../shared/components/ui/dialog";

import { toast } from "sonner";
import type { AppOutletContext } from "../../../../layouts/MainLayout";

import {
  ESTADO_COMPRA_IDS,
  getFechaActual,
} from "../services/ordenes-compra.mapper";

import logoVmanage from "../../../../assets/images/VLogo.png";

import {
  comprasService,
  type BasicOption,
  type Compra,
  type CompraEstado,
  type IvaOption,
  type ProductoOrden,
  type CompraCreatePayload,
  type ProveedorOption,
} from "../services/ordenes-compra.services";

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

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

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null);

  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [productosCatalogo, setProductosCatalogo] = useState<BasicOption[]>([]);
  const [terminosPago, setTerminosPago] = useState<BasicOption[]>([]);
  const [ivas, setIvas] = useState<IvaOption[]>([]);
  const [bodegas, setBodegas] = useState<BasicOption[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [compraParaCambioEstado, setCompraParaCambioEstado] =
    useState<Compra | null>(null);

  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState(false);
  const [compraParaDescargarPdf, setCompraParaDescargarPdf] =
    useState<Compra | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [storedBodega, setStoredBodega] = useState<{
    id?: number;
    nombre: string;
  }>({
    id: undefined,
    nombre: "",
  });

  const [bodegaReady, setBodegaReady] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const {
    selectedBodegaId: outletSelectedBodegaId,
    selectedBodegaNombre: outletSelectedBodegaNombre,
  } = useOutletContext<
    AppOutletContext & {
      selectedBodegaId?: number;
      selectedBodegaNombre?: string;
    }
  >();

  useEffect(() => {
    const contextIsTodas =
      normalizeText(outletSelectedBodegaNombre) ===
        normalizeText("Todas las bodegas") ||
      normalizeText(outletSelectedBodegaNombre) === normalizeText("Todas");

    const contextId = extractNumberFromUnknown(outletSelectedBodegaId);

    if (contextIsTodas || contextId) {
      setStoredBodega({
        id: contextId,
        nombre:
          outletSelectedBodegaNombre ||
          (contextIsTodas ? "Todas las bodegas" : ""),
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
  }, [outletSelectedBodegaId, outletSelectedBodegaNombre]);

  const effectiveSelectedBodegaNombre = (
    outletSelectedBodegaNombre ||
    storedBodega.nombre ||
    "Todas las bodegas"
  ).trim();

  const isTodasLasBodegas =
    normalizeText(effectiveSelectedBodegaNombre) ===
      normalizeText("Todas las bodegas") ||
    normalizeText(effectiveSelectedBodegaNombre) === normalizeText("Todas");

  const effectiveSelectedBodegaId = isTodasLasBodegas
    ? undefined
    : extractNumberFromUnknown(outletSelectedBodegaId) ?? storedBodega.id;

  const hasResolvedBodega =
    bodegaReady &&
    (isTodasLasBodegas ||
      Number.isInteger(Number(effectiveSelectedBodegaId)));

  const badgeBodegaLabel =
    !effectiveSelectedBodegaNombre ||
    normalizeText(effectiveSelectedBodegaNombre) === normalizeText("Todas")
      ? "Todas las bodegas"
      : effectiveSelectedBodegaNombre;

  const isCrear = location.pathname.endsWith("/ordenes-compra/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = useCallback(
    () => navigate("/app/ordenes-compra"),
    [navigate]
  );

  const handleView = (c: Compra) => {
    navigate(`/app/ordenes-compra/${c.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/ordenes-compra/crear");
  };

  const handleEdit = (c: Compra) => {
    if (c.estado === "Aprobada") {
      toast.error("No puedes editar una orden aprobada");
      return;
    }

    if (c.estado === "Anulada") {
      toast.error("No puedes editar una orden anulada");
      return;
    }

    navigate(`/app/ordenes-compra/${c.id}/editar`);
  };

  const handleAnular = (c: Compra) => {
    if (c.estado === "Aprobada") {
      toast.error("No puedes anular una orden aprobada");
      return;
    }

    if (c.estado === "Anulada") {
      toast.error("La orden ya está anulada");
      return;
    }

    navigate(`/app/ordenes-compra/${c.id}/anular`);
  };

  const handleCantidadProductoChange = (value: string) => {
    const limpio = value.replace(/\D/g, "");

    if (limpio === "") {
      setCantidadProductoInput("");
      setCantidadProducto(0);
      return;
    }

    const numero = parseInt(limpio, 10);

    if (numero > 1000) return;

    setCantidadProductoInput(String(numero));
    setCantidadProducto(numero);
  };

  const handleCantidadProductoBlur = () => {
    if (!cantidadProductoInput.trim()) {
      setCantidadProductoInput("");
      setCantidadProducto(0);
      return;
    }

    const numero = parseInt(cantidadProductoInput, 10);

    if (Number.isNaN(numero) || numero <= 0) {
      setCantidadProductoInput("");
      setCantidadProducto(0);
      return;
    }

    setCantidadProductoInput(String(numero));
    setCantidadProducto(numero);
  };

  const handlePrecioProductoChange = (value: string) => {
    let limpio = value.replace(",", ".").replace(/[^\d.]/g, "");

    if (limpio === "") {
      setPrecioProducto("");
      return;
    }

    const partes = limpio.split(".");
    if (partes.length > 2) return;

    const entero = partes[0] ?? "";
    const decimal = partes[1] ?? "";

    if (entero.length > 12) return;
    if (decimal.length > 2) return;

    setPrecioProducto(limpio);
  };

  const [formData, setFormData] = useState({
    numeroOrden: "",
    proveedorId: "",
    proveedorTipoDocumento: "",
    proveedorNumeroDocumento: "",
    terminoPagoId: "",
    fecha: "",
    fechaEntrega: "",
    estado: "Pendiente" as CompraEstado,
    observaciones: "",
    bodega: "",
    bodegaId: "",
  });

  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [selectedIvaId, setSelectedIvaId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState(0);
  const [cantidadProductoInput, setCantidadProductoInput] = useState("");
  const [precioProducto, setPrecioProducto] = useState<string>("");
  const [productosOrden, setProductosOrden] = useState<ProductoOrden[]>([]);

  const productosActivos = useMemo(() => {
    return productosCatalogo.filter((p) => p.estado !== false);
  }, [productosCatalogo]);

  const bodegasActivas = useMemo(() => {
    return bodegas.filter((b) => b.estado !== false);
  }, [bodegas]);

  const proveedoresActivos = useMemo(() => {
    return proveedores.filter((p) => p.estado !== false);
  }, [proveedores]);

  const terminosPagoActivos = useMemo(() => {
    return terminosPago.filter((t) => t.estado !== false);
  }, [terminosPago]);

  const ivasActivos = useMemo(() => {
    return ivas.filter((i) => i.estado !== false);
  }, [ivas]);

  const calcularTotales = useMemo(() => {
    const subtotal = productosOrden.reduce((sum, item) => sum + item.subtotal, 0);

    const impuestos = productosOrden.reduce(
      (sum, item) => sum + (item.subtotal * item.ivaPorcentaje) / 100,
      0
    );

    const total = subtotal + impuestos;
    const items = productosOrden.length;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      impuestos: Number(impuestos.toFixed(2)),
      total: Number(total.toFixed(2)),
      items,
    };
  }, [productosOrden]);

  const loadCompras = useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await comprasService.getAll(effectiveSelectedBodegaId);
      setCompras(rows);
    } catch (error) {
      console.error("Error cargando compras:", error);
      toast.error("No se pudieron cargar las órdenes de compra");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveSelectedBodegaId]);

  const loadCompraDetalle = useCallback(
    async (id: number) => {
      try {
        setIsLoadingDetail(true);
        const compra = await comprasService.getById(id);
        setCompraDetalle(compra);
      } catch (error) {
        console.error("Error cargando detalle de compra:", error);
        toast.error("No se pudo cargar el detalle de la orden");
        closeToList();
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [closeToList]
  );

  const loadCatalogos = useCallback(async () => {
    try {
      const result = await comprasService.getCatalogos();

      setProveedores(result.proveedores);
      setProductosCatalogo(result.productos);
      setTerminosPago(result.terminosPago);
      setIvas(result.ivas);
      setBodegas(result.bodegas ?? []);

      if (result.huboError) {
        toast.error(
          "Uno o más catálogos no se pudieron cargar. Revisa la consola."
        );
      }
    } catch (error) {
      console.error("Error inesperado cargando catálogos:", error);
      toast.error("No se pudieron cargar los catálogos");
    }
  }, []);

  const filteredCompras = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return compras.filter((c) => {
      return (
        c.numeroOrden.toLowerCase().includes(s) ||
        c.proveedor.toLowerCase().includes(s) ||
        c.estado.toLowerCase().includes(s) ||
        String(c.items).includes(s)
      );
    });
  }, [compras, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, effectiveSelectedBodegaId, effectiveSelectedBodegaNombre]);

  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompras = filteredCompras.slice(startIndex, endIndex);

  const stats = useMemo(() => {
    const totalCompras = compras.length;
    const pendientes = compras.filter((c) => c.estado === "Pendiente").length;
    const aprobadas = compras.filter((c) => c.estado === "Aprobada").length;
    const anuladas = compras.filter((c) => c.estado === "Anulada").length;

    return { totalCompras, pendientes, aprobadas, anuladas };
  }, [compras]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleEstado = (c: Compra) => {
    if (c.estado === "Anulada") {
      toast.error("No puedes cambiar el estado de una orden anulada");
      return;
    }

    if (c.estado === "Aprobada") {
      toast.error("Una orden aprobada no puede volver a pendiente");
      return;
    }

    setCompraParaCambioEstado(c);
    setShowConfirmEstadoModal(true);
  };

  const buildCompraPayload = (): CompraCreatePayload => {
    return {
      id_bodega: Number(formData.bodegaId),
      id_proveedor: Number(formData.proveedorId),
      id_termino_pago: Number(formData.terminoPagoId),
      descripcion: formData.observaciones.trim() || undefined,
      fecha_entrega: formData.fechaEntrega || undefined,
      detalle: productosOrden.map((item) => ({
        id_producto: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        id_iva: item.idIva,
      })),
    };
  };

  const handleConfirmEstado = async () => {
    if (!compraParaCambioEstado) return;

    if (compraParaCambioEstado.estado !== "Pendiente") {
      toast.error("Solo las órdenes pendientes pueden aprobarse");
      setShowConfirmEstadoModal(false);
      setCompraParaCambioEstado(null);
      return;
    }

    try {
      await comprasService.aprobar(compraParaCambioEstado.id);

      await loadCompras();

      if (compraDetalle?.id === compraParaCambioEstado.id) {
        await loadCompraDetalle(compraParaCambioEstado.id);
      }

      toast.success("Orden aprobada exitosamente");
    } catch (error) {
      console.error("Error aprobando compra:", error);
      toast.error("No se pudo cambiar el estado");
    } finally {
      setShowConfirmEstadoModal(false);
      setCompraParaCambioEstado(null);
    }
  };

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

const generateCompraPDF = async (
  compra: Compra,
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

  const formatDatePdf = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("es-CO");
  };

  const safeText = (value: unknown, fallback = "-") => {
    const text = String(value ?? "").trim();
    return text || fallback;
  };

  const getEstadoStyle = (estado: string) => {
    const normalized = (estado || "").toLowerCase();

    if (normalized.includes("aprobad")) {
      return {
        bg: [...COLORS.successBg] as const,
        text: [...COLORS.successText] as const,
        label: estado || "Aprobada",
      };
    }

    if (normalized.includes("anulad")) {
      return {
        bg: [...COLORS.dangerBg] as const,
        text: [...COLORS.dangerText] as const,
        label: estado || "Anulada",
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
    logo = await loadImageInfoAsDataUrl(logoVmanage);
  } catch (error) {
    console.warn("No se pudo cargar el logo para el PDF:", error);
  }

  const subtotalGeneral = Number(compra.subtotal || 0);
  const ivaGeneral = Number(compra.impuestos || 0);
  const totalGeneral = Number(compra.total || 0);

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setFillColor(9, 92, 181);
  doc.rect(0, 34, pageWidth, 1.2, "F");

  // Logo
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

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ORDEN DE COMPRA", pageWidth / 2, 14.8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("VManage • Gestión empresarial", pageWidth / 2, 21.8, {
    align: "center",
  });

  // Datos derecha
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.7);
  doc.text(`Código: ${safeText(compra.numeroOrden)}`, rightX, 11.5, {
    align: "right",
  });
  doc.text(`Fecha: ${formatDatePdf(compra.fecha)}`, rightX, 17.8, {
    align: "right",
  });
  doc.text(
    `Entrega: ${formatDatePdf(compra.fechaEntrega)}`,
    rightX,
    24.1,
    { align: "right" }
  );

  // Tarjeta información general
  doc.setFillColor(...COLORS.card);
  doc.roundedRect(marginX, 42, pageWidth - marginX * 2, 42, 3, 3, "F");

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Información general", marginX + 4, 49);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);

  const proveedorLines = doc.splitTextToSize(
    safeText(compra.proveedor),
    64
  );

  doc.text("Proveedor:", marginX + 4, 56);
  doc.text(proveedorLines, marginX + 28, 56);

  doc.text("Tipo Doc.:", marginX + 4, 65);
  doc.text(safeText(compra.proveedorTipoDocumento), marginX + 28, 65);

  doc.text("N° Documento:", marginX + 4, 74);
  doc.text(safeText(compra.proveedorNumeroDocumento), marginX + 32, 74);

  doc.text("Bodega:", 112, 56);
  doc.text(safeText(compra.bodega), 128, 56);

  doc.text("Térm. pago:", 112, 65);
  doc.text(safeText(compra.terminoPago), 132, 65);

  const estadoStyle = getEstadoStyle(compra.estado);
  doc.setFillColor(...(estadoStyle.bg as [number, number, number]));
  doc.roundedRect(112, 69, 44, 9.5, 3, 3, "F");

  doc.setTextColor(...(estadoStyle.text as [number, number, number]));
  doc.setFont("helvetica", "bold");
  doc.text(`Estado: ${estadoStyle.label}`, 134, 75.4, { align: "center" });

  // Línea separadora
  doc.setDrawColor(...COLORS.primaryLine);
  doc.setLineWidth(0.6);
  doc.line(marginX, 90, rightX, 90);

  // Tabla
  const tableHead = includePrices
    ? [["Producto", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]]
    : [["Producto", "Cantidad", "IVA"]];

  const tableData =
    compra.productos?.map((item) => {
      const detalleProducto = [
        item.producto?.nombre || "-",
      ]
        .filter(Boolean)
        .join("\n");

      if (includePrices) {
        return [
          detalleProducto,
          String(item.cantidad ?? 0),
          `IVA (${Number(item.ivaPorcentaje || 0).toFixed(2)}%)`,
          formatMoneyPdf(item.precio || 0),
          formatMoneyPdf(item.subtotal || 0),
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
    head: tableHead,
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
          0: { cellWidth: 130 },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 28, halign: "center" },
        },
  });

  let currentY = ((doc as any).lastAutoTable?.finalY || 96) + 8;

  const observaciones = safeText(compra.observaciones, "");
  const observacionesLines = observaciones
    ? doc.splitTextToSize(observaciones, includePrices ? 95 : 174)
    : [];

  const observacionesHeight = observaciones
    ? Math.max(24, 12 + observacionesLines.length * 4.5)
    : 0;

  const totalsHeight = includePrices ? 31 : 0;
  const blockHeight = Math.max(observacionesHeight, totalsHeight || 24);

  if (currentY + blockHeight > pageHeight - 24) {
    doc.addPage();
    currentY = 20;
  }

  // Observaciones
  if (observaciones) {
    const obsWidth = includePrices ? 108 : pageWidth - marginX * 2;

    doc.setFillColor(255, 251, 235);
    doc.roundedRect(marginX, currentY, obsWidth, observacionesHeight, 3, 3, "F");

    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Observaciones", marginX + 4, currentY + 7);

    doc.setTextColor(87, 83, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    doc.text(observacionesLines, marginX + 4, currentY + 13);
  }

  // Totales solo si incluye precios
  if (includePrices) {
    const totalsX = observaciones ? 128 : 124;
    const totalsWidth = observaciones ? 68 : 72;

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

  // Footer
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
    `Orden_Compra_${safeText(compra.numeroOrden, "SIN_CODIGO")}_${
      includePrices ? "con_precios" : "sin_precios"
    }.pdf`
  );
};

  const handleOpenPdfOptions = (compra: Compra) => {
    setCompraParaDescargarPdf(compra);
    setShowPdfOptionsModal(true);
  };

  const handleDownloadPDF = async (includePrices: boolean) => {
    if (!compraParaDescargarPdf) return;

    try {
      const compraBase = compraParaDescargarPdf;

      if (compraBase.productos?.length) {
        await generateCompraPDF(compraBase, includePrices);
      } else {
        const compraFull = await comprasService.getById(compraBase.id);
        await generateCompraPDF(compraFull, includePrices);
      }

      setShowPdfOptionsModal(false);
      setCompraParaDescargarPdf(null);
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("No se pudo generar el PDF de la compra");
    }
  };

  const resetCompraForm = () => {
    setFormData({
      numeroOrden: "",
      proveedorId: "",
      proveedorTipoDocumento: "",
      proveedorNumeroDocumento: "",
      terminoPagoId: "",
      fecha: getFechaActual(),
      fechaEntrega: "",
      estado: "Pendiente",
      observaciones: "",
      bodega:
        !isTodasLasBodegas && effectiveSelectedBodegaNombre
          ? effectiveSelectedBodegaNombre
          : "",
      bodegaId: effectiveSelectedBodegaId
        ? String(effectiveSelectedBodegaId)
        : "",
    });

    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(0);
    setCantidadProductoInput("");
    setPrecioProducto("");
    setProductosOrden([]);
  };

  useEffect(() => {
    if (!isCrear || !hasResolvedBodega) return;
    resetCompraForm();
  }, [
    isCrear,
    hasResolvedBodega,
    effectiveSelectedBodegaNombre,
    effectiveSelectedBodegaId,
    isTodasLasBodegas,
  ]);

  useEffect(() => {
    if (!isEditar) return;
    if (!compraDetalle) return;

    setFormData({
      numeroOrden: compraDetalle.numeroOrden,
      proveedorId: String(compraDetalle.proveedorId || ""),
      proveedorTipoDocumento: compraDetalle.proveedorTipoDocumento || "",
      proveedorNumeroDocumento: compraDetalle.proveedorNumeroDocumento || "",
      terminoPagoId: String(compraDetalle.terminoPagoId || ""),
      fecha: compraDetalle.fecha,
      fechaEntrega: compraDetalle.fechaEntrega,
      estado: compraDetalle.estado,
      observaciones: compraDetalle.observaciones,
      bodega: compraDetalle.bodega || "",
      bodegaId: String(compraDetalle.bodegaId || ""),
    });

    setProductosOrden(compraDetalle.productos ?? []);
    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(0);
    setCantidadProductoInput("");
    setPrecioProducto("");
  }, [isEditar, compraDetalle]);

  useEffect(() => {
    if (!hasResolvedBodega) return;
    loadCompras();
  }, [hasResolvedBodega, loadCompras]);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    const id = Number(params.id);

    if (!params.id || Number.isNaN(id)) {
      setCompraDetalle(null);
      return;
    }

    if (isVer || isEditar || isAnular) {
      loadCompraDetalle(id);
    }
  }, [params.id, isVer, isEditar, isAnular, loadCompraDetalle]);

  const handleProveedorChange = useCallback(
    (value: string) => {
      const proveedorSeleccionado = proveedoresActivos.find(
        (proveedor) => String(proveedor.id) === value
      );

      setFormData((prev) => ({
        ...prev,
        proveedorId: value,
        proveedorTipoDocumento: proveedorSeleccionado?.tipoDocumento || "",
        proveedorNumeroDocumento: proveedorSeleccionado?.numeroDocumento || "",
      }));
    },
    [proveedoresActivos]
  );

  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Selecciona un producto");
      return;
    }

    const cantidadNormalizada = Number(cantidadProductoInput.replace(",", "."));
    const precioNormalizado = Number(precioProducto.replace(",", "."));

    if (
      !cantidadProductoInput.trim() ||
      Number.isNaN(cantidadNormalizada) ||
      cantidadNormalizada <= 0
    ) {
      toast.error("Ingresa una cantidad válida");
      return;
    }

    if (cantidadNormalizada > 1000) {
      toast.error("La cantidad máxima permitida es 1000");
      return;
    }

    if (!selectedIvaId) {
      toast.error("Selecciona un IVA");
      return;
    }

    if (
      !precioProducto.trim() ||
      Number.isNaN(precioNormalizado) ||
      precioNormalizado <= 0
    ) {
      toast.error("Ingresa un precio unitario válido");
      return;
    }

    const productoSeleccionado = productosActivos.find(
      (producto) => String(producto.id) === selectedProductoId
    );

    if (!productoSeleccionado) {
      toast.error("El producto seleccionado no es válido");
      return;
    }

    const ivaSeleccionado = ivasActivos.find(
      (iva) => String(iva.id) === selectedIvaId
    );

    if (!ivaSeleccionado) {
      toast.error("El IVA seleccionado no es válido");
      return;
    }

    const yaExiste = productosOrden.some(
      (item) => String(item.producto.id) === selectedProductoId
    );

    if (yaExiste) {
      toast.error("Ese producto ya fue agregado a la orden");
      return;
    }

    const subtotal = cantidadNormalizada * precioNormalizado;

    const nuevoProducto: ProductoOrden = {
      producto: productoSeleccionado,
      cantidad: cantidadNormalizada,
      precio: precioNormalizado,
      subtotal,
      idIva: ivaSeleccionado.id,
      ivaNombre: ivaSeleccionado.nombre,
      ivaPorcentaje: ivaSeleccionado.porcentaje,
    };

    setProductosOrden((prev) => [...prev, nuevoProducto]);

    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(0);
    setCantidadProductoInput("");
    setPrecioProducto("");
  };

  const handleEliminarProducto = (productoId: string | number) => {
    setProductosOrden((prev) =>
      prev.filter((item) => String(item.producto.id) !== String(productoId))
    );
  };

const validateCompraForm = () => {
  if (!formData.bodegaId) {
    toast.error("Debes seleccionar una bodega");
    return false;
  }

  if (!formData.proveedorId) {
    toast.error("Debes seleccionar un proveedor");
    return false;
  }

  if (!formData.terminoPagoId) {
    toast.error("Debes seleccionar un término de pago");
    return false;
  }

  if (!formData.fechaEntrega) {
    toast.error("Debes ingresar la fecha de entrega");
    return false;
  }

  if (formData.fechaEntrega < getFechaActual()) {
    toast.error("La fecha de entrega no puede ser anterior a hoy");
    return false;
  }

  if (formData.observaciones.trim().length > MAX_OBSERVACIONES_LENGTH) {
    toast.error(`Las observaciones no pueden superar ${MAX_OBSERVACIONES_LENGTH} caracteres`);
    return false;
  }

  if (productosOrden.length === 0) {
    toast.error("Debes agregar al menos un producto");
    return false;
  }

  return true;
};

const confirmCreate = async () => {
  if (isSaving) return;

  if (!validateCompraForm()) return;

  try {
    setIsSaving(true);

    await comprasService.create(buildCompraPayload());

    await loadCompras();
    closeToList();
    setShowSuccessModal(true);
  } catch (error) {
    console.error("Error creando compra:", error);
    toast.error("No se pudo crear la orden de compra");
  } finally {
    setIsSaving(false);
  }
};

const confirmEdit = async () => {
  if (!compraDetalle || isSaving) return;

  if (compraDetalle.estado === "Anulada") {
    toast.error("No puedes editar una orden anulada");
    return;
  }

  if (compraDetalle.estado === "Aprobada") {
    toast.error("No puedes editar una orden aprobada");
    return;
  }

  if (!validateCompraForm()) return;

  try {
    setIsSaving(true);

    await comprasService.update(compraDetalle.id, {
      ...buildCompraPayload(),
      id_estado_compra: ESTADO_COMPRA_IDS[formData.estado],
    });

    await loadCompras();
    toast.success("Orden actualizada exitosamente");
    closeToList();
  } catch (error) {
    console.error("Error actualizando compra:", error);
    toast.error("No se pudo actualizar la orden");
  } finally {
    setIsSaving(false);
  }
};

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const confirmAnular = async () => {
    if (!compraDetalle) return;

    if (compraDetalle.estado === "Anulada") {
      toast.error("La orden ya está anulada");
      return;
    }

    if (compraDetalle.estado === "Aprobada") {
      toast.error("No puedes anular una orden aprobada");
      return;
    }

    try {
      await comprasService.anular(compraDetalle.id);

      await loadCompras();
      toast.success("Orden anulada exitosamente");
      closeToList();
    } catch (error) {
      console.error("Error anulando compra:", error);
      toast.error("No se pudo anular la orden");
    }
  };

  const compraSeleccionada = compraDetalle;

  const fieldClass =
    "h-11 rounded-lg border-gray-300 bg-white shadow-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500";

  const MAX_OBSERVACIONES_LENGTH = 255;

  const readonlyFieldClass =
    "h-11 rounded-lg border-gray-200 bg-gray-100 cursor-not-allowed shadow-none";

  const numberFieldClass =
    "h-11 rounded-lg border-gray-300 bg-white text-right shadow-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Órdenes de Compra</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">Gestiona las órdenes de compra en</p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {badgeBodegaLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalCompras}
              </p>
            </div>
            <ShoppingCart className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pendientes}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.aprobadas}
              </p>
            </div>
            <CheckCircle2 className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anuladas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.anuladas}
              </p>
            </div>
            <Ban className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por número de orden, proveedor, estado o número de items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nueva Orden
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Fecha Entrega</TableHead>    
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading || !hasResolvedBodega ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Cargando órdenes de compra...
                  </TableCell>
                </TableRow>
              ) : filteredCompras.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de compra</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentCompras.map((compra, index) => (
                  <TableRow key={compra.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {compra.numeroOrden}
                    </TableCell>
                    <TableCell>{compra.proveedor}</TableCell>
                    <TableCell>
                      {compra.fecha
                        ? new Date(compra.fecha).toLocaleDateString("es-CO")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {compra.fechaEntrega
                        ? new Date(compra.fechaEntrega).toLocaleDateString("es-CO")
                        : "-"}
                    </TableCell>
                    <TableCell>{compra.items}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(compra)}
                        disabled={compra.estado === "Anulada"}
                        className={`h-7 ${
                          compra.estado === "Aprobada"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : compra.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-red-100 text-red-800 hover:bg-red-100 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {compra.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(compra)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPdfOptions(compra)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(compra)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                          disabled={
                            compra.estado === "Aprobada" ||
                            compra.estado === "Anulada"
                          }
                        >
                          <Edit
                            size={16}
                            className={
                              compra.estado === "Aprobada" ||
                              compra.estado === "Anulada"
                                ? "text-gray-400"
                                : "text-yellow-600"
                            }
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(compra)}
                          className="hover:bg-red-50"
                          title="Anular"
                          disabled={
                            compra.estado === "Aprobada" ||
                            compra.estado === "Anulada"
                          }
                        >
                          <Ban
                            size={16}
                            className={
                              compra.estado === "Aprobada" ||
                              compra.estado === "Anulada"
                                ? "text-gray-400"
                                : "text-red-600"
                            }
                          />
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
        {filteredCompras.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredCompras.length)} de{" "}
              {filteredCompras.length} órdenes
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

      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          aria-describedby="create-order-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Nueva Orden de Compra</DialogTitle>
                <DialogDescription
                  id="create-order-description"
                  className="text-sm text-gray-500"
                >
                  Completa la información para crear una nueva orden de compra
                </DialogDescription>
              </div>

              {formData.numeroOrden ? (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Número de Orden</p>
                  <p className="font-semibold text-gray-900">
                    {formData.numeroOrden}
                  </p>
                </div>
              ) : null}
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-end border-b pb-2">
                <p className="text-sm font-semibold text-green-600">
                  {formData.fecha}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fechaEntrega">Fecha de Entrega *</Label>
                  <Input
                    id="fechaEntrega"
                    type="date"
                    min={getFechaActual()}
                    value={formData.fechaEntrega}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaEntrega: e.target.value })
                    }
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bodega">Bodega *</Label>
                  <Select
                    value={formData.bodegaId}
                    onValueChange={(value: string) => {
                      const bodegaSeleccionada = bodegasActivas.find(
                        (bodega) => String(bodega.id) === value
                      );

                      setFormData({
                        ...formData,
                        bodegaId: value,
                        bodega: bodegaSeleccionada?.nombre || "",
                      });
                    }}
                  >
                    <SelectTrigger id="bodega" className={fieldClass}>
                      <SelectValue placeholder="Selecciona una bodega" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasActivas.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay bodegas disponibles
                        </div>
                      ) : (
                        bodegasActivas.map((bodega) => (
                          <SelectItem key={bodega.id} value={String(bodega.id)}>
                            {bodega.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Proveedor y Condiciones
                </h3>
                <p className="text-sm text-gray-500">
                  Selecciona proveedor y término de pago
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor *</Label>
                  <Select
                    value={formData.proveedorId}
                    onValueChange={handleProveedorChange}
                  >
                    <SelectTrigger id="proveedor" className={fieldClass}>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedoresActivos.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay proveedores activos disponibles
                        </div>
                      ) : (
                        proveedoresActivos.map((proveedor) => (
                          <SelectItem
                            key={proveedor.id}
                            value={String(proveedor.id)}
                          >
                            {proveedor.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end lg:pt-7">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/app/proveedores/crear")}
                    className="h-11 w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-2" />
                    Nuevo Proveedor
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proveedorTipoDocumento">Tipo de Documento</Label>
                  <Input
                    id="proveedorTipoDocumento"
                    value={formData.proveedorTipoDocumento}
                    readOnly
                    className={readonlyFieldClass}
                    placeholder="Se completa al seleccionar proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proveedorNumeroDocumento">Documento / NIT</Label>
                  <Input
                    id="proveedorNumeroDocumento"
                    value={formData.proveedorNumeroDocumento}
                    readOnly
                    className={readonlyFieldClass}
                    placeholder="Se completa al seleccionar proveedor"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="terminoPago">Término de Pago *</Label>
                  <Select
                    value={formData.terminoPagoId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, terminoPagoId: value })
                    }
                  >
                    <SelectTrigger id="terminoPago" className={fieldClass}>
                      <SelectValue placeholder="Selecciona un término de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminosPagoActivos.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay términos de pago disponibles
                        </div>
                      ) : (
                        terminosPagoActivos.map((termino) => (
                          <SelectItem key={termino.id} value={String(termino.id)}>
                            {termino.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Productos de la Orden
                </h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={selectedProductoId}
                      onValueChange={setSelectedProductoId}
                    >
                      <SelectTrigger id="producto" className={fieldClass}>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosActivos.map((producto) => (
                          <SelectItem key={producto.id} value={String(producto.id)}>
                            {producto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="text"
                      inputMode="numeric"
                      value={cantidadProductoInput}
                      onChange={(e) =>
                        handleCantidadProductoChange(e.target.value)
                      }
                      onBlur={handleCantidadProductoBlur}
                      placeholder="Ej: 50"
                      className={numberFieldClass}
                    />
                    <p className="text-xs text-gray-500">
                      Máximo 1000 unidades.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iva">IVA *</Label>
                    <Select value={selectedIvaId} onValueChange={setSelectedIvaId}>
                      <SelectTrigger id="iva" className={fieldClass}>
                        <SelectValue placeholder="Selecciona IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {ivasActivos.map((iva) => (
                          <SelectItem key={iva.id} value={String(iva.id)}>
                            {iva.nombre} ({iva.porcentaje}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio Unitario *</Label>
                    <Input
                      id="precio"
                      type="text"
                      inputMode="decimal"
                      value={precioProducto}
                      onChange={(e) =>
                        handlePrecioProductoChange(e.target.value)
                      }
                      placeholder="Ej: 25000"
                      className={numberFieldClass}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAgregarProducto}
                  className="bg-green-600 hover:bg-green-700 w-full h-11"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {productosOrden.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-65 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-center">IVA</TableHead>
                          <TableHead className="text-right">Precio Unitario</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {productosOrden.map((item) => (
                          <TableRow key={item.producto.id}>
                            <TableCell>{item.producto.nombre}</TableCell>
                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.ivaNombre} ({item.ivaPorcentaje}%)
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.precio.toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${item.subtotal.toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEliminarProducto(item.producto.id)
                                }
                                className="hover:bg-red-50"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={4} className="text-right font-semibold">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            ${calcularTotales.total.toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                  <Package size={44} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">
                    Selecciona un producto y agrégalo a la orden
                  </p>
                </div>
              )}

              <div className="mt-4 ml-auto w-full max-w-sm rounded-lg border bg-gray-50 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° de Items</span>
                    <span className="font-medium">{calcularTotales.items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      ${calcularTotales.subtotal.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA</span>
                    <span className="font-medium">
                      ${calcularTotales.impuestos.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-blue-600">
                      ${calcularTotales.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Observaciones
                  </h3>
                  <p className="text-sm text-gray-500">
                    Notas adicionales para esta orden
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Notas adicionales</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value.length > MAX_OBSERVACIONES_LENGTH) {
                        toast.error(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres en observaciones`);
                        return;
                      }

                      setFormData({
                        ...formData,
                        observaciones: value,
                      });
                    }}
                    placeholder="Escribe cualquier observación sobre la orden de compra..."
                    rows={4}
                    className="rounded-lg border-gray-300 resize-none shadow-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {formData.observaciones.length}/{MAX_OBSERVACIONES_LENGTH}
                  </p>
                </div>
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
              {isSaving ? "Creando..." : "Crear Orden"}
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
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="view-order-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Detalles de la Orden de Compra</DialogTitle>
            <DialogDescription id="view-order-description">
              Información completa de la orden de compra
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 text-center text-gray-500">
              Cargando detalle de la orden...
            </div>
          ) : compraSeleccionada ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">N° de Orden</Label>
                  <p className="font-medium">{compraSeleccionada.numeroOrden}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEstado(compraSeleccionada)}
                      disabled={compraSeleccionada.estado === "Anulada"}
                      className={`h-7 px-3 ${
                        compraSeleccionada.estado === "Aprobada"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : compraSeleccionada.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-red-100 text-red-800 hover:bg-red-100 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {compraSeleccionada.estado}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Proveedor</Label>
                  <p className="font-medium">{compraSeleccionada.proveedor}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Tipo de Documento</Label>
                  <p className="font-medium">
                    {compraSeleccionada.proveedorTipoDocumento || "-"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Documento / NIT</Label>
                  <p className="font-medium">
                    {compraSeleccionada.proveedorNumeroDocumento || "-"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Bodega</Label>
                  <p className="font-medium">{compraSeleccionada.bodega || "-"}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Término de Pago</Label>
                  <p className="font-medium">
                    {compraSeleccionada.terminoPago || "-"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha de Orden</Label>
                  <p className="font-medium">
                    {compraSeleccionada.fecha
                      ? new Date(compraSeleccionada.fecha).toLocaleDateString(
                          "es-CO"
                        )
                      : "-"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha de Entrega</Label>
                  <p className="font-medium">
                    {compraSeleccionada.fechaEntrega
                      ? new Date(
                          compraSeleccionada.fechaEntrega
                        ).toLocaleDateString("es-CO")
                      : "-"}
                  </p>
                </div>
              </div>

              {compraSeleccionada.productos &&
                compraSeleccionada.productos.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-gray-600 mb-2 block">
                      Productos
                    </Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-center">IVA</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {compraSeleccionada.productos.map((item, index) => (
                            <TableRow key={`${item.producto.id}-${index}`}>
                              <TableCell className="font-medium">
                                {item.producto.nombre}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.cantidad}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.ivaNombre} ({item.ivaPorcentaje}%)
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.precio.toLocaleString("es-CO")}
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.subtotal.toLocaleString("es-CO")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              <div className="border-t pt-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° de Items:</span>
                    <span className="font-medium">{compraSeleccionada.items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ${compraSeleccionada.subtotal.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">
                      ${compraSeleccionada.impuestos.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2 mt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-blue-600">
                      ${compraSeleccionada.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>

              {compraSeleccionada.observaciones && (
                <div>
                  <Label className="text-gray-600">Observaciones</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">
                    {compraSeleccionada.observaciones}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró la orden de compra
            </div>
          )}

          <DialogFooter>
            {compraSeleccionada && (
              <Button
                onClick={() => handleOpenPdfOptions(compraSeleccionada)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            )}
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
            setCompraParaDescargarPdf(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar orden de compra</DialogTitle>
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
        open={isEditar}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="edit-order-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Orden de Compra</DialogTitle>
            <DialogDescription id="edit-order-description">
              Modifica la información de la orden de compra
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 text-center text-gray-500">
              Cargando información de la orden...
            </div>
          ) : (
            <div className="space-y-6 py-4 px-2">
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-numeroOrden">Número de Orden</Label>
                  <Input
                    id="edit-numeroOrden"
                    value={formData.numeroOrden}
                    disabled
                    className="bg-gray-100 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fecha">Fecha</Label>
                  <Input
                    id="edit-fecha"
                    type="date"
                    value={formData.fecha}
                    disabled
                    className="bg-gray-100 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fechaEntrega">Fecha de Entrega *</Label>
                  <Input
                    id="edit-fechaEntrega"
                    type="date"
                    min={getFechaActual()}
                    value={formData.fechaEntrega}
                    onChange={(e) =>
                      setFormData({ ...formData, fechaEntrega: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        estado: value as CompraEstado,
                      })
                    }
                  >
                    <SelectTrigger id="edit-estado" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aprobada">Aprobada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-proveedor">Proveedor *</Label>
                  <Select
                    value={formData.proveedorId}
                    onValueChange={handleProveedorChange}
                  >
                    <SelectTrigger id="edit-proveedor" className="h-12">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedoresActivos.map((proveedor) => (
                        <SelectItem key={proveedor.id} value={String(proveedor.id)}>
                          {proveedor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-terminoPago">Término de Pago *</Label>
                  <Select
                    value={formData.terminoPagoId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, terminoPagoId: value })
                    }
                  >
                    <SelectTrigger id="edit-terminoPago" className="h-12">
                      <SelectValue placeholder="Selecciona un término de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {terminosPagoActivos.map((termino) => (
                        <SelectItem key={termino.id} value={String(termino.id)}>
                          {termino.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bodega">Bodega *</Label>
                  <Select
                    value={formData.bodegaId}
                    onValueChange={(value: string) => {
                      const bodegaSeleccionada = bodegasActivas.find(
                        (bodega) => String(bodega.id) === value
                      );

                      setFormData({
                        ...formData,
                        bodegaId: value,
                        bodega: bodegaSeleccionada?.nombre || "",
                      });
                    }}
                  >
                    <SelectTrigger id="edit-bodega" className="h-12">
                      <SelectValue placeholder="Selecciona una bodega" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasActivas.length === 0 ? (
                        <div className="px-2 py-2 text-sm text-gray-500">
                          No hay bodegas disponibles
                        </div>
                      ) : (
                        bodegasActivas.map((bodega) => (
                          <SelectItem key={bodega.id} value={String(bodega.id)}>
                            {bodega.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-proveedorTipoDocumento">
                    Tipo de Documento
                  </Label>
                  <Input
                    id="edit-proveedorTipoDocumento"
                    value={formData.proveedorTipoDocumento}
                    readOnly
                    className="bg-gray-100 h-12"
                    placeholder="Se completa al seleccionar proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-proveedorNumeroDocumento">
                    Documento / NIT
                  </Label>
                  <Input
                    id="edit-proveedorNumeroDocumento"
                    value={formData.proveedorNumeroDocumento}
                    readOnly
                    className="bg-gray-100 h-12"
                    placeholder="Se completa al seleccionar proveedor"
                  />
                </div>
              </div>

              <div className="border-t pt-10 mt-10">
                <Label className="text-lg mb-4 block">Productos de la Orden</Label>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 space-y-2">
                    <Label htmlFor="edit-producto">Producto</Label>
                    <Select
                      value={selectedProductoId}
                      onValueChange={setSelectedProductoId}
                    >
                      <SelectTrigger id="edit-producto" className="h-12">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosActivos.map((producto) => (
                          <SelectItem key={producto.id} value={String(producto.id)}>
                            {producto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-cantidad">Cantidad</Label>
                    <Input
                      id="edit-cantidad"
                      type="text"
                      inputMode="numeric"
                      value={cantidadProductoInput}
                      onChange={(e) => handleCantidadProductoChange(e.target.value)}
                      onBlur={handleCantidadProductoBlur}
                      placeholder="Ej: 50"
                      className={numberFieldClass}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-iva">IVA</Label>
                    <Select value={selectedIvaId} onValueChange={setSelectedIvaId}>
                      <SelectTrigger id="edit-iva" className="h-12">
                        <SelectValue placeholder="Selecciona IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {ivasActivos.map((iva) => (
                          <SelectItem key={iva.id} value={String(iva.id)}>
                            {iva.nombre} ({iva.porcentaje}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-precio">Precio Unitario</Label>
                    <Input
                      id="edit-precio"
                      type="number"
                      value={precioProducto}
                      onChange={(e) => setPrecioProducto(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-12 sin-flechas"
                    />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAgregarProducto}
                      className="w-full bg-green-600 hover:bg-green-700 h-12"
                    >
                      <Plus size={18} className="mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>

                {productosOrden.length > 0 && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-center">IVA</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {productosOrden.map((item) => (
                          <TableRow key={item.producto.id}>
                            <TableCell className="font-medium">
                              {item.producto.nombre}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.ivaNombre} ({item.ivaPorcentaje}%)
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.precio.toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.subtotal.toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEliminarProducto(item.producto.id)
                                }
                                className="hover:bg-red-50"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° de Items:</span>
                    <span className="font-medium">{calcularTotales.items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ${calcularTotales.subtotal.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">
                      ${calcularTotales.impuestos.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-yellow-600">
                      ${calcularTotales.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Textarea
                  id="edit-observaciones"
                  value={formData.observaciones}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value.length > MAX_OBSERVACIONES_LENGTH) {
                      toast.error(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres en observaciones`);
                      return;
                    }

                    setFormData({
                      ...formData,
                      observaciones: value,
                    });
                  }}
                  placeholder="Escribe cualquier observación sobre la orden de compra..."
                  rows={3}
                />
                  <p className="text-xs text-gray-500 text-right">
                    {formData.observaciones.length}/{MAX_OBSERVACIONES_LENGTH}
                  </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              disabled={
                isSaving ||
                isLoadingDetail ||
                compraDetalle?.estado === "Aprobada" ||
                compraDetalle?.estado === "Anulada"
              }
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSaving ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="delete-order-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Anular Orden de Compra</DialogTitle>
            <DialogDescription id="delete-order-description">
              ¿Estás seguro de que deseas anular esta orden de compra?
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 text-center text-gray-500">
              Cargando información de la orden...
            </div>
          ) : compraSeleccionada ? (
            <div className="py-4">
              {compraSeleccionada.estado === "Aprobada" ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    La orden <strong>{compraSeleccionada.numeroOrden}</strong>{" "}
                    está aprobada y no puede ser anulada.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    Esta acción no se puede deshacer. La orden{" "}
                    <strong>{compraSeleccionada.numeroOrden}</strong> será anulada.
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Proveedor:</strong> {compraSeleccionada.proveedor}
                </p>
                <p>
                  <strong>Total:</strong> $
                  {compraSeleccionada.total.toLocaleString("es-CO")}
                </p>
                <p>
                  <strong>Estado:</strong> {compraSeleccionada.estado}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró la orden de compra
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAnular}
              className="bg-red-600 hover:bg-red-700"
              disabled={
                !compraSeleccionada ||
                compraSeleccionada.estado === "Aprobada" ||
                compraSeleccionada.estado === "Anulada"
              }
            >
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
          className="max-w-lg"
          aria-describedby="confirm-estado-description"
        >
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de esta orden de compra?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Orden:</span>
              <span className="font-medium">
                {compraParaCambioEstado?.numeroOrden}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Proveedor:</span>
              <span className="font-medium">
                {compraParaCambioEstado?.proveedor}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span
                className={`font-medium ${
                  compraParaCambioEstado?.estado === "Aprobada"
                    ? "text-blue-700"
                    : "text-yellow-700"
                }`}
              >
                {compraParaCambioEstado?.estado}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span className="font-medium text-blue-700">Aprobada</span>
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

      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="success-order-description"
        >
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-order-description">
              La orden de compra se ha creado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Orden Creada!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              La orden de compra se ha registrado correctamente en el sistema
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
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
