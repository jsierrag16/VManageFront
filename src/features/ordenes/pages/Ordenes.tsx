import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, Plus, ShoppingCart, Package, Clock, CheckCircle2, XCircle, User, FileText, Phone, Building2, Mail, MapPin, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Label } from '../../../shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../shared/components/ui/dialog';
import { toast } from 'sonner';
import { clientesData as initialClientesData, Cliente } from '../../../data/clientes';
import { productosData, Producto } from '../../../data/productos';
import { bodegasData, Bodega } from '../../../data/bodegas';
import { cotizacionesData } from '../../cotizaciones/pages/Cotizaciones';

interface Orden {
  id: number;
  numeroOrden: string;
  cliente: string;
  fecha: string;
  fechaVencimiento: string;
  estado: 'Pendiente' | 'Procesando' | 'Enviada' | 'Entregada' | 'Cancelada';
  items: number;
  total: number;
  observaciones: string;
  bodega: string;
  productos?: Array<{
    producto: Producto;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

export const ordenesData: Orden[] = [
  {
    id: 1,
    numeroOrden: 'ORD-001',
    cliente: 'Juan Carlos Pérez Rodríguez',
    fecha: '2024-01-15',
    fechaVencimiento: '2024-01-20',
    estado: 'Procesando',
    items: 2,
    total: 1475000,
    observaciones: 'Cliente frecuente - prioridad alta',
    bodega: 'Bodega Principal',
    productos: [
      {
        producto: productosData[0],
        cantidad: 10,
        precio: 125000,
        subtotal: 1250000
      },
      {
        producto: productosData[3],
        cantidad: 5,
        precio: 45000,
        subtotal: 225000
      }
    ]
  },
  {
    id: 2,
    numeroOrden: 'ORD-002',
    cliente: 'María Fernanda García López',
    fecha: '2024-01-14',
    fechaVencimiento: '2024-01-19',
    estado: 'Enviada',
    items: 1,
    total: 944000,
    observaciones: 'Envío por transportadora',
    bodega: 'Bodega Medellín',
    productos: [
      {
        producto: productosData[1],
        cantidad: 8,
        precio: 118000,
        subtotal: 944000
      }
    ]
  },
  {
    id: 3,
    numeroOrden: 'ORD-003',
    cliente: 'Distribuidora ABC S.A.S.',
    fecha: '2024-01-16',
    fechaVencimiento: '2024-01-21',
    estado: 'Pendiente',
    items: 2,
    total: 2075000,
    observaciones: 'Verificar disponibilidad antes de confirmar',
    bodega: 'Bodega Secundaria',
    productos: [
      {
        producto: productosData[2],
        cantidad: 15,
        precio: 115000,
        subtotal: 1725000
      },
      {
        producto: productosData[7],
        cantidad: 10,
        precio: 35000,
        subtotal: 350000
      }
    ]
  }
];

interface OrdenesProps {
  triggerCreate?: number;
  triggerCreateRemision?: number;
  selectedBodega?: string;
  currentUser?: any;
}

// Categorías disponibles para clientes (si fuera necesario)
const CATEGORIAS_CLIENTE = [
  'Distribuidor',
  'Minorista',
  'Mayorista',
  'Consumidor Final',
  'Otros'
] as const;

export default function Ordenes({ triggerCreate, triggerCreateRemision, selectedBodega = 'Todas las bodegas', currentUser }: OrdenesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenes, setOrdenes] = useState<Orden[]>(ordenesData);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientesData);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateClienteModalOpen, setIsCreateClienteModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [ordenParaPdf, setOrdenParaPdf] = useState<Orden | null>(null);
  
  // Form states para orden de venta
  const [formData, setFormData] = useState({
    numeroOrden: '',
    cliente: '',
    fecha: '',
    fechaVencimiento: '',
    estado: 'Pendiente' as 'Pendiente' | 'Procesando' | 'Enviada' | 'Entregada' | 'Cancelada',
    items: 0,
    observaciones: '',
    bodega: ''
  });

