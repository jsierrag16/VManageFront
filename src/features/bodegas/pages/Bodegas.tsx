import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, CheckCircle, Filter } from 'lucide-react';
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
import { Label } from '../../../shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import { toast } from 'sonner';
import { departamentosColombia } from '../../../data/colombia';

interface Bodega {
  id: number;
  nombre: string;
  departamento: string;
  municipio: string;
  direccion: string;
  estado: boolean;
}

// Datos iniciales de bodegas
const bodegasDataInitial: Bodega[] = [
  {
    id: 1,
    nombre: 'Bodega Principal',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá D.C.',
    direccion: 'Calle 80 #45-23',
    estado: true,
  },
  {
    id: 2,
    nombre: 'Bodega Secundaria',
    departamento: 'Cundinamarca',
    municipio: 'Soacha',
    direccion: 'Carrera 15 #123-45',
    estado: true,
  },
  {
    id: 3,
    nombre: 'Bodega Medellín',
    departamento: 'Antioquia',
    municipio: 'Medellín',
    direccion: 'Carrera 43A #12-34',
    estado: true,
  },
  {
    id: 4,
    nombre: 'Bodega Cali',
    departamento: 'Valle del Cauca',
    municipio: 'Cali',
    direccion: 'Calle 25 #100-45',
    estado: false,
  },
];

interface BodegasProps {
  triggerCreate?: number;
}

