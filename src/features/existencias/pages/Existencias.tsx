import { useState, useMemo, Fragment } from 'react';
import { Search, Eye, ChevronDown, ChevronRight, Plus, Package, ArrowRightLeft, ChevronLeft, CheckCircle, X, Edit2, Trash2, PlusCircle } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { Switch } from '../../../shared/components/ui/switch';
import { Textarea } from '../../../shared/components/ui/textarea';
import { toast } from 'sonner';
import { productosData as initialProductosData, Producto, Lote } from '../../../data/productos';
import { Traslado, TrasladoItem } from '../../../data/traslados';
import { Building2 } from 'lucide-react';
import { bodegasData } from '../../../data/bodegas';
import { usePermisos } from '../../../shared/hooks/usePermisos';
import { useTraslados } from '../../../shared/context/TrasladosContext';
import { useProductos } from '../../../shared/context/ProductosContext';

interface ExistenciasProps {
  triggerCreate?: number;
  selectedBodega?: string;
  onNavigateToTraslados?: () => void;
}

export default function Existencias({ triggerCreate, selectedBodega = 'Bodega Principal', onNavigateToTraslados }: ExistenciasProps) {
  const { usuario } = usePermisos();
  const { traslados, addTraslado } = useTraslados();
  const { productos, addProducto, updateProducto } = useProductos();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [lotesPages, setLotesPages] = useState<Record<string, number>>({});
  const [modalLotesPage, setModalLotesPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmTrasladoModal, setShowConfirmTrasladoModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [productoParaCambioEstado, setProductoParaCambioEstado] = useState<Producto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const lotesPerPage = 5;

  // Form states - Crear Producto
  const [formProductNombre, setFormProductNombre] = useState('');
  const [formProductCategoria, setFormProductCategoria] = useState('');
  const [formProductDescripcion, setFormProductDescripcion] = useState('');
  const [formProductIva, setFormProductIva] = useState('19');

  // Form states - Editar Producto
  const [editProductId, setEditProductId] = useState('');
  const [editProductNombre, setEditProductNombre] = useState('');
  const [editProductCategoria, setEditProductCategoria] = useState('');
  const [editProductDescripcion, setEditProductDescripcion] = useState('');
  const [editProductIva, setEditProductIva] = useState('19');



  // Form states - Traslado (multi-producto)
  const [formTrasladoBodegaOrigen, setFormTrasladoBodegaOrigen] = useState(selectedBodega);
  const [formTrasladoBodegaDestino, setFormTrasladoBodegaDestino] = useState('');
  const [formTrasladoObservaciones, setFormTrasladoObservaciones] = useState('');
  const [trasladoItems, setTrasladoItems] = useState<TrasladoItem[]>([]);
  
  // Form states para la línea actual del traslado
  const [currentProducto, setCurrentProducto] = useState('');
  const [currentLote, setCurrentLote] = useState('');
  const [currentCantidad, setCurrentCantidad] = useState('');

  // Obtener lotes disponibles del producto seleccionado en la bodega de origen
  const lotesDisponiblesTraslado = useMemo(() => {
    if (!currentProducto || !formTrasladoBodegaOrigen) return [];
    const producto = productos.find(p => p.id === currentProducto);
    if (!producto) return [];
    return producto.lotes.filter(lote => lote.bodega === formTrasladoBodegaOrigen && lote.cantidadDisponible > 0);
  }, [currentProducto, formTrasladoBodegaOrigen, productos]);

  // Obtener cantidad máxima disponible del lote seleccionado
  const cantidadMaximaTraslado = useMemo(() => {
    if (!currentLote) return 0;
    const lote = lotesDisponiblesTraslado.find(l => l.numeroLote === currentLote);
    return lote?.cantidadDisponible || 0;
  }, [currentLote, lotesDisponiblesTraslado]);

  // Filtrar productos - Búsqueda general en todas las columnas Y filtro por bodega
  const filteredProductos = useMemo(() => {
    return productos.filter((producto) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Filtrar lotes por bodega seleccionada (si no es "Todas las bodegas", mostrar todos)
      const lotesDeBodega = selectedBodega === 'Todas las bodegas' 
        ? producto.lotes 
        : producto.lotes.filter(lote => lote.bodega === selectedBodega);
      
      // Calcular stock de esta bodega para búsqueda
      const stockBodega = lotesDeBodega.reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
      
      // Si no hay término de búsqueda, mostrar todos los productos (con o sin lotes)
      if (!searchTerm.trim()) {
        return true;
      }
      
      // Buscar en campos del producto
      const productoMatch = 
        producto.id.toLowerCase().includes(searchLower) ||
        producto.nombre.toLowerCase().includes(searchLower) ||
        producto.categoria.toLowerCase().includes(searchLower) ||
        producto.descripcion.toLowerCase().includes(searchLower) ||
        producto.stockTotal.toString().includes(searchLower) ||
        stockBodega.toString().includes(searchLower) ||
        (producto.estado ? 'activo' : 'inactivo').includes(searchLower);
      
      // Buscar en campos de los lotes de esta bodega (solo si hay lotes)
      const lotesMatch = lotesDeBodega.length > 0 && lotesDeBodega.some((lote) =>
        lote.numeroLote.toLowerCase().includes(searchLower) ||
        lote.cantidadDisponible.toString().includes(searchLower) ||
        lote.fechaVencimiento.includes(searchLower) ||
        lote.bodega.toLowerCase().includes(searchLower)
      );
      
      return productoMatch || lotesMatch;
    }).map(producto => {
      // Calcular stock total solo de los lotes en esta bodega
      const lotesDeBodega = selectedBodega === 'Todas las bodegas'
        ? producto.lotes
        : producto.lotes.filter(lote => lote.bodega === selectedBodega);
      const stockBodega = lotesDeBodega.reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
      
      return {
        ...producto,
        lotes: lotesDeBodega,
        stockTotal: stockBodega
      };
    });
  }, [productos, searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, endIndex);

  // Paginación de lotes en modal
  const modalLotes = selectedProducto?.lotes || [];
  const totalModalLotesPages = Math.ceil(modalLotes.length / lotesPerPage);
  const modalLotesStartIndex = (modalLotesPage - 1) * lotesPerPage;
  const modalLotesEndIndex = modalLotesStartIndex + lotesPerPage;
  const currentModalLotes = modalLotes.slice(modalLotesStartIndex, modalLotesEndIndex);

  // Resetear a página 1 cuando cambia el filtro
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const handleView = (producto: Producto) => {
    setSelectedProducto(producto);
    setModalLotesPage(1);
    setShowViewModal(true);
  };

  const handleToggleEstado = (productId: string) => {
    const producto = productos.find((p) => p.id === productId);
    if (producto) {
      setProductoParaCambioEstado(producto);
      setShowConfirmEstadoModal(true);
    }
  };

  const handleConfirmEstado = () => {
    if (productoParaCambioEstado) {
      updateProducto(productoParaCambioEstado.id, { ...productoParaCambioEstado, estado: !productoParaCambioEstado.estado });
      toast.success(`Producto ${productoParaCambioEstado.estado ? 'desactivado' : 'activado'} exitosamente`);
      setShowConfirmEstadoModal(false);
      setProductoParaCambioEstado(null);
    }
  };

  const handleNuevoProducto = () => {
    setFormProductNombre('');
    setFormProductCategoria('');
    setFormProductDescripcion('');
    setFormProductIva('19');
    setShowCreateProductModal(true);
  };

  const handleEditProducto = (producto: Producto) => {
    setEditProductId(producto.id);
    setEditProductNombre(producto.nombre);
    setEditProductCategoria(producto.categoria);
    setEditProductDescripcion(producto.descripcion);
    setEditProductIva(producto.iva?.toString() || '19');
    setShowEditProductModal(true);
  };



  const handleTrasladar = () => {
    setFormTrasladoBodegaOrigen(selectedBodega);
    setFormTrasladoBodegaDestino('');
    setFormTrasladoObservaciones('');
    setTrasladoItems([]);
    setCurrentProducto('');
    setCurrentLote('');
    setCurrentCantidad('');
    setShowTrasladoModal(true);
  };

  const handleAddItemTraslado = () => {
    if (!currentProducto || !currentLote || !currentCantidad) {
      toast.error('Completa todos los campos del producto');
      return;
    }

    if (!/^[0-9]+$/.test(currentCantidad)) {
      toast.error('La cantidad debe ser un número entero positivo');
      return;
    }

    const cantidad = parseInt(currentCantidad);
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a cero');
      return;
    }

    if (cantidad > cantidadMaximaTraslado) {
      toast.error(`La cantidad no puede exceder ${cantidadMaximaTraslado} unidades disponibles`);
      return;
    }

    // Verificar si ya existe este producto/lote en la lista
    const existingItem = trasladoItems.find(
      item => item.productoId === currentProducto && item.loteNumero === currentLote
    );

    if (existingItem) {
      toast.error('Este producto/lote ya fue agregado. Elimínalo primero si deseas modificarlo.');
      return;
    }

    const producto = productos.find(p => p.id === currentProducto);
    const newItem: TrasladoItem = {
      productoId: currentProducto,
      productoNombre: producto?.nombre || '',
      loteNumero: currentLote,
      cantidad: cantidad,
    };

    setTrasladoItems([...trasladoItems, newItem]);
    setCurrentProducto('');
    setCurrentLote('');
    setCurrentCantidad('');
    toast.success('Producto agregado al traslado');
  };

  const handleRemoveItemTraslado = (index: number) => {
    const newItems = trasladoItems.filter((_, i) => i !== index);
    setTrasladoItems(newItems);
    toast.success('Producto eliminado del traslado');
  };

  const validateProductForm = () => {
    if (!formProductNombre.trim() || !formProductCategoria.trim() || !formProductDescripcion.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return false;
    }

    // Validar longitud mínima
    if (formProductNombre.trim().length < 3) {
      toast.error('El nombre del producto debe tener al menos 3 caracteres');
      return false;
    }

    if (formProductDescripcion.trim().length < 10) {
      toast.error('La descripción debe tener al menos 10 caracteres');
      return false;
    }

    // Validar caracteres inapropiados
    if (/[<>{}[\]\\\/]/.test(formProductNombre)) {
      toast.error('El nombre contiene caracteres no permitidos');
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(formProductDescripcion)) {
      toast.error('La descripción contiene caracteres no permitidos');
      return false;
    }

    // Validar que no haya solo números
    if (/^\d+$/.test(formProductNombre.trim())) {
      toast.error('El nombre del producto no puede contener solo números');
      return false;
    }

    // Validar que el nombre no exista ya
    const nombreExiste = productos.some(
      p => p.nombre.toLowerCase() === formProductNombre.trim().toLowerCase()
    );
    if (nombreExiste) {
      toast.error('Ya existe un producto con este nombre');
      return false;
    }

    return true;
  };

  const validateEditProductForm = () => {
    if (!editProductNombre.trim() || !editProductCategoria.trim() || !editProductDescripcion.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return false;
    }

    // Validar longitud mínima
    if (editProductNombre.trim().length < 3) {
      toast.error('El nombre del producto debe tener al menos 3 caracteres');
      return false;
    }

    if (editProductDescripcion.trim().length < 10) {
      toast.error('La descripción debe tener al menos 10 caracteres');
      return false;
    }

    // Validar caracteres inapropiados
    if (/[<>{}[\]\\\/]/.test(editProductNombre)) {
      toast.error('El nombre contiene caracteres no permitidos');
      return false;
    }

    if (/[<>{}[\]\\\/]/.test(editProductDescripcion)) {
      toast.error('La descripción contiene caracteres no permitidos');
      return false;
    }

    // Validar que no haya solo números
    if (/^\d+$/.test(editProductNombre.trim())) {
      toast.error('El nombre del producto no puede contener solo números');
      return false;
    }

    // Validar que el nombre no exista ya (excepto el actual)
    const nombreExiste = productos.some(
      p => p.id !== editProductId && p.nombre.toLowerCase() === editProductNombre.trim().toLowerCase()
    );
    if (nombreExiste) {
      toast.error('Ya existe un producto con este nombre');
      return false;
    }

    return true;
  };

  const validateTrasladoForm = () => {
    if (!formTrasladoBodegaOrigen || !formTrasladoBodegaDestino) {
      toast.error('Por favor completa las bodegas de origen y destino');
      return false;
    }

    if (formTrasladoBodegaOrigen === formTrasladoBodegaDestino) {
      toast.error('La bodega de origen y destino no pueden ser la misma');
      return false;
    }

    if (trasladoItems.length === 0) {
      toast.error('Debes agregar al menos un producto al traslado');
      return false;
    }

    return true;
  };

  const confirmCreateProduct = () => {
    if (!validateProductForm()) return;

    const newProduct: Producto = {
      id: `PROD-${String(productos.length + 1).padStart(3, '0')}`,
      nombre: formProductNombre.trim(),
      categoria: formProductCategoria.trim(),
      descripcion: formProductDescripcion.trim(),
      iva: parseFloat(formProductIva),
      stockTotal: 0,
      lotes: [],
      estado: true,
      codigoBarras: '', // Código de barras vacío por defecto
    };

    addProducto(newProduct);
    setShowCreateProductModal(false);
    setShowSuccessModal(true);
  };

  const confirmEditProduct = () => {
    if (!validateEditProductForm()) return;

    const productoActualizado = productos.find(p => p.id === editProductId);
    if (productoActualizado) {
      updateProducto(editProductId, { 
        ...productoActualizado, 
        nombre: editProductNombre.trim(),
        categoria: editProductCategoria.trim(),
        descripcion: editProductDescripcion.trim(),
        iva: parseFloat(editProductIva)
      });
    }

    setShowEditProductModal(false);
    toast.success('Producto actualizado exitosamente');
  };



  const confirmCreateTraslado = () => {
    if (!validateTrasladoForm()) return;
    setShowConfirmTrasladoModal(true);
  };

  const executeCreateTraslado = () => {
    const newTraslado: Traslado = {
      id: `TRS-${String(traslados.length + 1).padStart(3, '0')}`,
      codigo: `TRD-${String(traslados.length + 1).padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      bodegaOrigen: formTrasladoBodegaOrigen,
      bodegaDestino: formTrasladoBodegaDestino,
      items: [...trasladoItems],
      responsable: usuario?.nombreCompleto || 'Usuario',
      estado: 'Enviado',
      observaciones: formTrasladoObservaciones.trim() || undefined,
    };

    addTraslado(newTraslado);
    setShowConfirmTrasladoModal(false);
    setShowTrasladoModal(false);
    setShowSuccessModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLotesPageChange = (productId: string, page: number) => {
    setLotesPages({ ...lotesPages, [productId]: page });
  };

  const handleModalLotesPageChange = (page: number) => {
    setModalLotesPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  // Función para formatear fecha
  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Función para determinar color de vencimiento
  const getVencimientoColor = (fecha: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diasDiferencia = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasDiferencia < 0) return 'text-red-600 font-semibold'; // Vencido
    if (diasDiferencia <= 30) return 'text-orange-600 font-semibold'; // Próximo a vencer
    if (diasDiferencia <= 90) return 'text-yellow-600'; // Atención
    return 'text-gray-700'; // Normal
  };

  // Función para determinar color de cantidad
  const getCantidadColor = (cantidad: number) => {
    return cantidad < 50 ? 'text-red-600 font-semibold' : 'text-gray-900 font-semibold';
  };

  // Función para calcular total de items en traslado
  const calcularTotalItems = (items: TrasladoItem[]) => {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Existencias</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Administra el inventario y las existencias de productos
          </p>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Building2 size={14} className="mr-1" />
            {selectedBodega}
          </Badge>
        </div>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNuevoProducto} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Producto
        </Button>
        <Button onClick={handleTrasladar} className="bg-purple-600 hover:bg-purple-700">
          <ArrowRightLeft size={18} className="mr-2" />
          Trasladar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">IVA</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-40">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                currentProductos.map((producto, index) => {
                  const lotesPage = lotesPages[producto.id] || 1;
                  const totalLotesPages = Math.ceil(producto.lotes.length / lotesPerPage);
                  const lotesStartIndex = (lotesPage - 1) * lotesPerPage;
                  const lotesEndIndex = lotesStartIndex + lotesPerPage;
                  const currentLotes = producto.lotes.slice(lotesStartIndex, lotesEndIndex);

                  return (
                    <Fragment key={producto.id}>
                      {/* Fila principal del producto */}
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{producto.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {producto.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-gray-900">{producto.iva || 0}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={producto.stockTotal < 100 ? 'text-red-600 font-semibold' : 'font-semibold text-gray-900'}>
                            {producto.stockTotal}
                          </span>
                          {producto.stockTotal < 100 && (
                            <span className="block text-xs text-red-600">Stock bajo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleEstado(producto.id)}
                            className={
                              producto.estado
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }
                          >
                            {producto.estado ? 'Activo' : 'Inactivo'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(producto)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProducto(producto)}
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Editar producto"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleRow(producto.id)}
                              className="h-8 w-8 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                              title={expandedRows.has(producto.id) ? 'Contraer' : 'Expandir lotes'}
                            >
                              {expandedRows.has(producto.id) ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Fila expandida con detalles de lotes */}
                      {expandedRows.has(producto.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Lotes Disponibles ({producto.lotes.length} total{producto.lotes.length !== 1 ? 'es' : ''})
                              </h4>
                              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100">
                                      <TableHead className="text-xs">N° Lote</TableHead>
                                      <TableHead className="text-xs text-center">Cantidad por Lote</TableHead>
                                      <TableHead className="text-xs">Fecha de Vencimiento</TableHead>
                                      <TableHead className="text-xs">Bodega Asignada</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {producto.lotes.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-gray-500 text-sm">
                                          No hay lotes registrados
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      currentLotes.map((lote) => (
                                        <TableRow key={lote.id} className="text-sm">
                                          <TableCell className="font-mono">
                                            {lote.numeroLote}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <span className={getCantidadColor(lote.cantidadDisponible)}>
                                              {lote.cantidadDisponible}
                                            </span>
                                            {lote.cantidadDisponible < 50 && (
                                              <span className="block text-xs text-red-600">Stock bajo</span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <span className={getVencimientoColor(lote.fechaVencimiento)}>
                                              {formatFecha(lote.fechaVencimiento)}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                              {lote.bodega}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                                
                                {/* Paginación de lotes */}
                                {producto.lotes.length > lotesPerPage && (
                                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                                    <div className="text-xs text-gray-600">
                                      Mostrando {lotesStartIndex + 1} - {Math.min(lotesEndIndex, producto.lotes.length)} de {producto.lotes.length} lotes
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLotesPageChange(producto.id, lotesPage - 1)}
                                        disabled={lotesPage === 1}
                                        className="h-7 text-xs"
                                      >
                                        <ChevronLeft size={14} />
                                        Anterior
                                      </Button>
                                      <div className="flex items-center gap-1">
                                        {Array.from({ length: totalLotesPages }, (_, i) => i + 1).map((page) => (
                                          <Button
                                            key={page}
                                            variant={lotesPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleLotesPageChange(producto.id, page)}
                                            className="h-7 w-7 p-0 text-xs"
                                          >
                                            {page}
                                          </Button>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLotesPageChange(producto.id, lotesPage + 1)}
                                        disabled={lotesPage === totalLotesPages}
                                        className="h-7 text-xs"
                                      >
                                        Siguiente
                                        <ChevronRight size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación principal */}
        {filteredProductos.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProductos.length)} de {filteredProductos.length} productos
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

      {/* Modal Ver Detalles */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
            <DialogDescription id="dialog-description">
              Información completa del producto y sus existencias
            </DialogDescription>
          </DialogHeader>
          {selectedProducto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-mono font-semibold">{selectedProducto.id}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={selectedProducto.estado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {selectedProducto.estado ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Nombre</Label>
                <p className="font-semibold">{selectedProducto.nombre}</p>
              </div>
              <div>
                <Label className="text-gray-500">Categoría</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedProducto.categoria}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Descripción</Label>
                <p className="text-gray-700">{selectedProducto.descripcion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">IVA</Label>
                  <p className="font-semibold text-lg">{selectedProducto.iva || 0}%</p>
                </div>
                <div>
                  <Label className="text-gray-500">Stock Total</Label>
                  <p className="font-semibold text-lg">{selectedProducto.stockTotal} unidades</p>
                </div>
              </div>

              {/* Lista de lotes */}
              <div>
                <Label className="text-gray-500 mb-2 block">Lotes Disponibles ({modalLotes.length} total{modalLotes.length !== 1 ? 'es' : ''})</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">N° Lote</TableHead>
                        <TableHead className="text-xs text-center">Cantidad</TableHead>
                        <TableHead className="text-xs">Vencimiento</TableHead>
                        <TableHead className="text-xs">Bodega</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalLotes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500 text-sm">
                            No hay lotes registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentModalLotes.map((lote) => (
                          <TableRow key={lote.id} className="text-sm">
                            <TableCell className="font-mono">{lote.numeroLote}</TableCell>
                            <TableCell className="text-center">
                              <span className={getCantidadColor(lote.cantidadDisponible)}>
                                {lote.cantidadDisponible}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={getVencimientoColor(lote.fechaVencimiento)}>
                                {formatFecha(lote.fechaVencimiento)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {lote.bodega}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Paginación de lotes en modal */}
                  {modalLotes.length > lotesPerPage && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="text-xs text-gray-600">
                        Mostrando {modalLotesStartIndex + 1} - {Math.min(modalLotesEndIndex, modalLotes.length)} de {modalLotes.length} lotes
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModalLotesPageChange(modalLotesPage - 1)}
                          disabled={modalLotesPage === 1}
                          className="h-7 text-xs"
                        >
                          <ChevronLeft size={14} />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalModalLotesPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={modalLotesPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleModalLotesPageChange(page)}
                              className="h-7 w-7 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModalLotesPageChange(modalLotesPage + 1)}
                          disabled={modalLotesPage === totalModalLotesPages}
                          className="h-7 text-xs"
                        >
                          Siguiente
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Producto */}
      <Dialog open={showCreateProductModal} onOpenChange={(open) => {
        if (!open) setShowCreateProductModal(false);
      }}>
        <DialogContent className="max-w-6xl" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="create-product-description">
          <button
            onClick={() => setShowCreateProductModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <DialogDescription id="create-product-description">
              Registra un nuevo producto en el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-nombre">Nombre del Producto *</Label>
              <Input
                id="product-nombre"
                value={formProductNombre}
                onChange={(e) => setFormProductNombre(e.target.value)}
                placeholder="Ej: Paracetamol 500mg"
              />
            </div>
            <div>
              <Label htmlFor="product-categoria">Categoría *</Label>
              <Select value={formProductCategoria} onValueChange={setFormProductCategoria}>
                <SelectTrigger id="product-categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                  <SelectItem value="Equipos Médicos">Equipos Médicos</SelectItem>
                  <SelectItem value="Material de Curación">Material de Curación</SelectItem>
                  <SelectItem value="Alimentos">Alimentos</SelectItem>
                  <SelectItem value="Suplementos">Suplementos</SelectItem>
                  <SelectItem value="Insumos Veterinarios">Insumos Veterinarios</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="product-descripcion">Descripción *</Label>
              <Textarea
                id="product-descripcion"
                value={formProductDescripcion}
                onChange={(e) => setFormProductDescripcion(e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="product-iva">IVA (%) *</Label>
              <Select value={formProductIva} onValueChange={setFormProductIva}>
                <SelectTrigger id="product-iva">
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="19">19%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateProductModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCreateProduct} className="bg-blue-600 hover:bg-blue-700">
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Producto */}
      <Dialog open={showEditProductModal} onOpenChange={(open) => {
        if (!open) setShowEditProductModal(false);
      }}>
        <DialogContent className="max-w-6xl" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="edit-product-description">
          <button
            onClick={() => setShowEditProductModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription id="edit-product-description">
              Modifica la información del producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-nombre">Nombre del Producto *</Label>
              <Input
                id="edit-product-nombre"
                value={editProductNombre}
                onChange={(e) => setEditProductNombre(e.target.value)}
                placeholder="Ej: Paracetamol 500mg"
              />
            </div>
            <div>
              <Label htmlFor="edit-product-categoria">Categoría *</Label>
              <Select value={editProductCategoria} onValueChange={setEditProductCategoria}>
                <SelectTrigger id="edit-product-categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                  <SelectItem value="Equipos Médicos">Equipos Médicos</SelectItem>
                  <SelectItem value="Material de Curación">Material de Curación</SelectItem>
                  <SelectItem value="Alimentos">Alimentos</SelectItem>
                  <SelectItem value="Suplementos">Suplementos</SelectItem>
                  <SelectItem value="Insumos Veterinarios">Insumos Veterinarios</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-product-descripcion">Descripción *</Label>
              <Textarea
                id="edit-product-descripcion"
                value={editProductDescripcion}
                onChange={(e) => setEditProductDescripcion(e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-product-iva">IVA (%) *</Label>
              <Select value={editProductIva} onValueChange={setEditProductIva}>
                <SelectTrigger id="edit-product-iva">
                  <SelectValue placeholder="Selecciona el IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="19">19%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProductModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmEditProduct} className="bg-green-600 hover:bg-green-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Traslado (Multi-producto) - Diseño Ampliado */}
      <Dialog open={showTrasladoModal} onOpenChange={(open) => {
        if (!open) setShowTrasladoModal(false);
      }}>
        <DialogContent className="w-[98vw] max-w-[1600px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="traslado-create-description">
          <button
            onClick={() => setShowTrasladoModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle>Nuevo Traslado</DialogTitle>
            <DialogDescription id="traslado-create-description">
              Completa la información para trasladar productos entre bodegas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Bodegas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="traslado-origen">Bodega Origen *</Label>
                {usuario?.rol === 'Administrador' ? (
                  <Select value={formTrasladoBodegaOrigen} onValueChange={setFormTrasladoBodegaOrigen}>
                    <SelectTrigger id="traslado-origen">
                      <SelectValue placeholder="Selecciona bodega origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodegasData.map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="traslado-origen"
                    value={formTrasladoBodegaOrigen}
                    disabled
                    className="bg-gray-100"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="traslado-destino">Bodega Destino *</Label>
                <Select value={formTrasladoBodegaDestino} onValueChange={setFormTrasladoBodegaDestino}>
                  <SelectTrigger id="traslado-destino">
                    <SelectValue placeholder="Selecciona bodega destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.nombre !== formTrasladoBodegaOrigen)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Agregar Productos al Traslado</h3>
              
              {/* Formulario para agregar items */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current-producto">Producto *</Label>
                    <Select 
                      value={currentProducto} 
                      onValueChange={(value) => {
                        setCurrentProducto(value);
                        setCurrentLote('');
                        setCurrentCantidad('');
                      }}
                    >
                      <SelectTrigger id="current-producto">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos
                          .filter(p => p.lotes.some(l => l.bodega === formTrasladoBodegaOrigen && l.cantidadDisponible > 0))
                          .map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="current-lote">Lote *</Label>
                    <Select 
                      value={currentLote} 
                      onValueChange={(value) => {
                        setCurrentLote(value);
                        setCurrentCantidad('');
                      }}
                      disabled={!currentProducto}
                    >
                      <SelectTrigger id="current-lote">
                        <SelectValue placeholder="Selecciona un lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lotesDisponiblesTraslado.map((lote) => (
                          <SelectItem key={lote.id} value={lote.numeroLote}>
                            {lote.numeroLote} - Disp: {lote.cantidadDisponible}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="current-cantidad">Cantidad *</Label>
                    <Input
                      id="current-cantidad"
                      type="number"
                      value={currentCantidad}
                      onChange={(e) => setCurrentCantidad(e.target.value)}
                      placeholder="Ej: 50"
                      min="1"
                      max={cantidadMaximaTraslado}
                      disabled={!currentLote}
                    />
                    {currentLote && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máx: {cantidadMaximaTraslado}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleAddItemTraslado} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  type="button"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {/* Lista de productos agregados */}
              {trasladoItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trasladoItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.productoNombre}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-600">{item.loteNumero}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{item.cantidad}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItemTraslado(index)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell colSpan={3} className="text-right">Total Unidades:</TableCell>
                        <TableCell className="text-right">{calcularTotalItems(trasladoItems)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="traslado-observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="traslado-observaciones"
                value={formTrasladoObservaciones}
                onChange={(e) => setFormTrasladoObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre el traslado"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrasladoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCreateTraslado} className="bg-purple-600 hover:bg-purple-700">
              Crear Traslado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Traslado */}
      <Dialog open={showConfirmTrasladoModal} onOpenChange={setShowConfirmTrasladoModal}>
        <DialogContent className="max-w-lg" aria-describedby="confirm-traslado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Traslado</DialogTitle>
            <DialogDescription id="confirm-traslado-description">
              ¿Estás seguro de que deseas crear este traslado?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Origen:</span>
              <span className="font-medium">{formTrasladoBodegaOrigen}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Destino:</span>
              <span className="font-medium">{formTrasladoBodegaDestino}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Productos:</span>
              <span className="font-medium">{trasladoItems.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Unidades:</span>
              <span className="font-medium">{calcularTotalItems(trasladoItems)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmTrasladoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={executeCreateTraslado} className="bg-purple-600 hover:bg-purple-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent className="max-w-lg" aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este producto?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Producto:</span>
              <span className="font-medium">{productoParaCambioEstado?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <Badge 
                variant="outline" 
                className={
                  productoParaCambioEstado?.estado
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }
              >
                {productoParaCambioEstado?.estado ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <Badge 
                variant="outline" 
                className={
                  !productoParaCambioEstado?.estado
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }
              >
                {!productoParaCambioEstado?.estado ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmEstadoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEstado} className="bg-blue-600 hover:bg-blue-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Registro Exitoso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="success-description">
          <button
            onClick={handleSuccessModalClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription id="success-description" className="sr-only">
              La operación se ha completado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Registro Exitoso!</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              La operación se ha completado correctamente
            </p>
            <Button onClick={handleSuccessModalClose} className="w-full bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
