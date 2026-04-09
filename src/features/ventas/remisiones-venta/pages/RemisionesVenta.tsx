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
  ShoppingCart,
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
  fecha: string;
  estado: EstadoUi;
  items: number;
  total: number;
  observaciones: string;
  bodega: string;
  estadoId: number;
  detalle: Array<{
    producto: string;
    lote: string;
    cantidad: number;
    precio: number;
    subtotal: number;
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
  cantidad_orden: number;
  cantidad_remitida: number;
  cantidad_pendiente: number;
  lotes: FormLoteState[];
};

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

    return {
      producto: d.existencias?.producto?.nombre_producto ?? "Producto",
      lote: d.existencias?.lote ?? "",
      cantidad,
      precio,
      subtotal: cantidad * precio,
    };
  });

  return {
    id: item.id_remision_venta,
    numeroRemision:
      item.codigo_remision_venta ||
      `RMV-${String(item.id_remision_venta).padStart(4, "0")}`,
    ordenVenta:
      item.orden_venta?.codigo_orden_venta ||
      `OV-${String(item.id_orden_venta).padStart(4, "0")}`,
    cliente: item.cliente?.nombre_cliente ?? "Cliente",
    fecha: normalizeDate(item.fecha_creacion),
    estado: mapEstado(item.estado_remision_venta?.nombre_estado),
    items: detalle.length,
    total: detalle.reduce((acc, d) => acc + d.subtotal, 0),
    observaciones: item.observaciones ?? "",
    bodega: item.orden_venta?.bodega?.nombre_bodega ?? "",
    estadoId:
      item.estado_remision_venta?.id_estado_remision_venta ??
      item.id_estado_remision_venta,
    detalle,
  };
}

const puedeEditarRemision = (estado: EstadoUi) =>
  estado !== "Entregado" && estado !== "Facturada" && estado !== "Anulada";

const puedeAnularRemision = (estado: EstadoUi) =>
  estado !== "Entregado" && estado !== "Anulada" && estado !== "Facturada";

const puedeCambiarEstadoRemision = (estado: EstadoUi) =>
  estado !== "Entregado" && estado !== "Facturada" && estado !== "Anulada";

function getEstadoBadgeClass(estado: EstadoUi) {
  if (estado === "Pendiente") {
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }
  if (estado === "Despachado") {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200";
  }
  if (estado === "Entregado") {
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
  }
  if (estado === "Facturada") {
    return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
  }
  return "bg-red-100 text-red-800 hover:bg-red-200";
}

