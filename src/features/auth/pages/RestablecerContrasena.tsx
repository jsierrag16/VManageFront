import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";

import { crearContrasenaConToken } from "../services/auth.services";
import AuthLayout from "./AuthLayout";

export default function RestablecerContrasena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    contrasena: "",
    confirmacion: "",
  });

  const [touched, setTouched] = useState({
    contrasena: false,
    confirmacion: false,
  });

  const validateContrasena = (value: string) => {
    if (!value.trim()) return "La contraseña es requerida";
    if (value.length < 6) return "Mínimo 6 caracteres";
    return "";
  };

  const validateConfirmacion = (value: string) => {
    if (!value.trim()) return "Debes confirmar la contraseña";
    if (value !== contrasena) return "Las contraseñas no coinciden";
    return "";
  };

  const handleContrasenaChange = (value: string) => {
    setContrasena(value);
    if (touched.contrasena) {
      setErrors((prev) => ({ ...prev, contrasena: validateContrasena(value) }));
    }
    if (touched.confirmacion) {
      setErrors((prev) => ({
        ...prev,
        confirmacion: confirmacion ? (confirmacion === value ? "" : "Las contraseñas no coinciden") : prev.confirmacion,
      }));
    }
  };

  const handleConfirmacionChange = (value: string) => {
    setConfirmacion(value);
    if (touched.confirmacion) {
      setErrors((prev) => ({ ...prev, confirmacion: validateConfirmacion(value) }));
    }
  };

  const handleBlur = (field: "contrasena" | "confirmacion") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "contrasena") {
      setErrors((prev) => ({ ...prev, contrasena: validateContrasena(contrasena) }));
    }

    if (field === "confirmacion") {
      setErrors((prev) => ({ ...prev, confirmacion: validateConfirmacion(confirmacion) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("El enlace no es válido");
      return;
    }

    setTouched({ contrasena: true, confirmacion: true });

    const contrasenaError = validateContrasena(contrasena);
    const confirmacionError = validateConfirmacion(confirmacion);

    setErrors({
      contrasena: contrasenaError,
      confirmacion: confirmacionError,
    });

    if (contrasenaError || confirmacionError) {
      toast.error("Por favor corrige los errores");
      return;
    }

    try {
      setIsLoading(true);

      await crearContrasenaConToken({
        token,
        contrasena,
      });

      toast.success("Contraseña restablecida correctamente");
      navigate("/login");
    } catch (error: any) {
      console.error("Error restableciendo contraseña:", error);
      toast.error(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "No se pudo restablecer la contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="text-sm text-gray-600">
            Ingresa tu nueva contraseña para acceder a VetManage.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrasena">Nueva contraseña:</Label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                errors.contrasena && touched.contrasena ? "text-red-500" : "text-gray-400"
              }`}
              size={20}
            />
            <Input
              id="contrasena"
              type={showPassword ? "text" : "password"}
              placeholder="Ingrese su nueva contraseña"
              value={contrasena}
              onChange={(e) => handleContrasenaChange(e.target.value)}
              onBlur={() => handleBlur("contrasena")}
              disabled={isLoading}
              className={`h-11 pl-10 pr-10 transition-all duration-200 ${
                errors.contrasena && touched.contrasena
                  ? "border-red-500 focus-visible:ring-red-500"
                  : touched.contrasena && !errors.contrasena
                  ? "border-green-500 focus-visible:ring-green-500"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.contrasena && touched.contrasena && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {errors.contrasena}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmacion">Confirmar contraseña:</Label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                errors.confirmacion && touched.confirmacion ? "text-red-500" : "text-gray-400"
              }`}
              size={20}
            />
            <Input
              id="confirmacion"
              type={showConfirmacion ? "text" : "password"}
              placeholder="Confirme su contraseña"
              value={confirmacion}
              onChange={(e) => handleConfirmacionChange(e.target.value)}
              onBlur={() => handleBlur("confirmacion")}
              disabled={isLoading}
              className={`h-11 pl-10 pr-10 transition-all duration-200 ${
                errors.confirmacion && touched.confirmacion
                  ? "border-red-500 focus-visible:ring-red-500"
                  : touched.confirmacion && !errors.confirmacion
                  ? "border-green-500 focus-visible:ring-green-500"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmacion(!showConfirmacion)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showConfirmacion ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmacion && touched.confirmacion && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {errors.confirmacion}
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Guardando...
            </span>
          ) : (
            "Guardar nueva contraseña"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}