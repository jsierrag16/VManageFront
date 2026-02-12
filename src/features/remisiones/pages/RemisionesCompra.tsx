import { useState, useMemo, useEffect, useRef } from 'react';
import { FileText, Search, Plus, Edit, Trash2, Eye, CheckCircle, Clock, ChevronLeft, ChevronRight, Package, X, Barcode, Download } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { productosData as initialProductosData, Producto } from '../../../data/productos';
import { comprasData } from '../../compras/pages/Compras';
import { useProductos } from '../../../shared/context/ProductosContext';

interface ItemRemision {
  producto: string;
  productoNombre: string;
  numeroLote: string;
  cantidad: number;
  fechaVencimiento: string;
}

interface RemisionCompra {
  id: number;
  numeroRemision: string;
  ordenCompra: string;
  proveedor: string;
  fecha: string;
  estado: 'Pendiente' | 'Aprobada';
  items: ItemRemision[];
  total: number;
  observaciones: string;
}

const remisionesCompraData: RemisionCompra[] = [
  {
    id: 1,
    numeroRemision: 'RC-001',
    ordenCompra: 'OC-001',
    proveedor: 'Alimentos San José S.A.',
    fecha: '2024-01-15',
    estado: 'Aprobada',
    items: [
      { producto: 'PROD-001', productoNombre: 'Concentrado Inicial Lechones', numeroLote: 'AL-2024-001', cantidad: 100, fechaVencimiento: '2025-06-15' }
    ],
    total: 5650.00,
    observaciones: 'Mercancía recibida conforme'
  },
  {
    id: 2,
    numeroRemision: 'RC-002',
    ordenCompra: 'OC-002',
    proveedor: 'Veterinaria La Esperanza',
    fecha: '2024-01-14',
    estado: 'Aprobada',
    items: [
      { producto: 'PROD-004', productoNombre: 'Vitamina ADE Inyectable', numeroLote: 'VIT-2024-034', cantidad: 50, fechaVencimiento: '2026-02-10' }
    ],
    total: 2825.00,
    observaciones: 'Ingresado a inventario'
  },
  {
    id: 3,
    numeroRemision: 'RC-003',
    ordenCompra: 'OC-003',
    proveedor: 'Distribuidora Agropecuaria',
    fecha: '2024-01-16',
    estado: 'Pendiente',
    items: [
      { producto: 'PROD-002', productoNombre: 'Concentrado Levante', numeroLote: 'AL-2024-012', cantidad: 150, fechaVencimiento: '2025-07-30' }
    ],
    total: 9605.00,
    observaciones: 'Esperando recepción'
  },
  {
    id: 4,
    numeroRemision: 'RC-004',
    ordenCompra: 'OC-004',
    proveedor: 'Suplementos Nutricionales',
    fecha: '2024-01-13',
    estado: 'Aprobada',
    items: [
      { producto: 'PROD-012', productoNombre: 'Premezcla Minerales', numeroLote: 'VIT-2024-113', cantidad: 75, fechaVencimiento: '2026-09-10' }
    ],
    total: 3616.00,
    observaciones: 'Procesado completamente'
  },
  {
    id: 5,
    numeroRemision: 'RC-005',
    ordenCompra: 'OC-005',
    proveedor: 'Alimentos San José S.A.',
    fecha: '2024-01-12',
    estado: 'Pendiente',
    items: [
      { producto: 'PROD-003', productoNombre: 'Concentrado Engorde', numeroLote: 'AL-2024-023', cantidad: 80, fechaVencimiento: '2025-08-25' }
    ],
    total: 1695.00,
    observaciones: 'Pendiente de aprobación'
  }
];