export default function Bodegas({ triggerCreate }: BodegasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [bodegas, setBodegas] = useState<Bodega[]>(bodegasDataInitial);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);
  const [bodegaParaCambioEstado, setBodegaParaCambioEstado] = useState<Bodega | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formDepartamento, setFormDepartamento] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('');
  const [formDireccion, setFormDireccion] = useState('');

  // Estados para validaciones en tiempo real
  const [errors, setErrors] = useState({
    nombre: '',
    departamento: '',
    municipio: '',
    direccion: ''
  });
  const [touched, setTouched] = useState({
    nombre: false,
    departamento: false,
    municipio: false,
    direccion: false
  });

  // Funciones de validación individuales
  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return 'El nombre de la bodega es requerido';
    }
    // Solo letras, números, espacios y guiones
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios y guiones';
    }
    if (value.trim().length < 3) {
      return 'Mínimo 3 caracteres';
    }
    if (value.trim().length > 100) {
      return 'Máximo 100 caracteres';
    }
    return '';
  };

  const validateDepartamento = (value: string) => {
    if (!value) {
      return 'El departamento es requerido';
    }
    return '';
  };

  const validateMunicipio = (value: string) => {
    if (!value) {
      return 'El municipio es requerido';
    }
    return '';
  };

  const validateDireccion = (value: string) => {
    if (!value.trim()) {
      return 'La dirección es requerida';
    }
    // Permitir letras, números, espacios, guiones, comas, puntos y #
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-,#.]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios, guiones, comas, puntos y #';
    }
    if (value.trim().length < 5) {
      return 'Mínimo 5 caracteres';
    }
    if (value.trim().length > 200) {
      return 'Máximo 200 caracteres';
    }
    return '';
  };

  // Handlers con validación en tiempo real
  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors({ ...errors, nombre: validateNombre(value) });
    }
  };

  const handleDepartamentoChange = (value: string) => {
    setFormDepartamento(value);
    if (touched.departamento) {
      setErrors({ ...errors, departamento: validateDepartamento(value) });
    }
  };

  const handleMunicipioChange = (value: string) => {
    setFormMunicipio(value);
    if (touched.municipio) {
      setErrors({ ...errors, municipio: validateMunicipio(value) });
    }
  };

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);
    if (touched.direccion) {
      setErrors({ ...errors, direccion: validateDireccion(value) });
    }
  };

  // Handlers onBlur
  const handleNombreBlur = () => {
    setTouched({ ...touched, nombre: true });
    setErrors({ ...errors, nombre: validateNombre(formNombre) });
  };

  const handleDepartamentoBlur = () => {
    setTouched({ ...touched, departamento: true });
    setErrors({ ...errors, departamento: validateDepartamento(formDepartamento) });
  };

  const handleMunicipioBlur = () => {
    setTouched({ ...touched, municipio: true });
    setErrors({ ...errors, municipio: validateMunicipio(formMunicipio) });
  };

  const handleDireccionBlur = () => {
    setTouched({ ...touched, direccion: true });
    setErrors({ ...errors, direccion: validateDireccion(formDireccion) });
  };

  // Obtener municipios del departamento seleccionado
  const municipiosDisponibles = useMemo(() => {
    const dept = departamentosColombia.find(d => d.nombre === formDepartamento);
    return dept ? dept.municipios : [];
  }, [formDepartamento]);

  // Resetear municipio cuando cambia el departamento
  useEffect(() => {
    setFormMunicipio('');
  }, [formDepartamento]);

  // Filtrar bodegas
  const filteredBodegas = useMemo(() => {
    return bodegas.filter((bodega) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        bodega.nombre.toLowerCase().includes(searchLower) ||
        bodega.departamento.toLowerCase().includes(searchLower) ||
        bodega.municipio.toLowerCase().includes(searchLower) ||
        bodega.direccion.toLowerCase().includes(searchLower);
      
      // Filtrar por estado
      let matchesEstado = true;
      if (estadoFilter === 'activas') {
        matchesEstado = bodega.estado === true;
      } else if (estadoFilter === 'inactivas') {
        matchesEstado = bodega.estado === false;
      }
      // Si es "todos", no filtramos por estado
      
      return matchesSearch && matchesEstado;
    });
  }, [bodegas, searchTerm, estadoFilter]);

  const handleCreate = () => {
    setFormNombre('');
    setFormDepartamento('');
    setFormMunicipio('');
    setFormDireccion('');
    setErrors({
      nombre: '',
      departamento: '',
      municipio: '',
      direccion: ''
    });
    setTouched({
      nombre: false,
      departamento: false,
      municipio: false,
      direccion: false
    });
    setShowCreateModal(true);
  };

  const handleEdit = (bodega: Bodega) => {
    setSelectedBodega(bodega);
    setFormNombre(bodega.nombre);
    setFormDepartamento(bodega.departamento);
    setFormMunicipio(bodega.municipio);
    setFormDireccion(bodega.direccion);
    setErrors({
      nombre: '',
      departamento: '',
      municipio: '',
      direccion: ''
    });
    setTouched({
      nombre: false,
      departamento: false,
      municipio: false,
      direccion: false
    });
    setShowEditModal(true);
  };

  const handleDelete = (bodega: Bodega) => {
    setSelectedBodega(bodega);
    setShowDeleteModal(true);
  };

  const toggleEstado = (bodega: Bodega) => {
    setBodegaParaCambioEstado(bodega);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (bodegaParaCambioEstado) {
      setBodegas(
        bodegas.map((b) =>
          b.id === bodegaParaCambioEstado.id ? { ...b, estado: !b.estado } : b
        )
      );
      toast.success(`Bodega ${!bodegaParaCambioEstado.estado ? 'activada' : 'desactivada'} exitosamente`);
      setShowConfirmEstadoModal(false);
      setBodegaParaCambioEstado(null);
    }
  };

  const validateForm = () => {
    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      departamento: true,
      municipio: true,
      direccion: true
    });

    // Validar con las funciones individuales
    const nombreError = validateNombre(formNombre);
    const departamentoError = validateDepartamento(formDepartamento);
    const municipioError = validateMunicipio(formMunicipio);
    const direccionError = validateDireccion(formDireccion);

    setErrors({
      nombre: nombreError,
      departamento: departamentoError,
      municipio: municipioError,
      direccion: direccionError
    });

    // Si hay algún error, no permitir continuar
    if (nombreError || departamentoError || municipioError || direccionError) {
      toast.error('Por favor corrige los errores en el formulario');
      return false;
    }

    return true;
  };

  const confirmCreate = () => {
    if (!validateForm()) return;

    const newBodega: Bodega = {
      id: Math.max(...bodegas.map((b) => b.id), 0) + 1,
      nombre: formNombre.trim(),
      departamento: formDepartamento,
      municipio: formMunicipio,
      direccion: formDireccion.trim(),
      estado: true,
    };

    setBodegas([...bodegas, newBodega]);
    setShowCreateModal(false);
    setShowSuccessModal(true);
  };

  const confirmEdit = () => {
    if (!selectedBodega || !validateForm()) return;

    setBodegas(
      bodegas.map((b) =>
        b.id === selectedBodega.id
          ? {
              ...b,
              nombre: formNombre.trim(),
              departamento: formDepartamento,
              municipio: formMunicipio,
              direccion: formDireccion.trim(),
            }
          : b
      )
    );
    setShowEditModal(false);
    toast.success('Bodega actualizada exitosamente');
  };

  const confirmDelete = () => {
    setBodegas(bodegas.filter((b) => b.id !== selectedBodega?.id));
    setShowDeleteModal(false);
    toast.success('Bodega eliminada exitosamente');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Bodegas</h2>
        <p className="text-gray-600 mt-1">
          Administra las bodegas y centros de almacenamiento
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar bodegas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filtro de Estado */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
          <Filter size={16} className="text-gray-500 ml-2" />
          <Button
            size="sm"
            variant={estadoFilter === 'todos' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('todos')}
            className={`h-8 ${
              estadoFilter === 'todos'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'hover:bg-gray-200'
            }`}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'activas' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('activas')}
            className={`h-8 ${
              estadoFilter === 'activas'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'hover:bg-gray-200'
            }`}
          >
            Activas
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'inactivas' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('inactivas')}
            className={`h-8 ${
              estadoFilter === 'inactivas'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'hover:bg-gray-200'
            }`}
          >
            Inactivas
          </Button>
        </div>

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nueva Bodega
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Municipio</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBodegas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No se encontraron bodegas
                  </TableCell>
                </TableRow>
              ) : (
                filteredBodegas.map((bodega) => (
                  <TableRow key={bodega.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{bodega.nombre}</TableCell>
                    <TableCell className="text-gray-700">
                      {bodega.municipio}, {bodega.departamento}
                    </TableCell>
                    <TableCell className="text-gray-700">{bodega.direccion}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleEstado(bodega)}
                        className={
                          bodega.estado
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      >
                        {bodega.estado ? 'Activa' : 'Inactiva'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(bodega)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(bodega)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
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

      {/* Modal Crear Bodega */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto" 
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Crear Nueva Bodega</DialogTitle>
            <DialogDescription>
              Completa la información para registrar una nueva bodega en el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-nombre">Nombre de la Bodega *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Bodega Principal"
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-departamento">Departamento *</Label>
                <Select value={formDepartamento} onValueChange={handleDepartamentoChange} onOpenChange={(open) => !open && handleDepartamentoBlur()}>
                  <SelectTrigger id="create-departamento" className={errors.departamento && touched.departamento ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentosColombia.map((dept) => (
                      <SelectItem key={dept.nombre} value={dept.nombre}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamento && touched.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-municipio">Municipio *</Label>
                <Select 
                  value={formMunicipio} 
                  onValueChange={handleMunicipioChange}
                  onOpenChange={(open) => !open && handleMunicipioBlur()}
                  disabled={!formDepartamento}
                >
                  <SelectTrigger id="create-municipio" className={errors.municipio && touched.municipio ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosDisponibles.map((municipio) => (
                      <SelectItem key={municipio} value={municipio}>
                        {municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-sm mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="create-direccion">Dirección *</Label>
              <Input
                id="create-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                onBlur={handleDireccionBlur}
                placeholder="Ej: Calle 80 #45-23"
                className={errors.direccion ? 'border-red-500' : ''}
              />
              {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Bodega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Bodega */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto" 
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Bodega</DialogTitle>
            <DialogDescription>
              Modifica la información de la bodega
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre de la Bodega *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                onBlur={handleNombreBlur}
                placeholder="Ej: Bodega Principal"
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-departamento">Departamento *</Label>
                <Select value={formDepartamento} onValueChange={handleDepartamentoChange} onOpenChange={(open) => !open && handleDepartamentoBlur()}>
                  <SelectTrigger id="edit-departamento" className={errors.departamento && touched.departamento ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentosColombia.map((dept) => (
                      <SelectItem key={dept.nombre} value={dept.nombre}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamento && touched.departamento && (
                  <p className="text-red-500 text-sm mt-1">{errors.departamento}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-municipio">Municipio *</Label>
                <Select 
                  value={formMunicipio} 
                  onValueChange={handleMunicipioChange}
                  onOpenChange={(open) => !open && handleMunicipioBlur()}
                  disabled={!formDepartamento}
                >
                  <SelectTrigger id="edit-municipio" className={errors.municipio && touched.municipio ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosDisponibles.map((municipio) => (
                      <SelectItem key={municipio} value={municipio}>
                        {municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipio && touched.municipio && (
                  <p className="text-red-500 text-sm mt-1">{errors.municipio}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                onBlur={handleDireccionBlur}
                placeholder="Ej: Calle 80 #45-23"
                className={errors.direccion ? 'border-red-500' : ''}
              />
              {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmEdit} className="bg-orange-600 hover:bg-orange-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Bodega */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Bodega</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta bodega? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedBodega && (
            <div className="py-4">
              <p className="text-gray-700">
                Bodega: <span className="font-semibold">{selectedBodega.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Ubicación: {selectedBodega.municipio}, {selectedBodega.departamento}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar el estado de esta bodega?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bodega:</span>
              <span className="font-medium">{bodegaParaCambioEstado?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span className={`font-medium ${bodegaParaCambioEstado?.estado ? 'text-green-700' : 'text-red-700'}`}>
                {bodegaParaCambioEstado?.estado ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span className={`font-medium ${!bodegaParaCambioEstado?.estado ? 'text-green-700' : 'text-red-700'}`}>
                {!bodegaParaCambioEstado?.estado ? 'Activa' : 'Inactiva'}
              </span>
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

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription className="sr-only">
              La bodega se ha registrado correctamente
            </DialogDescription>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>
            <DialogDescription className="text-center">
              La bodega ha sido creada correctamente en el sistema
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button onClick={handleSuccessModalClose} className="bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}