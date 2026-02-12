import { useState, useMemo, useEffect } from 'react';
import { FileText, Search, Plus, Edit, Trash2, Eye, CheckCircle, Clock, ChevronLeft, ChevronRight, XCircle, X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../shared/components/ui/dialog';
import { ordenesData } from '../../ordenes/pages/Ordenes';
import { clientesData, Cliente } from '../../../data/clientes';
import { productosData, Producto } from '../../../data/productos';
import { pagosAbonosData } from '../../pagosAbonos/pages/PagosAbonos';

interface ProductoRemision {
  producto: Producto;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface Remision {
  id: number;
  numeroRemision: string;
  ordenVenta: string;
  cliente: string;
  fecha: string;
  estado: 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada';
  items: number;
  total: number;
  observaciones: string;
  productos?: ProductoRemision[];
}

const remisionesData: Remision[] = [
  {
    id: 1,
    numeroRemision: 'RV-001',
    ordenVenta: 'ORD-001',
    cliente: 'Juan Carlos Pérez Rodríguez',
    fecha: '2024-01-15',
    estado: 'Aprobada',
    items: 12,
    total: 16950.00,
    observaciones: 'Remisión lista para facturar'
  },
  {
    id: 2,
    numeroRemision: 'RV-002',
    ordenVenta: 'ORD-002',
    cliente: 'María Fernanda García López',
    fecha: '2024-01-14',
    estado: 'Facturada',
    items: 8,
    total: 9605.00,
    observaciones: 'Factura #F-001 generada'
  },
  {
    id: 3,
    numeroRemision: 'RV-003',
    ordenVenta: 'ORD-003',
    cliente: 'Distribuidora ABC S.A.S.',
    fecha: '2024-01-16',
    estado: 'Pendiente',
    items: 5,
    total: 5876.00,
    observaciones: 'Esperando aprobación'
  },
  {
    id: 4,
    numeroRemision: 'RV-004',
    ordenVenta: 'ORD-004',
    cliente: 'Juan Carlos Pérez Rodríguez',
    fecha: '2024-01-13',
    estado: 'Facturada',
    items: 10,
    total: 13560.00,
    observaciones: 'Entrega completa - Factura #F-002'
  },
  {
    id: 5,
    numeroRemision: 'RV-005',
    ordenVenta: 'ORD-005',
    cliente: 'Distribuidora ABC S.A.S.',
    fecha: '2024-01-12',
    estado: 'Anulada',
    items: 3,
    total: 2825.00,
    observaciones: 'Anulada por solicitud del cliente'
  }
];

interface RemisionesProps {
  currentUser?: any;
  triggerCreate?: number;
}

export default function Remisiones({ currentUser, triggerCreate }: RemisionesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [remisiones, setRemisiones] = useState<Remision[]>(remisionesData);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmEstadoModalOpen, setIsConfirmEstadoModalOpen] = useState(false);
  const [selectedRemision, setSelectedRemision] = useState<Remision | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [remisionParaPdf, setRemisionParaPdf] = useState<Remision | null>(null);
  const [formData, setFormData] = useState({
    numeroRemision: '',
    ordenVenta: '',
    cliente: '',
    fecha: '',
    estado: 'Pendiente' as 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada',
    items: 0,
    total: 0,
    observaciones: ''
  });

  // Estados para manejo de productos en la remisión
  const [productosRemision, setProductosRemision] = useState<ProductoRemision[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);

  // Filtrar productos activos
  const productosActivos = useMemo(() => {
    return productosData.filter(p => p.estado);
  }, []);

  // Generar número de remisión automático
  const generarNumeroRemision = () => {
    const siguienteNumero = remisiones.length + 1;
    return `RV-${String(siguienteNumero).padStart(3, '0')}`;
  };

  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaActual = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filtrar órdenes según el cliente seleccionado
  const ordenesFiltradas = useMemo(() => {
    if (!formData.cliente) {
      return ordenesData;
    }
    return ordenesData.filter(orden => orden.cliente === formData.cliente);
  }, [formData.cliente]);

  // Filtrar remisiones por búsqueda
  const filteredRemisiones = useMemo(() => {
    return remisiones.filter(remision =>
      remision.numeroRemision.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.ordenVenta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.items.toString().includes(searchTerm)
    );
  }, [remisiones, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredRemisiones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRemisiones = filteredRemisiones.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalRemisiones = remisiones.length;
    const pendientes = remisiones.filter(r => r.estado === 'Pendiente').length;
    const aprobadas = remisiones.filter(r => r.estado === 'Aprobada').length;
    
    return { totalRemisiones, pendientes, aprobadas };
  }, [remisiones]);

  // Función para manejar el cambio de orden de venta
  const handleOrdenChange = (ordenId: string) => {
    const orden = ordenesData.find(o => o.numeroOrden === ordenId);
    if (orden) {
      setFormData({ 
        ...formData, 
        ordenVenta: ordenId,
        cliente: orden.cliente
      });
      
      // Cargar los productos de la orden seleccionada
      if (orden.productos && orden.productos.length > 0) {
        const productosConvertidos = orden.productos.map(p => ({
          producto: p.producto,
          cantidad: p.cantidad,
          precio: p.precio,
          subtotal: p.subtotal
        }));
        setProductosRemision(productosConvertidos);
        toast.success(`${orden.productos.length} productos cargados de la orden`);
      } else {
        setProductosRemision([]);
      }
    } else {
      setFormData({ ...formData, ordenVenta: ordenId });
      setProductosRemision([]);
    }
  };

  // Función para manejar el cambio de cliente
  const handleClienteChange = (clienteNombre: string) => {
    setFormData({ ...formData, cliente: clienteNombre });
    // Si hay una orden seleccionada que no corresponde al nuevo cliente, limpiarla
    if (formData.ordenVenta) {
      const ordenActual = ordenesData.find(o => o.numeroOrden === formData.ordenVenta);
      if (ordenActual && ordenActual.cliente !== clienteNombre) {
        setFormData({ ...formData, cliente: clienteNombre, ordenVenta: '' });
        setProductosRemision([]);
      }
    }
  };

  // Función para agregar producto a la remisión
  const agregarProducto = () => {
    if (!selectedProductoId) {
      toast.error('Selecciona un producto');
      return;
    }

    if (cantidadProducto <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (precioProducto <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    const producto = productosActivos.find(p => p.id === selectedProductoId);
    if (!producto) return;

    // Verificar si el producto ya está en la lista
    const productoExistente = productosRemision.find(p => p.producto.id === selectedProductoId);
    if (productoExistente) {
      toast.error('Este producto ya está agregado');
      return;
    }

    const nuevoProducto: ProductoRemision = {
      producto,
      cantidad: cantidadProducto,
      precio: precioProducto,
      subtotal: cantidadProducto * precioProducto
    };

    setProductosRemision([...productosRemision, nuevoProducto]);
    setSelectedProductoId('');
    setCantidadProducto(1);
    setPrecioProducto(0);
    toast.success('Producto agregado a la remisión');
  };

  // Función para eliminar producto de la remisión
  const eliminarProducto = (productoId: string) => {
    setProductosRemision(productosRemision.filter(p => p.producto.id !== productoId));
    toast.success('Producto eliminado');
  };

  // Calcular el total de la remisión
  const calcularTotal = () => {
    return productosRemision.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCreate = () => {
    if (!formData.ordenVenta || !formData.cliente) {
      toast.error('Por favor selecciona una orden de venta y un cliente');
      return;
    }

    if (productosRemision.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    const numeroRemisionNuevo = generarNumeroRemision();
    const totalRemision = calcularTotal();

    const nuevaRemision: Remision = {
      id: remisiones.length + 1,
      numeroRemision: numeroRemisionNuevo,
      ordenVenta: formData.ordenVenta,
      cliente: formData.cliente,
      fecha: getFechaActual(),
      estado: formData.estado,
      items: productosRemision.length,
      total: totalRemision,
      observaciones: formData.observaciones,
      productos: productosRemision
    };

    // Crear automáticamente el pago asociado a la remisión
    const nuevoPago = {
      id: pagosAbonosData.length + 1,
      numeroTransaccion: `TRX-${String(pagosAbonosData.length + 1).padStart(3, '0')}`,
      remisionAsociada: numeroRemisionNuevo,
      cliente: formData.cliente,
      fecha: getFechaActual(),
      metodoPago: 'Efectivo' as 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque',
      monto: totalRemision,
      saldoPendiente: totalRemision,
      estadoPago: 'Pendiente' as 'Pagado' | 'Parcial' | 'Pendiente',
      observaciones: `Pago generado automáticamente para remisión ${numeroRemisionNuevo}`,
      bodega: currentUser?.bodega || 'Bodega Central',
      abonos: []
    };

    pagosAbonosData.push(nuevoPago);

    setRemisiones([...remisiones, nuevaRemision]);
    toast.success(`Remisión de venta creada exitosamente. Pago ${nuevoPago.numeroTransaccion} generado automáticamente.`);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedRemision || !formData.ordenVenta || !formData.cliente) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (productosRemision.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    setRemisiones(remisiones.map(remision =>
      remision.id === selectedRemision.id
        ? { 
            ...remision, 
            ...formData,
            items: productosRemision.length,
            total: calcularTotal(),
            productos: productosRemision
          }
        : remision
    ));
    toast.success('Remisión de venta actualizada exitosamente');
    setIsEditModalOpen(false);
    setSelectedRemision(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedRemision) return;

    setRemisiones(remisiones.filter(remision => remision.id !== selectedRemision.id));
    toast.success('Remisión de venta eliminada exitosamente');
    setIsDeleteModalOpen(false);
    setSelectedRemision(null);
  };

  const handleConfirmEstado = () => {
    if (!selectedRemision || !nuevoEstado) return;

    setRemisiones(remisiones.map(remision =>
      remision.id === selectedRemision.id
        ? { ...remision, estado: nuevoEstado }
        : remision
    ));
    toast.success('Estado de remisión actualizado exitosamente');
    setIsConfirmEstadoModalOpen(false);
    setSelectedRemision(null);
    setNuevoEstado(null);
  };

  const openEditModal = (remision: Remision) => {
    setSelectedRemision(remision);
    setFormData({
      numeroRemision: remision.numeroRemision,
      ordenVenta: remision.ordenVenta,
      cliente: remision.cliente,
      fecha: remision.fecha,
      estado: remision.estado,
      items: remision.items,
      total: remision.total,
      observaciones: remision.observaciones
    });
    // Cargar productos de la remisión
    if (remision.productos) {
      setProductosRemision(remision.productos.map(p => ({ ...p })));
    }
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (remision: Remision) => {
    setSelectedRemision(remision);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (remision: Remision) => {
    setSelectedRemision(remision);
    setIsViewModalOpen(true);
  };

  const openConfirmEstadoModal = (remision: Remision) => {
    setSelectedRemision(remision);
    setNuevoEstado(remision.estado);
    setIsConfirmEstadoModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      numeroRemision: '',
      ordenVenta: '',
      cliente: '',
      fecha: '',
      estado: 'Pendiente',
      items: 0,
      total: 0,
      observaciones: ''
    });
    setProductosRemision([]);
    setSelectedProductoId('');
    setCantidadProducto(1);
    setPrecioProducto(0);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'Pendiente': { class: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Aprobada': { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      'Facturada': { class: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Anulada': { class: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };
    return badges[estado as keyof typeof badges] || badges['Pendiente'];
  };

  // Función para obtener el siguiente estado permitido
  const getSiguienteEstado = (estadoActual: 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada'): 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada' | null => {
    const flujoEstados: { [key: string]: 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada' | null } = {
      'Pendiente': 'Aprobada',
      'Aprobada': 'Facturada',
      'Facturada': null,  // Estado final
      'Anulada': null  // Estado final
    };
    return flujoEstados[estadoActual] || null;
  };

  // Función para manejar el clic en el estado
  const handleEstadoClick = (remision: Remision) => {
    const siguienteEstado = getSiguienteEstado(remision.estado);
    
    if (!siguienteEstado) {
      if (remision.estado === 'Facturada') {
        toast.info('Esta remisión ya está en estado final (Facturada)');
      } else if (remision.estado === 'Anulada') {
        toast.info('Esta remisión está anulada');
      }
      return;
    }

    setSelectedRemision(remision);
    setNuevoEstado(siguienteEstado);
    setIsConfirmEstadoModalOpen(true);
  };

  // Función para generar PDF de la remisión
  const generarPDF = (remision: Remision, incluirPrecios: boolean = true) => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REMISIÓN DE VENTA', 105, 20, { align: 'center' });
    
    // Información de la remisión
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Columna izquierda
    doc.text(`N° Remisión: ${remision.numeroRemision}`, 20, 40);
    doc.text(`Orden de Venta: ${remision.ordenVenta}`, 20, 46);
    doc.text(`Cliente: ${remision.cliente}`, 20, 52);
    
    // Columna derecha
    doc.text(`Fecha: ${new Date(remision.fecha).toLocaleDateString('es-CO')}`, 120, 40);
    doc.text(`Estado: ${remision.estado}`, 120, 46);
    doc.text(`Items: ${remision.items}`, 120, 52);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    // Tabla de productos
    if (remision.productos && remision.productos.length > 0) {
      let tableData, tableHeaders, columnStyles;
      
      if (incluirPrecios) {
        tableData = remision.productos.map(p => [
          p.producto.nombre,
          p.cantidad.toString(),
          `$${p.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
          `$${p.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
        ]);
        tableHeaders = [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']];
        columnStyles = {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        };
      } else {
        tableData = remision.productos.map(p => [
          p.producto.nombre,
          p.cantidad.toString()
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
      doc.text(`$${remision.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, 190, totalesY, { align: 'right' });
    }
    
    // Observaciones
    if (remision.observaciones) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const obsY = incluirPrecios ? totalesY + 20 : totalesY + 10;
      doc.text('Observaciones:', 20, obsY);
      const splitObservaciones = doc.splitTextToSize(remision.observaciones, 170);
      doc.text(splitObservaciones, 20, obsY + 6);
    }
    
    // Pie de página
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generado el ${new Date().toLocaleString('es-CO')}`, 105, pageHeight - 10, { align: 'center' });

    // Descargar
    const suffix = incluirPrecios ? '' : '_SinPrecios';
    doc.save(`Remision_${remision.numeroRemision}${suffix}.pdf`);
    toast.success('PDF descargado exitosamente');
  };
  
  const openPdfOptionsModal = (remision: Remision) => {
    setRemisionParaPdf(remision);
    setIsPdfOptionsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-green-100 text-sm">Aprobadas</p>
              <p className="text-3xl mt-2">{stats.aprobadas}</p>
            </div>
            <CheckCircle className="text-green-200" size={40} />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por remisión, orden, cliente, estado o número de items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus size={20} className="mr-2" />
            Nueva Remisión
          </Button>
        </div>
      </div>

      {/* Tabla de remisiones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>N° Remisión</TableHead>
                <TableHead>Orden de Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRemisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron remisiones de venta</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentRemisiones.map((remision, index) => (
                  <TableRow key={remision.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{remision.numeroRemision}</TableCell>
                    <TableCell>{remision.ordenVenta}</TableCell>
                    <TableCell>{remision.cliente}</TableCell>
                    <TableCell>{new Date(remision.fecha).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{remision.items}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        remision.estado === 'Pendiente' 
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : remision.estado === 'Aprobada'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : remision.estado === 'Facturada'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }>
                        {remision.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(remision)}
                          className="hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(remision)}
                          className="hover:bg-yellow-50"
                          title="Editar"
                        >
                          <Edit size={16} className="text-yellow-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(remision)}
                          className="hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfOptionsModal(remision)}
                          className="hover:bg-gray-50"
                          title="Descargar PDF"
                        >
                          <Download size={16} className="text-gray-600" />
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
        {filteredRemisiones.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRemisiones.length)} de{' '}
              {filteredRemisiones.length} remisiones
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Modal Crear */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[85vw] max-h-[90vh] overflow-y-auto" aria-describedby="create-remision-venta-description">
          <DialogHeader>
            <DialogTitle>Nueva Remisión de Venta</DialogTitle>
            <DialogDescription id="create-remision-venta-description" className="sr-only">
              Formulario para crear una nueva remisión de venta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Sección de información básica */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">Número de Remisión</Label>
                <Input
                  id="numeroRemision"
                  value={generarNumeroRemision()}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <select
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData.filter(c => c.estado === 'Activo').map(cliente => (
                    <option key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordenVenta">Orden de Venta *</Label>
                <select
                  id="ordenVenta"
                  value={formData.ordenVenta}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenesFiltradas.map(orden => (
                    <option key={orden.id} value={orden.numeroOrden}>
                      {orden.numeroOrden} - {orden.cliente}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Sección de agregar productos */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Agregar Productos</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="producto">Producto</Label>
                  <select
                    id="producto"
                    value={selectedProductoId}
                    onChange={(e) => setSelectedProductoId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productosActivos.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio Unitario</Label>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <Button 
                    type="button"
                    onClick={agregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de productos agregados */}
            {productosRemision.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Productos en la Remisión</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="w-20">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosRemision.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell>{item.producto.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(item.producto.id)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-medium">
                          ${calcularTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Remisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[85vw] max-h-[90vh] overflow-y-auto" aria-describedby="edit-remision-venta-description">
          <DialogHeader>
            <DialogTitle>Editar Remisión de Venta</DialogTitle>
            <DialogDescription id="edit-remision-venta-description" className="sr-only">
              Formulario para editar la remisión de venta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Sección de información básica */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numeroRemision">Número de Remisión</Label>
                <Input
                  id="edit-numeroRemision"
                  value={formData.numeroRemision}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado *</Label>
                <select
                  id="edit-estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Pendiente' | 'Aprobada' | 'Facturada' | 'Anulada' })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Facturada">Facturada</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fecha">Fecha</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={formData.fecha}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cliente">Cliente *</Label>
                <select
                  id="edit-cliente"
                  value={formData.cliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientesData.filter(c => c.estado === 'Activo').map(cliente => (
                    <option key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ordenVenta">Orden de Venta *</Label>
                <select
                  id="edit-ordenVenta"
                  value={formData.ordenVenta}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenesFiltradas.map(orden => (
                    <option key={orden.id} value={orden.numeroOrden}>
                      {orden.numeroOrden} - {orden.cliente}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observaciones">Observaciones</Label>
              <Input
                id="edit-observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Sección de agregar productos */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Agregar Productos</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-producto">Producto</Label>
                  <select
                    id="edit-producto"
                    value={selectedProductoId}
                    onChange={(e) => setSelectedProductoId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productosActivos.map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad">Cantidad</Label>
                  <Input
                    id="edit-cantidad"
                    type="number"
                    min="1"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-precio">Precio Unitario</Label>
                  <Input
                    id="edit-precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioProducto}
                    onChange={(e) => setPrecioProducto(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <Button 
                    type="button"
                    onClick={agregarProducto}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de productos agregados */}
            {productosRemision.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Productos en la Remisión</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="w-20">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosRemision.map((item) => (
                        <TableRow key={item.producto.id}>
                          <TableCell>{item.producto.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(item.producto.id)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-medium">
                          ${calcularTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedRemision(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalle */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" aria-describedby="view-remision-venta-description">
          <DialogHeader>
            <DialogTitle>Detalle de Remisión de Venta</DialogTitle>
            <DialogDescription id="view-remision-venta-description" className="sr-only">
              Detalles completos de la remisión de venta
            </DialogDescription>
          </DialogHeader>
          {selectedRemision && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Remisión</p>
                  <p className="font-semibold">{selectedRemision.numeroRemision}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orden de Venta</p>
                  <p className="font-semibold">{selectedRemision.ordenVenta}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">{selectedRemision.cliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">{selectedRemision.fecha}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cantidad de Items</p>
                  <p className="font-semibold">{selectedRemision.items}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${getEstadoBadge(selectedRemision.estado).class}`}>
                    {selectedRemision.estado}
                  </span>
                </div>
              </div>

              {/* Tabla de productos */}
              {selectedRemision.productos && selectedRemision.productos.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Productos</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRemision.productos.map((item) => (
                          <TableRow key={item.producto.id}>
                            <TableCell>{item.producto.nombre}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>${item.precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold text-blue-600">${selectedRemision.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              {selectedRemision.observaciones && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Observaciones</p>
                  <p className="mt-1">{selectedRemision.observaciones}</p>
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
        <DialogContent className="max-w-md" aria-describedby="delete-remision-venta-description">
          <DialogHeader>
            <DialogTitle>Eliminar Remisión</DialogTitle>
            <DialogDescription id="delete-remision-venta-description">
              ¿Estás seguro de que deseas eliminar esta remisión de venta?
            </DialogDescription>
          </DialogHeader>
          {selectedRemision && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Se eliminará la remisión <span className="font-medium text-gray-900">{selectedRemision.numeroRemision}</span>.
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

      {/* Modal Confirmar Cambio de Estado */}
      <Dialog open={isConfirmEstadoModalOpen} onOpenChange={setIsConfirmEstadoModalOpen}>
        <DialogContent className="max-w-md" aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Deseas cambiar el estado de esta remisión?
            </DialogDescription>
          </DialogHeader>
          {selectedRemision && nuevoEstado && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                La remisión <span className="font-medium text-gray-900">{selectedRemision.numeroRemision}</span> pasará de{' '}
                <span className="font-medium text-gray-900">{selectedRemision.estado}</span> a{' '}
                <span className="font-medium text-blue-600">{nuevoEstado}</span>.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmEstadoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado} className="bg-blue-600 hover:bg-blue-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Opciones de PDF */}
      <Dialog open={isPdfOptionsModalOpen} onOpenChange={setIsPdfOptionsModalOpen}>
        <DialogContent className="max-w-md" aria-describedby="pdf-options-description">
          <DialogHeader>
            <DialogTitle>Opciones de PDF</DialogTitle>
            <DialogDescription id="pdf-options-description">
              Selecciona cómo deseas generar el PDF de la remisión.
            </DialogDescription>
          </DialogHeader>
          {remisionParaPdf && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Generar PDF para la remisión <span className="font-medium text-gray-900">{remisionParaPdf.numeroRemision}</span>.
              </p>
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => { generarPDF(remisionParaPdf, true); setIsPdfOptionsModalOpen(false); }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download size={16} className="mr-2" />
                  Incluir Precios
                </Button>
                <Button
                  onClick={() => { generarPDF(remisionParaPdf, false); setIsPdfOptionsModalOpen(false); }}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <Download size={16} className="mr-2" />
                  Sin Precios
                </Button>
              </div>
            </div>
          )}
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