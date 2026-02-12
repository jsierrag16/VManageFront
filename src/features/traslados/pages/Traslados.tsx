import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Eye, Package, ChevronLeft, ChevronRight, CheckCircle, Building2, X, Trash2, PlusCircle, Clock, Truck, XCircle, Ban } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from '../../../shared/components/ui/textarea';
import { toast } from 'sonner';
import { Traslado, TrasladoItem } from '../../../data/traslados';
import { productosData, Producto } from '../../../data/productos';
import { bodegasData } from '../../../data/bodegas';
import { usePermisos } from '../../../shared/hooks/usePermisos';
import { useTraslados } from '../../../shared/context/TrasladosContext';
import { useProductos } from '../../../shared/context/ProductosContext';

interface TrasladosProps {
  selectedBodega?: string;
  onTrasladoCreated?: () => void;
  triggerCreate?: number;
  onInventoryUpdate?: (productos: Producto[]) => void;
}

export default function Traslados({ selectedBodega = 'Bodega Principal', onTrasladoCreated, triggerCreate, onInventoryUpdate }: TrasladosProps) {
  const { usuario } = usePermisos();
  const { traslados, addTraslado, updateTraslado } = useTraslados();
  const { productos, updateProducto } = useProductos();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [selectedTraslado, setSelectedTraslado] = useState<Traslado | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'Enviado' | 'Recibido' | 'Cancelado' | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Form states
  const [formBodegaOrigen, setFormBodegaOrigen] = useState(selectedBodega);
  const [formBodegaDestino, setFormBodegaDestino] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');
  
  // Items del traslado (líneas)
  const [trasladoItems, setTrasladoItems] = useState<TrasladoItem[]>([]);
  
  // Form states para la línea actual
  const [currentProducto, setCurrentProducto] = useState('');
  const [currentLote, setCurrentLote] = useState('');
  const [currentCantidad, setCurrentCantidad] = useState('');

  // Estados para validaciones en tiempo real
  const [errors, setErrors] = useState({
    bodegaOrigen: '',
    bodegaDestino: '',
    observaciones: '',
    currentProducto: '',
    currentLote: '',
    currentCantidad: ''
  });
  const [touched, setTouched] = useState({
    bodegaOrigen: false,
    bodegaDestino: false,
    observaciones: false,
    currentProducto: false,
    currentLote: false,
    currentCantidad: false
  });

  // Funciones de validación individuales
  const validateBodegaOrigen = (value: string) => {
    if (!value || value === '') {
      return 'La bodega de origen es requerida';
    }
    return '';
  };

  const validateBodegaDestino = (value: string, bodegaOrigen: string) => {
    if (!value || value === '') {
      return 'La bodega de destino es requerida';
    }
    if (value === bodegaOrigen) {
      return 'La bodega de destino debe ser diferente a la de origen';
    }
    return '';
  };

  const validateObservaciones = (value: string) => {
    if (!value.trim()) {
      return ''; // Las observaciones son opcionales
    }
    // Permitir letras, números, espacios y puntuación común
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-¿?¡!]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios y puntuación básica';
    }
    if (value.trim().length > 500) {
      return 'Máximo 500 caracteres';
    }
    return '';
  };

  const validateCurrentProducto = (value: string) => {
    if (!value) {
      return 'El producto es requerido';
    }
    return '';
  };

  const validateCurrentLote = (value: string) => {
    if (!value) {
      return 'El lote es requerido';
    }
    return '';
  };

  const validateCurrentCantidad = (value: string, maxCantidad: number) => {
    if (!value.trim()) {
      return 'La cantidad es requerida';
    }
    // Solo números enteros
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(value)) {
      return 'Solo se permiten números enteros';
    }
    const cantidad = parseInt(value);
    if (cantidad <= 0) {
      return 'La cantidad debe ser mayor a 0';
    }
    if (cantidad > maxCantidad) {
      return `Máximo ${maxCantidad} unidades disponibles`;
    }
    return '';
  };

  // Handlers con validación en tiempo real
  const handleBodegaOrigenChange = (value: string) => {
    setFormBodegaOrigen(value);
    if (touched.bodegaOrigen) {
      setErrors({ ...errors, bodegaOrigen: validateBodegaOrigen(value) });
    }
    // Re-validar bodega destino si ya fue tocada
    if (touched.bodegaDestino) {
      setErrors(prev => ({ ...prev, bodegaDestino: validateBodegaDestino(formBodegaDestino, value) }));
    }
  };

  const handleBodegaDestinoChange = (value: string) => {
    setFormBodegaDestino(value);
    if (touched.bodegaDestino) {
      setErrors({ ...errors, bodegaDestino: validateBodegaDestino(value, formBodegaOrigen) });
    }
  };

  const handleObservacionesChange = (value: string) => {
    setFormObservaciones(value);
    if (touched.observaciones) {
      setErrors({ ...errors, observaciones: validateObservaciones(value) });
    }
  };

  const handleCurrentProductoChange = (value: string) => {
    setCurrentProducto(value);
    if (touched.currentProducto) {
      setErrors({ ...errors, currentProducto: validateCurrentProducto(value) });
    }
  };

  const handleCurrentLoteChange = (value: string) => {
    setCurrentLote(value);
    if (touched.currentLote) {
      setErrors({ ...errors, currentLote: validateCurrentLote(value) });
    }
  };

  const handleCurrentCantidadChange = (value: string) => {
    setCurrentCantidad(value);
    if (touched.currentCantidad) {
      setErrors({ ...errors, currentCantidad: validateCurrentCantidad(value, cantidadMaxima) });
    }
  };

  // Handlers onBlur
  const handleBodegaOrigenBlur = () => {
    setTouched({ ...touched, bodegaOrigen: true });
    setErrors({ ...errors, bodegaOrigen: validateBodegaOrigen(formBodegaOrigen) });
  };

  const handleBodegaDestinoBlur = () => {
    setTouched({ ...touched, bodegaDestino: true });
    setErrors({ ...errors, bodegaDestino: validateBodegaDestino(formBodegaDestino, formBodegaOrigen) });
  };

  const handleObservacionesBlur = () => {
    setTouched({ ...touched, observaciones: true });
    setErrors({ ...errors, observaciones: validateObservaciones(formObservaciones) });
  };

  const handleCurrentProductoBlur = () => {
    setTouched({ ...touched, currentProducto: true });
    setErrors({ ...errors, currentProducto: validateCurrentProducto(currentProducto) });
  };

  const handleCurrentLoteBlur = () => {
    setTouched({ ...touched, currentLote: true });
    setErrors({ ...errors, currentLote: validateCurrentLote(currentLote) });
  };

  const handleCurrentCantidadBlur = () => {
    setTouched({ ...touched, currentCantidad: true });
    setErrors({ ...errors, currentCantidad: validateCurrentCantidad(currentCantidad, cantidadMaxima) });
  };

  // Obtener productos únicos disponibles en la bodega de origen
  const productosDisponibles = useMemo(() => {
    if (!formBodegaOrigen) return [];
    
    const productosEnBodega = productos.filter(producto => 
      producto.lotes.some(lote => 
        lote.bodega === formBodegaOrigen && lote.cantidadDisponible > 0
      )
    );
    
    return productosEnBodega;
  }, [formBodegaOrigen, productos]);

  // Obtener lotes disponibles del producto seleccionado en la bodega de origen
  const lotesDisponibles = useMemo(() => {
    if (!currentProducto || !formBodegaOrigen) return [];
    const producto = productos.find(p => p.id === currentProducto);
    if (!producto) return [];
    return producto.lotes.filter(lote => 
      lote.bodega === formBodegaOrigen && lote.cantidadDisponible > 0
    );
  }, [currentProducto, formBodegaOrigen, productos]);

  // Obtener cantidad máxima disponible del lote seleccionado
  const cantidadMaxima = useMemo(() => {
    if (!currentLote) return 0;
    const lote = lotesDisponibles.find(l => l.numeroLote === currentLote);
    return lote?.cantidadDisponible || 0;
  }, [currentLote, lotesDisponibles]);

  // Funciones auxiliares
  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const calcularTotalItems = (items: TrasladoItem[]) => {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'Enviado': { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: Truck },
      'Recibido': { class: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Cancelado': { class: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    };
    return badges[estado as keyof typeof badges] || badges['Enviado'];
  };

  // Función para obtener el siguiente estado permitido
  const getSiguienteEstado = (estadoActual: 'Enviado' | 'Recibido' | 'Cancelado'): 'Enviado' | 'Recibido' | 'Cancelado' | null => {
    const flujoEstados: { [key: string]: 'Enviado' | 'Recibido' | 'Cancelado' | null } = {
      'Enviado': 'Recibido',
      'Recibido': null,  // Estado final
      'Cancelado': null  // Estado final
    };
    return flujoEstados[estadoActual] || null;
  };

  // Función para manejar el clic en el estado (clickeable)
  const handleEstadoClick = (traslado: Traslado) => {
    const siguienteEstado = getSiguienteEstado(traslado.estado);
    
    if (!siguienteEstado) {
      if (traslado.estado === 'Recibido') {
        toast.info('Este traslado ya está en estado final (Recibido)');
      } else if (traslado.estado === 'Cancelado') {
        toast.info('Los traslados cancelados no pueden cambiar de estado');
      }
      return;
    }

    setSelectedTraslado(traslado);
    setNuevoEstado(siguienteEstado);
    setShowConfirmEstadoModal(true);
  };

  // Filtrar traslados por bodega, búsqueda y fechas
  const filteredTraslados = useMemo(() => {
    return traslados.filter((traslado) => {
      const searchLower = searchTerm.toLowerCase();
      
      // Filtro por bodega
      if (usuario?.rol !== 'Administrador') {
        // Si el usuario no es Administrador, filtrar por su bodega asignada
        if (traslado.bodegaOrigen !== selectedBodega && traslado.bodegaDestino !== selectedBodega) {
          return false;
        }
      } else {
        // Si es Administrador y selectedBodega NO es "Todas las bodegas" (o vacío/undefined), filtrar por bodega seleccionada
        if (selectedBodega && selectedBodega !== 'Todas las bodegas' && selectedBodega !== '') {
          if (traslado.bodegaOrigen !== selectedBodega && traslado.bodegaDestino !== selectedBodega) {
            return false;
          }
        }
        // Si es "Todas las bodegas", vacío o undefined, mostrar todos los traslados (no aplicar filtro)
      }
      
      // Filtro por rango de fechas (incluyendo los días completos)
      if (fechaInicio) {
        const fechaTrasladoStr = traslado.fecha.split('T')[0]; // Asegurar solo fecha sin hora
        if (fechaTrasladoStr < fechaInicio) {
          return false;
        }
      }
      if (fechaFin) {
        const fechaTrasladoStr = traslado.fecha.split('T')[0]; // Asegurar solo fecha sin hora
        if (fechaTrasladoStr > fechaFin) {
          return false;
        }
      }
      
      // Búsqueda general en todos los campos
      const totalUnidades = calcularTotalItems(traslado.items);
      const itemsMatch = traslado.items.some(item =>
        item.productoNombre.toLowerCase().includes(searchLower) ||
        item.loteNumero.toLowerCase().includes(searchLower)
      );
      
      return (
        traslado.codigo.toLowerCase().includes(searchLower) ||
        traslado.fecha.includes(searchLower) ||
        formatFecha(traslado.fecha).toLowerCase().includes(searchLower) ||
        traslado.bodegaOrigen.toLowerCase().includes(searchLower) ||
        traslado.bodegaDestino.toLowerCase().includes(searchLower) ||
        traslado.estado.toLowerCase().includes(searchLower) ||
        traslado.responsable.toLowerCase().includes(searchLower) ||
        totalUnidades.toString().includes(searchLower) ||
        itemsMatch
      );
    });
  }, [traslados, searchTerm, selectedBodega, usuario?.rol, fechaInicio, fechaFin]);

  // Paginación
  const totalPages = Math.ceil(filteredTraslados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTraslados = filteredTraslados.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fechaInicio, fechaFin]);

  // Sincronizar bodega origen cuando cambia selectedBodega
  useEffect(() => {
    if (!showCreateModal) {
      setFormBodegaOrigen(selectedBodega === 'Todas las bodegas' ? 'Bodega Principal' : selectedBodega);
    }
  }, [selectedBodega, showCreateModal]);

  // Abrir modal de creación desde trigger externo (desde Existencias)
  useEffect(() => {
    if (triggerCreate && triggerCreate > 0) {
      // Si el usuario no es Administrador, pre-seleccionar su bodega asignada
      const bodegaInicial = usuario?.rol !== 'Administrador' 
        ? selectedBodega 
        : (selectedBodega === 'Todas las bodegas' ? '' : selectedBodega);
      setFormBodegaOrigen(bodegaInicial);
      setFormBodegaDestino('');
      setFormObservaciones('');
      setTrasladoItems([]);
      setCurrentProducto('');
      setCurrentLote('');
      setCurrentCantidad('');
      setShowCreateModal(true);
    }
  }, [triggerCreate, selectedBodega, usuario]);

  const handleNuevoTraslado = () => {
    // Si el usuario no es Administrador, pre-seleccionar su bodega asignada
    const bodegaInicial = usuario?.rol !== 'Administrador' 
      ? selectedBodega 
      : (selectedBodega === 'Todas las bodegas' ? '' : selectedBodega);
    setFormBodegaOrigen(bodegaInicial);
    setFormBodegaDestino('');
    setFormObservaciones('');
    setTrasladoItems([]);
    setCurrentProducto('');
    setCurrentLote('');
    setCurrentCantidad('');
    setErrors({
      bodegaOrigen: '',
      bodegaDestino: '',
      observaciones: '',
      currentProducto: '',
      currentLote: '',
      currentCantidad: ''
    });
    setTouched({
      bodegaOrigen: false,
      bodegaDestino: false,
      observaciones: false,
      currentProducto: false,
      currentLote: false,
      currentCantidad: false
    });
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
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

    if (cantidad > cantidadMaxima) {
      toast.error(`La cantidad no puede exceder ${cantidadMaxima} unidades disponibles`);
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

  const handleRemoveItem = (index: number) => {
    const newItems = trasladoItems.filter((_, i) => i !== index);
    setTrasladoItems(newItems);
    toast.success('Producto eliminado del traslado');
  };

  const handleView = (traslado: Traslado) => {
    setSelectedTraslado(traslado);
    setShowViewModal(true);
  };

  const handleConfirmEstado = () => {
    if (!selectedTraslado || !nuevoEstado) return;

    // Si el estado es "Recibido", actualizar inventario
    if (nuevoEstado === 'Recibido') {
      selectedTraslado.items.forEach(item => {
        const producto = productos.find(p => p.id === item.productoId);
        if (producto) {
          const productoActualizado = { ...producto, lotes: [...producto.lotes] };
          
          // Reducir cantidad en bodega origen
          const loteOrigenIndex = productoActualizado.lotes.findIndex(
            l => l.numeroLote === item.loteNumero && l.bodega === selectedTraslado.bodegaOrigen
          );
          
          if (loteOrigenIndex !== -1) {
            productoActualizado.lotes[loteOrigenIndex] = {
              ...productoActualizado.lotes[loteOrigenIndex],
              cantidadDisponible: productoActualizado.lotes[loteOrigenIndex].cantidadDisponible - item.cantidad
            };
          }
          
          // Aumentar cantidad en bodega destino (crear lote si no existe)
          const loteDestinoIndex = productoActualizado.lotes.findIndex(
            l => l.numeroLote === item.loteNumero && l.bodega === selectedTraslado.bodegaDestino
          );
          
          if (loteDestinoIndex !== -1) {
            productoActualizado.lotes[loteDestinoIndex] = {
              ...productoActualizado.lotes[loteDestinoIndex],
              cantidadDisponible: productoActualizado.lotes[loteDestinoIndex].cantidadDisponible + item.cantidad
            };
          } else {
            // Copiar información del lote de origen para crear el lote en destino
            const loteOrigen = productoActualizado.lotes[loteOrigenIndex];
            if (loteOrigen) {
              productoActualizado.lotes.push({
                ...loteOrigen,
                id: `${producto.id}-${item.loteNumero}-${selectedTraslado.bodegaDestino}`,
                bodega: selectedTraslado.bodegaDestino,
                cantidadDisponible: item.cantidad,
              });
            }
          }
          
          // Actualizar el producto en el contexto
          updateProducto(producto.id, productoActualizado);
        }
      });
    }

    updateTraslado(selectedTraslado.id, { estado: nuevoEstado });
    toast.success(`Estado actualizado a: ${nuevoEstado}`);
    setShowConfirmEstadoModal(false);
    setSelectedTraslado(null);
    setNuevoEstado(null);
  };

  const openCancelarModal = (traslado: Traslado) => {
    setSelectedTraslado(traslado);
    setMotivoCancelacion('');
    setShowCancelarModal(true);
  };

  const handleConfirmCancelar = () => {
    if (!selectedTraslado) return;

    if (!motivoCancelacion.trim()) {
      toast.error('Debes indicar el motivo de la cancelación');
      return;
    }

    const observacionesCancelacion = selectedTraslado.observaciones 
      ? `${selectedTraslado.observaciones}\n\n[CANCELADO] ${motivoCancelacion}`
      : `[CANCELADO] ${motivoCancelacion}`;

    updateTraslado(selectedTraslado.id, { 
      estado: 'Cancelado',
      observaciones: observacionesCancelacion
    });
    
    toast.success('Traslado cancelado exitosamente');
    setShowCancelarModal(false);
    setSelectedTraslado(null);
    setMotivoCancelacion('');
  };

  const validateForm = () => {
    if (!formBodegaOrigen || !formBodegaDestino) {
      toast.error('Por favor completa las bodegas de origen y destino');
      return false;
    }

    if (formBodegaOrigen === formBodegaDestino) {
      toast.error('La bodega de origen y destino no pueden ser la misma');
      return false;
    }

    if (trasladoItems.length === 0) {
      toast.error('Debes agregar al menos un producto al traslado');
      return false;
    }

    return true;
  };

  const confirmCreateTraslado = () => {
    if (!validateForm()) return;

    const newTraslado: Traslado = {
      id: `TRS-${String(traslados.length + 1).padStart(3, '0')}`,
      codigo: `TRD-${String(traslados.length + 1).padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      bodegaOrigen: formBodegaOrigen,
      bodegaDestino: formBodegaDestino,
      items: [...trasladoItems],
      responsable: usuario?.nombreCompleto || 'Usuario',
      estado: 'Enviado',
      observaciones: formObservaciones.trim() || undefined,
    };

    addTraslado(newTraslado);
    setShowCreateModal(false);
    setShowSuccessModal(true);
    
    if (onTrasladoCreated) {
      onTrasladoCreated();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    // Limpiar formulario
    setTrasladoItems([]);
    setCurrentProducto('');
    setCurrentLote('');
    setCurrentCantidad('');
    setFormObservaciones('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Traslados</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-600">
            Administra los traslados de productos entre bodegas
          </p>
          {usuario?.rol !== 'Administrador' && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Building2 size={14} className="mr-1" />
              {selectedBodega}
            </Badge>
          )}
        </div>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar traslados por fecha, bodegas, unidades, estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNuevoTraslado} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={18} className="mr-2" />
          Nuevo Traslado
        </Button>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
            <Input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fecha-fin">Fecha Fin</Label>
            <Input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Bodega Origen</TableHead>
                <TableHead>Bodega Destino</TableHead>
                <TableHead className="text-center">Total Unidades</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTraslados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron traslados</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentTraslados.map((traslado, index) => {
                  const estadoBadge = getEstadoBadge(traslado.estado);
                  const Icon = estadoBadge.icon;
                  const siguienteEstado = getSiguienteEstado(traslado.estado);
                  const totalUnidades = calcularTotalItems(traslado.items);

                  return (
                    <TableRow key={traslado.id} className="hover:bg-gray-50">
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{formatFecha(traslado.fecha)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-blue-600" />
                          {traslado.bodegaOrigen}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-green-600" />
                          {traslado.bodegaDestino}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{totalUnidades}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${estadoBadge.class} ${siguienteEstado ? 'cursor-pointer hover:opacity-80' : ''}`}
                          onClick={() => siguienteEstado && handleEstadoClick(traslado)}
                        >
                          <Icon size={14} className="mr-1" />
                          {traslado.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(traslado)}
                            className="hover:bg-blue-50"
                          >
                            <Eye size={16} className="text-blue-600" />
                          </Button>
                          {traslado.estado === 'Enviado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCancelarModal(traslado)}
                              className="hover:bg-red-50"
                            >
                              <Ban size={16} className="text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTraslados.length)} de {filteredTraslados.length} traslados
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                    className={currentPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" aria-describedby="traslado-details-description">
          <DialogHeader>
            <DialogTitle>Detalles del Traslado</DialogTitle>
            <DialogDescription id="traslado-details-description">
              Información completa del traslado de productos entre bodegas
            </DialogDescription>
          </DialogHeader>
          {selectedTraslado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Código</Label>
                  <p className="font-medium">{selectedTraslado.codigo}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha</Label>
                  <p className="font-medium">{formatFecha(selectedTraslado.fecha)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Bodega Origen</Label>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    <p className="font-medium">{selectedTraslado.bodegaOrigen}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Bodega Destino</Label>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-green-600" />
                    <p className="font-medium">{selectedTraslado.bodegaDestino}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Responsable</Label>
                  <p className="font-medium">{selectedTraslado.responsable}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <Badge variant="outline" className={getEstadoBadge(selectedTraslado.estado).class}>
                    {(() => {
                      const Icon = getEstadoBadge(selectedTraslado.estado).icon;
                      return <Icon size={14} className="mr-1" />;
                    })()}
                    {selectedTraslado.estado}
                  </Badge>
                </div>
              </div>

              {selectedTraslado.observaciones && (
                <div>
                  <Label className="text-gray-600">Observaciones</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedTraslado.observaciones}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-gray-900 mb-3 block">Productos del Traslado</Label>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTraslado.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.productoNombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.loteNumero}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{item.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <div className="text-right">
                    <Label className="text-gray-600">Total de Unidades</Label>
                    <p className="text-xl font-bold text-purple-600">
                      {calcularTotalItems(selectedTraslado.items)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Traslado */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        if (!open) handleCloseCreateModal();
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} aria-describedby="traslado-create-description">
          <button
            onClick={handleCloseCreateModal}
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
                <Select value={formBodegaOrigen} onValueChange={handleBodegaOrigenChange}>
                  <SelectTrigger id="traslado-origen">
                    <SelectValue placeholder="Selecciona bodega origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(b => b.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.bodegaOrigen && touched.bodegaOrigen && (
                  <p className="text-sm text-red-500 mt-1">{errors.bodegaOrigen}</p>
                )}
              </div>
              <div>
                <Label htmlFor="traslado-destino">Bodega Destino *</Label>
                <Select value={formBodegaDestino} onValueChange={handleBodegaDestinoChange}>
                  <SelectTrigger id="traslado-destino">
                    <SelectValue placeholder="Selecciona bodega destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegasData
                      .filter(bodega => bodega.nombre !== formBodegaOrigen && bodega.estado)
                      .map((bodega) => (
                        <SelectItem key={bodega.id} value={bodega.nombre}>
                          {bodega.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.bodegaDestino && touched.bodegaDestino && (
                  <p className="text-sm text-red-500 mt-1">{errors.bodegaDestino}</p>
                )}
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
                      onValueChange={handleCurrentProductoChange}
                      onBlur={handleCurrentProductoBlur}
                    >
                      <SelectTrigger id="current-producto">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosDisponibles.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            No hay productos disponibles en esta bodega
                          </div>
                        ) : (
                          productosDisponibles.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.currentProducto && touched.currentProducto && (
                      <p className="text-sm text-red-500 mt-1">{errors.currentProducto}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="current-lote">Lote *</Label>
                    <Select 
                      value={currentLote} 
                      onValueChange={handleCurrentLoteChange}
                      disabled={!currentProducto}
                      onBlur={handleCurrentLoteBlur}
                    >
                      <SelectTrigger id="current-lote">
                        <SelectValue placeholder="Selecciona un lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lotesDisponibles.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            No hay lotes disponibles
                          </div>
                        ) : (
                          lotesDisponibles.map((lote) => (
                            <SelectItem key={lote.id} value={lote.numeroLote}>
                              {lote.numeroLote} - Disp: {lote.cantidadDisponible}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.currentLote && touched.currentLote && (
                      <p className="text-sm text-red-500 mt-1">{errors.currentLote}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="current-cantidad">Cantidad *</Label>
                    <Input
                      id="current-cantidad"
                      type="text"
                      value={currentCantidad}
                      onChange={(e) => handleCurrentCantidadChange(e.target.value)}
                      onBlur={handleCurrentCantidadBlur}
                      placeholder="Ej: 50"
                      disabled={!currentLote}
                      className={errors.currentCantidad && touched.currentCantidad ? "border-red-500" : ""}
                    />
                    {currentLote && !errors.currentCantidad && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máx: {cantidadMaxima}
                      </p>
                    )}
                    {errors.currentCantidad && touched.currentCantidad && (
                      <p className="text-sm text-red-500 mt-1">{errors.currentCantidad}</p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleAddItem} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  type="button"
                  disabled={!formBodegaOrigen}
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
                        <TableHead className="w-20 text-center">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trasladoItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.productoNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {item.loteNumero}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.cantidad}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de productos:</span>
                    <span className="font-bold text-purple-600">{trasladoItems.length}</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de unidades:</span>
                    <span className="font-bold text-purple-600">{calcularTotalItems(trasladoItems)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Responsable */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm text-blue-900">Responsable del Traslado</Label>
                  <p className="font-medium text-blue-700">{usuario?.nombreCompleto || 'Usuario'}</p>
                  <p className="text-xs text-blue-600">El responsable se asigna automáticamente según tu sesión</p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="traslado-observaciones">Observaciones</Label>
              <Textarea
                id="traslado-observaciones"
                value={formObservaciones}
                onChange={handleObservacionesChange}
                placeholder="Escribe cualquier observación sobre el traslado (opcional)"
                rows={3}
                onBlur={handleObservacionesBlur}
              />
              {errors.observaciones && touched.observaciones && (
                <p className="text-sm text-red-500 mt-1">{errors.observaciones}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateModal}>
              Cancelar
            </Button>
            <Button onClick={confirmCreateTraslado} className="bg-purple-600 hover:bg-purple-700">
              Crear Traslado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent className="max-w-md" aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este traslado?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <Badge variant="outline" className={getEstadoBadge(selectedTraslado?.estado || 'Enviado').class}>
                {selectedTraslado?.estado}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <Badge variant="outline" className={getEstadoBadge(nuevoEstado || 'Enviado').class}>
                {nuevoEstado}
              </Badge>
            </div>
            {nuevoEstado === 'Recibido' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800">
                  <CheckCircle size={16} className="inline mr-2" />
                  Al confirmar, se actualizará el inventario de las bodegas.
                </p>
              </div>
            )}
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

      {/* Modal Cancelar Traslado */}
      <Dialog open={showCancelarModal} onOpenChange={setShowCancelarModal}>
        <DialogContent className="max-w-md" aria-describedby="cancelar-description">
          <DialogHeader>
            <DialogTitle>Cancelar Traslado</DialogTitle>
            <DialogDescription id="cancelar-description">
              Esta acción marcará el traslado como cancelado. Por favor indica el motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <Ban className="text-yellow-600 mt-0.5" size={18} />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Esta acción no se puede deshacer</p>
                <p>El traslado quedará marcado como cancelado y no podrá cambiar de estado.</p>
              </div>
            </div>
            <div>
              <Label htmlFor="motivo-cancelacion">Motivo de Cancelación *</Label>
              <Textarea
                id="motivo-cancelacion"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Describe el motivo de la cancelación..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelarModal(false)}>
              Volver
            </Button>
            <Button 
              onClick={handleConfirmCancelar} 
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban size={16} className="mr-2" />
              Cancelar Traslado
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
          <DialogHeader className="sr-only">
            <DialogTitle>Registro Exitoso</DialogTitle>
            <DialogDescription id="success-description">
              El traslado se ha creado correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Traslado Creado!</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              El traslado se ha registrado correctamente en el sistema
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