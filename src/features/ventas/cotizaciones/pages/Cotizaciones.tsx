import { useState, useMemo, useEffect } from "react";
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
  Plus,
  Package,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Ban,
  Building2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shared/components/ui/select";
import { Badge } from "../../../../shared/components/ui/badge";
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
import logoVmanage from "../../../../assets/images/VLogo.png";
import type {
  ClienteCotizacion,
  ProductoCotizacion,
  ProductoOrdenCotizacion,
} from "@/features/ventas/cotizaciones/types/cotizaciones.types";
import type { AppOutletContext } from "../../../../layouts/MainLayout";
import { clientesService } from "@/features/ventas/clientes/services/clientes.service";
import { mapClienteApiToUi } from "@/features/ventas/clientes/services/clientes.mapper";
import { getProductosVista } from "@/features/existencias/productos/services/productos.services";
import {
  cotizacionesService,
  ESTADO_COTIZACION_FALLBACK,
  type CotizacionUI as Cotizacion,
} from "@/features/ventas/cotizaciones/services/cotizaciones.service";

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function Cotizaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const {
    selectedBodegaId,
    selectedBodegaNombre,
    bodegasDisponibles,
    currentUser,
  } = useOutletContext<AppOutletContext>();

  const selectedBodega = selectedBodegaNombre;

  const currentUserId = useMemo(() => {
    const parsed = Number(
      currentUser?.id ?? currentUser?.id_usuario ?? currentUser?.sub ?? 0
    );

    return Number.isFinite(parsed) ? parsed : 0;
  }, [currentUser]);

  const isCrear = location.pathname.endsWith("/crear");
  const isVer = location.pathname.endsWith("/ver");
  const isEditar = location.pathname.endsWith("/editar");
  const isAnular = location.pathname.endsWith("/anular");

  const closeToList = () => navigate("/app/cotizaciones");

  const [searchTerm, setSearchTerm] = useState("");
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [clientes, setClientes] = useState<ClienteCotizacion[]>([]);
  const [productosCatalogo, setProductosCatalogo] = useState<ProductoCotizacion[]>([]);
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

  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [cotizacionParaPdf, setCotizacionParaPdf] =
    useState<Cotizacion | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [detalleCotizacionInicial, setDetalleCotizacionInicial] = useState("");

  const cotizacionSeleccionada = useMemo(() => {
    if (!params.id) return null;
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return cotizaciones.find((c) => c.id === id) ?? null;
  }, [cotizaciones, params.id]);

  useEffect(() => {
    if (!isVer && !isEditar && !isAnular) return;

    if (!cotizacionSeleccionada) {
      closeToList();
      return;
    }

    if (isEditar && !puedeEditarCotizacion(cotizacionSeleccionada.estado)) {
      toast.error("Solo se pueden editar cotizaciones pendientes");
      closeToList();
      return;
    }

    if (
      isAnular &&
      (cotizacionSeleccionada.estado === "Aprobada" ||
        cotizacionSeleccionada.estado === "Anulada")
    ) {
      toast.error(
        cotizacionSeleccionada.estado === "Aprobada"
          ? "No se puede anular una cotización aprobada"
          : "La cotización ya está anulada"
      );
      closeToList();
      return;
    }
  }, [isVer, isEditar, isAnular, cotizacionSeleccionada]);

  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [cotizacionParaCambioEstado, setCotizacionParaCambioEstado] =
    useState<Cotizacion | null>(null);

  const [formData, setFormData] = useState({
    numeroCotizacion: "",
    cliente: "",
    idCliente: "",
    fecha: "",
    fechaVencimiento: "",
    estado: "Pendiente" as
      | "Pendiente"
      | "Aprobada"
      | "Rechazada"
      | "Vencida"
      | "Anulada",
    items: 0,
    subtotal: 0,
    impuestos: 0,
    observaciones: "",
    bodega: "",
    idBodega: "",
  });

  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [cantidadProducto, setCantidadProducto] = useState("0");
  const [precioProducto, setPrecioProducto] = useState<string>("");
  const [productosOrden, setProductosOrden] = useState<ProductoOrdenCotizacion[]>([]);

  const productosActivos = useMemo(() => {
    return productosCatalogo.filter((p) => p.estado);
  }, [productosCatalogo]);

  const getCostoReferenciaProducto = (productoId: string) => {
    return Number(
      costosReferenciaPorProducto[productoId]?.costoReferencia ?? 0
    );
  };

  const costoReferenciaProductoSeleccionado = selectedProductoId
    ? getCostoReferenciaProducto(selectedProductoId)
    : 0;

  const precioProductoMenorCostoRef =
    costoReferenciaProductoSeleccionado > 0 &&
    Number(precioProducto || 0) > 0 &&
    Number(precioProducto || 0) < costoReferenciaProductoSeleccionado;

  const estadoIds = useMemo(() => {
    const map = { ...ESTADO_COTIZACION_FALLBACK };

    cotizaciones.forEach((cotizacion) => {
      if (cotizacion.estado) {
        map[cotizacion.estado] = cotizacion.estadoId;
      }
    });

    return map;
  }, [cotizaciones]);

  useEffect(() => {
    const cargarCotizaciones = async () => {
      try {
        const cotizacionesApi = await cotizacionesService.getAll({
          idBodega: selectedBodegaId ?? undefined,
        });

        setCotizaciones(cotizacionesApi);
      } catch (error) {
        console.error("Error cargando cotizaciones:", error);
        toast.error("No se pudo cargar el listado de cotizaciones");
      }
    };

    void cargarCotizaciones();
  }, [selectedBodegaId]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      const promesaProductos =
        selectedBodegaNombre !== "Todas las bodegas" && selectedBodegaId
          ? getProductosVista("active", selectedBodegaId)
          : getProductosVista("all");

      const [clientesResult, productosResult] = await Promise.allSettled([
        clientesService.getAll({
          incluirInactivos: true,
          id_bodega:
            selectedBodegaId && selectedBodegaId > 0
              ? selectedBodegaId
              : undefined,
        }),
        promesaProductos,
      ]);

      if (clientesResult.status === "fulfilled") {
        setClientes(
          clientesResult.value.map(mapClienteApiToUi).map((cliente) => ({
            id: String(cliente.id),
            nombre: cliente.nombre,
            email: cliente.email,
            tipoDocumento: cliente.tipoDocumento,
            numeroDocumento: cliente.numeroDocumento,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            ciudad: cliente.ciudad,
            departamento: cliente.departamento,
            pais: "Colombia",
            estado: cliente.estado,
            bodega: cliente.bodega,
            idBodega: cliente.idBodega,
            tipoCliente: cliente.tipoCliente,
            fechaRegistro: "",
          }))
        );
      } else {
        console.error("Error cargando clientes:", clientesResult.reason);
      }

      if (productosResult.status === "fulfilled") {
        setProductosCatalogo(
          productosResult.value.map((producto) => ({
            id: String(producto.id_producto),
            nombre: producto.nombre_producto,
            categoria: producto.categoria_producto?.nombre_categoria ?? "",
            descripcion: producto.descripcion ?? "",
            codigoBarras: "",
            iva: Number(producto.iva?.porcentaje ?? 0),
            stockTotal: Number(producto.stock_total ?? 0),
            estado: Boolean(producto.estado),
            lotes: (producto.lotes ?? []).map((lote) => ({
              id: String(lote.id_existencia),
              numeroLote: lote.lote || "Sin lote",
              cantidadDisponible: Number(
                lote.cantidad_disponible ?? lote.cantidad ?? 0
              ),
              fechaVencimiento: lote.fecha_vencimiento ?? "",
              bodega: lote.nombre_bodega ?? "",
            })),
          }))
        );
      } else {
        console.error("Error cargando productos:", productosResult.reason);
      }
    };

    void cargarCatalogos();
  }, [selectedBodegaId, selectedBodegaNombre]);

  const formatMoney = (value: unknown) => {
    return `COP$${Number(value || 0).toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatIvaPorcentaje = (value: unknown) => {
    const porcentaje = Number(value ?? 0);

    if (!Number.isFinite(porcentaje)) return "0";

    return porcentaje.toLocaleString("es-CO", {
      minimumFractionDigits: porcentaje % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  };

  const getProductoCotizacionLabel = (producto: ProductoCotizacion) => {
    return `${producto.nombre} — IVA ${formatIvaPorcentaje(producto.iva)}%`;
  };

  const getEstadoCotizacionClass = (estado: Cotizacion["estado"]) => {
    if (estado === "Aprobada") {
      return "bg-green-100 text-green-800 hover:bg-green-200";
    }

    if (estado === "Pendiente") {
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }

    if (estado === "Rechazada") {
      return "bg-red-100 text-red-800 hover:bg-red-200";
    }

    if (estado === "Anulada") {
      return "bg-red-100 text-red-800 opacity-60 cursor-not-allowed hover:bg-red-100";
    }

    if (estado === "Vencida") {
      return "bg-gray-100 text-gray-800 opacity-60 hover:bg-gray-100";
    }

    return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  };

  const getEstadoCotizacionBadgeClass = (estado: Cotizacion["estado"]) => {
    if (estado === "Aprobada") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (estado === "Anulada" || estado === "Rechazada") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (estado === "Vencida") {
      return "border-gray-200 bg-gray-50 text-gray-700";
    }

    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  };

  const padDate = (value: number) => String(value).padStart(2, "0");

  const formatDateLocalInput = (date: Date) => {
    return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(
      date.getDate()
    )}`;
  };

  const parseDateOnlyLocal = (value?: string | null) => {
    if (!value) return null;

    const dateOnly = String(value).slice(0, 10);
    const [year, month, day] = dateOnly.split("-").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  };

  const formatDateDisplay = (value?: string | null) => {
    const date = parseDateOnlyLocal(value);

    if (!date || Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-CO");
  };

  const getFechaGestionCotizacion = (cotizacion: Cotizacion) => {
    const c = cotizacion as Cotizacion & {
      fechaAprobacion?: string | null;
      fecha_aprobacion?: string | null;
      fechaAprobada?: string | null;
      fecha_aprobada?: string | null;
      fechaAnulacion?: string | null;
      fecha_anulacion?: string | null;
    };

    if (cotizacion.estado === "Aprobada") {
      return (
        c.fechaAprobacion ||
        c.fecha_aprobacion ||
        c.fechaAprobada ||
        c.fecha_aprobada ||
        ""
      );
    }

    if (cotizacion.estado === "Anulada") {
      return c.fechaAnulacion || c.fecha_anulacion || "";
    }

    return "";
  };

  const getUsuarioGestionCotizacion = (cotizacion: Cotizacion) => {
    const c = cotizacion as Cotizacion & {
      usuarioAprobo?: string | null;
      usuario_aprobo?: string | null;
      aprobadoPor?: string | null;
      aprobadaPor?: string | null;
      usuarioAnulo?: string | null;
      usuario_anulo?: string | null;
      anuladoPor?: string | null;
      anuladaPor?: string | null;
    };

    if (cotizacion.estado === "Aprobada") {
      return (
        c.usuarioAprobo ||
        c.usuario_aprobo ||
        c.aprobadoPor ||
        c.aprobadaPor ||
        "—"
      );
    }

    if (cotizacion.estado === "Anulada") {
      return (
        c.usuarioAnulo ||
        c.usuario_anulo ||
        c.anuladoPor ||
        c.anuladaPor ||
        "—"
      );
    }

    return "";
  };

  const getGestionEstadoCotizacion = (cotizacion: Cotizacion) => {
    if (cotizacion.estado === "Aprobada" || cotizacion.estado === "Anulada") {
      const usuario = getUsuarioGestionCotizacion(cotizacion);
      const fecha = getFechaGestionCotizacion(cotizacion);

      return fecha ? `${usuario} - ${formatDateDisplay(fecha)}` : usuario;
    }

    return "Pendiente de aprobación";
  };

  const getFechaActual = () => {
    return formatDateLocalInput(new Date());
  };

  const sumarDiasAFechaLocal = (fechaBase: string, dias: number) => {
    const date = parseDateOnlyLocal(fechaBase);

    if (!date) return "";

    date.setDate(date.getDate() + dias);

    return formatDateLocalInput(date);
  };

  const getFechaVencimientoDesde = (fechaBase = getFechaActual()) => {
    return sumarDiasAFechaLocal(fechaBase, 10);
  };

  const buildDetalleCotizacionKey = (items: ProductoOrdenCotizacion[]) => {
    return JSON.stringify(
      items
        .map((item) => ({
          id_producto: String(item.producto.id),
          cantidad: Number(item.cantidad || 0),
          precio: Number(item.precio || 0),
        }))
        .sort((a, b) => a.id_producto.localeCompare(b.id_producto))
    );
  };

  const clientesActivos = useMemo(() => {
    return clientes.filter((c) => c.estado === "Activo");
  }, [clientes]);

  const clienteSeleccionadoForm = useMemo(() => {
    return clientesActivos.find((cliente) => cliente.id === formData.idCliente) ?? null;
  }, [clientesActivos, formData.idCliente]);

  const getDocumentoClienteTexto = (cliente?: ClienteCotizacion | null) => {
    if (!cliente) return "";

    const tipoDocumento = cliente.tipoDocumento?.trim() || "Documento";
    const numeroDocumento = cliente.numeroDocumento?.trim() || "";

    if (!numeroDocumento) return "No registrado";

    return `${tipoDocumento}: ${numeroDocumento}`;
  };

  const getClienteDeCotizacion = (cotizacion?: Cotizacion | null) => {
    if (!cotizacion?.idCliente) return null;

    return (
      clientes.find((cliente) => cliente.id === String(cotizacion.idCliente)) ??
      null
    );
  };

  const getDocumentoClienteCotizacion = (cotizacion?: Cotizacion | null) => {
    if (!cotizacion) return "No registrado";

    const cliente = getClienteDeCotizacion(cotizacion);

    if (cliente) {
      return getDocumentoClienteTexto(cliente);
    }

    return "No registrado";
  };

  const filteredCotizaciones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return cotizaciones;

    return cotizaciones.filter((cotizacion) => {
      const documentoCliente = getDocumentoClienteCotizacion(cotizacion)
        .toLowerCase();

      return (
        cotizacion.numeroCotizacion.toLowerCase().includes(term) ||
        cotizacion.cliente.toLowerCase().includes(term) ||
        documentoCliente.includes(term) ||
        cotizacion.estado.toLowerCase().includes(term) ||
        cotizacion.items.toString().includes(term)
      );
    });
  }, [cotizaciones, searchTerm, clientes]);

  const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCotizaciones = filteredCotizaciones.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaId]);

  const stats = useMemo(() => {
    const totalCotizaciones = cotizaciones.length;
    const pendientes = cotizaciones.filter(
      (c) => c.estado === "Pendiente"
    ).length;
    const aprobadas = cotizaciones.filter(
      (c) => c.estado === "Aprobada"
    ).length;
    const anuladas = cotizaciones.filter((c) => c.estado === "Anulada").length;

    return { totalCotizaciones, pendientes, aprobadas, anuladas };
  }, [cotizaciones]);

  const resetForm = () => {
    setFormData({
      numeroCotizacion: "",
      cliente: "",
      idCliente: "",
      fecha: "",
      fechaVencimiento: "",
      estado: "Pendiente",
      items: 0,
      subtotal: 0,
      impuestos: 0,
      observaciones: "",
      bodega: "",
      idBodega: "",
    });

    setProductosOrden([]);
    setSelectedProductoId("");
    setCantidadProducto("0");
    setPrecioProducto("");
  };

  useEffect(() => {
    if (!isCrear) return;

    const fechaActual = getFechaActual();

    setFormData({
      numeroCotizacion: "",
      cliente: "",
      idCliente: "",
      fecha: fechaActual,
      fechaVencimiento: getFechaVencimientoDesde(fechaActual),
      estado: "Pendiente",
      items: 0,
      subtotal: 0,
      impuestos: 0,
      observaciones: "",
      bodega: "",
      idBodega: "",
    });

    setProductosOrden([]);
    setSelectedProductoId("");
    setCantidadProducto("0");
    setPrecioProducto("");
  }, [
    isCrear,
    selectedBodega,
    cotizaciones,
    selectedBodegaId,
    bodegasDisponibles,
  ]);

  useEffect(() => {
    if (!isEditar) return;
    if (!cotizacionSeleccionada) return;

    const productosEdit = cotizacionSeleccionada.productos || [];

    setFormData({
      numeroCotizacion: cotizacionSeleccionada.numeroCotizacion,
      cliente: cotizacionSeleccionada.cliente,
      idCliente: String(cotizacionSeleccionada.idCliente),
      fecha: cotizacionSeleccionada.fecha,
      fechaVencimiento: cotizacionSeleccionada.fechaVencimiento,
      estado: cotizacionSeleccionada.estado,
      items: cotizacionSeleccionada.items,
      subtotal: cotizacionSeleccionada.subtotal,
      impuestos: cotizacionSeleccionada.impuestos,
      observaciones: cotizacionSeleccionada.observaciones,
      bodega: cotizacionSeleccionada.bodega,
      idBodega: String(cotizacionSeleccionada.idBodega),
    });

    setProductosOrden(productosEdit);
    setDetalleCotizacionInicial(buildDetalleCotizacionKey(productosEdit));

    setProductosOrden(cotizacionSeleccionada.productos || []);
    setSelectedProductoId("");
    setCantidadProducto("0");
    setPrecioProducto("");
  }, [isEditar, cotizacionSeleccionada]);

  useEffect(() => {
    if (!isEditar) return;
    if (!cotizacionSeleccionada) return;
    if (!detalleCotizacionInicial) return;

    const detalleActual = buildDetalleCotizacionKey(productosOrden);

    if (detalleActual === detalleCotizacionInicial) {
      setFormData((prev) => ({
        ...prev,
        fechaVencimiento: cotizacionSeleccionada.fechaVencimiento,
      }));
      return;
    }

    const fechaActual = getFechaActual();

    setFormData((prev) => ({
      ...prev,
      fechaVencimiento: getFechaVencimientoDesde(fechaActual),
    }));
  }, [
    isEditar,
    cotizacionSeleccionada,
    detalleCotizacionInicial,
    productosOrden,
  ]);

  useEffect(() => {
    if (!selectedProductoId) {
      setPrecioProducto("");
      return;
    }

    if (!formData.idCliente) {
      setPrecioProducto("");
      return;
    }

    const cargarCostoReferencia = async () => {
      try {
        const respuesta = await cotizacionesService.getCostoReferencia(
          Number(formData.idCliente),
          Number(selectedProductoId)
        );

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
      } catch (error) {
        console.error("Error consultando costo referencia:", error);
        toast.error("No se pudo consultar el costo de referencia");
        setPrecioProducto("");
      }
    };

    void cargarCostoReferencia();
  }, [selectedProductoId, formData.idCliente]);

  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error("Por favor selecciona un producto");
      return;
    }

    const cantidad = Number(cantidadProducto);

    if (!cantidadProducto.trim() || Number.isNaN(cantidad) || cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }

    const precio = parseFloat(precioProducto);

    if (!precioProducto.trim() || Number.isNaN(precio) || precio <= 0) {
      toast.error("El precio debe ser mayor a cero");
      return;
    }

    const costoReferencia = getCostoReferenciaProducto(selectedProductoId);
    const referencia = costosReferenciaPorProducto[selectedProductoId];

    if (costoReferencia > 0 && precio < costoReferencia) {
      toast.warning(
        `El precio está por debajo del costo ref. (${formatMoney(costoReferencia)})`
      );
    }

    const producto = productosActivos.find((p) => p.id === selectedProductoId);
    if (!producto) return;

    const productoExistente = productosOrden.find(
      (p) => p.producto.id === selectedProductoId
    );

    if (productoExistente) {
      toast.error(
        "Este producto ya está agregado. Elimínalo primero si deseas modificarlo"
      );
      return;
    }

    const subtotal = cantidad * precio;

    const nuevoProducto = {
      producto,
      cantidad,
      precio,
      subtotal,
      costoReferencia: costoReferencia || null,
      loteReferencia: referencia?.loteReferencia ?? null,
      cantidadDisponibleReferencia: referencia?.cantidadDisponible ?? 0,
    };

    setProductosOrden([...productosOrden, nuevoProducto]);

    setSelectedProductoId("");
    setCantidadProducto("0");
    setPrecioProducto("");

    toast.success("Producto agregado correctamente");
  };

  const handleEliminarProducto = (productoId: string) => {
    setProductosOrden(productosOrden.filter((p) => p.producto.id !== productoId));
    toast.success("Producto eliminado de la cotización");
  };

  const calcularTotales = useMemo(() => {
    let subtotalSinIva = 0;
    let totalImpuestos = 0;
    const impuestosPorPorcentaje: { [key: number]: number } = {};

    productosOrden.forEach((item) => {
      const subtotalProducto = Number(item.subtotal || 0);
      const ivaProducto = Number(item.producto.iva || 0);
      const ivaProductoMonto = subtotalProducto * (ivaProducto / 100);

      subtotalSinIva += subtotalProducto;
      totalImpuestos += ivaProductoMonto;

      if (ivaProducto > 0) {
        if (!impuestosPorPorcentaje[ivaProducto]) {
          impuestosPorPorcentaje[ivaProducto] = 0;
        }

        impuestosPorPorcentaje[ivaProducto] += ivaProductoMonto;
      }
    });

    const total = subtotalSinIva + totalImpuestos;
    const items = productosOrden.length;

    return {
      subtotal: subtotalSinIva,
      impuestos: totalImpuestos,
      impuestosPorPorcentaje,
      total,
      items,
    };
  }, [productosOrden]);

  const handleView = (cotizacion: Cotizacion) => {
    navigate(`/app/cotizaciones/${cotizacion.id}/ver`);
  };

  const handleCreate = () => {
    navigate("/app/cotizaciones/crear");
  };

  const puedeEditarCotizacion = (estado: Cotizacion["estado"]) => {
    return estado === "Pendiente";
  };

  const puedeAnularCotizacion = (estado: Cotizacion["estado"]) => {
    return estado !== "Aprobada" && estado !== "Anulada";
  };

  const handleEdit = (cotizacion: Cotizacion) => {
    if (!puedeEditarCotizacion(cotizacion.estado)) {
      toast.info("Solo puedes editar cotizaciones pendientes");
      return;
    }

    navigate(`/app/cotizaciones/${cotizacion.id}/editar`);
  };

  const handleAnular = (cotizacion: Cotizacion) => {
    if (cotizacion.estado === "Aprobada") {
      toast.error("No se puede anular una cotización aprobada");
      return;
    }

    if (cotizacion.estado === "Anulada") {
      toast.error("La cotización ya está anulada");
      return;
    }

    navigate(`/app/cotizaciones/${cotizacion.id}/anular`);
  };

  const getSiguienteEstado = (
    estadoActual: Cotizacion["estado"]
  ): Cotizacion["estado"] | null => {
    const flujoEstados: Record<Cotizacion["estado"], Cotizacion["estado"] | null> =
    {
      Pendiente: "Aprobada",
      Aprobada: null,
      Rechazada: null,
      Vencida: null,
      Anulada: null,
    };

    return flujoEstados[estadoActual];
  };

  const handleToggleEstado = (cotizacion: Cotizacion) => {
    if (cotizacion.estado === "Anulada") {
      toast.info("No puedes cambiar el estado de una cotización anulada");
      return;
    }

    const siguienteEstado = getSiguienteEstado(cotizacion.estado);

    if (!siguienteEstado) {
      if (cotizacion.estado === "Aprobada") {
        toast.info("Esta cotización ya está en estado final (Aprobada)");
      } else if (cotizacion.estado === "Rechazada") {
        toast.info("Las cotizaciones rechazadas no pueden cambiar de estado");
      } else if (cotizacion.estado === "Vencida") {
        toast.info("Las cotizaciones vencidas no pueden cambiar de estado");
      }
      return;
    }

    setCotizacionParaCambioEstado(cotizacion);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = async () => {
    if (!cotizacionParaCambioEstado) return;

    if (cotizacionParaCambioEstado.estado === "Anulada") {
      toast.error("No puedes cambiar el estado de una cotización anulada");
      setShowConfirmEstadoModal(false);
      setCotizacionParaCambioEstado(null);
      return;
    }

    const nuevoEstado = getSiguienteEstado(cotizacionParaCambioEstado.estado);
    if (!nuevoEstado) return;

    try {
      const actualizada = await cotizacionesService.updateEstado(
        cotizacionParaCambioEstado.id,
        estadoIds[nuevoEstado]
      );

      setCotizaciones((prev) =>
        prev.map((cotizacion) =>
          cotizacion.id === cotizacionParaCambioEstado.id
            ? actualizada
            : cotizacion
        )
      );

      toast.success(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error("Error cambiando estado de cotización:", error);
      toast.error("No se pudo cambiar el estado de la cotización");
    } finally {
      setShowConfirmEstadoModal(false);
      setCotizacionParaCambioEstado(null);
    }
  };

  const confirmCreate = async () => {
    if (
      !formData.idCliente ||
      !formData.fecha ||
      !formData.fechaVencimiento ||
      !clienteSeleccionadoForm?.idBodega
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto a la cotización");
      return;
    }

    if (!currentUserId) {
      toast.error("No se pudo identificar el usuario actual");
      return;
    }

    try {
      const creada = await cotizacionesService.create({
        fecha: formData.fecha,
        fecha_vencimiento: formData.fechaVencimiento,
        id_cliente: Number(formData.idCliente),
        id_usuario_creador: currentUserId,
        id_estado_cotizacion: estadoIds.Pendiente,
        observaciones: formData.observaciones.trim() || undefined,
        detalle: productosOrden.map((item) => ({
          id_producto: Number(item.producto.id),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio),
          ...(item.idIva ? { id_iva: item.idIva } : {}),
        })),
      });

      setCotizaciones((prev) => [creada, ...prev]);
      resetForm();
      closeToList();
      toast.success("Cotización creada exitosamente");
    } catch (error: any) {
      console.error("Error creando cotización:", error);
      toast.error(
        error?.response?.data?.message || "No se pudo crear la cotización"
      );
    }
  };

  const confirmEdit = async () => {
    if (!cotizacionSeleccionada) return;

    if (!puedeEditarCotizacion(cotizacionSeleccionada.estado)) {
      toast.error("Solo se pueden editar cotizaciones pendientes");
      return;
    }

    if (!formData.idCliente || !formData.fecha || !formData.fechaVencimiento || !clienteSeleccionadoForm?.idBodega) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (productosOrden.length === 0) {
      toast.error("Debes agregar al menos un producto a la cotización");
      return;
    }

    try {
      const actualizada = await cotizacionesService.update(cotizacionSeleccionada.id, {
        fecha: formData.fecha,
        fecha_vencimiento: formData.fechaVencimiento,
        id_cliente: Number(formData.idCliente),
        id_estado_cotizacion: estadoIds[formData.estado],
        observaciones: formData.observaciones.trim() || undefined,
        detalle: productosOrden.map((item) => ({
          id_producto: Number(item.producto.id),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio),
          ...(item.idIva ? { id_iva: item.idIva } : {}),
        })),
      });

      setCotizaciones((prev) =>
        prev.map((cotizacion) =>
          cotizacion.id === actualizada.id ? actualizada : cotizacion
        )
      );

      toast.success("Cotización actualizada exitosamente");
      closeToList();
    } catch (error: any) {
      console.error("Error actualizando cotización:", error);
      toast.error(
        error?.response?.data?.message || "No se pudo actualizar la cotización"
      );
    }
  };

  const confirmAnular = async () => {
    if (!cotizacionSeleccionada) return;

    if (cotizacionSeleccionada.estado === "Aprobada") {
      toast.error("No se puede anular una cotización aprobada");
      return;
    }

    if (cotizacionSeleccionada.estado === "Anulada") {
      toast.error("La cotización ya está anulada");
      return;
    }

    try {
      const actualizada = await cotizacionesService.updateEstado(
        cotizacionSeleccionada.id,
        estadoIds.Anulada
      );

      setCotizaciones((prev) =>
        prev.map((cotizacion) =>
          cotizacion.id === cotizacionSeleccionada.id
            ? actualizada
            : cotizacion
        )
      );

      toast.success("Cotización anulada exitosamente");
      closeToList();
    } catch (error) {
      console.error("Error anulando cotización:", error);
      toast.error("No se pudo anular la cotización");
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

  const formatPdfMoney = (value: unknown) =>
    `COP$${Number(value || 0).toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatPdfDate = (value?: string | null) => {
    return formatDateDisplay(value);
  };

  const safePdfText = (value: unknown, fallback = "-") => {
    const text = String(value ?? "").trim();
    return text || fallback;
  };

  const handleDownloadPDF = async (
    cotizacion: Cotizacion,
    incluirPrecios: boolean = true
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

    const getEstadoStyle = (estado: string) => {
      const normalized = normalizeText(estado);

      if (normalized.includes("aprobad")) {
        return {
          bg: COLORS.successBg,
          text: COLORS.successText,
          label: estado || "Aprobada",
        };
      }

      if (normalized.includes("rechaz") || normalized.includes("anulad")) {
        return {
          bg: COLORS.dangerBg,
          text: COLORS.dangerText,
          label: estado || "Anulada",
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

    const documentoCliente = getDocumentoClienteCotizacion(cotizacion);

    const detallePdf =
      cotizacion.productos?.map((item) => {
        const cantidad = Number(item.cantidad || 0);
        const precio = Number(item.precio || 0);
        const ivaPorcentaje = Number(item.producto.iva || 0);
        const subtotal = cantidad * precio;
        const ivaValor = subtotal * (ivaPorcentaje / 100);

        return {
          producto: item.producto.nombre || "-",
          cantidad,
          precio,
          ivaPorcentaje,
          subtotal,
          ivaValor,
        };
      }) ?? [];

    const subtotalGeneral = detallePdf.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    const ivaGeneral = detallePdf.reduce(
      (acc, item) => acc + item.ivaValor,
      0
    );

    const totalGeneral = subtotalGeneral + ivaGeneral;

    const impuestosPorPorcentajePdf = detallePdf.reduce<Record<number, number>>(
      (acc, item) => {
        const porcentaje = Number(item.ivaPorcentaje || 0);
        const ivaValor = Number(item.ivaValor || 0);

        if (porcentaje > 0) {
          acc[porcentaje] = (acc[porcentaje] || 0) + ivaValor;
        }

        return acc;
      },
      {}
    );

    const ivaEntriesPdf = Object.entries(impuestosPorPorcentajePdf).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

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
    doc.text("COTIZACIÓN", pageWidth / 2, 14.8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("VManage • Gestión empresarial", pageWidth / 2, 21.8, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.text(`Código: ${safePdfText(cotizacion.numeroCotizacion)}`, rightX, 11.5, {
      align: "right",
    });
    doc.text(`Fecha: ${formatPdfDate(cotizacion.fecha)}`, rightX, 17.8, {
      align: "right",
    });
    doc.text(
      `Vencimiento: ${formatPdfDate(cotizacion.fechaVencimiento)}`,
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

    const clienteLines = doc.splitTextToSize(
      safePdfText(cotizacion.cliente),
      68
    );

    const documentoLines = doc.splitTextToSize(
      safePdfText(documentoCliente, "No registrado"),
      68
    );

    doc.text("Cliente:", marginX + 4, 56);
    doc.text(clienteLines, marginX + 28, 56);

    doc.text("Documento / NIT:", marginX + 4, 65);
    doc.text(documentoLines, marginX + 38, 65);

    doc.text("Bodega:", marginX + 4, 74);
    doc.text(safePdfText(cotizacion.bodega), marginX + 28, 74);

    doc.text("Items:", 112, 56);
    doc.text(String(detallePdf.length), 126, 56);

    const estadoStyle = getEstadoStyle(cotizacion.estado);
    doc.setFillColor(estadoStyle.bg[0], estadoStyle.bg[1], estadoStyle.bg[2]);
    doc.roundedRect(112, 61, 44, 9.5, 3, 3, "F");

    doc.setTextColor(estadoStyle.text[0], estadoStyle.text[1], estadoStyle.text[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Estado: ${estadoStyle.label}`, 134, 67.4, {
      align: "center",
    });

    doc.setDrawColor(...COLORS.primaryLine);
    doc.setLineWidth(0.6);
    doc.line(marginX, 90, rightX, 90);

    const tableHead = incluirPrecios
      ? [["Producto", "Cantidad", "IVA", "Precio Unit.", "Subtotal"]]
      : [["Producto", "Cantidad"]];

    const tableBody = incluirPrecios
      ? detallePdf.length
        ? detallePdf.map((item) => [
          item.producto,
          String(item.cantidad),
          `${item.ivaPorcentaje.toFixed(2)}%`,
          formatPdfMoney(item.precio),
          formatPdfMoney(item.subtotal),
        ])
        : [["Sin productos", "-", "-", "-", "-"]]
      : detallePdf.length
        ? detallePdf.map((item) => [item.producto, String(item.cantidad)])
        : [["Sin productos", "-"]];

    autoTable(doc, {
      startY: 96,
      margin: { left: marginX, right: marginX },
      head: tableHead,
      body: tableBody,
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
      columnStyles: incluirPrecios
        ? {
          0: { cellWidth: 74 },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 26, halign: "center" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
        }
        : {
          0: { cellWidth: 140 },
          1: { cellWidth: 30, halign: "center" },
        },
    });

    let currentY = ((doc as any).lastAutoTable?.finalY || 96) + 8;

    const observaciones = safePdfText(cotizacion.observaciones, "");
    const observacionesLines = observaciones
      ? doc.splitTextToSize(observaciones, incluirPrecios ? 95 : 174)
      : [];

    const observacionesHeight = observaciones
      ? Math.max(24, 12 + observacionesLines.length * 4.5)
      : 0;

    const ivaRowsCount = incluirPrecios ? Math.max(ivaEntriesPdf.length, 1) : 0;
    const totalsHeight = incluirPrecios ? 29 + ivaRowsCount * 7 : 0;
    const blockHeight = Math.max(observacionesHeight, totalsHeight || 24);

    if (currentY + blockHeight > pageHeight - 24) {
      doc.addPage();
      currentY = 20;
    }

    if (observaciones) {
      const obsWidth = incluirPrecios ? 108 : pageWidth - marginX * 2;

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

    if (incluirPrecios) {
      const totalsX = observaciones ? 128 : 124;
      const totalsWidth = observaciones ? 68 : 72;

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

      let ivaRowY = currentY + 15;

      if (ivaEntriesPdf.length > 0) {
        ivaEntriesPdf.forEach(([porcentaje, monto]) => {
          doc.text(`Total IVA ${porcentaje}%:`, totalsX + 4, ivaRowY);
          doc.text(
            formatPdfMoney(Number(monto)),
            totalsX + totalsWidth - 4,
            ivaRowY,
            { align: "right" }
          );

          ivaRowY += 7;
        });
      } else {
        doc.text("IVA:", totalsX + 4, ivaRowY);
        doc.text(formatPdfMoney(0), totalsX + totalsWidth - 4, ivaRowY, {
          align: "right",
        });

        ivaRowY += 7;
      }

      const totalBoxY = ivaRowY + 4;

      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(
        totalsX + 2,
        totalBoxY,
        totalsWidth - 4,
        9,
        2,
        2,
        "F"
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);

      doc.text("TOTAL", totalsX + 5, totalBoxY + 6);
      doc.text(
        formatPdfMoney(totalGeneral),
        totalsX + totalsWidth - 4,
        totalBoxY + 6,
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

    const suffix = incluirPrecios ? "con_precios" : "sin_precios";

    doc.save(`Cotizacion_${cotizacion.numeroCotizacion}_${suffix}.pdf`);

    toast.success("PDF descargado exitosamente");
  };

  const openPdfOptionsModal = (cotizacion: Cotizacion) => {
    setCotizacionParaPdf(cotizacion);
    setIsPdfOptionsModalOpen(true);
  };

  const calcularTotalesCotizacion = (cotizacion?: Cotizacion | null) => {
    let subtotal = 0;
    let impuestos = 0;
    const impuestosPorPorcentaje: { [key: number]: number } = {};

    cotizacion?.productos?.forEach((item) => {
      const subtotalProducto = Number(item.subtotal || 0);
      const ivaProducto = Number(item.producto.iva || 0);
      const ivaMonto = subtotalProducto * (ivaProducto / 100);

      subtotal += subtotalProducto;
      impuestos += ivaMonto;

      if (ivaProducto > 0) {
        if (!impuestosPorPorcentaje[ivaProducto]) {
          impuestosPorPorcentaje[ivaProducto] = 0;
        }

        impuestosPorPorcentaje[ivaProducto] += ivaMonto;
      }
    });

    return {
      subtotal,
      impuestos,
      impuestosPorPorcentaje,
      total: subtotal + impuestos,
      items: cotizacion?.productos?.length ?? 0,
    };
  };

  const totalesCotizacionSeleccionada = useMemo(() => {
    return calcularTotalesCotizacion(cotizacionSeleccionada);
  }, [cotizacionSeleccionada]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleActualizarCantidadProducto = (productoId: string, value: string) => {
    const cantidad = Number(value);

    if (Number.isNaN(cantidad) || cantidad < 0) return;

    setProductosOrden((prev) =>
      prev.map((item) => {
        if (item.producto.id !== productoId) return item;

        return {
          ...item,
          cantidad,
          subtotal: cantidad * Number(item.precio || 0),
        };
      })
    );
  };

  const fieldClass =
    "h-11 rounded-lg border-gray-300 bg-white shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20";

  const readonlyFieldClass =
    "h-11 rounded-lg border-gray-200 bg-gray-100 cursor-not-allowed shadow-none";

  const numberFieldClass =
    "sin-flechas h-11 rounded-lg border-gray-300 bg-white text-right shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cotizaciones</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Gestiona las cotizaciones de productos en
          </p>
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            <Building2 size={14} className="mr-1" />
            {selectedBodega}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalCotizaciones}
              </p>
            </div>
            <FileText className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
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

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.aprobadas}
              </p>
            </div>
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              size={20}
            />
            <Input
              placeholder="Buscar por número de cotización, cliente, documento/NIT, estado o número de items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14">#</TableHead>
                <TableHead>N° Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento / NIT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-center">Aprobación / Anulación</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCotizaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron cotizaciones</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentCotizaciones.map((cotizacion, index) => (
                  <TableRow key={cotizacion.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cotizacion.numeroCotizacion}
                    </TableCell>
                    <TableCell>{cotizacion.cliente}</TableCell>

                    <TableCell>
                      {getDocumentoClienteCotizacion(cotizacion)}
                    </TableCell>

                    <TableCell>
                      {formatDateDisplay(cotizacion.fecha)}
                    </TableCell>

                    <TableCell>
                      {formatDateDisplay(cotizacion.fechaVencimiento)}
                    </TableCell>
                    <TableCell className="text-center text-gray-700">
                      {getGestionEstadoCotizacion(cotizacion)}
                    </TableCell>
                    <TableCell className="text-center">{cotizacion.items}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(cotizacion)}
                        disabled={!getSiguienteEstado(cotizacion.estado)}
                        className={`h-7 ${getEstadoCotizacionClass(cotizacion.estado)}`}
                      >
                        {cotizacion.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(cotizacion)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfOptionsModal(cotizacion)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cotizacion)}
                          disabled={!puedeEditarCotizacion(cotizacion.estado)}
                          className={
                            puedeEditarCotizacion(cotizacion.estado)
                              ? "hover:bg-yellow-50"
                              : "cursor-not-allowed hover:bg-transparent"
                          }
                          title={
                            puedeEditarCotizacion(cotizacion.estado)
                              ? "Editar"
                              : "Solo se pueden editar cotizaciones pendientes"
                          }
                        >
                          <Edit
                            size={16}
                            className={
                              puedeEditarCotizacion(cotizacion.estado)
                                ? "text-yellow-600"
                                : "text-gray-400"
                            }
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(cotizacion)}
                          disabled={!puedeAnularCotizacion(cotizacion.estado)}
                          className={
                            puedeAnularCotizacion(cotizacion.estado)
                              ? "hover:bg-red-50"
                              : "cursor-not-allowed opacity-50"
                          }
                          title={
                            cotizacion.estado === "Aprobada"
                              ? "No se puede anular una cotización aprobada"
                              : cotizacion.estado === "Anulada"
                                ? "La cotización ya está anulada"
                                : "Anular"
                          }
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
      </div>


      <div>
        {filteredCotizaciones.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredCotizaciones.length)} de{" "}
              {filteredCotizaciones.length} cotizaciones
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

      <Dialog
        open={isCrear}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[90vh] max-w-7xl overflow-y-auto"
          aria-describedby="create-quote-description"
        >
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Nueva Cotización</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="rounded-lg bg-gray-50 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Información general
                  </h3>
                  <p className="text-sm text-gray-500">
                    Selecciona el cliente, la bodega y revisa las fechas de la cotización
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                    <p className="text-xs font-medium text-blue-700">
                      Fecha de Cotización
                    </p>
                    <p className="text-sm font-semibold text-blue-900">
                      {formatDateDisplay(formData.fecha)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                    <p className="text-xs font-medium text-blue-700">
                      Vencimiento
                    </p>
                    <p className="text-sm font-semibold text-blue-900">
                      {formatDateDisplay(formData.fechaVencimiento)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>

                  <Select
                    value={formData.idCliente}
                    onValueChange={(value: string) => {
                      const clienteSeleccionado = clientesActivos.find(
                        (cliente) => cliente.id === value
                      );

                      setFormData({
                        ...formData,
                        idCliente: value,
                        cliente: clienteSeleccionado?.nombre ?? "",
                        bodega: clienteSeleccionado?.bodega ?? "",
                        idBodega: clienteSeleccionado?.idBodega
                          ? String(clienteSeleccionado.idBodega)
                          : "",
                      });

                      setProductosOrden([]);
                      setSelectedProductoId("");
                      setCantidadProducto("0");
                      setPrecioProducto("");
                      setCostosReferenciaPorProducto({});
                    }}
                  >
                    <SelectTrigger id="cliente" className={fieldClass}>
                      {formData.cliente ? (
                        <span className="truncate">{formData.cliente}</span>
                      ) : (
                        <SelectValue placeholder="Selecciona un cliente" />
                      )}
                    </SelectTrigger>

                    <SelectContent>
                      {clientesActivos.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No hay clientes activos disponibles
                        </div>
                      ) : (
                        clientesActivos.map((cliente) => (
                          <SelectItem
                            key={cliente.id}
                            value={cliente.id}
                            textValue={cliente.nombre}
                          >
                            <div className="flex flex-col">
                              <span>{cliente.nombre}</span>
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

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numeroDocumentoCliente">
                    Documento / NIT del cliente
                  </Label>
                  <Input
                    id="numeroDocumentoCliente"
                    value={getDocumentoClienteTexto(clienteSeleccionadoForm)}
                    readOnly
                    disabled
                    placeholder="Se completa al seleccionar cliente"
                    className={readonlyFieldClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodega">Bodega del cliente</Label>
                  <Input
                    id="bodega"
                    value={formData.bodega || "Selecciona un cliente"}
                    readOnly
                    disabled
                    className={readonlyFieldClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Productos de la Cotización
                  </h3>
                  <p className="text-sm text-gray-500">
                    Selecciona los productos, cantidad y precio de venta
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_160px_220px_180px]">
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
                        {productosActivos.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No hay productos disponibles
                          </div>
                        ) : (
                          productosActivos.map((producto) => (
                            <SelectItem
                              key={producto.id}
                              value={producto.id}
                              textValue={getProductoCotizacionLabel(producto)}
                            >
                              {getProductoCotizacionLabel(producto)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
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
                    <Label htmlFor="precio">Precio Unitario *</Label>
                    <Input
                      id="precio"
                      type="number"
                      value={precioProducto}
                      onChange={(e) => setPrecioProducto(e.target.value)}
                      min={0}
                      step="0"
                      placeholder="0.00"
                      className={`${numberFieldClass} ${precioProductoMenorCostoRef ? "border-red-500 focus-visible:border-red-500" : ""
                        }`}
                    />

                    {costoReferenciaProductoSeleccionado > 0 && (
                      <div className="space-y-1">
                        <p
                          className={`text-xs ${precioProductoMenorCostoRef ? "text-red-600" : "text-amber-600"
                            }`}
                        >
                          {costosReferenciaPorProducto[selectedProductoId]?.origenReferencia ===
                            "OTRA_BODEGA"
                            ? "Costo ref. global:"
                            : "Costo ref.:"}{" "}
                          {formatMoney(costoReferenciaProductoSeleccionado)}
                        </p>

                        {costosReferenciaPorProducto[selectedProductoId]?.origenReferencia ===
                          "OTRA_BODEGA" && (
                            <p className="text-xs text-gray-500">
                              Disponible en:{" "}
                              {costosReferenciaPorProducto[selectedProductoId]
                                ?.nombreBodegaReferencia ?? "otra bodega"}
                            </p>
                          )}
                      </div>
                    )}

                    {selectedProductoId &&
                      formData.idCliente &&
                      costoReferenciaProductoSeleccionado === 0 && (
                        <p className="text-xs text-gray-500">
                          Sin costo ref. disponible para este producto
                        </p>
                      )}
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAgregarProducto}
                      className="h-11 w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Agregar
                    </Button>
                  </div>
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
                        <TableRow key={item.producto.id}>
                          <TableCell className="font-medium text-gray-900">
                            {item.producto.nombre}
                          </TableCell>

                          <TableCell className="text-center">
                            {item.cantidad}
                          </TableCell>

                          <TableCell className="text-right">
                            {formatMoney(item.precio)}
                          </TableCell>

                          <TableCell className="text-center">
                            IVA {formatIvaPorcentaje(item.producto.iva)}%
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            {formatMoney(item.subtotal)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarProducto(item.producto.id)}
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
                        <span className="font-medium">{calcularTotales.items}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">
                          {formatMoney(calcularTotales.subtotal)}
                        </span>
                      </div>

                      {Object.entries(calcularTotales.impuestosPorPorcentaje)
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
                          {formatMoney(calcularTotales.total)}
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
                    Selecciona un producto y agrégalo a la cotización
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900">Observaciones</h3>
                <p className="text-sm text-gray-500">
                  Notas adicionales para esta cotización
                </p>
              </div>

              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Escribe cualquier observación sobre la cotización..."
                rows={3}
                className="resize-none rounded-lg border-gray-300 shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>
          </div>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>

            <Button
              onClick={confirmCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Crear Cotización
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
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[90vh] max-w-7xl overflow-y-auto"
          aria-describedby="edit-quote-description"
        >
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle>Editar Cotización</DialogTitle>
            <DialogDescription id="edit-quote-description">
              Actualiza la información permitida de la cotización
            </DialogDescription>
          </DialogHeader>

          {!cotizacionSeleccionada ? (
            <div className="py-8 text-center text-gray-500">
              Cargando información de la cotización...
            </div>
          ) : !puedeEditarCotizacion(cotizacionSeleccionada.estado) ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">
              Esta cotización no se puede editar porque ya no está en estado pendiente.
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
                      Datos principales de la cotización seleccionada
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                    >
                      {formData.numeroCotizacion || "Sin número"}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={getEstadoCotizacionBadgeClass(formData.estado)}
                    >
                      {formData.estado}
                    </Badge>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Fecha de Cotización
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(formData.fecha)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Vencimiento
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(formData.fechaVencimiento)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="clienteEdit">Cliente</Label>
                    <Input
                      id="clienteEdit"
                      value={formData.cliente}
                      readOnly
                      disabled
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroDocumentoClienteEdit">
                      Documento / NIT
                    </Label>
                    <Input
                      id="numeroDocumentoClienteEdit"
                      value={getDocumentoClienteTexto(clienteSeleccionadoForm)}
                      readOnly
                      disabled
                      placeholder="No registrado"
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodegaEdit">Bodega del cliente</Label>
                    <Input
                      id="bodegaEdit"
                      value={formData.bodega || "Sin bodega"}
                      readOnly
                      disabled
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gestión</Label>
                    <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-700">
                      {getGestionEstadoCotizacion(cotizacionSeleccionada)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Productos de la Cotización
                    </h3>
                    <p className="text-sm text-gray-500">
                      Agrega o ajusta productos, cantidades y precios
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_160px_220px_180px]">
                    <div className="space-y-2">
                      <Label htmlFor="productoEdit">Producto</Label>
                      <Select
                        value={selectedProductoId}
                        onValueChange={setSelectedProductoId}
                      >
                        <SelectTrigger id="productoEdit" className={fieldClass}>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>

                        <SelectContent>
                          {productosActivos.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No hay productos disponibles
                            </div>
                          ) : (
                            productosActivos.map((producto) => (
                              <SelectItem
                                key={producto.id}
                                value={producto.id}
                                textValue={getProductoCotizacionLabel(producto)}
                              >
                                {getProductoCotizacionLabel(producto)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cantidadEdit">Cantidad</Label>
                      <Input
                        id="cantidadEdit"
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
                      <Label htmlFor="precioEdit">Precio Unitario</Label>
                      <Input
                        id="precioEdit"
                        type="number"
                        value={precioProducto}
                        onChange={(e) => setPrecioProducto(e.target.value)}
                        min={0}
                        step="0"
                        placeholder="0.00"
                        className={`${numberFieldClass} ${precioProductoMenorCostoRef
                          ? "border-red-500 focus-visible:border-red-500"
                          : ""
                          }`}
                      />

                      {costoReferenciaProductoSeleccionado > 0 && (
                        <div className="space-y-1">
                          <p
                            className={`text-xs ${precioProductoMenorCostoRef ? "text-red-600" : "text-amber-600"
                              }`}
                          >
                            {costosReferenciaPorProducto[selectedProductoId]?.origenReferencia ===
                              "OTRA_BODEGA"
                              ? "Costo ref. global:"
                              : "Costo ref.:"}{" "}
                            {formatMoney(costoReferenciaProductoSeleccionado)}
                          </p>

                          {costosReferenciaPorProducto[selectedProductoId]?.origenReferencia ===
                            "OTRA_BODEGA" && (
                              <p className="text-xs text-gray-500">
                                Disponible en:{" "}
                                {costosReferenciaPorProducto[selectedProductoId]
                                  ?.nombreBodegaReferencia ?? "otra bodega"}
                              </p>
                            )}
                        </div>
                      )}

                      {selectedProductoId &&
                        formData.idCliente &&
                        costoReferenciaProductoSeleccionado === 0 && (
                          <p className="text-xs text-gray-500">
                            Sin costo ref. disponible para este producto
                          </p>
                        )}
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleAgregarProducto}
                        className="h-11 w-full bg-green-600 hover:bg-green-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Agregar
                      </Button>
                    </div>
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
                          <TableRow key={item.producto.id}>
                            <TableCell className="font-medium text-gray-900">
                              {item.producto.nombre}
                            </TableCell>

                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) =>
                                  handleActualizarCantidadProducto(
                                    item.producto.id,
                                    e.target.value
                                  )
                                }
                                className="mx-auto h-9 w-24 text-center"
                              />
                            </TableCell>

                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                className={`ml-auto h-9 w-36 text-right ${item.costoReferencia &&
                                  Number(item.precio) < Number(item.costoReferencia)
                                  ? "border-red-500"
                                  : ""
                                  }`}
                              />
                            </TableCell>

                            <TableCell className="text-center">
                              IVA {formatIvaPorcentaje(item.producto.iva)}%
                            </TableCell>

                            <TableCell className="text-right font-medium">
                              {formatMoney(item.subtotal)}
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminarProducto(item.producto.id)}
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
                          <span className="font-medium">{calcularTotales.items}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">
                            {formatMoney(calcularTotales.subtotal)}
                          </span>
                        </div>

                        {Object.entries(calcularTotales.impuestosPorPorcentaje)
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
                            {formatMoney(calcularTotales.total)}
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
                      Selecciona un producto y agrégalo a la cotización
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-gray-900">Observaciones</h3>
                  <p className="text-sm text-gray-500">
                    Notas adicionales para esta cotización
                  </p>
                </div>

                <Textarea
                  id="observacionesEdit"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  placeholder="Escribe cualquier observación sobre la cotización..."
                  rows={3}
                  className="resize-none rounded-lg border-gray-300 shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>

            <Button
              onClick={confirmEdit}
              disabled={
                !cotizacionSeleccionada ||
                !puedeEditarCotizacion(cotizacionSeleccionada.estado)
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
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
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[90vh] max-w-7xl overflow-y-auto"
          aria-describedby="view-quote-description"
        >
          <DialogHeader>
            <DialogTitle>Detalles de la Cotización</DialogTitle>
            <DialogDescription id="view-quote-description" className="sr-only">
              Información detallada de la cotización
            </DialogDescription>
          </DialogHeader>

          {cotizacionSeleccionada && (
            <div className="space-y-6">
              <div className="rounded-lg bg-gray-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Información general
                    </h3>
                    <p className="text-sm text-gray-500">
                      Datos principales y gestión de la cotización
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700"
                    >
                      {cotizacionSeleccionada.numeroCotizacion}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={getEstadoCotizacionBadgeClass(cotizacionSeleccionada.estado)}
                    >
                      {cotizacionSeleccionada.estado}
                    </Badge>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Fecha de Cotización
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(cotizacionSeleccionada.fecha)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-right">
                      <p className="text-xs font-medium text-blue-700">
                        Vencimiento
                      </p>
                      <p className="text-sm font-semibold text-blue-900">
                        {formatDateDisplay(cotizacionSeleccionada.fechaVencimiento)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium text-gray-900">
                      {cotizacionSeleccionada.cliente}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Documento / NIT</p>
                    <p className="font-medium text-gray-900">
                      {getDocumentoClienteCotizacion(cotizacionSeleccionada)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Bodega</p>
                    <p className="font-medium text-gray-900">
                      {cotizacionSeleccionada.bodega || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Gestión</p>
                    <p className="font-medium text-gray-900">
                      {getGestionEstadoCotizacion(cotizacionSeleccionada)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">N° de Items</p>
                    <p className="font-medium text-gray-900">
                      {totalesCotizacionSeleccionada.items}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-medium">Productos</h3>

                <div className="overflow-hidden rounded-lg border">
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
                      {cotizacionSeleccionada.productos &&
                        cotizacionSeleccionada.productos.length > 0 ? (
                        cotizacionSeleccionada.productos.map((item, index) => (
                          <TableRow key={`${item.producto.id}-${index}`}>
                            <TableCell className="font-medium">
                              {item.producto.nombre}
                            </TableCell>

                            <TableCell className="text-center">
                              {item.cantidad}
                            </TableCell>

                            <TableCell className="text-center">
                              IVA {formatIvaPorcentaje(item.producto.iva)}%
                            </TableCell>

                            <TableCell className="text-right">
                              {formatMoney(item.precio)}
                            </TableCell>


                            <TableCell className="text-right">
                              {formatMoney(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-gray-500"
                          >
                            No hay productos agregados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="min-w-75 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">N° de Items:</span>
                      <span className="font-medium">
                        {totalesCotizacionSeleccionada.items}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatMoney(totalesCotizacionSeleccionada.subtotal)}
                      </span>
                    </div>

                    {Object.entries(totalesCotizacionSeleccionada.impuestosPorPorcentaje)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([porcentaje, monto]) => (
                        <div key={porcentaje} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Total IVA {porcentaje}%:
                          </span>
                          <span className="font-medium">
                            {formatMoney(monto)}
                          </span>
                        </div>
                      ))}

                    <div className="flex justify-between border-t border-blue-300 pt-2 text-lg">
                      <span className="font-semibold text-gray-700">Total:</span>
                      <span className="font-bold text-blue-600">
                        {formatMoney(totalesCotizacionSeleccionada.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Observaciones</h3>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {cotizacionSeleccionada.observaciones || "Sin observaciones"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 border-t pt-4">
            {cotizacionSeleccionada && (
              <Button
                onClick={() => openPdfOptionsModal(cotizacionSeleccionada)}
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
        open={isAnular}
        onOpenChange={(open) => {
          if (!open) closeToList();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-lg"
          aria-describedby="delete-quote-description"
        >
          <DialogHeader>
            <DialogTitle>Anular Cotización</DialogTitle>
            <DialogDescription id="delete-quote-description">
              ¿Estás seguro de que deseas anular esta cotización?
            </DialogDescription>
          </DialogHeader>

          {cotizacionSeleccionada && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Se anulara la cotización{" "}
                <span className="font-medium text-gray-900">
                  {cotizacionSeleccionada.numeroCotizacion}
                </span>{" "}
                del cliente{" "}
                <span className="font-medium text-gray-900">
                  {cotizacionSeleccionada.cliente}
                </span>
                .
              </p>
              <p className="mt-2 text-sm text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
          )}

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
        onOpenChange={setShowConfirmEstadoModal}
      >
        <DialogContent aria-describedby="confirm-estado-cotizacion-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Cotización</DialogTitle>
            <DialogDescription id="confirm-estado-cotizacion-description">
              ¿Estás seguro de que deseas cambiar el estado de esta cotización?
            </DialogDescription>
          </DialogHeader>

          {cotizacionParaCambioEstado && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cotización:</span>
                <span className="font-medium">
                  {cotizacionParaCambioEstado.numeroCotizacion}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">
                  {cotizacionParaCambioEstado.cliente}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado Actual:</span>
                <span className="font-medium">
                  {cotizacionParaCambioEstado.estado}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nuevo Estado:</span>
                <span className="font-medium">
                  {getSiguienteEstado(cotizacionParaCambioEstado.estado)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmEstadoModal(false);
                setCotizacionParaCambioEstado(null);
              }}
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

      <Dialog
        open={isPdfOptionsModalOpen}
        onOpenChange={setIsPdfOptionsModalOpen}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Descargar PDF</DialogTitle>
            <DialogDescription>
              Selecciona el formato del PDF que deseas descargar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                if (cotizacionParaPdf) void handleDownloadPDF(cotizacionParaPdf, true);
                setIsPdfOptionsModalOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download size={18} />
              Descargar con Precios
            </Button>

            <Button
              onClick={() => {
                if (cotizacionParaPdf) void handleDownloadPDF(cotizacionParaPdf, false);
                setIsPdfOptionsModalOpen(false);
              }}
              variant="outline"
              className="flex w-full items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar sin Precios
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPdfOptionsModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}