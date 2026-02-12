import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Plus, CheckCircle, Truck, Mail, MapPin, User, FileText, Phone, Building2 } from 'lucide-react';
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
import { proveedoresData as initialProveedoresData, Proveedor } from '../../../data/proveedores';

interface ProveedoresProps {
  triggerCreate?: number;
  selectedBodega?: string;
}

// Categorías disponibles en el sistema
const CATEGORIAS_PROVEEDOR = [
  'Medicamentos',
  'Equipos Médicos',
  'Material de Curación',
  'Alimentos',
  'Suplementos',
  'Insumos Veterinarios',
  'Otros'
] as const;

// Países disponibles
const PAISES = [
  'Colombia',
  'Argentina',
  'Brasil',
  'Chile',
  'Ecuador',
  'México',
  'Perú',
  'Venezuela',
  'Estados Unidos',
  'España',
  'Otro'
] as const;

// Ciudades principales de Colombia
const CIUDADES_COLOMBIA = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Cúcuta',
  'Bucaramanga',
  'Pereira',
  'Santa Marta',
  'Ibagué',
  'Pasto',
  'Manizales',
  'Neiva',
  'Villavicencio',
  'Armenia',
  'Valledupar',
  'Montería',
  'Popayán',
  'Sincelejo',
  'Tunja',
  'Otra'
] as const;

