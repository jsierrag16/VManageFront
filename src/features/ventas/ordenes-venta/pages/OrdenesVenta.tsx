import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Search,
  Eye,
  Edit,
  Ban,
  Plus,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Badge } from "../../../../shared/components/ui/badge";
import { Textarea } from "../../../../shared/components/ui/textarea";
import { Label } from "../../../../shared/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";

import type { AppOutletContext } from "../../../../layouts/MainLayout";
import { ordenesVentaService } from "../services/ordenes-venta.services";
import type {
  CatalogoCliente,
  CatalogoCotizacion,
  CatalogoEstadoOrdenVenta,
  CatalogoProducto,
  CatalogoTerminoPago,
  DetalleCotizacionApi,
  DetalleOrdenVentaApi,
  OrdenVentaApi,
} from "../types/ordenes-venta.types";
import logoVmanage from "../../../../assets/images/VLogo.png";

type FormMode = "create" | "edit";

type FormDataType = {
  id_cliente: string;
  fecha_creacion: string;
  fecha_vencimiento: string;
  id_estado_orden_venta: string;
  id_termino_pago: string;
  descripcion: string;
  id_bodega: string;
};

type ProductoForm = {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  iva: number;
  costoReferencia?: number | null;
  loteReferencia?: string | null;
  cantidadDisponibleReferencia?: number;
  nombreBodegaReferencia?: string | null;
  origenReferencia?:
  | "BODEGA_CLIENTE"
  | "OTRA_BODEGA"
  | "SIN_EXISTENCIAS_CON_COSTO";
};

const ITEMS_PER_PAGE = 10;

