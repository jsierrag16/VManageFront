import { useState, useMemo, useEffect, useRef } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  useOutletContext,
} from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Badge } from "../../../shared/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import type { AppOutletContext } from "../../../layouts/MainLayout";
import {
  ESTADO_REMISION_IDS,
  cambiarEstadoRemisionCompra,
  createRemisionCompra,
  getCompraById,
  getComprasOptions,
  getRemisionCompraById,
  getRemisionesCompra,
  updateRemisionCompra,
  type CompraDetail,
  type CompraOption,
  type RemisionCompraUI,
} from "../services/remisiones-compra.services";

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
  const message = err?.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  if (typeof err?.message === "string") return err.message;

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

const buildEmptyForm = () => ({
  numeroRemision: "Se genera automáticamente",
  id_compra: "",
  ordenCompra: "",
  id_proveedor: "",
  proveedor: "",
  id_bodega: "",
  bodega: "",
  fechaCreacion: new Date().toISOString().split("T")[0],
  fechaVencimiento: "",
  observaciones: "",
  idFactura: "",
});

export default function RemisionesCompra() {
  const { selectedBodegaId, selectedBodegaNombre } = useOutletContext<
    AppOutletContext & {
      selectedBodegaId?: number;
      selectedBodegaNombre?: string;
    }
  >();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const isCrear = location.pathname.endsWith("/remcompras/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = () => navigate("/app/remcompras");

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingDetalleRemision, setLoadingDetalleRemision] = useState(false);
  const [loadingCompraDetalle, setLoadingCompraDetalle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [remisiones, setRemisiones] = useState<RemisionCompraUI[]>([]);
  const [comprasOptions, setComprasOptions] = useState<CompraOption[]>([]);
  const [selectedCompra, setSelectedCompra] = useState<CompraDetail | null>(null);
  const [selectedRemision, setSelectedRemision] = useState<RemisionCompraUI | null>(null);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [remisionParaCambioEstado, setRemisionParaCambioEstado] =
    useState<RemisionCompraUI | null>(null);
  const [nuevoEstadoLabel, setNuevoEstadoLabel] = useState<string | null>(null);
  const [lastCreatedCode, setLastCreatedCode] = useState("");

  const [formData, setFormData] = useState(buildEmptyForm());

  const [items, setItems] = useState<ItemForm[]>([]);
  const [currentProducto, setCurrentProducto] = useState("");
  const [currentNumeroLote, setCurrentNumeroLote] = useState("");
  const [currentCantidad, setCurrentCantidad] = useState("");
  const [currentFechaVencimiento, setCurrentFechaVencimiento] = useState("");
  const [currentNota, setCurrentNota] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadRemisiones = async () => {
    const data = await getRemisionesCompra(selectedBodegaId);
    setRemisiones(data);
  };

  const loadCompras = async () => {
    const data = await getComprasOptions(selectedBodegaId);
    setComprasOptions(data);
  };

  const loadInitialData = async () => {
    setLoadingPage(true);
    try {
      await Promise.all([loadRemisiones(), loadCompras()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible cargar las remisiones"));
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, [selectedBodegaId]);

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
            id_bodega: String(remision.idBodega),
            bodega: remision.bodega,
            fechaCreacion: remision.fecha || new Date().toISOString().split("T")[0],
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
            if (!cancelled) setSelectedCompra(compra);
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
        remision.estado,
        remision.bodega,
        String(remision.itemsCount),
      ].some((field) => normalizeText(field).includes(q));
    });
  }, [remisiones, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaNombre]);

  const totalPages = Math.max(1, Math.ceil(filteredRemisiones.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(startIndex, endIndex);

  const stats = useMemo(() => {
    const totalRemisiones = filteredRemisiones.length;
    const pendientes = filteredRemisiones.filter((r) => r.estadoKey === "PENDIENTE").length;
    const aplicadas = filteredRemisiones.filter((r) => r.estadoKey === "APLICADA").length;
    const anuladas = filteredRemisiones.filter((r) => r.estadoKey === "ANULADA").length;

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
    navigate(`/app/remcompras/${r.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/remcompras/crear");
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
    navigate(`/app/remcompras/${r.id}/editar`);
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
    navigate(`/app/remcompras/${r.id}/anular`);
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

      setSelectedCompra(compra);
      setItems([]);
      resetItemBuilder();

      setFormData((prev) => ({
        ...prev,
        id_compra: String(compra.id),
        ordenCompra: compra.codigo,
        id_proveedor: String(compra.proveedorId),
        proveedor: compra.proveedorNombre,
        id_bodega: String(compra.idBodega),
        bodega: compra.bodegaNombre,
      }));
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible cargar el detalle de la compra"));
    } finally {
      setLoadingCompraDetalle(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedCompra) {
      toast.error("Primero debes seleccionar una orden de compra");
      return;
    }

    if (!currentProducto || !currentNumeroLote || !currentCantidad || !currentFechaVencimiento) {
      toast.error("Completa producto, lote, cantidad y fecha de vencimiento");
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
    const targetId = currentId.startsWith("edit-") ? "edit-numeroLote" : "numeroLote";

    const loteInput = document.getElementById(targetId) as HTMLInputElement | null;
    loteInput?.focus();
  };

  const validateBeforeSubmit = () => {
    if (!formData.id_compra) {
      toast.error("Debes seleccionar una orden de compra válida");
      return false;
    }

    if (!formData.id_proveedor || !formData.id_bodega) {
      toast.error("La compra seleccionada no tiene proveedor o bodega válidos");
      return false;
    }

    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto a la remisión");
      return false;
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
      await loadRemisiones();
      closeToList();
      setShowSuccessModal(true);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible crear la remisión"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEdit = async () => {
    if (!selectedRemision) return;
    if (!validateBeforeSubmit()) return;

    if (selectedRemision.afectaExistencias || selectedRemision.estadoKey === "APLICADA") {
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

      await loadRemisiones();
      toast.success("Remisión de compra actualizada exitosamente");
      closeToList();
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

    if (selectedRemision.afectaExistencias || selectedRemision.estadoKey === "APLICADA") {
      toast.error("No debes anular una remisión que ya aplicó existencias");
      return;
    }

    setSubmitting(true);
    try {
      await cambiarEstadoRemisionCompra(selectedRemision.id, {
        id_estado_remision_compra: ESTADO_REMISION_IDS.ANULADA,
      });

      await loadRemisiones();
      toast.success("Remisión de compra anulada exitosamente");
      closeToList();
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

      await loadRemisiones(); 

      if (selectedRemision?.id === remisionParaCambioEstado.id) {
        const fresh = await getRemisionCompraById(remisionParaCambioEstado.id);
        setSelectedRemision(fresh);
      }

      toast.success(
        "Estado actualizado correctamente y existencias aplicadas desde backend"
      );

      setShowConfirmEstadoModal(false);
      setRemisionParaCambioEstado(null);
      setNuevoEstadoLabel(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "No fue posible cambiar el estado"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setLastCreatedCode("");
  };

  const handleDescargarRemisiones = () => {
    try {
      const headers = [
        "N° Remisión",
        "Orden de Compra",
        "Proveedor",
        "Fecha",
        "Estado",
        "Bodega",
        "Items",
        "Observaciones",
      ];

      const rows = filteredRemisiones.map((remision) => [
        remision.numeroRemision,
        remision.ordenCompra,
        remision.proveedor,
        formatDate(remision.fecha),
        remision.estado,
        remision.bodega,
        String(remision.itemsCount),
        remision.observaciones || "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `remisiones_compra_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Remisiones descargadas exitosamente");
    } catch (error) {
      toast.error("Error al descargar las remisiones");
      console.error(error);
    }
  };

  const handleDescargarRemision = async (remision: RemisionCompraUI) => {
    try {
      const detalle =
        remision.items.length > 0 ? remision : await getRemisionCompraById(remision.id);

      const csvLines = [
        "REMISIÓN DE COMPRA",
        "",
        "INFORMACIÓN GENERAL",
        `Número de Remisión,${detalle.numeroRemision}`,
        `Orden de Compra,${detalle.ordenCompra}`,
        `Proveedor,${detalle.proveedor}`,
        `Fecha,${formatDate(detalle.fecha)}`,
        `Estado,${detalle.estado}`,
        `Bodega,${detalle.bodega}`,
        `Observaciones,"${(detalle.observaciones || "N/A").replace(/"/g, '""')}"`,
        "",
        "PRODUCTOS",
        "Producto,Lote,Cantidad,Precio Unitario,IVA %,Fecha Vencimiento,Código Barras,Nota",
        ...detalle.items.map(
          (item) =>
            `"${item.productoNombre.replace(/"/g, '""')}",` +
            `"${item.lote}",` +
            `${item.cantidad},` +
            `${item.precio_unitario},` +
            `${item.ivaPorcentaje},` +
            `"${formatDate(item.fecha_vencimiento)}",` +
            `"${(item.codigo_barras || item.cod_barras || "").replace(/"/g, '""')}",` +
            `"${(item.nota || "").replace(/"/g, '""')}"`
        ),
      ];

      const csvContent = csvLines.join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `remision_${detalle.numeroRemision}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Remisión ${detalle.numeroRemision} descargada exitosamente`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al descargar la remisión"));
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
        <h2 className="text-gray-900">Gestión de Remisiones de Compra</h2>
        <p className="text-gray-600 mt-1">
          Crea, consulta, edita y administra las remisiones de compra asociadas a órdenes de compra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Remisiones</p>
              <p className="text-3xl mt-2">{stats.totalRemisiones}</p>
            </div>
            <FileText className="text-blue-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pendientes</p>
              <p className="text-3xl mt-2">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-200" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Aprobadas / Confirmadas</p>
              <p className="text-3xl mt-2">{stats.aplicadas}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#ffffff",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                style={{
                  color: "#fecaca",
                  fontSize: "0.875rem",
                }}
              >
                Anuladas
              </p>
              <p
                style={{
                  color: "#ffffff",
                  fontSize: "1.875rem",
                  marginTop: "0.5rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {stats.anuladas}
              </p>
            </div>

            <div style={{ color: "#fecaca" }}>
              <Ban size={40} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por remisión, orden, proveedor, estado, bodega o número de items..."
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
                currentRemisiones.map((remision, index) => (
                  <TableRow key={remision.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{remision.numeroRemision}</TableCell>
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
                          onClick={() => handleDescargarRemision(remision)}
                          className="hover:bg-green-50"
                          title="Descargar"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(remision)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                          disabled={remision.estadoKey !== "PENDIENTE" || remision.afectaExistencias}
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(remision)}
                          className="hover:bg-red-50"
                          title="Anular"
                          disabled={remision.estadoKey !== "PENDIENTE" || remision.afectaExistencias}
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

        {filteredRemisiones.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRemisiones.length)} de{" "}
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

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">Número de Remisión</Label>
                <Input
                  id="numeroRemision"
                  value={formData.numeroRemision}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordenCompra">Orden de Compra *</Label>
                <Select
                  value={formData.id_compra}
                  onValueChange={handleOrdenCompraChange}
                >
                  <SelectTrigger id="ordenCompra">
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

              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodega">Bodega</Label>
                <Input
                  id="bodega"
                  value={formData.bodega}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaCreacion">Fecha de Creación</Label>
                <Input
                  id="fechaCreacion"
                  type="date"
                  value={formData.fechaCreacion}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fechaVencimiento: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idFactura">ID Factura</Label>
                <Input
                  id="idFactura"
                  type="number"
                  min="1"
                  value={formData.idFactura}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, idFactura: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {selectedCompra && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Compra seleccionada: {selectedCompra.codigo}
                    </p>
                    <p className="text-sm text-blue-800">
                      Proveedor: {selectedCompra.proveedorNombre} | Bodega: {selectedCompra.bodegaNombre}
                    </p>
                  </div>
                  {loadingCompraDetalle && (
                    <div className="flex items-center gap-2 text-blue-700 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Cargando detalle...
                    </div>
                  )}
                </div>

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

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold">Productos de la Remisión</h3>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
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
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanee o escriba el código de barras del lote/ítem..."
                    className="pr-10 bg-white border-blue-300 focus:border-blue-500"
                  />
                  <Barcode
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400"
                    size={20}
                  />
                </div>

                <p className="text-xs text-blue-700 mt-2">
                  Opcional. Este código se guarda en el detalle de la remisión y luego en existencias.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select
                      value={currentProducto}
                      onValueChange={(value: string) => setCurrentProducto(value)}
                    >
                      <SelectTrigger id="producto">
                        <SelectValue placeholder="Seleccionar producto de la compra" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosDisponibles.map((producto) => (
                          <SelectItem key={producto.idProducto} value={String(producto.idProducto)}>
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
                      onChange={(e) => setCurrentNumeroLote(e.target.value)}
                      placeholder="Ej: AL-2026-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      value={currentCantidad}
                      onChange={(e) => setCurrentCantidad(e.target.value)}
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimientoItem">Fecha de Vencimiento *</Label>
                    <Input
                      id="fechaVencimientoItem"
                      type="date"
                      value={currentFechaVencimiento}
                      onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notaItem">Nota del Ítem</Label>
                    <Input
                      id="notaItem"
                      value={currentNota}
                      onChange={(e) => setCurrentNota(e.target.value)}
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
                  <p className="text-sm">
                    Selecciona la compra y agrega productos desde su detalle
                  </p>
                </div>
              )}
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
                  <Label htmlFor="edit-numeroRemision">Número de Remisión</Label>
                  <Input
                    id="edit-numeroRemision"
                    value={formData.numeroRemision}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-ordenCompra">Orden de Compra</Label>
                  <Input
                    id="edit-ordenCompra"
                    value={formData.ordenCompra}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-proveedor">Proveedor</Label>
                  <Input
                    id="edit-proveedor"
                    value={formData.proveedor}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bodega">Bodega</Label>
                  <Input
                    id="edit-bodega"
                    value={formData.bodega}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
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
                  <Label htmlFor="edit-fechaVencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="edit-fechaVencimiento"
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fechaVencimiento: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-idFactura">ID Factura</Label>
                  <Input
                    id="edit-idFactura"
                    type="number"
                    min="1"
                    value={formData.idFactura}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, idFactura: e.target.value }))
                    }
                    placeholder="Opcional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-observaciones">Observaciones</Label>
                  <Input
                    id="edit-observaciones"
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                    }
                  />
                </div>
              </div>

              {selectedCompra && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <p className="font-semibold text-blue-900 mb-3">
                    Productos disponibles de la compra {selectedCompra.codigo}
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
                            <SelectItem key={producto.idProducto} value={String(producto.idProducto)}>
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
                          onChange={(e) => setCodigoBarras(e.target.value)}
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
                        onChange={(e) => setCurrentNumeroLote(e.target.value)}
                        placeholder="Ej: AL-2026-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-cantidad">Cantidad *</Label>
                      <Input
                        id="edit-cantidad"
                        type="number"
                        value={currentCantidad}
                        onChange={(e) => setCurrentCantidad(e.target.value)}
                        placeholder="0"
                        min="0.01"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-fechaVencimientoItem">Fecha de Vencimiento *</Label>
                      <Input
                        id="edit-fechaVencimientoItem"
                        type="date"
                        value={currentFechaVencimiento}
                        onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="edit-notaItem">Nota del Ítem</Label>
                      <Input
                        id="edit-notaItem"
                        value={currentNota}
                        onChange={(e) => setCurrentNota(e.target.value)}
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
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-semibold">{formatDate(selectedRemision.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-semibold">{formatDate(selectedRemision.fechaVencimiento)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-semibold">{selectedRemision.bodega || selectedBodegaNombre}</p>
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
                          <TableCell>{item.codigo_barras || item.cod_barras || "—"}</TableCell>
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

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cerrar
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
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby="delete-remision-compra-description"
        >
          <DialogHeader>
            <DialogTitle>Anular Remisión de Compra</DialogTitle>
            <DialogDescription id="delete-remision-compra-description">
              ¿Estás seguro de que deseas anular esta remisión de compra? Esta acción no se puede deshacer.
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
              ¿Deseas aprobar/confirmar esta remisión? Solo al confirmar/aprobar se deben aplicar existencias desde el backend.
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

      <Dialog
        open={showSuccessModal}
        onOpenChange={handleSuccessModalClose}
      >
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
