import React, { useEffect, useState } from "react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";

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
  CalendarDays,
} from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "../../../shared/context/AuthContext";
import { authUserToUsuarioSistema } from "../../auth/services/auth.mapper";
import {
  getMiPerfil,
  actualizarMiPerfil,
  subirFotoMiPerfil,
  solicitarRestablecimientoContrasena,
} from "../../auth/services/auth.services";
import { getGenerosCatalogo } from "../../usuarios/services/usuarios-catalogos.service";

const LS_USER_KEY = "usuario";

type OpcionCatalogo = {
  id: number;
  nombre: string;
};

type MiPerfilResponse = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  num_documento: string;
  fecha_nacimiento?: string | null;
  img_url?: string | null;
  id_genero?: number | null;
  genero?: {
    id_genero: number;
    nombre_genero: string;
  } | null;
  roles?: {
    id_rol: number;
    nombre_rol: string;
  } | null;
  tipo_documento?: {
    id_tipo_doc: number;
    nombre_doc: string;
  } | null;
  bodegas?: Array<{
    id_bodega: number;
    nombre_bodega: string;
  }>;
  permisos?: any[];
  estado?: boolean;
};

export default function Perfil() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [currentUser, setCurrentUser] = useState<MiPerfilResponse | null>(null);
  const [generos, setGeneros] = useState<OpcionCatalogo[]>([]);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingGeneros, setLoadingGeneros] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editFechaNacimiento, setEditFechaNacimiento] = useState("");
  const [editGeneroId, setEditGeneroId] = useState<number | "">("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [isConfirmSave, setIsConfirmSave] = useState(false);
  const [isConfirmReset, setIsConfirmReset] = useState(false);

  const hydrateForm = (user: MiPerfilResponse) => {
    setEditNombre(user.nombre ?? "");
    setEditApellido(user.apellido ?? "");
    setEditTelefono(user.telefono ?? "");
    setEditFechaNacimiento(user.fecha_nacimiento ? String(user.fecha_nacimiento).slice(0, 10) : "");
    setEditGeneroId(user.id_genero ?? "");
    setAvatarUrl(user.img_url ?? "");
    setSelectedAvatarFile(null);
  };

  const persistUserSession = (user: MiPerfilResponse) => {
    try {
      const mapped = authUserToUsuarioSistema(user);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(mapped));
      auth.setUsuario(mapped);
    } catch {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
      auth.setUsuario(user as any);
    }
  };

  useEffect(() => {
    const loadPerfil = async () => {
      try {
        setLoadingPerfil(true);
        const user = await getMiPerfil();
        setCurrentUser(user);
        hydrateForm(user);
        persistUserSession(user);
      } catch (error) {
        console.error("Error cargando perfil:", error);
        toast.error("No se pudo cargar tu perfil. Inicia sesión nuevamente.");
        navigate("/login", { replace: true });
      } finally {
        setLoadingPerfil(false);
      }
    };

    void loadPerfil();
  }, [navigate]);

  useEffect(() => {
    const loadGeneros = async () => {
      try {
        setLoadingGeneros(true);
        const data = await getGenerosCatalogo();
        setGeneros(data);
      } catch (error) {
        console.error("Error cargando géneros:", error);
        toast.error("No se pudo cargar el catálogo de géneros");
      } finally {
        setLoadingGeneros(false);
      }
    };

    void loadGeneros();
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

    setSelectedAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  const validateBeforeSave = () => {
    if (!editNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return false;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editNombre.trim())) {
      toast.error("El nombre solo puede contener letras");
      return false;
    }

    if (editApellido.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editApellido.trim())) {
      toast.error("El apellido solo puede contener letras");
      return false;
    }

    if (editTelefono.trim() && !/^\d{10}$/.test(editTelefono.trim())) {
      toast.error("El teléfono debe tener 10 dígitos numéricos");
      return false;
    }

    return true;
  };

  const handleSaveClick = () => {
    if (!validateBeforeSave()) return;
    setIsConfirmSave(true);
  };

  const handleConfirmSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);

      const updatedProfile = await actualizarMiPerfil({
        nombre: editNombre.trim(),
        apellido: editApellido.trim(),
        telefono: editTelefono.trim() || undefined,
        fecha_nacimiento: editFechaNacimiento || undefined,
        id_genero: editGeneroId === "" ? undefined : Number(editGeneroId),
      });

      let finalUser = updatedProfile;

      if (selectedAvatarFile) {
        finalUser = await subirFotoMiPerfil(selectedAvatarFile);
      }

      setCurrentUser(finalUser);
      hydrateForm(finalUser);
      persistUserSession(finalUser);

      setIsConfirmSave(false);
      toast.success("Cambios realizados exitosamente");
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "No se pudieron guardar los cambios"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenResetDialog = () => {
    const email = currentUser?.email?.trim() ?? "";
    if (!email) {
      toast.error("No hay correo para enviar el cambio de contraseña.");
      return;
    }
    setIsConfirmReset(true);
  };

  const handleSendPasswordReset = async () => {
    try {
      if (!currentUser?.email) {
        toast.error("No hay correo disponible");
        return;
      }

      setSendingReset(true);
      await solicitarRestablecimientoContrasena(currentUser.email);

      toast.success(
        `Si el correo existe, se generó el enlace de restablecimiento para ${currentUser.email}`
      );
      setIsConfirmReset(false);
    } catch (error) {
      console.error("Error enviando restablecimiento:", error);
      toast.error("No se pudo generar el enlace. Intenta de nuevo.");
    } finally {
      setSendingReset(false);
    }
  };

  if (loadingPerfil) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 p-1">
        <div className="max-w-7xl mx-auto py-10 text-gray-500">
          Cargando perfil...
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarUrl || undefined} />
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
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <h3 className="mt-3 text-gray-900 text-center text-lg font-semibold">
                  {editNombre} {editApellido}
                </h3>

                <div className="mt-4 w-full">
                  <div className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200">
                    <Shield size={16} />
                    <span className="text-sm font-medium">
                      {currentUser.roles?.nombre_rol ?? "Sin rol"}
                    </span>
                  </div>
                </div>

                {Array.isArray(currentUser.bodegas) && currentUser.bodegas.length > 0 && (
                  <div className="mt-4 w-full">
                    <p className="text-xs text-gray-500 mb-2 text-center">Bodegas asignadas</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {currentUser.bodegas.map((bodega) => (
                        <span
                          key={bodega.id_bodega}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {bodega.nombre_bodega}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Lock size={18} className="text-gray-700" />
                <h3 className="text-gray-900">Seguridad</h3>
              </div>

              <Button
                onClick={handleOpenResetDialog}
                variant="outline"
                className="w-full gap-2 h-11"
              >
                <KeyRound size={18} />
                Enviar cambio de contraseña al correo
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Información Personal</h3>

              <div className="space-y-6">
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
                      maxLength={100}
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
                      maxLength={100}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentUser.email ?? ""}
                      disabled
                      className="bg-gray-50 border-gray-300 text-gray-500"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-doc" className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      Tipo de Documento
                    </Label>
                    <Input
                      id="tipo-doc"
                      value={currentUser.tipo_documento?.nombre_doc ?? ""}
                      disabled
                      className="bg-gray-50 border-gray-300 text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documento" className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      Documento de Identidad
                    </Label>
                    <Input
                      id="documento"
                      value={currentUser.num_documento ?? ""}
                      disabled
                      className="bg-gray-50 border-gray-300 text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-nacimiento" className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-gray-400" />
                      Fecha de nacimiento
                    </Label>
                    <Input
                      id="fecha-nacimiento"
                      type="date"
                      value={editFechaNacimiento}
                      onChange={(e) => setEditFechaNacimiento(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero" className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Género
                    </Label>
                    <select
                      id="genero"
                      value={editGeneroId === "" ? "" : String(editGeneroId)}
                      onChange={(e) =>
                        setEditGeneroId(e.target.value ? Number(e.target.value) : "")
                      }
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingGeneros}
                    >
                      <option value="">Selecciona</option>
                      {generos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSaveClick}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 h-11"
                    disabled={saving}
                  >
                    <Save size={18} />
                    {saving ? "Guardando..." : "Guardar Cambios"}
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

      <Dialog
        open={isConfirmSave}
        modal
        onOpenChange={(open: boolean) => {
          if (!open && !saving) setIsConfirmSave(false);
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
              ¿Estás seguro de que deseas guardar los cambios en tu perfil?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmSave(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <span className="font-semibold text-gray-900">{currentUser.email}</span>
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