function normalizarTexto(value?: string | null) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatMoney(value: unknown) {
  return `COP$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatIvaPorcentaje(value: unknown) {
  const porcentaje = Number(value ?? 0);

  if (!Number.isFinite(porcentaje)) return "0";

  return porcentaje.toLocaleString("es-CO", {
    minimumFractionDigits: porcentaje % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDateDisplay(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO");
}

function getClienteNombre(cliente?: CatalogoCliente) {
  return cliente?.nombre_cliente || cliente?.nombre || "Sin cliente";
}

function getTipoDocumentoClienteTexto(cliente?: CatalogoCliente | null) {
  if (!cliente) return "";

  const clienteAny = cliente as any;
  const tipoDocumento = clienteAny?.tipo_documento;

  const tipoDocumentoTexto =
    clienteAny?.tipoDocumento ??
    clienteAny?.tipo_doc ??
    clienteAny?.tipoDoc ??
    clienteAny?.nombre_tipo_doc ??
    clienteAny?.nombre_tipo_documento ??
    clienteAny?.codigo_tipo_documento ??
    clienteAny?.codigo_documento ??
    "";

  if (tipoDocumentoTexto && typeof tipoDocumentoTexto !== "object") {
    return String(tipoDocumentoTexto).trim();
  }

  if (tipoDocumento && typeof tipoDocumento === "object") {
    return (
      tipoDocumento.nombre_tipo_doc ??
      tipoDocumento.nombre_tipo_documento ??
      tipoDocumento.nombre_tipo_documento_cliente ??
      tipoDocumento.nombre ??
      tipoDocumento.codigo ??
      tipoDocumento.sigla ??
      tipoDocumento.abreviatura ??
      ""
    )
      .toString()
      .trim();
  }

  if (tipoDocumento && typeof tipoDocumento !== "object") {
    return String(tipoDocumento).trim();
  }

  return "";
}

function getDocumentoClienteTexto(cliente?: CatalogoCliente | null) {
  if (!cliente) return "No registrado";

  const clienteAny = cliente as any;

  const numeroDocumento =
    clienteAny?.num_documento ??
    clienteAny?.numeroDocumento ??
    clienteAny?.numero_documento ??
    clienteAny?.documento ??
    "";

  if (!numeroDocumento) return "No registrado";

  const numeroDocumentoTexto = String(numeroDocumento).trim();

  const tipoDocumentoDetectado = getTipoDocumentoClienteTexto(cliente);

  const tipoDocumento =
    tipoDocumentoDetectado ||
    (numeroDocumentoTexto.startsWith("9") || numeroDocumentoTexto.startsWith("8")
      ? "NIT"
      : "CC");

  return `${tipoDocumento}: ${numeroDocumentoTexto}`;
}

function getProductoNombre(producto?: CatalogoProducto) {
  return producto?.nombre_producto || producto?.nombre || "Producto";
}

function getProductoOrdenLabel(producto: CatalogoProducto) {
  return `${getProductoNombre(producto)} — IVA ${formatIvaPorcentaje(
    producto.iva?.porcentaje
  )}%`;
}

function getTerminoNombre(termino?: CatalogoTerminoPago) {
  return termino?.nombre_termino || termino?.nombre || "—";
}

function getEstadoNombre(estado?: CatalogoEstadoOrdenVenta) {
  return estado?.nombre_estado || estado?.nombre || "—";
}

function getBodegaNombre(bodega?: OrdenVentaApi["bodega"]) {
  return bodega?.nombre_bodega || bodega?.nombre || "—";
}

function getClienteBodegaId(cliente?: CatalogoCliente | null) {
  if (!cliente) return 0;

  const clienteAny = cliente as any;

  return Number(
    clienteAny?.id_bodega ??
    clienteAny?.bodega?.id_bodega ??
    clienteAny?.bodega?.id ??
    0
  );
}

function getClienteBodegaNombre(cliente?: CatalogoCliente | null) {
  if (!cliente) return "";

  const clienteAny = cliente as any;

  return (
    clienteAny?.bodega?.nombre_bodega ??
    clienteAny?.bodega?.nombre ??
    clienteAny?.nombre_bodega ??
    clienteAny?.bodega_nombre ??
    ""
  );
}

function getPrecioDetalleCotizacion(item: DetalleCotizacionApi) {
  return Number(item.precio_unitario ?? item.precio ?? item.valor_unitario ?? 0);
}

function getEstadoCotizacionNombre(cotizacion?: CatalogoCotizacion | null) {
  const cotizacionAny = cotizacion as any;

  return (
    cotizacionAny?.estado_cotizacion?.nombre_estado ??
    cotizacionAny?.estado_cotizacion?.nombre ??
    cotizacionAny?.estado?.nombre_estado ??
    cotizacionAny?.estado?.nombre ??
    ""
  );
}

function esCotizacionDisponibleParaOrden(
  cotizacion: CatalogoCotizacion,
  idOrdenActual?: number
) {
  const estado = normalizarTexto(getEstadoCotizacionNombre(cotizacion));

  const esAprobada =
    estado.includes("aprobada") || estado.includes("aprobado");

  const estaBloqueada =
    estado.includes("anulada") ||
    estado.includes("anulado") ||
    estado.includes("rechazada") ||
    estado.includes("rechazado") ||
    estado.includes("vencida") ||
    estado.includes("vencido");

  const cotizacionAny = cotizacion as any;
  const fechaVencimiento = formatDateInput(cotizacionAny?.fecha_vencimiento);
  const hoy = new Date().toISOString().slice(0, 10);

  const vencidaPorFecha = Boolean(fechaVencimiento && fechaVencimiento < hoy);

  const idOrdenAsociada = cotizacion.orden_venta?.id_orden_venta;
  const usadaEnOtraOrden =
    Boolean(idOrdenAsociada) &&
    Number(idOrdenAsociada) !== Number(idOrdenActual || 0);

  return esAprobada && !estaBloqueada && !vencidaPorFecha && !usadaEnOtraOrden;
}

function mapDetalleOrdenToForm(detalles?: DetalleOrdenVentaApi[]): ProductoForm[] {
  return (detalles || []).map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);
    const iva = Number(item.producto?.iva?.porcentaje ?? 0);

    return {
      id_producto: Number(item.id_producto),
      nombre: getProductoNombre(item.producto),
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
      iva,
    };
  });
}

function mapDetalleCotizacionToForm(detalles?: DetalleCotizacionApi[]): ProductoForm[] {
  return (detalles || []).map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = getPrecioDetalleCotizacion(item);
    const iva = Number(item.producto?.iva?.porcentaje ?? item.iva_porcentaje ?? 0);

    return {
      id_producto: Number(item.id_producto),
      nombre: getProductoNombre(item.producto),
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
      iva,
    };
  });
}

function getItemsOrden(orden: OrdenVentaApi) {
  return (orden.detalle_orden_venta || []).length;
}

function findEstadoIdByNames(
  estados: CatalogoEstadoOrdenVenta[],
  posiblesNombres: string[]
) {
  const match = estados.find((estado) =>
    posiblesNombres.some((name) =>
      normalizarTexto(getEstadoNombre(estado)).includes(normalizarTexto(name))
    )
  );

  return match?.id_estado_orden_venta;
}

function sumarDiasAFecha(fechaStr: string, dias: number) {
  if (!fechaStr) return "";

  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";

  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
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

function getSiguienteEstadoInfo(
  orden: OrdenVentaApi,
  estados: CatalogoEstadoOrdenVenta[]
) {
  const estadoActual = normalizarTexto(getEstadoNombre(orden.estado_orden_venta));

  if (
    estadoActual.includes("anulada") ||
    estadoActual.includes("anulado") ||
    estadoActual.includes("cancelada") ||
    estadoActual.includes("cancelado")
  ) {
    return { bloqueado: true as const };
  }

  if (
    estadoActual.includes("aprobada") ||
    estadoActual.includes("aprobado")
  ) {
    return { final: true as const };
  }

  if (!estadoActual.includes("pendiente")) {
    return { error: true as const };
  }

  const siguienteEstadoId = findEstadoIdByNames(estados, [
    "aprobada",
    "aprobado",
  ]);

  if (!siguienteEstadoId) {
    return { error: true as const };
  }

  const siguienteEstado = estados.find(
    (estado) => estado.id_estado_orden_venta === siguienteEstadoId
  );

  return {
    siguienteEstadoId,
    siguienteEstadoNombre: getEstadoNombre(siguienteEstado),
  };
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

const toPdfNumber = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatPdfMoney = (value: unknown) =>
  `COP$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPdfDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("es-CO") : "-";

function esOrdenPendiente(orden?: OrdenVentaApi | null) {
  const estado = normalizarTexto(getEstadoNombre(orden?.estado_orden_venta));
  return estado.includes("pendiente");
}

function esOrdenAprobada(orden?: OrdenVentaApi | null) {
  const estado = normalizarTexto(getEstadoNombre(orden?.estado_orden_venta));
  return estado.includes("aprobada") || estado.includes("aprobado");
}

function esOrdenAnulada(orden?: OrdenVentaApi | null) {
  const estado = normalizarTexto(getEstadoNombre(orden?.estado_orden_venta));

  return (
    estado.includes("anulada") ||
    estado.includes("anulado") ||
    estado.includes("cancelada") ||
    estado.includes("cancelado")
  );
}

function puedeEditarOrden(orden?: OrdenVentaApi | null) {
  return esOrdenPendiente(orden);
}

function getNombreUsuarioGestionOrden(
  usuario?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null
) {
  return `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim();
}

function getGestionEstadoOrden(orden: OrdenVentaApi) {
  if (esOrdenAprobada(orden)) {
    const usuario = getNombreUsuarioGestionOrden(orden.usuario_aprobo) || "—";
    const fecha = formatDateDisplay(orden.fecha_aprobacion);
    return `${usuario} - ${fecha}`;
  }

  if (esOrdenAnulada(orden)) {
    const usuario = getNombreUsuarioGestionOrden(orden.usuario_anulo) || "—";
    const fecha = formatDateDisplay(orden.fecha_anulacion);
    return `${usuario} - ${fecha}`;
  }

  return "Pendiente de aprobación";
}

function getEstadoOrdenClass(orden: OrdenVentaApi) {
  if (esOrdenPendiente(orden)) {
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }

  if (esOrdenAprobada(orden)) {
    return "bg-green-100 text-green-800 opacity-70 cursor-not-allowed hover:bg-green-100";
  }

  if (esOrdenAnulada(orden)) {
    return "bg-red-100 text-red-800 opacity-70 cursor-not-allowed hover:bg-red-100";
  }

  return "bg-gray-100 text-gray-800 hover:bg-gray-200";
}

function getEstadoOrdenBadgeClass(orden: OrdenVentaApi) {
  if (esOrdenPendiente(orden)) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (esOrdenAprobada(orden)) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (esOrdenAnulada(orden)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function OrdenesVenta() {
  const navigate = useNavigate();
  const { currentUser, selectedBodegaId, selectedBodegaNombre, bodegasDisponibles } =
    useOutletContext<AppOutletContext>();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordenes, setOrdenes] = useState<OrdenVentaApi[]>([]);
  const [clientes, setClientes] = useState<CatalogoCliente[]>([]);
  const [productos, setProductos] = useState<CatalogoProducto[]>([]);
  const [terminosPago, setTerminosPago] = useState<CatalogoTerminoPago[]>([]);
  const [estados, setEstados] = useState<CatalogoEstadoOrdenVenta[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CatalogoCotizacion[]>([]);
  const [precioTouched, setPrecioTouched] = useState(false);

  const [costosReferenciaPorProducto, setCostosReferenciaPorProducto] = useState<
    Record<
      string,
      {
        costoReferencia: number | null;
        loteReferencia: string | null;
        cantidadDisponible: number;
        nombreBodegaReferencia: string | null;
        origenReferencia:
        | "BODEGA_CLIENTE"
        | "OTRA_BODEGA"
        | "SIN_EXISTENCIAS_CON_COSTO";
      }
    >
  >({});

  const getCostoReferenciaProducto = (productoId: string) => {
    return Number(
      costosReferenciaPorProducto[productoId]?.costoReferencia ?? 0
    );
  };

  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);

  const [selectedOrden, setSelectedOrden] = useState<OrdenVentaApi | null>(null);
  const [selectedCotizacionId, setSelectedCotizacionId] =
    useState<string>("sin-cotizacion");
  const [detalleCotizacionModificado, setDetalleCotizacionModificado] =
    useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string>("");
  const [cantidadProducto, setCantidadProducto] = useState<string>("");
  const [precioProducto, setPrecioProducto] = useState<string>("");

  const [isConfirmEstadoModalOpen, setIsConfirmEstadoModalOpen] =
    useState(false);
  const [estadoCambioPendiente, setEstadoCambioPendiente] = useState<{
    orden: OrdenVentaApi;
    siguienteEstadoId: number;
    siguienteEstadoNombre: string;
  } | null>(null);

  const [productosOrden, setProductosOrden] = useState<ProductoForm[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    id_cliente: "",
    fecha_creacion: "",
    fecha_vencimiento: "",
    id_estado_orden_venta: "",
    id_termino_pago: "",
    descripcion: "",
    id_bodega: "",
  });

  const isCrear = isFormModalOpen && formMode === "create";
  const isEditar = isFormModalOpen && formMode === "edit";
  const isVer = isViewModalOpen;

  const fieldClass =
    "h-11 rounded-lg border-gray-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20";

  const readonlyFieldClass =
    "h-11 rounded-lg border-gray-200 bg-gray-100 cursor-not-allowed shadow-none";

  const numberFieldClass =
    "sin-flechas h-11 rounded-lg border-gray-300 bg-white text-right shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20";

  const estadoPendienteId = useMemo(() => {
    return (
      findEstadoIdByNames(estados, ["pendiente"]) ||
      estados[0]?.id_estado_orden_venta ||
      0
    );
  }, [estados]);

  const estadoCanceladoId = useMemo(() => {
    return (
      findEstadoIdByNames(estados, [
        "cancelada",
        "cancelado",
        "anulada",
        "anulado",
      ]) || 0
    );
  }, [estados]);

  const cargarModulo = async () => {
    try {
      setLoading(true);

      const idBodegaParam =
        selectedBodegaId && selectedBodegaId > 0 ? selectedBodegaId : undefined;

      const [ordenesRes, catalogosRes] = await Promise.all([
        ordenesVentaService.getAll(idBodegaParam),
        ordenesVentaService.getCatalogos(idBodegaParam),
      ]);

      setOrdenes(ordenesRes || []);
      setClientes(catalogosRes?.clientes || []);
      setProductos(catalogosRes?.productos || []);
      setTerminosPago(catalogosRes?.terminos_pago || []);
      setEstados(catalogosRes?.estados || []);
      setCotizaciones(catalogosRes?.cotizaciones || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo cargar órdenes de venta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarModulo();
  }, [selectedBodegaId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedProductoId) {
      setPrecioProducto("");
      setPrecioTouched(false);
      return;
    }

    if (!formData.id_cliente) {
      setPrecioProducto("");
      setPrecioTouched(false);
      return;
    }

    let cancelado = false;

    const cargarCostoReferencia = async () => {
      try {
        const respuesta = await ordenesVentaService.getCostoReferencia(
          Number(formData.id_cliente),
          Number(selectedProductoId)
        );

        if (cancelado) return;

        setCostosReferenciaPorProducto((prev) => ({
          ...prev,
          [selectedProductoId]: {
            costoReferencia: respuesta.costo_referencia,
            loteReferencia: respuesta.lote_referencia,
            cantidadDisponible: respuesta.cantidad_disponible,
            nombreBodegaReferencia: respuesta.nombre_bodega_referencia,
            origenReferencia: respuesta.origen_referencia,
          },
        }));

        if (respuesta.costo_referencia && respuesta.costo_referencia > 0) {
          setPrecioProducto(String(respuesta.costo_referencia));
        } else {
          setPrecioProducto("");
        }

        setPrecioTouched(false);
      } catch (error) {
        console.error("Error consultando costo referencia:", error);
        toast.error("No se pudo consultar el costo de referencia");
        setPrecioProducto("");
        setPrecioTouched(false);
      }
    };

    void cargarCostoReferencia();

    return () => {
      cancelado = true;
    };
  }, [selectedProductoId, formData.id_cliente]);

  useEffect(() => {
    if (!formData.fecha_creacion) return;

    const nuevaFechaVencimiento = sumarDiasAFecha(formData.fecha_creacion, 15);

    setFormData((prev) => ({
      ...prev,
      fecha_vencimiento: nuevaFechaVencimiento,
    }));
  }, [formData.fecha_creacion]);

  const filteredOrdenes = useMemo(() => {
    const term = normalizarTexto(searchTerm);

    return ordenes.filter((orden) => {
      const codigo = normalizarTexto(
        orden.codigo_orden_venta || String(orden.id_orden_venta)
      );
      const cliente = normalizarTexto(getClienteNombre(orden.cliente));
      const documentoCliente = normalizarTexto(
        getDocumentoClienteTexto(orden.cliente)
      );
      const estado = normalizarTexto(getEstadoNombre(orden.estado_orden_venta));
      const bodega = normalizarTexto(getBodegaNombre(orden.bodega));
      const items = String(getItemsOrden(orden));

      return (
        !term ||
        codigo.includes(term) ||
        cliente.includes(term) ||
        documentoCliente.includes(term) ||
        estado.includes(term) ||
        bodega.includes(term) ||
        items.includes(term)
      );
    });
  }, [ordenes, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrdenes.length / ITEMS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrdenes = filteredOrdenes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const totalOrdenes = ordenes.length;

    const pendientes = ordenes.filter((orden) =>
      normalizarTexto(getEstadoNombre(orden.estado_orden_venta)).includes(
        "pendiente"
      )
    ).length;

    const aprobadas = ordenes.filter((orden) => esOrdenAprobada(orden)).length;

    return { totalOrdenes, pendientes, aprobadas };
  }, [ordenes]);

  const clienteSeleccionado = useMemo(() => {
    return (
      clientes.find(
        (cliente) => String(cliente.id_cliente) === String(formData.id_cliente)
      ) ?? null
    );
  }, [clientes, formData.id_cliente]);

  const bodegaClienteSeleccionado = useMemo(() => {
    const idBodega = getClienteBodegaId(clienteSeleccionado);
    const nombreDesdeCliente = getClienteBodegaNombre(clienteSeleccionado);

    const nombreDesdeCatalogo =
      bodegasDisponibles.find((bodega) => Number(bodega.id) === Number(idBodega))
        ?.nombre ?? "";

    return {
      id: idBodega,
      nombre: nombreDesdeCliente || nombreDesdeCatalogo,
    };
  }, [clienteSeleccionado, bodegasDisponibles]);

  useEffect(() => {
    if (!isFormModalOpen) return;

    const idBodegaCliente = getClienteBodegaId(clienteSeleccionado);
    const idBodegaTexto = idBodegaCliente ? String(idBodegaCliente) : "";

    setFormData((prev) => {
      if (prev.id_bodega === idBodegaTexto) return prev;

      return {
        ...prev,
        id_bodega: idBodegaTexto,
      };
    });
  }, [clienteSeleccionado, isFormModalOpen]);

  const cotizacionesDisponibles = useMemo(() => {
    return cotizaciones.filter((cotizacion) => {
      const matchCliente =
        !formData.id_cliente ||
        Number(cotizacion.id_cliente) === Number(formData.id_cliente);

      const matchBodega =
        !formData.id_bodega ||
        Number(cotizacion.id_bodega) === Number(formData.id_bodega);

      return (
        matchCliente &&
        matchBodega &&
        esCotizacionDisponibleParaOrden(
          cotizacion,
          selectedOrden?.id_orden_venta
        )
      );
    });
  }, [
    cotizaciones,
    formData.id_cliente,
    formData.id_bodega,
    selectedOrden?.id_orden_venta,
  ]);

  const resetForm = () => {
    const hoy = new Date().toISOString().slice(0, 10);

    setFormData({
      id_cliente: "",
      fecha_creacion: hoy,
      fecha_vencimiento: sumarDiasAFecha(hoy, 15),
      id_estado_orden_venta: estadoPendienteId ? String(estadoPendienteId) : "",
      id_termino_pago: "",
      descripcion: "",
      id_bodega: "",
    });
    setSelectedCotizacionId("sin-cotizacion");
    setDetalleCotizacionModificado(false);
    setSelectedProductoId("");
    setCantidadProducto("");
    setPrecioProducto("");
    setPrecioTouched(false);
    setProductosOrden([]);
    setSelectedOrden(null);
    setCostosReferenciaPorProducto({});
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (orden: OrdenVentaApi) => {
    if (!puedeEditarOrden(orden)) {
      toast.info("Solo se pueden editar órdenes pendientes");
      return;
    }
    const estadoActual = orden.id_estado_orden_venta || estadoPendienteId;
    const terminoActual = orden.id_termino_pago || "";
    const bodegaActual =
      orden.id_bodega ||
      orden.bodega?.id_bodega ||
      (selectedBodegaId && selectedBodegaId > 0 ? selectedBodegaId : "");

    const fechaCreacion = formatDateInput(orden.fecha_creacion);

    setFormMode("edit");
    setSelectedOrden(orden);
    setFormData({
      id_cliente: String(orden.id_cliente || orden.cliente?.id_cliente || ""),
      fecha_creacion: fechaCreacion,
      fecha_vencimiento: sumarDiasAFecha(fechaCreacion, 15),
      id_estado_orden_venta: estadoActual ? String(estadoActual) : "",
      id_termino_pago: terminoActual ? String(terminoActual) : "",
      descripcion: orden.descripcion || "",
      id_bodega: bodegaActual ? String(bodegaActual) : "",
    });
    setSelectedCotizacionId(
      orden.id_cotizacion ? String(orden.id_cotizacion) : "sin-cotizacion"
    );
    setProductosOrden(mapDetalleOrdenToForm(orden.detalle_orden_venta));
    setSelectedProductoId("");
    setCantidadProducto("");
    setPrecioProducto("");
    setIsFormModalOpen(true);
  };

  const handleOpenView = (orden: OrdenVentaApi) => {
    setSelectedOrden(orden);
    setIsViewModalOpen(true);
  };

  const handleOpenAnular = (orden: OrdenVentaApi) => {
    if (!esOrdenPendiente(orden)) {
      toast.info("Solo se pueden anular órdenes pendientes");
      return;
    }

    setSelectedOrden(orden);
    setIsAnularModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCargarCotizacion = (cotizacionId: string) => {
    setSelectedCotizacionId(cotizacionId);

    if (!cotizacionId || cotizacionId === "sin-cotizacion") {
      setProductosOrden([]);
      setDetalleCotizacionModificado(false);
      return;
    }

    const cotizacion = cotizaciones.find(
      (item) => Number(item.id_cotizacion) === Number(cotizacionId)
    );

    if (!cotizacion) {
      toast.error("No se encontró la cotización seleccionada");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      id_cliente: cotizacion.id_cliente
        ? String(cotizacion.id_cliente)
        : prev.id_cliente,
      id_bodega: cotizacion.id_bodega
        ? String(cotizacion.id_bodega)
        : prev.id_bodega,
    }));

    setProductosOrden(
      mapDetalleCotizacionToForm(cotizacion.detalle_cotizacion)
    );
    setDetalleCotizacionModificado(false);
    toast.success("Productos cargados desde la cotización");
  };

  const costoReferenciaProductoSeleccionado = selectedProductoId
    ? getCostoReferenciaProducto(selectedProductoId)
    : 0;

  const precioIngresadoNumero = Number(precioProducto || 0);

  const precioProductoMenorCostoRef =
    !!selectedProductoId &&
    !!precioProducto &&
    costoReferenciaProductoSeleccionado > 0 &&
    precioIngresadoNumero < costoReferenciaProductoSeleccionado;

  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Selecciona un producto");
      return;
    }

    const cantidad = Number(cantidadProducto);
    const precio = Number(precioProducto);

    if (!cantidadProducto || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }

    if (!precioProducto || precio <= 0) {
      toast.error("El precio unitario debe ser mayor a cero");
      return;
    }

    const producto = productos.find(
      (item) => Number(item.id_producto) === Number(selectedProductoId)
    );

    if (!producto) {
      toast.error("No se encontró el producto");
      return;
    }

    const costoReferencia = getCostoReferenciaProducto(selectedProductoId);
    const referencia = costosReferenciaPorProducto[selectedProductoId];

    if (costoReferencia > 0 && precio < costoReferencia) {
      toast.warning(
        `El precio está por debajo del costo ref. (${formatMoney(costoReferencia)})`
      );
    }

    const yaExiste = productosOrden.some(
      (item) => Number(item.id_producto) === Number(selectedProductoId)
    );

    if (yaExiste) {
      toast.error("Ese producto ya está agregado");
      return;
    }

    setProductosOrden((prev) => [
      ...prev,
      {
        id_producto: Number(producto.id_producto),
        nombre: getProductoNombre(producto),
        cantidad,
        precio_unitario: precio,
        subtotal: cantidad * precio,
        iva: Number(producto.iva?.porcentaje ?? 0),
        costoReferencia: costoReferencia || null,
        loteReferencia: referencia?.loteReferencia ?? null,
        cantidadDisponibleReferencia: referencia?.cantidadDisponible ?? 0,
        nombreBodegaReferencia: referencia?.nombreBodegaReferencia ?? null,
        origenReferencia: referencia?.origenReferencia,
      },
    ]);

    if (selectedCotizacionId !== "sin-cotizacion") {
      setDetalleCotizacionModificado(true);
    }

    setSelectedProductoId("");
    setCantidadProducto("");
    setPrecioProducto("");
    setPrecioTouched(false);
  };

  const handleEliminarProducto = (idProducto: number) => {
    setProductosOrden((prev) =>
      prev.filter((item) => Number(item.id_producto) !== Number(idProducto))
    );

    if (selectedCotizacionId !== "sin-cotizacion") {
      setDetalleCotizacionModificado(true);
    }
  };

  const totalesFormulario = useMemo(() => {
    return calcularTotalesConIva(productosOrden);
  }, [productosOrden]);

  const handleSave = async () => {
    try {
      const userId = Number(currentUser?.id || currentUser?.id_usuario || 0);

      if (!userId) {
        toast.error("No se pudo identificar el usuario actual");
        return;
      }

      if (
        !formData.id_cliente ||
        !formData.fecha_creacion ||
        !formData.id_termino_pago ||
        !formData.id_bodega
      ) {
        toast.error("Completa todos los campos obligatorios");
        return;
      }

      if (productosOrden.length === 0) {
        toast.error("Debes agregar al menos un producto");
        return;
      }

      if (formMode === "create" && !estadoPendienteId) {
        toast.error("No encontré el estado pendiente en el catálogo");
        return;
      }

      const payload = {
        fecha_creacion: formData.fecha_creacion,
        fecha_vencimiento: sumarDiasAFecha(formData.fecha_creacion, 15),
        descripcion: formData.descripcion || null,
        id_cliente: Number(formData.id_cliente),
        id_bodega: Number(formData.id_bodega),
        id_estado_orden_venta:
          formMode === "create"
            ? Number(estadoPendienteId)
            : Number(formData.id_estado_orden_venta || estadoPendienteId),
        id_termino_pago: Number(formData.id_termino_pago),
        id_usuario: userId,
        ...(selectedCotizacionId &&
          selectedCotizacionId !== "sin-cotizacion" &&
          !detalleCotizacionModificado
          ? { id_cotizacion: Number(selectedCotizacionId) }
          : {}),
        detalle: productosOrden.map((item) => ({
          id_producto: Number(item.id_producto),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
        })),
      };

      if (formMode === "create") {
        await ordenesVentaService.create(payload);
        toast.success("Orden de venta creada correctamente");
      } else {
        if (!selectedOrden?.id_orden_venta) {
          toast.error("No se encontró la orden a editar");
          return;
        }

        await ordenesVentaService.update(selectedOrden.id_orden_venta, payload);
        toast.success("Orden de venta actualizada correctamente");
      }

      setIsFormModalOpen(false);
      resetForm();
      await cargarModulo();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo guardar la orden");
    }
  };

  const handleAnular = async () => {
    try {
      if (!selectedOrden?.id_orden_venta) {
        toast.error("No se encontró la orden");
        return;
      }

      if (!esOrdenPendiente(selectedOrden)) {
        toast.error("Solo se pueden anular órdenes pendientes");
        return;
      }

      if (!estadoCanceladoId) {
        toast.error("No encontré el estado de cancelación en el catálogo");
        return;
      }

      await ordenesVentaService.updateEstado(
        selectedOrden.id_orden_venta,
        estadoCanceladoId
      );

      toast.success("Orden de venta anulada correctamente");
      setIsAnularModalOpen(false);
      setSelectedOrden(null);
      await cargarModulo();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo anular la orden");
    }
  };

  const handleToggleEstado = async (orden: OrdenVentaApi) => {
    if (!esOrdenPendiente(orden)) {
      toast.info("Solo las órdenes pendientes pueden aprobarse");
      return;
    }

    const info = getSiguienteEstadoInfo(orden, estados);

    if ("bloqueado" in info) {
      toast.info("Las órdenes anuladas no pueden cambiar de estado");
      return;
    }

    if ("final" in info) {
      toast.info("Esta orden ya está en estado final");
      return;
    }

    if ("error" in info || !info.siguienteEstadoId) {
      toast.error("No encontré el siguiente estado en el catálogo");
      return;
    }

    setEstadoCambioPendiente({
      orden,
      siguienteEstadoId: info.siguienteEstadoId,
      siguienteEstadoNombre: info.siguienteEstadoNombre || "Siguiente estado",
    });
    setIsConfirmEstadoModalOpen(true);
  };

  const confirmToggleEstado = async () => {
    try {
      if (!estadoCambioPendiente) return;

      await ordenesVentaService.updateEstado(
        estadoCambioPendiente.orden.id_orden_venta,
        estadoCambioPendiente.siguienteEstadoId
      );

      toast.success("Estado actualizado correctamente");
      setIsConfirmEstadoModalOpen(false);
      setEstadoCambioPendiente(null);
      await cargarModulo();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "No se pudo actualizar el estado");
    }
  };

  const generateOrdenVentaPDF = async (orden: OrdenVentaApi) => {
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

    const estadoNombre = getEstadoNombre(orden.estado_orden_venta);

    const getEstadoStyle = (estado: string) => {
      const text = normalizarTexto(estado);

      if (
        text.includes("entregada") ||
        text.includes("aplicada") ||
        text.includes("facturada")
      ) {
        return {
          bg: COLORS.successBg,
          text: COLORS.successText,
          label: estado,
        };
      }

      if (
        text.includes("procesando") ||
        text.includes("aprobada") ||
        text.includes("aprobado") ||
        text.includes("enviada")
      ) {
        return {
          bg: COLORS.infoBg,
          text: COLORS.infoText,
          label: estado,
        };
      }

      if (
        text.includes("anulada") ||
        text.includes("anulado") ||
        text.includes("cancelada") ||
        text.includes("cancelado")
      ) {
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

    const detalle = (orden.detalle_orden_venta ?? []).map((item) => {
      const cantidad = toPdfNumber(item.cantidad);
      const precio = toPdfNumber(item.precio_unitario);
      const ivaPorcentaje = toPdfNumber(item.producto?.iva?.porcentaje);
      const subtotal = cantidad * precio;
      const ivaValor = subtotal * (ivaPorcentaje / 100);

      return {
        producto: getProductoNombre(item.producto),
        cantidad,
        ivaPorcentaje,
        precio,
        subtotal,
        ivaValor,
      };
    });

    const subtotalGeneral = detalle.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );
    const ivaGeneral = detalle.reduce((acc, item) => acc + item.ivaValor, 0);
    const totalGeneral = subtotalGeneral + ivaGeneral;

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
    doc.text("ORDEN DE VENTA", pageWidth / 2, 14.8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("VManage • Gestión empresarial", pageWidth / 2, 21.8, {
      align: "center",
    });

    // Datos derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.text(
      `Código: ${orden.codigo_orden_venta ||
      `OV-${String(orden.id_orden_venta).padStart(4, "0")}`
      }`,
      rightX,
      11.5,
      { align: "right" }
    );
    doc.text(`Fecha: ${formatPdfDate(orden.fecha_creacion)}`, rightX, 17.8, {
      align: "right",
    });
    doc.text(
      `Vencimiento: ${formatPdfDate(orden.fecha_vencimiento)}`,
      rightX,
      24.1,
      { align: "right" }
    );

    // Tarjeta información general
    doc.setFillColor(...COLORS.card);
    doc.roundedRect(marginX, 42, pageWidth - marginX * 2, 36, 3, 3, "F");

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Información general", marginX + 4, 49);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);

    const clienteNombre = getClienteNombre(orden.cliente);
    const clienteLines = doc.splitTextToSize(clienteNombre, 68);

    const documentoCliente = getDocumentoClienteTexto(orden.cliente);
    const documentoClienteLines = doc.splitTextToSize(documentoCliente, 68);

    doc.text("Cliente:", marginX + 4, 56);
    doc.text(clienteLines, marginX + 22, 56);

    doc.text("Documento / NIT:", marginX + 4, 66);
    doc.text(documentoClienteLines, marginX + 34, 66);

    doc.text("Bodega:", 112, 56);
    doc.text(getBodegaNombre(orden.bodega), 128, 56);

    doc.text("Término pago:", 112, 66);
    doc.text(getTerminoNombre(orden.termino_pago), 138, 66);

    const estadoStyle = getEstadoStyle(estadoNombre);
    doc.setFillColor(estadoStyle.bg[0], estadoStyle.bg[1], estadoStyle.bg[2]);
    doc.roundedRect(112, 70, 44, 9.5, 3, 3, "F");

    doc.setTextColor(estadoStyle.text[0], estadoStyle.text[1], estadoStyle.text[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Estado: ${estadoStyle.label}`, 134, 76.4, {
      align: "center",
    });

    doc.setDrawColor(...COLORS.primaryLine);
    doc.setLineWidth(0.6);
    doc.line(marginX, 84, rightX, 84);

    autoTable(doc, {
      startY: 90,
      margin: { left: marginX, right: marginX },
      head: [["Producto", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]],
      body: detalle.length
        ? detalle.map((item) => [
          item.producto,
          String(item.cantidad),
          `${item.ivaPorcentaje.toFixed(2)}%`,
          formatPdfMoney(item.precio),
          formatPdfMoney(item.subtotal),
        ])
        : [["Sin productos", "-", "-", "-", "-"]],
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
        fontSize: 8.5,
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
        0: { cellWidth: 74 },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 26, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || 90) + 8;

    const observacionesLines = orden.descripcion
      ? doc.splitTextToSize(orden.descripcion, 95)
      : [];

    const observacionesHeight = orden.descripcion
      ? Math.max(24, 12 + observacionesLines.length * 4.5)
      : 0;

    const totalsHeight = 31;
    const blockHeight = Math.max(observacionesHeight, totalsHeight);

    if (currentY + blockHeight > pageHeight - 24) {
      doc.addPage();
      currentY = 20;
    }

    if (orden.descripcion) {
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

    const totalsX = orden.descripcion ? 128 : 124;
    const totalsWidth = orden.descripcion ? 68 : 72;

    doc.setFillColor(...COLORS.card);
    doc.roundedRect(totalsX, currentY, totalsWidth, totalsHeight, 3, 3, "F");

    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    doc.text("Subtotal:", totalsX + 4, currentY + 8);
    doc.text(
      formatPdfMoney(subtotalGeneral),
      totalsX + totalsWidth - 4,
      currentY + 8,
      { align: "right" }
    );

    doc.text("IVA:", totalsX + 4, currentY + 15);
    doc.text(
      formatPdfMoney(ivaGeneral),
      totalsX + totalsWidth - 4,
      currentY + 15,
      { align: "right" }
    );

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(
      totalsX + 2,
      currentY + 20,
      totalsWidth - 4,
      9,
      2,
      2,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("TOTAL", totalsX + 5, currentY + 26);
    doc.text(
      formatPdfMoney(totalGeneral),
      totalsX + totalsWidth - 4,
      currentY + 26,
      { align: "right" }
    );

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
      `Orden_Venta_${orden.codigo_orden_venta ||
      `OV-${String(orden.id_orden_venta).padStart(4, "0")}`
      }.pdf`
    );
  };

  const handleDownloadPDF = async (orden: OrdenVentaApi) => {
    try {
      const detalle = await ordenesVentaService.getOne(orden.id_orden_venta);
      await generateOrdenVentaPDF(detalle);
      toast.success("PDF descargado exitosamente");
    } catch (error: any) {
      console.error("Error generando PDF:", error);
      toast.error(error?.message || "No se pudo generar el PDF de la orden");
    }
  };

  const handleCreate = handleOpenCreate;
  const handleView = handleOpenView;
  const handleEdit = handleOpenEdit;
  const handleAnularClick = handleOpenAnular;

  const detalleOrdenSeleccionada = useMemo(() => {
    return (selectedOrden?.detalle_orden_venta || []).map((item) => {
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precio_unitario || 0);
      const iva = Number(item.producto?.iva?.porcentaje ?? 0);
      const subtotal = cantidad * precio;

      return {
        id_producto: Number(item.id_producto),
        nombre: getProductoNombre(item.producto),
        cantidad,
        precio_unitario: precio,
        subtotal,
        iva,
      };
    });
  }, [selectedOrden]);

  const totalesOrdenSeleccionada = useMemo(() => {
    return calcularTotalesConIva(detalleOrdenSeleccionada);
  }, [detalleOrdenSeleccionada]);

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center text-gray-500">
        Cargando órdenes de venta...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Órdenes de Venta</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Gestiona las órdenes de venta de productos en
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
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalOrdenes}
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Buscar por número de orden, cliente, documento/NIT, estado o número de items..."
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
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento / NIT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-center">Aprobación / Anulación</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrdenes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-gray-500"
                  >
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentOrdenes.map((orden, index) => {
                  const estadoNombre = getEstadoNombre(orden.estado_orden_venta);
                  const puedeCambiarEstado = esOrdenPendiente(orden);
                  const puedeEditar = puedeEditarOrden(orden);
                  const puedeAnular = esOrdenPendiente(orden);

                  return (
                    <TableRow
                      key={orden.id_orden_venta}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="text-gray-500">
                        {startIndex + index + 1}
                      </TableCell>

                      <TableCell className="font-medium">
                        {orden.codigo_orden_venta || `OV-${orden.id_orden_venta}`}
                      </TableCell>

                      <TableCell>{getClienteNombre(orden.cliente)}</TableCell>

                      <TableCell>{getDocumentoClienteTexto(orden.cliente)}</TableCell>

                      <TableCell>{formatDateDisplay(orden.fecha_creacion)}</TableCell>

                      <TableCell>{formatDateDisplay(orden.fecha_vencimiento)}</TableCell>

                      <TableCell className="text-center text-gray-700">
                        {getGestionEstadoOrden(orden)}
                      </TableCell>

                      <TableCell className="text-center">
                        {getItemsOrden(orden)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEstado(orden)}
                          disabled={!puedeCambiarEstado}
                          className={`h-7 ${getEstadoOrdenClass(orden)}`}
                          title={
                            puedeCambiarEstado
                              ? "Aprobar orden"
                              : "Solo las órdenes pendientes pueden cambiar de estado"
                          }
                        >
                          {estadoNombre}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(orden)}
                            className="hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDownloadPDF(orden)}
                            className="hover:bg-green-50"
                            title="Descargar PDF"
                          >
                            <Download size={16} className="text-green-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(orden)}
                            disabled={!puedeEditar}
                            className={
                              puedeEditar
                                ? "hover:bg-yellow-50"
                                : "cursor-not-allowed hover:bg-transparent"
                            }
                            title={
                              puedeEditar
                                ? "Editar"
                                : "Solo se pueden editar órdenes pendientes"
                            }
                          >
                            <Edit
                              size={16}
                              className={puedeEditar ? "text-yellow-600" : "text-gray-400"}
                            />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnularClick(orden)}
                            disabled={!puedeAnular}
                            className={
                              puedeAnular
                                ? "hover:bg-red-50"
                                : "cursor-not-allowed hover:bg-transparent"
                            }
                            title={
                              puedeAnular
                                ? "Anular"
                                : "Solo se pueden anular órdenes pendientes"
                            }
                          >
                            <Ban
                              size={16}
                              className={puedeAnular ? "text-red-600" : "text-gray-400"}
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
        {filteredOrdenes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrdenes.length)} de{" "}
              {filteredOrdenes.length} órdenes
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

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>
              {isCrear ? "Nueva orden de venta" : "Editar orden de venta"}
            </DialogTitle>
          </DialogHeader>

          {isEditar && !selectedOrden ? (
            <div className="py-8 text-center text-gray-500">
              Cargando información de la orden...
            </div>
          ) : (
            <div className="space-y-6 py-2">
              <div className="rounded-lg bg-gray-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Información general
                    </h3>
                    <p className="text-sm text-gray-500">
                      Selecciona el cliente y revisa la bodega asociada a la orden
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {isEditar && selectedOrden && (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                      >
                        {selectedOrden.codigo_orden_venta ||
                          `OV-${selectedOrden.id_orden_venta}`}
                      </Badge>
                    )}

                    {isEditar && selectedOrden ? (
                      <Badge
                        variant="outline"
                        className={getEstadoOrdenBadgeClass(selectedOrden)}
                      >
                        {getEstadoNombre(selectedOrden.estado_orden_venta)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-yellow-200 bg-yellow-50 text-yellow-700"
                      >
                        Pendiente
                      </Badge>
                    )}

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Fecha de Orden
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(formData.fecha_creacion)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Vencimiento
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(formData.fecha_vencimiento)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="space-y-2">
                    <Label>Cliente *</Label>

                    <Select
                      value={formData.id_cliente}
                      onValueChange={(value) => {
                        if (value === formData.id_cliente) return;

                        setFormData((prev) => ({
                          ...prev,
                          id_cliente: value,
                        }));

                        if (selectedCotizacionId !== "sin-cotizacion") {
                          setSelectedCotizacionId("sin-cotizacion");
                          setDetalleCotizacionModificado(false);
                          setProductosOrden([]);
                        }

                        setSelectedProductoId("");
                        setCantidadProducto("");
                        setPrecioProducto("");
                        setPrecioTouched(false);
                        setCostosReferenciaPorProducto({});
                      }}
                    >
                      <SelectTrigger className={fieldClass}>
                        {clienteSeleccionado ? (
                          <span className="truncate">
                            {getClienteNombre(clienteSeleccionado)}
                          </span>
                        ) : (
                          <SelectValue placeholder="Selecciona un cliente" />
                        )}
                      </SelectTrigger>

                      <SelectContent>
                        {clientes.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No hay clientes disponibles
                          </div>
                        ) : (
                          clientes.map((cliente) => (
                            <SelectItem
                              key={cliente.id_cliente}
                              value={String(cliente.id_cliente)}
                              textValue={getClienteNombre(cliente)}
                            >
                              <div className="flex flex-col">
                                <span>{getClienteNombre(cliente)}</span>
                                <span className="text-xs text-gray-500">
                                  {getDocumentoClienteTexto(cliente)}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/app/clientes/crear")}
                      className="h-11 w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    >
                      <Plus size={16} className="mr-2" />
                      Nuevo Cliente
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Documento / NIT</Label>
                    <Input
                      value={getDocumentoClienteTexto(clienteSeleccionado)}
                      readOnly
                      disabled
                      placeholder="Se completa al seleccionar cliente"
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bodega del cliente *</Label>
                    <Input
                      value={
                        formData.id_cliente
                          ? bodegaClienteSeleccionado.nombre || "Cliente sin bodega asignada"
                          : ""
                      }
                      readOnly
                      disabled
                      placeholder="Se completa al seleccionar cliente"
                      className={readonlyFieldClass}
                    />

                    {formData.id_cliente && !formData.id_bodega && (
                      <p className="text-xs text-red-600">
                        Este cliente no tiene una bodega asociada.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Término de pago *</Label>
                    <Select
                      value={formData.id_termino_pago}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, id_termino_pago: value }))
                      }
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue placeholder="Selecciona un término" />
                      </SelectTrigger>

                      <SelectContent>
                        {terminosPago.map((termino) => (
                          <SelectItem
                            key={termino.id_termino_pago}
                            value={String(termino.id_termino_pago)}
                          >
                            {getTerminoNombre(termino)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-blue-900">
                    Cargar productos desde cotización
                  </h3>
                  <p className="text-sm text-blue-700">
                    Puedes cargar automáticamente los productos de una cotización aprobada.
                  </p>
                </div>

                <Select
                  value={selectedCotizacionId}
                  onValueChange={handleCargarCotizacion}
                >
                  <SelectTrigger className="h-11 rounded-lg bg-white">
                    <SelectValue placeholder="Selecciona una cotización" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cotizacion">Sin cotización</SelectItem>
                    {cotizacionesDisponibles.map((cotizacion) => (
                      <SelectItem
                        key={cotizacion.id_cotizacion}
                        value={String(cotizacion.id_cotizacion)}
                      >
                        {(cotizacion.codigo_cotizacion ||
                          cotizacion.numero_cotizacion ||
                          `Cotización ${cotizacion.id_cotizacion}`) +
                          " - " +
                          getClienteNombre(cotizacion.cliente)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Productos de la orden
                    </h3>
                    <p className="text-sm text-gray-500">
                      Selecciona los productos, cantidad y precio de venta
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_160px_220px_180px] md:items-start">
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <Select
                        value={selectedProductoId}
                        onValueChange={setSelectedProductoId}
                      >
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>

                        <SelectContent>
                          {productos.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No hay productos disponibles
                            </div>
                          ) : (
                            productos.map((producto) => (
                              <SelectItem
                                key={producto.id_producto}
                                value={String(producto.id_producto)}
                                textValue={getProductoOrdenLabel(producto)}
                              >
                                {getProductoOrdenLabel(producto)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        value={cantidadProducto}
                        min="0"
                        onFocus={() => {
                          if (cantidadProducto === "0") {
                            setCantidadProducto("");
                          }
                        }}
                        onBlur={() => {
                          if (!cantidadProducto.trim()) {
                            setCantidadProducto("0");
                          }
                        }}
                        onChange={(e) => setCantidadProducto(e.target.value)}
                        className={numberFieldClass}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio Unitario *</Label>
                      <Input
                        type="number"
                        value={precioProducto}
                        onChange={(e) => {
                          setPrecioProducto(e.target.value);
                          if (!precioTouched) setPrecioTouched(true);
                        }}
                        onBlur={() => setPrecioTouched(true)}
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        className={`${numberFieldClass} ${precioTouched && precioProductoMenorCostoRef
                          ? "border-red-500 bg-red-50 text-red-700 focus-visible:ring-red-500"
                          : ""
                          }`}
                      />
                    </div>

                    <div className="flex md:pt-8">
                      <Button
                        type="button"
                        onClick={handleAgregarProducto}
                        disabled={!selectedProductoId}
                        className="h-11 w-full bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus size={16} className="mr-2" />
                        Agregar
                      </Button>
                    </div>
                    {selectedProductoId && formData.id_cliente && (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 md:col-start-3 md:col-span-2">
                        {costoReferenciaProductoSeleccionado > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Referencia del producto
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${precioProductoMenorCostoRef
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-700"
                                  }`}
                              >
                                {costosReferenciaPorProducto[selectedProductoId]?.origenReferencia ===
                                  "OTRA_BODEGA"
                                  ? "Referencia global"
                                  : "Bodega del cliente"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                              <p>
                                <span className="font-medium text-gray-700">Costo ref.:</span>{" "}
                                <span
                                  className={
                                    precioProductoMenorCostoRef
                                      ? "font-semibold text-red-600"
                                      : "font-semibold text-amber-700"
                                  }
                                >
                                  {formatMoney(costoReferenciaProductoSeleccionado)}
                                </span>
                              </p>

                              <p>
                                <span className="font-medium text-gray-700">Bodega ref.:</span>{" "}
                                {costosReferenciaPorProducto[selectedProductoId]
                                  ?.nombreBodegaReferencia ?? "No disponible"}
                              </p>

                              <p>
                                <span className="font-medium text-gray-700">Lote ref.:</span>{" "}
                                {costosReferenciaPorProducto[selectedProductoId]?.loteReferencia ??
                                  "No disponible"}
                              </p>

                              <p>
                                <span className="font-medium text-gray-700">Disponible:</span>{" "}
                                {costosReferenciaPorProducto[selectedProductoId]?.cantidadDisponible ??
                                  0}
                              </p>
                            </div>

                            {precioTouched && precioProductoMenorCostoRef && (
                              <p className="text-xs font-medium text-red-600">
                                El precio está por debajo del costo de referencia.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Sin costo de referencia disponible para este producto.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {productosOrden.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-center">IVA</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-20 text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {productosOrden.map((item) => (
                          <TableRow key={item.id_producto}>
                            <TableCell className="font-medium text-gray-900">
                              {item.nombre}
                            </TableCell>

                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>

                            <TableCell className="text-right">
                              {formatMoney(item.precio_unitario)}
                            </TableCell>

                            <TableCell className="text-center">
                              IVA {formatIvaPorcentaje(item.iva)}%
                            </TableCell>

                            <TableCell className="text-right font-medium">
                              {formatMoney(item.subtotal)}
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminarProducto(item.id_producto)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end border-t bg-gray-50 px-4 py-3">
                      <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">N° de Items:</span>
                          <span className="font-medium">{productosOrden.length}</span>
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
                            {formatMoney(totalesFormulario.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No hay productos agregados</p>
                    <p className="mt-1 text-sm">
                      Selecciona un producto y agrégalo a la orden
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Observaciones</h3>
                <p className="mb-3 text-sm text-gray-500">
                  Notas adicionales para esta orden de venta
                </p>

                <Textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Escribe observaciones de la orden"
                  className="min-h-24 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCrear ? "Crear orden" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVer} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Detalle de la orden de venta</DialogTitle>
            <DialogDescription>
              Consulta la información completa de la orden seleccionada.
            </DialogDescription>
          </DialogHeader>

          {selectedOrden ? (
            <div className="space-y-6 py-2">
              <div className="rounded-lg bg-gray-50 p-5">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Información general
                    </h3>
                    <p className="text-sm text-gray-500">
                      Datos principales de la orden de venta.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700"
                    >
                      {selectedOrden.codigo_orden_venta ||
                        `OV-${selectedOrden.id_orden_venta}`}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={getEstadoOrdenBadgeClass(selectedOrden)}
                    >
                      {getEstadoNombre(selectedOrden.estado_orden_venta)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {getClienteNombre(selectedOrden.cliente)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Documento / NIT</p>
                    <p className="font-medium text-gray-900">
                      {getDocumentoClienteTexto(selectedOrden.cliente)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Bodega</p>
                    <p className="font-medium text-gray-900">
                      {getBodegaNombre(selectedOrden.bodega)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Término de pago</p>
                    <p className="font-medium text-gray-900">
                      {getTerminoNombre(selectedOrden.termino_pago)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium text-gray-900">
                      {formatDateDisplay(selectedOrden.fecha_creacion)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Fecha de vencimiento</p>
                    <p className="font-medium text-gray-900">
                      {formatDateDisplay(selectedOrden.fecha_vencimiento)}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Aprobación / Anulación</p>
                    <p className="font-medium text-gray-900">
                      {getGestionEstadoOrden(selectedOrden)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Productos de la orden
                    </h3>
                    <p className="text-sm text-gray-500">
                      Detalle de productos, cantidades, precios e IVA.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-center">IVA %</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {detalleOrdenSeleccionada.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-gray-500"
                          >
                            No hay productos registrados en esta orden
                          </TableCell>
                        </TableRow>
                      ) : (
                        detalleOrdenSeleccionada.map((item, index) => (
                          <TableRow key={`${item.id_producto}-${index}`}>
                            <TableCell className="font-medium">
                              {item.nombre}
                            </TableCell>

                            <TableCell className="text-center">
                              {formatMoney(item.precio_unitario)}
                            </TableCell>

                            <TableCell className="text-right">
                              {formatMoney(item.precio_unitario)}
                            </TableCell>

                            <TableCell className="text-center">
                              {item.iva}%
                            </TableCell>

                            <TableCell className="text-right">
                              {formatMoney(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-5 flex justify-end">
                  <div className="min-w-[18rem] rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">N° de Items:</span>
                        <span className="font-medium text-gray-900">
                          {detalleOrdenSeleccionada.length}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal sin IVA:</span>
                        <span className="font-medium text-gray-900">
                          {formatMoney(totalesOrdenSeleccionada.subtotalSinIva)}
                        </span>
                      </div>

                      {Object.entries(totalesOrdenSeleccionada.impuestosPorPorcentaje)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([porcentaje, monto]) => (
                          <div key={porcentaje} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Total IVA {porcentaje}%:
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatMoney(monto)}
                            </span>
                          </div>
                        ))}

                      <div className="flex justify-between border-t border-blue-300 pt-2 text-lg">
                        <span className="font-semibold text-gray-700">Total:</span>
                        <span className="font-bold text-blue-700">
                          {formatMoney(totalesOrdenSeleccionada.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-5">
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  Observaciones
                </h3>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {selectedOrden.descripcion || "Sin observaciones"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No hay una orden seleccionada.
            </div>
          )}

          <DialogFooter className="mt-2 border-t pt-4">
            {selectedOrden && (
              <Button
                onClick={() => void handleDownloadPDF(selectedOrden)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            )}

            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnularModalOpen} onOpenChange={setIsAnularModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular orden de venta</DialogTitle>
            <DialogDescription>
              Esta acción cambiará el estado de la orden a cancelada/anulada.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {selectedOrden
              ? `Vas a anular la orden ${selectedOrden.codigo_orden_venta ||
              `OV-${selectedOrden.id_orden_venta}`
              }.`
              : "No hay orden seleccionada."}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnularModalOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleAnular}>
              Anular orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmEstadoModalOpen}
        onOpenChange={(open) => {
          setIsConfirmEstadoModalOpen(open);
          if (!open) setEstadoCambioPendiente(null);
        }}
      >
        <DialogContent aria-describedby="confirm-estado-orden-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Orden de Venta</DialogTitle>
            <DialogDescription id="confirm-estado-orden-description">
              ¿Estás seguro de que deseas cambiar el estado de esta orden de venta?
            </DialogDescription>
          </DialogHeader>

          {estadoCambioPendiente && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Orden:</span>
                <span className="font-medium">
                  {estadoCambioPendiente.orden.codigo_orden_venta ||
                    `OV-${estadoCambioPendiente.orden.id_orden_venta}`}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">
                  {getClienteNombre(estadoCambioPendiente.orden.cliente)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado Actual:</span>
                <span className="font-medium">
                  {getEstadoNombre(
                    estadoCambioPendiente.orden.estado_orden_venta
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nuevo Estado:</span>
                <span className="font-medium">
                  {estadoCambioPendiente.siguienteEstadoNombre}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmEstadoModalOpen(false);
                setEstadoCambioPendiente(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmToggleEstado}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
