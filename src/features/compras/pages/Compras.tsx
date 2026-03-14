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
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../../shared/services/api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Label } from "../../../shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../shared/components/ui/dialog";

import { toast } from "sonner";
import type { AppOutletContext } from "../../../layouts/MainLayout";
import { getProveedores } from "@/features/proveedores/services/proveedores.services";
import { productosService } from "@/features/productos/services/productos.service";

type CompraEstado = "Pendiente" | "Aprobada" | "Anulada";

type BasicOption = {
  id: number;
  nombre: string;
  estado?: boolean;
};

type IvaOption = {
  id: number;
  nombre: string;
  porcentaje: number;
  estado?: boolean;
};

type ProductoOrden = {
  producto: {
    id: number;
    nombre: string;
  };
  cantidad: number;
  precio: number;
  subtotal: number;
  idIva: number;
  ivaNombre: string;
  ivaPorcentaje: number;
};

type Compra = {
  id: number;
  numeroOrden: string;
  proveedor: string;
  proveedorId: number;
  terminoPago: string;
  terminoPagoId: number;
  fecha: string;
  fechaEntrega: string;
  estado: CompraEstado;
  estadoId: number;
  items: number;
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones: string;
  bodega: string;
  bodegaId: number;
  productos: ProductoOrden[];
};

const ESTADO_COMPRA_IDS = {
  Pendiente: 1,
  Aprobada: 2,
  Anulada: 3,
} as const;

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pickText = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const onlyDate = (value?: string | null): string => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const extractArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isActiveValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    return v === "activo" || v === "activa" || v === "true" || v === "1";
  }
  return true;
};

const normalizeEstado = (raw?: string | null, id?: number): CompraEstado => {
  const value = (raw || "").toLowerCase().trim();

  if (value.includes("anul")) return "Anulada";
  if (value.includes("aprob")) return "Aprobada";
  if (value.includes("pend")) return "Pendiente";

  if (id === ESTADO_COMPRA_IDS.Anulada) return "Anulada";
  if (id === ESTADO_COMPRA_IDS.Aprobada) return "Aprobada";
  return "Pendiente";
};

const mapTerminoPagoOption = (row: any): BasicOption => ({
  id: toNumber(row?.id_termino_pago ?? row?.id),
  nombre: pickText(
    row?.nombre_termino,
    row?.nombre,
    row?.nombre_termino_pago
  ),
  estado: true,
});

const mapIvaOption = (row: any): IvaOption => {
  const porcentaje = toNumber(row?.porcentaje ?? row?.porcentaje_iva ?? row?.valor_iva ?? row?.valor);

  return {
    id: toNumber(row?.id_iva ?? row?.id),
    nombre:
      pickText(row?.nombre_iva, row?.nombre) ||
      `IVA ${porcentaje.toFixed(2)}%`,
    porcentaje,
    estado: true,
  };
};

