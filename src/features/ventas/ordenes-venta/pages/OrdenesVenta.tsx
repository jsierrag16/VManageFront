import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
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

function getProductoNombre(producto?: CatalogoProducto) {
  return producto?.nombre_producto || producto?.nombre || "Producto";
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

function getPrecioProductoCatalogo(producto?: CatalogoProducto) {
  return Number(producto?.precio_venta ?? producto?.precio ?? 0);
}

function getPrecioDetalleCotizacion(item: DetalleCotizacionApi) {
  return Number(item.precio_unitario ?? item.precio ?? item.valor_unitario ?? 0);
}

function mapDetalleOrdenToForm(detalles?: DetalleOrdenVentaApi[]): ProductoForm[] {
  return (detalles || []).map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precio_unitario || 0);

    return {
      id_producto: Number(item.id_producto),
      nombre: getProductoNombre(item.producto),
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
    };
  });
}

function mapDetalleCotizacionToForm(detalles?: DetalleCotizacionApi[]): ProductoForm[] {
  return (detalles || []).map((item) => {
    const cantidad = Number(item.cantidad || 0);
    const precio = getPrecioDetalleCotizacion(item);

    return {
      id_producto: Number(item.id_producto),
      nombre: getProductoNombre(item.producto),
      cantidad,
      precio_unitario: precio,
      subtotal: cantidad * precio,
    };
  });
}