  // Form states para crear cliente
  const [formCliTipoDoc, setFormCliTipoDoc] = useState('CC');
  const [formCliNumeroDoc, setFormCliNumeroDoc] = useState('');
  const [formCliNombre, setFormCliNombre] = useState('');
  const [formCliEmail, setFormCliEmail] = useState('');
  const [formCliTelefono, setFormCliTelefono] = useState('');
  const [formCliDireccion, setFormCliDireccion] = useState('');
  const [formCliCiudad, setFormCliCiudad] = useState('');

  // Estados para manejo de productos en la orden
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);
  const [productosOrden, setProductosOrden] = useState<Array<{
    producto: Producto;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>>([]);

  // Estado para seleccionar cotización
  const [selectedCotizacionId, setSelectedCotizacionId] = useState<string>('');

  // Filtrar productos activos
  const productosActivos = useMemo(() => {
    return productosData.filter(p => p.estado);
  }, []);

  // Generar número de orden automático
  const generarNumeroOrden = () => {
    const siguienteNumero = ordenes.length + 1;
    return `ORD-${String(siguienteNumero).padStart(3, '0')}`;
  };

  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaActual = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Calcular fecha de vencimiento (5 días después)
  const getFechaVencimiento = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 5);
    return fecha.toISOString().split('T')[0];
  };

  // Filtrar clientes activos
  const clientesActivos = useMemo(() => {
    return clientes.filter(c => c.estado === 'Activo');
  }, [clientes]);

  // Filtrar órdenes por bodega Y por búsqueda
  const filteredOrdenes = useMemo(() => {
    return ordenes
      .filter((orden) => selectedBodega === 'Todas las bodegas' || orden.bodega === selectedBodega)
      .filter((orden) =>
        orden.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.items.toString().includes(searchTerm)
      );
  }, [ordenes, searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrdenes = filteredOrdenes.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalOrdenes = ordenes.length;
    const pendientes = ordenes.filter(o => o.estado === 'Pendiente').length;
    const procesando = ordenes.filter(o => o.estado === 'Procesando').length;
    
    return { totalOrdenes, pendientes, procesando };
  }, [ordenes]);

  // Abrir modal de crear con datos iniciales automáticos
  const handleOpenCreateModal = () => {
    const bodegaInicial = selectedBodega === 'Todas las bodegas' ? 'Bodega Principal' : selectedBodega;
    setFormData({
      numeroOrden: generarNumeroOrden(),
      cliente: '',
      fecha: getFechaActual(),
      fechaVencimiento: getFechaVencimiento(),
      estado: 'Pendiente',
      items: 0,
      observaciones: '',
      bodega: bodegaInicial
    });
    // Limpiar productos y cotización seleccionada
    setProductosOrden([]);
    setSelectedProductoId('');
    setCantidadProducto(1);
    setPrecioProducto(0);
    setSelectedCotizacionId('');
    setIsCreateModalOpen(true);
  };

  // Validación de formulario de cliente
  const validateClienteForm = () => {
    if (!formCliTipoDoc || !formCliNumeroDoc.trim() || !formCliNombre.trim() || !formCliEmail.trim() || 
        !formCliTelefono.trim() || !formCliDireccion.trim() || !formCliCiudad.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return false;
    }

    if (!/^[0-9-]+$/.test(formCliNumeroDoc)) {
      toast.error('El número de documento solo debe contener números y guiones');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formCliEmail)) {
      toast.error('El email no tiene un formato válido');
      return false;
    }

    if (!/^[0-9\s\-()]+$/.test(formCliTelefono)) {
      toast.error('El teléfono solo debe contener números, espacios, guiones y paréntesis');
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(formCliNombre)) {
      toast.error('El nombre contiene caracteres no permitidos');
      return false;
    }

    return true;
  };

  // Crear nuevo cliente desde el modal de orden de venta
  const handleCreateCliente = () => {
    if (!validateClienteForm()) return;

    const bodegaInicial = selectedBodega === 'Todas las bodegas' ? 'Bodega Principal' : selectedBodega;
    const newCliente: Cliente = {
      id: `CLI-${String(clientes.length + 1).padStart(3, '0')}`,
      tipoDocumento: formCliTipoDoc,
      numeroDocumento: formCliNumeroDoc.trim(),
      nombre: formCliNombre.trim(),
      email: formCliEmail.trim(),
      telefono: formCliTelefono.trim(),
      direccion: formCliDireccion.trim(),
      ciudad: formCliCiudad.trim(),
      estado: 'Activo',
      fechaRegistro: new Date().toISOString().split('T')[0],
      bodega: bodegaInicial,
    };

    setClientes([...clientes, newCliente]);
    setFormData({ ...formData, cliente: newCliente.nombre });
    setIsCreateClienteModalOpen(false);
    toast.success('Cliente creado exitosamente');
    
    // Limpiar formulario de cliente
    resetClienteForm();
  };

  const resetClienteForm = () => {
    setFormCliTipoDoc('CC');
    setFormCliNumeroDoc('');
    setFormCliNombre('');
    setFormCliEmail('');
    setFormCliTelefono('');
    setFormCliDireccion('');
    setFormCliCiudad('');
  };

  // Función para cargar productos desde una cotización
  const handleCargarDesdeCotizacion = (cotizacionId: string) => {
    if (!cotizacionId || cotizacionId === 'sin-cotizacion') {
      setProductosOrden([]);
      return;
    }

    const cotizacionSeleccionada = cotizacionesData.find(c => c.id.toString() === cotizacionId);
    if (!cotizacionSeleccionada) {
      toast.error('Cotización no encontrada');
      return;
    }

    // Cargar productos de la cotización
    if (cotizacionSeleccionada.productos && cotizacionSeleccionada.productos.length > 0) {
      setProductosOrden(cotizacionSeleccionada.productos);
      // Auto-completar cliente si viene de la cotización
      setFormData(prev => ({
        ...prev,
        cliente: cotizacionSeleccionada.cliente,
        bodega: cotizacionSeleccionada.bodega
      }));
      toast.success(`${cotizacionSeleccionada.productos.length} producto(s) cargado(s) desde la cotización`);
    } else {
      toast.info('La cotización seleccionada no tiene productos');
      setProductosOrden([]);
    }
  };

  // Funciones para manejar productos en la orden
  const handleAgregarProducto = () => {
    if (!selectedProductoId) {
      toast.error('Por favor selecciona un producto');
      return;
    }

    if (cantidadProducto <= 0) {
      toast.error('La cantidad debe ser mayor a cero');
      return;
    }

    if (precioProducto <= 0) {
      toast.error('El precio debe ser mayor a cero');
      return;
    }

    const producto = productosActivos.find(p => p.id === selectedProductoId);
    if (!producto) return;

    // Verificar si el producto ya está en la lista
    const productoExistente = productosOrden.find(p => p.producto.id === selectedProductoId);
    if (productoExistente) {
      toast.error('Este producto ya está agregado. Elimínalo primero si deseas modificarlo');
      return;
    }

    const subtotal = cantidadProducto * precioProducto;
    const nuevoProducto = {
      producto,
      cantidad: cantidadProducto,
      precio: precioProducto,
      subtotal
    };

    setProductosOrden([...productosOrden, nuevoProducto]);
    
    // Limpiar campos
    setSelectedProductoId('');
    setCantidadProducto(1);
    setPrecioProducto(0);
    
    toast.success('Producto agregado correctamente');
  };

  const handleEliminarProducto = (productoId: string) => {
    setProductosOrden(productosOrden.filter(p => p.producto.id !== productoId));
    toast.success('Producto eliminado de la orden');
  };

  // Calcular totales basados en los productos agregados
  const calcularTotales = useMemo(() => {
    const total = productosOrden.reduce((sum, item) => sum + item.subtotal, 0);
    const items = productosOrden.length;

    return { total, items };
  }, [productosOrden]);

  const handleCreate = () => {
    if (!formData.numeroOrden || !formData.cliente || !formData.fecha || !formData.fechaVencimiento || !formData.bodega) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (productosOrden.length === 0) {
      toast.error('Debes agregar al menos un producto a la orden');
      return;
    }

    const nuevaOrden: Orden = {
      id: ordenes.length + 1,
      numeroOrden: formData.numeroOrden,
      cliente: formData.cliente,
      fecha: formData.fecha,
      fechaVencimiento: formData.fechaVencimiento,
      estado: formData.estado,
      items: calcularTotales.items,
      total: calcularTotales.total,
      observaciones: formData.observaciones,
      bodega: formData.bodega,
      productos: [...productosOrden]
    };

    setOrdenes([...ordenes, nuevaOrden]);
    setIsCreateModalOpen(false);
    setShowSuccessModal(true);
    resetForm();
    setProductosOrden([]);
  };

  const handleEdit = () => {
    if (!selectedOrden || !formData.numeroOrden || !formData.cliente || !formData.bodega) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (productosOrden.length === 0) {
      toast.error('Debes agregar al menos un producto a la orden');
      return;
    }

    setOrdenes(ordenes.map(orden =>
      orden.id === selectedOrden.id
        ? { 
            ...orden, 
            ...formData, 
            items: calcularTotales.items,
            total: calcularTotales.total,
            productos: [...productosOrden]
          }
        : orden
    ));
    toast.success('Orden de venta actualizada exitosamente');
    setIsEditModalOpen(false);
    setSelectedOrden(null);
    resetForm();
    setProductosOrden([]);
  };

  const handleDelete = () => {
    if (!selectedOrden) return;

    setOrdenes(ordenes.filter(orden => orden.id !== selectedOrden.id));
    toast.success('Orden de venta eliminada exitosamente');
    setIsDeleteModalOpen(false);
    setSelectedOrden(null);
  };

  const handleDownloadPDF = (orden: Orden, incluirPrecios: boolean = true) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE VENTA', 105, 20, { align: 'center' });
    
    // Información de la orden
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Columna izquierda
    doc.text(`N° Orden: ${orden.numeroOrden}`, 20, 40);
    doc.text(`Cliente: ${orden.cliente}`, 20, 46);
    doc.text(`Bodega: ${orden.bodega}`, 20, 52);
    
    // Columna derecha
    doc.text(`Fecha: ${new Date(orden.fecha).toLocaleDateString('es-CO')}`, 120, 40);
    doc.text(`Fecha Vencimiento: ${new Date(orden.fechaVencimiento).toLocaleDateString('es-CO')}`, 120, 46);
    doc.text(`Estado: ${orden.estado}`, 120, 52);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);
    
    // Tabla de productos
    if (orden.productos && orden.productos.length > 0) {
      let tableData, tableHeaders, columnStyles;
      
      if (incluirPrecios) {
        tableData = orden.productos.map(item => [
          item.producto.nombre,
          item.cantidad.toString(),
          `$${item.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          `$${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
        ]);
        tableHeaders = [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']];
        columnStyles = {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        };
      } else {
        tableData = orden.productos.map(item => [
          item.producto.nombre,
          item.cantidad.toString()
        ]);
        tableHeaders = [['Producto', 'Cantidad']];
        columnStyles = {
          0: { cellWidth: 130 },
          1: { cellWidth: 30, halign: 'center' }
        };
      }
      
      autoTable(doc, {
        startY: 65,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: columnStyles as any
      });
    }
    
    // Totales (solo si se incluyen precios)
    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    const totalesY = finalY + 10;
    
    if (incluirPrecios) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', 130, totalesY);
      doc.text(`$${orden.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 190, totalesY, { align: 'right' });
    }
    
    // Observaciones
    if (orden.observaciones) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const obsY = incluirPrecios ? totalesY + 20 : totalesY + 10;
      doc.text('Observaciones:', 20, obsY);
      const splitObservaciones = doc.splitTextToSize(orden.observaciones, 170);
      doc.text(splitObservaciones, 20, obsY + 6);
    }
    
    // Pie de página
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, 105, pageHeight - 10, { align: 'center' });
    
    // Descargar
    const suffix = incluirPrecios ? '' : '_SinPrecios';
    doc.save(`Orden_Venta_${orden.numeroOrden}${suffix}.pdf`);
    toast.success('PDF descargado exitosamente');
  };
  
  const openPdfOptionsModal = (orden: Orden) => {
    setOrdenParaPdf(orden);
    setIsPdfOptionsModalOpen(true);
  };

  const openEditModal = (orden: Orden) => {
    setSelectedOrden(orden);
    setFormData({
      numeroOrden: orden.numeroOrden,
      cliente: orden.cliente,
      fecha: orden.fecha,
      fechaVencimiento: orden.fechaVencimiento,
      estado: orden.estado,
      items: orden.items,
      observaciones: orden.observaciones,
      bodega: orden.bodega
    });
    // Cargar productos existentes de la orden
    setProductosOrden(orden.productos || []);
    setSelectedProductoId('');
    setCantidadProducto(1);
    setPrecioProducto(0);
    setSelectedCotizacionId('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (orden: Orden) => {
    setSelectedOrden(orden);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      numeroOrden: '',
      cliente: '',
      fecha: '',
      fechaVencimiento: '',
      estado: 'Pendiente',
      items: 0,
      observaciones: '',
      bodega: ''
    });
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Procesando':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Enviada':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Entregada':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Órdenes de Venta</h2>
        <p className="text-gray-600 mt-1">Gestiona las órdenes de venta de productos</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrdenes}</p>
            </div>
            <ShoppingCart className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendientes}</p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Procesando</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.procesando}</p>
            </div>
            <CheckCircle2 className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y botón crear */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por número de orden, cliente, estado o número de items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Tabla */}
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
                <TableHead>Estado</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdenes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron órdenes de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentOrdenes.map((orden, index) => (
                  <TableRow key={orden.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{orden.numeroOrden}</TableCell>
                    <TableCell>{orden.cliente}</TableCell>
                    <TableCell>{new Date(orden.fecha).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{new Date(orden.fechaVencimiento).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEstadoBadgeClass(orden.estado)}>
                        {orden.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{orden.items}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(orden)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfOptionsModal(orden)}
                          className="hover:bg-green-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(orden)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(orden)}
                          className="hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {filteredOrdenes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredOrdenes.length)} de{' '}
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
                    variant={currentPage === page ? 'default' : 'outline'}
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

      {/* Modal Crear Orden de Venta */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Venta</DialogTitle>
            <DialogDescription>
              Completa la información para crear una nueva orden de venta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroOrden">Número de Orden *</Label>
                <Input
                  id="numeroOrden"
                  value={formData.numeroOrden}
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
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <div className="flex gap-2">
                <Select value={formData.cliente} onValueChange={(value) => setFormData({ ...formData, cliente: value })}>
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
                        <SelectItem key={cliente.id} value={cliente.nombre}>
                          {cliente.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetClienteForm();
                    setIsCreateClienteModalOpen(true);
                  }}
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
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bodega">Bodega *</Label>
                <Select value={formData.bodega} onValueChange={(value) => setFormData({ ...formData, bodega: value })}>
                  <SelectTrigger id="bodega">
                    <SelectValue placeholder="Selecciona una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Orden</Label>
              
              {/* Selector de Cotización */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 mb-4">
                <Label htmlFor="cotizacion-select" className="text-blue-900 mb-2 block">
                  ¿Deseas cargar productos desde una cotización existente?
                </Label>
                <Select 
                  value={selectedCotizacionId} 
                  onValueChange={(value) => {
                    setSelectedCotizacionId(value);
                    handleCargarDesdeCotizacion(value);
                  }}
                >
                  <SelectTrigger id="cotizacion-select" className="bg-white">
                    <SelectValue placeholder="Selecciona una cotización (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cotizacion">Sin cotización</SelectItem>
                    {cotizacionesData
                      .filter(cot => {
                        const matchBodega = cot.bodega === formData.bodega || formData.bodega === '';
                        const matchCliente = formData.cliente ? cot.cliente === formData.cliente : true;
                        return matchBodega && matchCliente;
                      })
                      .map((cotizacion) => (
                        <SelectItem key={cotizacion.id} value={cotizacion.id.toString()}>
                          {cotizacion.numeroCotizacion} - {cotizacion.cliente} ({cotizacion.items} items)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-2">
                  {formData.cliente 
                    ? `Mostrando cotizaciones del cliente ${formData.cliente}`
                    : 'Selecciona un cliente para ver sus cotizaciones disponibles'}
                </p>
              </div>
              
              {/* Formulario para agregar productos */}
              <div className="grid grid-cols-12 gap-2 mt-3">
                <div className="col-span-5">
                  <Label htmlFor="producto">Producto</Label>
                  <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
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
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="precio">Precio Unit.</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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

              {/* Tabla de productos agregados */}
              {productosOrden.length > 0 && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosOrden.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                          <TableCell className="text-center">{item.cantidad}</TableCell>
                          <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
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
                </div>
              )}

              {/* Totales calculados automáticamente */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">${calcularTotales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Escribe cualquier observación sobre la orden de venta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Cliente (anidado) */}
      <Dialog open={isCreateClienteModalOpen} onOpenChange={setIsCreateClienteModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <button
            onClick={() => setIsCreateClienteModalOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Completa la información para registrar un nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cli-tipo-doc">Tipo de Documento *</Label>
                <Select value={formCliTipoDoc} onValueChange={setFormCliTipoDoc}>
                  <SelectTrigger id="cli-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cli-numero-doc">Número de Documento *</Label>
                <Input
                  id="cli-numero-doc"
                  value={formCliNumeroDoc}
                  onChange={(e) => setFormCliNumeroDoc(e.target.value)}
                  placeholder="Ej: 1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cli-nombre">Nombre Completo *</Label>
              <Input
                id="cli-nombre"
                value={formCliNombre}
                onChange={(e) => setFormCliNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cli-email">Email *</Label>
                <Input
                  id="cli-email"
                  type="email"
                  value={formCliEmail}
                  onChange={(e) => setFormCliEmail(e.target.value)}
                  placeholder="Ej: cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="cli-telefono">Teléfono *</Label>
                <Input
                  id="cli-telefono"
                  value={formCliTelefono}
                  onChange={(e) => setFormCliTelefono(e.target.value)}
                  placeholder="Ej: 3001234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cli-direccion">Dirección *</Label>
                <Input
                  id="cli-direccion"
                  value={formCliDireccion}
                  onChange={(e) => setFormCliDireccion(e.target.value)}
                  placeholder="Ej: Calle 123 #45-67"
                />
              </div>
              <div>
                <Label htmlFor="cli-ciudad">Ciudad *</Label>
                <Input
                  id="cli-ciudad"
                  value={formCliCiudad}
                  onChange={(e) => setFormCliCiudad(e.target.value)}
                  placeholder="Ej: Bogotá"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateClienteModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCliente} className="bg-blue-600 hover:bg-blue-700">
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Orden de Venta */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Orden de Venta</DialogTitle>
            <DialogDescription>
              Actualiza la información de la orden de venta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroOrdenEdit">Número de Orden</Label>
                <Input
                  id="numeroOrdenEdit"
                  value={formData.numeroOrden}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="estadoEdit">Estado *</Label>
                <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger id="estadoEdit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Procesando">Procesando</SelectItem>
                    <SelectItem value="Enviada">Enviada</SelectItem>
                    <SelectItem value="Entregada">Entregada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="clienteEdit">Cliente *</Label>
              <Select value={formData.cliente} onValueChange={(value) => setFormData({ ...formData, cliente: value })}>
                <SelectTrigger id="clienteEdit">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesActivos.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.nombre}>
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
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bodegaEdit">Bodega *</Label>
                <Select value={formData.bodega} onValueChange={(value) => setFormData({ ...formData, bodega: value })}>
                  <SelectTrigger id="bodegaEdit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-4">
              <Label className="text-lg">Productos de la Orden</Label>
              
              {/* Selector de Cotización */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 mb-4">
                <Label htmlFor="cotizacion-select-edit" className="text-blue-900 mb-2 block">
                  ¿Deseas cargar productos desde una cotización existente?
                </Label>
                <Select 
                  value={selectedCotizacionId} 
                  onValueChange={(value) => {
                    setSelectedCotizacionId(value);
                    handleCargarDesdeCotizacion(value);
                  }}
                >
                  <SelectTrigger id="cotizacion-select-edit" className="bg-white">
                    <SelectValue placeholder="Selecciona una cotización (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-cotizacion">Sin cotización</SelectItem>
                    {cotizacionesData
                      .filter(cot => {
                        const matchBodega = cot.bodega === formData.bodega || formData.bodega === '';
                        const matchCliente = formData.cliente ? cot.cliente === formData.cliente : true;
                        return matchBodega && matchCliente;
                      })
                      .map((cotizacion) => (
                        <SelectItem key={cotizacion.id} value={cotizacion.id.toString()}>
                          {cotizacion.numeroCotizacion} - {cotizacion.cliente} ({cotizacion.items} items)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-2">
                  {formData.cliente 
                    ? `Mostrando cotizaciones del cliente ${formData.cliente}`
                    : 'Selecciona un cliente para ver sus cotizaciones disponibles'}
                </p>
              </div>
              
              {/* Formulario para agregar productos */}
              <div className="grid grid-cols-12 gap-2 mt-3">
                <div className="col-span-5">
                  <Label htmlFor="productoEdit">Producto</Label>
                  <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
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
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="precioEdit">Precio Unit.</Label>
                  <Input
                    id="precioEdit"
                    type="number"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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

              {/* Tabla de productos agregados */}
              {productosOrden.length > 0 && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosOrden.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                          <TableCell className="text-center">{item.cantidad}</TableCell>
                          <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
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
                </div>
              )}

              {/* Totales */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">N° de Items:</span>
                  <span className="font-medium">{calcularTotales.items}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">${calcularTotales.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="observacionesEdit">Observaciones</Label>
              <Textarea
                id="observacionesEdit"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Escribe cualquier observación sobre la orden de venta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              Actualizar Orden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalles */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden</DialogTitle>
            <DialogDescription className="sr-only">
              Información detallada de la orden de venta
            </DialogDescription>
          </DialogHeader>
          {selectedOrden && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Número de Orden</p>
                  <p className="font-medium text-blue-600">{selectedOrden.numeroOrden}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="outline" className={getEstadoBadgeClass(selectedOrden.estado)}>
                    {selectedOrden.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{selectedOrden.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bodega</p>
                  <p className="font-medium">{selectedOrden.bodega}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-medium">{new Date(selectedOrden.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-medium">{new Date(selectedOrden.fechaVencimiento).toLocaleDateString('es-CO')}</p>
                </div>
              </div>

              {/* Productos */}
              {selectedOrden.productos && selectedOrden.productos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Productos</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrden.productos.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                            <TableCell className="text-center">{item.cantidad}</TableCell>
                            <TableCell className="text-right">${item.precio.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${item.subtotal.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total de la Orden</p>
                  <p className="text-2xl font-bold text-blue-600">${selectedOrden.total.toLocaleString()}</p>
                </div>
              </div>

              {/* Observaciones */}
              {selectedOrden.observaciones && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Observaciones</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">{selectedOrden.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Eliminar Orden</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta orden de venta?
            </DialogDescription>
          </DialogHeader>
          {selectedOrden && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Se eliminará la orden <span className="font-medium text-gray-900">{selectedOrden.numeroOrden}</span> del cliente{' '}
                <span className="font-medium text-gray-900">{selectedOrden.cliente}</span>.
              </p>
              <p className="text-sm text-red-600 mt-2">Esta acción no se puede deshacer.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={24} />
              Orden Creada Exitosamente
            </DialogTitle>
            <DialogDescription className="sr-only">
              La orden de venta ha sido creada correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">La orden de venta ha sido registrada correctamente en el sistema.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Opciones de PDF */}
      <Dialog open={isPdfOptionsModalOpen} onOpenChange={setIsPdfOptionsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar PDF</DialogTitle>
            <DialogDescription>
              Selecciona el formato del PDF que deseas descargar
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button
              onClick={() => {
                if (ordenParaPdf) handleDownloadPDF(ordenParaPdf, true);
                setIsPdfOptionsModalOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar con Precios
            </Button>
            <Button
              onClick={() => {
                if (ordenParaPdf) handleDownloadPDF(ordenParaPdf, false);
                setIsPdfOptionsModalOpen(false);
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Descargar sin Precios
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfOptionsModalOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