function getSiguienteEstadoTexto(estado: EstadoUi) {
  if (estado === "Pendiente") return "Cambiar a Despachado";
  if (estado === "Despachado") return "Cambiar a Entregado";
  if (estado === "Entregado") return "Ya está entregada";
  if (estado === "Facturada") return "Ya está facturada";
  return "Ya está anulada";
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

  const [formNumeroRemision, setFormNumeroRemision] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [formOrdenId, setFormOrdenId] = useState("");
  const [formEstadoId, setFormEstadoId] = useState("");
  const [formCliente, setFormCliente] = useState("");
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
  const firmaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const firmaDibujandoRef = useRef(false);

  const remisionSeleccionada = useMemo(() => {
    if (!params.id) return null;
    const id = Number(params.id);
    if (!Number.isFinite(id)) return null;
    return remisiones.find((item) => item.id === id) ?? null;
  }, [params.id, remisiones]);

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
    setCurrentPage(1);
  }, [searchTerm, selectedBodegaId]);

  useEffect(() => {
    if (!isCrear) return;

    setFormNumeroRemision("Se genera automáticamente");
    setFormFecha(new Date().toISOString().split("T")[0]);
    setFormObservaciones("");
    setFormOrdenId("");
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
        setFormEstadoId(String(remision.id_estado_remision_venta));
        setFormCliente(
          remision.cliente?.nombre_cliente ?? orden.cliente?.nombre_cliente ?? ""
        );

        const productos = (orden.detalle ?? []).map((detalle) => {
          const seleccionados =
            cantidadesPorProductoYLote.get(detalle.id_producto) ??
            new Map<number, number>();

          return {
            id_producto: detalle.id_producto,
            nombre: detalle.producto?.nombre_producto ?? "Producto",
            precio_unitario: toNumber(detalle.precio_unitario),
            cantidad_orden: toNumber(detalle.cantidad_orden),
            cantidad_remitida: toNumber(detalle.cantidad_remitida),
            cantidad_pendiente: toNumber(detalle.cantidad_pendiente),
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

  const bodegaFormularioNombre = useMemo(() => {
    return (
      ordenSeleccionada?.bodega?.nombre_bodega ??
      selectedBodegaNombre ??
      "Sin bodega"
    );
  }, [ordenSeleccionada, selectedBodegaNombre]);

  const totalFormulario = useMemo(() => {
    return formProductos.reduce((acc, producto) => {
      const subtotal = producto.lotes.reduce(
        (sum, lote) => sum + toNumber(lote.cantidad) * producto.precio_unitario,
        0
      );
      return acc + subtotal;
    }, 0);
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

    const productos = (orden.detalle ?? []).map((detalle) => ({
      id_producto: detalle.id_producto,
      nombre: detalle.producto?.nombre_producto ?? "Producto",
      precio_unitario: toNumber(detalle.precio_unitario),
      cantidad_orden: toNumber(detalle.cantidad_orden),
      cantidad_remitida: toNumber(detalle.cantidad_remitida),
      cantidad_pendiente: toNumber(detalle.cantidad_pendiente),
      lotes: (detalle.existencias_disponibles ?? []).map((lote) => ({
        id_existencia: lote.id_existencia,
        lote: lote.lote ?? "",
        codigo_barras: lote.codigo_barras ?? "",
        fecha_vencimiento: normalizeDate(lote.fecha_vencimiento),
        cantidad_disponible: toNumber(lote.cantidad_disponible),
        cantidad: "",
      })),
    }));

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
      if (producto.cantidadSolicitada > producto.cantidad_pendiente) {
        toast.error(
          `La cantidad solicitada de ${producto.nombre} supera lo pendiente de la orden`
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
    if (!validarFormulario()) return;

    const payload: CreateRemisionVentaPayload | UpdateRemisionVentaPayload = {
      fecha_creacion: formFecha,
      fecha_vencimiento: null,
      observaciones: formObservaciones || null,
      id_orden_venta: Number(formOrdenId),
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
  };

  const handleConfirmEstado = async () => {
    if (!remisionCambioEstado || !estadoDestino) return;

    if (estadoDestino.nombre === "Entregado" && !firmaValida) {
      toast.error("Debes capturar la firma del cliente antes de continuar");
      return;
    }

    try {
      await remisionesVentaService.updateEstado(remisionCambioEstado.id, {
        id_estado_remision_venta: estadoDestino.id,
        firma_digital: estadoDestino.nombre === "Entregado" ? firmaDigital : undefined,
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
    `$${Number(value || 0).toLocaleString("es-CO", {
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
  doc.roundedRect(marginX, 42, pageWidth - marginX * 2, 34, 3, 3, "F");

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Información general", marginX + 4, 49);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);

  const clienteLines = doc.splitTextToSize(remision.cliente || "-", 70);

  doc.text("Cliente:", marginX + 4, 56);
  doc.text(clienteLines, marginX + 24, 56);

  doc.text("Orden venta:", marginX + 4, 65);
  doc.text(remision.ordenVenta || "-", marginX + 24, 65);

  doc.text("Items:", 112, 56);
  doc.text(String(remision.items || 0), 126, 56);

  const estadoStyle = getEstadoStyle(remision.estado);
  doc.setFillColor(estadoStyle.bg[0], estadoStyle.bg[1], estadoStyle.bg[2]);
  doc.roundedRect(112, 60, 44, 9.5, 3, 3, "F");

  doc.setTextColor(estadoStyle.text[0], estadoStyle.text[1], estadoStyle.text[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Estado: ${estadoStyle.label}`, 134, 66.4, { align: "center" });

  // Línea separadora
  doc.setDrawColor(...COLORS.primaryLine);
  doc.setLineWidth(0.6);
  doc.line(marginX, 82, rightX, 82);

  // Tabla
  autoTable(doc, {
    startY: 88,
    margin: { left: marginX, right: marginX },
    head: [["Producto", "Lote", "Cantidad", "Precio Unit.", "Subtotal"]],
    body: remision.detalle.length
      ? remision.detalle.map((item) => [
          item.producto || "-",
          item.lote || "-",
          String(item.cantidad ?? 0),
          formatMoneyPdf(item.precio || 0),
          formatMoneyPdf(item.subtotal || 0),
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
      0: { cellWidth: 72 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  let currentY = ((doc as any).lastAutoTable?.finalY || 88) + 8;

  const observacionesLines = remision.observaciones
    ? doc.splitTextToSize(remision.observaciones, 95)
    : [];

  const observacionesHeight = remision.observaciones
    ? Math.max(24, 12 + observacionesLines.length * 4.5)
    : 0;

  const totalsHeight = 24;
  const blockHeight = Math.max(observacionesHeight, totalsHeight);

  if (currentY + blockHeight > pageHeight - 24) {
    doc.addPage();
    currentY = 20;
  }

  // Observaciones
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

  // Total
  const totalsX = remision.observaciones ? 128 : 124;
  const totalsWidth = remision.observaciones ? 68 : 72;

  doc.setFillColor(...COLORS.card);
  doc.roundedRect(totalsX, currentY, totalsWidth, totalsHeight, 3, 3, "F");

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(totalsX + 2, currentY + 7, totalsWidth - 4, 9, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("TOTAL", totalsX + 5, currentY + 13.5);
  doc.text(
    formatMoneyPdf(remision.total || 0),
    totalsX + totalsWidth - 4,
    currentY + 13.5,
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
                <TableHead>Orden de Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                    <TableCell>{remision.fecha}</TableCell>
                    <TableCell>{remision.items}</TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(remision)}
                        disabled={!puedeCambiarEstadoRemision(remision.estado)}
                        className={`h-8 rounded-full px-3 text-xs font-medium ${getEstadoBadgeClass(
                          remision.estado
                        )} ${!puedeCambiarEstadoRemision(remision.estado)
                          ? "cursor-not-allowed opacity-70"
                          : ""
                          }`}
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
                              ? "hover:bg-amber-50"
                              : "cursor-not-allowed opacity-50"
                          }
                          title={
                            remision.estado === "Entregado"
                              ? "No se puede editar una remisión entregada"
                              : remision.estado === "Facturada"
                                ? "No se puede editar una remisión facturada"
                                : remision.estado === "Anulada"
                                  ? "No se puede editar una remisión anulada"
                                  : "Editar"
                          }
                        >
                          <Edit size={16} className="text-amber-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnular(remision)}
                          disabled={!puedeAnularRemision(remision.estado)}
                          className={
                            puedeAnularRemision(remision.estado)
                              ? "hover:bg-red-50"
                              : "cursor-not-allowed opacity-50"
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

      <Dialog open={isFormularioAbierto} onOpenChange={(open) => !open && closeToList()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditar ? "Editar Remisión de Venta" : "Nueva Remisión de Venta"}
            </DialogTitle>
            <DialogDescription>
              {isEditar
                ? "Edita la remisión manteniéndola ligada a una orden de venta aprobada."
                : "La remisión solo puede crearse desde una orden de venta aprobada."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Información general
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>N° Remisión</Label>
                  <Input value={formNumeroRemision} disabled />
                </div>

                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Bodega</Label>
                  <Input value={bodegaFormularioNombre} disabled />
                </div>

                <div>
                  <Label>Estado inicial</Label>
                  <Input
                    value={
                      estados.find(
                        (estado) =>
                          String(estado.id_estado_remision_venta) === formEstadoId
                      )?.nombre_estado ?? "Pendiente"
                    }
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Orden asociada
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Orden de Venta Aprobada</Label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white"
                    value={formOrdenId}
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
                        {orden.cantidad_pendiente_total}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Cliente</Label>
                  <Input value={formCliente} disabled />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Observaciones y resumen
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                <div>
                  <Label>Observaciones</Label>
                  <textarea
                    className="w-full min-h-25 rounded-md border border-gray-300 px-3 py-2"
                    value={formObservaciones}
                    onChange={(e) => setFormObservaciones(e.target.value)}
                    placeholder="Observaciones de la remisión"
                  />
                </div>

                <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Items seleccionados</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {cantidadTotalItemsFormulario}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total remisión</p>
                    <p className="text-xl font-semibold text-blue-700">
                      $
                      {totalFormulario.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Productos y lotes a remitir
                </h3>
              </div>

              {ordenSeleccionada ? (
                <div className="space-y-4">
                  {formProductos.map((producto) => (
                    <div
                      key={producto.id_producto}
                      className="border rounded-xl p-4 space-y-4 bg-white"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {producto.nombre}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                              Orden: {producto.cantidad_orden}
                            </span>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                              Remitido: {producto.cantidad_remitida}
                            </span>
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                              Pendiente: {producto.cantidad_pendiente}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                          Precio unitario: $
                          {producto.precio_unitario.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>

                      {producto.lotes.length === 0 ? (
                        <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
                          Este producto no tiene existencias disponibles en la bodega
                          de la orden.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead>Lote</TableHead>
                                <TableHead>Cód. barras</TableHead>
                                <TableHead>Vence</TableHead>
                                <TableHead>Disponible</TableHead>
                                <TableHead>Cantidad a remitir</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {producto.lotes.map((lote) => (
                                <TableRow key={lote.id_existencia}>
                                  <TableCell>{lote.lote || "-"}</TableCell>
                                  <TableCell>{lote.codigo_barras || "-"}</TableCell>
                                  <TableCell>{lote.fecha_vencimiento || "-"}</TableCell>
                                  <TableCell>{lote.cantidad_disponible}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={lote.cantidad}
                                      onChange={(e) =>
                                        handleCantidadLoteChange(
                                          producto.id_producto,
                                          lote.id_existencia,
                                          e.target.value
                                        )
                                      }
                                      placeholder="0"
                                      className="max-w-37.5"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
                  Selecciona una orden de venta aprobada para cargar sus productos
                  pendientes por remitir.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeToList}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditar ? "Guardar Cambios" : "Guardar Remisión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVer} onOpenChange={(open) => !open && closeToList()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Remisión</DialogTitle>
          </DialogHeader>

          {remisionSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>N° Remisión</Label>
                  <Input value={remisionSeleccionada.numeroRemision} disabled />
                </div>
                <div>
                  <Label>Orden de Venta</Label>
                  <Input value={remisionSeleccionada.ordenVenta} disabled />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input value={remisionSeleccionada.cliente} disabled />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={remisionSeleccionada.estado} disabled />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remisionSeleccionada.detalle.map((item, index) => (
                      <TableRow key={`${item.producto}-${index}`}>
                        <TableCell>{item.producto}</TableCell>
                        <TableCell>{item.lote || "-"}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>
                          $
                          {item.precio.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          $
                          {item.subtotal.toLocaleString("es-CO", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {remisionSeleccionada.observaciones && (
                <div>
                  <Label>Observaciones</Label>
                  <textarea
                    className="w-full min-h-22.5 rounded-md border border-gray-300 px-3 py-2"
                    value={remisionSeleccionada.observaciones}
                    disabled
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Total: $
                  {remisionSeleccionada.total.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                  })}
                </div>

                <Button
                  onClick={() => void handleDescargarPDF(remisionSeleccionada)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download size={16} className="mr-2" />
                  Descargar PDF
                </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Firma del cliente</DialogTitle>
            <DialogDescription>
              Para cambiar la remisión a <strong>Entregado</strong>, el cliente
              debe firmar en el recuadro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
              <canvas
                ref={firmaCanvasRef}
                className="h-56 w-full rounded-lg border border-gray-200 bg-white touch-none"
                onMouseDown={iniciarFirma}
                onMouseMove={moverFirma}
                onMouseUp={finalizarFirma}
                onMouseLeave={finalizarFirma}
                onTouchStart={iniciarFirma}
                onTouchMove={moverFirma}
                onTouchEnd={finalizarFirma}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                El botón de aceptar solo se habilita cuando la firma ya fue
                dibujada.
              </p>

              <Button variant="outline" onClick={limpiarFirma}>
                Limpiar firma
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCambioEstado}>
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado} disabled={!firmaValida}>
              <CheckCircle size={16} className="mr-2" />
              Aceptar
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