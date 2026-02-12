import { useState } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../shared/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../shared/components/ui/avatar';
import { Camera, Save, X, User, Mail, Phone, MapPin, Calendar, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { UsuarioSistema } from '../../../data/usuarios-sistema';

interface PerfilProps {
  currentUser: UsuarioSistema;
  onBack: () => void;
  onUserUpdate?: (user: UsuarioSistema) => void;
}

export default function Perfil({ currentUser, onBack, onUserUpdate }: PerfilProps) {
  // Estados del formulario
  const [editNombre, setEditNombre] = useState(currentUser?.nombre || '');
  const [editApellido, setEditApellido] = useState(currentUser?.apellido || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editDocumento, setEditDocumento] = useState(currentUser?.documento || '');
  const [editTelefono, setEditTelefono] = useState(currentUser?.telefono || '');
  const [editDireccion, setEditDireccion] = useState(currentUser?.direccion || '');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState(currentUser?.fechaNacimiento || '');
  const [editGenero, setEditGenero] = useState(currentUser?.genero || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }

      // Crear URL temporal para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    // Validar campos obligatorios
    if (!editNombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!editEmail.trim()) {
      toast.error('El correo electrónico es obligatorio');
      return;
    }

    // Validar nombre (solo letras y espacios)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editNombre)) {
      toast.error('El nombre solo puede contener letras');
      return;
    }

    // Validar apellido si se ingresó
    if (editApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editApellido)) {
      toast.error('El apellido solo puede contener letras');
      return;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    // Validar documento si se ingresó (solo números)
    if (editDocumento && !/^\d+$/.test(editDocumento)) {
      toast.error('El documento solo puede contener números');
      return;
    }

    // Validar teléfono si se ingresó (solo números, 10 dígitos)
    if (editTelefono && !/^\d{10}$/.test(editTelefono)) {
      toast.error('El teléfono debe tener 10 dígitos numéricos');
      return;
    }

    // Mostrar diálogo de confirmación
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    // Actualizar usuario con los nuevos datos
    const updatedUser = {
      ...currentUser,
      nombre: editNombre,
      apellido: editApellido,
      email: editEmail,
      documento: editDocumento,
      telefono: editTelefono,
      direccion: editDireccion,
      fechaNacimiento: editFechaNacimiento,
      genero: editGenero,
      bio: editBio,
      avatarUrl: avatarUrl,
    };

    // Actualizar localStorage
    localStorage.setItem('usuario', JSON.stringify(updatedUser));

    // Actualizar el estado en el componente padre
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }

    // Cerrar diálogo
    setShowConfirmDialog(false);

    // Mostrar mensaje de éxito
    toast.success('Cambios realizados exitosamente');
  };

  const getInitials = () => {
    const nombre = editNombre || 'U';
    const apellido = editApellido || '';
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">Mi Perfil</h1>
            <p className="text-gray-500 mt-1">Actualiza tu información personal</p>
          </div>
          <Button variant="outline" onClick={onBack} className="gap-2">
            <X size={18} />
            Volver
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
                  >
                    <Camera size={18} />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <h3 className="mt-4 text-gray-900">
                  {editNombre} {editApellido}
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                  <Shield size={14} />
                  <span className="text-sm">{currentUser?.rol}</span>
                </div>
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4">Información Rápida</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Mail size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Correo electrónico</p>
                    <p className="text-gray-900">{editEmail || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Phone size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Teléfono</p>
                    <p className="text-gray-900">{editTelefono || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FileText size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Documento</p>
                    <p className="text-gray-900">{editDocumento || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Dirección</p>
                    <p className="text-gray-900">{editDireccion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Información Personal</h3>

              <div className="space-y-6">
                {/* Nombres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Nombre *
                    </Label>
                    <Input
                      id="nombre"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      placeholder="Ingresa tu nombre"
                      maxLength={50}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Apellido
                    </Label>
                    <Input
                      id="apellido"
                      value={editApellido}
                      onChange={(e) => setEditApellido(e.target.value)}
                      placeholder="Ingresa tu apellido"
                      maxLength={50}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      Correo Electrónico *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value.replace(/\D/g, ''))}
                      placeholder="3001234567"
                      maxLength={10}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Documento y Género */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documento" className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      Documento de Identidad
                    </Label>
                    <Input
                      id="documento"
                      value={editDocumento}
                      onChange={(e) => setEditDocumento(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234567890"
                      maxLength={15}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero" className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Género
                    </Label>
                    <Select value={editGenero} onValueChange={setEditGenero}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Selecciona tu género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="prefiero-no-decir">Prefiero no decir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fecha de Nacimiento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento" className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      Fecha de Nacimiento
                    </Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={editFechaNacimiento}
                      onChange={(e) => setEditFechaNacimiento(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="direccion" className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    placeholder="Calle 123 #45-67, Bogotá"
                    maxLength={100}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Biografía */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    Biografía / Descripción
                  </Label>
                  <Textarea
                    id="bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Cuéntanos un poco sobre ti..."
                    rows={4}
                    maxLength={500}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {editBio.length}/500 caracteres
                  </p>
                </div>

                {/* Información del Rol */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-blue-900">Información del Sistema</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Rol:</strong> {currentUser?.rol}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        Los permisos y el rol son asignados por el administrador del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSaveClick}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save size={18} />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={onBack} className="gap-2">
                    <X size={18} />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de realizar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Se actualizará tu información personal con los nuevos datos ingresados. Esta acción guardará los cambios de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="bg-blue-600 hover:bg-blue-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
