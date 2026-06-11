import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Package,
  Plus,
  Search,
  X,
  Building2,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import logoVmanage from "../../../../assets/images/VLogo.png"

import type { AppOutletContext } from "../../../../layouts/MainLayout";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Label } from "../../../../shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../shared/components/ui/table";
import { remisionesVentaService } from "../services/remisiones-venta.services";
import type {
  CatalogoEstadoRemisionVenta,
  CreateRemisionVentaPayload,
  OrdenVentaCatalogoApi,
  RemisionVentaApi,
  UpdateRemisionVentaPayload,
} from "../types/remisiones-venta.types";

type EstadoUi = "Pendiente" | "Despachado" | "Entregado" | "Facturada" | "Anulada";

type RemisionListadoUi = {
  id: number;
  numeroRemision: string;
  ordenVenta: string;
  cliente: string;
  documentoCliente: string;
  fecha: string;
  estado: EstadoUi;
  items: number;
  total: number;
  observaciones: string;
  bodega: string;
  estadoId: number;
  fechaDespacho?: string | null;
  usuarioDespacho?: string;
  fechaAnulacion?: string | null;
  usuarioAnulo?: string;
  firmaDigital?: FirmaDigitalValue;
  nombreFirmante?: string | null;
  fechaFirma?: string | null;
  detalle: Array<{
    producto: string;
    lote: string;
    cantidad: number;
    precio: number;
    subtotal: number;
    iva: number;
  }>;
};

type FormLoteState = {
  id_existencia: number;
  lote: string;
  codigo_barras: string;
  fecha_vencimiento: string;
  cantidad_disponible: number;
  cantidad: string;
};

type FormProductoState = {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  iva: number;
  cantidad_orden: number;
  cantidad_remitida: number;
  cantidad_pendiente: number;
  cantidad_actual_remision: number;
  cantidad_maxima_editable: number;
  lotes: FormLoteState[];
};

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatMoney(value: unknown) {
  return `COP$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDateDisplay(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-CO");
}

function formatDateTimeDisplay(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNombreUsuarioGestion(
  usuario?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null
) {
  return `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();
}

type FirmaDigitalValue =
  | string
  | number[]
  | { type?: string; data?: number[] | string }
  | null
  | undefined;

function bytesToBase64(bytes: number[]) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function bytesToText(bytes: number[]) {
  try {
    return new TextDecoder().decode(new Uint8Array(bytes)).trim();
  } catch {
    return "";
  }
}

function normalizarFirmaString(value?: string | null) {
  const firma = String(value ?? "").trim();

  if (!firma) return "";

  if (firma.startsWith("data:image")) {
    return firma;
  }

  return `data:image/png;base64,${firma}`;
}