const mapCompraFromApi = (row: any): Compra => {
  const proveedorRel = row?.proveedor || row?.proveedores || {};
  const terminoPagoRel =
    row?.termino_pago || row?.terminos_pago || row?.terminoPago || {};
  const estadoRel = row?.estado_compra || row?.estadoCompra || {};
  const bodegaRel = row?.bodega || row?.bodegas || {};

  const detalle = Array.isArray(row?.detalle_compra) ? row.detalle_compra : [];

  const productos: ProductoOrden[] = detalle.map((item: any) => {
    const productoRel = item?.producto || item?.productos || {};
    const ivaRel = item?.iva || item?.ivas || {};

    const cantidad = toNumber(item?.cantidad);
    const precio = toNumber(item?.precio_unitario);
    const subtotal = Number((cantidad * precio).toFixed(2));
    const ivaPorcentaje = toNumber(ivaRel?.porcentaje ?? item?.porcentaje);

    return {
      producto: {
        id: toNumber(item?.id_producto ?? productoRel?.id_producto ?? productoRel?.id),
        nombre: pickText(
          productoRel?.nombre_producto,
          productoRel?.nombre,
          item?.nombre_producto
        ),
      },
      cantidad,
      precio,
      subtotal,
      idIva: toNumber(item?.id_iva ?? ivaRel?.id_iva ?? ivaRel?.id),
      ivaNombre:
        pickText(ivaRel?.nombre_iva, ivaRel?.nombre) ||
        `IVA ${ivaPorcentaje.toFixed(2)}%`,
      ivaPorcentaje,
    };
  });

  const estadoId = toNumber(
    row?.id_estado_compra ?? estadoRel?.id_estado_compra ?? estadoRel?.id
  );

  const items =
    detalle.length ||
    toNumber(row?.items) ||
    toNumber(row?._count?.detalle_compra) ||
    toNumber(row?._count?.detalle);

  return {
    id: toNumber(row?.id_compra ?? row?.id),
    numeroOrden: pickText(row?.codigo_compra, row?.numeroOrden, row?.numero_orden),
    proveedor: pickText(
      proveedorRel?.nombre_empresa,
      proveedorRel?.nombre_proveedor,
      proveedorRel?.nombre,
      row?.proveedor
    ),
    proveedorId: toNumber(
      row?.id_proveedor ?? proveedorRel?.id_proveedor ?? proveedorRel?.id
    ),
    terminoPago: pickText(
      terminoPagoRel?.nombre_termino,
      terminoPagoRel?.nombre_termino_pago,
      terminoPagoRel?.nombre,
      row?.termino_pago_nombre
    ),
    terminoPagoId: toNumber(
      row?.id_termino_pago ??
        terminoPagoRel?.id_termino_pago ??
        terminoPagoRel?.id
    ),
    fecha: onlyDate(row?.fecha_solicitud ?? row?.fecha),
    fechaEntrega: onlyDate(row?.fecha_entrega),
    estado: normalizeEstado(
      pickText(
        estadoRel?.nombre_estado,
        estadoRel?.nombre_estado_compra,
        estadoRel?.estado_compra,
        estadoRel?.nombre,
        row?.estado
      ),
      estadoId
    ),
    estadoId,
    items,
    subtotal: toNumber(row?.subtotal),
    impuestos: toNumber(row?.total_iva ?? row?.impuestos),
    total: toNumber(row?.total),
    observaciones: pickText(row?.descripcion, row?.observaciones),
    bodega: pickText(
      bodegaRel?.nombre_bodega,
      bodegaRel?.nombre,
      row?.bodega
    ),
    bodegaId: toNumber(row?.id_bodega ?? bodegaRel?.id_bodega ?? bodegaRel?.id),
    productos,
  };
};

const getRequestFirstSuccess = async (endpoints: string[]) => {
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const loadAllProveedoresOptions = async (): Promise<BasicOption[]> => {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const acumulado: BasicOption[] = [];

  do {
    const resp = await getProveedores({ page, limit });

    acumulado.push(
      ...resp.data.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        estado: item.estado === "Activo",
      }))
    );

    totalPages = resp.pages || 1;
    page += 1;
  } while (page <= totalPages);

  const map = new Map<number, BasicOption>();
  for (const item of acumulado) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
};

const loadAllProductosOptions = async (): Promise<BasicOption[]> => {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const acumulado: BasicOption[] = [];

  do {
    const resp = await productosService.findAll({
      page,
      limit,
      includeRefs: true,
    });

    acumulado.push(
      ...resp.data.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        estado: item.estado,
      }))
    );

    totalPages = resp.pages || 1;
    page += 1;
  } while (page <= totalPages);

  const map = new Map<number, BasicOption>();
  for (const item of acumulado) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
};

