import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar";

import {
  Camera,
  Save,
  X,
  User,
  Mail,
  Phone,
  FileText,
  Shield,
  Lock,
  KeyRound,
} from "lucide-react";

import { toast } from "sonner";
import { UsuarioSistema } from "../../../data/usuarios-sistema";

const LS_USER_KEY = "usuario";

export default function Perfil() {
  const navigate = useNavigate();

  const initialUser = useMemo<UsuarioSistema | null>(() => {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as UsuarioSistema) : null;
    } catch {
      return null;
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(initialUser);

  // Form states
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDocumento, setEditDocumento] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Modals
  const [isConfirmSave, setIsConfirmSave] = useState(false);
  const [isConfirmReset, setIsConfirmReset] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      toast.error("No hay sesión activa. Inicia sesión nuevamente.");
      navigate("/login", { replace: true });
      return;
    }

    setEditNombre(currentUser.nombre ?? "");
    setEditApellido(currentUser.apellido ?? "");
    setEditEmail(currentUser.email ?? "");
    setEditDocumento(currentUser.documento ?? "");
    setEditTelefono(currentUser.telefono ?? "");
    setAvatarUrl(currentUser.avatarUrl ?? "");
  }, [currentUser, navigate]);

  // Sync si cambia en otro tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_USER_KEY) {
        try {
          const raw = localStorage.getItem(LS_USER_KEY);
          setCurrentUser(raw ? (JSON.parse(raw) as UsuarioSistema) : null);
        } catch {
          setCurrentUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleBack = () => navigate(-1);

  const getInitials = () => {
    const nombre = (editNombre || "U").trim();
    const apellido = (editApellido || "").trim();
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateBeforeSave = () => {
    if (!currentUser) return false;

    if (!editNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return false;
    }

    if (!editEmail.trim()) {
      toast.error("El correo electrónico es obligatorio");
      return false;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editNombre)) {
      toast.error("El nombre solo puede contener letras");
      return false;
    }

    if (editApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editApellido)) {
      toast.error("El apellido solo puede contener letras");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return false;
    }

    if (editDocumento && !/^\d+$/.test(editDocumento)) {
      toast.error("El documento solo puede contener números");
      return false;
    }

    if (editTelefono && !/^\d{10}$/.test(editTelefono)) {
      toast.error("El teléfono debe tener 10 dígitos numéricos");
      return false;
    }

    return true;
  };

  const handleSaveClick = () => {
    if (!validateBeforeSave()) return;
    setIsConfirmSave(true);
  };

  const handleConfirmSave = () => {
    if (!currentUser) return;

    const updatedUser: UsuarioSistema = {
      ...currentUser,
      nombre: editNombre,
      apellido: editApellido,
      email: editEmail,
      documento: editDocumento,
      telefono: editTelefono,
      avatarUrl: avatarUrl,
    };

    localStorage.setItem(LS_USER_KEY, JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    setIsConfirmSave(false);
    toast.success("Cambios realizados exitosamente");
  };

  const handleOpenResetDialog = () => {
    if (!editEmail.trim()) {
      toast.error("No hay correo para enviar el cambio de contraseña.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      toast.error("El correo no es válido.");
      return;
    }
    setIsConfirmReset(true);
  };

  const handleSendPasswordReset = async () => {
    try {
      setSendingReset(true);

      // ✅ Conecta aquí tu backend:
      // await authService.sendPasswordReset({ email: editEmail });

      await new Promise((r) => setTimeout(r, 700));

      toast.success(`Se envió el correo de cambio de contraseña a ${editEmail}`);
      setIsConfirmReset(false);
    } catch {
      toast.error("No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setSendingReset(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900">Mi Perfil</h1>
            <p className="text-gray-500 mt-1">Actualiza tu información personal</p>
          </div>
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <X size={18} />
            Volver
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Avatar Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
                    title="Cambiar foto"
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

                <h3 className="mt-3 text-gray-900 text-center text-lg font-semibold">
                  {editNombre} {editApellido}
                </h3>


                {/* Rol: parejo y congruente */}
                <div className="mt-4 w-full">
                  <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200">
                    <Shield size={16} />
                    <span className="text-sm font-medium">{currentUser?.rol}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">

                <Lock size={18} className="text-gray-700" />
                <h3 className="text-gray-900">Seguridad</h3>
              </div>

              <Button onClick={handleOpenResetDialog} variant="outline" className="w-full gap-2 h-11">
                <KeyRound size={18} />
                Enviar cambio de contraseña al correo
              </Button>
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
                      onChange={(e) => setEditTelefono(e.target.value.replace(/\D/g, ""))}
                      placeholder="3001234567"
                      maxLength={10}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Documento */}
                <div className="space-y-2">
                  <Label htmlFor="documento" className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    Documento de Identidad
                  </Label>
                  <Input
                    id="documento"
                    value={editDocumento}
                    onChange={(e) => setEditDocumento(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234567890"
                    maxLength={15}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button onClick={handleSaveClick} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 h-11">
                    <Save size={18} />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={handleBack} className="gap-2 h-11">
                    <X size={18} />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL CONFIRMAR GUARDADO (igual a módulos) */}
      <Dialog
        open={isConfirmSave}
        modal
        onOpenChange={(open: boolean) => {
          // no permitir cerrar por overlay/esc, solo con X o Cancelar o Confirmar
          if (!open) setIsConfirmSave(false);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar cambios</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas guardar los cambios en tu perfil? Esta acción actualizará tu información.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmSave(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmSave}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL RESET PASSWORD (igual a módulos) */}
      <Dialog
        open={isConfirmReset}
        modal
        onOpenChange={(open: boolean) => {
          if (!open && !sendingReset) setIsConfirmReset(false);
        }}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e: any) => e.preventDefault()}
          onEscapeKeyDown={(e: any) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Enviar cambio de contraseña</DialogTitle>
            <DialogDescription>
              Se enviará un enlace de cambio de contraseña al correo:{" "}
              <span className="font-semibold text-gray-900">{editEmail}</span>
              <br />
              ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmReset(false)}
              disabled={sendingReset}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendPasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