function getFirmaSrc(firma?: FirmaDigitalValue) {
  if (!firma) return "";

  if (typeof firma === "string") {
    return normalizarFirmaString(firma);
  }

  if (Array.isArray(firma)) {
    const texto = bytesToText(firma);

    if (texto.startsWith("data:image")) {
      return texto;
    }

    if (texto.startsWith("iVBOR") || texto.startsWith("/9j/")) {
      return normalizarFirmaString(texto);
    }

    return `data:image/png;base64,${bytesToBase64(firma)}`;
  }

  if (typeof firma.data === "string") {
    return normalizarFirmaString(firma.data);
  }

  if (Array.isArray(firma.data) && firma.data.length > 0) {
    const texto = bytesToText(firma.data);

    if (texto.startsWith("data:image")) {
      return texto;
    }

    if (texto.startsWith("iVBOR") || texto.startsWith("/9j/")) {
      return normalizarFirmaString(texto);
    }

    return `data:image/png;base64,${bytesToBase64(firma.data)}`;
  }

  return "";
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDocumentoClienteTexto(cliente?: any | null) {
  if (!cliente) return "No registrado";

  const numeroDocumento =
    cliente?.num_documento ??
    cliente?.numeroDocumento ??
    cliente?.numero_documento ??
    cliente?.documento ??
    "";

  if (!numeroDocumento) return "No registrado";

  const tipoDocumentoApi =
    cliente?.tipo_documento?.nombre_tipo_doc ??
    cliente?.tipo_documento?.nombre ??
    cliente?.tipoDocumento ??
    cliente?.tipo_documento ??
    cliente?.tipo_doc ??
    cliente?.tipoDoc ??
    cliente?.nombre_tipo_doc ??
    "";

  const numeroDocumentoTexto = String(numeroDocumento).trim();

  const tipoDocumento =
    String(tipoDocumentoApi).trim() ||
    (numeroDocumentoTexto.startsWith("9") || numeroDocumentoTexto.startsWith("8")
      ? "NIT"
      : "CC");

  return `${tipoDocumento}: ${numeroDocumentoTexto}`;
}

function calcularTotalesConIva(
  items: Array<{ subtotal: number; iva?: number }>
) {
  let subtotalSinIva = 0;
  let totalIva = 0;
  const impuestosPorPorcentaje: Record<number, number> = {};

  items.forEach((item) => {
    const subtotal = Number(item.subtotal || 0);
    const ivaPorcentaje = Number(item.iva || 0);
    const ivaValor = subtotal * (ivaPorcentaje / 100);

    subtotalSinIva += subtotal;
    totalIva += ivaValor;

    if (ivaPorcentaje > 0) {
      if (!impuestosPorPorcentaje[ivaPorcentaje]) {
        impuestosPorPorcentaje[ivaPorcentaje] = 0;
      }

      impuestosPorPorcentaje[ivaPorcentaje] += ivaValor;
    }
  });

  return {
    subtotalSinIva,
    totalIva,
    impuestosPorPorcentaje,
    total: subtotalSinIva + totalIva,
  };
}

function mapEstado(nombre?: string | null): EstadoUi {
  const text = normalizeText(nombre);

  if (text.includes("anulad")) return "Anulada";
  if (text.includes("entreg")) return "Entregado";
  if (text.includes("despach") || text.includes("aprob")) return "Despachado";
  if (text.includes("factur")) return "Facturada";
  return "Pendiente";
}

function buildRemisionUi(item: RemisionVentaApi): RemisionListadoUi {
  const detalle = (item.detalle_remision_venta ?? []).map((d) => {
    const cantidad = toNumber(d.cantidad);
    const precio = toNumber(d.precio_unitario);
    const iva = toNumber(d.iva);

    return {
      producto: d.existencias?.producto?.nombre_producto ?? "Producto",
      lote: d.existencias?.lote ?? "",
      cantidad,
      precio,
      subtotal: cantidad * precio,
      iva,
    };
  });

  const totales = calcularTotalesConIva(detalle);
  const usuarioDespacho = getNombreUsuarioGestion(item.usuario_despacho);
  const usuarioAnulo = getNombreUsuarioGestion(item.usuario_anulo);

  return {
    id: item.id_remision_venta,
    numeroRemision:
      item.codigo_remision_venta ||
      `RV-${String(item.id_remision_venta).padStart(4, "0")}`,
    ordenVenta:
      item.orden_venta?.codigo_orden_venta ||
      `OV-${String(item.id_orden_venta).padStart(4, "0")}`,
    cliente: item.cliente?.nombre_cliente ?? "Cliente",
    documentoCliente: getDocumentoClienteTexto(item.cliente),
    fecha: normalizeDate(item.fecha_creacion),
    estado: mapEstado(item.estado_remision_venta?.nombre_estado),
    items: detalle.length,
    total: totales.total,
    observaciones: item.observaciones ?? "",
    bodega: item.orden_venta?.bodega?.nombre_bodega ?? "",
    estadoId:
      item.estado_remision_venta?.id_estado_remision_venta ??
      item.id_estado_remision_venta,
    fechaDespacho: item.fecha_despacho ?? null,
    usuarioDespacho,
    fechaAnulacion: item.fecha_anulacion ?? null,
    usuarioAnulo,
    firmaDigital: item.firma_digital ?? null,
    nombreFirmante: item.nombre_firmante ?? null,
    fechaFirma: item.fecha_firma ?? null,
    detalle,
  };
}

const puedeEditarRemision = (estado: EstadoUi) =>
  estado === "Pendiente" || estado === "Despachado";

const puedeAnularRemision = (estado: EstadoUi) =>
  estado !== "Entregado" && estado !== "Anulada" && estado !== "Facturada";

const puedeCambiarEstadoRemision = (estado: EstadoUi) =>
  estado !== "Entregado" && estado !== "Facturada" && estado !== "Anulada";

function getEstadoRemisionButtonClass(estado: EstadoUi) {
  if (estado === "Pendiente") {
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }

  if (estado === "Despachado") {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200";
  }

  if (estado === "Entregado") {
    return "bg-green-100 text-green-800 opacity-70 cursor-not-allowed hover:bg-green-100";
  }

  if (estado === "Facturada") {
    return "bg-indigo-100 text-indigo-800 opacity-70 cursor-not-allowed hover:bg-indigo-100";
  }

  return "bg-red-100 text-red-800 opacity-70 cursor-not-allowed hover:bg-red-100";
}

function getEstadoRemisionBadgeClass(estado: EstadoUi) {
  if (estado === "Pendiente") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (estado === "Despachado") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (estado === "Entregado") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (estado === "Facturada") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getSiguienteEstadoTexto(estado: EstadoUi) {
  if (estado === "Pendiente") return "Cambiar a Despachado";
  if (estado === "Despachado") return "Cambiar a Entregado";
  if (estado === "Entregado") return "Ya está entregada";
  if (estado === "Facturada") return "Ya está facturada";
  return "Ya está anulada";
}

function getGestionRemisionTexto(remision: RemisionListadoUi) {
  if (remision.estado === "Despachado") {
    return `${remision.usuarioDespacho || "—"} - ${formatDateDisplay(
      remision.fechaDespacho
    )}`;
  }

  if (remision.estado === "Entregado" || remision.estado === "Facturada") {
    return `${remision.usuarioDespacho || "—"} - ${formatDateDisplay(
      remision.fechaDespacho
    )}`;
  }

  if (remision.estado === "Anulada") {
    return `${remision.usuarioAnulo || "—"} - ${formatDateDisplay(
      remision.fechaAnulacion
    )}`;
  }

  return "Pendiente de despacho";
}

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

export default function RemisionesVenta() {
  const outlet = useOutletContext<AppOutletContext>() as AppOutletContext & {
    selectedBodegaId?: number | null;
    selectedBodegaNombre?: string;
    currentUser?: {
      id?: number | string;
      id_usuario?: number | string;
      bodega?: string;
    } | null;
  };

  const selectedBodegaId = Number(outlet?.selectedBodegaId ?? 0) || undefined;
  const selectedBodegaNombre =
    outlet?.selectedBodegaNombre ?? "Todas las bodegas";
  const currentUserId = Number(
    outlet?.currentUser?.id_usuario ?? outlet?.currentUser?.id ?? 0
  );

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/remisiones-venta/crear");
  const isEditar = location.pathname.endsWith("/editar");
  const isVer = location.pathname.endsWith("/ver");
  const isAnular = location.pathname.endsWith("/anular");
  const isFormularioAbierto = isCrear || isEditar;

  const [searchTerm, setSearchTerm] = useState("");
  const [remisiones, setRemisiones] = useState<RemisionListadoUi[]>([]);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState<
    OrdenVentaCatalogoApi[]
  >([]);
  const [estados, setEstados] = useState<CatalogoEstadoRemisionVenta[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [, setFormNumeroRemision] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [formOrdenId, setFormOrdenId] = useState("");
  const [formOrdenOriginalId, setFormOrdenOriginalId] = useState("");
  const [formEstadoId, setFormEstadoId] = useState("");
  const [, setFormCliente] = useState("");
  const [formProductos, setFormProductos] = useState<FormProductoState[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "La remisión de venta se creó correctamente."
  );
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [remisionCambioEstado, setRemisionCambioEstado] =
    useState<RemisionListadoUi | null>(null);
  const [estadoDestino, setEstadoDestino] = useState<{
    id: number;
    nombre: EstadoUi;
  } | null>(null);

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState("");
  const [firmaValida, setFirmaValida] = useState(false);
  const [nombreFirmante, setNombreFirmante] = useState("");
  const firmaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const firmaDibujandoRef = useRef(false);

  const [remisionDetalleCompleta, setRemisionDetalleCompleta] =
    useState<RemisionListadoUi | null>(null);

  const remisionListadoSeleccionada = useMemo(() => {
    if (!params.id) return null;

    const id = Number(params.id);

    if (!Number.isFinite(id)) return null;

    return remisiones.find((item) => item.id === id) ?? null;
  }, [params.id, remisiones]);

  const remisionSeleccionada =
    remisionDetalleCompleta ?? remisionListadoSeleccionada;

  const estadoPendienteId = useMemo(
    () =>
      estados.find((item) => normalizeText(item.nombre_estado).includes("pend"))
        ?.id_estado_remision_venta ?? "",
    [estados]
  );

  const getEstadoIdPorNombre = (nombre: EstadoUi) =>
    estados.find((item) => {
      const n = normalizeText(item.nombre_estado);
      if (nombre === "Pendiente") return n.includes("pend");
      if (nombre === "Despachado") return n.includes("despach") || n.includes("aprob");
      if (nombre === "Entregado") return n.includes("entreg");
      if (nombre === "Facturada") return n.includes("factur");
      if (nombre === "Anulada") return n.includes("anulad");
      return false;
    })?.id_estado_remision_venta;

  const cargarTodo = async () => {
    try {
      setLoading(true);

      const [listado, catalogos] = await Promise.all([
        remisionesVentaService.getAll(selectedBodegaId),
        remisionesVentaService.getCatalogos(selectedBodegaId),
      ]);

      setRemisiones(listado.map(buildRemisionUi));
      setOrdenesDisponibles(catalogos.ordenes);
      setEstados(catalogos.estados);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudieron cargar las remisiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarTodo();
  }, [selectedBodegaId]);

  useEffect(() => {
    if (!isVer || !params.id) {
      setRemisionDetalleCompleta(null);
      return;
    }

    const idRemision = Number(params.id);

    if (!Number.isFinite(idRemision)) {
      setRemisionDetalleCompleta(null);
      return;
    }

    let activo = true;

    const cargarDetalleCompleto = async () => {
      try {
        const remision = await remisionesVentaService.getOne(idRemision);

        if (!activo) return;

        setRemisionDetalleCompleta(buildRemisionUi(remision));
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "No se pudo cargar el detalle de la remisión");
      }
    };

    void cargarDetalleCompleto();

    return () => {
      activo = false;
    };
  }, [isVer, params.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaId]);

  useEffect(() => {
    if (!isCrear) return;

    setFormNumeroRemision("Se genera automáticamente");
    setFormFecha(new Date().toISOString().split("T")[0]);
    setFormObservaciones("");
    setFormOrdenId("");
    setFormOrdenOriginalId("");
    setFormEstadoId(String(estadoPendienteId || ""));
    setFormCliente("");
    setFormProductos([]);
  }, [isCrear, estadoPendienteId]);

  useEffect(() => {
    const cargarEdicion = async () => {
      if (!isEditar || !params.id) return;

      try {
        const idRemision = Number(params.id);
        if (!Number.isFinite(idRemision)) return;

        const [catalogos, remision] = await Promise.all([
          remisionesVentaService.getCatalogos(selectedBodegaId, idRemision),
          remisionesVentaService.getOne(idRemision),
        ]);

        const estadoActualRemision = mapEstado(
          remision.estado_remision_venta?.nombre_estado
        );

        if (!puedeEditarRemision(estadoActualRemision)) {
          toast.error(`No se puede editar una remisión en estado ${estadoActualRemision}`);
          navigate("/app/remisiones-venta");
          return;
        }

        setOrdenesDisponibles(catalogos.ordenes);
        setEstados(catalogos.estados);

        const orden = catalogos.ordenes.find(
          (item) => item.id_orden_venta === remision.id_orden_venta
        );

        if (!orden) {
          toast.error(
            "No se pudo cargar la orden asociada a esta remisión para editarla"
          );
          return;
        }

        const cantidadesPorProductoYLote = new Map<number, Map<number, number>>();

        for (const detalle of remision.detalle_remision_venta ?? []) {
          const idProducto = Number(
            detalle.existencias?.id_producto ??
            detalle.existencias?.producto?.id_producto ??
            0
          );
          const idExistencia = Number(detalle.existencias?.id_existencia ?? 0);
          const cantidad = toNumber(detalle.cantidad);

          if (!idProducto || !idExistencia) continue;

          if (!cantidadesPorProductoYLote.has(idProducto)) {
            cantidadesPorProductoYLote.set(idProducto, new Map<number, number>());
          }

          cantidadesPorProductoYLote
            .get(idProducto)!
            .set(idExistencia, cantidad);
        }

        setFormNumeroRemision(
          remision.codigo_remision_venta ||
          `RMV-${String(remision.id_remision_venta).padStart(4, "0")}`
        );
        setFormFecha(
          normalizeDate(remision.fecha_creacion) ||
          new Date().toISOString().split("T")[0]
        );
        setFormObservaciones(remision.observaciones ?? "");
        setFormOrdenId(String(remision.id_orden_venta));
        setFormOrdenOriginalId(String(remision.id_orden_venta));
        setFormEstadoId(String(remision.id_estado_remision_venta));
        setFormCliente(
          remision.cliente?.nombre_cliente ?? orden.cliente?.nombre_cliente ?? ""
        );

        const productos = (orden.detalle ?? []).map((detalle) => {
          const seleccionados =
            cantidadesPorProductoYLote.get(detalle.id_producto) ??
            new Map<number, number>();

          const cantidadOrden = toNumber(detalle.cantidad_orden);
          const cantidadRemitidaBackend = toNumber(detalle.cantidad_remitida);

          const cantidadActualRemision = Array.from(seleccionados.values()).reduce(
            (acc, cantidad) => acc + toNumber(cantidad),
            0
          );

          const cantidadRemitidaVisible = Math.max(
            cantidadRemitidaBackend,
            cantidadActualRemision
          );

          const cantidadPendienteVisible = Math.max(
            cantidadOrden - cantidadRemitidaVisible,
            0
          );

          const cantidadMaximaEditable =
            cantidadPendienteVisible + cantidadActualRemision;

          return {
            id_producto: detalle.id_producto,
            nombre: detalle.producto?.nombre_producto ?? "Producto",
            precio_unitario: toNumber(detalle.precio_unitario),
            iva: toNumber(detalle.producto?.iva?.porcentaje),
            cantidad_orden: cantidadOrden,
            cantidad_remitida: cantidadRemitidaVisible,
            cantidad_pendiente: cantidadPendienteVisible,
            cantidad_actual_remision: cantidadActualRemision,
            cantidad_maxima_editable: cantidadMaximaEditable,
            lotes: (detalle.existencias_disponibles ?? []).map((lote) => ({
              id_existencia: lote.id_existencia,
              lote: lote.lote ?? "",
              codigo_barras: lote.codigo_barras ?? "",
              fecha_vencimiento: normalizeDate(lote.fecha_vencimiento),
              cantidad_disponible: toNumber(lote.cantidad_disponible),
              cantidad: seleccionados.has(lote.id_existencia)
                ? String(seleccionados.get(lote.id_existencia))
                : "",
            })),
          };
        });

        setFormProductos(productos);
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "No se pudo cargar la remisión a editar");
      }
    };

    void cargarEdicion();
  }, [isEditar, params.id, selectedBodegaId]);

  const filteredRemisiones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return remisiones;

    return remisiones.filter((item) => {
      return (
        item.numeroRemision.toLowerCase().includes(term) ||
        item.ordenVenta.toLowerCase().includes(term) ||
        item.cliente.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term) ||
        item.items.toString().includes(term)
      );
    });
  }, [remisiones, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRemisiones.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const stats = useMemo(() => {
    return {
      totalRemisiones: filteredRemisiones.length,
      pendientes: filteredRemisiones.filter((r) => r.estado === "Pendiente")
        .length,
      despachadas: filteredRemisiones.filter((r) => r.estado === "Despachado")
        .length,
      anuladas: filteredRemisiones.filter((r) => r.estado === "Anulada").length,
    };
  }, [filteredRemisiones]);

  const ordenSeleccionada = useMemo(() => {
    const id = Number(formOrdenId);
    if (!id) return null;
    return ordenesDisponibles.find((o) => o.id_orden_venta === id) ?? null;
  }, [formOrdenId, ordenesDisponibles]);

  const estadoFormularioActual = useMemo<EstadoUi>(() => {
    const estado = estados.find(
      (item) => String(item.id_estado_remision_venta) === formEstadoId
    );

    return mapEstado(estado?.nombre_estado);
  }, [estados, formEstadoId]);

  const isEditarPendiente = isEditar && estadoFormularioActual === "Pendiente";
  const isEditarDespachado = isEditar && estadoFormularioActual === "Despachado";
  const formularioSoloLecturaOperativa =
    isEditar && estadoFormularioActual !== "Pendiente";

  const puedeCambiarOrdenFormulario =
    isCrear || isEditarPendiente;

  const documentoClienteSeleccionado = useMemo(() => {
    return getDocumentoClienteTexto(ordenSeleccionada?.cliente);
  }, [ordenSeleccionada]);

  const bodegaFormularioNombre = useMemo(() => {
    return (
      ordenSeleccionada?.bodega?.nombre_bodega ??
      selectedBodegaNombre ??
      "Sin bodega"
    );
  }, [ordenSeleccionada, selectedBodegaNombre]);

  const totalesFormulario = useMemo(() => {
    const items = formProductos.map((producto) => {
      const subtotal = producto.lotes.reduce(
        (sum, lote) => sum + toNumber(lote.cantidad) * producto.precio_unitario,
        0
      );

      return {
        subtotal,
        iva: producto.iva,
      };
    });

    return calcularTotalesConIva(items);
  }, [formProductos]);

  const cantidadTotalItemsFormulario = useMemo(() => {
    return formProductos.reduce(
      (acc, producto) =>
        acc + producto.lotes.filter((lote) => toNumber(lote.cantidad) > 0).length,
      0
    );
  }, [formProductos]);

  const limpiarFirma = () => {
    const canvas = firmaCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setFirmaDigital("");
    setFirmaValida(false);
  };

  useEffect(() => {
    if (!showFirmaModal) return;

    const canvas = firmaCanvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setFirmaDigital("");
    setFirmaValida(false);
  }, [showFirmaModal]);

  const getFirmaPoint = (event: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = firmaCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return null;

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const iniciarFirma = (event: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const canvas = firmaCanvasRef.current;
    const point = getFirmaPoint(event);

    if (!canvas || !point) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    firmaDibujandoRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const moverFirma = (event: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    if (!firmaDibujandoRef.current) return;

    event.preventDefault();

    const canvas = firmaCanvasRef.current;
    const point = getFirmaPoint(event);

    if (!canvas || !point) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    setFirmaValida(true);
    setFirmaDigital(canvas.toDataURL("image/png"));
  };

  const finalizarFirma = () => {
    if (!firmaDibujandoRef.current) return;

    firmaDibujandoRef.current = false;

    const canvas = firmaCanvasRef.current;
    if (!canvas) return;

    setFirmaDigital(canvas.toDataURL("image/png"));
  };

  const handleOrdenChange = (ordenId: string) => {
    if (!puedeCambiarOrdenFormulario) {
      toast.info("No puedes cambiar la orden asociada cuando la remisión ya fue despachada");
      return;
    }
    setFormOrdenId(ordenId);

    const orden = ordenesDisponibles.find(
      (item) => item.id_orden_venta === Number(ordenId)
    );

    if (!orden) {
      setFormCliente("");
      setFormProductos([]);
      return;
    }

    setFormCliente(orden.cliente?.nombre_cliente ?? "");

    const productos = (orden.detalle ?? []).map((detalle) => {
      const cantidadPendiente = toNumber(detalle.cantidad_pendiente);

      return {
        id_producto: detalle.id_producto,
        nombre: detalle.producto?.nombre_producto ?? "Producto",
        precio_unitario: toNumber(detalle.precio_unitario),
        iva: toNumber(detalle.producto?.iva?.porcentaje),
        cantidad_orden: toNumber(detalle.cantidad_orden),
        cantidad_remitida: toNumber(detalle.cantidad_remitida),
        cantidad_pendiente: cantidadPendiente,
        cantidad_actual_remision: 0,
        cantidad_maxima_editable: cantidadPendiente,
        lotes: (detalle.existencias_disponibles ?? []).map((lote) => ({
          id_existencia: lote.id_existencia,
          lote: lote.lote ?? "",
          codigo_barras: lote.codigo_barras ?? "",
          fecha_vencimiento: normalizeDate(lote.fecha_vencimiento),
          cantidad_disponible: toNumber(lote.cantidad_disponible),
          cantidad: "",
        })),
      };
    });

    setFormProductos(productos);
  };

  const handleCantidadLoteChange = (
    idProducto: number,
    idExistencia: number,
    value: string
  ) => {
    setFormProductos((prev) =>
      prev.map((producto) => {
        if (producto.id_producto !== idProducto) return producto;

        return {
          ...producto,
          lotes: producto.lotes.map((lote) =>
            lote.id_existencia === idExistencia
              ? { ...lote, cantidad: value }
              : lote
          ),
        };
      })
    );
  };

  const getCantidadSolicitadaProducto = (producto: FormProductoState) =>
    producto.lotes.reduce((acc, lote) => acc + toNumber(lote.cantidad), 0);

  const getCantidadFaltanteProducto = (producto: FormProductoState) => {
    const seleccionada = getCantidadSolicitadaProducto(producto);
    return Math.max(producto.cantidad_pendiente - seleccionada, 0);
  };

  const getCantidadExcedidaProducto = (producto: FormProductoState) => {
    const seleccionada = getCantidadSolicitadaProducto(producto);
    return Math.max(seleccionada - producto.cantidad_pendiente, 0);
  };

  const handleUsarFaltanteLote = (
    idProducto: number,
    idExistencia: number
  ) => {
    const producto = formProductos.find(
      (item) => Number(item.id_producto) === Number(idProducto)
    );

    if (!producto) return;

    const lote = producto.lotes.find(
      (item) => Number(item.id_existencia) === Number(idExistencia)
    );

    if (!lote) return;

    const cantidadActualLote = toNumber(lote.cantidad);
    const seleccionadoProducto = getCantidadSolicitadaProducto(producto);
    const faltanteProducto = Math.max(
      producto.cantidad_pendiente - seleccionadoProducto,
      0
    );

    const cantidadAUsar = Math.min(
      lote.cantidad_disponible,
      cantidadActualLote + faltanteProducto
    );

    handleCantidadLoteChange(
      producto.id_producto,
      lote.id_existencia,
      cantidadAUsar > 0 ? String(cantidadAUsar) : ""
    );
  };

  const handleLimpiarLote = (idProducto: number, idExistencia: number) => {
    handleCantidadLoteChange(idProducto, idExistencia, "");
  };

  const validarFormulario = () => {
    if (!currentUserId) {
      toast.error("No se pudo identificar el usuario actual");
      return false;
    }

    if (!formOrdenId) {
      toast.error("Debes seleccionar una orden de venta aprobada");
      return false;
    }

    if (!formEstadoId) {
      toast.error("Debes seleccionar un estado");
      return false;
    }

    const detalleConCantidad = formProductos
      .map((producto) => ({
        ...producto,
        cantidadSolicitada: getCantidadSolicitadaProducto(producto),
      }))
      .filter((producto) => producto.cantidadSolicitada > 0);

    if (detalleConCantidad.length === 0) {
      toast.error("Debes remitir al menos una cantidad");
      return false;
    }

    for (const producto of detalleConCantidad) {
      if (producto.cantidadSolicitada > producto.cantidad_maxima_editable) {
        toast.error(
          `La cantidad solicitada de ${producto.nombre} supera lo disponible para editar`
        );
        return false;
      }

      for (const lote of producto.lotes) {
        const cantidad = toNumber(lote.cantidad);
        if (cantidad > lote.cantidad_disponible) {
          toast.error(
            `La cantidad del lote ${lote.lote || lote.id_existencia} supera la disponible`
          );
          return false;
        }
      }
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!currentUserId) {
      toast.error("No se pudo identificar el usuario actual");
      return;
    }

    if (isEditarDespachado) {
      if (!params.id) return;

      if (!formObservaciones.trim()) {
        toast.error("Debes ingresar una observación para actualizar la remisión");
        return;
      }

      const payload: UpdateRemisionVentaPayload = {
        fecha_creacion: formFecha,
        fecha_vencimiento: null,
        observaciones: formObservaciones.trim(),
        id_orden_venta: Number(formOrdenOriginalId || formOrdenId),
        id_estado_remision_venta: Number(formEstadoId),
        id_usuario_creador: currentUserId,
        detalle: formProductos
          .map((producto) => ({
            id_producto: producto.id_producto,
            lotes: producto.lotes
              .map((lote) => ({
                id_existencia: lote.id_existencia,
                cantidad: toNumber(lote.cantidad),
              }))
              .filter((lote) => lote.cantidad > 0),
          }))
          .filter((producto) => producto.lotes.length > 0),
      };

      try {
        await remisionesVentaService.update(Number(params.id), payload);
        await cargarTodo();
        toast.success("Observaciones actualizadas correctamente");
        navigate("/app/remisiones-venta");
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "No se pudieron actualizar las observaciones");
      }

      return;
    }

    if (!validarFormulario()) return;

    const idOrdenVentaParaGuardar =
      isEditar && !puedeCambiarOrdenFormulario && formOrdenOriginalId
        ? Number(formOrdenOriginalId)
        : Number(formOrdenId);

    const payload: CreateRemisionVentaPayload | UpdateRemisionVentaPayload = {
      fecha_creacion: formFecha,
      fecha_vencimiento: null,
      observaciones: formObservaciones.trim() || null,
      id_orden_venta: idOrdenVentaParaGuardar,
      id_estado_remision_venta: Number(formEstadoId),
      id_usuario_creador: currentUserId,
      detalle: formProductos
        .map((producto) => ({
          id_producto: producto.id_producto,
          lotes: producto.lotes
            .map((lote) => ({
              id_existencia: lote.id_existencia,
              cantidad: toNumber(lote.cantidad),
            }))
            .filter((lote) => lote.cantidad > 0),
        }))
        .filter((producto) => producto.lotes.length > 0),
    };

    try {
      if (isEditar && params.id) {
        await remisionesVentaService.update(Number(params.id), payload);
        setSuccessMessage("La remisión de venta se actualizó correctamente.");
      } else {
        await remisionesVentaService.create(payload);
        setSuccessMessage("La remisión de venta se creó correctamente.");
      }

      await cargarTodo();
      navigate("/app/remisiones-venta");
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message ||
        (isEditar
          ? "No se pudo actualizar la remisión"
          : "No se pudo crear la remisión")
      );
    }
  };

  const handleView = (remision: RemisionListadoUi) => {
    navigate(`/app/remisiones-venta/${remision.id}/ver`);
  };

  const handleEdit = (remision: RemisionListadoUi) => {
    if (!puedeEditarRemision(remision.estado)) {
      toast.info("Solo se pueden editar remisiones pendientes o despachadas");
      return;
    }

    navigate(`/app/remisiones-venta/${remision.id}/editar`);
  };
  const handleAnular = (remision: RemisionListadoUi) => {
    navigate(`/app/remisiones-venta/${remision.id}/anular`);
  };

  const closeToList = () => navigate("/app/remisiones-venta");

  const handleToggleEstado = (remision: RemisionListadoUi) => {
    let siguiente: EstadoUi | null = null;

    if (remision.estado === "Pendiente") siguiente = "Despachado";
    else if (remision.estado === "Despachado") siguiente = "Entregado";
    else if (remision.estado === "Entregado") {
      toast.info("Esta remisión ya está entregada");
      return;
    } else if (remision.estado === "Facturada") {
      toast.info("Esta remisión ya está facturada");
      return;
    } else {
      toast.info("Las remisiones anuladas no pueden cambiar de estado");
      return;
    }

    const estadoId = getEstadoIdPorNombre(siguiente);
    if (!estadoId) {
      toast.error(`No encontré el estado ${siguiente} en el backend`);
      return;
    }

    setRemisionCambioEstado(remision);
    setEstadoDestino({ id: estadoId, nombre: siguiente });

    if (siguiente === "Entregado") {
      setShowFirmaModal(true);
      return;
    }

    setShowConfirmEstadoModal(true);
  };

  const resetCambioEstado = () => {
    setShowConfirmEstadoModal(false);
    setShowFirmaModal(false);
    setRemisionCambioEstado(null);
    setEstadoDestino(null);
    setFirmaDigital("");
    setFirmaValida(false);
    setNombreFirmante("");
  };

  const handleConfirmEstado = async () => {
    if (!remisionCambioEstado || !estadoDestino) return;

    if (estadoDestino.nombre === "Entregado" && !firmaValida) {
      toast.error("Debes capturar la firma del cliente antes de continuar");
      return;
    }
    if (estadoDestino.nombre === "Entregado" && !nombreFirmante.trim()) {
      toast.error("Debes ingresar el nombre de la persona que recibe");
      return;
    }

    try {
      await remisionesVentaService.updateEstado(remisionCambioEstado.id, {
        id_estado_remision_venta: estadoDestino.id,
        firma_digital:
          estadoDestino.nombre === "Entregado" ? firmaDigital : undefined,
        nombre_firmante:
          estadoDestino.nombre === "Entregado"
            ? nombreFirmante.trim()
            : undefined,
      });
      await cargarTodo();
      toast.success(`Estado actualizado a ${estadoDestino.nombre}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo actualizar el estado");
    } finally {
      resetCambioEstado();
    }
  };

  const confirmAnular = async () => {
    if (!remisionSeleccionada) return;

    const estadoId = getEstadoIdPorNombre("Anulada");
    if (!estadoId) {
      toast.error("No encontré el estado Anulada en el backend");
      return;
    }

    try {
      await remisionesVentaService.updateEstado(remisionSeleccionada.id, {
        id_estado_remision_venta: estadoId,
      });
      await cargarTodo();
      toast.success("Remisión anulada exitosamente");
      closeToList();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo anular la remisión");
    }
  };

  const generarPDF = async (remision: RemisionListadoUi) => {
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
      infoBg: [219, 234, 254] as const,
      infoText: [30, 64, 175] as const,
      border: [226, 232, 240] as const,
    };

    const formatMoneyPdf = (value: number) =>
      `COP$${Number(value || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formatDatePdf = (value?: string | null) =>
      value ? new Date(value).toLocaleDateString("es-CO") : "-";

    const getEstadoStyle = (estado: EstadoUi) => {
      if (estado === "Entregado" || estado === "Facturada") {
        return {
          bg: COLORS.successBg,
          text: COLORS.successText,
          label: estado,
        };
      }

      if (estado === "Despachado") {
        return {
          bg: COLORS.infoBg,
          text: COLORS.infoText,
          label: estado,
        };
      }

      if (estado === "Anulada") {
        return {
          bg: COLORS.dangerBg,
          text: COLORS.dangerText,
          label: estado,
        };
      }

      return {
        bg: COLORS.warningBg,
        text: COLORS.warningText,
        label: estado || "Pendiente",
      };
    };

    let logo: PdfImageInfo | null = null;
    try {
      logo = await loadImageInfoAsDataUrl(logoVmanage);
    } catch (error) {
      console.warn("No se pudo cargar el logo para el PDF:", error);
    }

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

    const detallePdf = remision.detalle.map((item) => {
      const cantidad = toNumber(item.cantidad);
      const precio = toNumber(item.precio);
      const ivaPorcentaje = toNumber(item.iva);
      const subtotal = cantidad * precio;
      const ivaValor = subtotal * (ivaPorcentaje / 100);

      return {
        producto: item.producto || "-",
        lote: item.lote || "-",
        cantidad,
        ivaPorcentaje,
        precio,
        subtotal,
        ivaValor,
      };
    });

    const subtotalGeneral = detallePdf.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    const ivaGeneral = detallePdf.reduce(
      (acc, item) => acc + item.ivaValor,
      0
    );

    const totalGeneral = subtotalGeneral + ivaGeneral;

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("REMISIÓN DE VENTA", pageWidth / 2, 14.8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("VManage • Gestión empresarial", pageWidth / 2, 21.8, {
      align: "center",
    });

    // Datos derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.text(`Código: ${remision.numeroRemision || "-"}`, rightX, 11.5, {
      align: "right",
    });
    doc.text(`Fecha: ${formatDatePdf(remision.fecha)}`, rightX, 17.8, {
      align: "right",
    });
    doc.text(`Bodega: ${remision.bodega || "-"}`, rightX, 24.1, {
      align: "right",
    });

    // Tarjeta información general
    doc.setFillColor(...COLORS.card);
    doc.roundedRect(marginX, 42, pageWidth - marginX * 2, 44, 3, 3, "F");

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Información general", marginX + 4, 49);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);

    const clienteLines = doc.splitTextToSize(remision.cliente || "-", 70);
    const documentoCliente = remision.documentoCliente || "No registrado";
    const documentoLines = doc.splitTextToSize(documentoCliente, 70);

    doc.text("Cliente:", marginX + 4, 56);
    doc.text(clienteLines, marginX + 28, 56);

    doc.text("Documento:", marginX + 4, 63);
    doc.text(documentoLines, marginX + 28, 63);

    doc.text("Orden venta:", marginX + 4, 70);
    doc.text(remision.ordenVenta || "-", marginX + 28, 70);

    doc.text("Bodega:", marginX + 4, 78);
    doc.text(remision.bodega || "-", marginX + 28, 78);

    doc.text("Items:", 112, 56);
    doc.text(String(remision.items || 0), 126, 56);

    const estadoStyle = getEstadoStyle(remision.estado);
    doc.setFillColor(estadoStyle.bg[0], estadoStyle.bg[1], estadoStyle.bg[2]);
    doc.roundedRect(112, 60, 44, 9.5, 3, 3, "F");

    doc.setTextColor(estadoStyle.text[0], estadoStyle.text[1], estadoStyle.text[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Estado: ${estadoStyle.label}`, 134, 66.4, { align: "center" });

    doc.setDrawColor(...COLORS.primaryLine);
    doc.setLineWidth(0.6);
    doc.line(marginX, 94, rightX, 94);

    // Tabla
    autoTable(doc, {
      startY: 100,
      margin: { left: marginX, right: marginX },
      head: [["Producto", "Lote", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]],
      body: detallePdf.length
        ? detallePdf.map((item) => [
          item.producto,
          item.lote,
          String(item.cantidad ?? 0),
          `IVA (${item.ivaPorcentaje.toFixed(2)}%)`,
          formatMoneyPdf(item.precio || 0),
          formatMoneyPdf(item.subtotal || 0),
        ])
        : [["Sin productos", "-", "-", "-", "-", "-"]],
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
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 28, halign: "center" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 24, halign: "center" },
        4: { cellWidth: 28, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || 100) + 8;

    const observacionesLines = remision.observaciones
      ? doc.splitTextToSize(remision.observaciones, 95)
      : [];

    const observacionesHeight = remision.observaciones
      ? Math.max(24, 12 + observacionesLines.length * 4.5)
      : 0;

    const totalsHeight = 31;
    const blockHeight = Math.max(observacionesHeight, totalsHeight);

    if (currentY + blockHeight > pageHeight - 24) {
      doc.addPage();
      currentY = 20;
    }

    if (remision.observaciones) {
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(marginX, currentY, 108, observacionesHeight, 3, 3, "F");

      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Observaciones", marginX + 4, currentY + 7);

      doc.setTextColor(87, 83, 78);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.7);
      doc.text(observacionesLines, marginX + 4, currentY + 13);
    }

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

    doc.save(`Remision_Venta_${remision.numeroRemision}.pdf`);
  };

  const handleDescargarPDF = async (remision: RemisionListadoUi) => {
    try {
      const detalle =
        remision.detalle.length > 0
          ? remision
          : buildRemisionUi(await remisionesVentaService.getOne(remision.id));

      await generarPDF(detalle);
      toast.success(`PDF de la remisión ${detalle.numeroRemision} descargado exitosamente`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo generar el PDF");
    }
  };

  const getPendienteOrdenOption = (orden: OrdenVentaCatalogoApi) => {
    if (isEditar && String(orden.id_orden_venta) === formOrdenId) {
      return formProductos.reduce(
        (acc, producto) => acc + toNumber(producto.cantidad_pendiente),
        0
      );
    }

    return orden.cantidad_pendiente_total;
  };

  const totalesRemisionSeleccionada = useMemo(() => {
    if (!remisionSeleccionada) {
      return {
        subtotalSinIva: 0,
        totalIva: 0,
        impuestosPorPorcentaje: {},
        total: 0,
      };
    }
    return calcularTotalesConIva(remisionSeleccionada.detalle);
  }, [remisionSeleccionada]);

  const firmaSrcRemisionSeleccionada = useMemo(() => {
    return getFirmaSrc(remisionSeleccionada?.firmaDigital);
  }, [remisionSeleccionada]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Remisiones de Venta</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Gestiona las remisiones de venta en
          </p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {selectedBodegaNombre}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Remisiones</p>
              <p className="text-3xl mt-2">{stats.totalRemisiones}</p>
            </div>
            <FileText className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendientes</p>
              <p className="text-3xl mt-2">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-200" size={40} />
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Despachadas</p>
              <p className="text-3xl mt-2">{stats.despachadas}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
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
              placeholder="Buscar por remisión, orden, cliente, estado o items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <Button
            onClick={() => navigate("/app/remisiones-venta/crear")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus size={20} className="mr-2" />
            Nueva Remisión
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>#</TableHead>
                <TableHead>N° Remisión</TableHead>
                <TableHead>N° Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento / NIT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Despacho / Anulación</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No se encontraron remisiones de venta
                  </TableCell>
                </TableRow>
              ) : (
                currentRemisiones.map((remision, index) => (
                  <TableRow key={remision.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {remision.numeroRemision}
                    </TableCell>
                    <TableCell>{remision.ordenVenta}</TableCell>
                    <TableCell>{remision.cliente}</TableCell>
                    <TableCell>{remision.documentoCliente}</TableCell>
                    <TableCell>{formatDateDisplay(remision.fecha)}</TableCell>

                    <TableCell className="text-center text-gray-700">
                      {getGestionRemisionTexto(remision)}
                    </TableCell>

                    <TableCell className="text-center">{remision.items}</TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(remision)}
                        disabled={!puedeCambiarEstadoRemision(remision.estado)}
                        className={`h-7 ${getEstadoRemisionButtonClass(remision.estado)}`}
                        title={getSiguienteEstadoTexto(remision.estado)}
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
                          onClick={() => void handleDescargarPDF(remision)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(remision)}
                          disabled={!puedeEditarRemision(remision.estado)}
                          className={
                            puedeEditarRemision(remision.estado)
                              ? "hover:bg-yellow-50"
                              : "cursor-not-allowed hover:bg-transparent"
                          }
                          title={
                            remision.estado === "Entregado"
                              ? "No se puede editar una remisión entregada"
                              : remision.estado === "Facturada"
                                ? "No se puede editar una remisión facturada"
                                : remision.estado === "Anulada"
                                  ? "No se puede editar una remisión anulada"
                                  : remision.estado === "Despachado"
                                    ? "Editar cantidades remitidas"
                                    : "Editar"
                          }
                        >
                          <Edit
                            size={16}
                            className={
                              puedeEditarRemision(remision.estado)
                                ? "text-yellow-600"
                                : "text-gray-400"
                            }
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(remision)}
                          disabled={!puedeAnularRemision(remision.estado)}
                          className={
                            puedeAnularRemision(remision.estado)
                              ? "hover:bg-red-50"
                              : "cursor-not-allowed hover:bg-transparent"
                          }
                          title={
                            remision.estado === "Entregado"
                              ? "No se puede anular una remisión entregada"
                              : remision.estado === "Facturada"
                                ? "No se puede anular una remisión facturada"
                                : remision.estado === "Anulada"
                                  ? "La remisión ya está anulada"
                                  : "Anular"
                          }
                        >
                          <Ban
                            size={16}
                            className={
                              puedeAnularRemision(remision.estado)
                                ? "text-red-600"
                                : "text-gray-400"
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
        {filteredRemisiones.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + itemsPerPage, filteredRemisiones.length)} de{" "}
              {filteredRemisiones.length} registros
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" disabled>
                {currentPage} / {totalPages}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isFormularioAbierto}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>
              {isCrear
                ? "Nueva remisión de venta"
                : isEditarDespachado
                  ? "Editar observaciones de remisión"
                  : "Editar remisión de venta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Información general
                  </h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getEstadoRemisionBadgeClass(estadoFormularioActual)}
                  >
                    {estadoFormularioActual}
                  </Badge>

                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-right">
                    <p className="text-xs font-medium text-blue-700">
                      Fecha
                    </p>
                    <p className="text-sm font-semibold text-blue-900">
                      {formatDateDisplay(formFecha)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <Label>Orden de venta aprobada *</Label>

                  <select
                    className={`h-11 w-full rounded-lg border border-gray-300 px-3 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${puedeCambiarOrdenFormulario
                      ? "bg-white"
                      : "cursor-not-allowed bg-gray-100 text-gray-500"
                      }`}
                    value={formOrdenId}
                    disabled={!puedeCambiarOrdenFormulario}
                    onChange={(e) => handleOrdenChange(e.target.value)}
                  >
                    <option value="">Selecciona una orden</option>

                    {ordenesDisponibles.map((orden) => (
                      <option
                        key={orden.id_orden_venta}
                        value={orden.id_orden_venta}
                      >
                        {orden.codigo_orden_venta} -{" "}
                        {orden.cliente?.nombre_cliente ?? "Cliente"} - Pendiente:{" "}
                        {getPendienteOrdenOption(orden)}
                      </option>
                    ))}
                  </select>

                  {!puedeCambiarOrdenFormulario && (
                    <p className="text-xs text-amber-600">
                      La orden asociada no se puede cambiar en estado {estadoFormularioActual}.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Documento / NIT</Label>
                  <Input
                    value={documentoClienteSeleccionado || ""}
                    readOnly
                    disabled
                    placeholder="Documento"
                    className="h-11 cursor-not-allowed rounded-lg border-gray-200 bg-gray-100 shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bodega</Label>
                  <Input
                    value={bodegaFormularioNombre || "Sin bodega"}
                    readOnly
                    disabled
                    className="h-11 cursor-not-allowed rounded-lg border-blue-100 bg-blue-50 font-medium text-blue-900 shadow-none"
                  />
                </div>
              </div>
            </div>

            {isEditarDespachado && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Esta remisión ya fue despachada. Solo puedes actualizar las observaciones.
                Las cantidades, lotes y orden asociada quedan bloqueadas para conservar
                la trazabilidad del despacho.
              </div>
            )}

            {!isEditarDespachado && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Productos y lotes a remitir
                    </h3>
                    <p className="text-sm text-gray-500">
                      Selecciona el lote y la cantidad que se entregará al cliente.
                    </p>
                  </div>
                </div>

                {ordenSeleccionada ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="min-w-70">Producto</TableHead>
                          <TableHead className="text-center">IVA</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Vence</TableHead>
                          <TableHead className="text-center">Disponible</TableHead>
                          <TableHead className="text-center">A remitir</TableHead>
                          <TableHead className="text-center">Faltante</TableHead>
                          <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {formProductos.length > 0 ? (
                          formProductos.flatMap((producto, productoIndex) => {
                            const seleccionadoProducto = getCantidadSolicitadaProducto(producto);

                            const faltanteProducto = getCantidadFaltanteProducto(producto);
                            const excedidoProducto = getCantidadExcedidaProducto(producto);

                            const productoCompleto =
                              producto.cantidad_pendiente > 0 &&
                              seleccionadoProducto >= producto.cantidad_pendiente &&
                              excedidoProducto === 0;

                            if (producto.lotes.length === 0) {
                              return [
                                <TableRow key={`${producto.id_producto}-sin-lotes`}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {producto.nombre}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Precio: {formatMoney(producto.precio_unitario)}
                                      </p>
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className="border-blue-200 bg-blue-50 text-blue-700"
                                    >
                                      IVA {producto.iva}%
                                    </Badge>
                                  </TableCell>

                                  <TableCell colSpan={6}>
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                      Este producto no tiene existencias disponibles en la bodega de la orden.
                                    </div>
                                  </TableCell>
                                </TableRow>,
                              ];
                            }

                            return producto.lotes.map((lote, loteIndex) => {
                              const cantidadLote = toNumber(lote.cantidad);
                              const disponibleLoteActual = Math.max(
                                lote.cantidad_disponible - cantidadLote,
                                0
                              );

                              return (
                                <TableRow
                                  key={`${producto.id_producto}-${lote.id_existencia}`}
                                  className={[
                                    productoIndex > 0 && loteIndex === 0
                                      ? "border-t-4 border-t-gray-100"
                                      : "",
                                    excedidoProducto > 0 || cantidadLote > lote.cantidad_disponible
                                      ? "bg-red-50/50"
                                      : productoCompleto
                                        ? "bg-green-50/70"
                                        : loteIndex === 0
                                          ? "bg-gray-50/40"
                                          : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {producto.nombre}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Precio: {formatMoney(producto.precio_unitario)}
                                      </p>
                                    </div>
                                  </TableCell>

                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className="border-blue-200 bg-blue-50 text-blue-700"
                                    >
                                      IVA {producto.iva}%
                                    </Badge>
                                  </TableCell>

                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {lote.lote || "-"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {lote.codigo_barras || "Sin código"}
                                      </p>
                                    </div>
                                  </TableCell>

                                  <TableCell>{lote.fecha_vencimiento || "-"}</TableCell>

                                  <TableCell className="text-center">
                                    <span
                                      className={
                                        disponibleLoteActual === 0
                                          ? "font-medium text-orange-700"
                                          : "text-gray-700"
                                      }
                                    >
                                      {disponibleLoteActual}
                                    </span>
                                  </TableCell>

                                  <TableCell>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={lote.cantidad}
                                      disabled={formularioSoloLecturaOperativa}
                                      onWheel={(e) => e.currentTarget.blur()}
                                      onFocus={(e) => e.currentTarget.select()}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(",", ".");

                                        if (
                                          value === "" ||
                                          /^\d*\.?\d{0,2}$/.test(value)
                                        ) {
                                          handleCantidadLoteChange(
                                            producto.id_producto,
                                            lote.id_existencia,
                                            value
                                          );
                                        }
                                      }}
                                      placeholder="0"
                                      className={`mx-auto h-9 max-w-24 rounded-lg text-right shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 
                                        ${cantidadLote > lote.cantidad_disponible || excedidoProducto > 0
                                          ? "border-red-300 bg-red-50 text-red-700"
                                          : productoCompleto && cantidadLote > 0
                                            ? "border-green-300 bg-green-50 text-green-700"
                                            : ""
                                        } ${formularioSoloLecturaOperativa
                                          ? "cursor-not-allowed bg-gray-100 text-gray-500"
                                          : ""
                                        }`}
                                    />
                                  </TableCell>

                                  <TableCell className="text-center">
                                    {productoCompleto ? (
                                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                        Completo
                                      </span>
                                    ) : (
                                      <span className="font-medium text-orange-700">
                                        {faltanteProducto}
                                      </span>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          formularioSoloLecturaOperativa ||
                                          faltanteProducto === 0
                                        }
                                        onClick={() =>
                                          handleUsarFaltanteLote(
                                            producto.id_producto,
                                            lote.id_existencia
                                          )
                                        }
                                        className="h-8 px-3"
                                      >
                                        Completar
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={formularioSoloLecturaOperativa}
                                        onClick={() =>
                                          handleLimpiarLote(
                                            producto.id_producto,
                                            lote.id_existencia
                                          )
                                        }
                                        className="text-red-600 hover:bg-red-50"
                                      >
                                        Limpiar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="py-8 text-center text-gray-500"
                            >
                              No hay productos disponibles para remitir.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end border-t bg-gray-50 px-4 py-3">
                      <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Items seleccionados:</span>
                          <span className="font-medium">
                            {cantidadTotalItemsFormulario}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            {formatMoney(totalesFormulario.subtotalSinIva)}
                          </span>
                        </div>

                        {Object.entries(totalesFormulario.impuestosPorPorcentaje)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([porcentaje, monto]) => (
                            <div
                              key={porcentaje}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                IVA {porcentaje}%:
                              </span>
                              <span className="font-medium">
                                {formatMoney(monto)}
                              </span>
                            </div>
                          ))}

                        <div className="flex justify-between border-t pt-2 text-base">
                          <span className="font-semibold">Total remisión:</span>
                          <span className="font-bold text-blue-700">
                            {formatMoney(totalesFormulario.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">
                      Selecciona una orden de venta aprobada
                    </p>
                    <p className="mt-1 text-sm">
                      Al seleccionar una orden se cargarán los productos pendientes por remitir.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900">Observaciones</h3>
                <p className="text-sm text-gray-500">
                  Notas adicionales de la remisión
                </p>
              </div>

              <textarea
                className="min-h-24 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                placeholder="Escribe cualquier observación sobre la remisión..."
              />
            </div>
          </div>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>

            <Button
              onClick={handleGuardar}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCrear
                ? "Guardar remisión"
                : isEditarDespachado
                  ? "Guardar observaciones"
                  : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVer} onOpenChange={(open) => !open && closeToList()}>
        <DialogContent className="max-h-[90vh] max-w-7xl overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Detalle de remisión de venta</DialogTitle>
          </DialogHeader>

          {remisionSeleccionada ? (
            <div className="space-y-6 py-2">
              <div className="rounded-lg bg-gray-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Información general
                    </h3>
                    <p className="text-sm text-gray-500">
                      Datos principales, estado y trazabilidad de la remisión.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                    >
                      {remisionSeleccionada.numeroRemision}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={getEstadoRemisionBadgeClass(
                        remisionSeleccionada.estado
                      )}
                    >
                      {remisionSeleccionada.estado}
                    </Badge>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Fecha de Remisión
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(remisionSeleccionada.fecha)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-600">Orden de venta</p>
                    <p className="font-medium text-gray-900">
                      {remisionSeleccionada.ordenVenta}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {remisionSeleccionada.cliente}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Documento / NIT</p>
                    <p className="font-medium text-gray-900">
                      {remisionSeleccionada.documentoCliente || "No registrado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Bodega</p>
                    <p className="font-medium text-gray-900">
                      {remisionSeleccionada.bodega || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">N° de Items</p>
                    <p className="font-medium text-gray-900">
                      {remisionSeleccionada.items}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Despacho / Anulación</p>
                    <p className="font-medium text-gray-900">
                      {getGestionRemisionTexto(remisionSeleccionada)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Productos remitidos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Detalle de productos, lotes, cantidades, precios e IVA.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-center">IVA</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {remisionSeleccionada.detalle.length > 0 ? (
                        remisionSeleccionada.detalle.map((item, index) => (
                          <TableRow key={`${item.producto}-${item.lote}-${index}`}>
                            <TableCell className="font-medium text-gray-900">
                              {item.producto}
                            </TableCell>

                            <TableCell>{item.lote || "-"}</TableCell>

                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>

                            <TableCell className="text-center">
                              IVA {item.iva}%
                            </TableCell>

                            <TableCell className="text-right">
                              {formatMoney(item.precio)}
                            </TableCell>

                            <TableCell className="text-right font-medium">
                              {formatMoney(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center text-gray-500"
                          >
                            No hay productos registrados en esta remisión
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end border-t bg-gray-50 px-4 py-3">
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">N° de Items:</span>
                        <span className="font-medium">
                          {remisionSeleccionada.items}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          {formatMoney(totalesRemisionSeleccionada.subtotalSinIva)}
                        </span>
                      </div>

                      {Object.entries(
                        totalesRemisionSeleccionada.impuestosPorPorcentaje
                      )
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([porcentaje, monto]) => (
                          <div key={porcentaje} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              IVA {porcentaje}%:
                            </span>
                            <span className="font-medium">
                              {formatMoney(monto)}
                            </span>
                          </div>
                        ))}

                      <div className="flex justify-between border-t pt-2 text-base">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-blue-600">
                          {formatMoney(totalesRemisionSeleccionada.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {(remisionSeleccionada.estado === "Entregado" ||
                remisionSeleccionada.estado === "Facturada") && (
                  <div className="rounded-lg bg-gray-50 p-5">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Firma del cliente
                      </h3>
                      <p className="text-sm text-gray-500">
                        Evidencia de entrega registrada al cambiar la remisión a entregado.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        {firmaSrcRemisionSeleccionada ? (
                          <img
                            src={firmaSrcRemisionSeleccionada}
                            alt="Firma del cliente"
                            className="h-44 w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 text-center text-sm text-yellow-800">
                            No se pudo visualizar la firma, aunque la remisión tiene registro de entrega.
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
                        <p className="text-gray-600">Firmante</p>
                        <p className="font-medium text-gray-900">
                          {remisionSeleccionada.nombreFirmante ||
                            remisionSeleccionada.cliente ||
                            "Cliente"}
                        </p>

                        <p className="mt-4 text-gray-600">Fecha de firma</p>
                        <p className="font-medium text-gray-900">
                          {formatDateTimeDisplay(remisionSeleccionada.fechaFirma)}
                        </p>

                        <p className="mt-4 text-gray-600">Estado</p>
                        <Badge
                          variant="outline"
                          className={getEstadoRemisionBadgeClass(remisionSeleccionada.estado)}
                        >
                          {remisionSeleccionada.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-gray-900">Observaciones</h3>
                  <p className="text-sm text-gray-500">
                    Notas adicionales de la remisión
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {remisionSeleccionada.observaciones || "Sin observaciones"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No hay una remisión seleccionada.
            </div>
          )}

          <DialogFooter className="mt-2 border-t pt-4">
            {remisionSeleccionada && (
              <Button
                onClick={() => void handleDescargarPDF(remisionSeleccionada)}
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

      <Dialog open={isAnular} onOpenChange={(open) => !open && closeToList()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anular Remisión</DialogTitle>
            <DialogDescription>
              Esta acción cambiará el estado de la remisión a anulada y devolverá
              las cantidades al inventario.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmAnular}>
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showConfirmEstadoModal}
        onOpenChange={(open) => {
          if (!open) resetCambioEstado();
          else setShowConfirmEstadoModal(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
            <DialogDescription>
              {remisionCambioEstado && estadoDestino
                ? `La remisión ${remisionCambioEstado.numeroRemision} cambiará a estado ${estadoDestino.nombre}.`
                : "¿Deseas cambiar el estado de esta remisión?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetCambioEstado();
              }}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado}>
              <CheckCircle size={16} className="mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFirmaModal}
        onOpenChange={(open) => {
          if (!open) resetCambioEstado();
          else setShowFirmaModal(open);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Firma del cliente</DialogTitle>
            <DialogDescription>
              Para cambiar la remisión a <strong>Entregado</strong>, el cliente debe
              firmar en el recuadro.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="space-y-2">
                  <Label>Nombre de quien recibe</Label>
                  <Input
                    value={nombreFirmante}
                    onChange={(e) => setNombreFirmante(e.target.value)}
                    placeholder="Ej: Nombre cliente o receptor"
                    className="h-11 rounded-lg border-gray-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  />
                  <p className="text-xs text-gray-500">
                    Este nombre quedará asociado a la firma registrada.
                  </p>
                </div>
                <canvas
                  ref={firmaCanvasRef}
                  className="h-64 w-full touch-none rounded-lg border border-gray-200 bg-white"
                  onMouseDown={iniciarFirma}
                  onMouseMove={moverFirma}
                  onMouseUp={finalizarFirma}
                  onMouseLeave={finalizarFirma}
                  onTouchStart={iniciarFirma}
                  onTouchMove={moverFirma}
                  onTouchEnd={finalizarFirma}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-blue-700">
                  La firma se guardará como evidencia de entrega de la remisión.
                </p>

                <Button variant="outline" onClick={limpiarFirma}>
                  Limpiar firma
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">Resumen</h3>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-gray-500">Remisión</p>
                  <p className="font-medium text-gray-900">
                    {remisionCambioEstado?.numeroRemision || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {remisionCambioEstado?.cliente || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Estado actual</p>
                  <p className="font-medium text-gray-900">
                    {remisionCambioEstado?.estado || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Nuevo estado</p>
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-green-700"
                  >
                    {estadoDestino?.nombre || "Entregado"}
                  </Badge>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  El botón de aceptar solo se habilita cuando la firma ya fue dibujada.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={resetCambioEstado}>
              <X size={16} className="mr-2" />
              Cancelar
            </Button>

            <Button
              onClick={handleConfirmEstado}
              disabled={!firmaValida || !nombreFirmante.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              Aceptar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditar ? "Remisión actualizada" : "Remisión creada"}</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}