const getFechaActual = () => new Date().toISOString().split("T")[0];

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null);

  const [proveedores, setProveedores] = useState<BasicOption[]>([]);
  const [productosCatalogo, setProductosCatalogo] = useState<BasicOption[]>([]);
  const [terminosPago, setTerminosPago] = useState<BasicOption[]>([]);
  const [ivas, setIvas] = useState<IvaOption[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [compraParaCambioEstado, setCompraParaCambioEstado] =
    useState<Compra | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const outlet = useOutletContext<
    AppOutletContext & {
      selectedBodegaId?: number;
      selectedBodegaNombre?: string;
    }
  >();

  const selectedBodega = (outlet as any)?.selectedBodegaNombre ?? "";
  const selectedBodegaId = (outlet as any)?.selectedBodegaId;

  const isCrear = location.pathname.endsWith("/compras/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = useCallback(() => navigate("/app/compras"), [navigate]);

  const handleView = (c: Compra) => {
    navigate(`/app/compras/${c.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/compras/crear");
  };

  const handleEdit = (c: Compra) => {
    navigate(`/app/compras/${c.id}/editar`);
  };

  const handleAnular = (c: Compra) => {
    navigate(`/app/compras/${c.id}/anular`);
  };

  const [formData, setFormData] = useState({
    numeroOrden: "",
    proveedorId: "",
    terminoPagoId: "",
    fecha: "",
    fechaEntrega: "",
    estado: "Pendiente" as CompraEstado,
    observaciones: "",
    bodega: "",
  });

  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [selectedIvaId, setSelectedIvaId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState<string>("");
  const [productosOrden, setProductosOrden] = useState<ProductoOrden[]>([]);

  const productosActivos = useMemo(() => {
    return productosCatalogo.filter((p) => p.estado !== false);
  }, [productosCatalogo]);

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

      const { data } = await api.get("/compras", {
        params: selectedBodegaId ? { id_bodega: selectedBodegaId } : undefined,
      });

      const rows = extractArray(data).map(mapCompraFromApi);
      setCompras(rows);
    } catch (error) {
      console.error("Error cargando compras:", error);
      toast.error("No se pudieron cargar las órdenes de compra");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBodegaId]);

  const loadCompraDetalle = useCallback(
    async (id: number) => {
      try {
        setIsLoadingDetail(true);
        const { data } = await api.get(`/compras/${id}`);
        setCompraDetalle(mapCompraFromApi(data));
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
      const proveedoresPromise = loadAllProveedoresOptions();
      const productosPromise = loadAllProductosOptions();

      const terminosPromise = api.get("/termino-pago");

      const ivasPromise = getRequestFirstSuccess([
        "/iva",
        "/ivas",
      ]);

      const [proveedoresRes, productosRes, terminosRes, ivasRes] =
        await Promise.allSettled([
          proveedoresPromise,
          productosPromise,
          terminosPromise,
          ivasPromise,
        ]);

      if (proveedoresRes.status === "fulfilled") {
        setProveedores(
          proveedoresRes.value.filter((x) => x.id > 0 && x.nombre)
        );
      } else {
        console.error("Error cargando proveedores:", proveedoresRes.reason);
      }

      if (productosRes.status === "fulfilled") {
        setProductosCatalogo(
          productosRes.value.filter((x) => x.id > 0 && x.nombre)
        );
      } else {
        console.error("Error cargando productos:", productosRes.reason);
      }

      if (terminosRes.status === "fulfilled") {
        setTerminosPago(
          extractArray(terminosRes.value.data)
            .map(mapTerminoPagoOption)
            .filter((x) => x.id > 0 && x.nombre)
        );
      } else {
        console.error("Error cargando términos de pago:", terminosRes.reason);
      }

      if (ivasRes.status === "fulfilled") {
        setIvas(
          extractArray(ivasRes.value.data)
            .map(mapIvaOption)
            .filter((x) => x.id > 0)
        );
      } else {
        console.error("Error cargando IVA:", ivasRes.reason);
      }

      const huboError =
        proveedoresRes.status === "rejected" ||
        productosRes.status === "rejected" ||
        terminosRes.status === "rejected" ||
        ivasRes.status === "rejected";

      if (huboError) {
        toast.error("Uno o más catálogos no se pudieron cargar. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error inesperado cargando catálogos:", error);
      toast.error("No se pudieron cargar los catálogos");
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  useEffect(() => {
    loadCompras();
  }, [loadCompras]);

  useEffect(() => {
    if (!params.id) {
      setCompraDetalle(null);
      return;
    }

    if (isVer || isEditar || isAnular) {
      const id = Number(params.id);
      if (!Number.isFinite(id)) {
        closeToList();
        return;
      }
      loadCompraDetalle(id);
    }
  }, [params.id, isVer, isEditar, isAnular, loadCompraDetalle, closeToList]);

  const filteredCompras = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return compras
      .filter((c) => {
        if (selectedBodegaId) return true;
        if (!selectedBodega || selectedBodega === "Todas las bodegas") return true;
        return c.bodega === selectedBodega;
      })
      .filter((c) => {
        return (
          c.numeroOrden.toLowerCase().includes(s) ||
          c.proveedor.toLowerCase().includes(s) ||
          c.estado.toLowerCase().includes(s) ||
          String(c.items).includes(s)
        );
      });
  }, [compras, searchTerm, selectedBodega, selectedBodegaId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaId, selectedBodega]);

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

  const buildCompraPayload = () => {
    return {
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
      await api.patch(`/compras/${compraParaCambioEstado.id}`, {
        id_estado_compra: ESTADO_COMPRA_IDS.Aprobada,
      });

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

  const generateCompraPDF = (compra: Compra) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE COMPRA", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`N° Orden: ${compra.numeroOrden}`, 20, 40);
    doc.text(`Proveedor: ${compra.proveedor}`, 20, 46);
    doc.text(`Término de pago: ${compra.terminoPago || "-"}`, 20, 52);
    doc.text(`Bodega: ${compra.bodega || "-"}`, 20, 58);

    doc.text(
      `Fecha: ${compra.fecha ? new Date(compra.fecha).toLocaleDateString("es-CO") : "-"}`,
      120,
      40
    );
    doc.text(
      `Fecha Entrega: ${
        compra.fechaEntrega
          ? new Date(compra.fechaEntrega).toLocaleDateString("es-CO")
          : "-"
      }`,
      120,
      46
    );
    doc.text(`Estado: ${compra.estado}`, 120, 52);

    doc.setLineWidth(0.5);
    doc.line(20, 64, 190, 64);

    if (compra.productos && compra.productos.length > 0) {
      const tableData = compra.productos.map((item) => [
        item.producto.nombre,
        String(item.cantidad),
        `${item.ivaNombre} (${item.ivaPorcentaje.toFixed(2)}%)`,
        `$${item.precio.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
        })}`,
        `$${item.subtotal.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
        })}`,
      ]);

      autoTable(doc, {
        startY: 70,
        head: [["Producto", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 58 },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 32, halign: "center" },
          3: { cellWidth: 38, halign: "right" },
          4: { cellWidth: 40, halign: "right" },
        },
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 70;
    const totalesY = finalY + 10;

    doc.text("Subtotal:", 130, totalesY);
    doc.text(
      `$${compra.subtotal.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      190,
      totalesY,
      { align: "right" }
    );

    doc.text("IVA:", 130, totalesY + 6);
    doc.text(
      `$${compra.impuestos.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      190,
      totalesY + 6,
      { align: "right" }
    );

    doc.setLineWidth(0.3);
    doc.line(130, totalesY + 10, 190, totalesY + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 130, totalesY + 16);
    doc.text(
      `$${compra.total.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      190,
      totalesY + 16,
      { align: "right" }
    );

    if (compra.observaciones) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Observaciones:", 20, totalesY + 30);
      const splitObs = doc.splitTextToSize(compra.observaciones, 170);
      doc.text(splitObs, 20, totalesY + 36);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generado el ${new Date().toLocaleString("es-CO")}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save(`Orden_Compra_${compra.numeroOrden}.pdf`);
    toast.success("PDF descargado exitosamente");
  };

  const handleDownloadPDF = async (compra: Compra) => {
    try {
      if (compra.productos?.length) {
        generateCompraPDF(compra);
        return;
      }

      const { data } = await api.get(`/compras/${compra.id}`);
      const compraFull = mapCompraFromApi(data);
      generateCompraPDF(compraFull);
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("No se pudo generar el PDF de la compra");
    }
  };

  const resetCompraForm = () => {
    setFormData({
      numeroOrden: "",
      proveedorId: "",
      terminoPagoId: "",
      fecha: getFechaActual(),
      fechaEntrega: "",
      estado: "Pendiente",
      observaciones: "",
      bodega:
        selectedBodega && selectedBodega !== "Todas las bodegas"
          ? selectedBodega
          : "Bodega activa",
    });

    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(1);
    setPrecioProducto("");
    setProductosOrden([]);
  };

  useEffect(() => {
    if (!isCrear) return;
    resetCompraForm();
  }, [isCrear, selectedBodega]);

  useEffect(() => {
    if (!isEditar) return;
    if (!compraDetalle) return;

    setFormData({
      numeroOrden: compraDetalle.numeroOrden,
      proveedorId: String(compraDetalle.proveedorId || ""),
      terminoPagoId: String(compraDetalle.terminoPagoId || ""),
      fecha: compraDetalle.fecha,
      fechaEntrega: compraDetalle.fechaEntrega,
      estado: compraDetalle.estado,
      observaciones: compraDetalle.observaciones,
      bodega: compraDetalle.bodega || "Bodega activa",
    });

    setProductosOrden(compraDetalle.productos ?? []);
    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(1);
    setPrecioProducto("");
  }, [isEditar, compraDetalle]);

  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Debes seleccionar un producto");
      return;
    }

    if (!selectedIvaId) {
      toast.error("Debes seleccionar un IVA");
      return;
    }

    if (cantidadProducto <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    const precio = parseFloat(precioProducto) || 0;

    if (!precioProducto.trim() || Number.isNaN(precio) || precio <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }

    const productoSeleccionado = productosActivos.find(
      (p) => String(p.id) === String(selectedProductoId)
    );

    if (!productoSeleccionado) {
      toast.error("Producto no encontrado");
      return;
    }

    const ivaSeleccionado = ivasActivos.find(
      (i) => String(i.id) === String(selectedIvaId)
    );

    if (!ivaSeleccionado) {
      toast.error("IVA no encontrado");
      return;
    }

    const yaExiste = productosOrden.some(
      (item) => String(item.producto.id) === String(productoSeleccionado.id)
    );

    if (yaExiste) {
      toast.error("Este producto ya fue agregado a la orden");
      return;
    }

    const nuevoProducto: ProductoOrden = {
      producto: {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
      },
      cantidad: cantidadProducto,
      precio,
      subtotal: Number((cantidadProducto * precio).toFixed(2)),
      idIva: ivaSeleccionado.id,
      ivaNombre: ivaSeleccionado.nombre,
      ivaPorcentaje: ivaSeleccionado.porcentaje,
    };

    setProductosOrden((prev) => [...prev, nuevoProducto]);
    setSelectedProductoId("");
    setSelectedIvaId("");
    setCantidadProducto(1);
    setPrecioProducto("");
  };

  const handleEliminarProducto = (productoId: string | number) => {
    setProductosOrden((prev) =>
      prev.filter((item) => String(item.producto.id) !== String(productoId))
    );
  };

  const confirmCreate = async () => {
    if (isSaving) return;

    if (!formData.proveedorId) {
      toast.error("Debes seleccionar un proveedor");
      return;
    }

    if (!formData.terminoPagoId) {
      toast.error("Debes seleccionar un término de pago");
      return;
    }

    if (!formData.fechaEntrega) {
      toast.error("Debes ingresar la fecha de entrega");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    try {
      setIsSaving(true);

      await api.post("/compras", buildCompraPayload());

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

    if (!formData.proveedorId) {
      toast.error("Debes seleccionar un proveedor");
      return;
    }

    if (!formData.terminoPagoId) {
      toast.error("Debes seleccionar un término de pago");
      return;
    }

    if (!formData.fechaEntrega) {
      toast.error("Debes ingresar la fecha de entrega");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    try {
      setIsSaving(true);

      await api.patch(`/compras/${compraDetalle.id}`, {
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

  const confirmAnular = async () => {
    if (!compraDetalle) return;

    if (compraDetalle.estado === "Anulada") {
      toast.error("La orden ya está anulada");
      return;
    }

    try {
      await api.patch(`/compras/${compraDetalle.id}`, {
        id_estado_compra: ESTADO_COMPRA_IDS.Anulada,
      });

      await loadCompras();
      toast.success("Orden anulada exitosamente");
      closeToList();
    } catch (error) {
      console.error("Error anulando compra:", error);
      toast.error("No se pudo anular la orden");
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const compraSeleccionada = compraDetalle;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Órdenes de Compra</h2>
        <p className="text-gray-600 mt-1">
          Gestiona las órdenes de compra de productos
        </p>
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
              {isLoading ? (
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
                          onClick={() => handleDownloadPDF(compra)}
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
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(compra)}
                          className="hover:bg-red-50"
                          title="Anular"
                        >
                          <Ban size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
          className="max-w-6xl max-h-[85vh] overflow-y-auto"
          aria-describedby="create-order-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription id="create-order-description">
              Completa la información para crear una nueva orden de compra
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 px-2">
            <div className="grid grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numeroOrden">Número de Orden</Label>
                <Input
                  id="numeroOrden"
                  value={formData.numeroOrden || "Se genera automáticamente"}
                  disabled
                  className="bg-gray-100 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  disabled
                  className="bg-gray-100 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaEntrega">Fecha de Entrega *</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={formData.fechaEntrega}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaEntrega: e.target.value })
                  }
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega">Bodega</Label>
                <Input
                  id="bodega"
                  value={formData.bodega || "Bodega activa"}
                  disabled
                  className="bg-gray-100 h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor *</Label>
                <div className="flex gap-4">
                  <Select
                    value={formData.proveedorId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, proveedorId: value })
                    }
                  >
                    <SelectTrigger id="proveedor" className="flex-1 h-12">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedoresActivos.length === 0 ? (
                        <div className="px-2 py-2 text-sm text-gray-500">
                          No hay proveedores activos disponibles
                        </div>
                      ) : (
                        proveedoresActivos.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={String(proveedor.id)}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/app/proveedores/crear")}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 h-12"
                  >
                    <Plus size={18} className="mr-2" />
                    Nuevo Proveedor
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminoPago">Término de Pago *</Label>
                <Select
                  value={formData.terminoPagoId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, terminoPagoId: value })
                  }
                >
                  <SelectTrigger id="terminoPago" className="h-12">
                    <SelectValue placeholder="Selecciona un término de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminosPagoActivos.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-gray-500">
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

            <div className="border-t pt-6 mt-6">
              <Label className="text-lg mb-4 block">Productos de la Orden</Label>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="producto">Producto</Label>
                  <Select
                    value={selectedProductoId}
                    onValueChange={setSelectedProductoId}
                  >
                    <SelectTrigger id="producto" className="h-12">
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
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) =>
                      setCantidadProducto(parseInt(e.target.value) || 1)
                    }
                    min="1"
                    className="h-12"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="iva">IVA</Label>
                  <Select value={selectedIvaId} onValueChange={setSelectedIvaId}>
                    <SelectTrigger id="iva" className="h-12">
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
                  <Label htmlFor="precio">Precio Unitario</Label>
                  <Input
                    id="precio"
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
                  <span className="font-bold text-blue-600">
                    ${calcularTotales.total.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Escribe cualquier observación sobre la orden de compra..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCreate}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
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
                      ? new Date(compraSeleccionada.fecha).toLocaleDateString("es-CO")
                      : "-"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-600">Fecha de Entrega</Label>
                  <p className="font-medium">
                    {compraSeleccionada.fechaEntrega
                      ? new Date(compraSeleccionada.fechaEntrega).toLocaleDateString(
                          "es-CO"
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              {compraSeleccionada.productos &&
                compraSeleccionada.productos.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-gray-600 mb-2 block">Productos</Label>
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
            <Button variant="outline" onClick={closeToList}>
              Cerrar
            </Button>
            {compraSeleccionada && (
              <Button
                onClick={() => handleDownloadPDF(compraSeleccionada)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download size={16} className="mr-2" />
                Descargar PDF
              </Button>
            )}
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
                      setFormData({ ...formData, estado: value as CompraEstado })
                    }
                  >
                    <SelectTrigger id="edit-estado" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aprobada">Aprobada</SelectItem>
                      <SelectItem value="Anulada">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-proveedor">Proveedor *</Label>
                  <Select
                    value={formData.proveedorId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, proveedorId: value })
                    }
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
                  <Label htmlFor="edit-bodega">Bodega</Label>
                  <Input
                    id="edit-bodega"
                    value={formData.bodega}
                    disabled
                    className="bg-gray-100 h-12"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
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
                      type="number"
                      value={cantidadProducto}
                      onChange={(e) =>
                        setCantidadProducto(parseInt(e.target.value) || 1)
                      }
                      min="1"
                      className="h-12"
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
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  placeholder="Escribe cualquier observación sobre la orden de compra..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              disabled={isSaving || isLoadingDetail}
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Esta acción no se puede deshacer. La orden{" "}
                  <strong>{compraSeleccionada.numeroOrden}</strong> será anulada.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Proveedor:</strong> {compraSeleccionada.proveedor}
                </p>
                <p>
                  <strong>Total:</strong> $
                  {compraSeleccionada.total.toLocaleString("es-CO")}
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
            <Button onClick={confirmAnular} className="bg-red-600 hover:bg-red-700">
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