export default function RemisionesCompra() {
  const { productos } = useProductos();
  const [searchTerm, setSearchTerm] = useState('');
  const [remisiones, setRemisiones] = useState<RemisionCompra[]>(remisionesCompraData);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmEstadoModalOpen, setIsConfirmEstadoModalOpen] = useState(false);
  const [selectedRemision, setSelectedRemision] = useState<RemisionCompra | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'Pendiente' | 'Aprobada' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form data
  const [formData, setFormData] = useState({
    numeroRemision: '',
    ordenCompra: '',
    proveedor: '',
    fecha: '',
    observaciones: ''
  });

  // Items de la remisión
  const [items, setItems] = useState<ItemRemision[]>([]);

  // Formulario de item actual
  const [currentProducto, setCurrentProducto] = useState('');
  const [currentNumeroLote, setCurrentNumeroLote] = useState('');
  const [currentCantidad, setCurrentCantidad] = useState('');
  const [currentFechaVencimiento, setCurrentFechaVencimiento] = useState('');

  // Estado para el lector de código de barras
  const [codigoBarras, setCodigoBarras] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Filtrar remisiones por búsqueda
  const filteredRemisiones = useMemo(() => {
    return remisiones.filter(remision =>
      remision.numeroRemision.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.ordenCompra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remision.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Generar número de remisión automático al abrir el modal de crear
  useEffect(() => {
    if (isCreateModalOpen) {
      // Generar el siguiente número de remisión
      const ultimaRemision = remisiones.length > 0 
        ? remisiones.reduce((max, r) => {
            const num = parseInt(r.numeroRemision.split('-')[1]);
            return num > max ? num : max;
          }, 0)
        : 0;
      
      const siguienteNumero = ultimaRemision + 1;
      const nuevoNumeroRemision = `RC-${String(siguienteNumero).padStart(3, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        numeroRemision: nuevoNumeroRemision
      }));
    }
  }, [isCreateModalOpen, remisiones]);

  // Manejar selección de orden de compra
  const handleOrdenCompraChange = (numeroOrden: string) => {
    const ordenSeleccionada = comprasData.find(c => c.numeroOrden === numeroOrden);
    
    if (ordenSeleccionada) {
      setFormData(prev => ({
        ...prev,
        ordenCompra: numeroOrden,
        proveedor: ordenSeleccionada.proveedor
      }));
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalRemisiones = remisiones.length;
    const pendientes = remisiones.filter(r => r.estado === 'Pendiente').length;
    const aprobadas = remisiones.filter(r => r.estado === 'Aprobada').length;
    
    return { totalRemisiones, pendientes, aprobadas };
  }, [remisiones]);

  const handleAddItem = () => {
    if (!currentProducto || !currentNumeroLote || !currentCantidad || !currentFechaVencimiento) {
      toast.error('Por favor completa todos los campos del producto');
      return;
    }

    const cantidad = parseInt(currentCantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error('La cantidad debe ser un número positivo');
      return;
    }

    const producto = productos.find(p => p.id === currentProducto);
    if (!producto) {
      toast.error('Producto no encontrado');
      return;
    }

    const nuevoItem: ItemRemision = {
      producto: currentProducto,
      productoNombre: producto.nombre,
      numeroLote: currentNumeroLote,
      cantidad: cantidad,
      fechaVencimiento: currentFechaVencimiento
    };

    setItems([...items, nuevoItem]);
    
    // Limpiar formulario de item
    setCurrentProducto('');
    setCurrentNumeroLote('');
    setCurrentCantidad('');
    setCurrentFechaVencimiento('');

    toast.success('Producto agregado a la remisión');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Producto eliminado de la remisión');
  };

  const handleCreate = () => {
    if (!formData.numeroRemision || !formData.ordenCompra || !formData.proveedor || !formData.fecha) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (items.length === 0) {
      toast.error('Debe agregar al menos un producto a la remisión');
      return;
    }

    const nuevaRemision: RemisionCompra = {
      id: remisiones.length + 1,
      numeroRemision: formData.numeroRemision,
      ordenCompra: formData.ordenCompra,
      proveedor: formData.proveedor,
      fecha: formData.fecha,
      estado: 'Pendiente',
      items: items,
      total: 0, // Puede calcularse según precios
      observaciones: formData.observaciones
    };

    setRemisiones([...remisiones, nuevaRemision]);
    toast.success('Remisión de compra creada exitosamente');
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!selectedRemision || !formData.numeroRemision || !formData.proveedor) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (items.length === 0) {
      toast.error('Debe agregar al menos un producto a la remisión');
      return;
    }

    setRemisiones(remisiones.map(remision =>
      remision.id === selectedRemision.id
        ? { 
            ...remision, 
            numeroRemision: formData.numeroRemision,
            ordenCompra: formData.ordenCompra,
            proveedor: formData.proveedor,
            fecha: formData.fecha,
            items: items,
            observaciones: formData.observaciones
          }
        : remision
    ));
    toast.success('Remisión de compra actualizada exitosamente');
    setIsEditModalOpen(false);
    setSelectedRemision(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedRemision) return;

    setRemisiones(remisiones.filter(remision => remision.id !== selectedRemision.id));
    toast.success('Remisión de compra eliminada exitosamente');
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

    // Si se aprueba la remisión, se agregarían las existencias al inventario
    if (nuevoEstado === 'Aprobada') {
      toast.success('Remisión aprobada y existencias agregadas al inventario');
    } else {
      toast.success('Estado de remisión actualizado exitosamente');
    }

    setIsConfirmEstadoModalOpen(false);
    setSelectedRemision(null);
    setNuevoEstado(null);
  };

  const openEditModal = (remision: RemisionCompra) => {
    setSelectedRemision(remision);
    setFormData({
      numeroRemision: remision.numeroRemision,
      ordenCompra: remision.ordenCompra,
      proveedor: remision.proveedor,
      fecha: remision.fecha,
      observaciones: remision.observaciones
    });
    setItems(remision.items);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (remision: RemisionCompra) => {
    setSelectedRemision(remision);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (remision: RemisionCompra) => {
    setSelectedRemision(remision);
    setIsViewModalOpen(true);
  };

  const openConfirmEstadoModal = (remision: RemisionCompra) => {
    setSelectedRemision(remision);
    setNuevoEstado(remision.estado);
    setIsConfirmEstadoModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      numeroRemision: '',
      ordenCompra: '',
      proveedor: '',
      fecha: '',
      observaciones: ''
    });
    setItems([]);
    setCurrentProducto('');
    setCurrentNumeroLote('');
    setCurrentCantidad('');
    setCurrentFechaVencimiento('');
    setCodigoBarras('');
  };

  // Función para manejar el escaneo del código de barras
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!codigoBarras.trim()) {
        return;
      }

      // Buscar el producto por código de barras
      const productoEncontrado = productos.find(
        (p) => p.codigoBarras === codigoBarras.trim() && p.estado
      );

      if (productoEncontrado) {
        setCurrentProducto(productoEncontrado.id);
        toast.success(`Producto encontrado: ${productoEncontrado.nombre}`);
        setCodigoBarras('');
        
        // Enfocar el campo de número de lote después de un pequeño delay
        setTimeout(() => {
          const numeroLoteInput = document.getElementById('numeroLote') as HTMLInputElement;
          if (numeroLoteInput) {
            numeroLoteInput.focus();
          }
        }, 100);
      } else {
        toast.error('Producto no encontrado con ese código de barras');
        setCodigoBarras('');
      }
    }
  };

  // Función para descargar las remisiones de compra en formato CSV
  const handleDescargarRemisiones = () => {
    try {
      // Crear encabezados del CSV
      const headers = ['N° Remisión', 'Orden de Compra', 'Proveedor', 'Fecha', 'Estado', 'Items', 'Total', 'Observaciones'];
      
      // Crear filas de datos
      const rows = filteredRemisiones.map(remision => [
        remision.numeroRemision,
        remision.ordenCompra,
        remision.proveedor,
        new Date(remision.fecha).toLocaleDateString('es-CO'),
        remision.estado,
        remision.items.length.toString(),
        `$${remision.total.toFixed(2)}`,
        remision.observaciones || 'N/A'
      ]);
      
      // Combinar encabezados y filas
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `remisiones_compra_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Remisiones descargadas exitosamente');
    } catch (error) {
      toast.error('Error al descargar las remisiones');
      console.error('Error al descargar:', error);
    }
  };

  // Función para descargar una remisión individual en formato CSV
  const handleDescargarRemision = (remision: RemisionCompra) => {
    try {
      // Crear contenido del CSV con información detallada
      const csvLines = [
        'REMISIÓN DE COMPRA',
        '',
        'INFORMACIÓN GENERAL',
        `Número de Remisión,${remision.numeroRemision}`,
        `Orden de Compra,${remision.ordenCompra}`,
        `Proveedor,${remision.proveedor}`,
        `Fecha,${new Date(remision.fecha).toLocaleDateString('es-CO')}`,
        `Estado,${remision.estado}`,
        `Total,$${remision.total.toFixed(2)}`,
        `Observaciones,"${remision.observaciones || 'N/A'}"`,
        '',
        'PRODUCTOS',
        'Producto,Lote,Cantidad,Fecha Vencimiento',
        ...remision.items.map(item => 
          `"${item.productoNombre}",${item.numeroLote},${item.cantidad},${new Date(item.fechaVencimiento).toLocaleDateString('es-CO')}`
        )
      ];
      
      const csvContent = csvLines.join('\n');
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `remision_${remision.numeroRemision}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Remisión ${remision.numeroRemision} descargada exitosamente`);
    } catch (error) {
      toast.error('Error al descargar la remisión');
      console.error('Error al descargar:', error);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'Pendiente': { class: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Aprobada': { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle }
    };
    return badges[estado as keyof typeof badges] || badges['Pendiente'];
  };

  // Función para obtener el siguiente estado permitido
  const getSiguienteEstado = (estadoActual: 'Pendiente' | 'Aprobada'): 'Pendiente' | 'Aprobada' | null => {
    const flujoEstados: { [key: string]: 'Pendiente' | 'Aprobada' | null } = {
      'Pendiente': 'Aprobada',
      'Aprobada': null  // Estado final
    };
    return flujoEstados[estadoActual] || null;
  };

  // Función para manejar el clic en el estado
  const handleEstadoClick = (remision: RemisionCompra) => {
    const siguienteEstado = getSiguienteEstado(remision.estado);
    
    if (!siguienteEstado) {
      if (remision.estado === 'Aprobada') {
        toast.info('Esta remisión ya está en estado final (Aprobada)');
      }
      return;
    }

    setSelectedRemision(remision);
    setNuevoEstado(siguienteEstado);
    setIsConfirmEstadoModalOpen(true);
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
              placeholder="Buscar por remisión, orden, proveedor, estado o número de items..."
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
                <TableHead>Orden de Compra</TableHead>
                <TableHead>Proveedor</TableHead>
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
                    <TableCell>{new Date(remision.fecha).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{remision.items.length}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          remision.estado === 'Pendiente' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200 cursor-pointer hover:bg-yellow-200' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }
                        onClick={() => handleEstadoClick(remision)}
                      >
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
                          onClick={() => handleDescargarRemision(remision)}
                          className="hover:bg-green-50"
                          title="Descargar"
                        >
                          <Download size={16} className="text-green-600" />
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="create-remision-compra-description">
          <DialogHeader>
            <DialogTitle>Nueva Remisión de Compra</DialogTitle>
            <DialogDescription id="create-remision-compra-description" className="sr-only">
              Formulario para crear una nueva remisión de compra
            </DialogDescription>
          </DialogHeader>
          
          {/* Información General */}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroRemision">Número de Remisión *</Label>
                <Input
                  id="numeroRemision"
                  value={formData.numeroRemision}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="RC-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordenCompra">Orden de Compra *</Label>
                <Select value={formData.ordenCompra} onValueChange={handleOrdenCompraChange}>
                  <SelectTrigger id="ordenCompra">
                    <SelectValue placeholder="Seleccionar orden de compra" />
                  </SelectTrigger>
                  <SelectContent>
                    {comprasData.map((compra) => (
                      <SelectItem key={compra.numeroOrden} value={compra.numeroOrden}>
                        {compra.numeroOrden} - {compra.proveedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor *</Label>
                <Input
                  id="proveedor"
                  value={formData.proveedor}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold">Productos de la Remisión</h3>
              </div>

              {/* Campo de Lector de Código de Barras */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Barcode size={20} className="text-blue-600" />
                  <Label htmlFor="codigoBarras" className="text-blue-900">Lector de Código de Barras</Label>
                </div>
                <div className="relative">
                  <Input
                    id="codigoBarras"
                    ref={barcodeInputRef}
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanee el código de barras del producto..."
                    className="pr-10 bg-white border-blue-300 focus:border-blue-500"
                  />
                  <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Escanee el código de barras para seleccionar el producto automáticamente
                </p>
              </div>

              {/* Formulario para agregar producto */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <Select value={currentProducto} onValueChange={setCurrentProducto}>
                      <SelectTrigger id="producto">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.filter(p => p.estado).map((producto) => (
                          <SelectItem key={producto.id} value={producto.id}>
                            {producto.nombre}
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
                      placeholder="Ej: AL-2024-001"
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
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                    <Input
                      id="fechaVencimiento"
                      type="date"
                      value={currentFechaVencimiento}
                      onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddItem}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {/* Lista de productos agregados */}
              {items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{new Date(item.fechaVencimiento).toLocaleDateString('es-CO')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Agrega productos usando el formulario anterior</p>
                </div>
              )}
            </div>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-remision-compra-description">
          <DialogHeader>
            <DialogTitle>Editar Remisión de Compra</DialogTitle>
            <DialogDescription id="edit-remision-compra-description" className="sr-only">
              Formulario para editar la remisión de compra
            </DialogDescription>
          </DialogHeader>
          
          {/* Información General */}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numeroRemision">Número de Remisión *</Label>
                <Input
                  id="edit-numeroRemision"
                  value={formData.numeroRemision}
                  onChange={(e) => setFormData({ ...formData, numeroRemision: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ordenCompra">Orden de Compra *</Label>
                <Input
                  id="edit-ordenCompra"
                  value={formData.ordenCompra}
                  onChange={(e) => setFormData({ ...formData, ordenCompra: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-proveedor">Proveedor *</Label>
                <Input
                  id="edit-proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fecha">Fecha *</Label>
                <Input
                  id="edit-fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Input
                  id="edit-observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
            </div>

            {/* Sección de Productos */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Package size={20} className="text-blue-600" />
                <h3 className="font-semibold">Productos de la Remisión</h3>
              </div>

              {/* Formulario para agregar producto */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-producto">Producto *</Label>
                    <Select value={currentProducto} onValueChange={setCurrentProducto}>
                      <SelectTrigger id="edit-producto">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.filter(p => p.estado).map((producto) => (
                          <SelectItem key={producto.id} value={producto.id}>
                            {producto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-numeroLote">Número de Lote *</Label>
                    <Input
                      id="edit-numeroLote"
                      value={currentNumeroLote}
                      onChange={(e) => setCurrentNumeroLote(e.target.value)}
                      placeholder="Ej: AL-2024-001"
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
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fechaVencimiento">Fecha de Vencimiento *</Label>
                    <Input
                      id="edit-fechaVencimiento"
                      type="date"
                      value={currentFechaVencimiento}
                      onChange={(e) => setCurrentFechaVencimiento(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddItem}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {/* Lista de productos agregados */}
              {items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{new Date(item.fechaVencimiento).toLocaleDateString('es-CO')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="hover:bg-red-50"
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Agrega productos usando el formulario anterior</p>
                </div>
              )}
            </div>
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
        <DialogContent className="max-w-3xl" aria-describedby="view-remision-compra-description">
          <DialogHeader>
            <DialogTitle>Detalle de Remisión de Compra</DialogTitle>
            <DialogDescription id="view-remision-compra-description" className="sr-only">
              Detalles completos de la remisión de compra
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
                  <p className="text-sm text-gray-600">Orden de Compra</p>
                  <p className="font-semibold">{selectedRemision.ordenCompra}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="font-semibold">{selectedRemision.proveedor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">{new Date(selectedRemision.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant="outline" className={getEstadoBadge(selectedRemision.estado).class}>
                    {selectedRemision.estado}
                  </Badge>
                </div>
              </div>

              {/* Productos */}
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
                        <TableHead>Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRemision.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productoNombre}</TableCell>
                          <TableCell>{item.numeroLote}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>{new Date(item.fechaVencimiento).toLocaleDateString('es-CO')}</TableCell>
                        </TableRow>
                      ))}
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
        <DialogContent aria-describedby="delete-remision-compra-description">
          <DialogHeader>
            <DialogTitle>Eliminar Remisión de Compra</DialogTitle>
            <DialogDescription id="delete-remision-compra-description">
              ¿Estás seguro de que deseas eliminar esta remisión de compra? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedRemision && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión: <span className="font-semibold">{selectedRemision.numeroRemision}</span>
              </p>
              <p className="text-sm text-gray-600">
                Proveedor: <span className="font-semibold">{selectedRemision.proveedor}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setSelectedRemision(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Cambio de Estado */}
      <Dialog open={isConfirmEstadoModalOpen} onOpenChange={setIsConfirmEstadoModalOpen}>
        <DialogContent aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Remisión</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              {nuevoEstado === 'Aprobada' && 
                '¿Deseas aprobar esta remisión? Al aprobarla, se agregarán automáticamente las existencias al inventario.'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedRemision && nuevoEstado && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Remisión: <span className="font-semibold">{selectedRemision.numeroRemision}</span>
              </p>
              <p className="text-sm text-gray-600">
                Estado actual: <Badge variant="outline" className={getEstadoBadge(selectedRemision.estado).class}>
                  {selectedRemision.estado}
                </Badge>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Nuevo estado: <Badge variant="outline" className={getEstadoBadge(nuevoEstado).class}>
                  {nuevoEstado}
                </Badge>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsConfirmEstadoModalOpen(false); setSelectedRemision(null); setNuevoEstado(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado} className="bg-blue-600 hover:bg-blue-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}