function getTotalOrden(orden: OrdenVentaApi) {
  return (orden.detalle_orden_venta || []).reduce((acc, item) => {
    return acc + Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
  }, 0);
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

  let siguienteEstadoId: number | undefined;

  if (estadoActual.includes("pendiente")) {
    siguienteEstadoId = findEstadoIdByNames(estados, [
      "procesando",
      "aprobada",
      "aprobado",
    ]);
  } else if (
    estadoActual.includes("procesando") ||
    estadoActual.includes("aprobada") ||
    estadoActual.includes("aprobado")
  ) {
    siguienteEstadoId = findEstadoIdByNames(estados, ["enviada"]);
  } else if (estadoActual.includes("enviada")) {
    siguienteEstadoId = findEstadoIdByNames(estados, ["entregada", "aplicada"]);
  } else if (
    estadoActual.includes("entregada") ||
    estadoActual.includes("aplicada")
  ) {
    return { final: true as const };
  }

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

export default function OrdenesVenta() {
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

  const [currentPage, setCurrentPage] = useState(1);

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);

  const [selectedOrden, setSelectedOrden] = useState<OrdenVentaApi | null>(null);
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<string>("sin-cotizacion");
  const [selectedProductoId, setSelectedProductoId] = useState<string>("");
  const [cantidadProducto, setCantidadProducto] = useState<string>("");
  const [precioProducto, setPrecioProducto] = useState<string>("");

  const [isConfirmEstadoModalOpen, setIsConfirmEstadoModalOpen] = useState(false);
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

  const estadoPendienteId = useMemo(() => {
    return (
      findEstadoIdByNames(estados, ["pendiente"]) ||
      estados[0]?.id_estado_orden_venta ||
      0
    );
  }, [estados]);

  const estadoCanceladoId = useMemo(() => {
    return (
      findEstadoIdByNames(estados, ["cancelada", "cancelado", "anulada", "anulado"]) ||
      0
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
    cargarModulo();
  }, [selectedBodegaId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedProductoId) {
      setPrecioProducto("");
      return;
    }

    const producto = productos.find(
      (item) => Number(item.id_producto) === Number(selectedProductoId)
    );

    const precio = getPrecioProductoCatalogo(producto);
    setPrecioProducto(precio > 0 ? String(precio) : "");
  }, [selectedProductoId, productos]);

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
      const codigo = normalizarTexto(orden.codigo_orden_venta || String(orden.id_orden_venta));
      const cliente = normalizarTexto(getClienteNombre(orden.cliente));
      const estado = normalizarTexto(getEstadoNombre(orden.estado_orden_venta));
      const bodega = normalizarTexto(getBodegaNombre(orden.bodega));
      const items = String(getItemsOrden(orden));

      return (
        !term ||
        codigo.includes(term) ||
        cliente.includes(term) ||
        estado.includes(term) ||
        bodega.includes(term) ||
        items.includes(term)
      );
    });
  }, [ordenes, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrdenes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrdenes = filteredOrdenes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const totalOrdenes = ordenes.length;

    const pendientes = ordenes.filter((orden) =>
      normalizarTexto(getEstadoNombre(orden.estado_orden_venta)).includes("pendiente")
    ).length;

    const procesando = ordenes.filter((orden) => {
      const key = normalizarTexto(getEstadoNombre(orden.estado_orden_venta));
      return (
        key.includes("procesando") ||
        key.includes("aprobada") ||
        key.includes("aprobado")
      );
    }).length;

    return { totalOrdenes, pendientes, procesando };
  }, [ordenes]);

  const cotizacionesDisponibles = useMemo(() => {
    return cotizaciones.filter((cotizacion) => {
      const matchCliente =
        !formData.id_cliente ||
        Number(cotizacion.id_cliente) === Number(formData.id_cliente);

      const matchBodega =
        !formData.id_bodega ||
        Number(cotizacion.id_bodega) === Number(formData.id_bodega);

      return matchCliente && matchBodega;
    });
  }, [cotizaciones, formData.id_cliente, formData.id_bodega]);

  const resetForm = () => {
    const hoy = new Date().toISOString().slice(0, 10);

    setFormData({
      id_cliente: "",
      fecha_creacion: hoy,
      fecha_vencimiento: sumarDiasAFecha(hoy, 15),
      id_estado_orden_venta: estadoPendienteId ? String(estadoPendienteId) : "",
      id_termino_pago: "",
      descripcion: "",
      id_bodega:
        selectedBodegaId && selectedBodegaId > 0 ? String(selectedBodegaId) : "",
    });
    setSelectedCotizacionId("sin-cotizacion");
    setSelectedProductoId("");
    setCantidadProducto("");
    setPrecioProducto("");
    setProductosOrden([]);
    setSelectedOrden(null);
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (orden: OrdenVentaApi) => {
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
      id_cliente: cotizacion.id_cliente ? String(cotizacion.id_cliente) : prev.id_cliente,
      id_bodega: cotizacion.id_bodega ? String(cotizacion.id_bodega) : prev.id_bodega,
    }));

    setProductosOrden(mapDetalleCotizacionToForm(cotizacion.detalle_cotizacion));
    toast.success("Productos cargados desde la cotización");
  };

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
      },
    ]);

    setSelectedProductoId("");
    setCantidadProducto("");
    setPrecioProducto("");
  };

  const handleEliminarProducto = (idProducto: number) => {
    setProductosOrden((prev) =>
      prev.filter((item) => Number(item.id_producto) !== Number(idProducto))
    );
  };

  const totalForm = useMemo(() => {
    return productosOrden.reduce((acc, item) => acc + item.subtotal, 0);
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
        ...(selectedCotizacionId && selectedCotizacionId !== "sin-cotizacion"
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

  const handleCreate = handleOpenCreate;
  const handleView = handleOpenView;
  const handleEdit = handleOpenEdit;
  const handleAnularClick = handleOpenAnular;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-gray-500">
        Cargando órdenes de venta...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Órdenes de Venta</h2>
        <p className="text-gray-600 mt-1">
          Gestiona las órdenes de venta de productos
        </p>
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
              <p className="text-sm text-gray-600">Procesando</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.procesando}
              </p>
            </div>
            <CheckCircle2 className="text-blue-600" size={32} />
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
            placeholder="Buscar por número de orden, cliente, estado o número de items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
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
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrdenes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentOrdenes.map((orden, index) => {
                  const estadoNombre = getEstadoNombre(orden.estado_orden_venta);
                  const estadoKey = normalizarTexto(estadoNombre);
                  const isCancelada =
                    estadoKey.includes("anulada") ||
                    estadoKey.includes("anulado") ||
                    estadoKey.includes("cancelada") ||
                    estadoKey.includes("cancelado");

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

                      <TableCell>
                        {formatDateDisplay(orden.fecha_creacion)}
                      </TableCell>

                      <TableCell>
                        {formatDateDisplay(orden.fecha_vencimiento)}
                      </TableCell>

                      <TableCell>{getItemsOrden(orden)}</TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEstado(orden)}
                          disabled={isCancelada}
                          className={`h-7 ${
                            estadoKey.includes("pendiente")
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : estadoKey.includes("procesando") ||
                                estadoKey.includes("aprobada") ||
                                estadoKey.includes("aprobado")
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : estadoKey.includes("enviada")
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : estadoKey.includes("entregada") ||
                                estadoKey.includes("aplicada")
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-100 opacity-60 cursor-not-allowed"
                          }`}
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
                            onClick={() => handleEdit(orden)}
                            className="hover:bg-yellow-50"
                            title="Editar"
                            disabled={isCancelada}
                          >
                            <Edit size={16} className="text-yellow-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAnularClick(orden)}
                            className="hover:bg-red-50"
                            title="Anular"
                            disabled={isCancelada}
                          >
                            <Ban size={16} className="text-red-600" />
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

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Nueva orden de venta" : "Editar orden de venta"}
            </DialogTitle>
            <DialogDescription>
              Completa la información de la orden
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={formData.fecha_creacion}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_creacion: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Fecha de vencimiento</Label>
                <Input
                  type="date"
                  value={formData.fecha_vencimiento}
                  readOnly
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.id_cliente}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, id_cliente: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem
                        key={cliente.id_cliente}
                        value={String(cliente.id_cliente)}
                      >
                        {getClienteNombre(cliente)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bodega *</Label>
                {selectedBodegaId && selectedBodegaId > 0 ? (
                  <Input value={selectedBodegaNombre} disabled className="bg-gray-100" />
                ) : (
                  <Select
                    value={formData.id_bodega}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, id_bodega: value }))
                    }
                  >
                    <SelectTrigger>
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
                )}
              </div>

              <div>
                <Label>Estado</Label>
                <Input
                  value={
                    formMode === "create"
                      ? getEstadoNombre(
                          estados.find(
                            (estado) => estado.id_estado_orden_venta === estadoPendienteId
                          )
                        )
                      : getEstadoNombre(
                          estados.find(
                            (estado) =>
                              String(estado.id_estado_orden_venta) ===
                              String(formData.id_estado_orden_venta)
                          )
                        )
                  }
                  readOnly
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label>Término de pago *</Label>
                <Select
                  value={formData.id_termino_pago}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, id_termino_pago: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un término de pago" />
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

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Label className="mb-2 block text-blue-900">
                Cargar productos desde cotización
              </Label>
              <Select value={selectedCotizacionId} onValueChange={handleCargarCotizacion}>
                <SelectTrigger className="bg-white">
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

            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center gap-2">
                <Package size={18} />
                <h3 className="font-semibold text-gray-900">Productos de la orden</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <Label>Producto</Label>
                  <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((producto) => (
                        <SelectItem
                          key={producto.id_producto}
                          value={String(producto.id_producto)}
                        >
                          {getProductoNombre(producto)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(e.target.value)}
                    className="placeholder:text-gray-400"
                  />
                </div>

                <div className="md:col-span-3">
                  <Label>Precio unitario</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(e.target.value)}
                    className="placeholder:text-gray-400"
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAgregarProducto}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosOrden.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                          No hay productos agregados
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosOrden.map((item) => (
                        <TableRow key={item.id_producto}>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{formatMoney(item.precio_unitario)}</TableCell>
                          <TableCell>{formatMoney(item.subtotal)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminarProducto(item.id_producto)}
                            >
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-right">
                  <p className="text-sm text-gray-500">
                    Items: {productosOrden.length}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    Total: {formatMoney(totalForm)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                placeholder="Escribe observaciones de la orden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {formMode === "create" ? "Crear orden" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de la orden de venta</DialogTitle>
            <DialogDescription>
              Información completa de la orden seleccionada
            </DialogDescription>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="font-semibold">
                    {selectedOrden.codigo_orden_venta || `OV-${selectedOrden.id_orden_venta}`}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge>
                    {getEstadoNombre(selectedOrden.estado_orden_venta)}
                  </Badge>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{getClienteNombre(selectedOrden.cliente)}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Bodega</p>
                  <p className="font-semibold">{getBodegaNombre(selectedOrden.bodega)}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold">{formatDateDisplay(selectedOrden.fecha_creacion)}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">Fecha vencimiento</p>
                  <p className="font-semibold">{formatDateDisplay(selectedOrden.fecha_vencimiento)}</p>
                </div>

                <div className="rounded-lg border p-4 md:col-span-2">
                  <p className="text-sm text-gray-500">Término de pago</p>
                  <p className="font-semibold">{getTerminoNombre(selectedOrden.termino_pago)}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Productos</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrden.detalle_orden_venta || []).map((item, index) => {
                      const cantidad = Number(item.cantidad || 0);
                      const precio = Number(item.precio_unitario || 0);

                      return (
                        <TableRow key={item.id_detalle_orden_venta || index}>
                          <TableCell>{getProductoNombre(item.producto)}</TableCell>
                          <TableCell>{cantidad}</TableCell>
                          <TableCell>{formatMoney(precio)}</TableCell>
                          <TableCell>{formatMoney(cantidad * precio)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-4 text-right">
                  <p className="text-lg font-bold">
                    Total: {formatMoney(getTotalOrden(selectedOrden))}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Observaciones</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selectedOrden.descripcion || "Sin observaciones"}
                </p>
              </div>
            </div>
          )}
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
              ? `Vas a anular la orden ${
                  selectedOrden.codigo_orden_venta || `OV-${selectedOrden.id_orden_venta}`
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
                  {getEstadoNombre(estadoCambioPendiente.orden.estado_orden_venta)}
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