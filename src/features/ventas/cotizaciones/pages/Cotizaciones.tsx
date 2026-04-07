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
import type { Cliente } from "../../../../data/clientes";
import { type Producto } from "../../../../data/productos";
import type { AppOutletContext } from "../../../../layouts/MainLayout";
import { clientesService } from "@/features/ventas/clientes/services/clientes.service";
import { mapClienteApiToUi } from "@/features/ventas/clientes/services/clientes.mapper";
import { getProductosVista } from "@/features/existencias/productos/services/productos.services";
import {
  cotizacionesService,
  ESTADO_COTIZACION_FALLBACK,
  type CotizacionUI as Cotizacion,
} from "@/features/ventas/cotizaciones/services/cotizaciones.service";

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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productosCatalogo, setProductosCatalogo] = useState<Producto[]>([]);

  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [cotizacionParaPdf, setCotizacionParaPdf] =
    useState<Cotizacion | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    if (isEditar && cotizacionSeleccionada.estado === "Anulada") {
      toast.error("No se puede editar una cotización anulada");
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
  const [productosOrden, setProductosOrden] = useState<
    Array<{
      producto: Producto;
      cantidad: number;
      precio: number;
      subtotal: number;
      idIva?: number;
    }>
  >([]);

  const productosActivos = useMemo(() => {
    return productosCatalogo.filter((p) => p.estado);
  }, [productosCatalogo]);

  const generarNumeroCotizacion = () => {
    const maxNum = cotizaciones.reduce((max, c) => {
      const match = /^COT-(\d+)$/.exec(c.numeroCotizacion);
      const num = match ? Number(match[1]) : 0;
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `COT-${String(maxNum + 1).padStart(4, "0")}`;
  };

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
        clientesService.getAll({ incluirInactivos: true }),
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
            bodega: "",
            tipoCliente: cliente.tipoCliente,
            fechaRegistro: "",
          }))
        );
      } else {
        console.error(
          "Error cargando clientes para cotizaciones:",
          clientesResult.reason
        );
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
              numeroLote: lote.lote,
              cantidadDisponible: Number(lote.cantidad),
              fechaVencimiento: lote.fecha_vencimiento ?? "",
              bodega: lote.nombre_bodega,
            })),
          }))
        );
      } else {
        console.error(
          "Error cargando productos para cotizaciones:",
          productosResult.reason
        );
      }
    };

    void cargarCatalogos();
  }, [selectedBodegaId, selectedBodegaNombre]);

  const getFechaActual = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getFechaVencimiento = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 10);
    return fecha.toISOString().split("T")[0];
  };

  const clientesActivos = useMemo(() => {
    return clientes.filter((c) => c.estado === "Activo");
  }, [clientes]);

  const filteredCotizaciones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return cotizaciones;

    return cotizaciones.filter((cotizacion) => {
      return (
        cotizacion.numeroCotizacion.toLowerCase().includes(term) ||
        cotizacion.cliente.toLowerCase().includes(term) ||
        cotizacion.estado.toLowerCase().includes(term) ||
        cotizacion.items.toString().includes(term)
      );
    });
  }, [cotizaciones, searchTerm]);

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

    const bodegaInicial =
      selectedBodega !== "Todas las bodegas"
        ? bodegasDisponibles.find((bodega) => bodega.id === selectedBodegaId)
          ?.nombre ?? ""
        : "";

    const idBodegaInicial =
      selectedBodega !== "Todas las bodegas" && selectedBodegaId
        ? String(selectedBodegaId)
        : "";

    setFormData({
      numeroCotizacion: generarNumeroCotizacion(),
      cliente: "",
      idCliente: "",
      fecha: getFechaActual(),
      fechaVencimiento: getFechaVencimiento(),
      estado: "Pendiente",
      items: 0,
      subtotal: 0,
      impuestos: 0,
      observaciones: "",
      bodega: bodegaInicial,
      idBodega: idBodegaInicial,
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

    setProductosOrden(cotizacionSeleccionada.productos || []);
    setSelectedProductoId("");
    setCantidadProducto("0");
    setPrecioProducto("");
  }, [isEditar, cotizacionSeleccionada]);

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
      const ivaProducto = item.producto.iva || 0;
      const subtotalProducto = item.subtotal / (1 + ivaProducto / 100);
      const ivaProductoMonto = item.subtotal - subtotalProducto;

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
    return estado !== "Anulada";
  };

  const puedeAnularCotizacion = (estado: Cotizacion["estado"]) => {
    return estado !== "Aprobada" && estado !== "Anulada";
  };

  const handleEdit = (cotizacion: Cotizacion) => {
    if (!puedeEditarCotizacion(cotizacion.estado)) {
      toast.error("No se puede editar una cotización anulada");
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
      !formData.numeroCotizacion ||
      !formData.idCliente ||
      !formData.fecha ||
      !formData.fechaVencimiento ||
      !formData.idBodega
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
        id_bodega: Number(formData.idBodega),
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
    toast.info(
      "Editar cotización todavía no está disponible porque tu backend actual no tiene PATCH /cotizaciones/:id"
    );
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

  const handleDownloadPDF = (
    cotizacion: Cotizacion,
    incluirPrecios: boolean = true
  ) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`N° Cotización: ${cotizacion.numeroCotizacion}`, 20, 40);
    doc.text(`Cliente: ${cotizacion.cliente}`, 20, 46);
    doc.text(`Bodega: ${cotizacion.bodega}`, 20, 52);

    doc.text(
      `Fecha: ${new Date(cotizacion.fecha).toLocaleDateString("es-CO")}`,
      120,
      40
    );
    doc.text(
      `Fecha Vencimiento: ${new Date(
        cotizacion.fechaVencimiento
      ).toLocaleDateString("es-CO")}`,
      120,
      46
    );
    doc.text(`Estado: ${cotizacion.estado}`, 120, 52);

    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    if (cotizacion.productos && cotizacion.productos.length > 0) {
      let tableData;
      let tableHeaders;
      let columnStyles;

      if (incluirPrecios) {
        tableData = cotizacion.productos.map((item) => [
          item.producto.nombre,
          item.cantidad.toString(),
          `$${item.precio.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
          })}`,
          `${item.producto.iva}%`,
          `$${item.subtotal.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
          })}`,
        ]);
        tableHeaders = [
          ["Producto", "Cantidad", "Precio Unit.", "IVA%", "Subtotal"],
        ];
        columnStyles = {
          0: { cellWidth: 65 },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 35, halign: "right" },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 35, halign: "right" },
        };
      } else {
        tableData = cotizacion.productos.map((item) => [
          item.producto.nombre,
          item.cantidad.toString(),
        ]);
        tableHeaders = [["Producto", "Cantidad"]];
        columnStyles = {
          0: { cellWidth: 130 },
          1: { cellWidth: 30, halign: "center" },
        };
      }

      autoTable(doc, {
        startY: 65,
        head: tableHeaders,
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: columnStyles as any,
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    let totalesY = finalY + 10;

    if (incluirPrecios) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Subtotal:", 130, totalesY);
      doc.text(
        `$${cotizacion.subtotal.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
        })}`,
        190,
        totalesY,
        { align: "right" }
      );

      const impuestosPorPorcentaje = calcularImpuestosPorPorcentaje(cotizacion);
      const porcentajesOrdenados = Object.entries(impuestosPorPorcentaje).sort(
        ([a], [b]) => Number(a) - Number(b)
      );

      totalesY += 6;
      porcentajesOrdenados.forEach(([porcentaje, monto]) => {
        doc.text(`Total IVA ${porcentaje}%:`, 130, totalesY);
        doc.text(
          `$${monto.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`,
          190,
          totalesY,
          { align: "right" }
        );
        totalesY += 6;
      });

      doc.setLineWidth(0.3);
      doc.line(130, totalesY - 2, 190, totalesY - 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Total:", 130, totalesY + 4);
      doc.text(
        `$${cotizacion.total.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
        })}`,
        190,
        totalesY + 4,
        { align: "right" }
      );
    }

    if (cotizacion.observaciones) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const obsY = incluirPrecios ? totalesY + 20 : totalesY + 10;
      doc.text("Observaciones:", 20, obsY);
      const splitObservaciones = doc.splitTextToSize(
        cotizacion.observaciones,
        170
      );
      doc.text(splitObservaciones, 20, obsY + 6);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Generado el ${new Date().toLocaleString("es-CO")}`,
      105,
      pageHeight - 10,
      {
        align: "center",
      }
    );

    const suffix = incluirPrecios ? "" : "_SinPrecios";
    doc.save(`Cotizacion_${cotizacion.numeroCotizacion}${suffix}.pdf`);
    toast.success("PDF descargado exitosamente");
  };

  const openPdfOptionsModal = (cotizacion: Cotizacion) => {
    setCotizacionParaPdf(cotizacion);
    setIsPdfOptionsModalOpen(true);
  };

  const calcularImpuestosPorPorcentaje = (cotizacion: Cotizacion) => {
    const impuestosPorPorcentaje: { [key: number]: number } = {};

    if (cotizacion.productos) {
      cotizacion.productos.forEach((item) => {
        const ivaProducto = item.producto.iva || 0;
        if (ivaProducto > 0) {
          const subtotalProducto = item.subtotal / (1 + ivaProducto / 100);
          const ivaProductoMonto = item.subtotal - subtotalProducto;

          if (!impuestosPorPorcentaje[ivaProducto]) {
            impuestosPorPorcentaje[ivaProducto] = 0;
          }
          impuestosPorPorcentaje[ivaProducto] += ivaProductoMonto;
        }
      });
    }

    return impuestosPorPorcentaje;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Cotizaciones</h2>
        <p className="text-gray-600 mt-1">
          Gestiona las cotizaciones de productos
        </p>
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
            size={20}
          />
          <Input
            placeholder="Buscar por número de cotización, cliente, estado o número de items..."
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

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCotizaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-500">
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
                      {new Date(cotizacion.fecha).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell>
                      {new Date(cotizacion.fechaVencimiento).toLocaleDateString(
                        "es-CO"
                      )}
                    </TableCell>
                    <TableCell>{cotizacion.items}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(cotizacion)}
                        disabled={cotizacion.estado === "Anulada"}
                        className={`h-7 ${cotizacion.estado === "Aprobada"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : cotizacion.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : cotizacion.estado === "Rechazada"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : cotizacion.estado === "Anulada"
                                ? "cursor-not-allowed bg-gray-100 text-gray-800 opacity-60 hover:bg-gray-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
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
                              : "cursor-not-allowed opacity-50"
                          }
                          title={
                            cotizacion.estado === "Anulada"
                              ? "No se puede editar una cotización anulada"
                              : "Editar"
                          }
                        >
                          <Edit size={16} className="text-yellow-600" />
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
          <DialogHeader>
            <DialogTitle>Nueva Cotización</DialogTitle>
            <DialogDescription id="create-quote-description">
              Completa la información para crear una nueva cotización
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroCotizacion">Número de Cotización *</Label>
                <Input
                  id="numeroCotizacion"
                  value={formData.numeroCotizacion}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  disabled
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <div className="flex gap-2">
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
                    });
                  }}
                >
                  <SelectTrigger id="cliente" className="flex-1">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>

                  <SelectContent>
                    {clientesActivos.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-gray-500">
                        No hay clientes activos disponibles
                      </div>
                    ) : (
                      clientesActivos.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/app/clientes/crear")}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Plus size={16} className="mr-1" />
                  Nuevo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={formData.fechaVencimiento}
                  disabled
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="bodega">Bodega *</Label>
                <Select
                  value={formData.idBodega}
                  onValueChange={(value: string) => {
                    const bodegaSeleccionada = bodegasDisponibles.find(
                      (bodega) => String(bodega.id) === value
                    );

                    setFormData({
                      ...formData,
                      idBodega: value,
                      bodega: bodegaSeleccionada?.nombre ?? "",
                    });
                  }}
                >
                  <SelectTrigger id="bodega">
                    <SelectValue placeholder="Selecciona una bodega" />
                  </SelectTrigger>

                  <SelectContent>
                    {bodegasDisponibles.map((bodega) => (
                      <SelectItem key={bodega.id} value={String(bodega.id)}>
                        {bodega.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Cotización</Label>

              <div className="mt-3 grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Label htmlFor="producto">Producto</Label>
                  <Select
                    value={selectedProductoId}
                    onValueChange={setSelectedProductoId}
                  >
                    <SelectTrigger id="producto">
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>

                    <SelectContent>
                      {productosActivos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
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
                    onChange={(e) => {
                      setCantidadProducto(e.target.value);
                    }}
                    className={
                      cantidadProducto === "0" ? "text-gray-400" : "text-gray-900"
                    }
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor="precio">Precio Unit.</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    min="0"
                    step="0"
                    placeholder="0.00"
                    className="sin-flechas w-full"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {productosOrden.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-center">IVA%</TableHead>
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
                          <TableCell className="text-right">
                            ${item.precio.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50">
                              {item.producto.iva}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.subtotal.toLocaleString()}
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

              <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    $
                    {calcularTotales.subtotal.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* {Object.keys(calcularTotales.impuestosPorPorcentaje).length > 0 && (
                  <div className="space-y-1 border-t pt-2">
                    {Object.entries(calcularTotales.impuestosPorPorcentaje)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([porcentaje, monto]) => (
                        <div
                          key={porcentaje}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            Total IVA {porcentaje}%:
                          </span>
                          <span className="font-medium">
                            $
                            {monto.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                )} */}

                {(() => {
                  const ivaEntries = Object.entries(calcularTotales.impuestosPorPorcentaje).sort(
                    ([a], [b]) => Number(a) - Number(b)
                  );

                  if (!ivaEntries.length) return null;

                  return (
                    <div className="space-y-2 border-t pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal IVA:</span>
                        <span className="font-medium text-gray-700">
                          {ivaEntries.map(([porcentaje]) => `${porcentaje}%`).join(", ")}
                        </span>
                      </div>

                      {ivaEntries.map(([porcentaje, monto]) => (
                        <div key={porcentaje} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Subtotal IVA {porcentaje}%:
                          </span>
                          <span className="font-medium">
                            $
                            {monto.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-between border-t pt-2 text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    $
                    {calcularTotales.total.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
                placeholder="Escribe cualquier observación sobre la cotización..."
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
          <DialogHeader>
            <DialogTitle>Editar Cotización</DialogTitle>
            <DialogDescription id="edit-quote-description">
              Actualiza la información de la cotización
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroCotizacionEdit">
                  Número de Cotización
                </Label>
                <Input
                  id="numeroCotizacionEdit"
                  value={formData.numeroCotizacion}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="estadoEdit">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, estado: value })
                  }
                >
                  <SelectTrigger id="estadoEdit">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobada">Aprobada</SelectItem>
                    <SelectItem value="Rechazada">Rechazada</SelectItem>
                    <SelectItem value="Vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="clienteEdit">Cliente *</Label>
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
                  });
                }}
              >
                <SelectTrigger id="clienteEdit">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>

                <SelectContent>
                  {clientesActivos.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaEdit">Fecha *</Label>
                <Input
                  id="fechaEdit"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bodegaEdit">Bodega *</Label>
                <Select
                  value={formData.idBodega}
                  onValueChange={(value: string) => {
                    const bodegaSeleccionada = bodegasDisponibles.find(
                      (bodega) => String(bodega.id) === value
                    );

                    setFormData({
                      ...formData,
                      idBodega: value,
                      bodega: bodegaSeleccionada?.nombre ?? "",
                    });
                  }}
                >
                  <SelectTrigger id="bodegaEdit">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {bodegasDisponibles.map((bodega) => (
                      <SelectItem key={bodega.id} value={String(bodega.id)}>
                        {bodega.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Cotización</Label>

              <div className="mt-3 grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Label htmlFor="productoEdit">Producto</Label>
                  <Select
                    value={selectedProductoId}
                    onValueChange={setSelectedProductoId}
                  >
                    <SelectTrigger id="productoEdit">
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>

                    <SelectContent>
                      {productosActivos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
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
                    onChange={(e) => {
                      setCantidadProducto(e.target.value);
                    }}
                    className={
                      cantidadProducto === "0" ? "text-gray-400" : "text-gray-900"
                    }
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor="precioEdit">Precio Unit.</Label>
                  <Input
                    id="precioEdit"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    min="0"
                    step="0"
                    placeholder="0.00"
                    className="sin-flechas w-full"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {productosOrden.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-center">IVA%</TableHead>
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
                          <TableCell className="text-right">
                            ${item.precio.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50">
                              {item.producto.iva}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.subtotal.toLocaleString()}
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

              <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    $
                    {calcularTotales.subtotal.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {Object.keys(calcularTotales.impuestosPorPorcentaje).length > 0 && (
                  <div className="space-y-1 border-t pt-2">
                    {Object.entries(calcularTotales.impuestosPorPorcentaje)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([porcentaje, monto]) => (
                        <div
                          key={porcentaje}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            Total IVA {porcentaje}%:
                          </span>
                          <span className="font-medium">
                            $
                            {monto.toLocaleString("es-CO", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    $
                    {calcularTotales.total.toLocaleString("es-CO", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observacionesEdit">Observaciones</Label>
              <Textarea
                id="observacionesEdit"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Escribe cualquier observación sobre la cotización..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={confirmEdit}
              className="bg-blue-600 hover:bg-blue-700"
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
            <DialogDescription
              id="view-quote-description"
              className="sr-only"
            >
              Información detallada de la cotización
            </DialogDescription>
          </DialogHeader>

          {cotizacionSeleccionada && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Cotización</p>
                  <p className="font-medium text-blue-600">
                    {cotizacionSeleccionada.numeroCotizacion}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <div className="mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEstado(cotizacionSeleccionada)}
                      className={`h-7 px-3 ${cotizacionSeleccionada.estado === "Aprobada"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : cotizacionSeleccionada.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : cotizacionSeleccionada.estado === "Rechazada"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                    >
                      {cotizacionSeleccionada.estado}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{cotizacionSeleccionada.cliente}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-medium">{cotizacionSeleccionada.bodega}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium">
                    {new Date(cotizacionSeleccionada.fecha).toLocaleDateString(
                      "es-CO"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-medium">
                    {new Date(
                      cotizacionSeleccionada.fechaVencimiento
                    ).toLocaleDateString("es-CO")}
                  </p>
                </div>
              </div>

              {cotizacionSeleccionada.productos &&
                cotizacionSeleccionada.productos.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-medium">Productos</h3>
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">
                              Cantidad
                            </TableHead>
                            <TableHead className="text-right">
                              Precio Unit.
                            </TableHead>
                            <TableHead className="text-center">IVA%</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {cotizacionSeleccionada.productos.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {item.producto.nombre}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.cantidad}
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.precio.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-blue-50">
                                  {item.producto.iva}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.subtotal.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              <div className="flex justify-end">
                <div className="min-w-[300px] rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        $
                        {cotizacionSeleccionada.subtotal.toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {(() => {
                      const impuestosPorPorcentaje =
                        calcularImpuestosPorPorcentaje(cotizacionSeleccionada);

                      return Object.keys(impuestosPorPorcentaje).length > 0 ? (
                        <div className="space-y-1 border-t border-blue-200 pt-2">
                          {Object.entries(impuestosPorPorcentaje)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([porcentaje, monto]) => (
                              <div
                                key={porcentaje}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  Total IVA {porcentaje}%:
                                </span>
                                <span className="font-medium">
                                  $
                                  {monto.toLocaleString("es-CO", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : null;
                    })()}

                    <div className="flex justify-between border-t border-blue-300 pt-2 text-lg">
                      <span className="font-semibold text-gray-700">Total:</span>
                      <span className="font-bold text-blue-600">
                        $
                        {cotizacionSeleccionada.total.toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {cotizacionSeleccionada.observaciones && (
                <div>
                  <h3 className="mb-2 text-lg font-medium">Observaciones</h3>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-gray-700">
                      {cotizacionSeleccionada.observaciones}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                if (cotizacionParaPdf) handleDownloadPDF(cotizacionParaPdf, true);
                setIsPdfOptionsModalOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download size={18} />
              Descargar con Precios
            </Button>

            <Button
              onClick={() => {
                if (cotizacionParaPdf)
                  handleDownloadPDF(cotizacionParaPdf, false);
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