import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Plus, CheckCircle, Mail, MapPin, User, FileText, Phone, Filter } from 'lucide-react';
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
import { Textarea } from '../../../shared/components/ui/textarea';
import { toast } from 'sonner';
import { clientesData as initialClientesData, Cliente } from '../../../data/clientes';
import { usePermisos } from '../../../shared/hooks/usePermisos';
import { departamentosColombia } from '../../../data/colombia';

interface ClientesProps {
  triggerCreate?: number;
  selectedBodega?: string;
}

export default function Clientes({ triggerCreate, selectedBodega = 'Bodega Principal' }: ClientesProps) {
  const { clientes: permisos } = usePermisos();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [clientes, setClientes] = useState<Cliente[]>(initialClientesData);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteParaCambioEstado, setClienteParaCambioEstado] = useState<Cliente | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formTipoDoc, setFormTipoDoc] = useState('CC');
  const [formNumeroDoc, setFormNumeroDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formTelefonoSecundario, setFormTelefonoSecundario] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formDepartamento, setFormDepartamento] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formTipoCliente, setFormTipoCliente] = useState('');
  const [formNotas, setFormNotas] = useState('');

  // Estados para validaciones en tiempo real
  const [errors, setErrors] = useState({
    tipoDoc: '',
    numeroDoc: '',
    nombre: '',
    email: '',
    telefono: '',
    telefonoSecundario: '',
    direccion: '',
    departamento: '',
    ciudad: '',
    tipoCliente: '',
    notas: ''
  });
  const [touched, setTouched] = useState({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    email: false,
    telefono: false,
    telefonoSecundario: false,
    direccion: false,
    departamento: false,
    ciudad: false,
    tipoCliente: false,
    notas: false
  });

  // Funciones de validación individuales
  const validateTipoDoc = (value: string) => {
    if (!value) {
      return 'El tipo de documento es requerido';
    }
    return '';
  };

  const validateNumeroDoc = (value: string) => {
    if (!value.trim()) {
      return 'El número de documento es requerido';
    }
    // Solo números y guiones
    const validPattern = /^[0-9-]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten números y guiones';
    }
    if (value.length < 6) {
      return 'Mínimo 6 caracteres';
    }
    if (value.length > 20) {
      return 'Máximo 20 caracteres';
    }
    return '';
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) {
      return 'El nombre del cliente es requerido';
    }
    // Solo letras y espacios
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras y espacios';
    }
    if (value.trim().length < 3) {
      return 'Mínimo 3 caracteres';
    }
    if (value.trim().length > 100) {
      return 'Máximo 100 caracteres';
    }
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'El email es requerido';
    }
    if (!value.includes('@')) {
      return 'El email debe contener un @';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Formato de email inválido';
    }
    return '';
  };

  const validateTelefono = (value: string) => {
    if (!value.trim()) {
      return 'El teléfono es requerido';
    }
    // Exactamente 10 números
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) {
      return 'Debe tener exactamente 10 números';
    }
    return '';
  };

  const validateTelefonoSecundario = (value: string) => {
    if (!value.trim()) {
      return ''; // El teléfono secundario es opcional
    }
    // Exactamente 10 números
    const diezNumeros = /^[0-9]{10}$/;
    if (!diezNumeros.test(value)) {
      return 'Debe tener exactamente 10 números';
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

  const validateDepartamento = (value: string) => {
    if (!value || value === '') {
      return 'El departamento es requerido';
    }
    return '';
  };

  const validateCiudad = (value: string) => {
    if (!value || value === '') {
      return 'La ciudad es requerida';
    }
    return '';
  };

  const validateTipoCliente = (value: string) => {
    if (!value || value === '') {
      return 'El tipo de cliente es requerido';
    }
    return '';
  };

  const validateNotas = (value: string) => {
    if (!value.trim()) {
      return ''; // Las notas son opcionales
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

  // Handlers con validación en tiempo real
  const handleTipoDocChange = (value: string) => {
    setFormTipoDoc(value);
    if (touched.tipoDoc) {
      setErrors({ ...errors, tipoDoc: validateTipoDoc(value) });
    }
  };

  const handleNumeroDocChange = (value: string) => {
    setFormNumeroDoc(value);
    if (touched.numeroDoc) {
      setErrors({ ...errors, numeroDoc: validateNumeroDoc(value) });
    }
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (touched.nombre) {
      setErrors({ ...errors, nombre: validateNombre(value) });
    }
  };

  const handleEmailChange = (value: string) => {
    setFormEmail(value);
    if (touched.email) {
      setErrors({ ...errors, email: validateEmail(value) });
    }
  };

  const handleTelefonoChange = (value: string) => {
    setFormTelefono(value);
    if (touched.telefono) {
      setErrors({ ...errors, telefono: validateTelefono(value) });
    }
  };

  const handleTelefonoSecundarioChange = (value: string) => {
    setFormTelefonoSecundario(value);
    if (touched.telefonoSecundario) {
      setErrors({ ...errors, telefonoSecundario: validateTelefonoSecundario(value) });
    }
  };

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);
    if (touched.direccion) {
      setErrors({ ...errors, direccion: validateDireccion(value) });
    }
  };

  const handleDepartamentoChange = (value: string) => {
    setFormDepartamento(value);
    if (touched.departamento) {
      setErrors({ ...errors, departamento: validateDepartamento(value) });
    }
  };

  const handleCiudadChange = (value: string) => {
    setFormCiudad(value);
    if (touched.ciudad) {
      setErrors({ ...errors, ciudad: validateCiudad(value) });
    }
  };

  const handleTipoClienteChange = (value: string) => {
    setFormTipoCliente(value);
    if (touched.tipoCliente) {
      setErrors({ ...errors, tipoCliente: validateTipoCliente(value) });
    }
  };

  const handleNotasChange = (value: string) => {
    setFormNotas(value);
    if (touched.notas) {
      setErrors({ ...errors, notas: validateNotas(value) });
    }
  };

  // Handlers onBlur
  const handleTipoDocBlur = () => {
    setTouched({ ...touched, tipoDoc: true });
    setErrors({ ...errors, tipoDoc: validateTipoDoc(formTipoDoc) });
  };

  const handleNumeroDocBlur = () => {
    setTouched({ ...touched, numeroDoc: true });
    setErrors({ ...errors, numeroDoc: validateNumeroDoc(formNumeroDoc) });
  };

  const handleNombreBlur = () => {
    setTouched({ ...touched, nombre: true });
    setErrors({ ...errors, nombre: validateNombre(formNombre) });
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setErrors({ ...errors, email: validateEmail(formEmail) });
  };

  const handleTelefonoBlur = () => {
    setTouched({ ...touched, telefono: true });
    setErrors({ ...errors, telefono: validateTelefono(formTelefono) });
  };

  const handleTelefonoSecundarioBlur = () => {
    setTouched({ ...touched, telefonoSecundario: true });
    setErrors({ ...errors, telefonoSecundario: validateTelefonoSecundario(formTelefonoSecundario) });
  };

  const handleDireccionBlur = () => {
    setTouched({ ...touched, direccion: true });
    setErrors({ ...errors, direccion: validateDireccion(formDireccion) });
  };

  const handleDepartamentoBlur = () => {
    setTouched({ ...touched, departamento: true });
    setErrors({ ...errors, departamento: validateDepartamento(formDepartamento) });
  };

  const handleCiudadBlur = () => {
    setTouched({ ...touched, ciudad: true });
    setErrors({ ...errors, ciudad: validateCiudad(formCiudad) });
  };

  const handleTipoClienteBlur = () => {
    setTouched({ ...touched, tipoCliente: true });
    setErrors({ ...errors, tipoCliente: validateTipoCliente(formTipoCliente) });
  };

  const handleNotasBlur = () => {
    setTouched({ ...touched, notas: true });
    setErrors({ ...errors, notas: validateNotas(formNotas) });
  };

  // Obtener municipios del departamento seleccionado
  const municipiosDisponibles = useMemo(() => {
    const dept = departamentosColombia.find(d => d.nombre === formDepartamento);
    return dept ? dept.municipios : [];
  }, [formDepartamento]);

  // Resetear municipio cuando cambia el departamento
  useEffect(() => {
    setFormCiudad('');
  }, [formDepartamento]);

  // Filtrar clientes - Búsqueda por TODOS los campos del listado
  const filteredClientes = useMemo(() => {
    return clientes
      .filter((cliente) => {
        if (selectedBodega === 'Todas las bodegas') {
          return true;
        }
        return cliente.bodega === selectedBodega;
      })
      .filter((cliente) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          cliente.nombre.toLowerCase().includes(searchLower) ||
          cliente.tipoDocumento.toLowerCase().includes(searchLower) ||
          cliente.numeroDocumento.toLowerCase().includes(searchLower) ||
          cliente.email.toLowerCase().includes(searchLower) ||
          cliente.telefono.toLowerCase().includes(searchLower) ||
          (cliente.tipoCliente && cliente.tipoCliente.toLowerCase().includes(searchLower))
        );
      })
      .filter((cliente) => {
        if (estadoFilter === 'todos') {
          return true;
        }
        return cliente.estado.toLowerCase() === estadoFilter;
      });
  }, [clientes, searchTerm, selectedBodega, estadoFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = filteredClientes.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleView = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowViewModal(true);
  };

  const handleCreate = () => {
    setFormTipoDoc('CC');
    setFormNumeroDoc('');
    setFormNombre('');
    setFormEmail('');
    setFormTelefono('');
    setFormTelefonoSecundario('');
    setFormDireccion('');
    setFormDepartamento('');
    setFormCiudad('');
    setFormTipoCliente('');
    setFormNotas('');
    setErrors({
      tipoDoc: '',
      numeroDoc: '',
      nombre: '',
      email: '',
      telefono: '',
      telefonoSecundario: '',
      direccion: '',
      departamento: '',
      ciudad: '',
      tipoCliente: '',
      notas: ''
    });
    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      telefonoSecundario: false,
      direccion: false,
      departamento: false,
      ciudad: false,
      tipoCliente: false,
      notas: false
    });
    setShowCreateModal(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormTipoDoc(cliente.tipoDocumento);
    setFormNumeroDoc(cliente.numeroDocumento);
    setFormNombre(cliente.nombre);
    setFormEmail(cliente.email);
    setFormTelefono(cliente.telefono);
    setFormTelefonoSecundario(cliente.telefonoSecundario || '');
    setFormDireccion(cliente.direccion);
    setFormDepartamento(cliente.departamento || '');
    setFormCiudad(cliente.ciudad);
    setFormTipoCliente(cliente.tipoCliente);
    setFormNotas(cliente.notas || '');
    setErrors({
      tipoDoc: '',
      numeroDoc: '',
      nombre: '',
      email: '',
      telefono: '',
      telefonoSecundario: '',
      direccion: '',
      departamento: '',
      ciudad: '',
      tipoCliente: '',
      notas: ''
    });
    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      telefonoSecundario: false,
      direccion: false,
      departamento: false,
      ciudad: false,
      tipoCliente: false,
      notas: false
    });
    setShowEditModal(true);
  };

  const handleDelete = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDeleteModal(true);
  };

  const handleConfirmEstado = (cliente: Cliente) => {
    setClienteParaCambioEstado(cliente);
    setShowConfirmEstadoModal(true);
  };

  const validateForm = () => {
    // Validar campos obligatorios
    if (!formTipoDoc || !formNumeroDoc.trim() || !formNombre.trim() || !formEmail.trim() || 
        !formTelefono.trim() || !formDireccion.trim() || !formDepartamento || !formCiudad || !formTipoCliente) {
      toast.error('Por favor completa todos los campos obligatorios');
      return false;
    }

    // Validar número de documento (solo números y guiones)
    if (!/^[0-9-]+$/.test(formNumeroDoc)) {
      toast.error('El número de documento solo debe contener números y guiones');
      return false;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      toast.error('El email no tiene un formato válido');
      return false;
    }

    // Validar teléfono principal
    if (!/^[0-9\s\-()]+$/.test(formTelefono)) {
      toast.error('El teléfono principal solo debe contener números, espacios, guiones y paréntesis');
      return false;
    }

    // Validar teléfono secundario si existe
    if (formTelefonoSecundario.trim() && !/^[0-9\s\-()]+$/.test(formTelefonoSecundario)) {
      toast.error('El teléfono secundario solo debe contener números, espacios, guiones y paréntesis');
      return false;
    }

    // Validar que nombre no contenga caracteres especiales peligrosos
    if (/[<>{}[\]\\\/]/.test(formNombre)) {
      toast.error('El nombre contiene caracteres no permitidos');
      return false;
    }

    return true;
  };

  const confirmCreate = () => {
    if (!validateForm()) return;

    const newCliente: Cliente = {
      id: `CLI-${String(clientes.length + 1).padStart(3, '0')}`,
      tipoDocumento: formTipoDoc,
      numeroDocumento: formNumeroDoc.trim(),
      nombre: formNombre.trim(),
      email: formEmail.trim(),
      telefono: formTelefono.trim(),
      telefonoSecundario: formTelefonoSecundario.trim() || undefined,
      direccion: formDireccion.trim(),
      departamento: formDepartamento,
      ciudad: formCiudad,
      tipoCliente: formTipoCliente,
      notas: formNotas.trim(),
      fechaRegistro: new Date().toISOString().split('T')[0],
      bodega: selectedBodega,
      pais: 'Colombia',
      estado: 'Activo',
    };

    setClientes([...clientes, newCliente]);
    setShowCreateModal(false);
    setShowSuccessModal(true);
  };

  const confirmEdit = () => {
    if (!selectedCliente || !validateForm()) return;

    setClientes(
      clientes.map((c) =>
        c.id === selectedCliente.id
          ? {
              ...c,
              tipoDocumento: formTipoDoc,
              numeroDocumento: formNumeroDoc.trim(),
              nombre: formNombre.trim(),
              email: formEmail.trim(),
              telefono: formTelefono.trim(),
              telefonoSecundario: formTelefonoSecundario.trim() || undefined,
              direccion: formDireccion.trim(),
              departamento: formDepartamento,
              ciudad: formCiudad,
              tipoCliente: formTipoCliente,
              notas: formNotas.trim(),
            }
          : c
      )
    );
    setShowEditModal(false);
    toast.success('Cliente actualizado exitosamente');
  };

  const confirmDelete = () => {
    setClientes(clientes.filter((c) => c.id !== selectedCliente?.id));
    setShowDeleteModal(false);
    toast.success('Cliente eliminado exitosamente');
  };

  const confirmEstado = () => {
    if (!clienteParaCambioEstado) return;

    setClientes(
      clientes.map((c) =>
        c.id === clienteParaCambioEstado.id
          ? {
              ...c,
              estado: c.estado === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : c
      )
    );
    setShowConfirmEstadoModal(false);
    toast.success(`Estado del cliente cambiado a ${clienteParaCambioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo'}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gestión de Clientes</h2>
        <p className="text-gray-600 mt-1">
          Administra la información de tus clientes
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por nombre, tipo de documento, email, teléfono o tipo de cliente..."
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
            Todos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'activo' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('activo')}
            className={`h-8 ${
              estadoFilter === 'activo'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'hover:bg-gray-200'
            }`}
          >
            Activos
          </Button>
          <Button
            size="sm"
            variant={estadoFilter === 'inactivo' ? 'default' : 'ghost'}
            onClick={() => setEstadoFilter('inactivo')}
            className={`h-8 ${
              estadoFilter === 'inactivo'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'hover:bg-gray-200'
            }`}
          >
            Inactivos
          </Button>
        </div>

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Cliente
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
                <TableHead>Tipo Doc.</TableHead>
                <TableHead>N° Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipo Cliente</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                currentClientes.map((cliente, index) => (
                  <TableRow key={cliente.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{cliente.nombre}</TableCell>
                    <TableCell>{cliente.tipoDocumento}</TableCell>
                    <TableCell className="font-mono text-sm">{cliente.numeroDocumento}</TableCell>
                    <TableCell className="text-gray-700">{cliente.email}</TableCell>
                    <TableCell className="text-gray-700">{cliente.telefono}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {cliente.tipoCliente}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmEstado(cliente)}
                        className={`h-7 ${
                          cliente.estado === 'Activo'
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {cliente.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(cliente)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cliente)}
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

        {/* Paginación */}
        {filteredClientes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredClientes.length)} de{' '}
              {filteredClientes.length} clientes
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

      {/* Modal Ver Detalles - DISEÑO MEJORADO */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto" aria-describedby="view-cliente-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Detalles del Cliente
            </DialogTitle>
            <DialogDescription id="view-cliente-description">
              Información completa del cliente
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            <div className="space-y-4">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedCliente.nombre}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-white text-xs">
                    {selectedCliente.tipoDocumento}: {selectedCliente.numeroDocumento}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                    {selectedCliente.tipoCliente}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                    {selectedCliente.estado}
                  </Badge>
                </div>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-2 gap-3">
                {/* Contacto */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Email</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedCliente.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedCliente.telefono}</p>
                </div>

                {selectedCliente.telefonoSecundario && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                      <Label className="text-xs text-gray-500">Teléfono Secundario</Label>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedCliente.telefonoSecundario}</p>
                  </div>
                )}

                {/* Ubicación */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Ciudad</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedCliente.ciudad}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Departamento</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedCliente.departamento || 'N/A'}</p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Dirección</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedCliente.direccion}</p>
                </div>
              </div>

              {/* Notas */}
              {selectedCliente.notas && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <Label className="text-xs text-gray-600">Notas</Label>
                  </div>
                  <p className="text-sm text-gray-700">{selectedCliente.notas}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Cliente */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto" 
          aria-describedby="create-cliente-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription id="create-cliente-description">
              Completa la información del nuevo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo y Número de Documento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoDoc}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                <Input
                  id="create-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 1234567890"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="create-nombre">Nombre Completo *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Juan Pérez García"
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Email y Tipo de Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  onBlur={handleEmailBlur}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-tipo-cliente">Tipo de Cliente *</Label>
                <Select value={formTipoCliente} onValueChange={handleTipoClienteChange}>
                  <SelectTrigger id="create-tipo-cliente">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minorista">Minorista</SelectItem>
                    <SelectItem value="Mayorista">Mayorista</SelectItem>
                    <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoCliente && touched.tipoCliente && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoCliente}</p>
                )}
              </div>
            </div>

            {/* Teléfonos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-telefono">Teléfono Principal *</Label>
                <Input
                  id="create-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="300 123 4567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-telefono-sec">Teléfono Secundario (opcional)</Label>
                <Input
                  id="create-telefono-sec"
                  value={formTelefonoSecundario}
                  onChange={(e) => handleTelefonoSecundarioChange(e.target.value)}
                  placeholder="301 987 6543"
                  onBlur={handleTelefonoSecundarioBlur}
                />
                {errors.telefonoSecundario && touched.telefonoSecundario && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefonoSecundario}</p>
                )}
              </div>
            </div>

            {/* Departamento y Ciudad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-departamento">Departamento *</Label>
                <Select value={formDepartamento} onValueChange={handleDepartamentoChange}>
                  <SelectTrigger id="create-departamento">
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
                  <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>
                )}
              </div>
              <div>
                <Label htmlFor="create-ciudad">Ciudad / Municipio *</Label>
                <Select 
                  value={formCiudad} 
                  onValueChange={handleCiudadChange}
                  disabled={!formDepartamento}
                >
                  <SelectTrigger id="create-ciudad">
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
                {errors.ciudad && touched.ciudad && (
                  <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="create-direccion">Dirección *</Label>
              <Input
                id="create-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Carrera 43A # 12-34"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="create-notas">Notas (opcional)</Label>
              <Textarea
                id="create-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                placeholder="Información adicional sobre el cliente"
                rows={3}
                onBlur={handleNotasBlur}
              />
              {errors.notas && touched.notas && (
                <p className="text-red-500 text-xs mt-1">{errors.notas}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCreate} className="bg-blue-600 hover:bg-blue-700">
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto" 
          aria-describedby="edit-cliente-description"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription id="edit-cliente-description">
              Modifica la información del cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo y Número de Documento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={handleTipoDocChange}>
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoDoc && touched.tipoDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoDoc}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 1234567890"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="edit-nombre">Nombre Completo *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Juan Pérez García"
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Email y Tipo de Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  onBlur={handleEmailBlur}
                />
                {errors.email && touched.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-tipo-cliente">Tipo de Cliente *</Label>
                <Select value={formTipoCliente} onValueChange={handleTipoClienteChange}>
                  <SelectTrigger id="edit-tipo-cliente">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minorista">Minorista</SelectItem>
                    <SelectItem value="Mayorista">Mayorista</SelectItem>
                    <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoCliente && touched.tipoCliente && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipoCliente}</p>
                )}
              </div>
            </div>

            {/* Teléfonos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-telefono">Teléfono Principal *</Label>
                <Input
                  id="edit-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="300 123 4567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-telefono-sec">Teléfono Secundario (opcional)</Label>
                <Input
                  id="edit-telefono-sec"
                  value={formTelefonoSecundario}
                  onChange={(e) => handleTelefonoSecundarioChange(e.target.value)}
                  placeholder="301 987 6543"
                  onBlur={handleTelefonoSecundarioBlur}
                />
                {errors.telefonoSecundario && touched.telefonoSecundario && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefonoSecundario}</p>
                )}
              </div>
            </div>

            {/* Departamento y Ciudad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-departamento">Departamento *</Label>
                <Select value={formDepartamento} onValueChange={handleDepartamentoChange}>
                  <SelectTrigger id="edit-departamento">
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
                  <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-ciudad">Ciudad / Municipio *</Label>
                <Select 
                  value={formCiudad} 
                  onValueChange={handleCiudadChange}
                  disabled={!formDepartamento}
                >
                  <SelectTrigger id="edit-ciudad">
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
                {errors.ciudad && touched.ciudad && (
                  <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Carrera 43A # 12-34"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="edit-notas">Notas (opcional)</Label>
              <Textarea
                id="edit-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                placeholder="Información adicional sobre el cliente"
                rows={3}
                onBlur={handleNotasBlur}
              />
              {errors.notas && touched.notas && (
                <p className="text-red-500 text-xs mt-1">{errors.notas}</p>
              )}
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

      {/* Modal Eliminar Cliente */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent aria-describedby="delete-cliente-description">
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription id="delete-cliente-description">
              ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedCliente && (
            <div className="py-4">
              <p className="text-gray-700">
                Cliente: <span className="font-semibold">{selectedCliente.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {selectedCliente.tipoDocumento}: {selectedCliente.numeroDocumento}
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

      {/* Modal de Éxito */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg" aria-describedby="success-cliente-description">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>
            <DialogDescription id="success-cliente-description" className="text-center">
              El cliente ha sido creado correctamente en el sistema
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button onClick={handleSuccessModalClose} className="bg-green-600 hover:bg-green-700">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Cambio de Estado */}
      <Dialog open={showConfirmEstadoModal} onOpenChange={setShowConfirmEstadoModal}>
        <DialogContent aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Cliente</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este cliente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {clienteParaCambioEstado && (
            <div className="py-4">
              <p className="text-gray-700">
                Cliente: <span className="font-semibold">{clienteParaCambioEstado.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {clienteParaCambioEstado.tipoDocumento}: {clienteParaCambioEstado.numeroDocumento}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Estado actual: <span className="font-semibold">{clienteParaCambioEstado.estado}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmEstadoModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmEstado}>
              Cambiar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}