export default function Proveedores({ triggerCreate, selectedBodega = 'Bodega Principal' }: ProveedoresProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedoresData);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmEstadoModal, setShowConfirmEstadoModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [proveedorParaCambioEstado, setProveedorParaCambioEstado] = useState<Proveedor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [formTipoDoc, setFormTipoDoc] = useState('NIT');
  const [formNumeroDoc, setFormNumeroDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formPais, setFormPais] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formNotas, setFormNotas] = useState('');

  // Estados para validaciones en tiempo real
  const [errors, setErrors] = useState({
    tipoDoc: '',
    numeroDoc: '',
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    categoria: '',
    contacto: '',
    notas: ''
  });
  const [touched, setTouched] = useState({
    tipoDoc: false,
    numeroDoc: false,
    nombre: false,
    email: false,
    telefono: false,
    direccion: false,
    ciudad: false,
    pais: false,
    categoria: false,
    contacto: false,
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
      return 'El nombre del proveedor es requerido';
    }
    // Permitir letras, números, espacios, puntos y guiones
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.\-&]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números, espacios, puntos, guiones y &';
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

  const validateCiudad = (value: string) => {
    if (!value || value === '') {
      return 'La ciudad es requerida';
    }
    return '';
  };

  const validatePais = (value: string) => {
    if (!value.trim()) {
      return 'El país es requerido';
    }
    // Solo letras y espacios
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras y espacios';
    }
    if (value.trim().length < 3) {
      return 'Mínimo 3 caracteres';
    }
    if (value.trim().length > 50) {
      return 'Máximo 50 caracteres';
    }
    return '';
  };

  const validateCategoria = (value: string) => {
    if (!value.trim()) {
      return 'La categoría es requerida';
    }
    // Permitir letras, números y espacios
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
    if (!validPattern.test(value)) {
      return 'Solo se permiten letras, números y espacios';
    }
    if (value.trim().length < 3) {
      return 'Mínimo 3 caracteres';
    }
    if (value.trim().length > 50) {
      return 'Máximo 50 caracteres';
    }
    return '';
  };

  const validateContacto = (value: string) => {
    if (!value.trim()) {
      return 'El nombre del contacto es requerido';
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

  const handleDireccionChange = (value: string) => {
    setFormDireccion(value);
    if (touched.direccion) {
      setErrors({ ...errors, direccion: validateDireccion(value) });
    }
  };

  const handleCiudadChange = (value: string) => {
    setFormCiudad(value);
    if (touched.ciudad) {
      setErrors({ ...errors, ciudad: validateCiudad(value) });
    }
  };

  const handlePaisChange = (value: string) => {
    setFormPais(value);
    if (touched.pais) {
      setErrors({ ...errors, pais: validatePais(value) });
    }
  };

  const handleCategoriaChange = (value: string) => {
    setFormCategoria(value);
    if (touched.categoria) {
      setErrors({ ...errors, categoria: validateCategoria(value) });
    }
  };

  const handleContactoChange = (value: string) => {
    setFormContacto(value);
    if (touched.contacto) {
      setErrors({ ...errors, contacto: validateContacto(value) });
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

  const handleDireccionBlur = () => {
    setTouched({ ...touched, direccion: true });
    setErrors({ ...errors, direccion: validateDireccion(formDireccion) });
  };

  const handleCiudadBlur = () => {
    setTouched({ ...touched, ciudad: true });
    setErrors({ ...errors, ciudad: validateCiudad(formCiudad) });
  };

  const handlePaisBlur = () => {
    setTouched({ ...touched, pais: true });
    setErrors({ ...errors, pais: validatePais(formPais) });
  };

  const handleCategoriaBlur = () => {
    setTouched({ ...touched, categoria: true });
    setErrors({ ...errors, categoria: validateCategoria(formCategoria) });
  };

  const handleContactoBlur = () => {
    setTouched({ ...touched, contacto: true });
    setErrors({ ...errors, contacto: validateContacto(formContacto) });
  };

  const handleNotasBlur = () => {
    setTouched({ ...touched, notas: true });
    setErrors({ ...errors, notas: validateNotas(formNotas) });
  };

  // Filtrar proveedores - por bodega Y por búsqueda
  const filteredProveedores = useMemo(() => {
    return proveedores
      .filter((proveedor) => {
        // Si es "Todas las bodegas", no filtrar por bodega
        if (selectedBodega === 'Todas las bodegas') {
          return true;
        }
        return proveedor.bodega === selectedBodega;
      })
      .filter((proveedor) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          proveedor.id.toLowerCase().includes(searchLower) ||
          proveedor.nombre.toLowerCase().includes(searchLower) ||
          proveedor.tipoDocumento.toLowerCase().includes(searchLower) ||
          proveedor.numeroDocumento.toLowerCase().includes(searchLower) ||
          proveedor.email.toLowerCase().includes(searchLower) ||
          proveedor.telefono.toLowerCase().includes(searchLower) ||
          proveedor.categoria.toLowerCase().includes(searchLower) ||
          proveedor.estado.toLowerCase().includes(searchLower)
        );
      });
  }, [proveedores, searchTerm, selectedBodega]);

  // Paginación
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProveedores = filteredProveedores.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Función para cambiar el estado del proveedor directamente desde la tabla
  const handleToggleEstado = (proveedor: Proveedor) => {
    setProveedorParaCambioEstado(proveedor);
    setShowConfirmEstadoModal(true);
  };

  const handleConfirmEstado = () => {
    if (proveedorParaCambioEstado) {
      const nuevoEstado = proveedorParaCambioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo';
      setProveedores(
        proveedores.map((p) =>
          p.id === proveedorParaCambioEstado.id ? { ...p, estado: nuevoEstado } : p
        )
      );
      toast.success(
        `Proveedor ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`
      );
      setShowConfirmEstadoModal(false);
      setProveedorParaCambioEstado(null);
    }
  };

  const handleView = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowViewModal(true);
  };

  const handleCreate = () => {
    setFormTipoDoc('NIT');
    setFormNumeroDoc('');
    setFormNombre('');
    setFormEmail('');
    setFormTelefono('');
    setFormDireccion('');
    setFormCiudad('');
    setFormPais('');
    setFormCategoria('');
    setFormContacto('');
    setFormNotas('');
    setErrors({
      tipoDoc: '',
      numeroDoc: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      pais: '',
      categoria: '',
      contacto: '',
      notas: ''
    });
    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      ciudad: false,
      pais: false,
      categoria: false,
      contacto: false,
      notas: false
    });
    setShowCreateModal(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setFormTipoDoc(proveedor.tipoDocumento);
    setFormNumeroDoc(proveedor.numeroDocumento);
    setFormNombre(proveedor.nombre);
    setFormEmail(proveedor.email);
    setFormTelefono(proveedor.telefono);
    setFormDireccion(proveedor.direccion);
    setFormCiudad(proveedor.ciudad);
    setFormPais(proveedor.pais);
    setFormCategoria(proveedor.categoria);
    setFormContacto(proveedor.contacto);
    setFormNotas(proveedor.notas || '');
    setErrors({
      tipoDoc: '',
      numeroDoc: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      pais: '',
      categoria: '',
      contacto: '',
      notas: ''
    });
    setTouched({
      tipoDoc: false,
      numeroDoc: false,
      nombre: false,
      email: false,
      telefono: false,
      direccion: false,
      ciudad: false,
      pais: false,
      categoria: false,
      contacto: false,
      notas: false
    });
    setShowEditModal(true);
  };

  const handleDelete = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    // Validar campos obligatorios
    if (!formTipoDoc || !formNumeroDoc.trim() || !formNombre.trim() || !formEmail.trim() || 
        !formTelefono.trim() || !formDireccion.trim() || !formCiudad.trim() || 
        !formPais.trim() || !formCategoria.trim() || !formContacto.trim()) {
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

    // Validar teléfono (solo números, espacios, guiones y paréntesis)
    if (!/^[0-9\s\-()]+$/.test(formTelefono)) {
      toast.error('El teléfono solo debe contener números, espacios, guiones y paréntesis');
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

    const newProveedor: Proveedor = {
      id: `PROV-${String(proveedores.length + 1).padStart(3, '0')}`,
      tipoDocumento: formTipoDoc,
      numeroDocumento: formNumeroDoc.trim(),
      nombre: formNombre.trim(),
      email: formEmail.trim(),
      telefono: formTelefono.trim(),
      direccion: formDireccion.trim(),
      ciudad: formCiudad.trim(),
      departamento: '',
      pais: formPais.trim(),
      categoria: formCategoria.trim(),
      contacto: formContacto.trim(),
      notas: formNotas.trim(),
      estado: 'Activo',
      fechaRegistro: new Date().toISOString().split('T')[0],
      bodega: selectedBodega,
    };

    setProveedores([...proveedores, newProveedor]);
    setShowCreateModal(false);
    setShowSuccessModal(true);
  };

  const confirmEdit = () => {
    if (!selectedProveedor || !validateForm()) return;

    setProveedores(
      proveedores.map((p) =>
        p.id === selectedProveedor.id
          ? {
              ...p,
              tipoDocumento: formTipoDoc,
              numeroDocumento: formNumeroDoc.trim(),
              nombre: formNombre.trim(),
              email: formEmail.trim(),
              telefono: formTelefono.trim(),
              direccion: formDireccion.trim(),
              ciudad: formCiudad.trim(),
              pais: formPais.trim(),
              categoria: formCategoria.trim(),
              contacto: formContacto.trim(),
              notas: formNotas.trim(),
            }
          : p
      )
    );
    setShowEditModal(false);
    toast.success('Proveedor actualizado exitosamente');
  };

  const confirmDelete = () => {
    setProveedores(proveedores.filter((p) => p.id !== selectedProveedor?.id));
    setShowDeleteModal(false);
    toast.success('Proveedor eliminado exitosamente');
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
        <h2 className="text-gray-900">Gestión de Proveedores</h2>
        <p className="text-gray-600 mt-1">
          Administra la información de tus proveedores
        </p>
      </div>

      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por nombre, documento, email, categoría o estado (Activo/Inactivo)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Nuevo Proveedor
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
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No se encontraron proveedores
                  </TableCell>
                </TableRow>
              ) : (
                currentProveedores.map((proveedor, index) => (
                  <TableRow key={proveedor.id} className="hover:bg-gray-50">
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.tipoDocumento}</TableCell>
                    <TableCell className="font-mono text-sm">{proveedor.numeroDocumento}</TableCell>
                    <TableCell className="text-gray-700">{proveedor.email}</TableCell>
                    <TableCell className="text-gray-700">{proveedor.telefono}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {proveedor.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleEstado(proveedor)}
                        className={`h-7 ${
                          proveedor.estado === 'Activo'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {proveedor.estado}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(proveedor)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(proveedor)}
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(proveedor)}
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
        {filteredProveedores.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProveedores.length)} de{' '}
              {filteredProveedores.length} proveedores
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

      {/* Modal Ver Detalles */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto" aria-describedby="view-proveedor-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Detalles del Proveedor
            </DialogTitle>
            <DialogDescription id="view-proveedor-description">
              Información completa del proveedor
            </DialogDescription>
          </DialogHeader>
          {selectedProveedor && (
            <div className="space-y-4">
              {/* Información Principal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProveedor.nombre}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-white text-xs">
                    {selectedProveedor.tipoDocumento}: {selectedProveedor.numeroDocumento}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">
                    {selectedProveedor.categoria}
                  </Badge>
                  <Badge
                    className={
                      selectedProveedor.estado === 'Activo'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 text-xs'
                        : 'bg-red-100 text-red-800 hover:bg-red-100 text-xs'
                    }
                  >
                    {selectedProveedor.estado}
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
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Teléfono</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.telefono}</p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Contacto Principal</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.contacto}</p>
                </div>

                {/* Ubicación */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Ciudad</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.ciudad}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Departamento</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.departamento || 'N/A'}</p>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <Label className="text-xs text-gray-500">Dirección</Label>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedProveedor.direccion}</p>
                </div>
              </div>

              {/* Notas */}
              {selectedProveedor.notas && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                    <Label className="text-xs text-gray-600">Notas</Label>
                  </div>
                  <p className="text-sm text-gray-700">{selectedProveedor.notas}</p>
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

      {/* Modal Crear Proveedor */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="create-proveedor-description">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription id="create-proveedor-description">
              Completa la información del nuevo proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={setFormTipoDoc}>
                  <SelectTrigger id="create-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-numero-doc">N° de Documento *</Label>
                <Input
                  id="create-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 900123456-7"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="create-nombre">Nombre o Razón Social *</Label>
              <Input
                id="create-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Distribuciones Médicas S.A.S."
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
              )}
            </div>
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
                <Label htmlFor="create-telefono">Teléfono *</Label>
                <Input
                  id="create-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="(601) 123-4567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-ciudad">Ciudad *</Label>
                <Select value={formCiudad} onValueChange={setFormCiudad}>
                  <SelectTrigger id="create-ciudad">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-pais">País *</Label>
                <Select value={formPais} onValueChange={setFormPais}>
                  <SelectTrigger id="create-pais">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-categoria">Categoría *</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger id="create-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-contacto">Contacto Principal *</Label>
                <Input
                  id="create-contacto"
                  value={formContacto}
                  onChange={(e) => handleContactoChange(e.target.value)}
                  placeholder="Nombre del contacto principal"
                  onBlur={handleContactoBlur}
                />
                {errors.contacto && touched.contacto && (
                  <p className="text-red-500 text-xs mt-1">{errors.contacto}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="create-direccion">Dirección *</Label>
              <Input
                id="create-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Calle 123 # 45-67"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-notas">Notas (opcional)</Label>
              <Textarea
                id="create-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                placeholder="Información adicional sobre el proveedor"
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
              Crear Proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Proveedor */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-proveedor-description">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription id="edit-proveedor-description">
              Modifica la información del proveedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo-doc">Tipo de Documento *</Label>
                <Select value={formTipoDoc} onValueChange={setFormTipoDoc}>
                  <SelectTrigger id="edit-tipo-doc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-numero-doc">N° de Documento *</Label>
                <Input
                  id="edit-numero-doc"
                  value={formNumeroDoc}
                  onChange={(e) => handleNumeroDocChange(e.target.value)}
                  placeholder="Ej: 900123456-7"
                  onBlur={handleNumeroDocBlur}
                />
                {errors.numeroDoc && touched.numeroDoc && (
                  <p className="text-red-500 text-xs mt-1">{errors.numeroDoc}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-nombre">Nombre o Razón Social *</Label>
              <Input
                id="edit-nombre"
                value={formNombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Distribuciones Médicas S.A.S."
                onBlur={handleNombreBlur}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
              )}
            </div>
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
                <Label htmlFor="edit-telefono">Teléfono *</Label>
                <Input
                  id="edit-telefono"
                  value={formTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="(601) 123-4567"
                  onBlur={handleTelefonoBlur}
                />
                {errors.telefono && touched.telefono && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ciudad">Ciudad *</Label>
                <Select value={formCiudad} onValueChange={setFormCiudad}>
                  <SelectTrigger id="edit-ciudad">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_COLOMBIA.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-pais">País *</Label>
                <Select value={formPais} onValueChange={setFormPais}>
                  <SelectTrigger id="edit-pais">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-categoria">Categoría *</Label>
                <Select value={formCategoria} onValueChange={setFormCategoria}>
                  <SelectTrigger id="edit-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-contacto">Contacto Principal *</Label>
                <Input
                  id="edit-contacto"
                  value={formContacto}
                  onChange={(e) => handleContactoChange(e.target.value)}
                  placeholder="Nombre del contacto principal"
                  onBlur={handleContactoBlur}
                />
                {errors.contacto && touched.contacto && (
                  <p className="text-red-500 text-xs mt-1">{errors.contacto}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                value={formDireccion}
                onChange={(e) => handleDireccionChange(e.target.value)}
                placeholder="Ej: Calle 123 # 45-67"
                onBlur={handleDireccionBlur}
              />
              {errors.direccion && touched.direccion && (
                <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-notas">Notas (opcional)</Label>
              <Textarea
                id="edit-notas"
                value={formNotas}
                onChange={(e) => handleNotasChange(e.target.value)}
                placeholder="Información adicional sobre el proveedor"
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

      {/* Modal Eliminar Proveedor */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent aria-describedby="delete-proveedor-description">
          <DialogHeader>
            <DialogTitle>Eliminar Proveedor</DialogTitle>
            <DialogDescription id="delete-proveedor-description">
              ¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedProveedor && (
            <div className="py-4">
              <p className="text-gray-700">
                Proveedor: <span className="font-semibold">{selectedProveedor.nombre}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {selectedProveedor.tipoDocumento}: {selectedProveedor.numeroDocumento}
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
        <DialogContent className="max-w-lg" aria-describedby="confirm-estado-description">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription id="confirm-estado-description">
              ¿Estás seguro de que deseas cambiar el estado de este proveedor?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Proveedor:</span>
              <span className="font-medium">{proveedorParaCambioEstado?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estado Actual:</span>
              <span className={`font-medium ${proveedorParaCambioEstado?.estado === 'Activo' ? 'text-green-700' : 'text-red-700'}`}>
                {proveedorParaCambioEstado?.estado}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nuevo Estado:</span>
              <span className={`font-medium ${proveedorParaCambioEstado?.estado === 'Inactivo' ? 'text-green-700' : 'text-red-700'}`}>
                {proveedorParaCambioEstado?.estado === 'Activo' ? 'Inactivo' : 'Activo'}
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
        <DialogContent className="max-w-lg" aria-describedby="success-proveedor-description">
          <DialogHeader>
            <DialogTitle className="sr-only">Registro Exitoso</DialogTitle>
            <DialogDescription id="success-proveedor-description" className="sr-only">
              El proveedor se ha registrado correctamente
            </DialogDescription>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">¡Registro Exitoso!</DialogTitle>
            <DialogDescription className="text-center">
              El proveedor ha sido creado correctamente en el sistema
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